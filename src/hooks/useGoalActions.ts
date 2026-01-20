import { useCallback, useMemo, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Goal } from '../types';

export const useGoalActions = (state: any, actions: any) => {
    const { userId, goals, setGoals, recurringTransactions } = state;

    const dataRef = useRef({ goals, recurringTransactions });
    useEffect(() => {
        dataRef.current = { goals, recurringTransactions };
    }, [goals, recurringTransactions]);

    const actionsRef = useRef(actions);
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    const createGoal = useCallback(async (data: any) => {
        try {
            const response: any = await api.createGoal(userId, data);
            const newGoal = response.goal;
            if (response.success && newGoal) {
                setGoals((prev: Goal[]) => [...prev, newGoal]);

                if (data.monthly_contribution > 0) {
                    const { createRecurringTransaction } = actionsRef.current;
                    await createRecurringTransaction({
                        type: 'expense',
                        description: `Goal Contribution: ${newGoal.name}`,
                        amount: data.monthly_contribution,
                        category: 'Transfer',
                        accountId: data.accountId || 'none',
                        frequency: 'monthly',
                        startDate: data.startDate || newGoal.createdAt.split('T')[0],
                        tags: ['goal', 'contribution', newGoal.name.toLowerCase()],
                        goalId: newGoal.id
                    });
                }

                toast.success("Goal created");
            }
        } catch {
            const temp = { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
            setGoals((prev: Goal[]) => [...prev, temp]);
            toast.warning("Created in offline mode");
        }
    }, [userId, setGoals]);

    const updateGoal = useCallback(async (id: string, data: any) => {
        try {
            const response: any = await api.updateGoal(userId, id, data);
            const updatedGoal = response.goal;
            if (response.success && updatedGoal) {
                const { goals: currentGoals, recurringTransactions: currentRT } = dataRef.current;
                const oldGoal = currentGoals.find((g: Goal) => g.id === id);
                if (oldGoal) {
                    const { createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } = actionsRef.current;
                    if ((updatedGoal.monthly_contribution || 0) > 0) {
                        const existingRec = currentRT.find((rt: any) => rt.goalId === id);
                        if (existingRec) {
                            await updateRecurringTransaction(existingRec.id, {
                                amount: updatedGoal.monthly_contribution || 0,
                                description: `Goal Contribution: ${updatedGoal.name}`
                            });
                        } else {
                            await createRecurringTransaction({
                                type: 'expense',
                                description: `Goal Contribution: ${updatedGoal.name}`,
                                amount: updatedGoal.monthly_contribution || 0,
                                category: 'Transfer',
                                accountId: updatedGoal.accountId || 'none',
                                frequency: 'monthly',
                                startDate: updatedGoal.startDate || oldGoal.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                                tags: ['goal', 'contribution', updatedGoal.name.toLowerCase()],
                                goalId: updatedGoal.id
                            });
                        }
                    } else if (oldGoal.monthly_contribution && oldGoal.monthly_contribution > 0) {
                        const existingRec = currentRT.find((rt: any) => rt.goalId === id);
                        if (existingRec) await deleteRecurringTransaction(existingRec.id);
                    }
                }

                setGoals((prev: Goal[]) => prev.map(g => g.id === id ? updatedGoal : g));
                if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
                    toast.success(`🎉 Goal "${updatedGoal.name}" completed!`);
                    confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
                } else {
                    toast.success("Goal updated");
                }
            }
        } catch {
            setGoals((prev: Goal[]) => prev.map(g => g.id === id ? { ...g, ...data } : g));
            toast.warning("Updated locally");
        }
    }, [userId, setGoals]);

    const deleteGoal = useCallback(async (id: string) => {
        try {
            const response = await api.deleteGoal(userId, id);
            if (response.success) {
                setGoals((prev: Goal[]) => prev.filter(g => g.id !== id));
                toast.success("Goal deleted");
            }
        } catch {
            setGoals((prev: Goal[]) => prev.filter(g => g.id !== id));
            toast.warning("Deleted locally");
        }
    }, [userId, setGoals]);

    return useMemo(() => ({ createGoal, updateGoal, deleteGoal }), [createGoal, updateGoal, deleteGoal]);
};
