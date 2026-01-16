import { useCallback, useMemo, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { Liability } from '../types';

export const useLiabilityActions = (state: any, actions: any) => {
    const { userId, liabilities, setLiabilities, recurringTransactions } = state;

    const dataRef = useRef({ liabilities, recurringTransactions });
    useEffect(() => {
        dataRef.current = { liabilities, recurringTransactions };
    }, [liabilities, recurringTransactions]);

    const actionsRef = useRef(actions);
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    const createLiability = useCallback(async (data: Omit<Liability, 'id'>) => {
        try {
            const response = await api.createLiability(userId, data);
            if (response.success) {
                setLiabilities((prev: Liability[]) => [...prev, response.liability]);
                toast.success("Liability created");
                if (response.liability.emiAmount > 0) {
                    const { createRecurringTransaction } = actionsRef.current;
                    await createRecurringTransaction({
                        type: 'expense', description: `EMI: ${response.liability.name}`,
                        amount: response.liability.emiAmount, category: 'EMI',
                        accountId: response.liability.accountId || 'none',
                        frequency: 'monthly', startDate: response.liability.startDate,
                        tags: ['emi', 'liability', response.liability.name.toLowerCase()],
                        liabilityId: response.liability.id
                    });
                }
            }
        } catch {
            const temp = { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() } as Liability;
            setLiabilities((prev: Liability[]) => [...prev, temp]);
            toast.warning("Created locally");
        }
    }, [userId, setLiabilities]);

    const updateLiability = useCallback(async (id: string, data: Partial<Liability>) => {
        try {
            const response = await api.updateLiability(userId, id, data);
            if (response.success) {
                const { liabilities: currentL, recurringTransactions: currentRT } = dataRef.current;
                const oldLiability = currentL.find((l: Liability) => l.id === id);
                if (oldLiability) {
                    const { createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } = actionsRef.current;
                    if (response.liability.emiAmount > 0) {
                        const existingRec = currentRT.find((rt: any) => rt.liabilityId === id);
                        if (existingRec) {
                            await updateRecurringTransaction(existingRec.id, { amount: response.liability.emiAmount, description: `EMI: ${response.liability.name}` });
                        } else {
                            await createRecurringTransaction({
                                type: 'expense', description: `EMI: ${response.liability.name}`,
                                amount: response.liability.emiAmount, category: 'EMI',
                                accountId: response.liability.accountId || 'none',
                                frequency: 'monthly', startDate: response.liability.startDate,
                                tags: ['emi', 'liability', response.liability.name.toLowerCase()],
                                liabilityId: response.liability.id
                            });
                        }
                    } else if (oldLiability.emiAmount > 0) {
                        const existingRec = currentRT.find((rt: any) => rt.liabilityId === id);
                        if (existingRec) await deleteRecurringTransaction(existingRec.id);
                    }
                }
                setLiabilities((prev: Liability[]) => prev.map(l => l.id === id ? response.liability : l));
                toast.success("Liability updated");
            }
        } catch {
            setLiabilities((prev: Liability[]) => prev.map(l => l.id === id ? { ...l, ...data } as Liability : l));
            toast.warning("Updated locally");
        }
    }, [userId, setLiabilities]);

    const deleteLiability = useCallback(async (id: string) => {
        try {
            const response = await api.deleteLiability(userId, id);
            if (response.success) {
                setLiabilities((prev: Liability[]) => prev.filter(l => l.id !== id));
                toast.success("Liability deleted");
            }
        } catch {
            setLiabilities((prev: Liability[]) => prev.filter(l => l.id !== id));
            toast.warning("Deleted locally");
        }
    }, [userId, setLiabilities]);

    return useMemo(() => ({ createLiability, updateLiability, deleteLiability }), [createLiability, updateLiability, deleteLiability]);
};
