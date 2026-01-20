import { useCallback, useMemo, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { Investment } from '../types';

export const useInvestmentActions = (state: any, actions: any) => {
    const { userId, investments, setInvestments, accounts, setExpenses, recurringTransactions } = state;

    const dataRef = useRef({ investments, accounts, recurringTransactions });
    useEffect(() => {
        dataRef.current = { investments, accounts, recurringTransactions };
    }, [investments, accounts, recurringTransactions]);

    const actionsRef = useRef(actions);
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    const createInvestment = useCallback(async (data: any, sourceAccountId?: string) => {
        try {
            const response = await api.createInvestment(userId, data);
            if (response.success) {
                setInvestments((prev: Investment[]) => [...prev, response.investment]);

                if (sourceAccountId && sourceAccountId !== 'none') {
                    const { accounts: currentAccounts } = dataRef.current;
                    const sourceAccount = currentAccounts.find((a: any) => a.id === sourceAccountId);
                    if (sourceAccount) {
                        const cost = data.buyPrice * data.quantity;
                        // Manual balance update is now redundant as api.createExpense below triggers the ledger
                        const transferData = {
                            description: `Asset Purchase: ${data.symbol} (${data.quantity} units)`,
                            amount: cost, category: 'Transfer',
                            date: data.purchaseDate || new Date().toISOString().split('T')[0],
                            tags: ['investment', 'principal', data.symbol],
                            accountId: sourceAccountId
                        };
                        const tResponse = await api.createExpense(userId, transferData);
                        if (tResponse.success) setExpenses((prev: any[]) => [...prev, tResponse.expense]);
                    }
                }

                if (response.investment && response.investment.type === 'sip') {
                    const { createRecurringTransaction } = actionsRef.current;
                    await createRecurringTransaction({
                        type: 'expense', description: `SIP: ${response.investment.symbol} (${response.investment.name})`,
                        amount: response.investment.buyPrice * response.investment.quantity,
                        category: 'Investment', accountId: (sourceAccountId as any) || 'none',
                        frequency: 'monthly', startDate: (response.investment as any).purchaseDate || response.investment.startDate,
                        tags: ['sip', 'investment', response.investment.symbol.toLowerCase()],
                        investmentId: response.investment.id
                    });
                }
                toast.success("Investment created");
            }
        } catch {
            const temp = { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
            setInvestments((prev: Investment[]) => [...prev, temp]);
            toast.warning("Created locally");
        }
    }, [userId, setExpenses, setInvestments]);

    const updateInvestment = useCallback(async (id: string, data: any) => {
        try {
            const response = await api.updateInvestment(userId, id, data);
            if (response.success) {
                const { investments: currentI, recurringTransactions: currentRT } = dataRef.current;
                const oldInv = currentI.find((inv: Investment) => inv.id === id);
                if (oldInv && response.investment) {
                    const { updateRecurringTransaction, createRecurringTransaction, deleteRecurringTransaction } = actionsRef.current;
                    if (response.investment.type === 'sip') {
                        const existingRec = currentRT.find((rt: any) => rt.investmentId === id);
                        if (existingRec && response.investment) {
                            await updateRecurringTransaction(existingRec.id, {
                                amount: response.investment.buyPrice * response.investment.quantity,
                                description: `SIP: ${response.investment.symbol} (${response.investment.name})`
                            });
                        } else if (response.investment) {
                            await createRecurringTransaction({
                                type: 'expense', description: `SIP: ${response.investment.symbol} (${response.investment.name})`,
                                amount: response.investment.buyPrice * response.investment.quantity,
                                category: 'Investment', accountId: (response.investment as any).accountId || 'none',
                                frequency: 'monthly', startDate: (response.investment as any).purchaseDate || response.investment.startDate,
                                tags: ['sip', 'investment', response.investment.symbol.toLowerCase()],
                                investmentId: response.investment.id
                            });
                        }
                    } else if (oldInv.type === 'sip') {
                        const existingRec = currentRT.find((rt: any) => rt.investmentId === id);
                        if (existingRec) await deleteRecurringTransaction(existingRec.id);
                    }
                }
                setInvestments((prev: Investment[]) => prev.map(inv => inv.id === id ? response.investment : inv));
                toast.success("Investment updated");
            }
        } catch {
            setInvestments((prev: Investment[]) => prev.map(i => i.id === id ? { ...i, ...data } : i));
            toast.warning("Updated locally");
        }
    }, [userId, setInvestments]);

    const deleteInvestment = useCallback(async (id: string) => {
        try {
            const response = await api.deleteInvestment(userId, id);
            if (response.success) {
                setInvestments((prev: Investment[]) => prev.filter(inv => inv.id !== id));
                toast.success("Investment deleted");
            }
        } catch {
            setInvestments((prev: Investment[]) => prev.filter(inv => inv.id !== id));
            toast.warning("Deleted locally");
        }
    }, [userId, setInvestments]);

    return useMemo(() => ({ createInvestment, updateInvestment, deleteInvestment }), [createInvestment, updateInvestment, deleteInvestment]);
};
