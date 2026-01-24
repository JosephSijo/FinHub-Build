import { api } from '../../utils/api';
import { RecurringRule, GeneratedOccurrence } from './types';
import { getOccurrenceId } from './logic';

export const recurringRepo = {
    /**
     * Fetches all recurring rules for a user.
     */
    async getRules(userId: string): Promise<RecurringRule[]> {
        const response = await api.getRecurring(userId);
        return response.success ? response.recurring : [];
    },

    /**
     * Saves a generated occurrence as a transaction.
     * Uses a deterministic ID based on recurringId and date to prevent duplicates.
     */
    async saveOccurrence(userId: string, occurrence: GeneratedOccurrence): Promise<boolean> {
        const id = getOccurrenceId(occurrence.recurringId, new Date(occurrence.date));

        const payload = {
            ...occurrence,
            id,
            generatedSource: 'recurring',
            createdAt: new Date().toISOString(),
            liabilityId: occurrence.liabilityId || (occurrence.entityKind === 'loan' ? occurrence.entityId : undefined),
            goalId: occurrence.goalId || (occurrence.entityKind === 'goal' ? occurrence.entityId : undefined),
            investmentId: occurrence.investmentId || (occurrence.entityKind === 'investment' ? occurrence.entityId : undefined)
        };

        try {
            if (occurrence.type === 'expense') {
                await api.createExpense(userId, payload);
            } else {
                await api.createIncome(userId, payload);
            }
            return true;
        } catch (error) {
            console.error(`Failed to save recurring occurrence ${id}:`, error);
            return false;
        }
    },

    /**
     * Updates the last_generated_date on a recurring rule.
     */
    async updateRuleMetadata(userId: string, ruleId: string, metadata: { lastGeneratedDate: string }): Promise<void> {
        await api.updateRecurring(userId, ruleId, metadata);
    }
};
