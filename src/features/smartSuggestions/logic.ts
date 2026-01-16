import { SuggestionType } from './types';

/**
 * Generates a deterministic signature for a suggestion
 * to prevent duplicate generation.
 */
export function getSuggestionSignature(type: SuggestionType, action: any): string {
    const payloadStr = JSON.stringify(action.payload || {});
    const actionType = action.type || 'UNKNOWN';
    return `${type}_${actionType}_${payloadStr}`;
}

/**
 * Detection Logic V1: Analyzes data patterns to identify potential suggestions.
 */
export const suggestionRules = {
    /**
     * Rule: If merchant occurs >= 3 times with ~30 day intervals, 
     * it might be a subscription.
     */
    detectSubscriptions(transactions: any[]): any[] {
        const merchants: Record<string, any[]> = {};

        // Group by merchant and sort by date
        transactions.forEach(t => {
            const name = t.note?.toLowerCase().trim() || t.merchant?.toLowerCase() || 'unknown';
            if (name === 'unknown') return;
            if (!merchants[name]) merchants[name] = [];
            merchants[name].push(t);
        });

        const suggestions: any[] = [];
        Object.entries(merchants).forEach(([name, txns]) => {
            if (txns.length < 3) return;

            // Simplified interval check: last 3 transactions are roughly 28-32 days apart
            const sorted = txns.sort((a, b) => new Date(a.txn_date).getTime() - new Date(b.txn_date).getTime());
            const last = sorted[sorted.length - 1];
            const prev = sorted[sorted.length - 2];

            const diffDays = Math.abs(new Date(last.txn_date).getTime() - new Date(prev.txn_date).getTime()) / (1000 * 3600 * 24);

            if (diffDays >= 25 && diffDays <= 35) {
                suggestions.push({
                    type: 'subscription_detected',
                    title: 'New Subscription Detected',
                    message: `You've had 3 recurring payments to "${name}". Would you like to track this as a subscription?`,
                    severity: 'low',
                    action: {
                        type: 'CREATE_SUBSCRIPTION',
                        payload: { name, amount: last.amount, currency_code: last.currency_code }
                    }
                });
            }
        });

        return suggestions;
    }
};
