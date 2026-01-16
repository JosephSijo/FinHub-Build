import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useAuth } from '../hooks/useAuth';
import { useFinancePersistence } from '../hooks/useFinancePersistence';
import { useFinanceTheme } from '../hooks/useFinanceTheme';
import { useFinanceNotifications } from '../hooks/useFinanceNotifications';
import { useAccountActions } from '../hooks/useAccountActions';
import { useRecurringActions } from '../hooks/useRecurringActions';
import { useGoalActions } from '../hooks/useGoalActions';
import { useInvestmentActions } from '../hooks/useInvestmentActions';
import { useLiabilityActions } from '../hooks/useLiabilityActions';
import { useExpenseActions } from '../hooks/useExpenseActions';
import { useIncomeActions } from '../hooks/useIncomeActions';
import { useDebtActions } from '../hooks/useDebtActions';
import { useFinanceSyncActions } from '../hooks/useFinanceSyncActions';
import { useFinanceCheckers } from '../hooks/useFinanceCheckers';
import { useFinanceLoad } from '../hooks/useFinanceLoad';
import { useFundAllocation } from '../hooks/useFundAllocation';
import { FinanceContextType } from '../types';
import { recurringService } from '../features/recurringEngine';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) throw new Error('useFinance must be used within a FinanceProvider');
    return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Base Data & UI State
    const financeData = useFinanceData();
    const { applyTheme } = useFinanceTheme();
    const { addNotifications } = useFinanceNotifications(financeData.setNotifications);

    // 2. Auth Module
    const auth = useAuth();
    const userId = auth.currentUser?.id || "demo-user-001";

    // Prepare state object for other hooks (to avoid too many arguments)
    const state = useMemo(() => ({ ...financeData, ...auth, userId }), [financeData, auth, userId]);

    // 3. Independent Action Modules
    const accountActions = useAccountActions(state);
    const recurringActions = useRecurringActions(state);

    // Actions that might depend on each other (Actions Bundle)
    const actionsBundle = useMemo(() => ({
        ...accountActions,
        ...recurringActions,
        applyTheme,
        addNotifications
    }), [accountActions, recurringActions, applyTheme, addNotifications]);

    // 4. Domain Action Modules
    const goalActions = useGoalActions(state, actionsBundle);
    const investmentActions = useInvestmentActions(state, { ...actionsBundle, ...goalActions });
    const liabilityActions = useLiabilityActions(state, actionsBundle);

    const allActionsBundle = useMemo(() => ({
        ...actionsBundle,
        ...goalActions,
        ...investmentActions,
        ...liabilityActions
    }), [actionsBundle, goalActions, investmentActions, liabilityActions]);

    const expenseActions = useExpenseActions(state, allActionsBundle);
    const incomeActions = useIncomeActions(state, allActionsBundle);
    const debtActions = useDebtActions(state, allActionsBundle);

    const fullActionsBundle = useMemo(() => ({
        ...allActionsBundle,
        ...expenseActions,
        ...incomeActions,
        ...debtActions
    }), [allActionsBundle, expenseActions, incomeActions, debtActions]);

    // 5. Sync, Load & Business Logic
    const syncActions = useFinanceSyncActions(state, fullActionsBundle);
    const fundAllocation = useFundAllocation(state, fullActionsBundle);
    const checkers = useFinanceCheckers(state, { ...fullActionsBundle, ...syncActions });
    const loader = useFinanceLoad(state, { ...fullActionsBundle, ...syncActions });

    // 6. Global Persistence Side Effect
    useFinancePersistence(financeData);

    // 7. Core Effects (Orchestration)
    useEffect(() => {
        if (auth.authStatus === 'authenticated') {
            loader.loadInitialData();
        }
    }, [auth.authStatus, loader]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (auth.authStatus === 'authenticated') {
                checkers.checkSmartDues();
                checkers.checkForAchievements();
            }
        }, 1000 * 60 * 60); // Check every hour
        return () => clearInterval(interval);
    }, [auth.authStatus, checkers]);

    useEffect(() => {
        if (auth.authStatus === 'authenticated') {
            const timer = setTimeout(() => {
                recurringService.backfillAll(userId).catch(console.error);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [auth.authStatus, userId]);

    // Handle session inactivity
    useEffect(() => {
        let timeoutId: string | number | NodeJS.Timeout;
        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (auth.authStatus === 'authenticated') {
                timeoutId = setTimeout(() => {
                    auth.logout();
                }, 1000 * 60 * 20); // 20 minutes inactivity
            }
        };
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);
        resetTimer();
        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [auth.authStatus, auth]);

    // Construct the context value
    const contextValue: FinanceContextType = useMemo(() => ({
        ...financeData,
        ...auth,
        ...fullActionsBundle,
        ...syncActions,
        ...fundAllocation,
        ...checkers,
        ...loader,
        userId,
        currency: financeData.settings.currency,
        clearAllData: syncActions.purgeAllData,
        createRecurring: recurringActions.createRecurringTransaction,
        processRecurringTransactions: async () => { await recurringService.backfillAll(userId); }
    }), [financeData, auth, fullActionsBundle, syncActions, fundAllocation, checkers, loader, userId, recurringActions]);

    return (
        <FinanceContext.Provider value={contextValue}>
            {children}
        </FinanceContext.Provider>
    );
};
