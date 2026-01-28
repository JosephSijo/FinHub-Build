import { ActionInsight, InsightSeverity } from './types';
import { Expense, Income, Liability, Goal, EXPENSE_CATEGORIES } from '../../types';
import { budgetsLogic } from '../budgets/logic';

export const actionInsightsLogic = {
    /**
     * Pick the top insight by calculating gaps using simplified logic for the new Decision Engine
     */
    generateTopInsight(
        expenses: Expense[],
        incomes: Income[],
        liabilities: Liability[],
        goals: Goal[],
        availableToSpend: number
    ): ActionInsight {

        // 1. Income Check (Critical)
        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
        if (totalIncome === 0 && expenses.length > 0) {
            return {
                title: "Critical: No Income Detected",
                message: "You are spending from reserves. Immediate action required to secure cashflow.",
                priority: "critical",
                type: "error",
                actions: [{ label: "Verify Income Sources" }]
            };
        }

        // 2. High Interest Debt Check (Prioritize Retention)
        const totalDebt = liabilities.reduce((sum, l) => sum + (l.outstanding || 0), 0);
        const highInterestLiabilities = liabilities.filter(l => (l.interestRate || 0) > 12);

        if (highInterestLiabilities.length > 0) {
            const worst = highInterestLiabilities.sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0))[0];
            return {
                title: "Wealth Leak Detected",
                message: `The '${worst.name}' loan is draining wealth at ${worst.interestRate}%. Prioritize paying this down.`,
                priority: "high",
                type: "warning",
                actions: [{ label: "View Payoff Plan" }]
            };
        }

        // 3. Liquidity/Survival Check
        // If available to spend < 10% of income (or generic low number)
        if (availableToSpend < (totalIncome * 0.10) && totalIncome > 0) {
            return {
                title: "Low Safety Buffer",
                message: "Your liquidity is tight for the remaining days. Reduce discretionary spend immediately.",
                priority: "high",
                type: "warning",
                actions: [{ label: "Review Budget" }]
            };
        }

        // 4. Overspending Analysis (Existing Logic Adapted)
        // ... (Simplified for this version) ...

        // Default: Optimization / Growth
        return {
            title: "Financial Engine Optimal",
            message: "No critical issues detected. You are positioned to grow your wealth.",
            priority: "low",
            type: "success",
            actions: [{ label: "Boost Investments" }]
        };
    },

    /**
     * Calculate Severity
     */
    calculateSeverity(gap: number, limit: number): InsightSeverity {
        if (limit <= 0) return 'critical';
        const ratio = gap / limit;
        if (ratio > 0.3) return 'critical';
        if (ratio > 0.15) return 'high';
        if (ratio > 0.05) return 'medium';
        return 'low';
    },

    formatInsightMessage(categoryName: string, gap: number, cutPerDay: number): string {
        const gapRounded = Math.round(gap);
        const cutRounded = Math.round(cutPerDay);
        return `Arrange ₹${gapRounded} extra income OR cut ₹${cutRounded}/day to cover overspending on ${categoryName}.`;
    }
};
