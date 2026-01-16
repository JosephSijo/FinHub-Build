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
            const response = await api.createGoal(userId, data);
            if (response.success) {
                setGoals((prev: Goal[]) => [...prev, response.goal]);

                if (data.monthly_contribution > 0) {
                    const { createRecurringTransaction } = actionsRef.current;
                    await createRecurringTransaction({
                        type: 'expense',
                        description: `Goal Contribution: ${response.goal.name}`,
                        amount: data.monthly_contribution,
                        category: 'Transfer',
                        accountId: data.accountId || 'none',
                        frequency: 'monthly',
                        startDate: data.startDate || response.goal.createdAt.split('T')[0],
                        tags: ['goal', 'contribution', response.goal.name.toLowerCase()],
                        goalId: response.goal.id
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
            const response = await api.updateGoal(userId, id, data);
            if (response.success) {
                const { goals: currentGoals, recurringTransactions: currentRT } = dataRef.current;
                const oldGoal = currentGoals.find((g: Goal) => g.id === id);
                if (oldGoal) {
                    const { createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } = actionsRef.current;
                    if ((response.goal.monthly_contribution || 0) > 0) {
                        const existingRec = currentRT.find((rt: any) => rt.goalId === id);
                        if (existingRec) {
                            await updateRecurringTransaction(existingRec.id, {
                                amount: response.goal.monthly_contribution || 0,
                                description: `Goal Contribution: ${response.goal.name}`
                            });
                        } else {
                            await createRecurringTransaction({
                                type: 'expense',
                                description: `Goal Contribution: ${response.goal.name}`,
                                amount: response.goal.monthly_contribution || 0,
                                category: 'Transfer',
                                accountId: response.goal.accountId || 'none',
                                frequency: 'monthly',
                                startDate: response.goal.startDate || oldGoal.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                                tags: ['goal', 'contribution', response.goal.name.toLowerCase()],
                                goalId: response.goal.id
                            });
                        }
                    } else if (oldGoal.monthly_contribution && oldGoal.monthly_contribution > 0) {
                        const existingRec = currentRT.find((rt: any) => rt.goalId === id);
                        if (existingRec) await deleteRecurringTransaction(existingRec.id);
                    }
                }

                setGoals((prev: Goal[]) => prev.map(g => g.id === id ? response.goal : g));
                if (response.goal.currentAmount >= response.goal.targetAmount) {
                    toast.success(`🎉 Goal "${response.goal.name}" completed!`);
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
