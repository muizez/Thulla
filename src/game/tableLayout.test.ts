import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrderedTableSeats, getPolygonTableGeometry } from './tableLayout';
import type { RoomPlayer } from './types';

function makePlayers(count: number): RoomPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    userId: `u${i}`,
    username: `Player${i}`,
    avatar: 'ace',
    position: i,
    isHost: i === 0,
    isBot: i > 0,
    isReady: true,
    connectionStatus: 'CONNECTED',
    cardCount: 10,
    finishedRank: null,
    isThullaLoser: false,
  }));
}

test('getPolygonTableGeometry creates correct corner counts and shapes for 2-6 players', () => {
  assert.equal(getPolygonTableGeometry(2).shapeName, 'Head-to-Head');
  assert.equal(getPolygonTableGeometry(3).shapeName, 'Triangle');
  assert.equal(getPolygonTableGeometry(3).vertices.length, 3);
  assert.equal(getPolygonTableGeometry(4).shapeName, 'Square');
  assert.equal(getPolygonTableGeometry(4).vertices.length, 4);
  assert.equal(getPolygonTableGeometry(5).shapeName, 'Pentagon');
  assert.equal(getPolygonTableGeometry(5).vertices.length, 5);
  assert.equal(getPolygonTableGeometry(6).shapeName, 'Hexagon');
  assert.equal(getPolygonTableGeometry(6).vertices.length, 6);
});

test('getOrderedTableSeats places Self at bottom, After You on Left, and Before You on Right for 4 players', () => {
  const players = makePlayers(4); // Turn order: u0 -> u1 -> u2 -> u3 -> u0
  const { seats } = getOrderedTableSeats(players, 'u1', 'CLOCKWISE');

  assert.equal(seats[0].player.userId, 'u1');
  assert.equal(seats[0].relation, 'SELF');
  assert.equal(seats[0].xPercent, 50);
  assert.ok(seats[0].yPercent > 80);

  // u2 plays AFTER u1 -> must sit on LEFT (xPercent < 50)
  assert.equal(seats[1].player.userId, 'u2');
  assert.equal(seats[1].relation, 'AFTER_YOU');
  assert.ok(seats[1].xPercent < 30);

  // u3 sits across at TOP
  assert.equal(seats[2].player.userId, 'u3');
  assert.equal(seats[2].relation, 'ACROSS');
  assert.ok(seats[2].yPercent < 20);

  // u0 plays BEFORE u1 -> must sit on RIGHT (xPercent > 50)
  assert.equal(seats[3].player.userId, 'u0');
  assert.equal(seats[3].relation, 'BEFORE_YOU');
  assert.ok(seats[3].xPercent > 70);
});

test('getOrderedTableSeats respects COUNTER_CLOCKWISE turn direction while keeping After You on Left and Before You on Right', () => {
  const players = makePlayers(6); // Counter-clockwise from u2: u2 -> u1 -> u0 -> u5 -> u4 -> u3
  const { geometry, seats } = getOrderedTableSeats(
    players,
    'u2',
    'COUNTER_CLOCKWISE'
  );

  assert.equal(geometry.shapeName, 'Hexagon');
  assert.equal(seats[0].player.userId, 'u2');
  assert.equal(seats[1].player.userId, 'u1'); // After u2 in counter-clockwise
  assert.equal(seats[1].relation, 'AFTER_YOU');
  assert.ok(seats[1].xPercent < 30); // Left side

  assert.equal(seats[5].player.userId, 'u3'); // Before u2 in counter-clockwise
  assert.equal(seats[5].relation, 'BEFORE_YOU');
  assert.ok(seats[5].xPercent > 70); // Right side
});
