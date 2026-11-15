import crypto from 'node:crypto';
import type { WebSocket } from 'ws';
import {
  chooseBotCard,
  createStandardDeck,
  dealCards,
  determineStartingPlayerIndex,
  evaluateTrickState,
  generateRoomCode,
  getLegalCards,
  getNextActivePlayerIndex,
  shuffleDeck,
  sortHand,
  validateCardPlay,
  validateGameRules,
} from '../src/game/engine';
import {
  DEFAULT_GAME_RULES,
  type BotDifficulty,
  type Card,
  type GameMode,
  type GameMoveRecord,
  type GameRulesConfig,
  type PlayerResultSummary,
  type PublicGameState,
  type PublicRoomSummary,
  type RoomStatus,
  type ServerEventType,
  type Suit,
  type TrickPlay,
  type UserProfile,
} from '../src/game/types';
import { db } from './db';

const BOT_NAMES = [
  'Ustad Tariq (Bot)',
  'Bhabi Saima (Bot)',
  'Hostel Dawood (Bot)',
  'Chai Master Zain (Bot)',
  'Backbencher Saad (Bot)',
];

const BOT_AVATARS = ['owl', 'lotus', 'tigers', 'chai', 'joker'];

interface ServerPlayer {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  position: number;
  isHost: boolean;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  isReady: boolean;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED';
  hand: Card[];
  finishedRank: number | null;
  isThullaLoser: boolean;
}

interface InternalRoom {
  gameId: string;
  roomCode: string;
  roomName: string;
  mode: GameMode;
  status: RoomStatus;
  hostUserId: string;
  maxPlayers: number;
  botCount: number;
  botDifficulty: BotDifficulty;
  rules: GameRulesConfig;
  players: ServerPlayer[];
  roundNumber: number;
  trickNumber: number;
  moveNumber: number;
  currentTurnPlayerId: string | null;
  turnDeadlineAt: number | null;
  leadingSuit: Suit | null;
  currentTrick: TrickPlay[];
  trickResolving: boolean;
  activePlayerCountAtTrickStart: number;
  discardPile: Card[];
  lastEventMessage: string;
  lastThullaEvent: PublicGameState['lastThullaEvent'];
  moves: GameMoveRecord[];
  results: PlayerResultSummary[];
  startedAt: number | null;
  lastActionIds: Set<string>;
  sockets: Map<string, Set<WebSocket>>; // userId -> sockets
  botTimer: ReturnType<typeof setTimeout> | null;
  turnTimer: ReturnType<typeof setTimeout> | null;
  trickResolveTimer: ReturnType<typeof setTimeout> | null;
}

export class ThullaGameManager {
  private rooms = new Map<string, InternalRoom>(); // roomCode -> InternalRoom
  private gameIdIndex = new Map<string, string>(); // gameId -> roomCode

