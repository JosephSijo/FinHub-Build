import { CatalogEntity } from './types';

/**
 * Normalizes an entity name for consistency.
 * Matches the SQL normalization: regexp_replace(lower(trim(input)), '\s+', ' ', 'g')
 */
export function normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Normalizes input for fuzzy matching.
 * Lowercase, trim, and remove all non-alphanumeric characters.
 */
export function normalizeForMatch(name: string): string {
    return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Sorts catalog entities based on fallback priority:
 * 1. Exact Country Match
 * 2. Region Match
 * 3. Global / is_global
 * 4. Popularity Score (tie-breaker)
 */
export function sortByFallbackPriority(
    entities: CatalogEntity[],
    userCountry: string,
    userRegion: string | null
): CatalogEntity[] {
    return [...entities].sort((a, b) => {
        // Priority 1: Country Match
        const aCountryMatch = a.country_code === userCountry ? 1 : 0;
        const bCountryMatch = b.country_code === userCountry ? 1 : 0;
        if (aCountryMatch !== bCountryMatch) return bCountryMatch - aCountryMatch;

        // Priority 2: Region Match
        if (userRegion) {
            const aRegionMatch = a.region_code === userRegion ? 1 : 0;
            const bRegionMatch = b.region_code === userRegion ? 1 : 0;
            if (aRegionMatch !== bRegionMatch) return bRegionMatch - aRegionMatch;
        }

        // Priority 3: Global
        const aGlobal = (a.is_global || a.country_code === 'GLOBAL') ? 1 : 0;
        const bGlobal = (b.is_global || b.country_code === 'GLOBAL') ? 1 : 0;
        if (aGlobal !== bGlobal) return bGlobal - aGlobal;

        // Priority 4: Popularity Score
        return b.popularity_score - a.popularity_score;
    });
}
