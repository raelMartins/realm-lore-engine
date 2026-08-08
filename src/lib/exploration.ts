import type { LorePin } from '@/types/world';

/** Pins that contribute to exploration progress (easter eggs are bonus-only). */
export function isDiscoverablePin(pin: LorePin): boolean {
  return pin.category !== 'easter_egg';
}

export function getDiscoverablePins(pins: LorePin[]): LorePin[] {
  return pins.filter(isDiscoverablePin);
}

export function explorationStorageKey(worldId: string): string {
  return `realm-lore:exploration:${worldId}`;
}

export function loadExploredPinIds(worldId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(explorationStorageKey(worldId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function saveExploredPinIds(worldId: string, ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      explorationStorageKey(worldId),
      JSON.stringify([...ids]),
    );
  } catch {
    /* private mode / quota — progress is best-effort */
  }
}

export function clearExploredPinIds(worldId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(explorationStorageKey(worldId));
  } catch {
    /* private mode / quota — progress is best-effort */
  }
}

/**
 * Mark a pin explored if it is discoverable. Returns the updated set
 * (same reference if unchanged).
 */
export function markPinExplored(
  worldId: string,
  pin: LorePin,
  current: Set<string>,
): Set<string> {
  if (!isDiscoverablePin(pin) || current.has(pin.id)) return current;
  const next = new Set(current);
  next.add(pin.id);
  saveExploredPinIds(worldId, next);
  return next;
}

export function countExploredDiscoverable(
  pins: LorePin[],
  exploredIds: Set<string>,
): { explored: number; total: number } {
  const discoverable = getDiscoverablePins(pins);
  const total = discoverable.length;
  const explored = discoverable.filter((p) => exploredIds.has(p.id)).length;
  return { explored, total };
}
