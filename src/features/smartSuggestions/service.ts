import { suggestionsRepo } from './repo';
import { SmartSuggestion } from './types';
import { getSuggestionSignature, suggestionRules } from './logic';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const SUPABASE_REST = `https://${projectId}.supabase.co/rest/v1`;
const headers = {
    'apikey': publicAnonKey,
    'Authorization': `Bearer ${publicAnonKey}`
};

export const suggestionsService = {
    /**
     * Fetches top active suggestions.
     */
    async getTopSuggestions(userId: string, limit: number = 5): Promise<SmartSuggestion[]> {
        return await suggestionsRepo.getSuggestions(userId, 'new', limit);
    },

    /**
     * Scans user data and generates new suggestions.
     */
    async generateForUser(userId: string): Promise<number> {
        try {
            // 1. Get existing suggestions to avoid duplicates (scoping to 'new' and 'seen')
            const existing = await suggestionsRepo.getSuggestions(userId, 'all', 100);
            const existingSignatures = new Set(
                existing.map(s => getSuggestionSignature(s.type, s.action))
            );

            // 2. Fetch transactions for analysis
            const txnResponse = await fetch(`${SUPABASE_REST}/transactions?user_id=eq.${userId}&order=transaction_date.desc&limit=100`, { headers });
            const transactions = await txnResponse.json();

            // 3. Apply rules
            const candidates = [
                ...suggestionRules.detectSubscriptions(transactions)
            ];

            // 4. Filter and Create
            let createdCount = 0;
            for (const candidate of candidates) {
                const signature = getSuggestionSignature(candidate.type, candidate.action);

                if (!existingSignatures.has(signature)) {
                    // Update the action payload to include the signature for later checks if needed
                    // (Or rely on the content for hashing)
                    await suggestionsRepo.createSuggestion({
                        user_id: userId,
                        ...candidate,
                        status: 'new',
                        source: 'rule',
                        expires_at: null
                    });
                    createdCount++;
                    existingSignatures.add(signature); // Prevent creating same suggestion twice in one loop
                }
            }

            return createdCount;
        } catch (error) {
            console.error('Error generating suggestions:', error);
            return 0;
        }
    },

    /**
     * Status updates
     */
    async markSeen(id: string) { return await suggestionsRepo.updateStatus(id, 'seen'); },
    async dismiss(id: string) { return await suggestionsRepo.updateStatus(id, 'dismissed'); },
    async accept(id: string) { return await suggestionsRepo.updateStatus(id, 'accepted'); }
};
