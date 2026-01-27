import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { SmartSuggestion, SuggestionStatus } from './types';

const SUPABASE_REST = `https://${projectId}.supabase.co/rest/v1`;
const headers = {
    'Content-Type': 'application/json',
    'apikey': publicAnonKey,
    'Authorization': `Bearer ${publicAnonKey}`
};

export const suggestionsRepo = {
    /**
     * Fetches suggestions for a user.
     */
    async getSuggestions(userId: string, status: SuggestionStatus | 'all' = 'new', limit: number = 20): Promise<SmartSuggestion[]> {
        const query = new URLSearchParams({
            user_id: `eq.${userId}`,
            order: 'created_at.desc',
            limit: limit.toString()
        });

        if (status !== 'all') {
            query.append('status', `eq.${status}`);
        }

        try {
            const response = await fetch(`${SUPABASE_REST}/smart_suggestions?${query}`, { headers });
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Fetch suggestions error:', error);
            return [];
        }
    },

    /**
     * Creates or updates a suggestion.
     * Note: The table might not have a unique constraint for 'upsert' yet, 
     * so we handle duplicate prevention in the service layer using signatures.
     */
    async createSuggestion(data: Omit<SmartSuggestion, 'id' | 'created_at'>): Promise<SmartSuggestion | null> {
        try {
            const payload = {
                ...data,
                catalog_entity_id: data.catalog_entity_id || null
            };
            const response = await fetch(`${SUPABASE_REST}/smart_suggestions`, {
                method: 'POST',
                headers: { ...headers, 'Prefer': 'return=representation' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            return Array.isArray(result) ? result[0] : result;
        } catch (error) {
            console.error('Create suggestion error:', error);
            return null;
        }
    },

    /**
     * Updates the status of a suggestion.
     */
    async updateStatus(id: string, status: SuggestionStatus): Promise<boolean> {
        try {
            const response = await fetch(`${SUPABASE_REST}/smart_suggestions?id=eq.${id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status })
            });
            return response.ok;
        } catch (error) {
            console.error('Update suggestion status error:', error);
            return false;
        }
    }
};
