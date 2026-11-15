import type { GameRulesConfig, RoomPlayer } from './types';

export type SeatRelation = 'SELF' | 'AFTER_YOU' | 'ACROSS' | 'BEFORE_YOU';

export interface OrderedTableSeat {
  player: RoomPlayer;
  stepIndex: number;
  relation: SeatRelation;
  xPercent: number;
  yPercent: number;
  cornerXSvg: number;
  cornerYSvg: number;
}

export interface TableGeometry {
  playerCount: number;
  shapeName: 'Head-to-Head' | 'Triangle' | 'Square' | 'Pentagon' | 'Hexagon';
  svgViewBoxWidth: number;
  svgViewBoxHeight: number;
  outerPath: string;
  innerTrimPath: string;
  vertices: { x: number; y: number }[];
  turnArcPaths: string[];
  seatCoordinates: {
    xPercent: number;
    yPercent: number;
    cornerXSvg: number;
    cornerYSvg: number;
  }[];
}

const VIEW_W = 800;
const VIEW_H = 480;

/**
 * Computes a rounded SVG polygon path from ordered vertices.
 */
export function buildRoundedPolygonPath(
  points: { x: number; y: number }[],
  cornerRadius = 28
): string {
  const n = points.length;
  if (n < 3) return '';

  const segments: string[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const len1 = Math.hypot(v1x, v1y) || 1;

    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len2 = Math.hypot(v2x, v2y) || 1;

    const r = Math.min(cornerRadius, len1 * 0.35, len2 * 0.35);

    const pStart = {
      x: curr.x + (v1x / len1) * r,
      y: curr.y + (v1y / len1) * r,
    };
    const pEnd = {
      x: curr.x + (v2x / len2) * r,
      y: curr.y + (v2y / len2) * r,
    };

    if (i === 0) {
      segments.push(`M ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)}`);
    } else {
      segments.push(`L ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)}`);
    }
    segments.push(
      `Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${pEnd.x.toFixed(1)} ${pEnd.y.toFixed(1)}`
    );
  }

  segments.push('Z');
  return segments.join(' ');
}

/**
 * Generates corner-aligned polygon table geometry for 2..6 players.
 * Vertex 0 is always Bottom Center (You), Vertex 1 goes Left (After You),
 * continuing clockwise around the table to Vertex N-1 on the Right (Before You).
 */
