import { useCallback, useMemo, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { catalogService } from '../features/catalog/service';

export const useIncomeActions = (state: any, actions: any) => {
    const { userId, incomes, setIncomes, accounts } = state;

    const dataRef = useRef({ incomes, accounts });
    useEffect(() => {
        dataRef.current = { incomes, accounts };
    }, [incomes, accounts]);

    const actionsRef = useRef(actions);
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    const createIncome = useCallback(async (data: any) => {
        try {
            const response = await api.createIncome(userId, data);
            if (response.success) {
                setIncomes((prev: any[]) => [...prev, response.income]);

                // Auto-link to catalog (merchant kind)
                catalogService.ensureCatalogAndLink(
                    userId,
                    'transaction',
                    response.income.id,
                    'merchant',
                    data.source || data.description || 'Income',
                    { amount: data.amount, category: data.category }
                ).catch(e => console.error("Catalog link failed", e));
                const { accounts: currentAccounts } = dataRef.current;
                const targetAccount = currentAccounts.find((a: any) => a.id === data.accountId);
                const { createRecurringTransaction } = actionsRef.current;
                if (targetAccount) {
                    // DB Trigger handles balance
                    if (data.isRecurring) {
                        await createRecurringTransaction({
                            type: 'income', description: data.description, amount: data.amount, category: data.category,
                            accountId: data.accountId, frequency: data.frequency || 'monthly', customIntervalDays: data.customIntervalDays,
                            startDate: data.date, endDate: data.endDate, tags: data.tags
                        });
                    } else {
                        toast.success("Income added!");
                    }
                } else {
                    toast.success("Income added!");
                }
            } else {
                throw response.error || new Error("API failed");
            }
        } catch (error) {
            console.error('Error creating income:', error);
            setIncomes((prev: any[]) => [...prev, { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() }]);
            toast.warning(`Added in offline mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [userId, setIncomes]);

    const updateIncome = useCallback(async (id: string, data: any) => {
        try {
            const response = await api.updateIncome(userId, id, data);
            if (response.success) {
                const { incomes: currentIncomes, accounts: currentAccounts } = dataRef.current;
                const oldIncome = currentIncomes.find((i: any) => i.id === id);
                if (oldIncome) {
                    const oldAccount = currentAccounts.find((a: any) => a.id === oldIncome.accountId);
                    if (oldAccount) {
                        // DB trigger handles balance reversal
                    }
                    const newIncome = response.income;
                    const newAccount = currentAccounts.find((a: any) => a.id === newIncome.accountId);
                    if (newAccount) {
                        // DB trigger handles balance update
                    }
                }
                setIncomes((prev: any[]) => prev.map(i => i.id === id ? response.income : i));
                toast.success("Income updated");
            } else {
                throw response.error || new Error("API failed");
            }
        } catch (error) {
            setIncomes((prev: any[]) => prev.map(i => i.id === id ? { ...i, ...data } : i));
            toast.warning(`Updated in offline mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [userId, setIncomes]);

    const deleteIncome = useCallback(async (id: string) => {
        try {
            const response = await api.deleteIncome(userId, id);
            if (response.success) {
                const { incomes: currentIncomes, accounts: currentAccounts } = dataRef.current;
                const income = currentIncomes.find((i: any) => i.id === id);
                if (income) {
                    const targetAccount = currentAccounts.find((a: any) => a.id === income.accountId);
                    if (targetAccount) {
                        // DB trigger handles balance reversal on delete
                    }
                }
                setIncomes((prev: any[]) => prev.filter(i => i.id !== id));
                toast.success("Income deleted");
            } else {
                throw response.error || new Error("API failed");
            }
        } catch (error) {
            setIncomes((prev: any[]) => prev.filter(i => i.id !== id));
            toast.warning(`Deleted in offline mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [userId, setIncomes]);

    return useMemo(() => ({ createIncome, updateIncome, deleteIncome }), [createIncome, updateIncome, deleteIncome]);
};
