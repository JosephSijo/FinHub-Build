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
    CURRENCY_SYMBOLS,
    Liability,
    RecurringTransaction,
    AuthUser
} from '../types';
import { checkAchievements, getAchievement } from '../utils/achievements';
import { generateGurujiInsights, createInsightNotification } from '../utils/insights';
import { autoCategorize, isKnownSubscription } from '../utils/autoCategorize';

// Constants for LocalStorage keys
const STORAGE_KEYS = {
    SETTINGS: 'finhub_settings',
    EXPENSES: 'finhub_expenses',
    INCOMES: 'finhub_incomes',
    DEBTS: 'finhub_debts',
    GOALS: 'finhub_goals',
    ACCOUNTS: 'finhub_accounts',
    INVESTMENTS: 'finhub_investments',
    LIABILITIES: 'finhub_liabilities',
    NOTIFICATIONS: 'finhub_notifications',
    EMERGENCY_FUND: 'finhub_emergency_fund',
    RECURRING: 'finhub_recurring',
    AUTH: 'finhub_auth',
    REMEMBERED_MOBILE: 'finhub_remembered_mobile',
    DELETION_SCHEDULE: 'finhub_deletion_schedule'
};

interface FinanceContextType {
    // State
    userId: string;
    settings: UserSettings;
    currency: string; // Add currency directly for easier access
    expenses: Expense[];
    incomes: Income[];
    debts: Debt[];
    goals: Goal[];
    accounts: Account[];
    investments: Investment[];
    liabilities: Liability[];
    recurringTransactions: RecurringTransaction[];
    notifications: Notification[];
    emergencyFundAmount: number;
    isLoading: boolean;
    isRefreshing: boolean;
    isOffline: boolean;
    apiStatus: 'online' | 'offline' | 'error';
    pendingMobile: string;
    authMessage?: { message: string, subMessage?: string };

    // Auth State
    authStatus: 'guest' | 'authenticating' | 'authenticated';
    currentUser: AuthUser | null;
    isAwaitingPin: boolean;
    isRememberedUser: boolean;
    rememberedMobile: string;

    // Actions
    refreshData: () => Promise<void>;
    updateSettings: (updates: Partial<UserSettings>) => Promise<void>;

    // Auth Actions
    checkIdentity: (mobile: string) => Promise<boolean>;
    login: (pin: string, rememberMe?: boolean) => Promise<boolean>;
    signup: (mobile: string, pin: string, name: string, rememberMe?: boolean) => Promise<boolean>;
    sendOtp: (mobile: string) => Promise<boolean>;
    verifyOtp: (mobile: string, otp: string) => Promise<boolean>;
    resetPin: (mobile: string, newPin: string) => Promise<boolean>;
    logout: () => void;
    clearPendingSession: () => void;
    scheduleAccountDeletion: () => Promise<void>;
    cancelAccountDeletion: () => Promise<void>;
    deletionDate: string | null;

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

    // Liabilities
    createLiability: (data: Omit<Liability, 'id'>) => Promise<void>;
    updateLiability: (id: string, data: Partial<Liability>) => Promise<void>;
    deleteLiability: (id: string) => Promise<void>;

    // Migration
    migrateSubscriptions: () => Promise<{ count: number }>;
    cleanupDuplicates: () => Promise<{ count: number }>;

    // Investments
    createInvestment: (data: any, sourceAccountId?: string) => Promise<void>;
    updateInvestment: (id: string, data: any) => Promise<void>;
    deleteInvestment: (id: string) => Promise<void>;

    // Recurring
    createRecurringTransaction: (data: any) => Promise<void>;
    createRecurring: (data: any) => Promise<void>;
    deleteRecurringTransaction: (id: string) => Promise<void>;
    processRecurringTransactions: () => Promise<void>;

    setEmergencyFundAmount: (amount: number | ((prev: number) => number)) => void; // Allow direct setting for now to match App.tsx usage
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>; // Expose setter for now

    // Helpers
    applyTheme: (theme: "light" | "dark" | "system") => void;

