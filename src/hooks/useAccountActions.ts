import { useCallback, useMemo } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { catalogService } from '../features/catalog/service';

export const useAccountActions = (state: any) => {
    const { setAccounts, userId } = state;

    const createAccount = useCallback(async (data: any) => {
        try {
            if (!userId) {
                toast.error("Please login to add an account");
                return;
            }

            const response = await api.createAccount(userId, data);

            if (response.success && response.account) {
                const newAccount = response.account;
                setAccounts((prev: any[]) => [...prev, {
                    ...newAccount,
                    color: data.color,
                    icon: data.icon,
                    creditLimit: data.creditLimit,
                    safeLimitPercentage: data.safeLimitPercentage,
                    serviceChargePercentage: data.serviceChargePercentage,
                    statementDate: data.statementDate
                }]);

                toast.success("Account created successfully");

                // Auto-link to catalog (bank kind)
                catalogService.ensureCatalogAndLink(
                    userId,
                    'account',
                    newAccount.id,
                    'bank',
                    data.name
                ).catch(e => console.error("Catalog link failed", e));
            } else {
                throw new Error("Failed to create account on server");
            }

        } catch (error: any) {
            console.error('Error creating account:', error);
            const temp = {
                id: `temp_${Date.now()}`,
                ...data,
                createdAt: new Date().toISOString()
            };
            setAccounts((prev: any[]) => [...prev, temp]);
            toast.warning("Created locally (offline mode)");
        }
    }, [userId, setAccounts]);

    const updateAccount = useCallback(async (id: string, data: any) => {
        try {
            if (!userId) {
                toast.error("Please login to update account");
                return;
            }

            const response = await api.updateAccount(userId, id, data);

            if (response.success) {
                setAccounts((prev: any[]) => prev.map(a => a.id === id ? { ...a, ...data } : a));
                toast.success("Account updated");
            } else {
                throw new Error("Update failed");
            }

        } catch (error: any) {
            console.error('Error updating account:', error);
            setAccounts((prev: any[]) => prev.map(a => a.id === id ? { ...a, ...data } : a));
            toast.warning("Updated locally");
        }
    }, [userId, setAccounts]);

    const deleteAccount = useCallback(async (id: string) => {
        try {
            if (!userId) {
                toast.error("Please login to delete account");
                return;
            }

            const response = await api.deleteAccount(userId, id);

            if (response.success) {
                setAccounts((prev: any[]) => prev.filter(a => a.id !== id));
                toast.success("Account deleted");
            } else {
                throw new Error("Deletion failed");
            }

        } catch (error: any) {
            console.error('Error deleting account:', error);
            setAccounts((prev: any[]) => prev.filter(a => a.id !== id));
            toast.warning("Deleted locally");
        }
    }, [userId, setAccounts]);

    return useMemo(() => ({ createAccount, updateAccount, deleteAccount }), [createAccount, updateAccount, deleteAccount]);
};
