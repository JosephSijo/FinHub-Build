import { BalanceBoardMetrics, BalanceStatus, BalanceBoardData } from './types';

export const calculateBalanceMetrics = (data: BalanceBoardData): BalanceBoardMetrics => {
    const { accounts, recurringTransactions, goals } = data;
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // A) Liquid_Balance = SUM(accounts.current_balance WHERE is_active)
    // Filtering out 'credit_card' from liquid balance as it's debt, but checking type
    const liquidAccounts = accounts.filter(a => a.type !== 'credit_card');
    const liquidBalance = liquidAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    // B) Upcoming_Dues_Global = SUM(scheduled_payments.amount WHERE status='active' AND due_date <= today+7)
    // Mapping recurringTransactions to scheduled_payments
    const upcomingDues = recurringTransactions
        .filter(r => {
            const startDate = new Date(r.startDate);
            // Simplified: check if start date is within next 7 days or if it's a recurring cycle hit
            // In a real app, this would use a proper occurrences calculator. For now, 7-day window.
            return r.type === 'expense' && startDate <= sevenDaysFromNow && startDate >= today;
        })
        .reduce((sum, r) => sum + r.amount, 0);

    // C) Reserved_Global = SUM(reserves.amount WHERE is_active)
    // Mapping goals to reserves
    const reservedAmount = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

    // D) LiquidSafeSpend = Liquid_Balance - Upcoming_Dues_Global - Reserved_Global
    const liquidSafeSpend = liquidBalance - upcomingDues - reservedAmount;

    // Credit:
    // availableCredit(card) = limit_amount - current_outstanding
    // safeCardSpend(card) = MIN(availableCredit(card), limit_amount * safety_cap_percent/100)
    // creditSafeSpend = SUM(safeCardSpend of all cards)
    const creditCards = accounts.filter(a => a.type === 'credit_card');
    const creditSafeSpend = creditCards.reduce((sum, card) => {
        const limit = card.creditLimit || 0;
        const currentOutstanding = card.balance || 0; // In this app, balance is usually positive outstanding for CC
        const availableCredit = Math.max(0, limit - currentOutstanding);
        const safetyCapPercent = card.safeLimitPercentage || 30;
        const safetyCap = (limit * safetyCapPercent) / 100;
        return sum + Math.min(availableCredit, safetyCap);
    }, 0);

    const safeToSpendGlobal = liquidSafeSpend + creditSafeSpend;

    // Suggested Spend Account:
    // Pick account with MAX free_buffer
    let maxFreeBuffer = -Infinity;
    let suggestedSpendAccountId: string | null = null;
    let suggestedSpendAccountName: string | null = null;

    liquidAccounts.forEach(account => {
        const accountDues7d = recurringTransactions
            .filter(r => r.accountId === account.id && r.type === 'expense')
            .reduce((sum, r) => {
                const startDate = new Date(r.startDate);
                return (startDate <= sevenDaysFromNow && startDate >= today) ? sum + r.amount : sum;
            }, 0);

        // min_buffer from requirements
        const minBuffer = account.min_buffer || 0;
        const freeBuffer = account.balance - accountDues7d - minBuffer;

        if (freeBuffer > maxFreeBuffer) {
            maxFreeBuffer = freeBuffer;
            suggestedSpendAccountId = account.id;
            suggestedSpendAccountName = account.name;
        }
    });

    // Status:
    // - CRITICAL if LiquidSafeSpend < 0 OR any account has current_balance < accountDues7d
    // - TIGHT if LiquidSafeSpend is low (LiquidSafeSpend < 10% Liquid_Balance OR LiquidSafeSpend < 2000)
    // - SAFE otherwise
    let status: BalanceStatus = 'SAFE';

    const hasAccountShortfall = liquidAccounts.some(account => {
        const accountDues7d = recurringTransactions
            .filter(r => r.accountId === account.id && r.type === 'expense')
            .reduce((sum, r) => {
                const startDate = new Date(r.startDate);
                return (startDate <= sevenDaysFromNow && startDate >= today) ? sum + r.amount : sum;
            }, 0);
        return account.balance < accountDues7d;
    });

    if (liquidSafeSpend < 0 || hasAccountShortfall) {
        status = 'CRITICAL';
    } else if (liquidSafeSpend < (liquidBalance * 0.1) || liquidSafeSpend < 2000) {
        status = 'TIGHT';
    }

    // Top Alert:
    let topAlert: string | null = null;
    const highUtilCard = creditCards.find(card => (card.balance / (card.creditLimit || 1)) > 0.7);
    const unfundedDue = liquidAccounts.find(account => {
        const dues = recurringTransactions
            .filter(r => r.accountId === account.id && r.type === 'expense')
            .reduce((sum, r) => {
                const startDate = new Date(r.startDate);
                return (startDate <= sevenDaysFromNow && startDate >= today) ? sum + r.amount : sum;
            }, 0);
        return account.balance < dues;
    });

    if (unfundedDue) {
        topAlert = `Payment risk: ${unfundedDue.name} insufficient for upcoming dues.`;
    } else if (status === 'TIGHT') {
        topAlert = `Low Safe-to-Spend: Consider postponing large purchases.`;
    } else if (highUtilCard) {
        topAlert = `High credit utilization on ${highUtilCard.name} (>70%).`;
    }

    // Next Due Info
    const nextDues = recurringTransactions
        .filter(r => r.type === 'expense')
        .map(r => {
            const dueDate = new Date(r.startDate);
            const days = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return { ...r, daysRemaining: days };
        })
        .filter(r => r.daysRemaining >= 0)
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

    const nextDue = nextDues.length > 0 ? {
        title: nextDues[0].description || 'Upcoming Payment',
        amount: nextDues[0].amount,
        daysRemaining: nextDues[0].daysRemaining
    } : null;

    // Quick Fix
    let quickFix = null;
    if (status === 'CRITICAL' && unfundedDue && suggestedSpendAccountId && suggestedSpendAccountId !== unfundedDue.id) {
        const dues = recurringTransactions
            .filter(r => r.accountId === unfundedDue.id && r.type === 'expense')
            .reduce((sum, r) => {
                const startDate = new Date(r.startDate);
                return (startDate <= sevenDaysFromNow && startDate >= today) ? sum + r.amount : sum;
            }, 0);

        quickFix = {
            fromAccountId: suggestedSpendAccountId,
            toAccountId: unfundedDue.id,
            amount: dues - unfundedDue.balance
        };
    }

    return {
        liquidBalance,
        upcomingDues,
        reservedAmount,
        liquidSafeSpend,
        creditSafeSpend,
        safeToSpendGlobal,
        suggestedSpendAccountId,
        suggestedSpendAccountName,
        suggestedReason: "Highest free buffer after upcoming payments",
        status,
        topAlert,
        quickFix,
        nextDue
    };
};
