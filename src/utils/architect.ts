import { AIContext, Goal, Liability, Account, Income } from '../types';

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
}

export const analyzeFinancialFreedom = (context: AIContext): ArchitectAnalysis => {
    const { liabilities, expenses, goals, healthScore, totalIncome, totalExpenses, incomes, accounts, investments } = context;

    const surplus = Math.max(0, totalIncome - totalExpenses);
    const monthlyPriorityAllocation = surplus * 0.8;
    const triggers: ArchitectTrigger[] = [];
    const inflationRate = 0.06; // Standard 6% inflation heuristic

    const calculateRealReturn = (nominal: number) => {
        return ((1 + nominal) / (1 + inflationRate)) - 1;
    };

    const SHIELD_MIN = 500;
    const SHIELD_MAX = 1000;
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
            title: 'Safety Breach Detected',
            message: 'Liquid buffer is below 3-month survival threshold. Emergency protocols initiated.',
            actionLabel: 'Pause Optional Goals',
            severity: 'critical',
            explanation: `Your liquidity (${totalLiquidity.toLocaleString()}) is below the 3x monthly expense threshold (${(avgMonthlyExpense * 3).toLocaleString()}). High risk of emergency fund depletion.`
        });
    }

    // 2. The Windfall Alert
    const avgIncome = totalIncome || 50000;
    const largeIncome = incomes.find((i: Income) => i.amount > avgIncome * 0.5 && !i.isRecurring);
    if (largeIncome) {
        triggers.push({
            id: 'windfall_alert',
            type: 'windfall',
            title: 'Windfall Detected',
            message: `A significant credit of ${largeIncome.amount} was detected. This is a massive opportunity for tier-skipping.`,
            actionLabel: 'Calculate Strategic Split',
            severity: 'success',
            explanation: "This large surplus is a rare opportunity to bypass multiple tiers of financial growth. Reinvesting this instead of spending it could accelerate your freedom by months."
        });
    }

    // 3. The Debt Spike
    const recentExpenses = expenses.slice(0, 10); // Check recent expenses for new debt
    const newDebtExpense = recentExpenses.find(e => e.category === 'EMI' || e.description.toLowerCase().includes('loan'));
    if (newDebtExpense || highInterestDebts.length > 5) { // Arbitrary spike check for number of high-interest debts
        triggers.push({
            id: 'debt_spike',
            type: 'spike',
            title: 'Red Alert: Debt Spike',
            message: 'New liability detected or interest burden increased. Priority shifted to aggressive liquidation.',
            actionLabel: 'Freeze Credit Spending',
            severity: 'critical',
            explanation: `Detected ${highInterestDebts.length} high-interest liabilities. Interest rates above 10% compound faster than average market growth, effectively reversing your wealth progress.`
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
            title: 'Inflation Alert: Purchasing Power Decay',
            message: 'Significant idle liquidity detected with low inflation protection.',
            explanation: `Your liquid cash of ${totalLiquidAssets.toLocaleString()} is losing purchasing power at ~6% annually. Without hedging, you lose approximately ${(totalLiquidAssets * 0.06).toLocaleString()} in real value every year.`,
            actionLabel: 'Shield Wealth',
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
            title: 'Survival Protocol: Nominal',
            message: 'Tier 1 (Protection) is verified. You are now authorized for more aggressive Freedom Tier strategies.',
            actionLabel: 'View Growth Strategies',
            severity: 'success',
            explanation: "Lower tiers (Protection) are now fully secured. The Architect authorizes a transition from 'Defense' to 'Offense', prioritizing high-yield assets over survival buffers."
        });
    }

    // 2.5 Red Alert: Debt Spike & Interest Spike
    liabilities.forEach(l => {
        if (l.penalty_applied) {
            triggers.push({
                id: `penalty_${l.id}`,
                type: 'spike',
                title: 'Interest Spike: Penalty Detected',
                message: `A penalty has been applied to ${l.name}. Effective rate is now ${(l.effective_rate ? l.effective_rate * 100 : 0).toFixed(1)}%.`,
                actionLabel: l.type === 'credit_card' ? 'Freeze Card' : 'Immediate Settlement',
                severity: 'critical',
                explanation: "Penalties trigger high-friction wealth decay. Stopping this leak is Priority #1."
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
        // Step 1: Freeze
        pivotActions.push("FREEZE: Pausing discretionary goals (New Laptop, Vacation) for 2 billing cycles.");
        // Step 2: Swap
        const topDebt = highInterestDebts.sort((a, b) => (b.effective_rate || 0) - (a.effective_rate || 0))[0];
        pivotActions.push(`SWAP: Redirecting surplus toward ${topDebt.name} (${((topDebt.effective_rate || 0) * 100).toFixed(1)}% eff. rate).`);
        // Step 3: Shield
        if (totalLiquidity < SHIELD_MIN) {
            pivotActions.push(`SHIELD: Allocating portion to rebuild $${SHIELD_MIN} Starter Shield (Target: $${SHIELD_MAX}).`);
        } else {
            pivotActions.push(`SHIELD: Survival buffer verified at $${totalLiquidity.toLocaleString()}.`);
        }
    }

    // --- PRIMARY ARCHITECT LOGIC ---

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

        return {
            priority: 0,
            title: state === 'leakage' ? "CRITICAL: Wealth Leakage" : "Priority 0: Plug the Leak",
            message: `Your ${topDebt.name} is at ${effectiveRatePercent.toFixed(1)}%. Killing this debt is a GUARANTEED ${effectiveRatePercent.toFixed(1)}% return on your money.`,
            allocation: { survival: 80, leisure: 20 },
            nextMilestone: `Liquidate ${topDebt.name}`,
            tradeOff: {
                timeSavedMonths: Math.round(timeSaved),
                potentialGrowthAmount: Math.round(potentialGrowth),
                comparisonMessage: `Mathematically, this is an "Inversion" state. Every $1 invested loses to $${(effectiveRatePercent / 12).toFixed(2)} in interest friction. Plugging this saves approximately $${interestSaved.toLocaleString()} in pure interest.`
            },
            triggers,
            state,
            pivotActions,
            alertColor: '#730800'
        };
    }

    // 2. Priority 1: Survival (Insurance)
    const hasInsuranceGoalCheck = goals.some((g: Goal) => g.name.toLowerCase().includes('insurance'));
    const paidInsuranceCheck = expenses.some(e => e.description.toLowerCase().includes('insurance') || e.category === 'Healthcare');

    if (!hasInsuranceGoalCheck && !paidInsuranceCheck) {
        return {
            priority: 1,
            title: "Priority 1: Secure Survival",
            message: "You lack visible health or term insurance. One health crisis can reset your progress to zero.",
            allocation: { survival: 80, leisure: 20 },
            nextMilestone: "Establish Health & Term Insurance",
            triggers
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
            title: "Priority 2: Build the Buffer",
            message: `Your current liquid buffer is at ${emergencyFundMonths.toFixed(1)} months. We need 3 months for absolute stability.`,
            allocation: { survival: 80, leisure: 20 },
            nextMilestone: "3-Month Emergency Fund",
            tradeOff: {
                timeSavedMonths: Math.round(timeToBuild * 0.5),
                potentialGrowthAmount: Math.round(neededAmount * 0.05),
                comparisonMessage: "Peace of mind is an unquantifiable asset. Build the buffer first."
            },
            triggers
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
            title: "Priority 3: Accelerate Freedom",
            message: "Survival protocols are nominal. It's time to aggressively scale your income-generating assets.",
            allocation: { survival: 80, leisure: 20 },
            nextMilestone: "Diversified Asset Growth",
            tradeOff: {
                timeSavedMonths: Math.round(timeSaved),
                potentialGrowthAmount: Math.round(remaining * 0.12),
                comparisonMessage: "You are in the Growth Zone. Compounding is your greatest ally now."
            },
            realReturn: {
                value: realReturnVal,
                message: `Your wealth is outrunning the cost of living by ${(realReturnVal * 100).toFixed(1)}%.`
            },
            triggers
        };
    }

    return {
        priority: 3,
        title: "Priority 3: Accelerate Freedom",
        message: "Survival protocols are nominal. It's time to aggressively scale your income-generating assets.",
        allocation: { survival: 80, leisure: 20 },
        nextMilestone: "Diversified Asset Growth",
        triggers
    };
};
