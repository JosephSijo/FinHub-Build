export type NotificationType =
    | 'PAYMENT_RISK'
    | 'BUDGET_OVERRUN'
    | 'IOU_OVERDUE'
    | 'EMI_MISSED'
    | 'FEE_LEAKAGE'
    | 'DATA_ACCURACY'
    | 'ONBOARDING';

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface NotificationAction {
    label: string;
    route?: string;
    handler?: () => void;
}

export interface Notification {
    id: string;
    type: NotificationType;
    priority: NotificationPriority;
    message: string;
    action: NotificationAction;
    metadata?: Record<string, unknown>;
}

export interface NotificationContext {
    // User state
    userId: string;
    accountCount: number;
    totalBalance: number;
    hasIncome: boolean;
    transactionCount: number;
    accountAge: number; // days since first account created

    // Financial data
    scheduledPayments: Array<{
        id: string;
        amount: number;
        dueDate: string;
        accountBalance: number;
    }>;

    budgetGaps: Array<{
        category: string;
        gap: number;
        cutPerDay: number;
    }>;

    overdueIOUs: Array<{
        id: string;
        person: string;
        outstanding: number;
        daysOverdue: number;
        direction: 'LENT' | 'BORROWED';
    }>;

    missedEMIs: Array<{
        id: string;
        person: string;
        amount: number;
        sequenceNo: number;
        daysOverdue: number;
    }>;

    feeAlerts: Array<{
        estimatedFee: number;
        merchant: string;
    }>;

    // Data accuracy
    daysSinceLastExpense: number;
    safeToSpend: number;
}
