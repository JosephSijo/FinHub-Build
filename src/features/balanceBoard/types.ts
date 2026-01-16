export type BalanceStatus = 'SAFE' | 'TIGHT' | 'CRITICAL';

export interface BalanceBoardMetrics {
    liquidBalance: number;
    upcomingDues: number;
    reservedAmount: number;
    liquidSafeSpend: number;
    creditSafeSpend: number;
    safeToSpendGlobal: number;
    suggestedSpendAccountId: string | null;
    suggestedSpendAccountName: string | null;
    suggestedReason: string | null;
    status: BalanceStatus;
    topAlert: string | null;
    quickFix?: {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
    } | null;
    nextDue?: {
        title: string;
        amount: number;
        daysRemaining: number;
    } | null;
}

export interface BalanceBoardData {
    accounts: any[];
    recurringTransactions: any[];
    goals: any[];
    liabilities: any[];
    settings: any;
}
