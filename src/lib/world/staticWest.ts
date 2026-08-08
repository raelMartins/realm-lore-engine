import { defaultWorldData } from '@/config/defaultWorld';
import type { CompanyLoreConfig, LorePin } from '@/types/world';

/** West-isle pins always live in the repo (adventurer content). */
export function getStaticWestPins(): LorePin[] {
  return defaultWorldData.pins.filter((pin) => pin.realm === 'adventurer');
}

/** East-isle seed used when a world row has no guild pins yet. */
export function getDefaultEastPins(): LorePin[] {
  return defaultWorldData.pins.filter((pin) => pin.realm === 'company');
}

export function getDefaultWorldMeta(): Omit<CompanyLoreConfig, 'pins'> {
  const { pins: _pins, ...meta } = defaultWorldData;
  return meta;
}
