import { Notification, NotificationContext, NotificationPriority } from './types';

/**
 * Check if user is new (< 5 transactions OR account age < 7 days)
 */
function isNewUser(context: NotificationContext): boolean {
    return context.transactionCount < 5 || context.accountAge < 7;
}

/**
 * Generate PAYMENT_RISK notification
 */
function checkPaymentRisk(context: NotificationContext, currency: string = '₹'): Notification | null {
    const riskPayments = context.scheduledPayments.filter(p => {
        const dueDate = new Date(p.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));


        return daysUntilDue <= 7 && daysUntilDue >= 0 && p.accountBalance < p.amount;
    });

    if (riskPayments.length === 0) return null;

    const topRisk = riskPayments.sort((a, b) => {
        const aDays = Math.ceil((new Date(a.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const bDays = Math.ceil((new Date(b.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return aDays - bDays;
    })[0];

    const daysUntilDue = Math.ceil((new Date(topRisk.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return {
        id: `payment-risk-${topRisk.id}`,
        type: 'PAYMENT_RISK',
        priority: 'CRITICAL',
        message: `${currency}${Math.round(topRisk.amount)} due in ${daysUntilDue} days — move funds to avoid penalty.`,
        action: {
            label: 'Fix Now',
            route: '/liabilities'
        }
    };
}

/**
 * Generate BUDGET_OVERRUN notification
 */
function checkBudgetOverrun(context: NotificationContext, currency: string = '₹'): Notification | null {
    if (context.budgetGaps.length === 0) return null;

    const topGap = context.budgetGaps.sort((a, b) => b.gap - a.gap)[0];

    return {
        id: `budget-overrun-${topGap.category}`,
        type: 'BUDGET_OVERRUN',
        priority: topGap.gap > 5000 ? 'CRITICAL' : 'HIGH',
        message: `Arrange ${currency}${Math.round(topGap.gap)} extra income OR cut ${currency}${Math.round(topGap.cutPerDay)}/day to cover overspending on ${topGap.category} at current rate.`,
        action: {
            label: 'View Budget',
            route: '/budgets'
        }
    };
}

/**
 * Generate IOU_OVERDUE notification
 */
function checkIOUOverdue(context: NotificationContext, currency: string = '₹'): Notification | null {
    if (context.overdueIOUs.length === 0) return null;

    const topIOU = context.overdueIOUs.sort((a, b) => b.outstanding - a.outstanding)[0];

    const action = topIOU.direction === 'LENT' ? 'Collect' : 'Pay';
    const preposition = topIOU.direction === 'LENT' ? 'from' : 'to';

    return {
        id: `iou-overdue-${topIOU.id}`,
        type: 'IOU_OVERDUE',
        priority: 'HIGH',
        message: `${action} ${currency}${Math.round(topIOU.outstanding)} ${preposition} ${topIOU.person} — overdue by ${topIOU.daysOverdue} days.`,
        action: {
            label: 'Mark Payment',
            route: '/ious'
        }
    };
}

/**
 * Generate EMI_MISSED notification
 */
function checkEMIMissed(context: NotificationContext, currency: string = '₹'): Notification | null {
    if (context.missedEMIs.length === 0) return null;

    const topEMI = context.missedEMIs.sort((a, b) => b.daysOverdue - a.daysOverdue)[0];

    return {
        id: `emi-missed-${topEMI.id}`,
        type: 'EMI_MISSED',
        priority: 'CRITICAL',
        message: `EMI missed: Collect ${currency}${Math.round(topEMI.amount)} from ${topEMI.person}.`,
        action: {
            label: 'Mark Installment Paid',
            route: '/ious'
        }
    };
}

/**
 * Generate FEE_LEAKAGE notification
 */
function checkFeeLeakage(context: NotificationContext, currency: string = '₹', threshold: number = 100): Notification | null {
    const highFees = context.feeAlerts.filter(f => f.estimatedFee > threshold);


    if (highFees.length === 0) return null;

    const topFee = highFees.sort((a, b) => b.estimatedFee - a.estimatedFee)[0];
    const today = new Date();
    const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();

    return {
        id: `fee-leakage-${topFee.merchant}`,
        type: 'FEE_LEAKAGE',
        priority: 'MEDIUM',
        message: `Extra fee ${currency}${Math.round(topFee.estimatedFee)} detected — recover ${currency}${Math.round(topFee.estimatedFee / Math.max(daysLeft, 1))}/day this month.`,
        action: {
            label: 'Learn',
            route: '/tips'
        }
    };
}

/**
 * Generate DATA_ACCURACY notification (refined)
 */
function checkDataAccuracy(context: NotificationContext): Notification | null {
    // Only show if ALL conditions are met
    if (context.accountCount === 0) return null;
    if (context.safeToSpend <= 0 && !context.hasIncome) return null;
    if (isNewUser(context)) return null;
    if (context.daysSinceLastExpense < 3) return null;

    return {
        id: 'data-accuracy',
        type: 'DATA_ACCURACY',
        priority: 'LOW',
        message: 'No expenses logged in 3 days — add today\'s spend to keep Safe-to-Spend accurate.',
        action: {
            label: 'Add Expense',
            route: '/add-transaction'
        }
    };
}

/**
 * Generate ONBOARDING notifications
 */
function checkOnboarding(context: NotificationContext): Notification | null {
    // No accounts
    if (context.accountCount === 0) {
        return {
            id: 'onboarding-no-accounts',
            type: 'ONBOARDING',
            priority: 'CRITICAL',
            message: 'Connect your first bank or cash account to enable Safe-to-Spend tracking and intelligence features.',

            action: {
                label: 'Add Account',
                route: '/accounts'
            }
        };
    }

    // Zero balance and no income
    if (context.totalBalance === 0 && !context.hasIncome) {
        return {
            id: 'onboarding-zero-balance',
            type: 'ONBOARDING',
            priority: 'MEDIUM',
            message: 'Balance is ₹0 — add income or account balance to enable tracking.',
            action: {
                label: 'Add Income',
                route: '/add-transaction'
            }
        };
    }

    return null;
}

/**
 * Generate all notifications and prioritize
 */
export function generateNotifications(
    context: NotificationContext,
    currency: string = '₹',
    maxNotifications: number = 1
): Notification[] {
    const notifications: Notification[] = [];

    // Check all notification types
    const paymentRisk = checkPaymentRisk(context, currency);
    const emiMissed = checkEMIMissed(context, currency);
    const budgetOverrun = checkBudgetOverrun(context, currency);
    const iouOverdue = checkIOUOverdue(context, currency);
    const feeLeakage = checkFeeLeakage(context, currency);
    const dataAccuracy = checkDataAccuracy(context);
    const onboarding = checkOnboarding(context);

    if (paymentRisk) notifications.push(paymentRisk);
    if (emiMissed) notifications.push(emiMissed);
    if (budgetOverrun) notifications.push(budgetOverrun);
    if (iouOverdue) notifications.push(iouOverdue);
    if (feeLeakage) notifications.push(feeLeakage);
    if (dataAccuracy) notifications.push(dataAccuracy);
    if (onboarding) notifications.push(onboarding);

    // Prioritize: CRITICAL > HIGH > MEDIUM > LOW
    const priorityOrder: Record<NotificationPriority, number> = {
        'CRITICAL': 0,
        'HIGH': 1,
        'MEDIUM': 2,
        'LOW': 3
    };

    notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return notifications.slice(0, maxNotifications);
}

export const notificationsLogic = {
    generateNotifications,
    isNewUser
};
