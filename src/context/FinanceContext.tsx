import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
    Expense,
    Income,
    Debt,
    Goal,
    UserSettings,
    Account,
    Notification,
    Investment,
    RecurringTransaction,
    CURRENCY_SYMBOLS,
    Achievement
} from '../types';
import { checkAchievements, getAchievement } from '../utils/achievements';

// Constants for LocalStorage keys
const STORAGE_KEYS = {
    SETTINGS: 'finbase_settings',
    EXPENSES: 'finbase_expenses',
    INCOMES: 'finbase_incomes',
    DEBTS: 'finbase_debts',
    GOALS: 'finbase_goals',
    ACCOUNTS: 'finbase_accounts',
    INVESTMENTS: 'finbase_investments',
    LIABILITIES: 'finbase_liabilities', // Added based on App.tsx usage
    NOTIFICATIONS: 'finbase_notifications',
    EMERGENCY_FUND: 'finbase_emergency_fund'
};

interface FinanceContextType {
    // State
    userId: string;
    settings: UserSettings;
    expenses: Expense[];
    incomes: Income[];
    debts: Debt[];
    goals: Goal[];
    accounts: Account[];
    investments: Investment[];
    liabilities: any[]; // Using any as defined in App.tsx originally, but should type this properly later
    notifications: Notification[];
    emergencyFundAmount: number;
    isLoading: boolean;
    isRefreshing: boolean;

    // Actions
    refreshData: () => Promise<void>;
    updateSettings: (updates: Partial<UserSettings>) => Promise<void>;

    // CRUD Actions
    createExpense: (data: any) => Promise<void>;
    updateExpense: (id: string, data: any) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;

    createIncome: (data: any) => Promise<void>;
    updateIncome: (id: string, data: any) => Promise<void>;
    deleteIncome: (id: string) => Promise<void>;

    createDebt: (data: any) => Promise<void>;
    updateDebt: (id: string, data: any) => Promise<void>;
    deleteDebt: (id: string) => Promise<void>;
    settleDebt: (id: string) => Promise<void>;

    createGoal: (data: any) => Promise<void>;
    updateGoal: (id: string, data: any) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;

    createAccount: (data: any) => Promise<void>;
    updateAccount: (id: string, data: any) => Promise<void>;
    deleteAccount: (id: string) => Promise<void>;

    setEmergencyFundAmount: (amount: number | ((prev: number) => number)) => void; // Allow direct setting for now to match App.tsx usage
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>; // Expose setter for now

