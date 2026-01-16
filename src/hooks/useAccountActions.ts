import { useCallback, useMemo } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { catalogService } from '../features/catalog/service';

export const useAccountActions = (state: any) => {
    const { userId, setAccounts } = state;

    const createAccount = useCallback(async (data: any) => {
        try {
            const response = await api.createAccount(userId, data);
            if (response.success) {
                setAccounts((prev: any[]) => [...prev, response.account]);
                toast.success("Account created");

                // Auto-link to catalog (bank kind)
                catalogService.ensureCatalogAndLink(
                    userId,
                    'account',
                    response.account.id,
                    'bank',
                    data.name
                ).catch(e => console.error("Catalog link failed", e));
            }
        } catch {
            const temp = { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
            setAccounts((prev: any[]) => [...prev, temp]);
            toast.warning("Created locally");
        }
    }, [userId, setAccounts]);

    const updateAccount = useCallback(async (id: string, data: any) => {
        try {
            const response = await api.updateAccount(userId, id, data);
            if (response.success) {
                setAccounts((prev: any[]) => prev.map(a => a.id === id ? response.account : a));
                // Optional: skip toast for silent updates like balance sync
                // toast.success("Account updated");
            }
        } catch {
            setAccounts((prev: any[]) => prev.map(a => a.id === id ? { ...a, ...data } : a));
            toast.warning("Updated locally");
        }
    }, [userId, setAccounts]);

    const deleteAccount = useCallback(async (id: string) => {
        try {
            const response = await api.deleteAccount(userId, id);
            if (response.success) {
                setAccounts((prev: any[]) => prev.filter(a => a.id !== id));
                toast.success("Account deleted");
            }
        } catch {
            setAccounts((prev: any[]) => prev.filter(a => a.id !== id));
            toast.warning("Deleted locally");
        }
    }, [userId, setAccounts]);

    return useMemo(() => ({ createAccount, updateAccount, deleteAccount }), [createAccount, updateAccount, deleteAccount]);
};