    // Fund Allocation
    isFundAllocationOpen: boolean;
    fundAllocationType: 'goal' | 'emergency';
    openFundAllocation: (type: 'goal' | 'emergency') => void;
    closeFundAllocation: () => void;
    performFundAllocation: (data: {
        accountId: string;
        destinationId: string;
        amount: number;
        destinationType: 'goal' | 'emergency';
    }) => Promise<void>;
    deductFromAccount: (accountId: string, amount: number) => Promise<void>;
    transferFunds: (sourceId: string, destinationId: string, amount: number) => Promise<void>;
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
        roundUpEnabled: true,
        aiProvider: "openai",
        onboardingPhase: 0,
        passiveIncomeTarget: 0,
        isSampleMode: false,
    });
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [liabilities, setLiabilities] = useState<Liability[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [emergencyFundAmount, setEmergencyFundAmount] = useState(0);
    const [isOffline, setIsOffline] = useState(false);
    const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'error'>('online');

    // Auth State
    const [authStatus, setAuthStatus] = useState<'guest' | 'authenticating' | 'authenticated'>('guest');
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [isAwaitingPin, setIsAwaitingPin] = useState(false);
    const [pendingMobile, setPendingMobile] = useState('');
    const [isRememberedUser, setIsRememberedUser] = useState(false);
    const [rememberedMobile, setRememberedMobile] = useState('');
    const [deletionDate, setDeletionDate] = useState<string | null>(null);
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [authMessage, setAuthMessage] = useState<{ message: string, subMessage?: string } | undefined>();

    // Pre-defined users for Beta/Demo
    const DEMO_USERS = [
        {
            mobile: '9447147230',
            pin: '2255',
            name: 'tin2mon FinHub Node // 0x50.3',
            userId: 'tin2mon-prod-001'
        }
    ];

    // Notification Helper with Deduplication and Pruning
    const addNotifications = (newNotifs: Notification | Notification[]) => {
        const toAdd = Array.isArray(newNotifs) ? newNotifs : [newNotifs];

        setNotifications(prev => {
            const filtered = toAdd.filter(notif => {
                // Deduplicate by ID
                const idExists = prev.some(p => p.id === notif.id);
                if (idExists) return false;

                // Deduplicate by Content (avoid spamming similar insights/alerts in a short window)
                const similarExists = prev.some(p =>
                    p.type === notif.type &&
                    p.message === notif.message &&
                    !p.read &&
                    (new Date().getTime() - new Date(p.timestamp).getTime() < 1000 * 60 * 60 * 24) // 24h window
                );
                return !similarExists;
            });

            if (filtered.length === 0) return prev;

            // Merge, Sort by timestamp descending, and Prune to top 100
            const combined = [...filtered, ...prev].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            return combined.slice(0, 100);
        });
    };

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
                            id: `notif_${achievementId}`,
                            type: 'achievement',
                            priority: 'low',
                            category: 'achievements',
                            title: 'Achievement Unlocked!',
                            message: `${achievement.icon} ${achievement.name}`,
                            timestamp: new Date(),
                            read: false,
                            achievementId: achievementId
                        };
                        addNotifications(notification);

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

            // Check for Guruji Insights (Spike detection)
            // Limit to once per session or just check on significant changes
            // For now, we'll check on expense changes and deduplicate by content roughly (or just rely on the user clearing them)
            // A simple refinement: check if we already have a recent unread insight about the same thing? 
            // For MVP, just generating them is fine, but let's avoid duplicates in the same batch.

            const insightMessages = generateGurujiInsights({ expenses, goals, userName: settings.name || 'Friend' });

            if (insightMessages.length > 0) {
                const newInsightNotifs: Notification[] = [];

                insightMessages.forEach(msg => {
                    const notif = createInsightNotification(msg);
                    notif.priority = 'low';
                    notif.category = 'insights';
                    newInsightNotifs.push(notif);
                    toast(notif.title, { description: notif.message, icon: '🧘' });
                });

                if (newInsightNotifs.length > 0) {
                    addNotifications(newInsightNotifs);
                }
            }

            checkSmartDues();
        };

        const checkSmartDues = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Calculate Liquid Balance (Bank/Cash - Goal/Emergency Reservations)
            const totalLiquidBank = accounts.reduce((sum, acc) => sum + (acc.type === 'bank' || acc.type === 'cash' ? acc.balance : 0), 0);
            const totalReserved = goals.reduce((sum, g) => sum + g.currentAmount, 0) + emergencyFundAmount;
            const availableLiquidity = Math.max(0, totalLiquidBank - totalReserved);

            const upcomingDues: { name: string, amount: number, dueDate: Date, type: string }[] = [];

            // 2. Scan Liabilities (Loans)
            liabilities.forEach(l => {
                const start = new Date(l.startDate);
                // Simple assumption: due on the same day as startDate every month
                const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), start.getDate());

                // If it's already passed this month, look at next month
                if (dueThisMonth < today) {
                    dueThisMonth.setMonth(dueThisMonth.getMonth() + 1);
                }

                const diffDays = Math.ceil((dueThisMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays <= 7) {
                    upcomingDues.push({ name: l.name, amount: l.emiAmount, dueDate: dueThisMonth, type: 'EMI' });
                }
            });

            // 3. Scan Recurring Transactions (Subscriptions/Bills)
            recurringTransactions.forEach(r => {
                if (r.type === 'expense') {
                    const start = new Date(r.startDate);
                    let nextDue: Date;

                    if (r.frequency === 'monthly') {
                        nextDue = new Date(today.getFullYear(), today.getMonth(), start.getDate());
                        if (nextDue < today) nextDue.setMonth(nextDue.getMonth() + 1);
                    } else if (r.frequency === 'weekly') {
                        const daysUntilDue = (start.getDay() - today.getDay() + 7) % 7;
                        nextDue = new Date(today.getTime() + daysUntilDue * 24 * 60 * 60 * 1000);
                        if (nextDue < today) nextDue.setDate(nextDue.getDate() + 7);
                    } else if (r.frequency === 'custom') {
                        // Custom Cycle Logic (e.g. 28 days)
                        const interval = r.customIntervalDays || 28; // Default to 28 if not set
                        const timeDiff = today.getTime() - start.getTime();
                        const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

                        // Calculate how many cycles have passed
                        // const cyclesPassed = Math.floor(daysSinceStart / interval);
                        const daysIntoCurrentCycle = daysSinceStart % interval;

                        // Next due is end of current cycle
                        const daysRemaining = interval - daysIntoCurrentCycle;
                        nextDue = new Date(today.getTime() + (daysRemaining * 24 * 60 * 60 * 1000));

                        // Special case: If due today or passed but assumed future for strict calculation
                        if (daysRemaining <= 0) {
                            nextDue = new Date(today.getTime() + (interval * 24 * 60 * 60 * 1000));
                        }
                    } else {
                        // Simplification for daily/yearly
                        return;
                    }

                    const diffDays = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    // Logic: Show regular bills 7 days prior, but Custom/Recharges specifically 2 days prior as requested
                    const alertWindow = r.frequency === 'custom' ? 2 : 7;

                    if (diffDays <= alertWindow && diffDays >= 0) {
                        upcomingDues.push({ name: r.description || 'Subscription', amount: r.amount, dueDate: nextDue, type: r.frequency === 'custom' ? 'Recharge' : 'Bill' });
                    }
                }
            });

            // 4. Generate Smart Alerts
            upcomingDues.forEach(due => {
                const isLiquidityBreach = availableLiquidity < due.amount;
                const daysLeft = Math.ceil((due.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (isLiquidityBreach && daysLeft <= 3) {
                    // CRITICAL SMART ALERT
                    const alert: Notification = {
                        id: `smart_breach_${due.name}_${due.dueDate.toISOString().split('T')[0]}`,
                        type: 'alert',
                        priority: 'high',
                        category: 'reminders',
                        title: 'Liquid Stability Warning',
                        message: `Critical: Your '${due.name}' due on ${due.dueDate.toLocaleDateString()} (₹${due.amount}) exceeds current liquid cash (₹${availableLiquidity}). Clear assets or increase bank balance immediately.`,
                        timestamp: new Date(),
                        read: false
                    };
                    addNotifications(alert);
                    toast.error(alert.title, { description: alert.message, duration: 10000 });
                } else if (daysLeft <= 1) {
                    // Standard Reminder
                    const reminder: Notification = {
                        id: `reminder_${due.name}_${due.dueDate.toISOString().split('T')[0]}`,
                        type: 'reminder',
                        priority: 'medium',
                        category: 'reminders',
                        title: `${due.type} Due Soon`,
                        message: `Reminder: '${due.name}' payment of ₹${due.amount} is due tomorrow (${due.dueDate.toLocaleDateString()}).`,
                        timestamp: new Date(),
                        read: false
                    };
                    addNotifications(reminder);
                    toast.info(reminder.title, { description: reminder.message });
                }
            });
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
    useEffect(() => localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurringTransactions)), [recurringTransactions]);
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
            if (storedNotifications) {
                const parsed: Notification[] = JSON.parse(storedNotifications);
                // Deduplicate and Prune on load
                const unique = parsed.filter((v, i, a) => a.findIndex(t => t.id === v.id || (t.message === v.message && t.type === v.type)) === i);
                setNotifications(unique.slice(0, 100));
            }

            const storedEmergencyFund = localStorage.getItem(STORAGE_KEYS.EMERGENCY_FUND);
            if (storedEmergencyFund) setEmergencyFundAmount(JSON.parse(storedEmergencyFund));

            const storedRecurring = localStorage.getItem(STORAGE_KEYS.RECURRING);
            if (storedRecurring) setRecurringTransactions(JSON.parse(storedRecurring));

            const storedRememberedMobile = localStorage.getItem(STORAGE_KEYS.REMEMBERED_MOBILE);
            if (storedRememberedMobile) {
                setRememberedMobile(storedRememberedMobile);
                setPendingMobile(storedRememberedMobile);
                setIsRememberedUser(true);
            }

            const storedDeletion = localStorage.getItem(STORAGE_KEYS.DELETION_SCHEDULE);
            if (storedDeletion) {
                const deletionTime = new Date(storedDeletion).getTime();
                const now = new Date().getTime();

                if (now >= deletionTime) {
                    // 30 days have passed. Execute total purge.
                    purgeAllData();
                    console.warn("Account purge executed based on schedule.");
                } else {
                    setDeletionDate(storedDeletion);
                }
            }

        } catch (e) {
            console.error("Error loading specific local data:", e);
        }

        // 2. Fetch from API (Sync)
        await fetchFromApi();

        // 3. Subscription Migration (One-time or periodic scan)
        const hasMigrationRun = localStorage.getItem('finhub_subscription_migration_v3');
        if (!hasMigrationRun && userId) {
            runCategorizationMigration();
            localStorage.setItem('finhub_subscription_migration_v3', 'true');
        }

        setIsLoading(false);
    };

    const runCategorizationMigration = () => {
        setExpenses(prevExpenses => {
            let updatedCount = 0;
            const nextExpenses = prevExpenses.map(e => {
                const genericCategories = ['other', 'bills & utilities', 'entertainment', 'shopping', '', undefined];
                const suggestion = autoCategorize(e.description);

                if (suggestion && suggestion.category === 'Subscription') {
                    const shouldUpdateCategory = genericCategories.includes(e.category?.toLowerCase()) || !e.category;
                    const shouldUpdateRecurring = !e.isRecurring;

                    if (shouldUpdateCategory || shouldUpdateRecurring) {
                        updatedCount++;
                        return {
                            ...e,
                            category: 'Subscription',
                            isRecurring: true
                        };
                    }
                }
                return e;
            });

            if (updatedCount > 0) {
                toast.info(`Intelligence protocol: Identified and moved ${updatedCount} transactions to Subscriptions.`);

                // One-time auto-creation of RecurringTransaction templates for found subscriptions
                // We do this by finding the most recent expense for each unique subscription description
                const subExpenses = nextExpenses.filter(e => e.category === 'Subscription');
                const uniqueSubs = new Map<string, Expense>();

                subExpenses.forEach(e => {
                    const name = e.description.toLowerCase().trim();
                    if (!uniqueSubs.has(name) || new Date(e.date) > new Date(uniqueSubs.get(name)!.date)) {
                        uniqueSubs.set(name, e);
                    }
                });

                // Create recurring entries for those that don't exist yet
                uniqueSubs.forEach((exp, name) => {
                    const alreadyTracked = recurringTransactions.some(rt =>
                        rt.description?.toLowerCase().includes(name) ||
                        name.includes(rt.description?.toLowerCase() || '')
                    );

                    if (!alreadyTracked) {
                        // Create it (using a timeout to avoid triggering multiple state updates synchronously)
                        setTimeout(() => {
                            createRecurringTransaction({
                                type: 'expense',
                                description: exp.description,
                                amount: exp.amount,
                                category: 'Subscription',
                                accountId: exp.accountId,
                                frequency: 'monthly',
                                startDate: exp.date,
                                tags: ['auto-migrated']
                            });
                        }, 100);
                    }
                });
            }
            return nextExpenses;
        });
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
                investmentsRes,
                recurringRes
            ] = await Promise.all([
                api.getSettings(userId).catch(() => ({ success: false, settings: undefined })),
                api.getAccounts(userId).catch(() => ({ success: false, accounts: [] })),
                api.getExpenses(userId).catch(() => ({ success: false, expenses: [] })),
                api.getIncomes(userId).catch(() => ({ success: false, incomes: [] })),
                api.getDebts(userId).catch(() => ({ success: false, debts: [] })),
                api.getGoals(userId).catch(() => ({ success: false, goals: [] })),
                api.getLiabilities(userId).catch(() => ({ success: false, liabilities: [] })),
                api.getInvestments(userId).catch(() => ({ success: false, investments: [] })),
                api.getRecurring(userId).catch(() => ({ success: false, recurring: [] })),
            ]);

            setIsOffline(false);
            setApiStatus('online');

            if (settingsRes.success && settingsRes.settings) {
                // Merge server settings with local settings to preserve local-only fields like aiProvider and apiKeys
                setSettings(prev => ({
                    ...prev,
                    ...settingsRes.settings,
                    // Specifically preserve these if missing from server response
                    aiProvider: settingsRes.settings.aiProvider || prev.aiProvider,
                    apiKeys: { ...prev.apiKeys, ...settingsRes.settings.apiKeys }
                }));
                applyTheme(settingsRes.settings.theme);
            }
            if (accountsRes.success) setAccounts(accountsRes.accounts || []);
            if (expensesRes.success) setExpenses(expensesRes.expenses || []);
            if (incomesRes.success) setIncomes(incomesRes.incomes || []);
            if (debtsRes.success) setDebts(debtsRes.debts || []);
            if (goalsRes.success) setGoals(goalsRes.goals || []);
            if (liabilitiesRes.success) setLiabilities(liabilitiesRes.liabilities || []);
            if (investmentsRes.success) setInvestments(investmentsRes.investments || []);
            if (recurringRes.success) setRecurringTransactions(recurringRes.recurring || []);

            toast.success("Sync complete");

        } catch (error) {
            console.error("API Sync failed, using local data", error);
            setIsOffline(true);
            setApiStatus('offline');
            // toast.error("Sync failed - using offline mode");
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
    // Auth Actions
    // ------------------------------------------------------------------

    const checkIdentity = async (mobile: string) => {
        setPendingMobile(mobile);
        // Simulate API check
        const isExistingUser = DEMO_USERS.some(u => u.mobile === mobile) ||
            localStorage.getItem(`finhub_user_${mobile}`) !== null;

        setIsAwaitingPin(true);
        return isExistingUser;
    };

    const login = async (pin: string, rememberMe: boolean = false) => {
        // Authenticating state triggers LoadingSprite
        setAuthMessage({ message: "Validating PIN", subMessage: "Verifying secure node access..." });
        setAuthStatus('authenticating');

        // Artificial delay for Loading Sprite showcase
        await new Promise(resolve => setTimeout(resolve, 2000));

        const demoUser = DEMO_USERS.find(u => u.mobile === pendingMobile && u.pin === pin);

        let authenticatedUser: AuthUser | null = null;

        if (demoUser) {
            authenticatedUser = {
                id: demoUser.userId,
                mobile: demoUser.mobile,
                name: demoUser.name
            };
        } else {
            const storedUser = localStorage.getItem(`finhub_user_${pendingMobile}`);
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed.pin === pin) {
                    authenticatedUser = {
                        id: parsed.userId,
                        mobile: parsed.mobile,
                        name: parsed.name
                    };
                }
            }
        }

        if (authenticatedUser) {
            setCurrentUser(authenticatedUser);
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authenticatedUser));
            setAuthMessage({ message: "Handshake Success", subMessage: "Synchronizing decrypted ledger..." });
            setAuthStatus('authenticated');
            setIsAwaitingPin(false);

            // Handle deletion cancellation on login
            if (deletionDate) {
                await cancelAccountDeletion();
                toast.success('Your account deletion request has been canceled. Welcome back!');
            }

            if (rememberMe) {
                localStorage.setItem(STORAGE_KEYS.REMEMBERED_MOBILE, pendingMobile);
                setRememberedMobile(pendingMobile);
                setIsRememberedUser(true);
            } else {
                // If they explicitly log in without remember me, we might want to clear it 
                // but the requirement says "Smart Prompt" if they didn't check it.
                // So we leave existing remembered mobile but don't update it to THIS session if different.
            }

            return true;
        } else {
            setAuthMessage(undefined);
            setAuthStatus('guest'); // Reset to guest on failure
            return false;
        }
    };

    const sendOtp = async (mobile: string) => {
        setPendingMobile(mobile);
        // Simulate OTP generation
        const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(mockOtp);
        console.log(`[AUTH-DEBUG] Mock OTP for ${mobile}: ${mockOtp}`);

        // Show simulated toast
        toast.info("Verification code sent", {
            description: `Dev Mode: Use ${mockOtp} (Simulated SMS)`
        });

        return true;
    };

    const verifyOtp = async (_mobile: string, otp: string) => {
        // Skip check in testing phase as requested, but we'll show logic
        if (otp === "0000" || otp === generatedOtp) {
            return true;
        }
        return false;
    };

    const resetPin = async (mobile: string, newPin: string) => {
        const storedUser = localStorage.getItem(`finhub_user_${mobile}`);
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            parsed.pin = newPin;
            localStorage.setItem(`finhub_user_${mobile}`, JSON.stringify(parsed));
            toast.success("PIN reset successfully");
            return true;
        }
        // Also check demo users (can't really reset them permanently in localStorage easily without shadowing)
        const demoUserIndex = DEMO_USERS.findIndex(u => u.mobile === mobile);
        if (demoUserIndex !== -1) {
            // Shadow demo user in localStorage
            const shadowedUser = {
                ...DEMO_USERS[demoUserIndex],
                pin: newPin
            };
            localStorage.setItem(`finhub_user_${mobile}`, JSON.stringify(shadowedUser));
            toast.success("Demo user PIN updated locally");
            return true;
        }
        return false;
    };

    const signup = async (mobile: string, pin: string, name: string, rememberMe: boolean = false) => {
        setAuthMessage({ message: "Creating Node", subMessage: "Initializing secure identity protocols..." });
        setAuthStatus('authenticating');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const newUser: AuthUser & { pin: string } = {
            id: `user_${Date.now()}`,
            mobile,
            name,
            pin
        };

        localStorage.setItem(`finhub_user_${mobile}`, JSON.stringify(newUser));
        const authUser: AuthUser = { id: newUser.id, mobile: newUser.mobile, name: newUser.name };
        setCurrentUser(authUser);
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authUser));
        setAuthMessage({ message: "Handshake Success", subMessage: "Synchronizing decrypted ledger..." });
        setAuthStatus('authenticated');
        setIsAwaitingPin(false);

        if (rememberMe) {
            localStorage.setItem(STORAGE_KEYS.REMEMBERED_MOBILE, mobile);
            setRememberedMobile(mobile);
            setIsRememberedUser(true);
        }

        return true;
    };

    const logout = () => {
        setAuthStatus('guest');
        setCurrentUser(null);
        setGeneratedOtp(null);
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        // If not remembered, clear the pending mobile so it asks for username next time
        if (!isRememberedUser) {
            setPendingMobile('');
        }
    };

    const clearPendingSession = () => {
        setAuthStatus('guest');
        setCurrentUser(null);
        setPendingMobile('');
        setGeneratedOtp(null);
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        localStorage.removeItem(STORAGE_KEYS.REMEMBERED_MOBILE);
        setRememberedMobile('');
        setIsRememberedUser(false);
    };

    const scheduleAccountDeletion = async () => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        const dateString = date.toISOString();

        setDeletionDate(dateString);
        localStorage.setItem(STORAGE_KEYS.DELETION_SCHEDULE, dateString);

        toast.warning('Account scheduled for deletion in 30 days.');
        logout();
    };

    const cancelAccountDeletion = async () => {
        setDeletionDate(null);
        localStorage.removeItem(STORAGE_KEYS.DELETION_SCHEDULE);
    };

    const purgeAllData = () => {
        // Clear all known storage keys
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        // Reset state
        setExpenses([]);
        setIncomes([]);
        setDebts([]);
        setGoals([]);
        setAccounts([]);
        setInvestments([]);
        setLiabilities([]);
        setRecurringTransactions([]);
        setNotifications([]);
        setEmergencyFundAmount(0);
        setDeletionDate(null);
        setAuthStatus('guest');
        setCurrentUser(null);

        toast.info('Session purged successfully.');
    };

    // Auto-login from storage - Restore session context but require PIN
    useEffect(() => {
        const storedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
        if (storedAuth) {
            try {
                const user = JSON.parse(storedAuth);
                if (user && user.mobile) {
                    setPendingMobile(user.mobile);
                    // We stay as 'guest' so App.tsx shows LoginScreen
                    // LoginScreen will detect pendingMobile and show PIN verify phase
                    setAuthStatus('guest');
                }
            } catch (e) {
                console.error("Failed to parse stored auth", e);
                localStorage.removeItem(STORAGE_KEYS.AUTH);
            }
        }
    }, []);

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
                // Merge response with existing state to avoid losing local-only fields
                setSettings(prev => ({
                    ...prev,
                    ...response.settings,
                    aiProvider: response.settings.aiProvider || prev.aiProvider,
                    apiKeys: { ...prev.apiKeys, ...response.settings.apiKeys }
                }));
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
            // 1. Calculate Available to Spend (Global Check)
            // Re-calculate strictly to ensure latest state
            const totalBankBalance = accounts.reduce((sum, acc) => sum + (acc.type !== 'credit_card' ? acc.balance : 0), 0);
            const shadowWalletTotal = goals.reduce((sum, g) => sum + g.currentAmount, 0) + emergencyFundAmount;

            // Calculate recurring commitments (simplified for now: sum of EMI + assuming some recurring ops)
            //Ideally this comes from a hook, but calculating inline for atomicity
            const totalCommitments = liabilities.reduce((sum, l) => sum + l.emiAmount, 0);

            const availableToSpend = Math.max(0, totalBankBalance - shadowWalletTotal - totalCommitments);

            let expenseAmount = data.amount;

            // LEAKAGE PROTOCOL
            if (expenseAmount > availableToSpend) {
                const deficit = expenseAmount - availableToSpend;
                console.warn(`⚠️ Leakage Detected! Deficit: ${deficit}. Initiating Shadow Wallet Protocol.`);

                let remainingDeficit = deficit;
                const assetsToDrain: { id: string, type: 'goal' | 'emergency', currentAmount: number, priority: number, name: string }[] = [];

                // 2. Identify and Sort Liquid Assets
                // Priority: 1. Growth (Drain First), 2. Stability, 3. Protection (Drain Last)
                goals.forEach(g => {
                    const type = g.type || 'growth';
                    let priority = 1; // Default/Growth
                    if (type === 'stability') priority = 2;
                    if (type === 'protection') priority = 3;

                    if (g.currentAmount > 0) {
                        assetsToDrain.push({
                            id: g.id,
                            type: 'goal',
                            currentAmount: g.currentAmount,
                            priority,
                            name: g.name
                        });
                    }
                });

                if (emergencyFundAmount > 0) {
                    assetsToDrain.push({
                        id: 'emergency-fund',
                        type: 'emergency',
                        currentAmount: emergencyFundAmount,
                        priority: 3, // Protection/Highest Importance -> Drain Last
                        name: 'Emergency Fund'
                    });
                }

                // Sort: Drain lower priority (Start of array) first. 
                // Wait... Requirement: "Subtract from Growth... then Stability... then Protection"
                // So Growth is "First to be sacrificed".
                // Priority 1 (Growth) < Priority 3 (Protection).
                assetsToDrain.sort((a, b) => a.priority - b.priority);

                // 3. Drain Logic
                const updatesToPerform: Promise<any>[] = [];
                const notificationsToSend: Notification[] = [];

                for (const asset of assetsToDrain) {
                    if (remainingDeficit <= 0) break;

                    const amountToTake = Math.min(asset.currentAmount, remainingDeficit);
                    remainingDeficit -= amountToTake;

                    if (asset.type === 'goal') {
                        const newAmount = asset.currentAmount - amountToTake;
                        // Determine new status: if taking anything, it's leaking.
                        updatesToPerform.push(updateGoal(asset.id, {
                            currentAmount: newAmount,
                            status: 'leaking'
                        }));

                        // Check if we already notified about this wallet today? 
                        // Simplified: Just add notification now, debounce locally if needed.
                        notificationsToSend.push({
                            id: `leak_${asset.id}_${new Date().toISOString().split('T')[0]}`, // ID based on day
                            type: 'alert',
                            priority: 'medium',
                            category: 'transactions',
                            title: 'Shadow Wallet Leakage',
                            message: `₹${amountToTake} spent reduced your '${asset.name}' reserve.`,
                            timestamp: new Date(),
                            read: false
                        });

                    } else if (asset.type === 'emergency') {
                        updatesToPerform.push(Promise.resolve(setEmergencyFundAmount(prev => prev - amountToTake))); // Local update wrapper
                        // Also persist to storage? updateGoal handles it, but emergency fund is raw state.
                        // We manually trigger the storage effect by setting state.

                        notificationsToSend.push({
                            id: `leak_emergency_${new Date().toISOString().split('T')[0]}`, // ID based on day
                            type: 'alert',
                            priority: 'medium',
                            category: 'transactions',
                            title: 'Emergency Fund Alert',
                            message: `Warning: ₹${amountToTake} withdrawn from Emergency Fund to cover spending.`,
                            timestamp: new Date(),
                            read: false
                        });
                    }
                }

                // Execute Drains
                await Promise.all(updatesToPerform);

                // Send Notifications (Unique only)
                if (notificationsToSend.length > 0) {
                    addNotifications(notificationsToSend);
                    notificationsToSend.forEach(n => toast.error(n.title, { description: n.message }));
                }
            }

            // 4. Credit Card Interaction Logic
            const targetAccount = accounts.find(a => a.id === data.accountId);
            let processedData = { ...data };

            if (targetAccount?.type === 'credit_card') {
                // Calculate Service Charges
                const serviceChargeRate = targetAccount.serviceChargePercentage || 0;
                if (serviceChargeRate > 0) {
                    const charge = (data.amount * serviceChargeRate) / 100;
                    processedData.serviceChargeAmount = charge;
                    // Note: We don't automatically add charge to amount here, 
                    // we just track it. The user might want it separate.
                    console.log(`Credit Service Charge: ${charge}`);
                }

                // Safe Limit Monitoring
                const creditLimit = targetAccount.creditLimit || 0;
                const safePercentage = targetAccount.safeLimitPercentage || 30; // Default to 30% if not set
                const safeLimit = (creditLimit * safePercentage) / 100;

                // Assuming account.balance for CC represents current usage (spent amount)
                const currentUsage = Math.abs(targetAccount.balance);
                const projectedUsage = currentUsage + data.amount;

                if (projectedUsage > safeLimit && creditLimit > 0) {
                    if (!data.isIncomeGenerating) {
                        toast.warning("High Interest Risk Detected", {
                            description: `This transaction puts your CC usage at ${((projectedUsage / creditLimit) * 100).toFixed(1)}%, exceeding your ${safePercentage}% safe limit with no income-justification.`,
                            duration: 6000
                        });

                        // Create a system notification for the breach
                        const breachNotif: Notification = {
                            id: `cc_limit_${targetAccount.id}_${new Date().toISOString().split('T')[0]}`, // Daily breach limit
                            type: 'alert',
                            priority: 'medium',
                            category: 'transactions',
                            title: 'Credit Stability Breach',
                            message: `Card '${targetAccount.name}' usage protocol exceeded ${safePercentage}% threshold. Avoid non-essential outflow.`,
                            timestamp: new Date(),
                            read: false
                        };
                        addNotifications(breachNotif);
                    } else {
                        toast.info("Strategic Credit Utilization", {
                            description: "Limit exceeded, but marked as income-generating. Proceed with caution."
                        });
                    }
                }
            }

            // 5. Subscription Auto-Detect (Future Entries Protection)
            if (!processedData.category || processedData.category === 'Other') {
                const suggestion = autoCategorize(processedData.description);
                if (suggestion && suggestion.category === 'Subscription') {
                    processedData.category = 'Subscription';
                    processedData.tags = Array.from(new Set([...(processedData.tags || []), 'auto-detected']));
                }
            }

            // 6. Proceed with Expense Creation (Normal Flow)
            const response = await api.createExpense(userId, processedData);
            if (response.success) {
                setExpenses(prev => [...prev, response.expense]);

                // Update account balance
                if (targetAccount) {
                    const balanceChange = data.amount + (processedData.serviceChargeAmount || 0);
                    // For Credit Cards: balance represents usage (debt), so we add the expense amount.
                    // For Bank/Cash: balance represents current funds, so we subtract the expense amount.
                    const newBalance = targetAccount.type === 'credit_card'
                        ? targetAccount.balance + balanceChange
                        : targetAccount.balance - balanceChange;

                    await updateAccount(targetAccount.id, {
                        balance: newBalance
                    });
                }

                if (data.isRecurring) {
                    // Start Date Logic:
                    // If creating a manual entry NOW, we want the *automation* to pick up from the NEXT cycle.
                    // Otherwise, we get a duplicate (Manual Entry + Automated Entry on same day).
                    const entryDate = new Date(data.date);
                    let nextStartDate = new Date(entryDate);

                    if (data.frequency === 'daily') nextStartDate.setDate(entryDate.getDate() + 1);
                    else if (data.frequency === 'weekly') nextStartDate.setDate(entryDate.getDate() + 7);
                    else if (data.frequency === 'monthly') nextStartDate.setMonth(entryDate.getMonth() + 1);
                    else if (data.frequency === 'yearly') nextStartDate.setFullYear(entryDate.getFullYear() + 1);
                    else if (data.frequency === 'custom') nextStartDate.setDate(entryDate.getDate() + (data.customIntervalDays || 28));

                    const recurringData = {
                        type: 'expense',
                        description: data.description,
                        amount: data.amount,
                        category: data.category,
                        accountId: data.accountId,
                        frequency: data.frequency || 'monthly',
                        customIntervalDays: data.customIntervalDays,
                        startDate: nextStartDate.toISOString(), // Start from NEXT cycle
                        endDate: data.endDate,
                        tags: data.tags
                    };
                    await api.createRecurring(userId, recurringData);
                    toast.success("Recurring expense created!");
                } else {
                    toast.success("Expense added!");

                    // Verify to Automate Logic: If it's a known subscription but NOT marked recurring, ask user.
                    if (isKnownSubscription(data.description) && !data.isRecurring) {
                        const verifyNotif: Notification = {
                            id: `verify_sub_${response.expense.id}`,
                            type: 'insight',
                            priority: 'medium',
                            category: 'insights',
                            title: 'Subscription Detected?',
                            message: `Is '${data.description}' a monthly subscription? Verify to automate tracking.`,
                            timestamp: new Date(),
                            read: false,
                            action: {
                                type: 'verify_subscription',
                                payload: {
                                    description: data.description,
                                    amount: data.amount,
                                    category: 'Subscription', // Force category correction
                                    accountId: data.accountId
                                },
                                status: 'pending'
                            }
                        };
                        addNotifications(verifyNotif);
                    }
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
                const oldExpense = expenses.find(e => e.id === id);
                if (oldExpense) {
                    // 1. Reverse old expense effect
                    const oldAccount = accounts.find(a => a.id === oldExpense.accountId);
                    if (oldAccount) {
                        const amount = oldExpense.amount + (oldExpense.serviceChargeAmount || 0);
                        const oldBalance = oldAccount.type === 'credit_card'
                            ? oldAccount.balance - amount
                            : oldAccount.balance + amount;
                        await updateAccount(oldAccount.id, { balance: oldBalance });
                    }

                    // 2. Apply new expense effect (using latest state of accounts after reversal)
                    // Note: We need to find the account again or use the updated response accountId
                    const newExpense = response.expense;
                    const newAccount = accounts.find(a => a.id === newExpense.accountId);
                    if (newAccount) {
                        const amount = newExpense.amount + (newExpense.serviceChargeAmount || 0);
                        const newBalance = newAccount.type === 'credit_card'
                            ? newAccount.balance + amount
                            : newAccount.balance - amount;
                        await updateAccount(newAccount.id, { balance: newBalance });
                    }
                }
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
                const expense = expenses.find(e => e.id === id);
                if (expense) {
                    const targetAccount = accounts.find(a => a.id === expense.accountId);
                    if (targetAccount) {
                        const amount = expense.amount + (expense.serviceChargeAmount || 0);
                        const newBalance = targetAccount.type === 'credit_card'
                            ? targetAccount.balance - amount // Restore credit card limit (reduce usage)
                            : targetAccount.balance + amount; // Restore bank balance

                        await updateAccount(targetAccount.id, { balance: newBalance });
                    }
                }
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

                // Update account balance
                const targetAccount = accounts.find(a => a.id === data.accountId);
                if (targetAccount) {
                    // For Credit Cards: Income reduces usage (debt).
                    // For Bank/Cash: Income increases funds.
                    const newBalance = targetAccount.type === 'credit_card'
                        ? targetAccount.balance - data.amount
                        : targetAccount.balance + data.amount;

                    await updateAccount(targetAccount.id, {
                        balance: newBalance
                    });
                }

                if (data.isRecurring) {
                    // Start Date Logic: Defer to next cycle to avoid duplicates (Manual + Auto)
                    const entryDate = new Date(data.date);
                    let nextStartDate = new Date(entryDate);

                    if (data.frequency === 'daily') nextStartDate.setDate(entryDate.getDate() + 1);
                    else if (data.frequency === 'weekly') nextStartDate.setDate(entryDate.getDate() + 7);
                    else if (data.frequency === 'monthly') nextStartDate.setMonth(entryDate.getMonth() + 1);
                    else if (data.frequency === 'yearly') nextStartDate.setFullYear(entryDate.getFullYear() + 1);
                    else if (data.frequency === 'custom') nextStartDate.setDate(entryDate.getDate() + (data.customIntervalDays || 28));

                    const recurringData = {
                        type: 'income',
                        source: data.source,
                        amount: data.amount,
                        accountId: data.accountId,
                        frequency: data.frequency || 'monthly',
                        customIntervalDays: data.customIntervalDays,
                        startDate: nextStartDate.toISOString(),
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
                const oldIncome = incomes.find(i => i.id === id);
                if (oldIncome) {
                    // 1. Reverse old income effect
                    const oldAccount = accounts.find(a => a.id === oldIncome.accountId);
                    if (oldAccount) {
                        const oldBalance = oldAccount.type === 'credit_card'
                            ? oldAccount.balance + oldIncome.amount
                            : oldAccount.balance - oldIncome.amount;
                        await updateAccount(oldAccount.id, { balance: oldBalance });
                    }

                    // 2. Apply new income effect
                    const newIncome = response.income;
                    const newAccount = accounts.find(a => a.id === newIncome.accountId);
                    if (newAccount) {
                        const newBalance = newAccount.type === 'credit_card'
                            ? newAccount.balance - newIncome.amount
                            : newAccount.balance + newIncome.amount;
                        await updateAccount(newAccount.id, { balance: newBalance });
                    }
                }
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
                const income = incomes.find(i => i.id === id);
                if (income) {
                    const targetAccount = accounts.find(a => a.id === income.accountId);
                    if (targetAccount) {
                        const newBalance = targetAccount.type === 'credit_card'
                            ? targetAccount.balance + income.amount // Reverse income effect on CC (increase usage)
                            : targetAccount.balance - income.amount; // Reverse income effect on bank

                        await updateAccount(targetAccount.id, { balance: newBalance });
                    }
                }
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

                // Update account balance
                const targetAccount = accounts.find(a => a.id === data.accountId);
                if (targetAccount) {
                    // Type: 'borrowed' -> Cash increases, 'lent' -> Cash decreases
                    const balanceChange = data.type === 'borrowed' ? data.amount : -data.amount;

                    // CC Consideration: Borrowing to CC is weird but theoretically possible (cash advance).
                    // Lending from CC is also possible.
                    const newBalance = targetAccount.type === 'credit_card'
                        ? targetAccount.balance - balanceChange // Usage decreases if borrowed (added to card), usage increases if lent
                        : targetAccount.balance + balanceChange;

                    await updateAccount(targetAccount.id, {
                        balance: newBalance
                    });
                }

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
                const oldDebt = debts.find(d => d.id === id);
                if (oldDebt) {
                    // 1. Reverse old debt effect
                    const oldAccount = accounts.find(a => a.id === oldDebt.accountId);
                    if (oldAccount) {
                        const balanceChange = oldDebt.type === 'borrowed' ? -oldDebt.amount : oldDebt.amount;
                        const oldBalance = oldAccount.type === 'credit_card'
                            ? oldAccount.balance - balanceChange
                            : oldAccount.balance + balanceChange;
                        await updateAccount(oldAccount.id, { balance: oldBalance });
                    }

                    // 2. Apply new debt effect
                    const newDebt = response.debt;
                    const newAccount = accounts.find(a => a.id === newDebt.accountId);
                    if (newAccount) {
                        const balanceChange = newDebt.type === 'borrowed' ? newDebt.amount : -newDebt.amount;
                        const newBalance = newAccount.type === 'credit_card'
                            ? newAccount.balance - balanceChange
                            : newAccount.balance + balanceChange;
                        await updateAccount(newAccount.id, { balance: newBalance });
                    }
                }
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
                const debt = debts.find(d => d.id === id);
                if (debt) {
                    const targetAccount = accounts.find(a => a.id === debt.accountId);
                    if (targetAccount) {
                        // Reverse the initial balance change
                        const balanceChange = debt.type === 'borrowed' ? -debt.amount : debt.amount;
                        const newBalance = targetAccount.type === 'credit_card'
                            ? targetAccount.balance - balanceChange
                            : targetAccount.balance + balanceChange;

                        await updateAccount(targetAccount.id, { balance: newBalance });
                    }
                }
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
                const debt = debts.find(d => d.id === id);
                if (debt && debt.status !== 'settled') {
                    const targetAccount = accounts.find(a => a.id === debt.accountId);
                    if (targetAccount) {
                        // Settlement reverses the initial debt flow
                        // borrowed -> payback (outflow), lent -> received back (inflow)
                        const settlementAmount = debt.type === 'borrowed' ? -debt.amount : debt.amount;

                        const newBalance = targetAccount.type === 'credit_card'
                            ? targetAccount.balance - settlementAmount
                            : targetAccount.balance + settlementAmount;

                        await updateAccount(targetAccount.id, { balance: newBalance });

                        // Record the settlement as a Transfer to avoid double-counting as spending/income
                        const settlementTransaction = {
                            description: `Debt Settlement: ${debt.personName}`,
                            amount: debt.amount,
                            category: 'Transfer',
                            date: new Date().toISOString().split('T')[0],
                            tags: ['debt-settlement'],
                            accountId: debt.accountId
                        };

                        if (debt.type === 'borrowed') {
                            const res = await api.createExpense(userId, settlementTransaction);
                            if (res.success) setExpenses(prev => [...prev, res.expense]);
                        } else {
                            const res = await api.createIncome(userId, settlementTransaction);
                            if (res.success) setIncomes(prev => [...prev, res.income]);
                        }
                    }
                }
                setDebts(prev => prev.map(d => d.id === id ? response.debt : d));
                toast.success("🎉 Debt settled! Great job!");
                confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
            }
        } catch (e) {
            setDebts(prev => prev.map(d => d.id === id ? { ...d, status: "settled" as const } : d));
            toast.warning("Marked as settled locally");
        }
    };

    // --- Migration ---
    const migrateSubscriptions = async (): Promise<{ count: number }> => {
        let updateCount = 0;
        const updates: Promise<any>[] = [];

        // 1. Scan Expenses
        for (const expense of expenses) {
            // Only update if not already a Subscription and matches DB
            if (expense.category !== 'Subscription' && isKnownSubscription(expense.description)) {

                // Get precise details if available
                const details = autoCategorize(expense.description);

                if (details && details.category === 'Subscription') {
                    updates.push(updateExpense(expense.id, {
                        category: 'Subscription',
                        tags: [...new Set([...expense.tags, 'auto-migrated', 'subscription'])]
                    }));
                    updateCount++;
                }
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
            toast.success(`Migrated ${updateCount} transactions to Subscriptions`);
        } else {
            toast.info("No subscription transactions found to migrate");
        }

        return { count: updateCount };
    };

    const cleanupDuplicates = async (): Promise<{ count: number }> => {
        let removedCount = 0;
        const updates: Promise<any>[] = [];
        const seen = new Set<string>();

        // 1. Scan Expenses
        for (const expense of expenses) {
            const key = `${expense.date}-${expense.description?.toLowerCase().trim()}-${expense.amount}`;

            // Check for blank or duplicates
            const isBlank = !expense.description || expense.description.trim() === '' || expense.amount === 0;
            const isDuplicate = seen.has(key);

            if (isBlank || isDuplicate) {
                updates.push(deleteExpense(expense.id));
                removedCount++;
            } else {
                seen.add(key);
            }
        }

        // 2. Scan Incomes
        const seenIncomes = new Set<string>();
        for (const income of incomes) {
            const key = `${income.date}-${income.source?.toLowerCase().trim()}-${income.amount}`;
            const isBlank = !income.source || income.source.trim() === '' || income.amount === 0;
            const isDuplicate = seenIncomes.has(key);

            if (isBlank || isDuplicate) {
                updates.push(deleteIncome(income.id));
                removedCount++;
            } else {
                seenIncomes.add(key);
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
            toast.success(`Cleaned up ${removedCount} duplicate/blank entries`);
        } else {
            toast.info("No duplicates or blank entries found");
        }

        return { count: removedCount };
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

    // --- Liabilities ---
    const createLiability = async (data: Omit<Liability, 'id'>) => {
        try {
            const response = await api.createLiability(userId, data);
            if (response.success) {
                setLiabilities(prev => [...prev, response.liability]);
                toast.success("Liability created");
            }
        } catch (e) {
            const temp = {
                id: `temp_${Date.now()}`,
                ...data,
                principal: Number(data.principal),
                outstanding: Number(data.outstanding),
                interestRate: Number(data.interestRate),
                emiAmount: Number(data.emiAmount),
                tenure: Number(data.tenure),
                createdAt: new Date().toISOString()
            } as Liability;
            setLiabilities(prev => [...prev, temp]);
            toast.warning("Created locally");
        }
    };

    const updateLiability = async (id: string, data: Partial<Liability>) => {
        try {
            const response = await api.updateLiability(userId, id, data);
            if (response.success) {
                setLiabilities(prev => prev.map(l => l.id === id ? response.liability : l));
                toast.success("Liability updated");
            }
        } catch (e) {
            setLiabilities(prev => prev.map(l => l.id === id ? { ...l, ...data } as Liability : l));
            toast.warning("Updated locally");
        }
    };

    const deleteLiability = async (id: string) => {
        try {
            const response = await api.deleteLiability(userId, id);
            if (response.success) {
                setLiabilities(prev => prev.filter(l => l.id !== id));
                toast.success("Liability deleted");
            }
        } catch (e) {
            setLiabilities(prev => prev.filter(l => l.id !== id));
            toast.warning("Deleted locally");
        }
    };

    // --- Investments ---
    const createInvestment = async (data: any, sourceAccountId?: string) => {
        try {
            const response = await api.createInvestment(userId, data);
            if (response.success) {
                setInvestments(prev => [...prev, response.investment]);

                // Aggregation Rule: Cash-to-Asset Logic
                if (sourceAccountId && sourceAccountId !== 'none') {
                    const sourceAccount = accounts.find(a => a.id === sourceAccountId);
                    if (sourceAccount) {
                        const cost = data.buyPrice * data.quantity;
                        // Deduct from source
                        await updateAccount(sourceAccountId, {
                            balance: sourceAccount.balance - cost
                        });

                        // Record Transfer
                        const transferData = {
                            description: `Asset Purchase: ${data.symbol} (${data.quantity} units)`,
                            amount: cost,
                            category: 'Transfer',
                            date: data.purchaseDate || new Date().toISOString().split('T')[0],
                            tags: ['investment', 'principal', data.symbol],
                            accountId: sourceAccountId
                        };
                        const tResponse = await api.createExpense(userId, transferData);
                        if (tResponse.success) {
                            setExpenses(prev => [...prev, tResponse.expense]);
                        }
                    }
                }
                toast.success("Investment created");
            }
        } catch (e) {
            const temp = { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
            setInvestments(prev => [...prev, temp]);
            toast.warning("Created locally");
        }
    };

    const updateInvestment = async (id: string, data: any) => {
        try {
            const response = await api.updateInvestment(userId, id, data);
            if (response.success) {
                setInvestments(prev => prev.map(i => i.id === id ? response.investment : i));
                toast.success("Investment updated");
            }
        } catch (e) {
            setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
            toast.warning("Updated locally");
        }
    };

    const deleteInvestment = async (id: string) => {
        try {
            const response = await api.deleteInvestment(userId, id);
            if (response.success) {
                setInvestments(prev => prev.filter(i => i.id !== id));
                toast.success("Investment deleted");
            }
        } catch (e) {
            setInvestments(prev => prev.filter(i => i.id !== id));
            toast.warning("Deleted locally");
        }
    };


    // --- Fund Allocation & Operations ---
    const [isFundAllocationOpen, setIsFundAllocationOpen] = useState(false);
    const [fundAllocationType, setFundAllocationType] = useState<'goal' | 'emergency'>('goal');

    const openFundAllocation = (type: 'goal' | 'emergency') => {
        setFundAllocationType(type);
        setIsFundAllocationOpen(true);
    };

    const closeFundAllocation = () => {
        setIsFundAllocationOpen(false);
    };

    const performFundAllocation = async (data: {
        accountId: string;
        destinationId: string;
        amount: number;
        destinationType: 'goal' | 'emergency';
    }) => {
        const account = accounts.find(a => a.id === data.accountId);
        if (!account) {
            toast.error('Account not found');
            return;
        }

        if (account.balance < data.amount) {
            toast.error(`Insufficient funds in ${account.name}`);
            return;
        }

        // Update account balance
        await updateAccount(data.accountId, {
            balance: account.balance - data.amount
        });

        // Update goal or emergency fund
        if (data.destinationType === 'goal') {
            const goal = goals.find(g => g.id === data.destinationId);
            if (goal) {
                await updateGoal(data.destinationId, {
                    currentAmount: goal.currentAmount + data.amount
                });
            }
        } else {
            setEmergencyFundAmount(prev => prev + data.amount);
        }

        toast.success(
            `Successfully allocated ${CURRENCY_SYMBOLS[settings.currency]}${data.amount.toLocaleString()} from ${account.name}!`,
            {
                description: `${data.destinationType === 'goal' ? 'Goal' : 'Emergency Fund'} balance updated`
            }
        );
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    const deductFromAccount = async (accountId: string, amount: number) => {
        const account = accounts.find(a => a.id === accountId);
        if (account) {
            if (account.balance < amount) {
                toast.error(`Insufficient funds in ${account.name}`);
                throw new Error('Insufficient funds');
            }
            await updateAccount(accountId, {
                balance: account.balance - amount
            });
        }
    };

    const transferFunds = async (sourceId: string, destinationId: string, amount: number) => {
        const sourceAccount = accounts.find(a => a.id === sourceId);
        const destAccount = accounts.find(a => a.id === destinationId);

        if (!sourceAccount || !destAccount) {
            toast.error('Source or destination account not found');
            return;
        }

        if (sourceAccount.balance < amount) {
            toast.error(`Insufficient funds in ${sourceAccount.name}`);
            return;
        }

        try {
            // Update source: subtract
            await updateAccount(sourceId, { balance: sourceAccount.balance - amount });

            // Update destination: add (or subtract for CC to reduce debt)
            const destBalanceChange = destAccount.type === 'credit_card' ? -amount : amount;
            await updateAccount(destinationId, { balance: destAccount.balance + destBalanceChange });

            // Record this migration as a transaction for history (but analytics will ignore it as 'Transfer')
            const transferExpense = {
                description: `Migration: ${sourceAccount.name} → ${destAccount.name}`,
                amount: amount,
                category: 'Transfer',
                date: new Date().toISOString().split('T')[0],
                tags: ['internal', 'migration'],
                accountId: sourceId
            };

            // We use direct API call or internal createExpense to avoid recursive balance updates 
            // since we already updated balances above.
            const response = await api.createExpense(userId, transferExpense);
            if (response.success) {
                setExpenses(prev => [...prev, response.expense]);
            }

            toast.success(`Transferred ${CURRENCY_SYMBOLS[settings.currency]}${amount.toLocaleString()}!`, {
                description: `From ${sourceAccount.name} to ${destAccount.name}`
            });

            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch (error) {
            console.error('Transfer failed', error);
            toast.error('Capital migration protocol failed');
        }
    };


    // --- Recurring ---
    const createRecurringTransaction = async (data: any) => {
        try {
            const response = await api.createRecurring(userId, data);
            if (response.success) {
                setRecurringTransactions(prev => [...prev, response.recurring]);
                toast.success('Recurring transaction created');
            }
        } catch (error) {
            console.error('Error creating recurring transaction:', error);
            // Local fallback
            const temp = { id: `temp_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
            setRecurringTransactions(prev => [...prev, temp]);
            toast.warning('Created locally');
        }
    };

    const deleteRecurringTransaction = async (id: string) => {
        try {
            const response = await api.deleteRecurring(userId, id);
            if (response.success) {
                setRecurringTransactions(prev => prev.filter(r => r.id !== id));
                toast.success('Recurring transaction deleted');
            }
        } catch (error) {
            console.error('Error deleting recurring transaction:', error);
            setRecurringTransactions(prev => prev.filter(r => r.id !== id));
            toast.warning('Deleted locally');
        }
    };

    const processRecurringTransactions = async () => {
        try {
            const response = await api.processRecurring(userId);
            if (response.success) {
                toast.success(`Processed ${response.count} transactions`);
                // Refresh data to see new transactions
                await fetchFromApi();
            }
        } catch (error) {
            console.error('Error processing recurring transactions:', error);
            toast.error('Failed to process recurring transactions');
        }
    };

    return (
        <FinanceContext.Provider
            value={{
                userId,
                // State
                settings,
                currency: settings.currency, // Expose currency
                expenses,
                incomes,
                debts,
                goals,
                accounts,
                investments,
                liabilities,
                recurringTransactions,
                notifications,
                emergencyFundAmount,
                isLoading,
                isRefreshing,
                isOffline,
                apiStatus,
                isFundAllocationOpen,
                fundAllocationType,

                // Auth
                authStatus,
                currentUser,
                isAwaitingPin,
                isRememberedUser,
                rememberedMobile,
                authMessage,

                // Actions
                refreshData,
                updateSettings,
                checkIdentity,
                login,
                signup,
                logout,
                clearPendingSession,
                scheduleAccountDeletion,
                cancelAccountDeletion,
                deletionDate,
                sendOtp,
                verifyOtp,
                resetPin,
                pendingMobile,

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
                createLiability,
                updateLiability,
                deleteLiability,
                migrateSubscriptions,
                cleanupDuplicates,
                createInvestment,
                updateInvestment,
                deleteInvestment,
                createRecurringTransaction,
                createRecurring: createRecurringTransaction, // Alias
                deleteRecurringTransaction,
                processRecurringTransactions,
                setEmergencyFundAmount,
                setNotifications,
                applyTheme,

                // Fund Allocation
                openFundAllocation,
                closeFundAllocation,
                performFundAllocation,
                deductFromAccount,
                transferFunds,
            }}
        >
            {children}
        </FinanceContext.Provider>
    );
};
