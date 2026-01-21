import { useCallback, useMemo, useRef, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

export const useFinanceLoad = (state: any, actions: any) => {
    const {
        userId, setSettings, setExpenses, setIncomes, setDebts, setGoals,
        setAccounts, setInvestments, setLiabilities, setNotifications,
        setEmergencyFundAmount, setRecurringTransactions, setRememberedMobile,
        setPendingMobile, setIsRememberedUser, setDeletionDate,
        setIsLoading
    } = state;

    const actionsRef = useRef(actions);
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);

    const migrateLegacyPrefixes = useCallback(() => {

        // Map of legacy keys to new keys
        const keyMap: Record<string, string> = {
            'finbase_settings': 'finhub_settings',
            'finbase_expenses': 'finhub_expenses',
            'finbase_incomes': 'finhub_incomes',
            'finbase_debts': 'finhub_debts',
            'finbase_goals': 'finhub_goals',
            'finbase_accounts': 'finhub_accounts',
            'finbase_investments': 'finhub_investments',
            'finbase_liabilities': 'finhub_liabilities',
            'finbase_notifications': 'finhub_notifications',
            'finbase_emergency_fund': 'finhub_emergency_fund',
            'finbase_recurring': 'finhub_recurring',
            'finbase_auth': 'finhub_auth',
            'finbase_remembered_mobile': 'finhub_remembered_mobile',
            'finbase_deletion_schedule': 'finhub_deletion_schedule'
        };

        let migratedCount = 0;
        Object.entries(keyMap).forEach(([oldKey, newKey]) => {
            const oldData = localStorage.getItem(oldKey);
            const newData = localStorage.getItem(newKey);

            // Only migrate if old data exists and new data doesn't (or is empty)
            if (oldData && (!newData || newData === '[]' || newData === '{}')) {
                localStorage.setItem(newKey, oldData);
                migratedCount++;
                console.log(`Migrated ${oldKey} to ${newKey}`);
            }
        });

        if (migratedCount > 0) {
            console.log(`Successfully migrated ${migratedCount} legacy storage keys.`);
        }
    }, []);

    const loadInitialData = useCallback(async () => {
        const { applyTheme, fetchFromApi, purgeAllData, runCategorizationMigration } = actionsRef.current;
        setIsLoading(true);

        // Migrate legacy prefixes before loading
        migrateLegacyPrefixes();

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
                const parsed = JSON.parse(storedNotifications);
                const unique = parsed.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id || (t.message === v.message && t.type === v.type)) === i);
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
                if (new Date().getTime() >= deletionTime) {
                    purgeAllData();
                } else {
                    setDeletionDate(storedDeletion);
                }
            }
        } catch (e) { console.error("Error loading local data:", e); }

        await fetchFromApi();

        const hasMigrationRun = localStorage.getItem('finhub_subscription_migration_v3');
        if (!hasMigrationRun && userId) {
            runCategorizationMigration();
            localStorage.setItem('finhub_subscription_migration_v3', 'true');
        }

        setIsLoading(false);
    }, [userId, setSettings, setExpenses, setIncomes, setDebts, setGoals, setAccounts, setInvestments, setLiabilities, setNotifications, setEmergencyFundAmount, setRecurringTransactions, setRememberedMobile, setPendingMobile, setIsRememberedUser, setDeletionDate, setIsLoading, migrateLegacyPrefixes]);

    return useMemo(() => ({ loadInitialData }), [loadInitialData]);
};
