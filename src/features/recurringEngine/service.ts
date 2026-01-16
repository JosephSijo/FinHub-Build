import { recurringRepo } from './repo';
import { generateOccurrences } from './logic';
import { RecurringRule, GeneratedOccurrence } from './types';

export const recurringService = {
    /**
     * Gets a preview of transactions that would be generated for a rule.
     */
    async getBackfillPreview(rule: RecurringRule): Promise<{ count: number; dates: Date[] }> {
        const startDate = new Date(rule.lastGeneratedDate || rule.startDate);

        // If we have a lastGeneratedDate, we start from the next day to avoid overlap
        if (rule.lastGeneratedDate) {
            startDate.setDate(startDate.getDate() + 1);
        }

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const occurrenceDates = generateOccurrences(rule, startDate, today);
        return {
            count: occurrenceDates.length,
            dates: occurrenceDates
        };
    },

    /**
     * Processes a single recurring rule and generates all missing transactions.
     */
    async backfillRule(userId: string, rule: RecurringRule): Promise<number> {
        const preview = await this.getBackfillPreview(rule);
        const occurrenceDates = preview.dates;
        let createdCount = 0;

        for (const date of occurrenceDates) {
            const dateStr = date.toISOString().split('T')[0];

            const occurrence: GeneratedOccurrence = {
                recurringId: rule.id,
                date: dateStr,
                amount: rule.amount,
                description: rule.description || rule.source || 'Recurring Transaction',
                category: rule.category || 'Other',
                accountId: rule.accountId,
                type: rule.type,
                tags: rule.tags || [],
                goalId: rule.goalId,
                investmentId: rule.investmentId,
                liabilityId: rule.liabilityId
            };

            const success = await recurringRepo.saveOccurrence(userId, occurrence);
            if (success) {
                createdCount++;
            }
        }

        if (occurrenceDates.length > 0) {
            const lastDate = occurrenceDates[occurrenceDates.length - 1].toISOString().split('T')[0];
            await recurringRepo.updateRuleMetadata(userId, rule.id, { lastGeneratedDate: lastDate });
        }

        return createdCount;
    },

    /**
     * Scans all recurring rules for a user and backfills them.
     */
    async backfillAll(userId: string): Promise<{ rulesProcessed: number; transactionsCreated: number }> {
        const rules = await recurringRepo.getRules(userId);
        let transactionsCreated = 0;

        for (const rule of rules) {
            transactionsCreated += await this.backfillRule(userId, rule);
        }

        return {
            rulesProcessed: rules.length,
            transactionsCreated
        };
    }
};
