import type {
  BotDifficulty,
  Card,
  GameRulesConfig,
  Rank,
  Suit,
  TrickPlay,
} from './types';

export const SUITS: Suit[] = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'];

export const RANKS: { rank: Rank; value: number }[] = [
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 11 },
  { rank: 'Q', value: 12 },
  { rank: 'K', value: 13 },
  { rank: 'A', value: 14 },
];

const SUIT_SHORT: Record<Suit, string> = {
  SPADES: 'S',
  HEARTS: 'H',
  DIAMONDS: 'D',
  CLUBS: 'C',
};

const SUIT_ORDER: Record<Suit, number> = {
  SPADES: 0,
  HEARTS: 1,
  CLUBS: 2,
  DIAMONDS: 3,
};

export function createStandardDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const { rank, value } of RANKS) {
      deck.push({
        id: `${rank}${SUIT_SHORT[suit]}`,
        suit,
        rank,
        value,
      });
    }
  }
  return deck;
}

export function shuffleDeck(
  deck: Card[],
  rng: () => number = Math.random
): Card[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    if (SUIT_ORDER[a.suit] !== SUIT_ORDER[b.suit]) {
      return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    }
    return a.value - b.value;
  });
}

export function dealCards(deck: Card[], playerCount: number): Card[][] {
  if (playerCount < 2 || playerCount > 6) {
    throw new Error('Thulla requires between 2 and 6 players.');
  }
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  deck.forEach((card, index) => {
    hands[index % playerCount].push(card);
  });
  return hands.map(sortHand);
}

export function determineStartingPlayerIndex(
  hands: Card[][],
  rules: GameRulesConfig,
  hostIndex = 0,
  rng: () => number = Math.random
): number {
  if (rules.firstPlayerSelection === 'HOST') {
    return hostIndex >= 0 && hostIndex < hands.length ? hostIndex : 0;
  }
  if (rules.firstPlayerSelection === 'RANDOM') {
    return Math.floor(rng() * hands.length) % hands.length;
  }
  const idx = hands.findIndex((hand) =>
    hand.some((c) => c.id === rules.startingCardId)
  );
  return idx >= 0 ? idx : 0;
}

export function getLegalCards(
  hand: Card[],
  leadingSuit: Suit | null,
  rules: GameRulesConfig,
  isVeryFirstMoveOfGame: boolean
): Card[] {
  if (hand.length === 0) return [];

  if (
    isVeryFirstMoveOfGame &&
    rules.firstPlayerSelection === 'STARTING_CARD' &&
    rules.mustPlayStartingCardOnFirstTurn
  ) {
    const starter = hand.find((c) => c.id === rules.startingCardId);
    if (starter) return [starter];
  }

  if (!leadingSuit || !rules.followSuitRequired) {
    return hand;
  }

  const matching = hand.filter((c) => c.suit === leadingSuit);
  if (matching.length > 0) {
    return matching;
  }

  // Player has none of leadingSuit -> any off-suit card is legal
  return hand;
}

export function validateCardPlay(
  hand: Card[],
  cardId: string,
  leadingSuit: Suit | null,
  rules: GameRulesConfig,
  isVeryFirstMoveOfGame: boolean
): { ok: true; card: Card; isOffSuit: boolean } | { ok: false; error: string } {
  const card = hand.find((c) => c.id === cardId);
  if (!card) {
    return { ok: false, error: 'Selected card is not in your hand.' };
  }

  const legal = getLegalCards(
    hand,
    leadingSuit,
    rules,
    isVeryFirstMoveOfGame
  );
  const isLegal = legal.some((c) => c.id === card.id);
  if (!isLegal) {
    if (
      isVeryFirstMoveOfGame &&
      rules.firstPlayerSelection === 'STARTING_CARD' &&
      rules.mustPlayStartingCardOnFirstTurn
    ) {
      return {
        ok: false,
        error: `Opening move must play ${rules.startingCardId}.`,
      };
    }
    return {
      ok: false,
      error: `You must follow the leading suit (${leadingSuit}).`,
    };
  }

  const isOffSuit = leadingSuit !== null && card.suit !== leadingSuit;
  return { ok: true, card, isOffSuit };
}

export function getHighestLeadSuitPlay(
  trick: TrickPlay[],
  leadingSuit: Suit
): TrickPlay | null {
  const leadPlays = trick.filter((play) => play.card.suit === leadingSuit);
  if (leadPlays.length === 0) return null;
  return leadPlays.reduce((highest, current) =>
    current.card.value > highest.card.value ? current : highest
  );
}

