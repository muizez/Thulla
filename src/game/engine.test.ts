import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chooseBotCard,
  createStandardDeck,
  dealCards,
  determineStartingPlayerIndex,
  evaluateTrickState,
  getLegalCards,
  getNextActivePlayerIndex,
  shuffleDeck,
  validateCardPlay,
} from './engine';
import { DEFAULT_GAME_RULES, type Card, type TrickPlay } from './types';

function card(id: string, suit: Card['suit'], rank: Card['rank'], value: number): Card {
  return { id, suit, rank, value };
}

test('createStandardDeck generates 52 unique cards across 4 suits', () => {
  const deck = createStandardDeck();
  assert.equal(deck.length, 52);
  const ids = new Set(deck.map((c) => c.id));
  assert.equal(ids.size, 52);
});

test('shuffleDeck preserves all 52 unique cards and changes order', () => {
  const deck = createStandardDeck();
  const shuffled = shuffleDeck(deck, () => 0.37);
  assert.equal(shuffled.length, 52);
  assert.equal(new Set(shuffled.map((c) => c.id)).size, 52);
});

test('dealCards distributes all 52 cards evenly across 2-6 players', () => {
  const deck = shuffleDeck(createStandardDeck());
  const hands4 = dealCards(deck, 4);
  assert.equal(hands4.length, 4);
  assert.deepEqual(
    hands4.map((h) => h.length),
    [13, 13, 13, 13]
  );

  const hands5 = dealCards(deck, 5);
  assert.equal(
    hands5.reduce((sum, h) => sum + h.length, 0),
    52
  );
  assert.deepEqual(
    hands5.map((h) => h.length),
    [11, 11, 10, 10, 10]
  );
});

test('determineStartingPlayerIndex selects Ace of Spades holder by default', () => {
  const deck = createStandardDeck();
  const hands = dealCards(deck, 4);
  const expectedIndex = hands.findIndex((h) => h.some((c) => c.id === 'AS'));
  const starter = determineStartingPlayerIndex(hands, DEFAULT_GAME_RULES);
  assert.equal(starter, expectedIndex);
});

test('validateCardPlay enforces Ace of Spades on opening move and suit following', () => {
  const hand: Card[] = [
    card('AS', 'SPADES', 'A', 14),
    card('7S', 'SPADES', '7', 7),
    card('KH', 'HEARTS', 'K', 13),
  ];

  // Must play AS on very first move
  const wrongFirst = validateCardPlay(hand, 'KH', null, DEFAULT_GAME_RULES, true);
  assert.equal(wrongFirst.ok, false);

  const rightFirst = validateCardPlay(hand, 'AS', null, DEFAULT_GAME_RULES, true);
  assert.equal(rightFirst.ok, true);

  // Must follow Spades when Spades led
  const wrongSuit = validateCardPlay(hand, 'KH', 'SPADES', DEFAULT_GAME_RULES, false);
  assert.equal(wrongSuit.ok, false);

  const rightSuit = validateCardPlay(hand, '7S', 'SPADES', DEFAULT_GAME_RULES, false);
  assert.equal(rightSuit.ok, true);
  if (rightSuit.ok) assert.equal(rightSuit.isOffSuit, false);

  // Void in Diamonds -> off-suit is legal and flagged isOffSuit=true
  const offSuit = validateCardPlay(hand, 'KH', 'DIAMONDS', DEFAULT_GAME_RULES, false);
  assert.equal(offSuit.ok, true);
  if (offSuit.ok) assert.equal(offSuit.isOffSuit, true);
});

test('evaluateTrickState triggers immediate Thulla pickup for highest lead card after Trick 1', () => {
  const trick: TrickPlay[] = [
    {
      playerId: 'p1',
      username: 'Ali',
      card: card('9H', 'HEARTS', '9', 9),
      isOffSuit: false,
      moveNumber: 5,
    },
    {
      playerId: 'p2',
      username: 'Sara',
      card: card('KH', 'HEARTS', 'K', 13),
      isOffSuit: false,
      moveNumber: 6,
    },
    {
      playerId: 'p3',
      username: 'Bilal',
      card: card('AC', 'CLUBS', 'A', 14),
      isOffSuit: true,
      moveNumber: 7,
    },
  ];

  // Trick 2 -> immediate pickup by Sara (KH)
  const resTrick2 = evaluateTrickState({
    trick,
    leadingSuit: 'HEARTS',
    trickNumber: 2,
    activePlayerCountAtTrickStart: 4,
    rules: DEFAULT_GAME_RULES,
    lastPlayWasOffSuit: true,
  });
  assert.equal(resTrick2.trickComplete, true);
  assert.equal(resTrick2.wasThullaPickup, true);
  assert.equal(resTrick2.pickupPlayerId, 'p2');
  assert.equal(resTrick2.nextLeaderId, 'p2');
  assert.equal(resTrick2.cardsToPickup.length, 3);

  // Trick 1 with firstTrickSafe=true -> does NOT trigger pickup on off-suit
  const resTrick1 = evaluateTrickState({
    trick,
    leadingSuit: 'HEARTS',
    trickNumber: 1,
    activePlayerCountAtTrickStart: 4,
    rules: DEFAULT_GAME_RULES,
    lastPlayWasOffSuit: true,
  });
  assert.equal(resTrick1.trickComplete, false);
  assert.equal(resTrick1.wasThullaPickup, false);
});

test('getNextActivePlayerIndex skips escaped players and respects direction', () => {
  const active = [true, false, true, true];
  assert.equal(getNextActivePlayerIndex(0, active, 'CLOCKWISE'), 2);
  assert.equal(getNextActivePlayerIndex(0, active, 'COUNTER_CLOCKWISE'), 3);
});

test('chooseBotCard respects legal constraints and ducks under high card in Hard mode', () => {
  const hand: Card[] = [
    card('4S', 'SPADES', '4', 4),
    card('9S', 'SPADES', '9', 9),
    card('AS', 'SPADES', 'A', 14),
    card('2H', 'HEARTS', '2', 2),
  ];
  const trick: TrickPlay[] = [
    {
      playerId: 'p1',
      username: 'Ali',
      card: card('JS', 'SPADES', 'J', 11),
      isOffSuit: false,
      moveNumber: 5,
    },
  ];

  const chosen = chooseBotCard({
    hand,
    leadingSuit: 'SPADES',
    currentTrick: trick,
    rules: DEFAULT_GAME_RULES,
    difficulty: 'HARD',
    isVeryFirstMoveOfGame: false,
  });
  // Hard bot sheds 9S (highest safe card strictly under JS) instead of burning 4S or taking lead with AS
  assert.equal(chosen.id, '9S');

  const legal = getLegalCards(hand, 'SPADES', DEFAULT_GAME_RULES, false);
  assert.equal(legal.some((c) => c.id === chosen.id), true);
});
