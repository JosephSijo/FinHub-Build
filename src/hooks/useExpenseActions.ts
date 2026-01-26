import { useCallback, useMemo, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { autoCategorize, isKnownSubscription } from '../utils/autoCategorize';
import { Notification } from '../types';
import { catalogService } from '../features/catalog/service';

export const useExpenseActions = (state: any, actions: any) => {
    const {
        userId, expenses, setExpenses, accounts, goals,
        emergencyFundAmount, setEmergencyFundAmount, liabilities,
        setNotifications
    } = state;

    const dataRef = useRef({
        expenses, accounts, goals, emergencyFundAmount, liabilities
    });

    useEffect(() => {
        dataRef.current = {
            expenses, accounts, goals, emergencyFundAmount, liabilities
        };
    }, [expenses, accounts, goals, emergencyFundAmount, liabilities]);



    const addNotifications = useCallback((newNotifs: Notification | Notification[]) => {
        setNotifications((prev: Notification[]) => {
            const incoming = Array.isArray(newNotifs) ? newNotifs : [newNotifs];
            const next = [...prev];
            incoming.forEach(n => {
                if (!next.some(existing => existing.id === n.id)) {
                    next.unshift(n);
                }
            });
            return next.slice(0, 100);
        });
    }, [setNotifications]);

    const actionsRef = useRef(actions);
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    const createExpense = useCallback(async (data: any) => {
        const { accounts: currentAccounts, goals: currentGoals, emergencyFundAmount: currentEF, liabilities: currentL } = dataRef.current;
        const { updateGoal, updateLiability, createRecurringTransaction } = actionsRef.current;

        try {
            // 1. Calculate Available to Spend (Global Check)
            const totalBankBalance = currentAccounts.reduce((sum: number, acc: any) => sum + (acc.type !== 'credit_card' ? acc.balance : 0), 0);
            const reservedFundsTotal = currentGoals.reduce((sum: number, g: any) => sum + g.currentAmount, 0) + currentEF;
            const totalCommitments = currentL.reduce((sum: number, l: any) => sum + l.emiAmount, 0);
            const availableToSpend = Math.max(0, totalBankBalance - reservedFundsTotal - totalCommitments);

            const expenseAmount = data.amount;

            // LEAKAGE PROTOCOL
            if (expenseAmount > availableToSpend) {
                const deficit = expenseAmount - availableToSpend;
                let remainingDeficit = deficit;
                const assetsToDrain: any[] = [];

                currentGoals.forEach((g: any) => {
                    const type = g.type || 'growth';
                    let priority = 1;
                    if (type === 'stability') priority = 2;
                    if (type === 'protection') priority = 3;
                    if (g.currentAmount > 0) assetsToDrain.push({ id: g.id, type: 'goal', currentAmount: g.currentAmount, priority, name: g.name });
                });

                if (currentEF > 0) assetsToDrain.push({ id: 'emergency-fund', type: 'emergency', currentAmount: currentEF, priority: 3, name: 'Emergency Fund' });
                assetsToDrain.sort((a, b) => a.priority - b.priority);

                const updatesToPerform: Promise<any>[] = [];
                const notificationsToSend: Notification[] = [];

                for (const asset of assetsToDrain) {
                    if (remainingDeficit <= 0) break;
                    const amountToTake = Math.min(asset.currentAmount, remainingDeficit);
                    remainingDeficit -= amountToTake;

                    if (asset.type === 'goal') {
                        updatesToPerform.push(updateGoal(asset.id, { currentAmount: asset.currentAmount - amountToTake, status: 'leaking' }));
                        notificationsToSend.push({
                            id: `leak_${asset.id}_${new Date().toISOString().split('T')[0]}`,
                            type: 'alert', priority: 'medium', category: 'transactions',
                            title: 'Assistant Reservation Leak', message: `₹${amountToTake} spent reduced your '${asset.name}' reserve.`,
                            timestamp: new Date(), read: false
                        });
                    } else if (asset.type === 'emergency') {
                        setEmergencyFundAmount((prev: number) => prev - amountToTake);
                        notificationsToSend.push({
                            id: `leak_emergency_${new Date().toISOString().split('T')[0]}`,
                            type: 'alert', priority: 'medium', category: 'transactions',
                            title: 'Emergency Fund Alert', message: `Warning: ₹${amountToTake} withdrawn from Emergency Fund to cover spending.`,
                            timestamp: new Date(), read: false
                        });
                    }
                }
                await Promise.all(updatesToPerform);
                if (notificationsToSend.length > 0) {
                    addNotifications(notificationsToSend);
                    notificationsToSend.forEach(n => toast.error(n.title, { description: n.message }));
                }
            }

            // 4. Credit Card Interaction Logic
            const targetAccount = currentAccounts.find((a: any) => a.id === data.accountId);
            const processedData = { ...data };

            if (targetAccount?.type === 'credit_card') {
                const serviceChargeRate = targetAccount.serviceChargePercentage || 0;
                if (serviceChargeRate > 0) processedData.serviceChargeAmount = (data.amount * serviceChargeRate) / 100;

                const creditLimit = targetAccount.creditLimit || 0;
                const safePercentage = targetAccount.safeLimitPercentage || 30;
                const safeLimit = (creditLimit * safePercentage) / 100;
                const currentUsage = Math.abs(targetAccount.balance);
                const projectedUsage = currentUsage + data.amount;

                if (projectedUsage > safeLimit && creditLimit > 0) {
                    if (!data.isIncomeGenerating) {
                        toast.warning("High Interest Risk Detected", {
                            description: `This transaction puts your CC usage at ${((projectedUsage / creditLimit) * 100).toFixed(1)}%, exceeding your ${safePercentage}% safe limit with no income-justification.`,
                            duration: 6000
                        });
                        addNotifications({
                            id: `cc_limit_${targetAccount.id}_${new Date().toISOString().split('T')[0]}`,
                            type: 'alert', priority: 'medium', category: 'transactions',
                            title: 'Credit Stability Breach', message: `Card '${targetAccount.name}' usage protocol exceeded ${safePercentage}% threshold. Avoid non-essential outflow.`,
                            timestamp: new Date(), read: false
                        });
                    }
                }
            }

            // 5. Subscription Auto-Detect
            if (!processedData.category || processedData.category === 'Other') {
                const suggestion = autoCategorize(processedData.description);
                if (suggestion && suggestion.category === 'Subscription') {
                    processedData.category = 'Subscription';
                    processedData.tags = Array.from(new Set([...(processedData.tags || []), 'auto-detected']));
                }
            }

            // Formal Liability Registration
            if (data.registerAsLiability) {
                try {
                    const tenureMonths = data.tenureUnit === 'years' ? (data.tenure * 12) : data.tenure;
                    const libRes = await api.createLiability(userId, {
                        name: data.description, type: data.liabilityType || 'other',
                        principal: data.principal || data.amount, outstanding: data.principal || data.amount,
                        interestRate: data.interestRate || 0, emiAmount: data.amount,
                        startDate: data.date, tenure: tenureMonths, accountId: data.accountId
                    });
                    if (libRes.success) {
                        processedData.liabilityId = libRes.liability.id;
                        data.isRecurring = false;
                    }
                } catch (libErr) { console.error("Failed to auto-register liability:", libErr); }
            }

            // 6. Proceed with Expense Creation
            const response = await api.createExpense(userId, processedData);
            if (response.success) {
                setExpenses((prev: any[]) => [...prev, response.expense]);

                // Auto-link to catalog (merchant kind)
                catalogService.ensureCatalogAndLink(
                    userId,
                    'transaction',
                    response.expense.id,
                    'merchant',
                    processedData.description,
                    { amount: processedData.amount, category: processedData.category }
                ).catch(e => console.error("Catalog link failed", e));

                if (targetAccount) {
                    // Balance update is now handled by DB trigger on ledger_entries
                    // await updateAccount(targetAccount.id, { balance: newBalance });
                }
                if (processedData.liabilityId) {
                    const targetLiability = currentL.find((l: any) => l.id === processedData.liabilityId);
                    if (targetLiability) {
                        const newOutstanding = Math.max(0, targetLiability.outstanding - data.amount);
                        await updateLiability(targetLiability.id, { outstanding: newOutstanding });
                        toast.info(`Updated '${targetLiability.name}' balance`, { description: `New outstanding: ₹${newOutstanding.toLocaleString()}` });
                    }
                }

                if (data.isRecurring) {
                    await createRecurringTransaction({
                        type: 'expense', description: data.description, amount: data.amount, category: data.category,
                        accountId: data.accountId, frequency: data.frequency || 'monthly', customIntervalDays: data.customIntervalDays,
                        startDate: data.date, endDate: data.endDate, tags: data.tags
                    });
                } else {
                    toast.success("Expense added!");
                    if (isKnownSubscription(data.description) && !data.isRecurring) {
                        addNotifications({
                            id: `verify_sub_${response.expense.id}`, type: 'insight', priority: 'medium', category: 'transactions',
                            title: 'Automate Payment?', message: `Detected '${data.description}' as a subscription. Add to cyclical routine?`,
                            timestamp: new Date(), read: false,
                            action: {
                                type: 'verify_subscription', label: 'Automate', status: 'pending',
                                payload: { id: response.expense.id, description: data.description, amount: data.amount, category: data.category, accountId: data.accountId, date: data.date }
                            }
                        } as any);
                    }
                }
            } else {
                throw response.error || new Error("API failed");
            }
        } catch (error) {
            setExpenses((prev: any[]) => [...prev, { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() }]);
            toast.warning(`Added in offline mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [userId, addNotifications, setEmergencyFundAmount, setExpenses]);

    const updateExpense = useCallback(async (id: string, data: any) => {
        const { expenses: currentExpenses, accounts: currentAccounts } = dataRef.current;
        try {
            const response = await api.updateExpense(userId, id, data);
            if (response.success) {
                const oldExpense = currentExpenses.find((e: any) => e.id === id);
                if (oldExpense) {
                    const oldAccount = currentAccounts.find((a: any) => a.id === oldExpense.accountId);
                    if (oldAccount) {
                        // DB trigger handles balance reversal
                    }
                    const newExpense = response.expense;
                    const newAccount = currentAccounts.find((a: any) => a.id === newExpense.accountId);
                    if (newAccount) {
                        // DB trigger handles balance update
                    }
                }
                setExpenses((prev: any[]) => prev.map(e => e.id === id ? response.expense : e));
                toast.success("Expense updated");
            } else {
                throw response.error || new Error("API failed");
            }
        } catch (error) {
            setExpenses((prev: any[]) => prev.map(e => e.id === id ? { ...e, ...data } : e));
            toast.warning(`Updated in offline mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [userId, setExpenses]);

    const deleteExpense = useCallback(async (id: string) => {
        const { expenses: currentExpenses, accounts: currentAccounts } = dataRef.current;
        try {
            const response = await api.deleteExpense(userId, id);
            if (response.success) {
                const expense = currentExpenses.find((e: any) => e.id === id);
                if (expense) {
                    const targetAccount = currentAccounts.find((a: any) => a.id === expense.accountId);
                    if (targetAccount) {
                        // DB trigger handles balance reversal on delete
                    }
                }
                // logic above
                setExpenses((prev: any[]) => prev.filter(e => e.id !== id));
                toast.success("Expense deleted");
            } else {
                throw response.error || new Error("API failed");
            }
        } catch (error) {
            setExpenses((prev: any[]) => prev.filter(e => e.id !== id));
            toast.warning(`Deleted in offline mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [userId, setExpenses]);

    const runCategorizationMigration = useCallback(async () => {
        const { expenses: currentExpenses } = dataRef.current;
        if (!currentExpenses?.length) return;

        let migratedCount = 0;
        const updates: Promise<any>[] = [];

        for (const expense of currentExpenses) {
            // Only migrate Uncategorized or Other expenses
            if (expense.category === 'Uncategorized' || expense.category === 'Other' || !expense.category) {
                const suggestion = autoCategorize(expense.description);
                if (suggestion && suggestion.category === 'Subscription') {
                    // Perform the update
                    updates.push(
                        api.updateExpense(userId, expense.id, { category: 'Subscription' })
                            .then(res => {
                                if (res.success) {
                                    migratedCount++;
                                }
                            })
                    );
                }
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
            if (migratedCount > 0) {
                // Refresh data to reflect changes
                const response = await api.getExpenses(userId);
                if (response.success) {
                    setExpenses(response.expenses);
                    toast.success(`Subscription Migration complete: ${migratedCount} expenses updated.`);
                }
            }
        }
    }, [userId, setExpenses]);

    return useMemo(() => ({ createExpense, updateExpense, deleteExpense, addNotifications, runCategorizationMigration }), [createExpense, updateExpense, deleteExpense, addNotifications, runCategorizationMigration]);
};
