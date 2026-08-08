import type { LorePin } from '@/types/world';

export const EASTER_EGG_PIN_ID = 'easter-egg-whispers';

/** Classic Konami: ↑ ↑ ↓ ↓ ← → ← → B A */
export const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
] as const;

export function secretsStorageKey(worldId: string): string {
  return `realm-lore:secrets:${worldId}`;
}

export function loadRevealedSecrets(worldId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(secretsStorageKey(worldId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function saveRevealedSecrets(worldId: string, ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      secretsStorageKey(worldId),
      JSON.stringify([...ids]),
    );
  } catch {
    /* best-effort */
  }
}

export function revealSecret(
  worldId: string,
  pinId: string,
  current: Set<string>,
): Set<string> {
  if (current.has(pinId)) return current;
  const next = new Set(current);
  next.add(pinId);
  saveRevealedSecrets(worldId, next);
  return next;
}

export function isSecretPin(pin: LorePin): boolean {
  return pin.category === 'easter_egg';
}

/** Pins shown in search / realm lists — hide unrevealed secrets. */
export function filterVisiblePins(
  pins: LorePin[],
  revealedSecrets: Set<string>,
): LorePin[] {
  return pins.filter(
    (pin) => !isSecretPin(pin) || revealedSecrets.has(pin.id),
  );
}
