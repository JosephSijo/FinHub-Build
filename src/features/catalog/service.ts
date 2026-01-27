import { catalogRepo } from './repo';
import { CatalogEntity, CatalogKind } from './types';
import { sortByFallbackPriority, normalizeForMatch } from './logic';
import { supabase } from '@/lib/supabase';

export const catalogService = {
    /**
     * Resolves a user input string to a catalog entity using normalization and linking.
     */
    async resolveEntity(userId: string, name: string): Promise<string | null> {
        if (!name) return null;
        const normalized = normalizeForMatch(name);

        try {
            // 1. Check user-specific mappings first (User's personal lexicon)
            const { data: link } = await supabase
                .from('user_catalog_link')
                .select('catalog_entity_id')
                .eq('user_id', userId)
                .eq('normalized_name', normalized)
                .maybeSingle();

            if (link) return link.catalog_entity_id;

            // 2. Exact Match in Global Catalog
            const { data: globalMatch } = await supabase
                .from('catalog_entities')
                .select('id')
                .eq('normalized_name', normalized)
                .eq('status', 'active')
                .maybeSingle();

            if (globalMatch?.id) {
                await this.createLink(userId, name, normalized, globalMatch.id);
                return globalMatch.id;
            }

            // 3. Fuzzy/Contains Match in Global Catalog (High Popularity First)
            const { data: candidates } = await supabase
                .from('catalog_entities')
                .select('id, normalized_name')
                .eq('status', 'active')
                .order('popularity_score', { ascending: false })
                .limit(200);

            const match = candidates?.find(c =>
                normalized.includes(c.normalized_name) || c.normalized_name.includes(normalized)
            );

            if (match?.id) {
                await this.createLink(userId, name, normalized, match.id);
                return match.id;
            }

            // 4. No Match - Create unlinked mapping to remember this input
            await this.createLink(userId, name, normalized, null);
            return null;
        } catch (error) {
            console.error('Error resolving catalog entity:', error);
            return null;
        }
    },

    /**
     * Internal helper to create a user mapping.
     */
    async createLink(userId: string, originalName: string, normalizedName: string, catalogId: string | null) {
        return supabase.from('user_catalog_link').upsert({
            user_id: userId,
            user_input_name: originalName,
            normalized_name: normalizedName,
            catalog_entity_id: catalogId,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,normalized_name' });
    },

    /**
     * Gets templates for a specific kind (bank, subscription, etc.) with fallback priority.
     */
    async getTemplatesForUser(userId: string, kind: CatalogKind): Promise<CatalogEntity[]> {
        try {
            // 1. Get user profile for location info using supabase client
            const { data: profiles, error: profileError } = await supabase
                .from('user_profile')
                .select('user_country_code, region_code')
                .eq('user_id', userId);

            if (profileError) throw profileError;
            const profile = profiles?.[0] || {};

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
            // 1. Get user profile for country context using supabase client
            const { data: profiles, error: profileError } = await supabase
                .from('user_profile')
                .select('user_country_code, region_code')
                .eq('user_id', userId);

            if (profileError) throw profileError;
            const profile = profiles?.[0] || { user_country_code: 'IN' };

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
