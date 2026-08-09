export type PinType =
  | 'character'
  | 'job'
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
    /**
     * Character abilities / project metrics — label + 0–100 proficiency or score.
     */
    stats?: AttributeStat[];
    /**
     * Character skillset chips / project tools.
     */
    tags?: string[];
    /** Single outbound link (legacy / simple pins) */
    externalLink?: {
      label: string;
      url: string;
    };
    /** Optional multiple outbound links (e.g. client + realtor portals) */
    externalLinks?: {
      label: string;
      url: string;
    }[];
    callToAction?: {
      label: string;
      actionType: 'email' | 'calendar' | 'modal' | 'hire';
      target: string;
    };
    /** Character — ISO date (YYYY-MM-DD) when they joined the guild */
    joinedAt?: string;
    /** Project / job — ISO start date */
    startDate?: string;
    /** Project / job — ISO end date (omit or empty if ongoing) */
    endDate?: string;
    /** Achievement — ISO date unlocked */
    achievedAt?: string;
    /** Achievement — guild character pin ids who contributed */
    contributorIds?: string[];
    /** Job — duties / bullets shown on the card back */
    tasks?: string[];
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
