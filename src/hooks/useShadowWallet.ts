import { useMemo } from 'react';
import { Goal, Liability, Account } from '@/types';

interface UseShadowWalletProps {
    accounts: Account[];
    goals: Goal[];
    liabilities: Liability[];
    expenses: { amount: number; isRecurring?: boolean }[];
    emergencyFundAmount?: number;
}

export const useShadowWallet = ({
    accounts,
    goals,
    liabilities,
    expenses,
    emergencyFundAmount = 0
}: UseShadowWalletProps) => {

    // 1. Total Bank Balance (Real Money / Liquidity)
    const totalBankBalance = useMemo(() => {
        return accounts
            .filter(acc => acc.type === 'bank' || acc.type === 'cash')
            .reduce((sum, acc) => sum + acc.balance, 0);
    }, [accounts]);

    // 1.1 Total Credit Usage (The "Trap" Gauge)
    const totalCreditUsage = useMemo(() => {
        return accounts
            .filter(acc => acc.type === 'credit_card')
            .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    }, [accounts]);

    // 2. Commitments (Liabilities EMI + Recurring Expenses)
    const totalCommitments = useMemo(() => {
        const liabilityEMI = liabilities.reduce((sum, l) => sum + (l.emiAmount || 0), 0);
        // Rough estimate of recurring expenses if not explicitly marked (placeholder logic)
        const recurringExpenses = expenses
            .filter(e => e.isRecurring)
            .reduce((sum, e) => sum + e.amount, 0);

        return liabilityEMI + recurringExpenses;
    }, [liabilities, expenses]);

    // 3. Shadow Wallets (Virtual Reservations)
    // - Goal allocations
    // - Emergency Fund buffer (if part of balance)
    const shadowWalletTotal = useMemo(() => {
        const goalAllocated = goals.reduce((sum, g) => sum + g.currentAmount, 0);
        return goalAllocated + (emergencyFundAmount || 0);
    }, [goals, emergencyFundAmount]);

    // 4. Total Reserved (Goals + EF + Bills/Commitments)
    const totalReserved = useMemo(() => {
        return shadowWalletTotal + totalCommitments;
    }, [shadowWalletTotal, totalCommitments]);

    // 5. Available to Spend (The Hero Number)
    const availableToSpend = useMemo(() => {
        // Formula: Bank Balance - Total Reserved
        const safeBalance = totalBankBalance - totalReserved;
        return Math.max(0, safeBalance); // Never show negative available to spend (means debt trap)
    }, [totalBankBalance, totalReserved]);

    return {
        totalBankBalance,
        totalCreditUsage,
        totalCommitments,
        shadowWalletTotal, // Goals + EF
        totalReserved,    // Goals + EF + Commitments
        availableToSpend
    };
};
