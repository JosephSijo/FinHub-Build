import { AIContext, Goal, Liability, Account, Income, Debt } from '../types';
import { formatCurrency } from './numberFormat';

export interface ArchitectTrigger {
    id: string;
    type: 'breach' | 'windfall' | 'spike' | 'closer' | 'milestone';
    title: string;
    message: string;
    actionLabel: string;
    severity: 'critical' | 'warning' | 'info' | 'success';
    explanation?: string;
}

export interface ArchitectAnalysis {
    priority: number;
    title: string;
    message: string;
    allocation: {
        survival: number;
        leisure: number;
    };
    nextMilestone: string;
    tradeOff?: {
        timeSavedMonths: number;
        potentialGrowthAmount: number;
        comparisonMessage: string;
    };
    realReturn?: {
        value: number;
        message: string;
    };
    triggers: ArchitectTrigger[];
    state?: 'leakage' | 'inversion' | 'normal';
    pivotActions?: string[];
    alertColor?: string;
    summarySentence?: string;
    interpretation?: {
        liquidityStatus: string;
        securityStatus: string;
        safeZoneValue: number;
    };
}

export interface FoundationMetrics {
    tier0DebtService: number; // Sum of high-interest debt payments (>10%)
    tier1Security: number; // Insurance premiums
    tier2Buffer: number; // 3-month basic buffer
    isRestricted: boolean;
    remainingDays: number;
    availableCash: number;
    foundationLimit: number;
    maxInterestRate: number;
    status: 'restricted' | 'growth-ready';
}

export const calculateFoundationMetrics = (context: AIContext): FoundationMetrics => {
    const { liabilities, expenses, accounts, currentMonthExpenses } = context;

    // Tier 0: High Interest Debt (>10%)
    const highInterestDebts = liabilities.filter(l => (l.effective_rate || l.interestRate / 100) >= 0.10 || l.interestRate > 10);
    const tier0DebtService = highInterestDebts.reduce((sum, l) => sum + (l.emiAmount || 0), 0);

    // Tier 1: Vital Security (Insurance)
    // We look at expenses from the current month or recurring transactions if needed
    // But per requirement, we scan currentMonthExpenses for category "Insurance"
    const tier1Security = currentMonthExpenses
        .filter(e => e.category === 'Insurance')
        .reduce((sum, e) => sum + e.amount, 0);

    // Tier 2: 3-month Buffer (Heuristic)
    const avgMonthlyExpense = expenses.length > 0 ? (expenses.reduce((sum, e) => sum + e.amount, 0) / Math.max(1, expenses.length / 30)) : 20000;
    const tier2Buffer = avgMonthlyExpense * 3;

    // Available Cash (M1 Assets)
    const availableCash = accounts
        .filter(acc => acc.type === 'bank' || acc.type === 'cash')
        .reduce((sum, acc) => sum + acc.balance, 0);

    // Logic: (Available_Cash - (Total_Debt_Service + Insurance_Premiums)) / Remaining_Days
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remainingDays = Math.max(1, lastDayOfMonth.getDate() - today.getDate());

    const foundationLimit = Math.max(0, Math.floor((availableCash - (tier0DebtService + tier1Security)) / remainingDays));

    // Status Determination
    // Tier 0 is complete if no high-interest debts OR if emi is zero (unlikely for active loans)
    // Tier 1 is complete if insurance expense exists this month
    const isTier0Complete = highInterestDebts.length === 0;
    const isTier1Complete = tier1Security > 0;

    const isRestricted = !isTier0Complete || !isTier1Complete;

    const maxInterestRate = highInterestDebts.length > 0
        ? Math.max(...highInterestDebts.map(l => l.interestRate || (l.effective_rate ? l.effective_rate * 100 : 0)))
        : 0;

    return {
        tier0DebtService,
        tier1Security,
        tier2Buffer,
        isRestricted,
        remainingDays,
        availableCash,
        foundationLimit,
        maxInterestRate,
        status: isRestricted ? 'restricted' : 'growth-ready'
    };
};

