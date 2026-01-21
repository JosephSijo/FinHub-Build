import { ActionInsight, InsightSeverity } from './types';
import { Expense, Income, Liability, Goal, EXPENSE_CATEGORIES } from '../../types';
import { budgetsLogic } from '../budgets/logic';

export const actionInsightsLogic = {
    /**
     * Pick the top insight by calculating gaps for all categories
     */
    generateTopInsight(
        expenses: Expense[],
        incomes: Income[],
        liabilities: Liability[],
        goals: Goal[],
        availableToSpend: number
    ): ActionInsight | null {
        if (expenses.length === 0) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Helper to get start of month N months ago
        const getStartOfMonth = (monthsAgo: number) => {
            const d = new Date(currentYear, currentMonth - monthsAgo, 1);
            return d;
        };

        const threeMonthsAgo = getStartOfMonth(2); // Current, Last, BeforeLast

        // 1. MI (Monthly Income) = avg last 3 months
        const last3MonthsIncomes = incomes.filter(i => new Date(i.date) >= threeMonthsAgo);
        const mi = last3MonthsIncomes.reduce((sum, i) => sum + i.amount, 0) / 3;

        // 2. FO (Fixed Obligations) = current month scheduled
        const fo = liabilities.reduce((sum, l) => sum + (l.emiAmount || 0), 0);

        // 3. SR (Savings Reserve)
        const totalSafetyGoal = goals
            .filter(g => g.type === 'stability' || g.type === 'protection' || g.name.toLowerCase().includes('emergency'))
            .reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);
        const sr = totalSafetyGoal > 0 ? totalSafetyGoal : 0.10 * mi;

        const nsp = mi - fo - sr;
        const stressFactor = budgetsLogic.calculateStressFactor(fo, mi);
        const ssr = budgetsLogic.calculateSSR(availableToSpend, mi, fo, sr);

        const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysPassed = now.getDate();
        const daysLeft = totalDays - daysPassed + 1;

        const last3MonthsExpenses = expenses.filter(e => new Date(e.date) >= threeMonthsAgo);
        const currentMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        // 3-month avg variable spend
        const avgVarSpend = last3MonthsExpenses.reduce((sum, e) => sum + e.amount, 0) / 3;

        // Calculate gaps for all categories
        const categoryGaps = EXPENSE_CATEGORIES.map(cat => {
            const catExpenses3m = last3MonthsExpenses.filter(e => e.category === cat.value);
            const avgSpend_c = catExpenses3m.reduce((sum, e) => sum + e.amount, 0) / 3;

            const catExpensesCurrent = currentMonthExpenses.filter(e => e.category === cat.value);
            const spentSoFar = catExpensesCurrent.reduce((sum, e) => sum + e.amount, 0);

            const habitShare = budgetsLogic.calculateHabitShare(avgSpend_c, avgVarSpend);
            const baseLimit = budgetsLogic.calculateBaseLimit(nsp, habitShare, stressFactor);

            // SSR only reduces discretionary categories
            const isDiscretionary = budgetsLogic.isDiscretionary(cat.value);
            const adjustedLimit = isDiscretionary
                ? baseLimit * Math.min(Math.max(ssr, 0.60), 1.00)
                : baseLimit;

            const projection = budgetsLogic.calculateProjection(spentSoFar, daysPassed, totalDays);
            const gap = budgetsLogic.calculateGap(projection, adjustedLimit);

            return {
                id: cat.value,
                name: cat.value,
                gap,
                limit: adjustedLimit
            };
        });

        // Filter and pick top:largest Gap_c and highest urgency.
        const overspent = categoryGaps
            .filter(c => c.limit > 0 && (c.gap > 500 || c.gap > (c.limit * 0.05)))
            .sort((a, b) => b.gap - a.gap);

        if (overspent.length === 0) return null;

        const top = overspent[0];
        const cutPerDay = top.gap / (daysLeft > 0 ? daysLeft : 1);

        return {
            categoryId: top.id,
            categoryName: top.name,
            gap: top.gap,
            cutPerDay: cutPerDay,
            severity: this.calculateSeverity(top.gap, top.limit),
            message: this.formatInsightMessage(top.name, top.gap, cutPerDay)
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

    /**
     * Locked Template Message Generator
     */
    formatInsightMessage(categoryName: string, gap: number, cutPerDay: number): string {
        const gapRounded = Math.round(gap);
        const cutRounded = Math.round(cutPerDay);
        return `Arrange ₹${gapRounded} extra income OR cut ₹${cutRounded}/day to cover overspending on ${categoryName} at current rate.`;
    }
};
