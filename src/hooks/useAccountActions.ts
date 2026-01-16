import { useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { catalogService } from '../features/catalog/service';

export const useAccountActions = (state: any) => {
    const { userId, setAccounts, currentUser } = state;

    const createAccount = useCallback(async (data: any) => {
        try {
            // Validate authentication
            if (!currentUser || !currentUser.id) {
                toast.error("Please login to add an account");
                return;
            }

            // Prepare account data with canonical columns
            const accountData = {
                user_id: currentUser.id,
                name: data.name,
                type: data.type,
                currency: 'INR', // Default currency
                current_balance: Number(data.balance) || 0,
                min_buffer: 500, // Default min buffer
                is_active: true,
                // Legacy columns (sync trigger will handle these)
                currency_code: 'INR',
                opening_balance: Number(data.balance) || 0
            };

            // Insert into Supabase
            const { data: newAccount, error } = await supabase
                .from('accounts')
                .insert([accountData])
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                toast.error(`Failed to create account: ${error.message}`);

                // Fallback to local creation
                const temp = {
                    id: `temp_${Date.now()}`,
                    ...data,
                    createdAt: new Date().toISOString()
                };
                setAccounts((prev: any[]) => [...prev, temp]);
                toast.warning("Created locally (offline mode)");
                return;
            }

            // Success - update state
            setAccounts((prev: any[]) => [...prev, {
                id: newAccount.id,
                name: newAccount.name,
                type: newAccount.type,
                balance: newAccount.current_balance,
                color: data.color,
                icon: data.icon,
                createdAt: newAccount.created_at,
                creditLimit: data.creditLimit,
                safeLimitPercentage: data.safeLimitPercentage,
                serviceChargePercentage: data.serviceChargePercentage,
                statementDate: data.statementDate
            }]);

            toast.success("Account created successfully");

            // Auto-link to catalog (bank kind)
            catalogService.ensureCatalogAndLink(
                currentUser.id,
                'account',
                newAccount.id,
                'bank',
                data.name
            ).catch(e => console.error("Catalog link failed", e));

        } catch (error: any) {
            console.error('Error creating account:', error);
            toast.error(`Failed to create account: ${error.message || 'Unknown error'}`);

            // Fallback to local creation
            const temp = {
                id: `temp_${Date.now()}`,
                ...data,
                createdAt: new Date().toISOString()
            };
            setAccounts((prev: any[]) => [...prev, temp]);
            toast.warning("Created locally (offline mode)");
        }
    }, [userId, currentUser, setAccounts]);

    const updateAccount = useCallback(async (id: string, data: any) => {
        try {
            if (!currentUser || !currentUser.id) {
                toast.error("Please login to update account");
                return;
            }

            const updateData: any = {};
            if (data.name) updateData.name = data.name;
            if (data.type) updateData.type = data.type;
            if (data.balance !== undefined) {
                updateData.current_balance = Number(data.balance);
                updateData.opening_balance = Number(data.balance); // Sync legacy
            }

            const { error } = await supabase
                .from('accounts')
                .update(updateData)
                .eq('id', id)
                .eq('user_id', currentUser.id);

            if (error) {
                console.error('Supabase error:', error);
                toast.error(`Failed to update: ${error.message}`);

                // Fallback to local update
                setAccounts((prev: any[]) => prev.map(a => a.id === id ? { ...a, ...data } : a));
                toast.warning("Updated locally");
                return;
            }

            // Success
            setAccounts((prev: any[]) => prev.map(a => a.id === id ? { ...a, ...data } : a));
            toast.success("Account updated");

        } catch (error: any) {
            console.error('Error updating account:', error);
            setAccounts((prev: any[]) => prev.map(a => a.id === id ? { ...a, ...data } : a));
            toast.warning("Updated locally");
        }
    }, [userId, currentUser, setAccounts]);

    const deleteAccount = useCallback(async (id: string) => {
        try {
            if (!currentUser || !currentUser.id) {
                toast.error("Please login to delete account");
                return;
            }

            const { error } = await supabase
                .from('accounts')
                .delete()
                .eq('id', id)
                .eq('user_id', currentUser.id);

            if (error) {
                console.error('Supabase error:', error);
                toast.error(`Failed to delete: ${error.message}`);

                // Fallback to local delete
                setAccounts((prev: any[]) => prev.filter(a => a.id !== id));
                toast.warning("Deleted locally");
                return;
            }

            // Success
            setAccounts((prev: any[]) => prev.filter(a => a.id !== id));
            toast.success("Account deleted");

        } catch (error: any) {
            console.error('Error deleting account:', error);
            setAccounts((prev: any[]) => prev.filter(a => a.id !== id));
            toast.warning("Deleted locally");
        }
    }, [userId, currentUser, setAccounts]);

    return useMemo(() => ({ createAccount, updateAccount, deleteAccount }), [createAccount, updateAccount, deleteAccount]);
};
