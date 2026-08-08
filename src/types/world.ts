export type PinType =
  | 'character'
  | 'project'
  | 'achievement'
  | 'quest'
  | 'easter_egg';

/** @deprecated Legacy alias — prefer PinType */
export type PinCategory = PinType;

/** Which island a pin belongs to — west (adventurer) or east (guild) */
export type RealmSide = 'adventurer' | 'company';

export interface AttributeStat {
  label: string;
  value: number; // 0 to 100
}

export interface LorePin {
  id: string;
  title: string;
  subtitle: string;
  /** Node kind — drives lore card layout and map treatment */
  category: PinType;
  /** West isle (adventurer) or east isle (guild) */
  realm: RealmSide;
  iconName: string; // Lucide icon fallback when no avatar
  /**
   * Character pins only. Must be a valid id from the avatar catalog.
   * `me` is reserved for the adventurer realm and cannot be chosen for guild pins.
   */
  avatarId?: string;
  // Map positioning using percentage (0 - 100) of the fixed-aspect MapStage.
  // Same space as SVG viewBox 0–100 — see src/lib/mapCoordinates.ts
  // Adventurer pins: keep x roughly < 45. Company pins: keep x roughly > 58.
  coordinates: {
    x: number;
    y: number;
  };
  content: {
    badge?: string;
    description: string;
    markdownBody?: string;
    stats?: AttributeStat[];
    tags?: string[];
    externalLink?: {
      label: string;
      url: string;
    };
    callToAction?: {
      label: string;
      actionType: 'email' | 'calendar' | 'modal' | 'hire';
      target: string;
    };
  };
}

export interface CompanyLoreConfig {
  companyName: string;
  tagline: string;
  primaryColorHex?: string;
  realmLabels?: {
    adventurer?: string;
    company?: string;
  };
  targetTeamMembers?: {
    name: string;
    role: string;
    note: string;
  }[];
  customPitchMessage: string;
  pins: LorePin[];
}
