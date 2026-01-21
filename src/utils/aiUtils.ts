import { AIContext, Expense } from '../types';

/**
 * Strips sensitive PII from the context before sending to AI.
 * Aggregates transactions to avoid leaking specific merchant details if not needed.
 */
export const sanitizeContext = (context: AIContext): any => {
    // We keep high-level metrics as they are safe (numbers)
    const safeContext = {
        financialHealth: {
            score: context.healthScore,
            savingsRate: context.savingsRate,
            activeDebtsCount: context.activeDebts,
            goalsCount: context.goalsCount,
        },
        totals: {
            income: context.totalIncome,
            expenses: context.totalExpenses,
        },
        // Send top 5 expenses by category rather than raw transactions to preserve privacy
        topCategories: aggregateCategories(context.expenses),
        // We only send transaction types and amounts, reducing description specificity
        recentActivity: context.recentTransactions.slice(0, 10).map(t => ({
            type: t.type,
            amount: t.amount,
            category: t.category || 'General',
            date: t.date
        }))
    };

    return safeContext;
};

/**
 * Aggregates expenses by category for high-level analysis
 */
const aggregateCategories = (expenses: Expense[]) => {
    const categoryMap = new Map<string, number>();

    expenses.forEach(e => {
        const current = categoryMap.get(e.category) || 0;
        categoryMap.set(e.category, current + e.amount);
    });

    return Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5 categories
};

/**
 * Formats the context into the requested "Guru" structured JSON for advanced AI analysis.
 * Implements strict privacy filtering and financial health buckets.
 */
export const formatGuruContext = (context: AIContext): string => {
    const expenses = context.expenses;
    const incomes = context.incomes;

    // 1. Calculate Basics
    const monthlyIncome = context.totalIncome;
    const incomeType = incomes.some(i => i.isRecurring) ? 'salary' : 'fluctuating';

    // Categorize Fixed vs Variable (Simple heuristic)
    const fixedCategories = ['Bills & Utilities', 'EMI', 'Rent', 'Education', 'Insurance'];
    const fixedExpenses = expenses
        .filter(e => fixedCategories.includes(e.category) || e.isRecurring)
        .reduce((sum, e) => sum + e.amount, 0);
    const variableExpenses = context.totalExpenses - fixedExpenses;

    // 2. Vital Signs
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - context.totalExpenses) / monthlyIncome * 100).toFixed(0) + '%' : '0%';
    const monthlyDebtPayment = expenses
        .filter(e => e.category === 'EMI' || e.category === 'Debt')
        .reduce((sum, e) => sum + e.amount, 0);
    const dtiRatio = monthlyIncome > 0 ? ((monthlyDebtPayment / monthlyIncome) * 100).toFixed(1) + '%' : '0%';

    // Emergency Fund (Assuming expenses are representative of monthly)
    const emergencyFundMonths = (context.healthScore / 10).toFixed(1); // Placeholder logic as EF amount might not be in context yet

    // 3. Behavioral
    const topCategories = aggregateCategories(expenses).slice(0, 3);
    const subscriptionBurden = expenses
        .filter(e => e.category === 'Subscription')
        .reduce((sum, e) => sum + e.amount, 0);

    // Tag Frequency
    const tagMap = new Map<string, number>();
    [...expenses, ...incomes].forEach(item => {
        item.tags?.forEach((tag: string) => {
            const current = tagMap.get(tag) || 0;
            tagMap.set(tag, current + 1);
        });
    });
    const topTags = Array.from(tagMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

    const guruJSON = {
        user_profile: {
            monthly_income: monthlyIncome,
            income_type: incomeType,
            emergency_fund_months: emergencyFundMonths
        },
        current_month_stats: {
            total_expenses: context.totalExpenses,
            fixed_expenses: fixedExpenses,
            variable_expenses: variableExpenses,
            top_category: topCategories[0]?.category || 'None',
            savings_rate: savingsRate
        },
        liabilities: {
            total_debt: context.activeDebts > 0 ? "Present" : "None", // Privacy: mask exact total debt if not needed
            monthly_debt_payment: monthlyDebtPayment,
            debt_ratio: dtiRatio
        },
        behavioral: {
            top_3_categories: topCategories.map(c => c.category),
            subscription_burden: subscriptionBurden,
            frequent_tags: topTags
        },
        portfolio_analysis: {
            aggregation_rule: "Analysis of investment accounts only",
            growth_formula: "((Sum Current Values / Sum Principals) - 1) * 100",
            total_investments: context.investments.length,
            linked_accounts: context.investments.filter(i => i.accountId).length,
            investment_metrics: {
                total_principal: context.investments
                    .filter(inv => {
                        const acc = context.accounts.find(a => a.id === inv.accountId);
                        return acc?.type === 'investment';
                    })
                    .reduce((sum, inv) => sum + (inv.buyPrice * inv.quantity), 0),
                current_market_value: context.investments
                    .filter(inv => {
                        const acc = context.accounts.find(a => a.id === inv.accountId);
                        return acc?.type === 'investment';
                    })
                    .reduce((sum, inv) => sum + ((inv.currentPrice || 0) * inv.quantity), 0)
            }
        }
    };

    return JSON.stringify(guruJSON, null, 2);
};

/**
 * Generates a concise local summary for the AI Brain Layer.
 * Format: "User status: Spent [X]/[Y] budget. Top category: [Cat] ([Amount]). [Z] days left in month."
 */
export const generateBrainSummary = (context: AIContext, currency: string, currentView?: string): string => {
    // 1. Context: Based on current UI view
    const viewName = currentView === 'dashboard' ? 'Accounts' :
        currentView === 'investments' ? 'Investments' :
            currentView === 'liability' ? 'Bills' :
                currentView === 'goals' ? 'Goals' : 'Financial';
    const contextStr = `Context: "The user is looking at the ${viewName} screen."`;

    // 2. Insight: Financial Status Analysis
    const totalAssets = context.accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    const investmentValue = context.investments.reduce((sum, inv) => sum + ((inv.currentPrice || inv.buyPrice) * inv.quantity), 0);
    const netWorth = totalAssets + investmentValue;

    // Formatting net worth (Exact for AI precision)
    const formatValue = (val: number) => {
        return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(val);
    };

    // Growth trend calculation (Simplified: based on health score as a proxy)
    const growthTrend = context.healthScore > 70 ? '5%' :
        context.healthScore > 50 ? '2%' : 'stable';

    const insightStr = `Insight: "Net worth is ${formatValue(netWorth)}, showing a ${growthTrend} growth trend."`;

    // 3. Action: Smart Suggestion
    let actionStr = "";
    if (context.investments.length > 0 && currentView !== 'investments') {
        actionStr = `Action: "Suggest an update for the 'Investment' category."`;
    } else if (context.activeDebts > 0) {
        actionStr = `Action: "Propose a recovery plan for unpaid bills."`;
    } else if (context.savingsRate < 0.2) {
        actionStr = `Action: "Suggest optimizing spending habits to increase savings."`;
    } else {
        actionStr = `Action: "Keep going and monitor the Wealth Builder."`;
    }

    return `${contextStr}\n\n${insightStr}\n\n${actionStr}`;
};

/**
 * Formats the sanitized context into a readable snapshot (Legacy Format)
 */
export const formatContextForPrompt = (context: AIContext): string => {
    return formatGuruContext(context);
};