export function getPolygonTableGeometry(rawCount: number): TableGeometry {
  const playerCount = Math.min(6, Math.max(2, rawCount));

  const shapeNames: Record<number, TableGeometry['shapeName']> = {
    2: 'Head-to-Head',
    3: 'Triangle',
    4: 'Square',
    5: 'Pentagon',
    6: 'Hexagon',
  };

  if (playerCount === 2) {
    const outerPath =
      'M 230 68 H 570 A 172 172 0 0 1 570 412 H 230 A 172 172 0 0 1 230 68 Z';
    const innerTrimPath =
      'M 236 82 H 564 A 158 158 0 0 1 564 398 H 236 A 158 158 0 0 1 236 82 Z';
    return {
      playerCount: 2,
      shapeName: 'Head-to-Head',
      svgViewBoxWidth: VIEW_W,
      svgViewBoxHeight: VIEW_H,
      outerPath,
      innerTrimPath,
      vertices: [
        { x: 400, y: 412 },
        { x: 400, y: 68 },
      ],
      turnArcPaths: ['M 240 310 Q 190 240 240 170', 'M 560 170 Q 610 240 560 310'],
      seatCoordinates: [
        { xPercent: 50, yPercent: 90, cornerXSvg: 400, cornerYSvg: 412 },
        { xPercent: 50, yPercent: 10, cornerXSvg: 400, cornerYSvg: 68 },
      ],
    };
  }

  const cx = VIEW_W / 2; // 400
  const cy = VIEW_H / 2; // 240
  const yOffset = playerCount === 3 ? 28 : 0;

  const outerRx = playerCount === 3 ? 250 : playerCount === 4 ? 236 : 240;
  const outerRy = playerCount === 3 ? 176 : 178;
  const innerRx = outerRx - 15;
  const innerRy = outerRy - 13;

  // Seat anchors sit right on each corner outside the inner felt so trick cards stay 100% clear
  const seatRx = outerRx + 64;
  const seatRy = outerRy + 16;

  const outerVertices: { x: number; y: number }[] = [];
  const innerVertices: { x: number; y: number }[] = [];
  const seatCoordinates: TableGeometry['seatCoordinates'] = [];

  for (let i = 0; i < playerCount; i++) {
    // 90 deg = bottom (+y down); increasing angle rotates clockwise: Bottom -> Left -> Top -> Right
    const angleDeg = 90 + (i * 360) / playerCount;
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const vx = cx + outerRx * cos;
    const vy = cy + yOffset + outerRy * sin;
    outerVertices.push({ x: vx, y: vy });
    innerVertices.push({
      x: cx + innerRx * cos,
      y: cy + yOffset + innerRy * sin,
    });

    const rawSeatX = ((cx + seatRx * cos) / VIEW_W) * 100;
    const rawSeatY = ((cy + yOffset + seatRy * sin) / VIEW_H) * 100;
    const clampedX = Math.min(89, Math.max(11, rawSeatX));
    const clampedY = Math.min(91, Math.max(9, rawSeatY));

    seatCoordinates.push({
      xPercent: Math.round(clampedX * 10) / 10,
      yPercent: Math.round(clampedY * 10) / 10,
      cornerXSvg: Math.round(vx),
      cornerYSvg: Math.round(vy),
    });
  }

  // Subtle turn-flow arrows inside each edge of the polygon (clockwise: corner i -> corner i+1)
  const turnArcPaths: string[] = [];
  for (let i = 0; i < playerCount; i++) {
    const a = innerVertices[i];
    const b = innerVertices[(i + 1) % playerCount];
    // Move slightly inward toward table center so arrow sits neatly inside the gold trim
    const ax = a.x + (cx - a.x) * 0.14;
    const ay = a.y + (cy + yOffset - a.y) * 0.14;
    const bx = b.x + (cx - b.x) * 0.14;
    const by = b.y + (cy + yOffset - b.y) * 0.14;
    const p1 = { x: ax + (bx - ax) * 0.3, y: ay + (by - ay) * 0.3 };
    const p2 = { x: ax + (bx - ax) * 0.7, y: ay + (by - ay) * 0.7 };
    turnArcPaths.push(
      `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    );
  }

  const cornerRadius = playerCount === 4 ? 26 : 24;

  return {
    playerCount,
    shapeName: shapeNames[playerCount],
    svgViewBoxWidth: VIEW_W,
    svgViewBoxHeight: VIEW_H,
    outerPath: buildRoundedPolygonPath(outerVertices, cornerRadius),
    innerTrimPath: buildRoundedPolygonPath(innerVertices, cornerRadius - 4),
    vertices: outerVertices,
    turnArcPaths,
    seatCoordinates,
  };
}

/**
 * Orders players starting with the viewing user (step 0, Bottom corner),
 * then following turn order so:
 * - step 1 (plays AFTER you) sits on the LEFT
 * - step N-1 (plays BEFORE you) sits on the RIGHT
 */
export function getOrderedTableSeats(
  players: RoomPlayer[],
  currentUserId: string,
  turnDirection: GameRulesConfig['turnDirection']
): { geometry: TableGeometry; seats: OrderedTableSeat[] } {
  const n = players.length;
  const geometry = getPolygonTableGeometry(n);
  if (n === 0) {
    return { geometry, seats: [] };
  }

  const myIndex = Math.max(
    0,
    players.findIndex((p) => p.userId === currentUserId)
  );
  const stepDir = turnDirection === 'COUNTER_CLOCKWISE' ? -1 : 1;

  const seats: OrderedTableSeat[] = [];
  for (let i = 0; i < n; i++) {
    const playerIdx = (myIndex + i * stepDir + n * 10) % n;
    const player = players[playerIdx];
    const coord = geometry.seatCoordinates[i] ?? {
      xPercent: 50,
      yPercent: 15,
      cornerXSvg: 400,
      cornerYSvg: 80,
    };

    let relation: SeatRelation = 'ACROSS';
    if (i === 0) {
      relation = 'SELF';
    } else if (n === 2) {
      relation = 'ACROSS';
    } else if (i === 1) {
      relation = 'AFTER_YOU';
    } else if (i === n - 1) {
      relation = 'BEFORE_YOU';
    }

    seats.push({
      player,
      stepIndex: i,
      relation,
      xPercent: coord.xPercent,
      yPercent: coord.yPercent,
      cornerXSvg: coord.cornerXSvg,
      cornerYSvg: coord.cornerYSvg,
    });
  }

  return { geometry, seats };
}
