import { useCallback, useRef, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '../utils/constants';
import { suggestionsService } from '../features/smartSuggestions/service';
import { supabase } from '../lib/supabase';
import { UserSettings } from '../types';

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

    const { applyTheme } = actions;

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
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const suffix = `${months[due.getMonth()]} ${due.getFullYear()} `;
                const baseDescription = newRec.name || newRec.description || newRec.source || 'Recurring Transaction';
                const finalDescription = `${baseDescription} ${suffix} `;

                const txData = {
                    description: newRec.type === 'expense' ? finalDescription : undefined,
                    source: newRec.type === 'income' ? finalDescription : undefined,
                    amount: newRec.amount,
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



    const purgeAllData = useCallback(async () => {
        const toastId = toast.loading("Executing secure wipe...");
        try {
            // 1. Database Wipe (Globalize unique metadata, wipe transactions)
            const { error } = await supabase.rpc('admin_reset_user_and_globalize', {
                p_target_user_id: userId
            });

            if (error) throw error;

            // 2. Clear all data from localStorage EXCEPT auth-related keys
            Object.values(STORAGE_KEYS).forEach(key => {
                if (key !== STORAGE_KEYS.AUTH &&
                    key !== STORAGE_KEYS.REMEMBERED_MOBILE &&
                    key !== STORAGE_KEYS.DELETION_SCHEDULE) {
                    localStorage.removeItem(key);
                }
            });

            // 3. Reset local state
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

            toast.success("Security wipe complete. Metadata globalized.", { id: toastId });
        } catch (error: any) {
            console.error("Purge failed:", error);
            toast.error(`Wipe failed: ${error.message} `, { id: toastId });
        }
    }, [
        userId, setExpenses, setIncomes, setDebts, setGoals, setAccounts,
        setInvestments, setLiabilities, setRecurringTransactions,
        setNotifications, setEmergencyFundAmount
    ]);


    return useMemo(() => ({
        updateSettings,
        fetchFromApi,
        refreshData,
        executeBackfill,
        purgeAllData
    }), [
        updateSettings,
        fetchFromApi,
        refreshData,
        executeBackfill,
        purgeAllData
    ]);
};
