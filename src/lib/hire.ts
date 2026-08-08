import type { LorePin } from '@/types/world';
import {
  validateGuildPlacement,
  type Point,
} from '@/lib/world/placement';

export const ADVENTURER_PIN_ID = 'adventurer-node';

export type HireMotion = 'shrink' | 'portal' | 'burst';

export const HIRE_MOTIONS: {
  id: HireMotion;
  label: string;
  blurb: string;
}[] = [
  {
    id: 'shrink',
    label: 'Shrink',
    blurb: 'Collapse into a spark and slip across the channel.',
  },
  {
    id: 'portal',
    label: 'Portal',
    blurb: 'A teal rift opens — the adventurer steps through.',
  },
  {
    id: 'burst',
    label: 'Burst',
    blurb: 'A bright flare scatters, then reforms on Guild Shore.',
  },
];

export interface UnitedPersist {
  united: boolean;
  motion?: HireMotion;
  migratedCoords?: Point;
}

export function unitedStorageKey(worldId: string): string {
  return `realm-lore:united:${worldId}`;
}

export function loadUnitedState(worldId: string): UnitedPersist {
  if (typeof window === 'undefined') return { united: false };
  try {
    const raw = window.localStorage.getItem(unitedStorageKey(worldId));
    if (!raw) return { united: false };
    const parsed = JSON.parse(raw) as UnitedPersist;
    return {
      united: Boolean(parsed.united),
      motion: parsed.motion,
      migratedCoords: parsed.migratedCoords,
    };
  } catch {
    return { united: false };
  }
}

export function saveUnitedState(worldId: string, state: UnitedPersist): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      unitedStorageKey(worldId),
      JSON.stringify(state),
    );
  } catch {
    /* best-effort */
  }
}

/** Candidate spawn points on Guild Shore (prefer open land). */
const SPAWN_CANDIDATES: Point[] = [
  { x: 82, y: 32 },
  { x: 72, y: 28 },
  { x: 86, y: 42 },
  { x: 70, y: 55 },
  { x: 88, y: 58 },
  { x: 76, y: 72 },
  { x: 84, y: 78 },
  { x: 80, y: 40 },
  { x: 68, y: 48 },
  { x: 90, y: 50 },
];

export function findAllianceSpawn(
  guildPins: Pick<LorePin, 'coordinates' | 'id'>[],
  excludePinId = ADVENTURER_PIN_ID,
): Point {
  const others = guildPins.filter((p) => p.id !== excludePinId);
  for (const candidate of SPAWN_CANDIDATES) {
    if (!validateGuildPlacement(candidate, others)) {
      return candidate;
    }
  }
  // Fallback: nudge around candidates until valid
  for (const base of SPAWN_CANDIDATES) {
    for (let dx = -8; dx <= 8; dx += 2) {
      for (let dy = -8; dy <= 8; dy += 2) {
        const p = { x: base.x + dx, y: base.y + dy };
        if (!validateGuildPlacement(p, others)) return p;
      }
    }
  }
  return { x: 80, y: 36 };
}

export function homeUnitedState(): UnitedPersist {
  return { united: false };
}

/**
 * While `united` is true, adventurer pin is shown on Guild Shore.
 * Idle / dismissed state keeps the adventurer on the west isle.
 */
export function applyUnitedToPins(
  pins: LorePin[],
  united: UnitedPersist,
): LorePin[] {
  if (!united.united || !united.migratedCoords) return pins;

  return pins.map((pin) => {
    if (pin.id !== ADVENTURER_PIN_ID) return pin;
    return {
      ...pin,
      realm: 'company',
      coordinates: { ...united.migratedCoords! },
      subtitle: pin.subtitle.includes('Allied')
        ? pin.subtitle
        : `${pin.subtitle} · Allied`,
    };
  });
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
