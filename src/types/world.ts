export type PinCategory = 'hero' | 'relic' | 'sanctuary' | 'quest' | 'easter_egg';

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
    category: PinCategory;
    /** Left island (you) or right island (target company) */
    realm: RealmSide;
    iconName: string; // Lucide icon identifier e.g., 'Shield', 'Sparkles', 'MapPin'
    // Map positioning using percentage (0 - 100) of the fixed-aspect MapStage.
    // Same space as SVG viewBox 0–100 — see src/lib/mapCoordinates.ts
    // Adventurer pins: keep x roughly < 45. Company pins: keep x roughly > 58.
    coordinates: {
        x: number; // 0 = left edge of map art, 100 = right edge
        y: number; // 0 = top edge of map art, 100 = bottom edge
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
            actionType: 'email' | 'calendar' | 'modal';
            target: string;
        };
    };
}

export interface CompanyLoreConfig {
    companyName: string;
    tagline: string;
    primaryColorHex?: string;
    /** Optional display labels for the two map realms */
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
