import { Goal, Expense } from '../types';

export interface GoalAdjustmentOptions {
    increaseSavings: {
        newMonthly: number;
        extraNeeded: number;
    };
    extendDeadline: {
        newDate: string;
        monthsMore: number;
    };
    reduceTarget: {
        newTarget: number;
        reduction: number;
    };
}

export interface GoalAnalysisResult {
    goalId: string;
    requiredRate: number;
    actualRate: number;
    drift: number; // actual / required
    isBehind: boolean;
    monthsLeft: number;
    adjustments: GoalAdjustmentOptions;
}

/**
 * Monthly contribution physics for goals.
 */
export function analyzeGoalDrift(goal: Goal, expenses: Expense[]): GoalAnalysisResult | null {
    if (!goal.targetAmount || goal.targetAmount <= 0) return null;
    if (goal.status === 'completed') return null;

    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

    // 1. Time Calculation
    const today = new Date();
    const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;

    let monthsLeft = 1;
    if (targetDate && targetDate > today) {
        const yearDiff = targetDate.getFullYear() - today.getFullYear();
        const monthDiff = targetDate.getMonth() - today.getMonth();
        monthsLeft = Math.max(1, yearDiff * 12 + monthDiff);
    } else {
        // If deadline passed but not completed, assume 1 month to pressure the user
        monthsLeft = 0.5;
    }

    // 2. Required Rate
    const requiredRate = remainingAmount / monthsLeft;

    // 3. Actual Rate (Based on last 3 months of transactions tagged with goal name or goalId)
    const goalTransactions = expenses.filter(e =>
        e.tags.includes('goal') && (e.goalId === goal.id || e.tags.includes(goal.name.toLowerCase()))
    );

    let actualRate = 0;
    if (goalTransactions.length > 0) {
        // Sort by date to find history span
        const sorted = [...goalTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstDate = new Date(sorted[0].date);
        const lastDate = new Date(sorted[sorted.length - 1].date);

        const dayDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
        const monthSpan = Math.max(0.5, dayDiff / 30.44);

        const totalContributed = goalTransactions.reduce((sum, t) => sum + t.amount, 0);
        actualRate = totalContributed / monthSpan;
    } else if (goal.monthly_contribution) {
        // Fallback to planned contribution if no transaction history yet
        actualRate = goal.monthly_contribution;
    }

    // 4. Drift Detection (Behind if actual < 80% of required)
    const drift = requiredRate > 0 ? actualRate / requiredRate : 1;
    const isBehind = drift < 0.8;

    // 5. Adjustments
    // Increase: Target monthly is the required rate
    const increaseSavings = {
        newMonthly: Math.round(requiredRate),
        extraNeeded: Math.max(0, Math.round(requiredRate - actualRate))
    };

    // Extend: Find months needed at current rate
    const monthsNeeded = actualRate > 0 ? remainingAmount / actualRate : monthsLeft * 2;
    const extendDate = new Date();
    extendDate.setMonth(today.getMonth() + Math.ceil(monthsNeeded));

    const extendDeadline = {
        newDate: extendDate.toISOString().split('T')[0],
        monthsMore: Math.max(1, Math.ceil(monthsNeeded - monthsLeft))
    };

    // Reduce: What target can we hit at current pace?
    const achievableAmount = goal.currentAmount + (actualRate * monthsLeft);
    const reduceTarget = {
        newTarget: Math.round(achievableAmount),
        reduction: Math.round(goal.targetAmount - achievableAmount)
    };

    return {
        goalId: goal.id,
        requiredRate: Math.round(requiredRate),
        actualRate: Math.round(actualRate),
        drift,
        isBehind,
        monthsLeft: Math.round(monthsLeft),
        adjustments: {
            increaseSavings,
            extendDeadline,
            reduceTarget
        }
    };
}