export function getNextActivePlayerIndex(
  currentIndex: number,
  activeFlags: boolean[],
  direction: GameRulesConfig['turnDirection']
): number {
  const n = activeFlags.length;
  const step = direction === 'COUNTER_CLOCKWISE' ? -1 : 1;
  for (let offset = 1; offset <= n; offset++) {
    const idx = (currentIndex + offset * step + n * 10) % n;
    if (activeFlags[idx]) return idx;
  }
  return currentIndex;
}

export interface TrickResolutionResult {
  trickComplete: boolean;
  wasThullaPickup: boolean;
  pickupPlayerId: string | null;
  nextLeaderId: string | null;
  cardsToPickup: Card[];
}

export function evaluateTrickState(input: {
  trick: TrickPlay[];
  leadingSuit: Suit;
  trickNumber: number;
  activePlayerCountAtTrickStart: number;
  rules: GameRulesConfig;
  lastPlayWasOffSuit: boolean;
}): TrickResolutionResult {
  const {
    trick,
    leadingSuit,
    trickNumber,
    activePlayerCountAtTrickStart,
    rules,
    lastPlayWasOffSuit,
  } = input;

  const isSafeFirstTrick = trickNumber === 1 && rules.firstTrickSafe;
  const highestLead = getHighestLeadSuitPlay(trick, leadingSuit);
  const anyOffSuitInTrick = trick.some((p) => p.isOffSuit);

  // Immediate Thulla pickup stops the trick on the spot
  if (
    lastPlayWasOffSuit &&
    !isSafeFirstTrick &&
    rules.offSuitBehavior === 'IMMEDIATE_THULLA_PICKUP'
  ) {
    return {
      trickComplete: true,
      wasThullaPickup: true,
      pickupPlayerId: highestLead?.playerId ?? trick[0].playerId,
      nextLeaderId: highestLead?.playerId ?? trick[0].playerId,
      cardsToPickup: trick.map((t) => t.card),
    };
  }

  // Wait until all active players in this trick have played
  if (trick.length < activePlayerCountAtTrickStart) {
    return {
      trickComplete: false,
      wasThullaPickup: false,
      pickupPlayerId: null,
      nextLeaderId: null,
      cardsToPickup: [],
    };
  }

  // All active players have played
  if (
    anyOffSuitInTrick &&
    !isSafeFirstTrick &&
    rules.offSuitBehavior === 'COMPLETE_TRICK_THEN_PICKUP'
  ) {
    return {
      trickComplete: true,
      wasThullaPickup: true,
      pickupPlayerId: highestLead?.playerId ?? trick[0].playerId,
      nextLeaderId: highestLead?.playerId ?? trick[0].playerId,
      cardsToPickup: trick.map((t) => t.card),
    };
  }

  // Clean trick (or safe first trick / discard mode)
  return {
    trickComplete: true,
    wasThullaPickup: false,
    pickupPlayerId: null,
    nextLeaderId: highestLead?.playerId ?? trick[0].playerId,
    cardsToPickup: [],
  };
}

export function chooseBotCard(input: {
  hand: Card[];
  leadingSuit: Suit | null;
  currentTrick: TrickPlay[];
  rules: GameRulesConfig;
  difficulty: BotDifficulty;
  isVeryFirstMoveOfGame: boolean;
  rng?: () => number;
}): Card {
  const {
    hand,
    leadingSuit,
    currentTrick,
    rules,
    difficulty,
    isVeryFirstMoveOfGame,
    rng = Math.random,
  } = input;

  const legal = getLegalCards(
    hand,
    leadingSuit,
    rules,
    isVeryFirstMoveOfGame
  );
  if (legal.length <= 1) return legal[0];

  if (difficulty === 'EASY') {
    const idx = Math.floor(rng() * legal.length) % legal.length;
    return legal[idx];
  }

  const sortedAsc = [...legal].sort((a, b) => a.value - b.value);
  const sortedDesc = [...legal].sort((a, b) => b.value - a.value);

  // Leading a trick
  if (!leadingSuit) {
    if (difficulty === 'HARD') {
      // Lead from longest suit with a mid-low card to retain control & avoid immediate void traps
      const suitCounts = new Map<Suit, number>();
      for (const c of legal) {
        suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
      }
      const bestSuit = [...suitCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const inBest = sortedAsc.filter((c) => c.suit === bestSuit);
      return inBest[Math.floor(inBest.length / 3)] ?? sortedAsc[0];
    }
    // Medium: lead lowest card
    return sortedAsc[0];
  }

  // Following suit cleanly
  const matchingSuit = legal.every((c) => c.suit === leadingSuit);
  if (matchingSuit) {
    const currentHigh = getHighestLeadSuitPlay(currentTrick, leadingSuit);
    const highValue = currentHigh?.card.value ?? 0;

    if (difficulty === 'MEDIUM') {
      // Play highest card strictly under currentHigh if available, else lowest card
      const under = sortedDesc.filter((c) => c.value < highValue);
      if (under.length > 0) return under[0];
      return sortedAsc[0];
    }

    // HARD: Duck with highest safe card below highValue; if forced over, play lowest over (or highest if safe last seat)
    const under = sortedDesc.filter((c) => c.value < highValue);
    if (under.length > 0) return under[0];
    return sortedAsc[0];
  }

  // Off-suit THULLA play! Shed highest dangerous card (A, K, Q) from short suits
  if (difficulty === 'HARD') {
    const suitCounts = new Map<Suit, number>();
    for (const c of hand) {
      suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
    }
    const ranked = [...legal].sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return (suitCounts.get(a.suit) ?? 0) - (suitCounts.get(b.suit) ?? 0);
    });
    return ranked[0];
  }

  // MEDIUM off-suit: drop highest card
  return sortedDesc[0];
}

