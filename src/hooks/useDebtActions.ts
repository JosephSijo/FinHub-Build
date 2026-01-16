import { useCallback, useMemo, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export const useDebtActions = (state: any, actions: any) => {
    const { userId, debts, setDebts, accounts, setExpenses, setIncomes } = state;

    const dataRef = useRef({ debts, accounts });
    useEffect(() => {
        dataRef.current = { debts, accounts };
    }, [debts, accounts]);

    const actionsRef = useRef(actions);
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    const createDebt = useCallback(async (data: any) => {
        try {
            const response = await api.createDebt(userId, data);
            if (response.success) {
                setDebts((prev: any[]) => [...prev, response.debt]);
                const { accounts: currentAccounts } = dataRef.current;
                const targetAccount = currentAccounts.find((a: any) => a.id === data.accountId);
                if (targetAccount) {
                    const { updateAccount } = actionsRef.current;
                    const balanceChange = data.type === 'borrowed' ? data.amount : -data.amount;
                    const newBalance = targetAccount.type === 'credit_card'
                        ? targetAccount.balance - balanceChange
                        : targetAccount.balance + balanceChange;
                    await updateAccount(targetAccount.id, { balance: newBalance });
                }
                if (data.isRecurring) {
                    const { createRecurringTransaction } = actionsRef.current;
                    await createRecurringTransaction({
                        type: 'expense',
                        description: `Debt: ${data.personName} (${data.type})`,
                        amount: data.amount,
                        category: 'Debt',
                        accountId: data.accountId,
                        frequency: data.frequency || 'monthly',
                        startDate: data.date,
                        tags: [...(data.tags || []), 'debt']
                    });
                }
                toast.success("Debt created");
            }
        } catch {
            setDebts((prev: any[]) => [...prev, { id: `temp_${Date.now()}`, ...data, status: 'pending', createdAt: new Date().toISOString() }]);
            toast.warning("Added in offline mode");
        }
    }, [userId, setDebts]);

    const updateDebt = useCallback(async (id: string, data: any) => {
        try {
            const response = await api.updateDebt(userId, id, data);
            if (response.success) {
                const { debts: currentDebts, accounts: currentAccounts } = dataRef.current;
                const oldDebt = currentDebts.find((d: any) => d.id === id);
                if (oldDebt) {
                    const { updateAccount, updateRecurringTransaction, createRecurringTransaction } = actionsRef.current;
                    const oldAccount = currentAccounts.find((a: any) => a.id === oldDebt.accountId);
                    if (oldAccount) {
                        const balanceChange = oldDebt.type === 'borrowed' ? -oldDebt.amount : oldDebt.amount;
                        const oldBalance = oldAccount.type === 'credit_card' ? oldAccount.balance - balanceChange : oldAccount.balance + balanceChange;
                        await updateAccount(oldAccount.id, { balance: oldBalance });
                    }
                    const newDebt = response.debt;
                    const newAccount = currentAccounts.find((a: any) => a.id === newDebt.accountId);
                    if (newAccount) {
                        const balanceChange = newDebt.type === 'borrowed' ? newDebt.amount : -newDebt.amount;
                        const newBalance = newAccount.type === 'credit_card' ? newAccount.balance - balanceChange : newAccount.balance + balanceChange;
                        await updateAccount(newAccount.id, { balance: newBalance });
                    }
                    if (data.isRecurring) {
                        if (oldDebt.recurringId) {
                            await updateRecurringTransaction(oldDebt.recurringId, { amount: data.amount, description: `Debt: ${data.personName} (${data.type})` });
                        } else {
                            await createRecurringTransaction({
                                type: 'expense', description: `Debt: ${data.personName} (${data.type})`,
                                amount: data.amount, category: 'Debt', accountId: data.accountId,
                                frequency: data.frequency || 'monthly', startDate: data.date, tags: [...(data.tags || []), 'debt']
                            });
                        }
                    }
                }
                setDebts((prev: any[]) => prev.map(d => d.id === id ? response.debt : d));
                toast.success("Debt updated");
            }
        } catch {
            setDebts((prev: any[]) => prev.map(d => d.id === id ? { ...d, ...data } : d));
            toast.warning("Updated in offline mode");
        }
    }, [userId, setDebts]);

    const settleDebt = useCallback(async (id: string) => {
        try {
            const response = await api.updateDebt(userId, id, { status: "settled" });
            if (response.success) {
                const { debts: currentDebts, accounts: currentAccounts } = dataRef.current;
                const debt = currentDebts.find((d: any) => d.id === id);
                if (debt && debt.status !== 'settled') {
                    const { updateAccount } = actionsRef.current;
                    const targetAccount = currentAccounts.find((a: any) => a.id === debt.accountId);
                    if (targetAccount) {
                        const settlementAmount = debt.type === 'borrowed' ? -debt.amount : debt.amount;
                        const newBalance = targetAccount.type === 'credit_card' ? targetAccount.balance - settlementAmount : targetAccount.balance + settlementAmount;
                        await updateAccount(targetAccount.id, { balance: newBalance });

                        const settlementTransaction = {
                            description: `Debt Settlement: ${debt.personName}`,
                            amount: debt.amount, category: 'Transfer',
                            date: new Date().toISOString().split('T')[0],
                            tags: ['debt-settlement'], accountId: debt.accountId
                        };
                        if (debt.type === 'borrowed') {
                            const res = await api.createExpense(userId, settlementTransaction);
                            if (res.success) setExpenses((prev: any[]) => [...prev, res.expense]);
                        } else {
                            const res = await api.createIncome(userId, settlementTransaction);
                            if (res.success) setIncomes((prev: any[]) => [...prev, res.income]);
                        }
                    }
                }
                setDebts((prev: any[]) => prev.map(d => d.id === id ? response.debt : d));
                toast.success("🎉 Debt settled! Great job!");
                confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
            }
        } catch {
            setDebts((prev: any[]) => prev.map(d => d.id === id ? { ...d, status: "settled" as const } : d));
            toast.warning("Marked as settled locally");
        }
    }, [userId, setExpenses, setIncomes, setDebts]);

    const deleteDebt = useCallback(async (id: string) => {
        try {
            const response = await api.deleteDebt(userId, id);
            if (response.success) {
                const { debts: currentDebts, accounts: currentAccounts } = dataRef.current;
                const debt = currentDebts.find((d: any) => d.id === id);
                if (debt) {
                    const { updateAccount } = actionsRef.current;
                    const targetAccount = currentAccounts.find((a: any) => a.id === debt.accountId);
                    if (targetAccount) {
                        const balanceChange = debt.type === 'borrowed' ? -debt.amount : debt.amount;
                        const newBalance = targetAccount.type === 'credit_card' ? targetAccount.balance - balanceChange : targetAccount.balance + balanceChange;
                        await updateAccount(targetAccount.id, { balance: newBalance });
                    }
                }
                setDebts((prev: any[]) => prev.filter(d => d.id !== id));
                toast.success("Debt deleted");
            }
        } catch {
            setDebts((prev: any[]) => prev.filter(d => d.id !== id));
            toast.warning("Deleted in offline mode");
        }
    }, [userId, setDebts]);

    return useMemo(() => ({ createDebt, updateDebt, settleDebt, deleteDebt }), [createDebt, updateDebt, settleDebt, deleteDebt]);
};
