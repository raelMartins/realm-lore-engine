import { REALM_HIT_PATHS } from '@/config/realmHitPaths';
import type { LorePin } from '@/types/world';

export interface Point {
  x: number;
  y: number;
}

/** Minimum distance (map %) between guild pin centers. */
export const GUILD_PIN_MIN_DISTANCE = 7;

/** Soft rectangular gate before polygon (east isle). */
export const GUILD_BOUNDS = {
  minX: 56,
  maxX: 97,
  minY: 14,
  maxY: 98,
};

/** Soft ceiling for guild-shore pins (seed + charting). */
export const GUILD_PIN_CAP = 48;

/** Parse M/L path coordinates from realm hit SVG paths. */
export function parsePathPoints(d: string): Point[] {
  const points: Point[] = [];
  const re = /[ML]\s*([\d.]+)\s+([\d.]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(d)) !== null) {
    points.push({ x: Number(match[1]), y: Number(match[2]) });
  }
  return points;
}

const COMPANY_POLYGON = parsePathPoints(REALM_HIT_PATHS.company);

/** Ray-cast point-in-polygon in map % space. */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isOnGuildLand(point: Point): boolean {
  const { minX, maxX, minY, maxY } = GUILD_BOUNDS;
  if (
    point.x < minX ||
    point.x > maxX ||
    point.y < minY ||
    point.y > maxY
  ) {
    return false;
  }
  return pointInPolygon(point, COMPANY_POLYGON);
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function isTooCloseToExisting(
  point: Point,
  pins: Pick<LorePin, 'coordinates'>[],
  minDistance = GUILD_PIN_MIN_DISTANCE,
): boolean {
  return pins.some(
    (pin) =>
      distance(point, {
        x: pin.coordinates.x,
        y: pin.coordinates.y,
      }) < minDistance,
  );
}

export type PlacementError =
  | 'off_land'
  | 'too_close'
  | 'cap_reached'
  | 'invalid_coords';

export function validateGuildPlacement(
  point: Point,
  existingGuildPins: Pick<LorePin, 'coordinates'>[],
  options?: { checkSpacing?: boolean },
): PlacementError | null {
  const checkSpacing = options?.checkSpacing !== false;
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    point.x < 0 ||
    point.x > 100 ||
    point.y < 0 ||
    point.y > 100
  ) {
    return 'invalid_coords';
  }
  if (existingGuildPins.length >= GUILD_PIN_CAP) return 'cap_reached';
  if (!isOnGuildLand(point)) return 'off_land';
  // Spacing is enforced for seeds / spawn search; live charting may cluster.
  if (checkSpacing && isTooCloseToExisting(point, existingGuildPins)) {
    return 'too_close';
  }
  return null;
}

export const PLACEMENT_ERROR_MESSAGE: Record<PlacementError, string> = {
  off_land: 'Pins must be charted on Guild Shore land.',
  too_close: 'Too close to an existing pin — pick more open ground.',
  cap_reached: 'This realm has reached its pin charting limit.',
  invalid_coords: 'Invalid map coordinates.',
};