  private clearTimers(room: InternalRoom) {
    if (room.botTimer) {
      clearTimeout(room.botTimer);
      room.botTimer = null;
    }
    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
      room.turnTimer = null;
    }
    if (room.trickResolveTimer) {
      clearTimeout(room.trickResolveTimer);
      room.trickResolveTimer = null;
    }
  }

  private toPublicState(
    room: InternalRoom,
    viewerUserId?: string
  ): PublicGameState {
    const viewer = viewerUserId
      ? room.players.find((p) => p.userId === viewerUserId)
      : undefined;

    const myHand = viewer ? viewer.hand : [];
    const isMyTurn =
      room.status === 'PLAYING' &&
      !room.trickResolving &&
      viewer &&
      room.currentTurnPlayerId === viewer.id;

    const playableCardIds =
      isMyTurn && viewer
        ? getLegalCards(
            viewer.hand,
            room.leadingSuit,
            room.rules,
            room.moveNumber === 0
          ).map((c) => c.id)
        : [];

    const hostPlayer = room.players.find((p) => p.isHost);

    return {
      gameId: room.gameId,
      roomCode: room.roomCode,
      roomName: room.roomName,
      mode: room.mode,
      status: room.status,
      hostId: hostPlayer?.id ?? '',
      maxPlayers: room.maxPlayers,
      botCount: room.botCount,
      botDifficulty: room.botDifficulty,
      rules: room.rules,
      players: room.players.map((p) => ({
        id: p.id,
        userId: p.userId,
        username: p.username,
        avatar: p.avatar,
        position: p.position,
        isHost: p.isHost,
        isBot: p.isBot,
        botDifficulty: p.botDifficulty,
        isReady: p.isReady,
        connectionStatus: p.connectionStatus,
        cardCount: p.hand.length,
        finishedRank: p.finishedRank,
        isThullaLoser: p.isThullaLoser,
      })),
      myHand,
      playableCardIds,
      roundNumber: room.roundNumber,
      trickNumber: room.trickNumber,
      moveNumber: room.moveNumber,
      currentTurnPlayerId: room.currentTurnPlayerId,
      turnDeadlineAt: room.turnDeadlineAt,
      leadingSuit: room.leadingSuit,
      currentTrick: room.currentTrick,
      discardCount: room.discardPile.length,
      lastEventMessage: room.lastEventMessage,
      lastThullaEvent: room.lastThullaEvent,
      recentMoves: room.moves.slice(-16),
      results: room.results,
    };
  }

  private broadcast(
    room: InternalRoom,
    eventType: ServerEventType,
    extraPayload?: Record<string, unknown>
  ) {
    for (const [userId, socketSet] of room.sockets.entries()) {
      const personalizedState = this.toPublicState(room, userId);
      const packet = JSON.stringify({
        type: eventType,
        payload: {
          ...extraPayload,
          state: personalizedState,
        },
      });
      for (const ws of socketSet) {
        if (ws.readyState === 1) {
          ws.send(packet);
        }
      }
    }
  }

  private reindexPositions(room: InternalRoom) {
    room.players.forEach((p, idx) => {
      p.position = idx;
    });
  }

  private syncBotsInLobby(room: InternalRoom) {
    const humans = room.players.filter((p) => !p.isBot);
    const maxBotsAllowed = Math.max(0, room.maxPlayers - humans.length);
    const targetBots = Math.min(room.botCount, maxBotsAllowed);
    room.botCount = targetBots;

    const bots: ServerPlayer[] = [];
    for (let i = 0; i < targetBots; i++) {
      bots.push({
        id: `bot-${room.roomCode}-${i + 1}`,
        userId: `bot-user-${i + 1}`,
        username: BOT_NAMES[i % BOT_NAMES.length],
        avatar: BOT_AVATARS[i % BOT_AVATARS.length],
        position: humans.length + i,
        isHost: false,
        isBot: true,
        botDifficulty: room.botDifficulty,
        isReady: true,
        connectionStatus: 'CONNECTED',
        hand: [],
        finishedRank: null,
        isThullaLoser: false,
      });
    }

    room.players = [...humans, ...bots];
    this.reindexPositions(room);
  }

  getPublicRooms(): PublicRoomSummary[] {
    const list: PublicRoomSummary[] = [];
    for (const room of this.rooms.values()) {
      if (room.mode === 'FRIENDS' || room.status === 'FINISHED') continue;
      if (room.mode === 'BOTS' && room.status !== 'LOBBY') continue;
      const host = room.players.find((p) => p.isHost);
      list.push({
        roomCode: room.roomCode,
        roomName: room.roomName,
        hostName: host?.username ?? 'Host',
        mode: room.mode,
        status: room.status,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        botCount: room.botCount,
        presetName: room.rules.presetName,
      });
    }
    return list;
  }

  getRoomByCode(code: string): InternalRoom | undefined {
    return this.rooms.get(code.trim().toUpperCase());
  }

  getRoomByGameId(gameId: string): InternalRoom | undefined {
    const code = this.gameIdIndex.get(gameId);
    return code ? this.rooms.get(code) : undefined;
  }

  getPublicStateByCode(code: string, userId?: string): PublicGameState | null {
    const room = this.getRoomByCode(code);
    return room ? this.toPublicState(room, userId) : null;
  }

  getPublicStateByGameId(gameId: string, userId?: string): PublicGameState | null {
    const room = this.getRoomByGameId(gameId);
    return room ? this.toPublicState(room, userId) : null;
  }

  getGameHistory(gameId: string): GameMoveRecord[] {
    const room = this.getRoomByGameId(gameId);
    if (room) return room.moves;
    return db.getSessionMoves(gameId);
  }

  createRoom(
    hostUser: UserProfile,
    input: {
      roomName?: string;
      mode?: GameMode;
      maxPlayers?: number;
      botCount?: number;
      botDifficulty?: BotDifficulty;
      rules?: Partial<GameRulesConfig>;
      autoStartBots?: boolean;
    }
  ): PublicGameState {
    const roomCode = generateRoomCode(new Set(this.rooms.keys()));
    const gameId = crypto.randomUUID();
    const mode: GameMode =
      input.mode === 'BOTS' || input.mode === 'ONLINE' ? input.mode : 'FRIENDS';
    const maxPlayers = Math.min(6, Math.max(2, Math.round(input.maxPlayers ?? 4)));
    const botDifficulty: BotDifficulty =
      input.botDifficulty === 'EASY' || input.botDifficulty === 'HARD'
        ? input.botDifficulty
        : 'MEDIUM';
    const botCount =
      mode === 'BOTS'
        ? Math.min(maxPlayers - 1, Math.max(1, Math.round(input.botCount ?? 3)))
        : Math.min(maxPlayers - 1, Math.max(0, Math.round(input.botCount ?? 0)));

    const rules = validateGameRules(input.rules ?? {}, DEFAULT_GAME_RULES);
    const roomName =
      input.roomName && input.roomName.trim()
        ? input.roomName.trim().slice(0, 40)
        : mode === 'BOTS'
          ? `${hostUser.username} vs AI Table`
          : `${hostUser.username}'s Thulla Table`;

    const hostPlayer: ServerPlayer = {
      id: crypto.randomUUID(),
      userId: hostUser.id,
      username: hostUser.username,
      avatar: hostUser.avatar,
      position: 0,
      isHost: true,
      isBot: false,
      isReady: true,
      connectionStatus: 'CONNECTED',
      hand: [],
      finishedRank: null,
      isThullaLoser: false,
    };

    const room: InternalRoom = {
      gameId,
      roomCode,
      roomName,
      mode,
      status: 'LOBBY',
      hostUserId: hostUser.id,
      maxPlayers,
      botCount,
      botDifficulty,
      rules,
      players: [hostPlayer],
      roundNumber: 1,
      trickNumber: 0,
      moveNumber: 0,
      currentTurnPlayerId: null,
      turnDeadlineAt: null,
      leadingSuit: null,
      currentTrick: [],
      trickResolving: false,
      activePlayerCountAtTrickStart: 0,
      discardPile: [],
      lastEventMessage: `${hostUser.username} opened table ${roomCode}.`,
      lastThullaEvent: null,
      moves: [],
      results: [],
      startedAt: null,
      lastActionIds: new Set(),
      sockets: new Map(),
      botTimer: null,
      turnTimer: null,
      trickResolveTimer: null,
    };

    this.syncBotsInLobby(room);
    this.rooms.set(roomCode, room);
    this.gameIdIndex.set(gameId, roomCode);

    if (input.autoStartBots && room.players.length >= 2) {
      this.startMatch(roomCode, hostUser.id);
    }

    return this.toPublicState(room, hostUser.id);
  }

  matchmakeOnline(user: UserProfile): PublicGameState {
    for (const room of this.rooms.values()) {
      if (
        room.mode === 'ONLINE' &&
        room.status === 'LOBBY' &&
        room.players.length < room.maxPlayers
      ) {
        const alreadyIn = room.players.some((p) => p.userId === user.id);
        if (alreadyIn) return this.toPublicState(room, user.id);
        const joined = this.joinRoom(room.roomCode, user);
        if (joined.ok) return joined.state;
      }
    }
    return this.createRoom(user, {
      mode: 'ONLINE',
      roomName: `${user.username}'s Public Table`,
      maxPlayers: 4,
      botCount: 0,
    });
  }

  joinRoom(
    rawCode: string,
    user: UserProfile
  ): { ok: true; state: PublicGameState } | { ok: false; error: string } {
    const room = this.getRoomByCode(rawCode);
    if (!room) return { ok: false, error: `Room "${rawCode}" not found.` };

    const existing = room.players.find((p) => p.userId === user.id);
    if (existing) {
      existing.connectionStatus = 'CONNECTED';
      existing.username = user.username;
      existing.avatar = user.avatar;
      room.lastEventMessage = `${user.username} reconnected to the table.`;
      this.broadcast(room, 'PLAYER_RECONNECTED', { userId: user.id });
      return { ok: true, state: this.toPublicState(room, user.id) };
    }

    if (room.status !== 'LOBBY') {
      return { ok: false, error: 'Match is already in progress.' };
    }

    // If bots occupy slots in an online/friends room, drop one bot if needed, else reject when full
    const humanCount = room.players.filter((p) => !p.isBot).length;
    if (humanCount >= room.maxPlayers) {
      return { ok: false, error: `Room is full (${room.maxPlayers} players max).` };
    }
    if (room.players.length >= room.maxPlayers && room.botCount > 0) {
      room.botCount -= 1;
      this.syncBotsInLobby(room);
    }

    const player: ServerPlayer = {
      id: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      position: room.players.length,
      isHost: false,
      isBot: false,
      isReady: false,
      connectionStatus: 'CONNECTED',
      hand: [],
      finishedRank: null,
      isThullaLoser: false,
    };

    const humans = room.players.filter((p) => !p.isBot);
    const bots = room.players.filter((p) => p.isBot);
    room.players = [...humans, player, ...bots];
    this.reindexPositions(room);

    room.lastEventMessage = `${user.username} joined the table.`;
    this.broadcast(room, 'PLAYER_JOINED', { username: user.username });
    return { ok: true, state: this.toPublicState(room, user.id) };
  }

  leaveRoom(
    rawCode: string,
    userId: string
  ): { ok: true; closed: boolean } | { ok: false; error: string } {
    const room = this.getRoomByCode(rawCode);
    if (!room) return { ok: false, error: 'Room not found.' };

    const target = room.players.find((p) => p.userId === userId);
    if (!target) return { ok: true, closed: false };

    if (room.status === 'LOBBY') {
      if (target.isHost) {
        this.closeRoom(rawCode, userId);
        return { ok: true, closed: true };
      }
      room.players = room.players.filter((p) => p.userId !== userId);
      this.reindexPositions(room);
      room.sockets.delete(userId);
      room.lastEventMessage = `${target.username} left the lobby.`;
      this.broadcast(room, 'PLAYER_LEFT', { username: target.username });
      return { ok: true, closed: false };
    }

    // During PLAYING, mark disconnected so they can reconnect without breaking hands
    target.connectionStatus = 'DISCONNECTED';
    room.sockets.delete(userId);
    room.lastEventMessage = `${target.username} disconnected.`;
    this.broadcast(room, 'PLAYER_DISCONNECTED', { username: target.username });
    return { ok: true, closed: false };
  }

  closeRoom(rawCode: string, userId: string): { ok: true } | { ok: false; error: string } {
    const room = this.getRoomByCode(rawCode);
    if (!room) return { ok: false, error: 'Room not found.' };
    if (room.hostUserId !== userId) {
      return { ok: false, error: 'Only the host can close the room.' };
    }
    this.clearTimers(room);
    this.broadcast(room, 'ROOM_CLOSED', { message: 'Host closed the room.' });
    this.gameIdIndex.delete(room.gameId);
    this.rooms.delete(room.roomCode);
    return { ok: true };
  }

  toggleReady(
    rawCode: string,
    userId: string,
    ready?: boolean
  ): { ok: true; state: PublicGameState } | { ok: false; error: string } {
    const room = this.getRoomByCode(rawCode);
    if (!room) return { ok: false, error: 'Room not found.' };
    const player = room.players.find((p) => p.userId === userId);
    if (!player) return { ok: false, error: 'Not a member of this room.' };

    player.isReady = typeof ready === 'boolean' ? ready : !player.isReady;
    room.lastEventMessage = `${player.username} is ${
      player.isReady ? 'ready' : 'not ready'
    }.`;
    this.broadcast(room, 'PLAYER_READY', {
      playerId: player.id,
      isReady: player.isReady,
    });
    return { ok: true, state: this.toPublicState(room, userId) };
  }

  updateRoomSettings(
    rawCode: string,
    userId: string,
    patch: {
      rules?: Partial<GameRulesConfig>;
      botCount?: number;
      botDifficulty?: BotDifficulty;
      maxPlayers?: number;
    }
  ): { ok: true; state: PublicGameState } | { ok: false; error: string } {
    const room = this.getRoomByCode(rawCode);
    if (!room) return { ok: false, error: 'Room not found.' };
    if (room.hostUserId !== userId) {
      return { ok: false, error: 'Only the host can change room settings.' };
    }
    if (room.status !== 'LOBBY') {
      return { ok: false, error: 'Cannot change settings after game started.' };
    }

    if (patch.maxPlayers !== undefined) {
      const humans = room.players.filter((p) => !p.isBot).length;
      room.maxPlayers = Math.min(6, Math.max(Math.max(2, humans), Math.round(patch.maxPlayers)));
    }
    if (patch.botDifficulty) {
      room.botDifficulty = patch.botDifficulty;
    }
    if (patch.botCount !== undefined) {
      room.botCount = Math.max(0, Math.round(patch.botCount));
    }
    if (patch.rules) {
      room.rules = validateGameRules(patch.rules, room.rules);
    }

    this.syncBotsInLobby(room);
    room.lastEventMessage = `Host updated table rules (${room.rules.presetName}).`;
    this.broadcast(room, 'RULES_UPDATED');
    return { ok: true, state: this.toPublicState(room, userId) };
  }

  kickPlayer(
    rawCode: string,
    hostUserId: string,
    targetPlayerId: string
  ): { ok: true; state: PublicGameState } | { ok: false; error: string } {
    const room = this.getRoomByCode(rawCode);
    if (!room) return { ok: false, error: 'Room not found.' };
    if (room.hostUserId !== hostUserId) {
      return { ok: false, error: 'Only the host can remove players.' };
    }
    if (room.status !== 'LOBBY') {
      return { ok: false, error: 'Cannot kick players during an active match.' };
    }
    const target = room.players.find((p) => p.id === targetPlayerId);
    if (!target || target.isHost) {
      return { ok: false, error: 'Cannot remove that player.' };
    }

    if (target.isBot) {
      room.botCount = Math.max(0, room.botCount - 1);
      this.syncBotsInLobby(room);
    } else {
      room.players = room.players.filter((p) => p.id !== targetPlayerId);
      room.sockets.delete(target.userId);
      this.reindexPositions(room);
    }

    room.lastEventMessage = `${target.username} was removed from the table.`;
    this.broadcast(room, 'PLAYER_LEFT', { username: target.username });
    return { ok: true, state: this.toPublicState(room, hostUserId) };
  }

  startMatch(
    rawCode: string,
    userId: string
  ): { ok: true; state: PublicGameState } | { ok: false; error: string } {
    const room = this.getRoomByCode(rawCode);
    if (!room) return { ok: false, error: 'Room not found.' };
    if (room.hostUserId !== userId) {
      return { ok: false, error: 'Only the host can start the match.' };
    }
    if (room.status === 'PLAYING') {
      return { ok: false, error: 'Match is already playing.' };
    }
    if (room.players.length < 2) {
      return { ok: false, error: 'At least 2 players (or bots) are required.' };
    }

    const unready = room.players.filter((p) => !p.isBot && !p.isHost && !p.isReady);
    if (unready.length > 0) {
      return {
        ok: false,
        error: `Waiting for ${unready.map((u) => u.username).join(', ')} to mark Ready.`,
      };
    }

    this.clearTimers(room);
    const deck = shuffleDeck(createStandardDeck());
    const hands = dealCards(deck, room.players.length);

    room.players.forEach((p, idx) => {
      p.hand = hands[idx];
      p.finishedRank = null;
      p.isThullaLoser = false;
    });

    const hostIdx = room.players.findIndex((p) => p.isHost);
    const starterIdx = determineStartingPlayerIndex(
      hands,
      room.rules,
      hostIdx >= 0 ? hostIdx : 0
    );
    const starter = room.players[starterIdx];

    room.status = 'PLAYING';
    room.roundNumber = 1;
    room.trickNumber = 1;
    room.moveNumber = 0;
    room.leadingSuit = null;
    room.currentTrick = [];
    room.trickResolving = false;
    room.activePlayerCountAtTrickStart = room.players.length;
    room.discardPile = [];
    room.moves = [];
    room.results = [];
    room.lastThullaEvent = null;
    room.startedAt = Date.now();
    room.lastActionIds.clear();
    room.currentTurnPlayerId = starter.id;
    room.turnDeadlineAt =
      room.rules.turnTimerSeconds > 0
        ? Date.now() + room.rules.turnTimerSeconds * 1000
        : null;

    room.lastEventMessage =
      room.rules.firstPlayerSelection === 'STARTING_CARD'
        ? `Cards dealt! ${starter.username} holds ${room.rules.startingCardId} and leads Trick 1.`
        : `Cards dealt! ${starter.username} leads Trick 1.`;

    this.broadcast(room, 'GAME_STARTED');
    this.scheduleNextTurnAutomation(room);
    return { ok: true, state: this.toPublicState(room, userId) };
  }

  playCardByGameId(
    gameId: string,
    userId: string,
    cardId: string,
    actionId?: string
  ): { ok: true; state: PublicGameState } | { ok: false; error: string } {
    const room = this.getRoomByGameId(gameId);
    if (!room) return { ok: false, error: 'Game session not found.' };
    return this.playCard(room, userId, cardId, actionId);
  }

  playCard(
    room: InternalRoom,
    userId: string,
    cardId: string,
    actionId?: string
  ): { ok: true; state: PublicGameState } | { ok: false; error: string } {
    if (room.status !== 'PLAYING') {
      return { ok: false, error: 'Game is not currently active.' };
    }
    if (room.trickResolving) {
      return { ok: false, error: 'Trick is resolving — please wait a moment.' };
    }
    if (actionId && room.lastActionIds.has(actionId)) {
      return { ok: true, state: this.toPublicState(room, userId) };
    }

    const player = room.players.find((p) => p.userId === userId);
    if (!player) {
      return { ok: false, error: 'You are not a player in this match.' };
    }
    if (room.currentTurnPlayerId !== player.id) {
      return { ok: false, error: 'It is not your turn.' };
    }

    const isFirstMove = room.moveNumber === 0;
    const validation = validateCardPlay(
      player.hand,
      cardId,
      room.leadingSuit,
      room.rules,
      isFirstMove
    );
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }

    if (actionId) room.lastActionIds.add(actionId);
    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
      room.turnTimer = null;
    }

    // Remove card from player's private hand
    player.hand = player.hand.filter((c) => c.id !== validation.card.id);
    room.moveNumber += 1;
    if (!room.leadingSuit) {
      room.leadingSuit = validation.card.suit;
      room.activePlayerCountAtTrickStart = room.players.filter(
        (p) => p.finishedRank === null
      ).length;
    }

    const play: TrickPlay = {
      playerId: player.id,
      username: player.username,
      card: validation.card,
      isOffSuit: validation.isOffSuit,
      moveNumber: room.moveNumber,
    };
    room.currentTrick = [...room.currentTrick, play];

    const moveNote = validation.isOffSuit
      ? `Played off-suit ${validation.card.id} (THULLA!)`
      : `Played ${validation.card.id}`;

    room.moves.push({
      moveNumber: room.moveNumber,
      trickNumber: room.trickNumber,
      playerId: player.id,
      username: player.username,
      cardId: validation.card.id,
      suit: validation.card.suit,
      rank: validation.card.rank,
      isOffSuit: validation.isOffSuit,
      note: moveNote,
      timestamp: Date.now(),
    });

    const resolution = evaluateTrickState({
      trick: room.currentTrick,
      leadingSuit: room.leadingSuit,
      trickNumber: room.trickNumber,
      activePlayerCountAtTrickStart: room.activePlayerCountAtTrickStart,
      rules: room.rules,
      lastPlayWasOffSuit: validation.isOffSuit,
    });

    room.lastEventMessage = validation.isOffSuit
      ? `${player.username} dropped ${validation.card.id} off-suit!`
      : `${player.username} played ${validation.card.id}.`;

    if (!resolution.trickComplete) {
      // Check immediate escape if player emptied their hand cleanly mid-trick
      if (
        player.hand.length === 0 &&
        room.rules.eliminationRule === 'IMMEDIATE_ESCAPE'
      ) {
        this.markPlayerEscaped(room, player);
        if (this.checkGameFinished(room)) {
          return { ok: true, state: this.toPublicState(room, userId) };
        }
      }

      const activeFlags = room.players.map((p) => p.finishedRank === null);
      const currIdx = room.players.findIndex((p) => p.id === player.id);
      const nextIdx = getNextActivePlayerIndex(
        currIdx,
        activeFlags,
        room.rules.turnDirection
      );
      room.currentTurnPlayerId = room.players[nextIdx].id;
      room.turnDeadlineAt =
        room.rules.turnTimerSeconds > 0
          ? Date.now() + room.rules.turnTimerSeconds * 1000
          : null;

      this.broadcast(room, 'CARD_PLAYED', { cardId: validation.card.id });
      this.broadcast(room, 'TURN_CHANGED', {
        currentTurnPlayerId: room.currentTurnPlayerId,
      });
      this.scheduleNextTurnAutomation(room);
      return { ok: true, state: this.toPublicState(room, userId) };
    }

    // Trick is complete! Enter brief resolving pause so UI animates the final card cleanly
    room.trickResolving = true;
    room.turnDeadlineAt = null;
    this.broadcast(room, 'CARD_PLAYED', { cardId: validation.card.id });

    room.trickResolveTimer = setTimeout(() => {
      room.trickResolveTimer = null;
      this.finalizeCompletedTrick(room, resolution);
    }, 900);

    return { ok: true, state: this.toPublicState(room, userId) };
  }

  private finalizeCompletedTrick(
    room: InternalRoom,
    resolution: ReturnType<typeof evaluateTrickState>
  ) {
    if (room.status !== 'PLAYING') return;

    if (resolution.wasThullaPickup && resolution.pickupPlayerId) {
      const victim = room.players.find((p) => p.id === resolution.pickupPlayerId);
      const culprit = room.currentTrick[room.currentTrick.length - 1];
      if (victim) {
        victim.hand = sortHand([...victim.hand, ...resolution.cardsToPickup]);
        // If victim had 0 cards before picking up (rare edge case), they are back in
        victim.finishedRank = null;
        room.lastThullaEvent = {
          victimId: victim.id,
          victimName: victim.username,
          culpritName: culprit?.username ?? 'Opponent',
          cardsPickedUp: resolution.cardsToPickup.length,
          timestamp: Date.now(),
        };
        room.lastEventMessage = `THULLA! ${victim.username} picked up ${resolution.cardsToPickup.length} cards!`;
      }
    } else {
      room.discardPile.push(...room.currentTrick.map((t) => t.card));
      const leader = room.players.find((p) => p.id === resolution.nextLeaderId);
      room.lastEventMessage = `${leader?.username ?? 'Player'} won the trick cleanly (${room.currentTrick.length} cards discarded).`;
    }

    // Mark any 0-card players as escaped (except victim who just picked up)
    for (const p of room.players) {
      if (p.hand.length === 0 && p.finishedRank === null) {
        this.markPlayerEscaped(room, p);
      }
    }

    if (this.checkGameFinished(room)) {
      return;
    }

    // Prepare next trick
    room.currentTrick = [];
    room.leadingSuit = null;
    room.trickNumber += 1;
    room.roundNumber = room.trickNumber;
    room.trickResolving = false;

    let nextLeader = room.players.find(
      (p) => p.id === resolution.nextLeaderId && p.finishedRank === null
    );
    if (!nextLeader) {
      const leaderOrigIdx = room.players.findIndex(
        (p) => p.id === resolution.nextLeaderId
      );
      const activeFlags = room.players.map((p) => p.finishedRank === null);
      const nextIdx = getNextActivePlayerIndex(
        leaderOrigIdx >= 0 ? leaderOrigIdx : 0,
        activeFlags,
        room.rules.turnDirection
      );
      nextLeader = room.players[nextIdx];
    }

    room.currentTurnPlayerId = nextLeader.id;
    room.turnDeadlineAt =
      room.rules.turnTimerSeconds > 0
        ? Date.now() + room.rules.turnTimerSeconds * 1000
        : null;

    this.broadcast(room, 'TRICK_COMPLETED', {
      wasThullaPickup: resolution.wasThullaPickup,
    });
    this.scheduleNextTurnAutomation(room);
  }

  private markPlayerEscaped(room: InternalRoom, player: ServerPlayer) {
    if (player.finishedRank !== null) return;
    const finishedCount = room.players.filter((p) => p.finishedRank !== null).length;
    player.finishedRank = finishedCount + 1;
    room.lastEventMessage = `${player.username} escaped in #${player.finishedRank} place!`;
    this.broadcast(room, 'PLAYER_FINISHED', {
      playerId: player.id,
      rank: player.finishedRank,
    });
  }

  private checkGameFinished(room: InternalRoom): boolean {
    const remaining = room.players.filter((p) => p.finishedRank === null);
    const finished = room.players.filter((p) => p.finishedRank !== null);

    const shouldEnd =
      room.rules.gameEndingCondition === 'FIRST_WINNER'
        ? finished.length >= 1
        : remaining.length <= 1;

    if (!shouldEnd) return false;

    this.clearTimers(room);
    room.status = 'FINISHED';
    room.trickResolving = false;
    room.currentTurnPlayerId = null;
    room.turnDeadlineAt = null;
    room.currentTrick = [];
    room.leadingSuit = null;

    // Rank remaining players by tie-handling rule
    const sortedRemaining = [...remaining].sort((a, b) => {
      if (a.hand.length !== b.hand.length) return a.hand.length - b.hand.length;
      if (room.rules.tieHandling === 'LOWEST_HIGH_CARD') {
        const highA = Math.max(0, ...a.hand.map((c) => c.value));
        const highB = Math.max(0, ...b.hand.map((c) => c.value));
        return highA - highB;
      }
      return a.position - b.position;
    });

    const sortedEscaped = [...finished].sort(
      (a, b) => (a.finishedRank ?? 99) - (b.finishedRank ?? 99)
    );

    const ordered = [...sortedEscaped, ...sortedRemaining];
    const loser = ordered[ordered.length - 1];
    if (loser && loser.hand.length > 0) {
      loser.isThullaLoser = true;
    }

    room.results = ordered.map((p, idx) => {
      const pos = idx + 1;
      const result: PlayerResultSummary['result'] =
        pos === 1 ? 'WINNER' : p.isThullaLoser ? 'THULLA' : 'ESCAPED';
      const score = p.isThullaLoser
        ? -p.hand.length * 10
        : (ordered.length - idx) * 100;
      return {
        playerId: p.id,
        userId: p.userId,
        username: p.username,
        avatar: p.avatar,
        isBot: p.isBot,
        finalPosition: pos,
        result,
        score,
        cardsRemaining: p.hand.length,
      };
    });

    const winnerName = room.results[0]?.username ?? 'Winner';
    const thullaName =
      room.results.find((r) => r.result === 'THULLA')?.username ??
      room.results[room.results.length - 1]?.username ??
      'None';

    room.lastEventMessage = `Match finished! ${winnerName} escaped 1st. ${thullaName} got the THULLA!`;

    db.recordMatchOutcome({
      sessionId: room.gameId,
      roomCode: room.roomCode,
      roomName: room.roomName,
      mode: room.mode,
      winnerName,
      thullaLoserName: thullaName,
      startedAt: room.startedAt ?? Date.now(),
      endedAt: Date.now(),
      moves: room.moves,
      results: room.results,
    });

    this.broadcast(room, 'GAME_FINISHED');
    return true;
  }

  private scheduleNextTurnAutomation(room: InternalRoom) {
    if (room.status !== 'PLAYING' || room.trickResolving) return;
    const active = room.players.find((p) => p.id === room.currentTurnPlayerId);
    if (!active) return;

    if (active.isBot) {
      room.botTimer = setTimeout(() => {
        room.botTimer = null;
        if (room.status !== 'PLAYING' || room.currentTurnPlayerId !== active.id) {
          return;
        }
        const chosen = chooseBotCard({
          hand: active.hand,
          leadingSuit: room.leadingSuit,
          currentTrick: room.currentTrick,
          rules: room.rules,
          difficulty: active.botDifficulty ?? room.botDifficulty,
          isVeryFirstMoveOfGame: room.moveNumber === 0,
        });
        if (chosen) {
          this.playCard(room, active.userId, chosen.id);
        }
      }, 750);
      return;
    }

    // Human turn timer safety auto-play
    if (room.rules.turnTimerSeconds > 0) {
      room.turnTimer = setTimeout(() => {
        room.turnTimer = null;
        if (room.status !== 'PLAYING' || room.currentTurnPlayerId !== active.id) {
          return;
        }
        const legal = getLegalCards(
          active.hand,
          room.leadingSuit,
          room.rules,
          room.moveNumber === 0
        );
        if (legal.length > 0) {
          this.playCard(room, active.userId, legal[0].id);
        }
      }, room.rules.turnTimerSeconds * 1000 + 500);
    }
  }

  playAgain(
    rawCode: string,
    userId: string
  ): { ok: true; state: PublicGameState } | { ok: false; error: string } {
    const room = this.getRoomByCode(rawCode);
    if (!room) return { ok: false, error: 'Room not found.' };
    if (room.hostUserId !== userId) {
      return { ok: false, error: 'Only the host can start a rematch.' };
    }
    this.clearTimers(room);
    room.gameId = crypto.randomUUID();
    this.gameIdIndex.set(room.gameId, room.roomCode);
    room.status = 'LOBBY';
    room.roundNumber = 1;
    room.trickNumber = 0;
    room.moveNumber = 0;
    room.currentTurnPlayerId = null;
    room.turnDeadlineAt = null;
    room.leadingSuit = null;
    room.currentTrick = [];
    room.trickResolving = false;
    room.discardPile = [];
    room.moves = [];
    room.results = [];
    room.lastThullaEvent = null;
    room.players.forEach((p) => {
      p.hand = [];
      p.finishedRank = null;
      p.isThullaLoser = false;
      p.isReady = p.isHost || p.isBot;
    });
    room.lastEventMessage = 'Table reset for a rematch!';
    this.broadcast(room, 'GAME_STATE');
    return { ok: true, state: this.toPublicState(room, userId) };
  }

  attachSocket(roomCode: string, userId: string, ws: WebSocket): boolean {
    const room = this.getRoomByCode(roomCode);
    if (!room) return false;
    const player = room.players.find((p) => p.userId === userId);
    if (!player) return false;

    let set = room.sockets.get(userId);
    if (!set) {
      set = new Set();
      room.sockets.set(userId, set);
    }
    set.add(ws);
    const wasDisconnected = player.connectionStatus === 'DISCONNECTED';
    player.connectionStatus = 'CONNECTED';

    if (wasDisconnected) {
      room.lastEventMessage = `${player.username} reconnected.`;
      this.broadcast(room, 'PLAYER_RECONNECTED', { userId });
    } else {
      ws.send(
        JSON.stringify({
          type: 'GAME_STATE',
          payload: { state: this.toPublicState(room, userId) },
        })
      );
    }
    return true;
  }

  detachSocket(roomCode: string, userId: string, ws: WebSocket) {
    const room = this.getRoomByCode(roomCode);
    if (!room) return;
    const set = room.sockets.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) {
      room.sockets.delete(userId);
      const player = room.players.find((p) => p.userId === userId);
      if (player && room.status === 'PLAYING') {
        player.connectionStatus = 'DISCONNECTED';
        room.lastEventMessage = `${player.username} connection interrupted.`;
        this.broadcast(room, 'PLAYER_DISCONNECTED', { userId });
      }
    }
  }
}

export const gameManager = new ThullaGameManager();
