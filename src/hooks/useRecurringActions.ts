import { useCallback, useMemo } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { RecurringTransaction } from '../types';
import { recurringService } from '../features/recurringEngine';
import { catalogService } from '../features/catalog/service';

export const useRecurringActions = (state: any) => {
    const { userId, setRecurringTransactions, setBackfillRequest } = state;

    const executeBackfill = useCallback(async (customRequest?: any) => {
        const req = customRequest || state.backfillRequest;
        if (!req || !req.recurring) return;

        try {
            toast.info("Generating transactions...");
            const count = await recurringService.backfillRule(userId, req.recurring);
            if (count > 0) {
                toast.success(`Generated ${count} missing transactions.`);
            } else {
                toast.success("Done: No new transactions needed.");
            }
        } catch (error) {
            console.error('Backfill error:', error);
            toast.error("Failed to generate some transactions.");
        } finally {
            setBackfillRequest(null);
        }
    }, [userId, state.backfillRequest, setBackfillRequest]);

    const deleteRecurringTransaction = useCallback(async (id: string) => {
        try {
            const response = await api.deleteRecurring(userId, id);
            if (response.success) {
                setRecurringTransactions((prev: RecurringTransaction[]) => prev.filter(r => r.id !== id));
                toast.success('Recurring transaction deleted');
            }
        } catch {
            setRecurringTransactions((prev: RecurringTransaction[]) => prev.filter(r => r.id !== id));
            toast.warning('Deleted locally');
        }
    }, [userId, setRecurringTransactions]);

    const updateRecurringTransaction = useCallback(async (id: string, data: any) => {
        try {
            const response = await api.updateRecurring(userId, id, data);
            if (response.success) {
                const updatedRec = response.recurring as any;
                setRecurringTransactions((prev: RecurringTransaction[]) => prev.map(r => r.id === id ? updatedRec : r));
                toast.success('Recurring transaction updated');

                // Check for Backfill
                const preview = await recurringService.getBackfillPreview(updatedRec);
                if (preview.count > 0) {
                    setBackfillRequest({
                        count: preview.count,
                        dates: preview.dates,
                        recurring: updatedRec
                    });
                } else {
                    toast.success("Transaction history is already up to date.");
                }
            }
        } catch (error) {
            console.error('Error updating recurring transaction:', error);
            setRecurringTransactions((prev: any[]) => prev.map(r => r.id === id ? { ...r, ...data } : r));
            toast.warning('Updated locally');
        }
    }, [userId, setRecurringTransactions, setBackfillRequest]);

    const createRecurringTransaction = useCallback(async (data: any) => {
        try {
            const response = await api.createRecurring(userId, data);
            if (response.success) {
                const newRec = response.recurring;
                setRecurringTransactions((prev: RecurringTransaction[]) => [...prev, newRec]);
                toast.success('Recurring transaction created');

                // Auto-link to catalog (subscription kind)
                catalogService.ensureCatalogAndLink(
                    userId,
                    'subscription',
                    newRec.id,
                    'subscription',
                    data.name
                ).catch(e => console.error("Catalog link failed", e));

                // Check for Backfill
                const preview = await recurringService.getBackfillPreview(newRec);
                if (preview.count > 0) {
                    setBackfillRequest({
                        count: preview.count,
                        dates: preview.dates,
                        recurring: newRec
                    });
                } else {
                    toast.success("Transaction history is up to date.");
                }
            }
        } catch (error) {
            console.error('Error creating recurring transaction:', error);
            setRecurringTransactions((prev: any[]) => [...prev, { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() }]);
            toast.warning('Offline: Created locally');
        }
    }, [userId, setRecurringTransactions, setBackfillRequest]);

    return useMemo(() => ({
        createRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        executeBackfill
    }), [createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction, executeBackfill]);
};
