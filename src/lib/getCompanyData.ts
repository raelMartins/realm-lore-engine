import { CompanyLoreConfig, LorePin, RealmSide } from '@/types/world';
import { defaultWorldData } from '@/config/defaultWorld';

function inferRealm(pin: Partial<LorePin>): RealmSide {
    if (pin.realm === 'adventurer' || pin.realm === 'company') {
        return pin.realm;
    }
    // Soft channel split ≈ 52% — see mapCoordinates REALM_SPLIT_HINT_X
    const x = pin.coordinates?.x ?? 0;
    return x >= 52 ? 'company' : 'adventurer';
}

function normalizeConfig(raw: CompanyLoreConfig): CompanyLoreConfig {
    return {
        ...defaultWorldData,
        ...raw,
        realmLabels: {
            ...defaultWorldData.realmLabels,
            ...raw.realmLabels,
        },
        pins: (raw.pins ?? []).map((pin) => ({
            ...pin,
            realm: inferRealm(pin),
        })),
    };
}

export function getCompanyData(): CompanyLoreConfig {
    const envData = process.env.NEXT_PUBLIC_COMPANY_DATA;

    if (!envData) {
        return defaultWorldData;
    }

    try {
        const decodedString = typeof window !== 'undefined'
            ? atob(envData)
            : Buffer.from(envData, 'base64').toString('utf-8');

        const parsed = JSON.parse(decodedString) as CompanyLoreConfig;
        return normalizeConfig(parsed);
    } catch (error) {
        console.error("Failed to parse NEXT_PUBLIC_COMPANY_DATA, falling back to default:", error);
        return defaultWorldData;
    }
}
