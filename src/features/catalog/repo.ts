import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { CatalogEntity, CatalogKind } from './types';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
const SUPABASE_REST = `${SUPABASE_URL}/rest/v1`;

const headers = {
    'Content-Type': 'application/json',
    'apikey': publicAnonKey,
    'Authorization': `Bearer ${publicAnonKey}`
};

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

        // Also include 'IN' as a safe fallback if specified in requirements
        if (country !== 'IN') orConditions.push(`country_code.eq.IN`);

        const params = new URLSearchParams({
            kind: `eq.${kind}`,
            status: `eq.active`,
            or: `(${orConditions.join(',')})`,
            order: 'popularity_score.desc',
            limit: limit.toString()
        });

        try {
            const response = await fetch(`${SUPABASE_REST}/catalog_entities?${params}`, { headers });
            if (!response.ok) {
                console.error('Catalog fetch failed:', await response.text());
                return [];
            }
            return await response.json();
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
        try {
            const response = await fetch(`${SUPABASE_REST}/rpc/upsert_catalog_entity`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    p_country_code: data.country_code,
                    p_kind: data.kind,
                    p_name: data.name,
                    p_icon_key: data.icon_key,
                    p_logo_url: data.logo_url,
                    p_default_category_id: data.default_category_id,
                    p_metadata: data.metadata || {},
                    p_region_code: data.region_code,
                    p_is_global: data.is_global
                })
            });

            if (!response.ok) {
                console.error('Upsert catalog failed:', await response.text());
                return null;
            }

            const result = await response.json();
            return typeof result === 'string' ? result : result?.id || null;
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
            const response = await fetch(`${SUPABASE_REST}/user_catalog_links`, {
                method: 'POST',
                headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
                body: JSON.stringify(data)
            });
            return response.ok;
        } catch (error) {
            console.error('Link user entity error:', error);
            return false;
        }
    }
};
