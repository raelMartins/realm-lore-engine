import { RealmSide } from '@/types/world';

export interface AvatarOption {
  id: string;
  label: string;
  /** Public URL under /avatars */
  src: string;
  /** If true, only adventurer-realm character pins may use this avatar */
  adventurerOnly?: boolean;
}

/**
 * Selectable character portraits.
 * `me` is reserved for the adventurer and excluded from guild pickers.
 */
export const AVATAR_CATALOG: AvatarOption[] = [
  {
    id: 'me',
    label: 'Adventurer',
    src: '/avatars/me.jpeg',
    adventurerOnly: true,
  },
  {
    id: 'cool',
    label: 'Cool',
    src: '/avatars/cool.jpg',
  },
  {
    id: 'viking',
    label: 'Viking',
    src: '/avatars/viking.jpg',
  },
  {
    id: 'cartoon',
    label: 'Cartoon',
    src: '/avatars/cartoon.jpg',
  },
  {
    id: 'ember',
    label: 'Ember',
    src: '/avatars/ember.jpg',
  },
  {
    id: 'festival',
    label: 'Festival',
    src: '/avatars/festival.jpg',
  },
  {
    id: 'ninja',
    label: 'Ninja',
    src: '/avatars/ninja.jpg',
  },
  {
    id: 'rama',
    label: 'Rama',
    src: '/avatars/rama.jpg',
  },
  {
    id: 'sun-god',
    label: 'Sun God',
    src: '/avatars/sun-god.jpg',
  },
  {
    id: 'tide',
    label: 'Tide',
    src: '/avatars/tide.jpg',
  },
  {
    id: 'water',
    label: 'Water',
    src: '/avatars/water.jpg',
  },
];

export function getAvatarById(id: string | undefined): AvatarOption | undefined {
  if (!id) return undefined;
  return AVATAR_CATALOG.find((a) => a.id === id);
}

/** Avatars a realm is allowed to assign when creating/editing a character pin */
export function getSelectableAvatars(realm: RealmSide): AvatarOption[] {
  if (realm === 'adventurer') {
    return AVATAR_CATALOG;
  }
  return AVATAR_CATALOG.filter((a) => !a.adventurerOnly);
}

export function isAvatarAllowedForRealm(
  avatarId: string | undefined,
  realm: RealmSide,
): boolean {
  if (!avatarId) return true;
  const avatar = getAvatarById(avatarId);
  if (!avatar) return false;
  if (avatar.adventurerOnly && realm !== 'adventurer') return false;
  return true;
}
