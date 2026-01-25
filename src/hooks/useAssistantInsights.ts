import { useMemo } from 'react';
import { Goal, Liability, Account } from '@/types';

interface UseAssistantInsightsProps {
    accounts: Account[];
    goals: Goal[];
    liabilities: Liability[];
    expenses: { amount: number; isRecurring?: boolean }[];
    emergencyFundAmount?: number;
}

export const useAssistantInsights = ({
    accounts,
    goals,
    liabilities,
    expenses,
    emergencyFundAmount = 0
}: UseAssistantInsightsProps) => {

    // 1. Total Bank Balance (Real Money / Liquidity)
    const totalBankBalance = useMemo(() => {
        return accounts
            .filter(acc => acc.type === 'bank' || acc.type === 'cash')
            .reduce((sum, acc) => sum + acc.balance, 0);
    }, [accounts]);

    // 1.1 Total Credit Usage
    const totalCreditUsage = useMemo(() => {
        return accounts
            .filter(acc => acc.type === 'credit_card')
            .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    }, [accounts]);

    // 2. Commitments (Liabilities EMI + Recurring Expenses)
    const totalCommitments = useMemo(() => {
        const liabilityEMI = liabilities.reduce((sum, l) => sum + (l.emiAmount || 0), 0);
        const recurringExpenses = expenses
            .filter(e => e.isRecurring)
            .reduce((sum, e) => sum + e.amount, 0);

        return liabilityEMI + recurringExpenses;
    }, [liabilities, expenses]);

    // 3. Reserved Funds (Goal allocations + Emergency Fund)
    const reservedFundsTotal = useMemo(() => {
        const goalAllocated = goals.reduce((sum, g) => sum + g.currentAmount, 0);
        return goalAllocated + (emergencyFundAmount || 0);
    }, [goals, emergencyFundAmount]);

    // 4. Total Reserved (Reserved + Commitments)
    const totalReserved = useMemo(() => {
        return reservedFundsTotal + totalCommitments;
    }, [reservedFundsTotal, totalCommitments]);

    // 5. Available to Spend (The Hero Number)
    const availableToSpend = useMemo(() => {
        const safeBalance = totalBankBalance - totalReserved;
        return Math.max(0, safeBalance);
    }, [totalBankBalance, totalReserved]);

    return {
        totalBankBalance,
        totalCreditUsage,
        totalCommitments,
        reservedFundsTotal,
        totalReserved,
        availableToSpend
    };
};

// Legacy Export for Migration Phase
export const useVirtualReservations = useAssistantInsights;
export const useShadowWallet = useAssistantInsights;
