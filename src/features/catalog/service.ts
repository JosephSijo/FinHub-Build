import { catalogRepo } from './repo';
import { CatalogEntity, CatalogKind } from './types';
import { sortByFallbackPriority } from './logic';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const SUPABASE_REST = `https://${projectId}.supabase.co/rest/v1`;
const headers = {
    'apikey': publicAnonKey,
    'Authorization': `Bearer ${publicAnonKey}`
};

export const catalogService = {
    /**
     * Gets templates for a specific kind (bank, subscription, etc.) with fallback priority.
     */
    async getTemplatesForUser(userId: string, kind: CatalogKind): Promise<CatalogEntity[]> {
        try {
            // 1. Get user profile for location info
            const profileResponse = await fetch(`${SUPABASE_REST}/user_profile?user_id=eq.${userId}`, { headers });
            const profileData = await profileResponse.json();
            const profile = profileData?.[0] || {};

            const userCountry = profile.user_country_code || 'IN';
            const userRegion = profile.region_code || null;

            // 2. Fetch candidates from repo
            const candidates = await catalogRepo.getCatalogCandidates(kind, userCountry, userRegion);

            // 3. Sort by priority logic
            return sortByFallbackPriority(candidates, userCountry, userRegion);
        } catch (error) {
            console.error(`Error fetching ${kind} templates:`, error);
            return [];
        }
    },

    /**
     * High-level helper to ensure a user entry is linked to the global catalog.
     * Usually called during creation flows.
     */
    async ensureCatalogAndLink(
        userId: string,
        entityType: 'account' | 'subscription' | 'credit_card' | 'transaction',
        entityId: string,
        kind: CatalogKind,
        name: string,
        metadata: any = {}
    ): Promise<string | null> {
        try {
            // 1. Get user profile for country context
            const profileResponse = await fetch(`${SUPABASE_REST}/user_profile?user_id=eq.${userId}`, { headers });
            const profile = (await profileResponse.json())?.[0] || { user_country_code: 'IN' };

            // 2. Upsert to global catalog (increments popularity)
            const catalogId = await catalogRepo.upsertCatalogEntity({
                country_code: profile.user_country_code || 'IN',
                kind,
                name,
                metadata,
                region_code: profile.region_code
            });

            if (catalogId) {
                // 3. Link user entity to this catalog entry
                await catalogRepo.linkUserEntity({
                    user_id: userId,
                    catalog_id: catalogId,
                    entity_type: entityType,
                    entity_id: entityId,
                    confidence: 1.0
                });
            }

            return catalogId;
        } catch (error) {
            console.error('Error in ensureCatalogAndLink:', error);
            return null;
        }
    },

    // Convenience aliases requested in architecture requirements
    async getBankTemplatesForUser(userId: string) { return this.getTemplatesForUser(userId, 'bank'); },
    async getSubscriptionTemplatesForUser(userId: string) { return this.getTemplatesForUser(userId, 'subscription'); },
    async getCreditCardTemplatesForUser(userId: string) { return this.getTemplatesForUser(userId, 'credit_card'); }
};
