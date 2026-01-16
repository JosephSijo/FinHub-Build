export type CatalogKind = 'bank' | 'subscription' | 'credit_card' | 'merchant' | 'category';
export type CatalogStatus = 'active' | 'pending' | 'blocked';

export interface CatalogEntity {
    id: string;
    country_code: string;
    region_code: string | null;
    is_global: boolean;
    kind: CatalogKind;
    name: string;
    normalized_name: string;
    icon_key: string | null;
    logo_url: string | null;
    default_category_id: string | null;
    metadata: Record<string, any>;
    popularity_score: number;
    usage_count: number;
    status: CatalogStatus;
    created_at: string;
    updated_at: string;
}

export interface UserCatalogLink {
    id: string;
    user_id: string;
    catalog_id: string;
    entity_type: 'account' | 'subscription' | 'credit_card' | 'transaction';
    entity_id: string;
    confidence: number;
    created_at: string;
}

export interface CatalogTemplateRequest {
    kind: CatalogKind;
    userCountry?: string;
    userRegion?: string | null;
    limit?: number;
}
