export type Suit = 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';

export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export interface Card {
  id: string; // e.g. "AS", "10H", "KD"
  suit: Suit;
  rank: Rank;
  value: number; // 2..14
}

export type GameMode = 'FRIENDS' | 'BOTS' | 'ONLINE';
export type BotDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type RoomStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export type FirstPlayerSelection = 'STARTING_CARD' | 'HOST' | 'RANDOM';
export type TurnDirection = 'CLOCKWISE' | 'COUNTER_CLOCKWISE';
export type OffSuitBehavior =
  | 'IMMEDIATE_THULLA_PICKUP'
  | 'COMPLETE_TRICK_THEN_PICKUP'
  | 'DISCARD_WITHOUT_PICKUP';
export type TrickCollectionBehavior = 'DISCARD_PILE' | 'HOLDER_KEEPS_COUNT';
export type EliminationRule = 'IMMEDIATE_ESCAPE' | 'END_OF_TRICK_ESCAPE';
export type GameEndingCondition = 'LAST_PLAYER_STANDING' | 'FIRST_WINNER';
export type TieHandling = 'FEWEST_CARDS' | 'LOWEST_HIGH_CARD';

export interface GameRulesConfig {
  presetName: string;
  firstPlayerSelection: FirstPlayerSelection;
  startingCardId: string; // e.g. "AS"
  mustPlayStartingCardOnFirstTurn: boolean;
  turnDirection: TurnDirection;
  followSuitRequired: boolean;
  offSuitBehavior: OffSuitBehavior;
  firstTrickSafe: boolean;
  trickCollectionBehavior: TrickCollectionBehavior;
  eliminationRule: EliminationRule;
  gameEndingCondition: GameEndingCondition;
  tieHandling: TieHandling;
  turnTimerSeconds: number;
}

export const DEFAULT_GAME_RULES: GameRulesConfig = {
  presetName: 'Traditional Thulla (Bhabhi)',
  firstPlayerSelection: 'STARTING_CARD',
  startingCardId: 'AS',
  mustPlayStartingCardOnFirstTurn: true,
  turnDirection: 'CLOCKWISE',
  followSuitRequired: true,
  offSuitBehavior: 'IMMEDIATE_THULLA_PICKUP',
  firstTrickSafe: true,
  trickCollectionBehavior: 'DISCARD_PILE',
  eliminationRule: 'IMMEDIATE_ESCAPE',
  gameEndingCondition: 'LAST_PLAYER_STANDING',
  tieHandling: 'FEWEST_CARDS',
  turnTimerSeconds: 30,
};

export const RULE_PRESETS: Record<string, GameRulesConfig> = {
  'Traditional Thulla (Bhabhi)': DEFAULT_GAME_RULES,
  'Strict No-Mercy Thulla': {
    ...DEFAULT_GAME_RULES,
    presetName: 'Strict No-Mercy Thulla',
    firstTrickSafe: false,
    offSuitBehavior: 'IMMEDIATE_THULLA_PICKUP',
    turnTimerSeconds: 20,
  },
  'Hostel Quick Match': {
    ...DEFAULT_GAME_RULES,
    presetName: 'Hostel Quick Match',
    offSuitBehavior: 'COMPLETE_TRICK_THEN_PICKUP',
    gameEndingCondition: 'FIRST_WINNER',
    turnTimerSeconds: 25,
  },
  'Casual Suit-Follow': {
    ...DEFAULT_GAME_RULES,
    presetName: 'Casual Suit-Follow',
    offSuitBehavior: 'DISCARD_WITHOUT_PICKUP',
    firstTrickSafe: true,
    turnTimerSeconds: 30,
  },
};

export interface AvatarOption {
  id: string;
  label: string;
  accent: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'ace', label: 'Ace of Spades', accent: '#F59E0B' },
  { id: 'chai', label: 'Chai Captain', accent: '#EAB308' },
  { id: 'crown', label: 'Nawab Crown', accent: '#10B981' },
  { id: 'falcon', label: 'Shaheen', accent: '#38BDF8' },
  { id: 'lotus', label: 'Royal Diamond', accent: '#F43F5E' },
  { id: 'owl', label: 'Hostel Owl', accent: '#A855F7' },
  { id: 'tigers', label: 'Sher-e-Table', accent: '#FB923C' },
  { id: 'joker', label: 'Card Shark', accent: '#22C55E' },
];

export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  avatar: string;
  isGuest: boolean;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winPercentage: number;
  bestStreak: number;
  currentStreak: number;
  rank: number;
  createdAt: number;
}

export interface RoomPlayer {
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
  cardCount: number;
  finishedRank: number | null; // 1 = first escaped, etc.
  isThullaLoser: boolean;
}

export interface TrickPlay {
  playerId: string;
  username: string;
  card: Card;
  isOffSuit: boolean;
  moveNumber: number;
}

export interface GameMoveRecord {
  moveNumber: number;
  trickNumber: number;
  playerId: string;
  username: string;
  cardId: string;
  suit: Suit;
  rank: Rank;
  isOffSuit: boolean;
  note: string;
  timestamp: number;
}

export interface PlayerResultSummary {
  playerId: string;
  userId: string;
  username: string;
  avatar: string;
  isBot: boolean;
  finalPosition: number;
  result: 'ESCAPED' | 'WINNER' | 'THULLA';
  score: number;
  cardsRemaining: number;
}

export interface PublicGameState {
  gameId: string;
  roomCode: string;
  roomName: string;
  mode: GameMode;
  status: RoomStatus;
  hostId: string;
  maxPlayers: number;
  botCount: number;
  botDifficulty: BotDifficulty;
  rules: GameRulesConfig;
  players: RoomPlayer[];
  // Private hand strictly for the requesting player ONLY
  myHand: Card[];
  playableCardIds: string[];
  // Table state
  roundNumber: number;
  trickNumber: number;
  moveNumber: number;
  currentTurnPlayerId: string | null;
  turnDeadlineAt: number | null;
  leadingSuit: Suit | null;
  currentTrick: TrickPlay[];
  discardCount: number;
  lastEventMessage: string;
  lastThullaEvent: {
    victimId: string;
    victimName: string;
    culpritName: string;
    cardsPickedUp: number;
    timestamp: number;
  } | null;
  recentMoves: GameMoveRecord[];
  results: PlayerResultSummary[];
}

export interface PublicRoomSummary {
  roomCode: string;
  roomName: string;
  hostName: string;
  mode: GameMode;
  status: RoomStatus;
  playerCount: number;
  maxPlayers: number;
  botCount: number;
  presetName: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winPercentage: number;
  bestStreak: number;
}

export interface MatchHistoryItem {
  sessionId: string;
  roomCode: string;
  roomName: string;
  mode: GameMode;
  winnerName: string;
  thullaLoserName: string;
  playerCount: number;
  totalMoves: number;
  startedAt: number;
  endedAt: number;
  results: PlayerResultSummary[];
}

export type ServerEventType =
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'PLAYER_READY'
  | 'GAME_STARTED'
  | 'CARD_PLAYED'
  | 'TURN_CHANGED'
  | 'TRICK_COMPLETED'
  | 'PLAYER_FINISHED'
  | 'GAME_FINISHED'
  | 'PLAYER_DISCONNECTED'
  | 'PLAYER_RECONNECTED'
  | 'RULES_UPDATED'
  | 'ROOM_CLOSED'
  | 'GAME_STATE'
  | 'ERROR';
