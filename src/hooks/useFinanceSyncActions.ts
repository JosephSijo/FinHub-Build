import { useCallback, useMemo, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '../utils/constants';
import { isKnownSubscription, autoCategorize } from '../utils/autoCategorize';
import { UserSettings, Expense } from '../types';
import { suggestionsService } from '../features/smartSuggestions/service';

export const useFinanceSyncActions = (state: any, actions: any) => {
    const {
        userId, settings, setSettings, setAccounts, setExpenses, setIncomes,
        setDebts, setGoals, setLiabilities, setInvestments,
        setRecurringTransactions, setNotifications, setEmergencyFundAmount,
        setIsOffline, setApiStatus, backfillRequest, setBackfillRequest,
        expenses, incomes, goals, accounts, liabilities, recurringTransactions, debts, investments,
        setIsRefreshing // Destructure these directly
    } = state;

    // Use a ref to store the latest data to keep action functions stable
    const dataRef = useRef({
        expenses, incomes, goals, accounts, liabilities, recurringTransactions, settings, debts, investments
    });

    useEffect(() => {
        dataRef.current = {
            expenses, incomes, goals, accounts, liabilities, recurringTransactions, settings, debts, investments
        };
    }, [expenses, incomes, goals, accounts, liabilities, recurringTransactions, settings, debts, investments]);

    const { createRecurringTransaction, deleteExpense,
        deleteIncome, applyTheme } = actions;

    const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
        setSettings((prev: UserSettings) => ({ ...prev, ...updates }));

        // Use applyTheme from bundle if updates.theme exists
        if (updates.theme) applyTheme(updates.theme);

        try {
            const response = await api.updateSettings(userId, updates);
            if (response.success) {
                setSettings((prev: UserSettings) => ({
                    ...prev,
                    ...response.settings,
                    aiProvider: response.settings.aiProvider || prev.aiProvider,
                    apiKeys: { ...prev.apiKeys, ...response.settings.apiKeys }
                }));
            } else {
                throw new Error("Failed to update settings");
            }
        } catch (error) {
            console.error("Failed to sync settings", error);
            toast.error("Settings saved locally only");
        }
    }, [userId, setSettings, applyTheme]);

    const mergeOfflineData = useCallback((serverData: any[], localData: any[]) => {
        const offlineItems = localData.filter(item => item.id?.toString().startsWith('temp_'));
        // Return server data with offline items prepended
        return [...offlineItems, ...serverData];
    }, []);

    const fetchFromApi = useCallback(async () => {
        try {
            try { await api.processRecurring(userId); } catch (e) { console.error("Skip recurring process", e) }

            const [
                settingsRes, accountsRes, expensesRes, incomesRes, debtsRes,
                goalsRes, liabilitiesRes, investmentsRes, recurringRes
            ] = await Promise.all([
                api.getSettings(userId).catch(() => ({ success: false, settings: undefined })),
                api.getAccounts(userId).catch(() => ({ success: false, accounts: [] })),
                api.getExpenses(userId).catch(() => ({ success: false, expenses: [] })),
                api.getIncomes(userId).catch(() => ({ success: false, incomes: [] })),
                api.getDebts(userId).catch(() => ({ success: false, debts: [] })),
                api.getGoals(userId).catch(() => ({ success: false, goals: [] })),
                api.getLiabilities(userId).catch(() => ({ success: false, liabilities: [] })),
                api.getInvestments(userId).catch(() => ({ success: false, investments: [] })),
                api.getRecurring(userId).catch(() => ({ success: false, recurring: [] })),
            ]);

            setIsOffline(false);
            setApiStatus('online');

            if (settingsRes.success && settingsRes.settings) {
                setSettings((prev: UserSettings) => ({
                    ...prev,
                    ...settingsRes.settings,
                    aiProvider: settingsRes.settings.aiProvider || prev.aiProvider,
                    apiKeys: { ...prev.apiKeys, ...settingsRes.settings.apiKeys }
                }));
                applyTheme(settingsRes.settings.theme);
            }

            // Get current local data from dataRef to avoid stale closures
            const local = dataRef.current;

            if (accountsRes.success) setAccounts(mergeOfflineData(accountsRes.accounts || [], local.accounts));
            if (expensesRes.success) setExpenses(mergeOfflineData(expensesRes.expenses || [], local.expenses));
            if (incomesRes.success) setIncomes(mergeOfflineData(incomesRes.incomes || [], local.incomes));
            if (debtsRes.success) setDebts(mergeOfflineData(debtsRes.debts || [], local.debts));
            if (goalsRes.success) setGoals(mergeOfflineData(goalsRes.goals || [], local.goals));
            if (liabilitiesRes.success) setLiabilities(mergeOfflineData(liabilitiesRes.liabilities || [], local.liabilities));
            if (investmentsRes.success) setInvestments(mergeOfflineData(investmentsRes.investments || [], local.investments));
            if (recurringRes.success) setRecurringTransactions(mergeOfflineData(recurringRes.recurring || [], local.recurringTransactions));

            // 2. Generate Smart Suggestions
            suggestionsService.generateForUser(userId).catch(e => console.error("Suggestions update failed", e));

            toast.success("Sync complete");
        } catch (error) {
            console.error("API Sync failed", error);
            setIsOffline(true);
            setApiStatus('offline');
        }
    }, [userId, setSettings, setAccounts, setExpenses, setIncomes, setDebts, setGoals, setLiabilities, setInvestments, setRecurringTransactions, setIsOffline, setApiStatus, applyTheme, mergeOfflineData]);

    const refreshData = useCallback(async () => {
        setIsRefreshing(true);
        await fetchFromApi();
        setIsRefreshing(false);
    }, [setIsRefreshing, fetchFromApi]);

    const executeBackfill = useCallback(async () => {
        if (!backfillRequest) return;
        const { count, dates, recurring: newRec } = backfillRequest;
        const { goals: currentGoals, liabilities: currentLiabilities } = dataRef.current;

        setBackfillRequest(null);

        const toastId = toast.loading(`Generating ${count} entries...`);
        const createdIncomes: any[] = [];
        const createdExpenses: any[] = [];

        const goalChanges: Record<string, number> = {};
        const liabilityChanges: Record<string, number> = {};

        try {
            for (const due of dates) {
                const dateStr = due.toISOString().split('T')[0];
                const txData = {
                    description: newRec.description, source: newRec.source, amount: newRec.amount,
                    category: newRec.category, date: dateStr, tags: [...(newRec.tags || []), 'auto-backfill'],
                    accountId: newRec.accountId, isRecurring: true, recurringId: newRec.id,
                    liabilityId: newRec.liabilityId, investmentId: newRec.investmentId
                };

                if (newRec.type === 'expense') {
                    const res = await api.createExpense(userId, txData);
                    if (res.success) {
                        createdExpenses.push(res.expense);
                        if (newRec.goalId) goalChanges[newRec.goalId] = (goalChanges[newRec.goalId] || 0) + res.expense.amount;
                        if (newRec.liabilityId) liabilityChanges[newRec.liabilityId] = (liabilityChanges[newRec.liabilityId] || 0) + res.expense.amount;
                    }
                } else {
                    const res = await api.createIncome(userId, txData);
                    if (res.success) {
                        createdIncomes.push(res.income);
                    }
                }
                await new Promise(r => setTimeout(r, 30));
            }

            if (createdIncomes.length > 0) setIncomes((prev: any[]) => [...prev, ...createdIncomes]);
            if (createdExpenses.length > 0) setExpenses((prev: any[]) => [...prev, ...createdExpenses]);

            for (const [gid, change] of Object.entries(goalChanges)) {
                const goal = currentGoals.find((g: any) => g.id === gid);
                if (goal) {
                    const newAmount = goal.currentAmount + change;
                    await api.updateGoal(userId, gid, { currentAmount: newAmount });
                    setGoals((prev: any[]) => prev.map(g => g.id === gid ? { ...g, currentAmount: newAmount } : g));
                }
            }
            for (const [lid, change] of Object.entries(liabilityChanges)) {
                const liability = currentLiabilities.find((l: any) => l.id === lid);
                if (liability) {
                    const newOutstanding = Math.max(0, liability.outstanding - change);
                    await api.updateLiability(userId, lid, { outstanding: newOutstanding });
                    setLiabilities((prev: any[]) => prev.map(l => l.id === lid ? { ...l, outstanding: newOutstanding } : l));
                }
            }
            toast.success("Backfill complete", { id: toastId });
        } catch (error) {
            console.error("Backfill failed", error);
            toast.error("Backfill partial failure", { id: toastId });
        }
    }, [userId, backfillRequest, setIncomes, setExpenses, setGoals, setLiabilities, setBackfillRequest]);

    const migrateSubscriptions = useCallback(async (): Promise<{ count: number }> => {
        let updateCount = 0;
        const currentExpenses = dataRef.current.expenses;
        const updates: Promise<any>[] = [];
        for (const expense of currentExpenses) {
            if (expense.category !== 'Subscription' && isKnownSubscription(expense.description)) {
                const details = autoCategorize(expense.description);
                if (details && details.category === 'Subscription') {
                    updates.push(actions.updateExpense(expense.id, {
                        category: 'Subscription',
                        tags: [...new Set([...expense.tags, 'auto-migrated', 'subscription'])]
                    }));
                    updateCount++;
                }
            }
        }
        if (updates.length > 0) {
            await Promise.all(updates);
            toast.success(`Migrated ${updateCount} transactions to Subscriptions`);
        } else { toast.info("No subscription transactions found to migrate"); }
        return { count: updateCount };
    }, [actions]);

    const cleanupDuplicates = useCallback(async (): Promise<{ count: number }> => {
        let removedCount = 0;
        const { expenses: currentExpenses, incomes: currentIncomes } = dataRef.current;
        const updates: Promise<any>[] = [];
        const seen = new Set<string>();
        const expensesToDelete = new Set<string>();

        currentExpenses.forEach((expense: Expense) => {
            const key = `${expense.date}-${expense.description?.toLowerCase().trim()}-${expense.amount}`;
            const isBlank = !expense.description || expense.description.trim() === '' || expense.amount === 0;
            if (isBlank || seen.has(key)) expensesToDelete.add(expense.id);
            else seen.add(key);
        });

        const subGroups = new Map<string, Expense[]>();
        currentExpenses.forEach((e: Expense) => {
            if (expensesToDelete.has(e.id)) return;
            if (e.category === 'Subscription' || e.isRecurring || isKnownSubscription(e.description)) {
                const date = new Date(e.date);
                const key = `${e.description.toLowerCase().trim()}-${date.getFullYear()}-${date.getMonth()}`;
                if (!subGroups.has(key)) subGroups.set(key, []);
                subGroups.get(key)!.push(e);
            }
        });

        subGroups.forEach((group) => {
            if (group.length > 1) {
                group.sort((a, b) => {
                    if (a.isRecurring !== b.isRecurring) return a.isRecurring ? -1 : 1;
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                });
                for (let i = 1; i < group.length; i++) expensesToDelete.add(group[i].id);
            }
        });

        expensesToDelete.forEach(id => {
            updates.push(deleteExpense(id));
            removedCount++;
        });

        const seenIncomes = new Set<string>();
        for (const income of currentIncomes) {
            const key = `${income.date}-${income.source?.toLowerCase().trim()}-${income.amount}`;
            if (!income.source || income.source.trim() === '' || income.amount === 0 || seenIncomes.has(key)) {
                updates.push(deleteIncome(income.id));
                removedCount++;
            } else seenIncomes.add(key);
        }

        if (updates.length > 0) {
            await Promise.all(updates);
            toast.success(`Cleaned up ${removedCount} entries`);
        } else toast.info("Logs are clean.");

        return { count: removedCount };
    }, [deleteExpense, deleteIncome]);

    const purgeAllData = useCallback(() => {
        // Clear all data from localStorage EXCEPT auth-related keys
        Object.values(STORAGE_KEYS).forEach(key => {
            // Skip auth-related keys to keep user logged in
            if (key !== STORAGE_KEYS.AUTH &&
                key !== STORAGE_KEYS.REMEMBERED_MOBILE) {
                localStorage.removeItem(key);
            }
        });

        // Reset all financial data
        setExpenses([]);
        setIncomes([]);
        setDebts([]);
        setGoals([]);
        setAccounts([]);
        setInvestments([]);
        setLiabilities([]);
        setRecurringTransactions([]);
        setNotifications([]);
        setEmergencyFundAmount(0);

        // DO NOT log out the user - keep auth state intact
        // setCurrentUser(null);
        // setAuthStatus('guest');
        // setPendingMobile('');

        toast.success("All data cleared successfully. You remain logged in.");
    }, [
        setExpenses, setIncomes, setDebts, setGoals, setAccounts,
        setInvestments, setLiabilities, setRecurringTransactions,
        setNotifications, setEmergencyFundAmount
    ]);

    const runCategorizationMigration = useCallback(() => {
        const currentRecurring = dataRef.current.recurringTransactions;
        setExpenses((prev: Expense[]) => {
            const nextExpenses = [...prev];
            const subs = nextExpenses.filter(e => isKnownSubscription(e.description));

            if (subs.length > 0) {
                subs.forEach(exp => {
                    if (exp.category === 'Subscription') return;
                    exp.category = 'Subscription';
                    exp.tags = Array.from(new Set([...(exp.tags || []), 'auto-migrated']));

                    const alreadyTracked = currentRecurring.some((rt: any) =>
                        rt.description?.toLowerCase().includes(exp.description.toLowerCase()) ||
                        exp.description.toLowerCase().includes(rt.description?.toLowerCase() || '')
                    );

                    if (!alreadyTracked) {
                        setTimeout(() => {
                            createRecurringTransaction({
                                type: 'expense',
                                description: exp.description,
                                amount: exp.amount,
                                category: 'Subscription',
                                accountId: exp.accountId,
                                frequency: 'monthly',
                                startDate: exp.date,
                                tags: ['auto-migrated']
                            });
                        }, 100);
                    }
                });
            }
            return nextExpenses;
        });
    }, [createRecurringTransaction, setExpenses]);

    return useMemo(() => ({
        updateSettings,
        fetchFromApi,
        refreshData,
        executeBackfill,
        migrateSubscriptions,
        cleanupDuplicates,
        purgeAllData,
        runCategorizationMigration
    }), [
        updateSettings,
        fetchFromApi,
        refreshData,
        executeBackfill,
        migrateSubscriptions,
        cleanupDuplicates,
        purgeAllData,
        runCategorizationMigration
    ]);
};
