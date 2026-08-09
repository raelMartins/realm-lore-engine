import { CompanyLoreConfig, LorePin, PinType, RealmSide } from '@/types/world';
import { defaultWorldData } from '@/config/defaultWorld';
import { isAvatarAllowedForRealm } from '@/config/avatars';

const LEGACY_CATEGORY_MAP: Record<string, PinType> = {
  hero: 'character',
  relic: 'project',
  sanctuary: 'achievement',
  quest: 'quest',
  easter_egg: 'easter_egg',
  character: 'character',
  job: 'job',
  project: 'project',
  achievement: 'achievement',
};

function inferRealm(pin: Partial<LorePin>): RealmSide {
  if (pin.realm === 'adventurer' || pin.realm === 'company') {
    return pin.realm;
  }
  const x = pin.coordinates?.x ?? 0;
  return x >= 52 ? 'company' : 'adventurer';
}

function normalizeCategory(raw: string | undefined): PinType {
  if (!raw) return 'project';
  return LEGACY_CATEGORY_MAP[raw] ?? 'project';
}

export function normalizePin(pin: LorePin): LorePin {
  const realm = inferRealm(pin);
  const category = normalizeCategory(pin.category);
  let avatarId = pin.avatarId;

  if (category === 'character') {
    // Adventurer portrait is always the reserved `me` avatar, regardless of paste.
    if (realm === 'adventurer') {
      avatarId = 'me';
    } else if (!isAvatarAllowedForRealm(avatarId, realm)) {
      avatarId = 'cool';
    }
  } else {
    avatarId = undefined;
  }

  return {
    ...pin,
    realm,
    category,
    avatarId,
  };
}

export function normalizeConfig(raw: CompanyLoreConfig): CompanyLoreConfig {
  return {
    ...defaultWorldData,
    ...raw,
    realmLabels: {
      ...defaultWorldData.realmLabels,
      ...raw.realmLabels,
    },
    pins: (raw.pins ?? []).map((pin) => normalizePin(pin)),
  };
}

export function getCompanyData(): CompanyLoreConfig {
  const envData = process.env.NEXT_PUBLIC_COMPANY_DATA;

  if (!envData) {
    return defaultWorldData;
  }

  try {
    const decodedString =
      typeof window !== 'undefined'
        ? atob(envData)
        : Buffer.from(envData, 'base64').toString('utf-8');

    const parsed = JSON.parse(decodedString) as CompanyLoreConfig;
    return normalizeConfig(parsed);
  } catch (error) {
    console.error(
      'Failed to parse NEXT_PUBLIC_COMPANY_DATA, falling back to default:',
      error,
    );
    return defaultWorldData;
  }
}
