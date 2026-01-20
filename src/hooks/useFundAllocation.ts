import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../utils/api';

export const useFundAllocation = (state: any, actions: any) => {
    const { accounts, goals, setEmergencyFundAmount } = state;

    const dataRef = useRef({ accounts, goals });
    useEffect(() => {
        dataRef.current = { accounts, goals };
    }, [accounts, goals]);

    const actionsRef = useRef(actions);
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    const [isFundAllocationOpen, setIsFundAllocationOpen] = useState(false);
    const [fundAllocationType, setFundAllocationType] = useState<'goal' | 'emergency'>('goal');

    const openFundAllocation = useCallback((type: 'goal' | 'emergency') => {
        setFundAllocationType(type);
        setIsFundAllocationOpen(true);
    }, []);

    const closeFundAllocation = useCallback(() => {
        setIsFundAllocationOpen(false);
    }, []);

    const deductFromAccount = useCallback(async (accountId: string, amount: number, description: string) => {
        // Create an expense to record the outflow for allocation
        await api.createExpense(state.userId, {
            accountId,
            amount,
            description,
            date: new Date().toISOString(),
            category: 'Allocations',
            tags: ['allocation']
        });
    }, [state.userId]);

    const performFundAllocation = useCallback(async (data: {
        accountId: string;
        destinationId: string;
        amount: number;
        destinationType: 'goal' | 'emergency';
    }) => {
        try {
            const { updateGoal } = actionsRef.current;
            await deductFromAccount(data.accountId, data.amount, `Allocation to ${data.destinationType === 'goal' ? 'Goal' : 'Emergency Fund'}`);
            if (data.destinationType === 'goal') {
                const { goals: currentGoals } = dataRef.current;
                const goal = currentGoals.find((g: any) => g.id === data.destinationId);
                if (goal) {
                    await updateGoal(data.destinationId, { currentAmount: goal.currentAmount + data.amount });
                }
            } else {
                setEmergencyFundAmount((prev: number) => prev + data.amount);
            }
            toast.success("Funds allocated successfully!");
            closeFundAllocation();
        } catch (e) {
            console.error("Fund allocation failed", e);
            toast.error("Allocation failed");
        }
    }, [deductFromAccount, setEmergencyFundAmount, closeFundAllocation]);

    const transferFunds = useCallback(async (sourceId: string, destinationId: string, amount: number) => {
        try {
            const { userId } = state;
            const response = await api.createTransfer(userId, {
                sourceId,
                destinationId,
                amount,
                description: 'Inter-account transfer',
                date: new Date().toISOString()
            });

            if (response.success) {
                toast.success("Transfer complete");
            }
        } catch (e) {
            console.error("Transfer failed", e);
            toast.error("Transfer failed");
        }
    }, [state]);

    return useMemo(() => ({
        isFundAllocationOpen, fundAllocationType, openFundAllocation,
        closeFundAllocation, performFundAllocation, deductFromAccount, transferFunds
    }), [
        isFundAllocationOpen, fundAllocationType, openFundAllocation,
        closeFundAllocation, performFundAllocation, deductFromAccount, transferFunds
    ]);
};
