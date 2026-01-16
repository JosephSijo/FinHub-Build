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
                    data.description,
                    { amount: data.amount, category: data.category }
                ).catch(e => console.error("Catalog link failed", e));
                const { accounts: currentAccounts } = dataRef.current;
                const targetAccount = currentAccounts.find((a: any) => a.id === data.accountId);
                if (targetAccount) {
                    const { updateAccount, createRecurringTransaction } = actionsRef.current;
                    const newBalance = targetAccount.type === 'credit_card'
                        ? targetAccount.balance - data.amount
                        : targetAccount.balance + data.amount;
                    await updateAccount(targetAccount.id, { balance: newBalance });

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
            }
        } catch (error) {
            console.error('Error creating income:', error);
            setIncomes((prev: any[]) => [...prev, { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() }]);
            toast.warning("Added in offline mode");
        }
    }, [userId, setIncomes]);

    const updateIncome = useCallback(async (id: string, data: any) => {
        try {
            const response = await api.updateIncome(userId, id, data);
            if (response.success) {
                const { incomes: currentIncomes, accounts: currentAccounts } = dataRef.current;
                const oldIncome = currentIncomes.find((i: any) => i.id === id);
                if (oldIncome) {
                    const { updateAccount } = actionsRef.current;
                    const oldAccount = currentAccounts.find((a: any) => a.id === oldIncome.accountId);
                    if (oldAccount) {
                        const oldBalance = oldAccount.type === 'credit_card'
                            ? oldAccount.balance + oldIncome.amount
                            : oldAccount.balance - oldIncome.amount;
                        await updateAccount(oldAccount.id, { balance: oldBalance });
                    }
                    const newIncome = response.income;
                    const newAccount = currentAccounts.find((a: any) => a.id === newIncome.accountId);
                    if (newAccount) {
                        const newBalance = newAccount.type === 'credit_card'
                            ? newAccount.balance - newIncome.amount
                            : newAccount.balance + newIncome.amount;
                        await updateAccount(newAccount.id, { balance: newBalance });
                    }
                }
                setIncomes((prev: any[]) => prev.map(i => i.id === id ? response.income : i));
                toast.success("Income updated");
            }
        } catch {
            setIncomes((prev: any[]) => prev.map(i => i.id === id ? { ...i, ...data } : i));
            toast.warning("Updated in offline mode");
        }
    }, [userId, setIncomes]);

    const deleteIncome = useCallback(async (id: string) => {
        try {
            const response = await api.deleteIncome(userId, id);
            if (response.success) {
                const { incomes: currentIncomes, accounts: currentAccounts } = dataRef.current;
                const income = currentIncomes.find((i: any) => i.id === id);
                if (income) {
                    const { updateAccount } = actionsRef.current;
                    const targetAccount = currentAccounts.find((a: any) => a.id === income.accountId);
                    if (targetAccount) {
                        const newBalance = targetAccount.type === 'credit_card'
                            ? targetAccount.balance + income.amount
                            : targetAccount.balance - income.amount;
                        await updateAccount(targetAccount.id, { balance: newBalance });
                    }
                }
                setIncomes((prev: any[]) => prev.filter(i => i.id !== id));
                toast.success("Income deleted");
            }
        } catch {
            setIncomes((prev: any[]) => prev.filter(i => i.id !== id));
            toast.warning("Deleted in offline mode");
        }
    }, [userId, setIncomes]);

    return useMemo(() => ({ createIncome, updateIncome, deleteIncome }), [createIncome, updateIncome, deleteIncome]);
};
