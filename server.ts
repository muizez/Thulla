import http from 'node:http';
import path from 'node:path';
import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import { db } from './server/db';
import { gameManager } from './server/gameManager';
import type { UserProfile } from './src/game/types';

const PORT = Number(process.env.PORT) || 3000;

interface AuthedRequest extends Request {
  user?: UserProfile;
  authToken?: string;
}

function extractToken(req: Request): string {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  const cookieToken = req.headers['x-auth-token'];
  if (typeof cookieToken === 'string') return cookieToken.trim();
  return '';
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  const user = db.getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  req.user = user;
  req.authToken = token;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'thulla-card-game' });
  });

  // --- Authentication Endpoints ---
  app.post('/api/auth/register', (req, res) => {
    const { username, email, password, avatar } = req.body ?? {};
    const result = db.registerUser({
      username: typeof username === 'string' ? username : '',
      email: typeof email === 'string' ? email : '',
      password: typeof password === 'string' ? password : '',
      avatar: typeof avatar === 'string' ? avatar : 'ace',
    });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ user: result.user, token: result.token });
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, email, username, password } = req.body ?? {};
    const ident =
      typeof identifier === 'string'
        ? identifier
        : typeof email === 'string'
          ? email
          : typeof username === 'string'
            ? username
            : '';
    const result = db.loginUser({
      identifier: ident,
      password: typeof password === 'string' ? password : '',
    });
    if (!result.ok) {
      res.status(401).json({ error: result.error });
      return;
    }
    res.json({ user: result.user, token: result.token });
  });

  app.post('/api/auth/guest', (req, res) => {
    const { username, avatar } = req.body ?? {};
    const result = db.createGuestUser({
      username: typeof username === 'string' ? username : 'HostelGuest',
      avatar: typeof avatar === 'string' ? avatar : 'chai',
    });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ user: result.user, token: result.token });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractToken(req);
    if (token) db.deleteSessionToken(token);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: req.user });
  });

  app.patch('/api/auth/profile', requireAuth, (req: AuthedRequest, res) => {
    const { username, avatar } = req.body ?? {};
    const result = db.updateUserProfile(req.user!.id, { username, avatar });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ user: result.user });
  });

  // --- Room Endpoints ---
  app.get('/api/rooms', (_req, res) => {
    res.json({ rooms: gameManager.getPublicRooms() });
  });

  app.post('/api/rooms', requireAuth, (req: AuthedRequest, res) => {
    const state = gameManager.createRoom(req.user!, req.body ?? {});
    res.status(201).json({ room: state });
  });

  app.post('/api/rooms/matchmake', requireAuth, (req: AuthedRequest, res) => {
    const state = gameManager.matchmakeOnline(req.user!);
    res.json({ room: state });
  });

  app.get('/api/rooms/:roomCode', requireAuth, (req: AuthedRequest, res) => {
    const state = gameManager.getPublicStateByCode(req.params.roomCode, req.user!.id);
    if (!state) {
      res.status(404).json({ error: 'Room not found.' });
      return;
    }
    res.json({ room: state });
  });

  app.post('/api/rooms/:roomCode/join', requireAuth, (req: AuthedRequest, res) => {
    const result = gameManager.joinRoom(req.params.roomCode, req.user!);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ room: result.state });
  });

  app.post('/api/rooms/:roomCode/leave', requireAuth, (req: AuthedRequest, res) => {
    const result = gameManager.leaveRoom(req.params.roomCode, req.user!.id);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json(result);
  });

  app.post('/api/rooms/:roomCode/ready', requireAuth, (req: AuthedRequest, res) => {
    const { isReady } = req.body ?? {};
    const result = gameManager.toggleReady(
      req.params.roomCode,
      req.user!.id,
      typeof isReady === 'boolean' ? isReady : undefined
    );
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ room: result.state });
  });

  app.post('/api/rooms/:roomCode/rules', requireAuth, (req: AuthedRequest, res) => {
    const result = gameManager.updateRoomSettings(
      req.params.roomCode,
      req.user!.id,
      req.body ?? {}
    );
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ room: result.state });
  });

  app.post('/api/rooms/:roomCode/kick', requireAuth, (req: AuthedRequest, res) => {
    const { playerId } = req.body ?? {};
    const result = gameManager.kickPlayer(
      req.params.roomCode,
      req.user!.id,
      typeof playerId === 'string' ? playerId : ''
    );
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ room: result.state });
  });

  app.post('/api/rooms/:roomCode/close', requireAuth, (req: AuthedRequest, res) => {
    const result = gameManager.closeRoom(req.params.roomCode, req.user!.id);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/rooms/:roomCode/start', requireAuth, (req: AuthedRequest, res) => {
    const result = gameManager.startMatch(req.params.roomCode, req.user!.id);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ room: result.state });
  });

  // --- Game Endpoints ---
  app.get('/api/games/:gameId', requireAuth, (req: AuthedRequest, res) => {
    const state = gameManager.getPublicStateByGameId(req.params.gameId, req.user!.id);
    if (!state) {
      res.status(404).json({ error: 'Game not found.' });
      return;
    }
    res.json({ game: state });
  });

  app.get('/api/games/:gameId/state', requireAuth, (req: AuthedRequest, res) => {
    const state = gameManager.getPublicStateByGameId(req.params.gameId, req.user!.id);
    if (!state) {
      res.status(404).json({ error: 'Game not found.' });
      return;
    }
    res.json({ state });
  });

  app.post('/api/games/:gameId/play-card', requireAuth, (req: AuthedRequest, res) => {
    const { cardId, actionId } = req.body ?? {};
    if (typeof cardId !== 'string') {
      res.status(400).json({ error: 'cardId is required.' });
      return;
    }
    const result = gameManager.playCardByGameId(
      req.params.gameId,
      req.user!.id,
      cardId,
      typeof actionId === 'string' ? actionId : undefined
    );
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ state: result.state });
  });

  app.get('/api/games/:gameId/history', (_req, res) => {
    res.json({ moves: gameManager.getGameHistory(_req.params.gameId) });
  });

  app.post('/api/games/:gameId/play-again', requireAuth, (req: AuthedRequest, res) => {
    const room = gameManager.getRoomByGameId(req.params.gameId);
    if (!room) {
      res.status(404).json({ error: 'Game room not found.' });
      return;
    }
    const result = gameManager.playAgain(room.roomCode, req.user!.id);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ room: result.state });
  });

  // --- Players, Statistics, Leaderboard & History ---
  app.get('/api/players/leaderboard', (_req, res) => {
    res.json({ leaderboard: db.getLeaderboard(30) });
  });

  app.get('/api/players/:id', (req, res) => {
    const user = db.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }
    res.json({ player: user });
  });

  app.get('/api/players/:id/statistics', (req, res) => {
    const user = db.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }
    const recentMatches = db.getRecentMatches(user.id, 15);
    res.json({ player: user, recentMatches });
  });

  app.get('/api/history', (_req, res) => {
    res.json({ history: db.getRecentMatches(undefined, 25) });
  });

  // Vite middleware / static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const roomCode = url.searchParams.get('roomCode') ?? '';
    const token = url.searchParams.get('token') ?? '';

    const user = db.getUserByToken(token);
    if (!user) {
      ws.send(
        JSON.stringify({
          type: 'ERROR',
          payload: { error: 'Invalid or expired authentication token.' },
        })
      );
      ws.close();
      return;
    }

    const ok = gameManager.attachSocket(roomCode, user.id, ws);
    if (!ok) {
      ws.send(
        JSON.stringify({
          type: 'ERROR',
          payload: { error: 'Could not attach to room.' },
        })
      );
      ws.close();
      return;
    }

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type?: string;
          payload?: Record<string, unknown>;
          actionId?: string;
        };
        if (!msg || typeof msg.type !== 'string') return;

        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
          return;
        }

        if (msg.type === 'PLAY_CARD') {
          const cardId = String(msg.payload?.cardId ?? '');
          const room = gameManager.getRoomByCode(roomCode);
          if (!room) return;
          const res = gameManager.playCard(room, user.id, cardId, msg.actionId);
          if (!res.ok) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                payload: { error: res.error },
              })
            );
          }
          return;
        }

        if (msg.type === 'TOGGLE_READY') {
          const res = gameManager.toggleReady(roomCode, user.id);
          if (!res.ok) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { error: res.error } }));
          }
          return;
        }

        if (msg.type === 'UPDATE_RULES') {
          const res = gameManager.updateRoomSettings(
            roomCode,
            user.id,
            (msg.payload ?? {}) as Record<string, unknown>
          );
          if (!res.ok) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { error: res.error } }));
          }
          return;
        }

        if (msg.type === 'START_GAME') {
          const res = gameManager.startMatch(roomCode, user.id);
          if (!res.ok) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { error: res.error } }));
          }
          return;
        }

        if (msg.type === 'KICK_PLAYER') {
          const res = gameManager.kickPlayer(
            roomCode,
            user.id,
            String(msg.payload?.playerId ?? '')
          );
          if (!res.ok) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { error: res.error } }));
          }
          return;
        }

        if (msg.type === 'PLAY_AGAIN') {
          const res = gameManager.playAgain(roomCode, user.id);
          if (!res.ok) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { error: res.error } }));
          }
        }
      } catch {
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            payload: { error: 'Invalid WebSocket message.' },
          })
        );
      }
    });

    ws.on('close', () => {
      gameManager.detachSocket(roomCode, user.id, ws);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Thulla card server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
