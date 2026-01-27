import { Expense, RecurringTransaction, Liability, Goal } from '../types';
import { calculateDailyEssentialBurn } from './cashflow';

export interface StressDetailedFactors {
    emiLoad: number;
    commitmentRatio: number;
    volatility: number;
    cashRunway: number;
    goalDrift: number;
}

export interface StressScoreResult {
    score: number;
    factors: StressDetailedFactors;
    level: 'low' | 'moderate' | 'high' | 'critical';
    message: string;
}

/**
 * Normalizes a value to 0-100 based on a peak threshold.
 */
function normalize(value: number, peak: number): number {
    return Math.min(100, (value / peak) * 100);
}

/**
 * Calculates spending volatility (Standard Deviation / Mean).
 */
function calculateVolatilityScore(expenses: Expense[], days: number = 60): number {
    const essentialCategories = ['Groceries', 'Food & Dining', 'Transport', 'Healthcare', 'Bills & Utilities', 'Insurance'];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const relevantExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= cutoffDate && essentialCategories.includes(e.category);
    });

    if (relevantExpenses.length < 5) return 0; // Not enough data

    // Group by day to find daily spend average and stddev
    const dailySpendMap: Record<string, number> = {};
    relevantExpenses.forEach(e => {
        const dateStr = e.date.split('T')[0];
        dailySpendMap[dateStr] = (dailySpendMap[dateStr] || 0) + e.amount;
    });

    const dailySpends = Object.values(dailySpendMap);
    const n = dailySpends.length;
    const mean = dailySpends.reduce((a, b) => a + b, 0) / n;

    if (mean === 0) return 0;

    const variance = dailySpends.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Coefficient of Variation (CV) = StdDev / Mean
    // Stress peaks when CV is high (unpredictable spending)
    const cv = stdDev / mean;
    return normalize(cv, 1.5); // 1.5 CV is considered very volatile
}

export function calculateStressScore(
    totalBalance: number,
    monthlyIncome: number,
    expenses: Expense[],
    recurring: RecurringTransaction[],
    liabilities: Liability[],
    goals: Goal[]
): StressScoreResult {
    // 1. EMI Load (Weight: 0.25)
    // Stress peaks at 45% Debt-to-Income
    const totalEMI = liabilities.reduce((sum, l) => sum + (l.emiAmount || 0), 0);
    const emiRatio = monthlyIncome > 0 ? totalEMI / monthlyIncome : 1;
    const emiLoadScore = normalize(emiRatio, 0.45);

    // 2. Commitment Ratio (Weight: 0.25)
    // Stress peaks at 70% fixed costs (Recurring expenses + EMIs)
    const fixedOutflows = recurring
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0) + totalEMI;
    const commitmentRatio = monthlyIncome > 0 ? fixedOutflows / monthlyIncome : 1;
    const commitmentScore = normalize(commitmentRatio, 0.70);

    // 3. Volatility (Weight: 0.20)
    const volatilityScore = calculateVolatilityScore(expenses);

    // 4. Cash Runway (Weight: 0.20)
    // Stress at 100 if runway < 1 week. Stress at 0 if runway > 90 days.
    const dailyBurn = calculateDailyEssentialBurn(expenses);
    const runwayDays = dailyBurn > 0 ? totalBalance / dailyBurn : 365;
    const runwayScore = 100 - normalize(runwayDays, 90);

    // 5. Goal Drift (Weight: 0.10)
    // Percentage of goals that are 'leaking' or behind
    const activeGoals = goals.filter(g => g.status !== 'completed');
    const behindGoals = activeGoals.filter(g => g.status === 'leaking' || (g.targetDate && new Date(g.targetDate) < new Date() && g.currentAmount < g.targetAmount));
    const goalDriftScore = activeGoals.length > 0 ? (behindGoals.length / activeGoals.length) * 100 : 0;

    // Final Weighted Score
    const finalScore = (
        (emiLoadScore * 0.25) +
        (commitmentScore * 0.25) +
        (volatilityScore * 0.20) +
        (runwayScore * 0.20) +
        (goalDriftScore * 0.10)
    );

    let level: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    let message = "Your financial weather is clear. Keep it up!";

    if (finalScore > 75) {
        level = 'critical';
        message = "Severe financial pressure detected. Review fixed costs immediately.";
    } else if (finalScore > 50) {
        level = 'high';
        message = "High stress levels. Consider building more cash runway.";
    } else if (finalScore > 25) {
        level = 'moderate';
        message = "Moderate turbulence. Watch your discretionary spending.";
    }

    return {
        score: Math.round(finalScore),
        factors: {
            emiLoad: Math.round(emiLoadScore),
            commitmentRatio: Math.round(commitmentScore),
            volatility: Math.round(volatilityScore),
            cashRunway: Math.round(runwayScore),
            goalDrift: Math.round(goalDriftScore)
        },
        level,
        message
    };
}
