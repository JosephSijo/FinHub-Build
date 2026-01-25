import { useCallback, useMemo, useRef, useEffect } from 'react';
import { checkAchievements, getAchievement } from '../utils/achievements';

export const useFinanceCheckers = (state: any, actions: any) => {
    const {
        accounts, goals, emergencyFundAmount, liabilities, debts,
        settings, recurringTransactions, setSettings
    } = state;

    const dataRef = useRef({
        accounts, goals, emergencyFundAmount, liabilities, debts,
        settings, recurringTransactions, expenses: state.expenses
    });

    useEffect(() => {
        dataRef.current = {
            accounts, goals, emergencyFundAmount, liabilities, debts,
            settings, recurringTransactions, expenses: state.expenses
        };
    }, [accounts, goals, emergencyFundAmount, liabilities, debts, settings, recurringTransactions, state.expenses]);

    const actionsRef = useRef(actions);
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    const checkSmartDues = useCallback(() => {
        const { addNotifications } = actionsRef.current;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { accounts: currentAccounts, goals: currentGoals, emergencyFundAmount: currentEF, liabilities: currentL, debts: currentD } = dataRef.current;

        const totalLiquidBank = currentAccounts.reduce((sum: number, acc: any) => sum + (acc.type === 'bank' || acc.type === 'cash' ? acc.balance : 0), 0);
        const totalReserved = currentGoals.reduce((sum: number, g: any) => sum + g.currentAmount, 0) + currentEF;
        const availableLiquidity = Math.max(0, totalLiquidBank - totalReserved);

        const upcomingDues: { name: string, amount: number, dueDate: Date, type: string }[] = [];

        currentL.forEach((l: any) => {
            const start = new Date(l.startDate);
            const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), start.getDate());
            if (dueThisMonth < today) dueThisMonth.setMonth(dueThisMonth.getMonth() + 1);

            const daysUntil = Math.ceil((dueThisMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 10) upcomingDues.push({ name: l.name, amount: l.emiAmount, dueDate: dueThisMonth, type: 'EMI' });
        });

        currentD.filter((d: any) => d.status !== 'settled').forEach((d: any) => {
            if (d.dueDate) {
                const due = new Date(d.dueDate);
                const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntil <= 10 && daysUntil >= -30) upcomingDues.push({ name: `Debt: ${d.personName}`, amount: d.amount, dueDate: due, type: 'Debt' });
            }
        });

        if (upcomingDues.length > 0) {
            const totalDueSoon = upcomingDues.reduce((sum, d) => sum + d.amount, 0);
            if (totalDueSoon > availableLiquidity) {
                addNotifications({
                    id: `smart_due_liquidity_${today.toISOString().split('T')[0]}`,
                    type: 'alert', priority: 'high', category: 'reminders',
                    title: 'Cash Warning',
                    message: `You have ₹${totalDueSoon.toLocaleString()} in dues within 10 days, but only ₹${availableLiquidity.toLocaleString()} available.`,
                    timestamp: new Date(), read: false
                });
            }
        }
    }, []);

    const checkForAchievements = useCallback(() => {
        const { addNotifications } = actionsRef.current;
        const { expenses: currentExpenses, goals: currentGoals, debts: currentD, accounts: currentA, settings: currentS } = dataRef.current;
        const currentIncomes = state.incomes || [];
        const totalExpenses = currentExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
        const totalIncome = currentIncomes.reduce((sum: number, i: any) => sum + i.amount, 0);

        const monthlySpendingRatio = totalIncome > 0 ? totalExpenses / totalIncome : 0;
        const savingsRate = totalIncome > 0 ? Math.max(0, (totalIncome - totalExpenses) / totalIncome) : 0;

        const stats = {
            totalTransactions: currentExpenses.length + currentIncomes.length,
            totalGoals: currentGoals.length,
            completedGoals: currentGoals.filter((g: any) => g.currentAmount >= g.targetAmount).length,
            totalDebts: currentD.length,
            settledDebts: currentD.filter((d: any) => d.status === 'settled' || d.status === 'PAID').length,
            totalAccounts: currentA.length,
            savingsRate,
            monthlySpendingRatio,
            notificationsEnabled: true,
            aiInteractions: 1,
            profileComplete: !!currentS.name && !!currentS.photoURL,
            dailyLogin: true, // If they are checking this, they are logged in
            currentStreak: currentS.currentStreak || 1
        };

        const newAchievementIds = checkAchievements(stats, currentS.unlockedAchievements || []);

        if (newAchievementIds.length > 0) {
            newAchievementIds.forEach((id: string) => {
                const achievement = getAchievement(id);
                if (achievement) {
                    addNotifications({
                        id: `achievement_${id}_${Date.now()}`,
                        type: 'achievement', priority: 'high', category: 'system',
                        title: 'New Achievement!', message: `You've unlocked: ${achievement.name}`,
                        timestamp: new Date(), read: false, achievementId: id
                    });
                }
            });

            setSettings((prev: any) => ({
                ...prev,
                unlockedAchievements: [...(prev.unlockedAchievements || []), ...newAchievementIds]
            }));
        }
    }, [setSettings]);

    return useMemo(() => ({ checkSmartDues, checkForAchievements }), [checkSmartDues, checkForAchievements]);
};
