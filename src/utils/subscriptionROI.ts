import { RecurringTransaction, Expense } from '../types';

export interface SubscriptionROI {
    costPerUse: number;
    totalUsage: number;
    passiveUsage: number;
    activeUsage: number;
    isPoorROI: boolean;
    frequencyPerMonth: number;
}

/**
 * Calculates ROI metrics for a subscription based on transactions and manual usage logs.
 */
export function calculateSubscriptionROI(
    subscription: RecurringTransaction,
    expenses: Expense[]
): SubscriptionROI {
    const monthlyCost = subscription.amount;

    // 1. Passive Usage: Count transactions in current billing cycle
    // We look for expenses that have the subscription name in the description or the subscription's ID
    const today = new Date();
    const cycleStart = new Date(today.getFullYear(), today.getMonth(), 1); // Approximation to current month

    const transactionUsage = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        if (expenseDate < cycleStart) return false;

        const nameMatch = subscription.description &&
            e.description.toLowerCase().includes(subscription.description.toLowerCase());
        const idMatch = e.recurringId === subscription.id;

        // Skip the actual recurring generation transaction itself if it's already logged as an expense
        // This is tricky: we want "Use" cases, not the "Payment" case.
        // Usually 'Use' cases are separate transactions (e.g. Uber rides vs Uber One payment)
        return (nameMatch || idMatch) && e.amount < subscription.amount;
    }).length;

    // 2. Active Usage: Manual taps
    const manualUsage = subscription.manualUsageCount || 0;

    const totalUsage = Math.max(1, transactionUsage + manualUsage);
    const costPerUse = monthlyCost / totalUsage;

    // 3. ROI Health
    // Poor ROI if cost per use is more than 50% of the subscription cost (implies used < 2 times)
    // and if the cost per use is significant (e.g. > 100 in currency units)
    const isPoorROI = (costPerUse > (monthlyCost / 2)) && totalUsage < 3 && monthlyCost > 0;

    return {
        costPerUse: Math.round(costPerUse * 100) / 100,
        totalUsage,
        passiveUsage: transactionUsage,
        activeUsage: manualUsage,
        isPoorROI,
        frequencyPerMonth: totalUsage
    };
}