export const analyzeFinancialFreedom = (context: AIContext): ArchitectAnalysis => {
    const { liabilities, expenses, goals, healthScore, totalIncome, totalExpenses, incomes, accounts, investments, debts } = context;

    const surplus = Math.max(0, totalIncome - totalExpenses);
    const monthlyPriorityAllocation = surplus * 0.8;
    const triggers: ArchitectTrigger[] = [];
    const inflationRate = 0.06; // Standard 6% inflation heuristic

    const calculateRealReturn = (nominal: number) => {
        return ((1 + nominal) / (1 + inflationRate)) - 1;
    };

    const SHIELD_MIN = 500;
    const totalLiquidity = accounts.reduce((sum: number, a: Account) => sum + (a.type !== 'credit_card' ? a.balance : 0), 0);
    const avgMonthlyExpense = totalExpenses || 20000;

    // High Interest = effective_rate >= 0.10 or interestRate > 10
    const highInterestDebts = liabilities.filter((l: Liability) => (l.effective_rate || l.interestRate / 100) >= 0.10 || l.interestRate > 10);
    const totalAnnualDebtCost = liabilities.reduce((sum, l) => sum + (l.outstanding * (l.effective_rate || l.interestRate / 100)), 0);
    const totalExpectedInvGain = (investments || []).reduce((sum, inv) => sum + ((inv.quantity * (inv.currentPrice || inv.buyPrice)) * (inv.expected_return || 0.08)), 0);

    // 1. The Safety Breach
    if (totalLiquidity < avgMonthlyExpense * 3) {
        triggers.push({
            id: 'safety_breach',
            type: 'breach',
            title: 'Security Warning: Low Cash',
            message: 'Your cash reserve is below the 3-month safety mark. Setting up emergency fund first.',
            actionLabel: '',
            severity: 'critical',
            explanation: `Your ready cash (${formatCurrency(totalLiquidity, context.currency)}) is less than 3 months of basic living costs (${formatCurrency(avgMonthlyExpense * 3, context.currency)}). This makes you vulnerable to unexpected bills.`
        });
    }

    // 2. The Windfall Alert
    const avgIncome = totalIncome || 50000;
    const largeIncome = incomes.find((i: Income) => i.amount > avgIncome * 0.5 && !i.isRecurring);
    if (largeIncome) {
        triggers.push({
            id: 'windfall_alert',
            type: 'windfall',
            title: 'Nice! Extra Income Detected',
            message: `A large credit of ${largeIncome.amount} was found. This is a great chance to speed up your goals.`,
            actionLabel: 'Plan Extra Cash',
            severity: 'success',
            explanation: "Getting extra money is a rare chance to skip months of saving. Using this for debt or goals now instead of spending it will get you to freedom much faster."
        });
    }

    // 3. The Debt Spike
    const recentExpenses = expenses.slice(0, 10); // Check recent expenses for new debt
    const newDebtExpense = recentExpenses.find(e => e.category === 'EMI' || e.description.toLowerCase().includes('loan'));
    if (newDebtExpense || highInterestDebts.length > 5) { // Arbitrary spike check for number of high-interest debts
        triggers.push({
            id: 'debt_spike',
            type: 'spike',
            title: 'Alert: Debt Increasing',
            message: 'We noticed new debt or higher interest. Focusing on paying off costly loans first.',
            actionLabel: '',
            severity: 'critical',
            explanation: `You have ${highInterestDebts.length} expensive loans. Interest higher than 10% eats your money faster than investments can grow it, effectively working against your wealth.`
        });
    }


    // 4. The Inflation Alert
    const totalLiquidAssets = accounts.reduce((sum: number, a: Account) => sum + (a.type !== 'credit_card' ? a.balance : 0), 0);
    const inflationHedgingValue = (investments || []).reduce((sum: number, inv: any) => {
        const isShield = ['stock', 'mutual_fund', 'sip', 'crypto', 'physical_asset'].includes(inv.type);
        return sum + (isShield ? (inv.quantity * (inv.currentPrice || inv.buyPrice)) : 0);
    }, 0);

    if (totalLiquidAssets > avgMonthlyExpense * 1.5 && inflationHedgingValue < totalLiquidAssets * 0.25) {
        triggers.push({
            id: 'inflation_alert',
            type: 'spike',
            title: 'Watch out: Prices are Rising',
            message: 'You have a lot of cash in the bank that is losing value to inflation.',
            explanation: `Your bank cash of ${formatCurrency(totalLiquidAssets, context.currency)} is losing its value at ~6% because prices are rising. Without investing, you lose about ${formatCurrency(totalLiquidAssets * 0.06, context.currency)} in value every single year.`,
            actionLabel: '',
            severity: 'warning'
        });
    }

    // 5. The Deadline "Closer"
    const nearCompleteGoal = goals.find((g: Goal) => (g.currentAmount / g.targetAmount) >= 0.9 && (g.currentAmount < g.targetAmount));
    if (nearCompleteGoal && surplus > 5000) { // Only trigger if there's significant surplus to act
        triggers.push({
            id: 'deadline_closer',
            type: 'closer',
            title: 'Deadline Closer',
            message: `"${nearCompleteGoal.name}" is 90% complete. A focused sprint could finish this goal this month.`,
            actionLabel: 'Execute Sprint',
            severity: 'info',
            explanation: "You've crossed the 90% threshold. At this stage, cognitive finish-line effects suggest that a temporary increase in allocation will yield disproportionate psychological momentum."
        });
    }

    // 5. The Milestone Shift
    const insuranceGoal = goals.find((g: Goal) => g.name.toLowerCase().includes('insurance'));
    const isInsuranceFunded = insuranceGoal && insuranceGoal.currentAmount >= insuranceGoal.targetAmount;
    const hasActiveInsuranceExpense = expenses.some(e => e.description.toLowerCase().includes('insurance'));
    if (isInsuranceFunded || hasActiveInsuranceExpense) {
        triggers.push({
            id: 'milestone_shift',
            type: 'milestone',
            title: 'Basic Security: OK',
            message: 'Your basic protection is set. You can now move to building real wealth.',
            actionLabel: 'View Growth Plan',
            severity: 'success',
            explanation: "You've secured your basic needs (insurance/savings). Now we can shift from just 'staying safe' to 'growing your money' with better investments."
        });
    }

    // 2.5 Red Alert: Debt Spike & Interest Spike
    liabilities.forEach(l => {
        if (l.penalty_applied) {
            triggers.push({
                id: `penalty_${l.id}`,
                type: 'spike',
                title: 'High Interest: Penalty Detected',
                message: `A penalty was added to ${l.name}. Your actual interest rate is now ${(l.effective_rate ? l.effective_rate * 100 : 0).toFixed(1)}%.`,
                actionLabel: l.type === 'credit_card' ? 'Stop Using Card' : 'Pay it Now',
                severity: 'critical',
                explanation: "Penalties are like a giant hole in your wallet. Stopping this drain is your top priority."
            });
        }
    });


    // --- STATE CLASSIFICATION & OPTIMISTIC PIVOT ---
    let state: 'leakage' | 'inversion' | 'normal' = 'normal';
    const pivotActions: string[] = [];
    const isHighInterestActive = highInterestDebts.length > 0;

    // Leakage: Debt Cost > Inv Gain AND Shield < Min
    if (totalAnnualDebtCost > totalExpectedInvGain && totalLiquidity < SHIELD_MIN) {
        state = 'leakage';
    }
    // Inversion: High-Interest coexists with discretionary/low-interest prepayments
    else if (isHighInterestActive && (goals.some(g => g.is_discretionary && g.monthly_contribution && g.monthly_contribution > 0) || liabilities.some(l => l.interestRate < 8 && l.emiAmount > (l.min_payment || 0)))) {
        state = 'inversion';
    }

    if (isHighInterestActive) {
        // Step 1: Pause
        pivotActions.push("STOP: Pause non-essential goals (like new gadgets) for 2 months.");
        // Step 2: Pay Debt
        const topDebt = highInterestDebts.sort((a, b) => (b.effective_rate || 0) - (a.effective_rate || 0))[0];
        pivotActions.push(`PAY: Putting extra cash into ${topDebt.name} (costs you ${((topDebt.effective_rate || 0) * 100).toFixed(1)}% in interest).`);
        // Step 3: Safety Net
        if (totalLiquidity < SHIELD_MIN) {
            pivotActions.push(`SAVE: Setting aside money to rebuild your ${formatCurrency(SHIELD_MIN, context.currency)} safety fund.`);
        } else {
            pivotActions.push(`DONE: Your basic safety fund is verified at ${formatCurrency(totalLiquidity, context.currency)}.`);
        }
    }

    // --- PRIMARY ARCHITECT LOGIC ---

    // 0. Priority 0: Personal IOUs (Borrowed money from individuals)
    const borrowedDebts = debts.filter((d: Debt) => d.type === 'borrowed' && d.status === 'pending');
    if (borrowedDebts.length > 0 && !isHighInterestActive) {
        const topBorrowed = borrowedDebts.sort((a: Debt, b: Debt) => b.amount - a.amount)[0];

        return {
            priority: 0,
            title: "Priority: Honor Personal Trust",
            message: `You owe ${formatCurrency(topBorrowed.amount, context.currency)} to ${topBorrowed.personName}. In a personal economy, "Trust capital" is more valuable than bank interest.`,
            allocation: { survival: 70, leisure: 30 },
            nextMilestone: `Settle debt with ${topBorrowed.personName}`,
            triggers,
            pivotActions: [
                `MESSAGE: Send a quick update to ${topBorrowed.personName} about your repayment plan.`,
                `ALLOCATE: Set aside ${formatCurrency(monthlyPriorityAllocation, context.currency)} this month specifically for this IOU.`,
                ...pivotActions
            ],
            alertColor: '#f59e0b', // Amber for trust priority
            summarySentence: `Solving your IOU with ${topBorrowed.personName} is the primary goal. Repaying personal trust improves your overall financial security score.`,
            interpretation: {
                liquidityStatus: totalLiquidity > SHIELD_MIN ? 'Stable' : 'Building',
                securityStatus: 'Personal Trust Gap',
                safeZoneValue: 30
            }
        };
    }

    // 1. Priority 0: High-Interest Debt (>10%)
    if (isHighInterestActive) {
        const topDebt = highInterestDebts.sort((a, b) => (b.effective_rate || b.interestRate / 100) - (a.effective_rate || a.interestRate / 100))[0];
        const effectiveRatePercent = (topDebt.effective_rate || topDebt.interestRate / 100) * 100;

        // Trade-off: Debt vs Growth
        const monthsToPayoffNoSurplus = topDebt.emiAmount > 0 ? (topDebt.outstanding / topDebt.emiAmount) : topDebt.outstanding / 1000;
        const newMonthlyPayment = (topDebt.emiAmount || 0) + monthlyPriorityAllocation;
        const monthsToPayoffWithSurplus = topDebt.outstanding / newMonthlyPayment;
        const timeSaved = Math.max(0, monthsToPayoffNoSurplus - monthsToPayoffWithSurplus);

        // Potential Growth if invested instead (12% CAGR)
        const growthRate = 0.12 / 12;
        const potentialGrowth = monthlyPriorityAllocation * (Math.pow(1 + growthRate, monthsToPayoffNoSurplus) - 1) / growthRate;
        const interestSaved = topDebt.outstanding * (effectiveRatePercent / 100) * (timeSaved / 12);

        const iouReminder = borrowedDebts.length > 0 ? `. You also have personal IOUs with ${borrowedDebts[0].personName}, which should be handled with "Trust Capital" once this leak is stopped.` : '';
        const summaryIOU = borrowedDebts.length > 0 ? ` and your personal trust obligations` : '';

        return {
            priority: 0,
            title: state === 'leakage' ? "ALERT: Money is Leaking" : "Priority: Stop the Leak",
            message: `Your ${topDebt.name} is costs you ${effectiveRatePercent.toFixed(1)}%. Paying this off is like a GUARANTEED ${effectiveRatePercent.toFixed(1)}% profit${iouReminder}`,
            allocation: { survival: 80, leisure: 20 },
            nextMilestone: `Liquidate ${topDebt.name}`,
            tradeOff: {
                timeSavedMonths: Math.round(timeSaved),
                potentialGrowthAmount: Math.round(potentialGrowth),
                comparisonMessage: `You're in a "Debt Trap"—paying more in interest than you're earning. Paying this debt now will save you about ${formatCurrency(interestSaved, context.currency)} in interest.`
            },
            triggers,
            pivotActions: [
                ...pivotActions,
                ...(borrowedDebts.length > 0 ? [`TRUST: Settle your ${formatCurrency(borrowedDebts[0].amount, context.currency)} IOU with ${borrowedDebts[0].personName} as the next sub-priority.`] : [])
            ],
            alertColor: '#730800',
            summarySentence: `Your ${topDebt.name}${summaryIOU} is a critical drag. This chart shows how its ${(effectiveRatePercent).toFixed(1)}% cost is preventing your 'Safe Zone' from expanding.`,
            interpretation: {
                liquidityStatus: totalLiquidity > SHIELD_MIN ? 'Stable' : 'Critical',
                securityStatus: 'Threatened',
                safeZoneValue: Math.round(healthScore)
            }
        };
    }

    // 2. Priority 1: Survival (Insurance)
    const hasInsuranceGoalCheck = goals.some((g: Goal) => g.name.toLowerCase().includes('insurance'));
    const paidInsuranceCheck = expenses.some(e => e.description.toLowerCase().includes('insurance') || e.category === 'Healthcare');

    if (!hasInsuranceGoalCheck && !paidInsuranceCheck) {
        return {
            priority: 1,
            title: "Priority: Get Protected",
            message: "We can't see any insurance in your plan. One health emergency could wipe out all your savings.",
            allocation: { survival: 80, leisure: 20 },
            nextMilestone: "Get Health and Life Insurance",
            triggers,
            summarySentence: "Your lack of Insurance is a major security gap. Even with high liquidity, one event could set you back to zero.",
            interpretation: {
                liquidityStatus: totalLiquidity > avgMonthlyExpense * 3 ? 'High' : 'Moderate',
                securityStatus: 'Unset',
                safeZoneValue: 20
            }
        };
    }

    // 3. Priority 2: Buffer (Emergency Fund)
    const emergencyFundMonths = (healthScore / 10);

    if (emergencyFundMonths < 3) {
        const targetMonthsThreshold = 3;
        const neededMonths = targetMonthsThreshold - emergencyFundMonths;
        const neededAmount = (avgMonthlyExpense) * neededMonths;
        const timeToBuild = neededAmount / (monthlyPriorityAllocation || 1);

        return {
            priority: 2,
            title: "Priority: Build a Buffer",
            message: `You have ${emergencyFundMonths.toFixed(1)} months of cash. We need 3 months to be fully safe.`,
            allocation: { survival: 80, leisure: 20 },
            nextMilestone: "Finish 3-Month Safety Fund",
            tradeOff: {
                timeSavedMonths: Math.round(timeToBuild * 0.5),
                potentialGrowthAmount: Math.round(neededAmount * 0.05),
                comparisonMessage: "Peace of mind is priceless. Build your safety net first."
            },
            triggers,
            summarySentence: `Your buffer is only at ${emergencyFundMonths.toFixed(1)} months. We need to reach 3 months to move out of the 'Caution' zone.`,
            interpretation: {
                liquidityStatus: 'Building',
                securityStatus: (isInsuranceFunded || hasActiveInsuranceExpense) ? 'Locked' : 'Lagging',
                safeZoneValue: Math.round(emergencyFundMonths / 3 * 100)
            }
        };
    }

    // 4. Priority 3: Freedom (Growth)
    const activeGoal = goals.find(g => g.status === 'active') || goals[0];
    if (activeGoal) {
        const remaining = activeGoal.targetAmount - activeGoal.currentAmount;
        const timeSaved = remaining > 0 ? (monthlyPriorityAllocation / activeGoal.targetAmount) * 12 : 0;

        const nominalReturn = 0.12; // Assuming 12% for Tier 3 wealth builder
        const realReturnVal = calculateRealReturn(nominalReturn);

        return {
            priority: 3,
            title: "Goal Area: Grow Your Wealth",
            message: "Your basic needs are met. It's time to focus on growing your investments and wealth.",
            allocation: { survival: 80, leisure: 20 },
            nextMilestone: "Diversified Asset Growth",
            tradeOff: {
                timeSavedMonths: Math.round(timeSaved),
                potentialGrowthAmount: Math.round(remaining * 0.12),
                comparisonMessage: "You're in the 'Growth Phase'. Let your money work for you."
            },
            realReturn: {
                value: realReturnVal,
                message: `Your wealth is growing ${(realReturnVal * 100).toFixed(1)}% faster than prices are rising.`
            },
            triggers
        };
    }

    const liquidityStatus = totalLiquidity > avgMonthlyExpense * 3 ? 'High' : 'Lagging';
    const securityStatus = (isInsuranceFunded || hasActiveInsuranceExpense) ? 'Locked' : 'Lagging';
    const safeZoneValue = healthScore || 40;

    const summarySentence = `Your Liquidity is ${liquidityStatus.toLowerCase()}, but your Security (Insurance) is ${securityStatus.toLowerCase()}. This chart shows why your 'Safe Zone' is currently at ${safeZoneValue}%.`;

    return {
        priority: 3,
        title: "Goal Area: Grow Your Wealth",
        message: "Your basic needs are met. It's time to focus on growing your investments and wealth.",
        summarySentence,
        interpretation: {
            liquidityStatus,
            securityStatus,
            safeZoneValue
        },
        allocation: { survival: 80, leisure: 20 },
        nextMilestone: "Diversified Asset Growth",
        triggers
    };
};
