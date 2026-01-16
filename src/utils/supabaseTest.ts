import { api } from './api';

/**
 * Test Supabase connection and API endpoints
 */
export async function testSupabaseConnection(userId: string = 'demo-user-001') {
    const results = {
        timestamp: new Date().toISOString(),
        userId,
        tests: [] as Array<{ name: string; status: 'success' | 'error'; message: string; duration?: number }>
    };

    // Test 1: Get user settings
    try {
        const start = Date.now();
        const settings = await api.getSettings(userId);
        results.tests.push({
            name: 'Get Settings',
            status: 'success',
            message: `Retrieved settings for user ${userId}`,
            duration: Date.now() - start
        });
    } catch (error) {
        results.tests.push({
            name: 'Get Settings',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }

    // Test 2: Get expenses
    try {
        const start = Date.now();
        const expenses = await api.getExpenses(userId);
        results.tests.push({
            name: 'Get Expenses',
            status: 'success',
            message: `Retrieved ${Array.isArray(expenses) ? expenses.length : 0} expenses`,
            duration: Date.now() - start
        });
    } catch (error) {
        results.tests.push({
            name: 'Get Expenses',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }

    // Test 3: Get accounts
    try {
        const start = Date.now();
        const accounts = await api.getAccounts(userId);
        results.tests.push({
            name: 'Get Accounts',
            status: 'success',
            message: `Retrieved ${Array.isArray(accounts) ? accounts.length : 0} accounts`,
            duration: Date.now() - start
        });
    } catch (error) {
        results.tests.push({
            name: 'Get Accounts',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }

    return results;
}

/**
 * Quick connection check
 */
export async function quickConnectionCheck(): Promise<boolean> {
    try {
        await api.getSettings('demo-user-001');
        return true;
    } catch {
        return false;
    }
}
