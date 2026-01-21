export type BudgetPeriod = 'monthly' | 'weekly';

export interface CategoryLimit {
    id: string;
    userId: string;
    categoryId: string;
    period: BudgetPeriod;
    limitAmount: number;
    warnAtPercent: number;
    criticalAtPercent: number;
    autoCalculated: boolean;
    calculationVersion: string;
    createdAt: string;
    updatedAt: string;
}

export interface BudgetSnapshot {
    id: string;
    userId: string;
    month: string; // YYYY-MM
    mi: number; // Monthly Income
    fo: number; // Fixed Obligations
    sr: number; // Savings Reserve
    nsp: number; // Net Safe Pool
    obligationRatio: number;
    stressFactor: number;
    ssr: number; // Safe-to-Spend Ratio
    createdAt: string;
}

export interface HybridBudgetConfig {
    incomeAvgMonths: number;
    savingsReservePercent: number;
}
