import { recurringRepo } from './repo';
import { generateOccurrences } from './logic';
import { RecurringRule, GeneratedOccurrence } from './types';

export const recurringService = {
    /**
     * Gets a preview of transactions that would be generated for a rule.
     */
    async getBackfillPreview(rule: RecurringRule): Promise<{ count: number; occurrences: { date: Date; index: number }[] }> {
        const startDate = new Date(rule.lastGeneratedDate || rule.startDate);

        // Always start from the next day to avoid duplication of the manual entry or last generated entry
        startDate.setDate(startDate.getDate() + 1);

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const occurrences = generateOccurrences(rule, startDate, today);
        return {
            count: occurrences.length,
            occurrences
        };
    },

    /**
     * Processes a single recurring rule and generates all missing transactions.
     */
    async backfillRule(userId: string, rule: RecurringRule): Promise<number> {
        const preview = await this.getBackfillPreview(rule);
        const occurrences = preview.occurrences;
        let createdCount = 0;

        const formatDateSuffix = (date: Date) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const mmm = months[date.getMonth()];
            const yyyy = date.getFullYear();
            return `${mmm} ${yyyy}`;
        };

        for (const occ of occurrences) {
            const dateStr = occ.date.toISOString().split('T')[0];
            // Prioritize rule.name as the "main" name provided by the user
            const baseDescription = rule.name || rule.description || rule.source || 'Recurring Transaction';

            // For backfilled entries, we add the month-year suffix
            const description = `${baseDescription} ${formatDateSuffix(occ.date)}`;

            const occurrence: GeneratedOccurrence = {
                recurringId: rule.id,
                date: dateStr,
                amount: rule.amount,
                description,
                category: rule.category || 'Other',
                accountId: rule.accountId,
                type: rule.type,
                tags: rule.tags || [],
                goalId: rule.goalId,
                investmentId: rule.investmentId,
                liabilityId: rule.liabilityId,
                entityId: rule.entityId,
                entityKind: rule.entityKind
            };

            const success = await recurringRepo.saveOccurrence(userId, occurrence);
            if (success) {
                createdCount++;
            }
        }

        if (occurrences.length > 0) {
            const lastDate = occurrences[occurrences.length - 1].date.toISOString().split('T')[0];
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
