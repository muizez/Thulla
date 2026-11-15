import crypto from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  GameMode,
  GameMoveRecord,
  LeaderboardEntry,
  MatchHistoryItem,
  PlayerResultSummary,
  UserProfile,
} from '../src/game/types';

const DB_PATH = path.resolve(process.cwd(), 'thulla_cards.db');

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

class ThullaCardDatabase {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        email TEXT UNIQUE COLLATE NOCASE,
        password_hash TEXT,
        avatar TEXT NOT NULL DEFAULT 'ace',
        is_guest INTEGER NOT NULL DEFAULT 0,
        total_games INTEGER NOT NULL DEFAULT 0,
        total_wins INTEGER NOT NULL DEFAULT 0,
        total_losses INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0,
        current_streak INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS auth_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        room_code TEXT NOT NULL,
        room_name TEXT NOT NULL,
        mode TEXT NOT NULL,
        winner_name TEXT NOT NULL,
        thulla_loser_name TEXT NOT NULL,
        player_count INTEGER NOT NULL,
        total_moves INTEGER NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS game_results (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        avatar TEXT NOT NULL,
        is_bot INTEGER NOT NULL DEFAULT 0,
        final_position INTEGER NOT NULL,
        result TEXT NOT NULL,
        score INTEGER NOT NULL,
        cards_remaining INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS game_moves (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        username TEXT NOT NULL,
        card_id TEXT NOT NULL,
        suit TEXT NOT NULL,
        rank TEXT NOT NULL,
        move_number INTEGER NOT NULL,
        trick_number INTEGER NOT NULL,
        is_off_suit INTEGER NOT NULL DEFAULT 0,
        note TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
      );
    `);
  }

  private mapUserRow(row: {
    id: string;
    username: string;
    email: string | null;
    avatar: string;
    is_guest: number;
    total_games: number;
    total_wins: number;
    total_losses: number;
    best_streak: number;
    current_streak: number;
    created_at: number;
  }): UserProfile {
    const winPercentage =
      row.total_games > 0
        ? Math.round((row.total_wins / row.total_games) * 1000) / 10
        : 0;

    const rankRow = this.db
      .prepare(
        `SELECT COUNT(*) + 1 as rank FROM users
         WHERE is_guest = 0 AND (total_wins > ? OR (total_wins = ? AND total_games < ?))`
      )
      .get(row.total_wins, row.total_wins, row.total_games) as { rank: number };

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      avatar: row.avatar,
      isGuest: row.is_guest === 1,
      totalGames: row.total_games,
      totalWins: row.total_wins,
      totalLosses: row.total_losses,
      winPercentage,
      bestStreak: row.best_streak,
      currentStreak: row.current_streak,
      rank: rankRow?.rank ?? 1,
      createdAt: row.created_at,
    };
  }

  registerUser(input: {
    username: string;
    email: string;
    password: string;
    avatar?: string;
  }): { ok: true; user: UserProfile; token: string } | { ok: false; error: string } {
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    if (username.length < 2 || username.length > 20) {
      return { ok: false, error: 'Username must be 2–20 characters.' };
    }
    if (!email.includes('@')) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (input.password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    const existing = this.db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email);
    if (existing) {
      return { ok: false, error: 'Username or email is already registered.' };
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    const avatar = input.avatar || 'ace';
    const pwHash = hashPassword(input.password);

    this.db
      .prepare(
        `INSERT INTO users (id, username, email, password_hash, avatar, is_guest, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?)`
      )
      .run(id, username, email, pwHash, avatar, now);

    const token = this.createSessionToken(id);
    const user = this.getUserById(id)!;
    return { ok: true, user, token };
  }

  loginUser(input: {
    identifier: string; // username or email
    password: string;
  }): { ok: true; user: UserProfile; token: string } | { ok: false; error: string } {
    const ident = input.identifier.trim();
    const row = this.db
      .prepare(
        `SELECT id, password_hash FROM users WHERE (username = ? OR email = ?) AND is_guest = 0`
      )
      .get(ident, ident.toLowerCase()) as
      | { id: string; password_hash: string | null }
      | undefined;

    if (!row || !row.password_hash || !verifyPassword(input.password, row.password_hash)) {
      return { ok: false, error: 'Invalid username/email or password.' };
    }

    const token = this.createSessionToken(row.id);
    const user = this.getUserById(row.id)!;
    return { ok: true, user, token };
  }

  createGuestUser(input: {
    username: string;
    avatar?: string;
  }): { ok: true; user: UserProfile; token: string } | { ok: false; error: string } {
    const clean = input.username.trim().slice(0, 18);
    if (clean.length < 2) {
      return { ok: false, error: 'Display name must be at least 2 characters.' };
    }
    const suffix = Math.floor(100 + Math.random() * 900);
    const uniqueName = this.db
      .prepare('SELECT id FROM users WHERE username = ?')
      .get(clean)
      ? `${clean.slice(0, 14)}_${suffix}`
      : clean;

    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO users (id, username, email, password_hash, avatar, is_guest, created_at)
         VALUES (?, ?, NULL, NULL, ?, 1, ?)`
      )
      .run(id, uniqueName, input.avatar || 'chai', now);

