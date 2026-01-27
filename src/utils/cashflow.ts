import { Expense, RecurringTransaction, Liability } from '../types';
import { generateOccurrences } from '../features/recurringEngine/logic';

export interface ForecastResult {
    days: number;
    projectedBalance: number;
    fixedCommitments: number;
    dailyBurnTotal: number;
    expectedIncome: number;
    riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Step 1: Calculate Essential Daily Burn (non-annoying)
 * avg_daily_essential = avg(last 60 days of essential categories)
 */
export function calculateDailyEssentialBurn(expenses: Expense[], days: number = 60): number {
    const essentialCategories = ['Groceries', 'Food & Dining', 'Transport', 'Healthcare', 'Bills & Utilities', 'Insurance'];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const relevantExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= cutoffDate && essentialCategories.includes(e.category);
    });

    const totalEssential = relevantExpenses.reduce((sum, e) => sum + e.amount, 0);
    return totalEssential / days;
}

/**
 * Step 2: Project Fixed Commitments
 * Sum of all recurring transactions and loan EMIs for the next N days
 */
export function projectFixedCommitments(
    recurring: RecurringTransaction[],
    liabilities: Liability[],
    days: number
): { outflows: number; inflows: number } {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    let outflows = 0;
    let inflows = 0;

    // Project Recurring Transactions (Subscriptions, Bills, Income)
    recurring.forEach(rule => {
        // Map to the internal RecurringRule type expected by generateOccurrences
        const occurrences = generateOccurrences(
            {
                id: rule.id,
                startDate: rule.startDate,
                endDate: rule.endDate,
                frequency: rule.frequency,
                interval: 1, // Defaulting to 1 as it's not explicitly in our API for all
                dayOfMonth: rule.dueDay,
                // Add other mappings if needed
            } as any,
            now,
            futureDate
        );

        const total = occurrences.length * rule.amount;
        if (rule.type === 'expense') {
            outflows += total;
        } else {
            inflows += total;
        }
    });

    // Project Liability EMIs (Fixed Commitments)
    // Most EMIs are monthly. We approximate based on the number of months in the window.
    const months = Math.ceil(days / 30);
    liabilities.forEach(l => {
        if (l.emiAmount > 0 && (l.status === 'active' || !l.status)) {
            outflows += l.emiAmount * months;
        }
    });

    return { outflows, inflows };
}

/**
 * Step 3: Forecast Formula
 * Future Balance = Current Balance + Expected Income - Fixed Commitments - (avg_daily_essential * days)
 */
export function generateForecast(
    currentBalance: number,
    expenses: Expense[],
    recurring: RecurringTransaction[],
    liabilities: Liability[],
    days: number
): ForecastResult {
    const dailyBurn = calculateDailyEssentialBurn(expenses);
    const commitments = projectFixedCommitments(recurring, liabilities, days);

    const dailyBurnTotal = dailyBurn * days;
    const projectedBalance = currentBalance + commitments.inflows - commitments.outflows - dailyBurnTotal;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (projectedBalance < 0) {
        riskLevel = 'high';
    } else if (projectedBalance < currentBalance * 0.2) { // Less than 20% of current or approaching 0
        riskLevel = 'medium';
    }

    return {
        days,
        projectedBalance,
        fixedCommitments: commitments.outflows,
        dailyBurnTotal,
        expectedIncome: commitments.inflows,
        riskLevel
    };
}