export function generateRoomCode(existingCodes?: Set<string>): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 40; i++) {
    let code = '';
    for (let k = 0; k < 6; k++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    if (!existingCodes || !existingCodes.has(code)) return code;
  }
  return `TH${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export function validateGameRules(
  patch: Partial<GameRulesConfig>,
  base: GameRulesConfig
): GameRulesConfig {
  const clampTimer = (v: unknown, def: number) => {
    const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : def;
    return Math.min(120, Math.max(0, n));
  };
  return {
    presetName:
      typeof patch.presetName === 'string' && patch.presetName.trim()
        ? patch.presetName.trim().slice(0, 40)
        : base.presetName,
    firstPlayerSelection:
      patch.firstPlayerSelection === 'STARTING_CARD' ||
      patch.firstPlayerSelection === 'HOST' ||
      patch.firstPlayerSelection === 'RANDOM'
        ? patch.firstPlayerSelection
        : base.firstPlayerSelection,
    startingCardId:
      typeof patch.startingCardId === 'string' && /^[2-9JQKA]|10[SHDC]$/.test(patch.startingCardId)
        ? patch.startingCardId
        : typeof patch.startingCardId === 'string' && /^(10|[2-9JQKA])[SHDC]$/.test(patch.startingCardId)
          ? patch.startingCardId
          : base.startingCardId,
    mustPlayStartingCardOnFirstTurn:
      typeof patch.mustPlayStartingCardOnFirstTurn === 'boolean'
        ? patch.mustPlayStartingCardOnFirstTurn
        : base.mustPlayStartingCardOnFirstTurn,
    turnDirection:
      patch.turnDirection === 'CLOCKWISE' ||
      patch.turnDirection === 'COUNTER_CLOCKWISE'
        ? patch.turnDirection
        : base.turnDirection,
    followSuitRequired:
      typeof patch.followSuitRequired === 'boolean'
        ? patch.followSuitRequired
        : base.followSuitRequired,
    offSuitBehavior:
      patch.offSuitBehavior === 'IMMEDIATE_THULLA_PICKUP' ||
      patch.offSuitBehavior === 'COMPLETE_TRICK_THEN_PICKUP' ||
      patch.offSuitBehavior === 'DISCARD_WITHOUT_PICKUP'
        ? patch.offSuitBehavior
        : base.offSuitBehavior,
    firstTrickSafe:
      typeof patch.firstTrickSafe === 'boolean'
        ? patch.firstTrickSafe
        : base.firstTrickSafe,
    trickCollectionBehavior:
      patch.trickCollectionBehavior === 'DISCARD_PILE' ||
      patch.trickCollectionBehavior === 'HOLDER_KEEPS_COUNT'
        ? patch.trickCollectionBehavior
        : base.trickCollectionBehavior,
    eliminationRule:
      patch.eliminationRule === 'IMMEDIATE_ESCAPE' ||
      patch.eliminationRule === 'END_OF_TRICK_ESCAPE'
        ? patch.eliminationRule
        : base.eliminationRule,
    gameEndingCondition:
      patch.gameEndingCondition === 'LAST_PLAYER_STANDING' ||
      patch.gameEndingCondition === 'FIRST_WINNER'
        ? patch.gameEndingCondition
        : base.gameEndingCondition,
    tieHandling:
      patch.tieHandling === 'FEWEST_CARDS' ||
      patch.tieHandling === 'LOWEST_HIGH_CARD'
        ? patch.tieHandling
        : base.tieHandling,
    turnTimerSeconds: clampTimer(patch.turnTimerSeconds, base.turnTimerSeconds),
  };
}