    const token = this.createSessionToken(id);
    const user = this.getUserById(id)!;
    return { ok: true, user, token };
  }

  createSessionToken(userId: string): string {
    const token = crypto.randomBytes(24).toString('hex');
    this.db
      .prepare('INSERT INTO auth_sessions (token, user_id, created_at) VALUES (?, ?, ?)')
      .run(token, userId, Date.now());
    return token;
  }

  deleteSessionToken(token: string) {
    this.db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
  }

  getUserByToken(token: string): UserProfile | null {
    if (!token) return null;
    const session = this.db
      .prepare('SELECT user_id FROM auth_sessions WHERE token = ?')
      .get(token) as { user_id: string } | undefined;
    if (!session) return null;
    return this.getUserById(session.user_id);
  }

  getUserById(userId: string): UserProfile | null {
    const row = this.db
      .prepare(
        `SELECT id, username, email, avatar, is_guest, total_games, total_wins, total_losses,
                best_streak, current_streak, created_at
         FROM users WHERE id = ?`
      )
      .get(userId) as
      | {
          id: string;
          username: string;
          email: string | null;
          avatar: string;
          is_guest: number;
          total_games: number;
          total_wins: number;
          total_losses: number;
          best_streak: number;
          current_streak: number;
          created_at: number;
        }
      | undefined;
    return row ? this.mapUserRow(row) : null;
  }

  updateUserProfile(
    userId: string,
    patch: { username?: string; avatar?: string }
  ): { ok: true; user: UserProfile } | { ok: false; error: string } {
    const existing = this.getUserById(userId);
    if (!existing) return { ok: false, error: 'User not found.' };

    let nextName = existing.username;
    if (typeof patch.username === 'string' && patch.username.trim()) {
      const clean = patch.username.trim();
      if (clean.length < 2 || clean.length > 20) {
        return { ok: false, error: 'Username must be 2–20 characters.' };
      }
      const conflict = this.db
        .prepare('SELECT id FROM users WHERE username = ? AND id != ?')
        .get(clean, userId);
      if (conflict) {
        return { ok: false, error: 'That username is already taken.' };
      }
      nextName = clean;
    }

    const nextAvatar =
      typeof patch.avatar === 'string' && patch.avatar.trim()
        ? patch.avatar.trim()
        : existing.avatar;

    this.db
      .prepare('UPDATE users SET username = ?, avatar = ? WHERE id = ?')
      .run(nextName, nextAvatar, userId);

    return { ok: true, user: this.getUserById(userId)! };
  }

  recordMatchOutcome(input: {
    sessionId: string;
    roomCode: string;
    roomName: string;
    mode: GameMode;
    winnerName: string;
    thullaLoserName: string;
    startedAt: number;
    endedAt: number;
    moves: GameMoveRecord[];
    results: PlayerResultSummary[];
  }) {
    this.db
      .prepare(
        `INSERT INTO game_sessions (
          id, room_code, room_name, mode, winner_name, thulla_loser_name,
          player_count, total_moves, started_at, ended_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.sessionId,
        input.roomCode,
        input.roomName,
        input.mode,
        input.winnerName,
        input.thullaLoserName,
        input.results.length,
        input.moves.length,
        input.startedAt,
        input.endedAt
      );

    const insertResult = this.db.prepare(
      `INSERT INTO game_results (
        id, session_id, player_id, user_id, username, avatar, is_bot,
        final_position, result, score, cards_remaining
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const r of input.results) {
      insertResult.run(
        crypto.randomUUID(),
        input.sessionId,
        r.playerId,
        r.userId,
        r.username,
        r.avatar,
        r.isBot ? 1 : 0,
        r.finalPosition,
        r.result,
        r.score,
        r.cardsRemaining
      );

      // Update user stats for human players
      if (!r.isBot) {
        const userRow = this.db
          .prepare(
            'SELECT total_games, total_wins, total_losses, best_streak, current_streak FROM users WHERE id = ?'
          )
          .get(r.userId) as
          | {
              total_games: number;
              total_wins: number;
              total_losses: number;
              best_streak: number;
              current_streak: number;
            }
          | undefined;

        if (userRow) {
          const escaped = r.result !== 'THULLA';
          const isThullaLoss = r.result === 'THULLA';
          const nextGames = userRow.total_games + 1;
          const nextWins = userRow.total_wins + (escaped ? 1 : 0);
          const nextLosses = userRow.total_losses + (isThullaLoss ? 1 : 0);
          const nextStreak = escaped ? userRow.current_streak + 1 : 0;
          const nextBest = Math.max(userRow.best_streak, nextStreak);

          this.db
            .prepare(
              `UPDATE users
               SET total_games = ?, total_wins = ?, total_losses = ?,
                   current_streak = ?, best_streak = ?
               WHERE id = ?`
            )
            .run(nextGames, nextWins, nextLosses, nextStreak, nextBest, r.userId);
        }
      }
    }

    const insertMove = this.db.prepare(
      `INSERT INTO game_moves (
        id, session_id, player_id, username, card_id, suit, rank,
        move_number, trick_number, is_off_suit, note, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const m of input.moves) {
      insertMove.run(
        crypto.randomUUID(),
        input.sessionId,
        m.playerId,
        m.username,
        m.cardId,
        m.suit,
        m.rank,
        m.moveNumber,
        m.trickNumber,
        m.isOffSuit ? 1 : 0,
        m.note,
        m.timestamp
      );
    }
  }

  getLeaderboard(limit = 30): LeaderboardEntry[] {
    const rows = this.db
      .prepare(
        `SELECT id, username, avatar, total_games, total_wins, total_losses, best_streak
         FROM users
         WHERE total_games > 0
         ORDER BY total_wins DESC, (CAST(total_wins AS REAL) / MAX(1, total_games)) DESC, best_streak DESC
         LIMIT ?`
      )
      .all(limit) as {
      id: string;
      username: string;
      avatar: string;
      total_games: number;
      total_wins: number;
      total_losses: number;
      best_streak: number;
    }[];

    return rows.map((r, idx) => ({
      rank: idx + 1,
      userId: r.id,
      username: r.username,
      avatar: r.avatar,
      totalGames: r.total_games,
      totalWins: r.total_wins,
      totalLosses: r.total_losses,
      winPercentage:
        r.total_games > 0
          ? Math.round((r.total_wins / r.total_games) * 1000) / 10
          : 0,
      bestStreak: r.best_streak,
    }));
  }

  getRecentMatches(userId?: string, limit = 25): MatchHistoryItem[] {
    const sessions = (userId
      ? this.db
          .prepare(
            `SELECT DISTINCT gs.* FROM game_sessions gs
             INNER JOIN game_results gr ON gr.session_id = gs.id
             WHERE gr.user_id = ?
             ORDER BY gs.ended_at DESC LIMIT ?`
          )
          .all(userId, limit)
      : this.db
          .prepare('SELECT * FROM game_sessions ORDER BY ended_at DESC LIMIT ?')
          .all(limit)) as {
      id: string;
      room_code: string;
      room_name: string;
      mode: string;
      winner_name: string;
      thulla_loser_name: string;
      player_count: number;
      total_moves: number;
      started_at: number;
      ended_at: number;
    }[];

    return sessions.map((s) => {
      const results = this.db
        .prepare(
          `SELECT player_id, user_id, username, avatar, is_bot, final_position, result, score, cards_remaining
           FROM game_results WHERE session_id = ? ORDER BY final_position ASC`
        )
        .all(s.id) as {
        player_id: string;
        user_id: string;
        username: string;
        avatar: string;
        is_bot: number;
        final_position: number;
        result: string;
        score: number;
        cards_remaining: number;
      }[];

      return {
        sessionId: s.id,
        roomCode: s.room_code,
        roomName: s.room_name,
        mode: s.mode as GameMode,
        winnerName: s.winner_name,
        thullaLoserName: s.thulla_loser_name,
        playerCount: s.player_count,
        totalMoves: s.total_moves,
        startedAt: s.started_at,
        endedAt: s.ended_at,
        results: results.map((r) => ({
          playerId: r.player_id,
          userId: r.user_id,
          username: r.username,
          avatar: r.avatar,
          isBot: r.is_bot === 1,
          finalPosition: r.final_position,
          result: r.result as PlayerResultSummary['result'],
          score: r.score,
          cardsRemaining: r.cards_remaining,
        })),
      };
    });
  }

  getSessionMoves(sessionId: string): GameMoveRecord[] {
    const rows = this.db
      .prepare(
        `SELECT move_number, trick_number, player_id, username, card_id, suit, rank, is_off_suit, note, timestamp
         FROM game_moves WHERE session_id = ? ORDER BY move_number ASC`
      )
      .all(sessionId) as {
      move_number: number;
      trick_number: number;
      player_id: string;
      username: string;
      card_id: string;
      suit: string;
      rank: string;
      is_off_suit: number;
      note: string;
      timestamp: number;
    }[];

    return rows.map((m) => ({
      moveNumber: m.move_number,
      trickNumber: m.trick_number,
      playerId: m.player_id,
      username: m.username,
      cardId: m.card_id,
      suit: m.suit as GameMoveRecord['suit'],
      rank: m.rank as GameMoveRecord['rank'],
      isOffSuit: m.is_off_suit === 1,
      note: m.note,
      timestamp: m.timestamp,
    }));
  }
}

export const db = new ThullaCardDatabase();
