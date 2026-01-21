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
        // ... (existing logic)
        // Validate input is an array
        if (!Array.isArray(transactions)) return [];

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
                        payload: { name, amount: last.amount, currency: last.currency || 'INR' }
                    }
                });
            }
        });

        return suggestions;
    },

    detectDuplicates(subscriptions: any[]): any[] {
        if (!Array.isArray(subscriptions)) return [];
        const suggestions: any[] = [];
        const seenNames: Record<string, any> = {};

        subscriptions.forEach(sub => {
            // Simple normalization: remove spaces, lowercase
            const normalized = sub.name.toLowerCase().replace(/\s+/g, '');
            if (seenNames[normalized]) {
                // Check if amounts are similar (within 10%)
                const prev = seenNames[normalized];
                const ratio = Math.abs(sub.amount - prev.amount) / Math.max(sub.amount, prev.amount);
                if (ratio < 0.1) {
                    suggestions.push({
                        type: 'duplicate_subscription',
                        title: 'Duplicate Subscription Detected',
                        message: `It looks like "${sub.name}" matches another active subscription.`,
                        severity: 'medium',
                        action: {
                            type: 'MERGE_SUBSCRIPTION',
                            payload: { keepId: prev.id, dropId: sub.id }
                        }
                    });
                }
            } else {
                seenNames[normalized] = sub;
            }
        });
        return suggestions;
    },

    detectOverpriced(subscriptions: any[], income: number): any[] {
        if (!Array.isArray(subscriptions) || income <= 0) return [];
        const suggestions: any[] = [];
        const totalCost = subscriptions.reduce((sum, s) => sum + s.amount, 0);

        // Rule 1: Single sub > 3% of income
        subscriptions.forEach(sub => {
            if (sub.amount > (income * 0.03)) {
                suggestions.push({
                    type: 'overpriced_subscription',
                    title: 'High Cost Subscription',
                    message: `"${sub.name}" consumes >3% of your monthly income. Consider reviewing.`,
                    severity: 'medium',
                    action: {
                        type: 'REVIEW_SUBSCRIPTION',
                        payload: { id: sub.id }
                    }
                });
            }
        });

        // Rule 2: Total subs > 10% of income
        if (totalCost > (income * 0.10)) {
            suggestions.push({
                type: 'budget_alert',
                title: 'High Subscription Load',
                message: `You spend ${(totalCost / income * 100).toFixed(1)}% of your income on subscriptions.`,
                severity: 'high',
                action: {
                    type: 'VIEW_BUDGET',
                    payload: {}
                }
            });
        }
        return suggestions;
    },

    detectMandateCandidates(subscriptions: any[]): any[] {
        if (!Array.isArray(subscriptions)) return [];
        const suggestions: any[] = [];

        subscriptions.forEach(sub => {
            // If active, consistent, and not already offered/declined
            if (sub.status === 'active' && !sub.mandateStatus) {
                // Simple logic: suggest mandate for all stable subs initially
                suggestions.push({
                    type: 'mandate_suggestion',
                    title: 'Enable Auto-Pay?',
                    message: `Set up a mandate for "${sub.name}" so you never miss a payment.`,
                    severity: 'low',
                    action: {
                        type: 'ENABLE_MANDATE',
                        payload: { id: sub.id }
                    }
                });
            }
        });
        return suggestions;
    }
};
