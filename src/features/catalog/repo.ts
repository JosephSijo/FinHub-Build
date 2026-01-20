import { supabase } from '@/lib/supabase';
import { CatalogEntity, CatalogKind } from './types';

export const catalogRepo = {
    /**
     * Fetches catalog entities with fallback candidates.
     * Logic for specific prioritization (Country > Region > Global) 
     * is handled in the logic layer after retrieval.
     */
    async getCatalogCandidates(kind: CatalogKind, country: string, region: string | null = null, limit: number = 50): Promise<CatalogEntity[]> {
        const orConditions = [
            `country_code.eq.${country}`,
            `is_global.eq.true`,
            `country_code.eq.GLOBAL`
        ];
        if (region) orConditions.push(`region_code.eq.${region}`);
        if (country !== 'IN') orConditions.push(`country_code.eq.IN`);

        try {
            const { data, error } = await supabase
                .from('catalog_entities')
                .select('*')
                .eq('kind', kind)
                .eq('status', 'active')
                .or(orConditions.join(','))
                .order('popularity_score', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Catalog fetch failed:', error);
                return [];
            }
            return data as CatalogEntity[];
        } catch (error) {
            console.error('Catalog fetch error:', error);
            return [];
        }
    },

    /**
     * Uses RPC to write to catalog (increments usage/popularity).
     */
    async upsertCatalogEntity(data: {
        country_code: string;
        kind: CatalogKind;
        name: string;
        icon_key?: string;
        logo_url?: string;
        default_category_id?: string;
        metadata?: any;
        region_code?: string;
        is_global?: boolean;
    }): Promise<string | null> {
        console.log('Upserting to catalog:', data);
        try {
            const params = {
                p_country_code: data.country_code || 'IN',
                p_kind: data.kind,
                p_name: data.name,
                p_icon_key: data.icon_key || null,
                p_logo_url: data.logo_url || null,
                p_default_category_id: data.default_category_id || null,
                p_metadata: data.metadata || {},
                p_region_code: data.region_code || null,
                p_is_global: !!data.is_global
            };
            console.log('RPC Params:', params);

            const { data: result, error } = await supabase.rpc('upsert_catalog_entity', params);

            if (error) {
                console.error('Upsert catalog failed:', error);
                return null;
            }

            // The RPC returns a UUID (string)
            return typeof result === 'string' ? result : (result as any)?.id || null;
        } catch (error) {
            console.error('Upsert catalog error:', error);
            return null;
        }
    },

    /**
     * Links a user-space entity to a catalog entity.
     */
    async linkUserEntity(data: {
        user_id: string;
        catalog_id: string;
        entity_type: 'account' | 'subscription' | 'credit_card' | 'transaction';
        entity_id: string;
        confidence?: number;
    }): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('user_catalog_links')
                .upsert(data, {
                    onConflict: 'user_id,catalog_id,entity_type,entity_id'
                });

            if (error) {
                console.error('Link user entity failed:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Link user entity error:', error);
            return false;
        }
    }
};
