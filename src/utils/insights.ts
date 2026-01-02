import { Expense, Goal, Notification } from '../types';

interface FinanceData {
    expenses: Expense[];
    goals: Goal[];
    userName: string;
}

export function generateGurujiInsights(data: FinanceData): string[] {
    const { expenses, goals, userName } = data;
    const insights: string[] = [];

    // 1. Analyze Spending Trends (Last 7 days vs Previous 30 days avg)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentExpenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
    const previousExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= thirtyDaysAgo && d < oneWeekAgo;
    });

    // Group by category
    const getCategoryTotals = (exps: Expense[]) => {
        return exps.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);
    };

    const recentTotals = getCategoryTotals(recentExpenses);

    // Calculate weekly average for previous period (approx 3 weeks)
    const previousTotals = getCategoryTotals(previousExpenses);
    const previousWeeklyAvg = Object.keys(previousTotals).reduce((acc, cat) => {
        acc[cat] = previousTotals[cat] / 3;
        return acc;
    }, {} as Record<string, number>);

    // Find Spikes > 20%
    Object.keys(recentTotals).forEach(category => {
        const recent = recentTotals[category];
        const avg = previousWeeklyAvg[category] || 0;

        // Ignore small amounts to avoid noise (e.g., < ₹500)
        if (avg > 500 && recent > avg * 1.2) {
            const percentage = Math.round(((recent - avg) / avg) * 100);

            // 2. Link to Goals
            // Find a goal that is currently active and not completed
            const targetGoal = goals.find(g => g.currentAmount < g.targetAmount);

            if (targetGoal) {
                // Calculate delay impact: (Amount Excess / Monthly Savings Rate) roughly
                // For simplicity, we'll just frame it as a direct trade-off


                // Add diverse phrasing
                insights.push(`${userName}, you've spent ${percentage}% more on ${category} this week. This slows down your '${targetGoal.name}' goal. Consider tightening up your protocol!`);
            } else {
                insights.push(`${userName}, your ${category} spending is up ${percentage}% this week. Watch out before it becomes a habit!`);
            }
        }
    });

    return insights;
}

export function createInsightNotification(message: string): Notification {
    return {
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'insight',
        priority: 'low',
        category: 'insights',
        title: 'Guruji Insight',
        message: message,
        timestamp: new Date(),
        read: false
    };
}