    // Helpers
    applyTheme: (theme: "light" | "dark" | "system") => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userId] = useState("demo-user-001");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Data State
    const [settings, setSettings] = useState<UserSettings>({
        theme: "system",
        currency: "INR",
        unlockedAchievements: [],
        name: "",
        photoURL: "",
        notificationsEnabled: false,
    });
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [liabilities, setLiabilities] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [emergencyFundAmount, setEmergencyFundAmount] = useState(0);

    // Check for new achievements
    useEffect(() => {
        const checkForAchievements = () => {
            const totalTransactions = expenses.length + incomes.length + debts.length;
            const settledDebts = debts.filter((d: Debt) => d.status === "settled").length;
            const completedGoals = goals.filter((g: Goal) => g.currentAmount >= g.targetAmount).length;
            const totalIncome = incomes.reduce((sum: number, i: Income) => sum + i.amount, 0);
            const totalExpenses = expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
            const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
            const monthlySpendingRatio = totalIncome > 0 ? totalExpenses / totalIncome : 0;

            const achievementData = {
                totalTransactions,
                totalGoals: goals.length,
                completedGoals,
                totalDebts: debts.length,
                settledDebts,
                savingsRate,
                monthlySpendingRatio,
                notificationsEnabled: settings.notificationsEnabled,
                themeChanged: settings.theme !== "system",
                aiInteractions: 0,
                currentStreak: totalTransactions > 0 ? Math.min(totalTransactions, 3) : 0,
                dailyLogin: true,
                profileComplete: settings.name !== '' && settings.photoURL !== '',
                totalAccounts: accounts.length,
            };

            const newAchievements = checkAchievements(achievementData, settings.unlockedAchievements);

            if (newAchievements.length > 0) {
                newAchievements.forEach((achievementId) => {
                    const achievement = getAchievement(achievementId);
                    if (achievement) {
                        // Create notification
                        const notification: Notification = {
                            id: `notif_${Date.now()}_${achievementId}`,
                            type: 'achievement',
                            title: 'Achievement Unlocked!',
                            message: `${achievement.icon} ${achievement.name}`,
                            timestamp: new Date(),
                            read: false,
                            achievementId: achievementId
                        };
                        setNotifications((prev: Notification[]) => [notification, ...prev]);

                        toast.success(
                            `Achievement Unlocked: ${achievement.icon} ${achievement.name}!`,
                            { duration: 5000 }
                        );
                    }
                });

                // Update settings without triggering a full re-render loop - handled by separate updateSettings call
                // We use a specific simpler update here to avoid circular dependency in API calling if possible, 
                // but updateSettings is safe enough.
                updateSettings({
                    unlockedAchievements: [...settings.unlockedAchievements, ...newAchievements],
                });
            }
        };

        checkForAchievements();
    }, [
        expenses.length,
        incomes.length,
        debts.length,
        goals.length,
        settings.notificationsEnabled,
        settings.theme,
        // Add other dependencies as needed
    ]);

    // Load from multiple sources on mount
    useEffect(() => {
        loadInitialData();
    }, []);

    // Sync state changes to localStorage
    useEffect(() => localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)), [settings]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses)), [expenses]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes)), [incomes]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts)), [debts]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)), [goals]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts)), [accounts]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments)), [investments]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.LIABILITIES, JSON.stringify(liabilities)), [liabilities]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)), [notifications]);
    useEffect(() => localStorage.setItem(STORAGE_KEYS.EMERGENCY_FUND, JSON.stringify(emergencyFundAmount)), [emergencyFundAmount]);


    const loadInitialData = async () => {
        setIsLoading(true);

        // 1. Try to load from LocalStorage first (Fast load)
        try {
            const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                setSettings(parsed);
                applyTheme(parsed.theme);
            }

            const storedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
            if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

            const storedIncomes = localStorage.getItem(STORAGE_KEYS.INCOMES);
            if (storedIncomes) setIncomes(JSON.parse(storedIncomes));

            const storedDebts = localStorage.getItem(STORAGE_KEYS.DEBTS);
            if (storedDebts) setDebts(JSON.parse(storedDebts));

            const storedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
            if (storedGoals) setGoals(JSON.parse(storedGoals));

            const storedAccounts = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
            if (storedAccounts) setAccounts(JSON.parse(storedAccounts));

            const storedInvestments = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
            if (storedInvestments) setInvestments(JSON.parse(storedInvestments));

            const storedLiabilities = localStorage.getItem(STORAGE_KEYS.LIABILITIES);
            if (storedLiabilities) setLiabilities(JSON.parse(storedLiabilities));

            const storedNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
            if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

            const storedEmergencyFund = localStorage.getItem(STORAGE_KEYS.EMERGENCY_FUND);
            if (storedEmergencyFund) setEmergencyFundAmount(JSON.parse(storedEmergencyFund));

        } catch (e) {
            console.error("Error loading specific local data:", e);
        }

        // 2. Fetch from API (Sync)
        await fetchFromApi();

        setIsLoading(false);
    };

    const fetchFromApi = async () => {
        try {
            // Auto-process recurring
            try {
                await api.processRecurring(userId);
            } catch (e) { console.error("Skip recurring process", e) }

            // Fetch all concurrently
            const [
                settingsRes,
                accountsRes,
                expensesRes,
                incomesRes,
                debtsRes,
                goalsRes,
                liabilitiesRes,
                investmentsRes
            ] = await Promise.all([
                api.getSettings(userId).catch(e => ({ success: false })),
                api.getAccounts(userId).catch(e => ({ success: false })),
                api.getExpenses(userId).catch(e => ({ success: false })),
                api.getIncomes(userId).catch(e => ({ success: false })),
                api.getDebts(userId).catch(e => ({ success: false })),
                api.getGoals(userId).catch(e => ({ success: false })),
                api.getLiabilities(userId).catch(e => ({ success: false })),
                api.getInvestments(userId).catch(e => ({ success: false })),
            ]);

            if (settingsRes.success) {
                setSettings(settingsRes.settings);
                applyTheme(settingsRes.settings.theme);
            }
            if (accountsRes.success) setAccounts(accountsRes.accounts || []);
            if (expensesRes.success) setExpenses(expensesRes.expenses || []);
            if (incomesRes.success) setIncomes(incomesRes.incomes || []);
            if (debtsRes.success) setDebts(debtsRes.debts || []);
            if (goalsRes.success) setGoals(goalsRes.goals || []);
            if (liabilitiesRes.success) setLiabilities(liabilitiesRes.liabilities || []);
            if (investmentsRes.success && investmentsRes.investments) setInvestments(investmentsRes.investments);

            toast.success("Sync complete");

        } catch (error) {
            console.error("API Sync failed, using local data", error);
            // We already loaded local data, so just notify user
            // toast.error("Sync failed - using offline mode"); // Optional: don't annoy user
        }
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        await fetchFromApi();
        setIsRefreshing(false);
    };

    const applyTheme = (theme: "light" | "dark" | "system") => {
        if (theme === "system") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            document.documentElement.classList.toggle("dark", prefersDark);
        } else {
            document.documentElement.classList.toggle("dark", theme === "dark");
        }
    };

    // ------------------------------------------------------------------
    // Actions
    // ------------------------------------------------------------------

    const updateSettings = async (updates: Partial<UserSettings>) => {
        // Optimistic update
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        if (updates.theme) applyTheme(updates.theme);

        try {
            const response = await api.updateSettings(userId, updates);
            if (response.success) {
                setSettings(response.settings); // Confirm with server state
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error("Failed to sync settings", error);
            toast.error("Settings saved locally only");
        }
    };

    // --- Expenses ---
    const createExpense = async (data: any) => {
        try {
            const response = await api.createExpense(userId, data);
            if (response.success) {
                setExpenses(prev => [...prev, response.expense]);

                if (data.isRecurring) {
                    const recurringData = {
                        type: 'expense',
                        description: data.description,
                        amount: data.amount,
                        category: data.category,
                        accountId: data.accountId,
                        frequency: data.frequency || 'monthly',
                        startDate: data.startDate || data.date,
                        endDate: data.endDate,
                        tags: data.tags
                    };
                    await api.createRecurring(userId, recurringData);
                    toast.success("Recurring expense created!");
                } else {
                    toast.success("Expense added!");
                }
            }
        } catch (error) {
            console.error("Create expense failed", error);
            // Offline fallback
            const tempExpense = {
                id: `temp_${Date.now()}`,
                ...data,
                createdAt: new Date().toISOString()
            };
            setExpenses(prev => [...prev, tempExpense]);
            toast.warning("Added in offline mode");
        }
    };

    const updateExpense = async (id: string, data: any) => {
        try {
            const response = await api.updateExpense(userId, id, data);
            if (response.success) {
                setExpenses(prev => prev.map(e => e.id === id ? response.expense : e));
                toast.success("Expense updated");
            }
        } catch (e) {
            // Offline update
            setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
            toast.warning("Updated in offline mode");
        }
    };

    const deleteExpense = async (id: string) => {
        try {
            const response = await api.deleteExpense(userId, id);
            if (response.success) {
                setExpenses(prev => prev.filter(e => e.id !== id));
                toast.success("Expense deleted");
            }
        } catch (e) {
            setExpenses(prev => prev.filter(e => e.id !== id));
            toast.warning("Deleted in offline mode");
        }
    };

    // --- Incomes ---
    const createIncome = async (data: any) => {
        try {
            const response = await api.createIncome(userId, data);
            if (response.success) {
                setIncomes(prev => [...prev, response.income]);
                if (data.isRecurring) {
                    const recurringData = {
                        type: 'income',
                        source: data.source,
                        amount: data.amount,
                        accountId: data.accountId,
                        frequency: data.frequency || 'monthly',
                        startDate: data.startDate || data.date,
                        endDate: data.endDate,
                        tags: data.tags
                    };
                    await api.createRecurring(userId, recurringData);
                    toast.success("Recurring income created!");
                } else {
                    toast.success("Income added!");
                }
            }
        } catch (error) {
            const tempIncome = {
                id: `temp_${Date.now()}`,
                ...data,
                createdAt: new Date().toISOString()
            };
            setIncomes(prev => [...prev, tempIncome]);
            toast.warning("Added in offline mode");
        }
    };

    const updateIncome = async (id: string, data: any) => {
        try {
            const response = await api.updateIncome(userId, id, data);
            if (response.success) {
                setIncomes(prev => prev.map(i => i.id === id ? response.income : i));
                toast.success("Income updated");
            }
        } catch (e) {
            setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
            toast.warning("Updated in offline mode");
        }
    };

    const deleteIncome = async (id: string) => {
        try {
            const response = await api.deleteIncome(userId, id);
            if (response.success) {
                setIncomes(prev => prev.filter(i => i.id !== id));
                toast.success("Income deleted");
            }
        } catch (e) {
            setIncomes(prev => prev.filter(i => i.id !== id));
            toast.warning("Deleted in offline mode");
        }
    };

    // --- Debts ---
    const createDebt = async (data: any) => {
        try {
            const response = await api.createDebt(userId, data);
            if (response.success) {
                setDebts(prev => [...prev, response.debt]);
                toast.success("Debt created");
            }
        } catch (e) {
            const tempDebt = {
                id: `temp_${Date.now()}`,
                ...data,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            setDebts(prev => [...prev, tempDebt]);
            toast.warning("Added in offline mode");
        }
    };

    const updateDebt = async (id: string, data: any) => {
        try {
            const response = await api.updateDebt(userId, id, data);
            if (response.success) {
                setDebts(prev => prev.map(d => d.id === id ? response.debt : d));
                toast.success("Debt updated");
            }
        } catch (e) {
            setDebts(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
            toast.warning("Updated in offline mode");
        }
    };

    const deleteDebt = async (id: string) => {
        try {
            const response = await api.deleteDebt(userId, id);
            if (response.success) {
                setDebts(prev => prev.filter(d => d.id !== id));
                toast.success("Debt deleted");
            }
        } catch (e) {
            setDebts(prev => prev.filter(d => d.id !== id));
            toast.warning("Deleted in offline mode");
        }
    };

    const settleDebt = async (id: string) => {
        try {
            const response = await api.updateDebt(userId, id, { status: "settled" });
            if (response.success) {
                setDebts(prev => prev.map(d => d.id === id ? response.debt : d));
                toast.success("🎉 Debt settled! Great job!");
                confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
            }
        } catch (e) {
            setDebts(prev => prev.map(d => d.id === id ? { ...d, status: "settled" as const } : d));
            toast.warning("Marked as settled locally");
        }
    };

    // --- Goals ---
    const createGoal = async (data: any) => {
        try {
            const response = await api.createGoal(userId, data);
            if (response.success) {
                setGoals(prev => [...prev, response.goal]);
                toast.success("Goal created");
            }
        } catch (e) {
            const temp = { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
            setGoals(prev => [...prev, temp]);
            toast.warning("Created in offline mode");
        }
    };

    const updateGoal = async (id: string, data: any) => {
        try {
            const response = await api.updateGoal(userId, id, data);
            if (response.success) {
                setGoals(prev => prev.map(g => g.id === id ? response.goal : g));
                if (response.goal.currentAmount >= response.goal.targetAmount) {
                    toast.success(`🎉 Goal "${response.goal.name}" completed!`);
                    confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
                } else {
                    toast.success("Goal updated");
                }
            }
        } catch (e) {
            setGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
            toast.warning("Updated locally");
        }
    };

    const deleteGoal = async (id: string) => {
        try {
            const response = await api.deleteGoal(userId, id);
            if (response.success) {
                setGoals(prev => prev.filter(g => g.id !== id));
                toast.success("Goal deleted");
            }
        } catch (e) {
            setGoals(prev => prev.filter(g => g.id !== id));
            toast.warning("Deleted locally");
        }
    };

    // --- Accounts ---
    const createAccount = async (data: any) => {
        try {
            const response = await api.createAccount(userId, data);
            if (response.success) {
                setAccounts(prev => [...prev, response.account]);
                toast.success("Account created");
            }
        } catch (e) {
            const temp = { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
            setAccounts(prev => [...prev, temp]);
            toast.warning("Created locally");
        }
    };

    const updateAccount = async (id: string, data: any) => {
        try {
            const response = await api.updateAccount(userId, id, data);
            if (response.success) {
                setAccounts(prev => prev.map(a => a.id === id ? response.account : a));
                toast.success("Account updated");
            }
        } catch (e) {
            setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
            toast.warning("Updated locally");
        }
    };

    const deleteAccount = async (id: string) => {
        try {
            const response = await api.deleteAccount(userId, id);
            if (response.success) {
                setAccounts(prev => prev.filter(a => a.id !== id));
                toast.success("Account deleted");
            }
        } catch (e) {
            setAccounts(prev => prev.filter(a => a.id !== id));
            toast.warning("Deleted locally");
        }
    };


    return (
        <FinanceContext.Provider
            value={{
                userId,
                // State
                settings,
                expenses,
                incomes,
                debts,
                goals,
                accounts,
                investments,
                liabilities,
                notifications,
                emergencyFundAmount,
                isLoading,
                isRefreshing,

                // Actions
                refreshData,
                updateSettings,
                createExpense,
                updateExpense,
                deleteExpense,
                createIncome,
                updateIncome,
                deleteIncome,
                createDebt,
                updateDebt,
                deleteDebt,
                settleDebt,
                createGoal,
                updateGoal,
                deleteGoal,
                createAccount,
                updateAccount,
                deleteAccount,
                setEmergencyFundAmount,
                setNotifications,
                applyTheme
            }}
        >
            {children}
        </FinanceContext.Provider>
    );
};
