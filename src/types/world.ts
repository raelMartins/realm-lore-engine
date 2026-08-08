export type PinCategory = 'hero' | 'relic' | 'sanctuary' | 'quest' | 'easter_egg';

export interface AttributeStat {
    label: string;
    value: number; // 0 to 100
}

export interface LorePin {
    id: string;
    title: string;
    subtitle: string;
    category: PinCategory;
    iconName: string; // Lucide icon identifier e.g., 'Shield', 'Sparkles', 'MapPin'
    // Map positioning using percentage (0 - 100) for true responsiveness
    coordinates: {
        x: number; // e.g., 45% across the map
        y: number; // e.g., 60% down the map
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
    targetTeamMembers?: {
        name: string;
        role: string;
        note: string;
    }[];
    customPitchMessage: string;
    pins: LorePin[];
}