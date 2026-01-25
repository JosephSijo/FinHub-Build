
import { Expense, Income } from "../types";

/**
 * Standardized logic to determine if a transaction (Expense or Income)
 * is an internal transfer or a credit card payment.
 * These should be excluded from spending analytics to prevent double counting.
 */
export const isTransfer = (transaction: Expense | Income | any): boolean => {
    // Check category
    if (transaction.category?.toLowerCase().includes('transfer')) return true;

    // Check description for common keywords
    const desc = (transaction.description || transaction.source || '').toLowerCase();
    if (desc.includes('transfer')) return true;
    if (desc.includes('payment')) return true;
    if (desc.includes('cc bill')) return true;
    if (desc.includes('credit card bill')) return true;
    if (desc.includes('internal transfer')) return true;

    // Check tags
    if (transaction.tags && Array.isArray(transaction.tags)) {
        if (transaction.tags.some((tag: string) =>
            tag.toLowerCase() === 'transfer' ||
            tag.toLowerCase() === 'internal'
        )) return true;
    }

    return false;
};
