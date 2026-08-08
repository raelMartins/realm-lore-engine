import { CompanyLoreConfig } from '@/types/world';
import { defaultWorldData } from '@/config/defaultWorld';

export function getCompanyData(): CompanyLoreConfig {
    const envData = process.env.NEXT_PUBLIC_COMPANY_DATA;

    if (!envData) {
        return defaultWorldData;
    }

    try {
        // Decodes Base64 encoded JSON string from Vercel environment variables
        const decodedString = typeof window !== 'undefined'
            ? atob(envData)
            : Buffer.from(envData, 'base64').toString('utf-8');

        return JSON.parse(decodedString) as CompanyLoreConfig;
    } catch (error) {
        console.error("Failed to parse NEXT_PUBLIC_COMPANY_DATA, falling back to default:", error);
        return defaultWorldData;
    }
}