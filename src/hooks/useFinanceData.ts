import { useState, useMemo } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import {
    Expense,
    Income,
    Debt,
    Goal,
    Account,
    Investment,
    Liability,
    RecurringTransaction,
    Notification,
    UserSettings
} from '../types';

export const useFinanceData = () => {
    const [settings, setSettings] = useState<UserSettings>({
        theme: "system",
        currency: "INR",
        unlockedAchievements: [],
        name: "",
        photoURL: "",
        notificationsEnabled: false,
        roundUpEnabled: true,
        aiProvider: "openai",
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
    const [isLoading, setIsLoading] = useState(() => {
        // Initial load should only happen if we have a user session
        return !!localStorage.getItem(STORAGE_KEYS.AUTH);
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'error'>('online');
    const [backfillRequest, setBackfillRequest] = useState<{ count: number; dates: Date[]; recurring: any } | null>(null);

    return useMemo(() => ({
        settings, setSettings,
        expenses, setExpenses,
        incomes, setIncomes,
        debts, setDebts,
        goals, setGoals,
        accounts, setAccounts,
        investments, setInvestments,
        liabilities, setLiabilities,
        recurringTransactions, setRecurringTransactions,
        notifications, setNotifications,
        emergencyFundAmount, setEmergencyFundAmount,
        isLoading, setIsLoading,
        isRefreshing, setIsRefreshing,
        isOffline, setIsOffline,
        apiStatus, setApiStatus,
        backfillRequest, setBackfillRequest
    }), [
        settings, expenses, incomes, debts, goals, accounts, investments,
        liabilities, recurringTransactions, notifications, emergencyFundAmount,
        isLoading, isRefreshing, isOffline, apiStatus, backfillRequest
    ]);
};
