import { useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

export const useFinancePersistence = (state: any) => {
    const {
        settings, expenses, incomes, debts, goals, accounts,
        investments, liabilities, recurringTransactions,
        notifications, emergencyFundAmount
    } = state;

    // Load initial data is complex and usually requires the setters, 
    // so we'll pass the setters or a loading function.
    // For now, this hook handles the AUTO-SAVE functionality.

    useEffect(() => {
        if (settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        if (expenses) localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    }, [expenses]);

    useEffect(() => {
        if (incomes) localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
    }, [incomes]);

    useEffect(() => {
        if (debts) localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    }, [debts]);

    useEffect(() => {
        if (goals) localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    }, [goals]);

    useEffect(() => {
        if (accounts) localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    }, [accounts]);

    useEffect(() => {
        if (investments) localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
    }, [investments]);

    useEffect(() => {
        if (liabilities) localStorage.setItem(STORAGE_KEYS.LIABILITIES, JSON.stringify(liabilities));
    }, [liabilities]);

    useEffect(() => {
        if (recurringTransactions) localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurringTransactions));
    }, [recurringTransactions]);

    useEffect(() => {
        if (notifications) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        if (emergencyFundAmount !== undefined) localStorage.setItem(STORAGE_KEYS.EMERGENCY_FUND, JSON.stringify(emergencyFundAmount));
    }, [emergencyFundAmount]);
};
