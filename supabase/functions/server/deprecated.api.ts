// <reference lib="deno.ns" />
import { Hono, Context } from 'hono';
import * as kv from './kv_store.ts';
import { z } from 'zod';

const app = new Hono();

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const SettingsSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    currency: z.string().length(3).optional(),
    name: z.string().max(50).optional(),
    notificationsEnabled: z.boolean().optional(),
    roundUpEnabled: z.boolean().optional(),
    aiProvider: z.enum(['openai', 'anthropic', 'gemini']).optional(),
});

const AccountSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['bank', 'cash', 'credit_card', 'investment', 'other']),
    balance: z.number(),
    color: z.string().optional(),
    icon: z.string().optional(),
});

// ===== DEPRECATED ROUTES (Using KV_STORE) =====

// Get user profile and settings
app.get('/make-server-6e7daf8e/user/:userId', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const settingsKey = `user:${userId}:settings`;
        const settings = await kv.get(settingsKey) || {
            theme: 'system',
            currency: 'INR',
            unlockedAchievements: [],
            photoURL: '',
            notificationsEnabled: false
        };
        return c.json({ success: true, settings });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Update user settings
app.post('/make-server-6e7daf8e/user/:userId/settings', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const jsonBody = await c.req.json();
        const validation = SettingsSchema.safeParse(jsonBody);
        if (!validation.success) {
            return c.json({ success: false, error: 'Invalid settings data', details: validation.error.format() }, 400);
        }
        const settingsKey = `user:${userId}:settings`;
        const currentSettings = await kv.get(settingsKey) || {};
        const updatedSettings = { ...currentSettings, ...validation.data };
        await kv.set(settingsKey, updatedSettings);
        return c.json({ success: true, settings: updatedSettings });
    } catch (error) {
        return c.json({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// Get all accounts for a user
app.get('/make-server-6e7daf8e/user/:userId/accounts', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const prefix = `user:${userId}:account:`;
        const accounts = await kv.getByPrefix(prefix);
        return c.json({ success: true, accounts: accounts || [] });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Create account
app.post('/make-server-6e7daf8e/user/:userId/accounts', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const jsonBody = await c.req.json();
        const validation = AccountSchema.safeParse(jsonBody);
        if (!validation.success) {
            return c.json({ success: false, error: 'Invalid account data', details: validation.error.format() }, 400);
        }
        const accountId = generateId();
        const key = `user:${userId}:account:${accountId}`;
        const account = { id: accountId, ...validation.data, createdAt: new Date().toISOString() };
        await kv.set(key, account);
        return c.json({ success: true, account });
    } catch (error) {
        return c.json({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// Update account
app.put('/make-server-6e7daf8e/user/:userId/accounts/:accountId', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const accountId = c.req.param('accountId');
        const jsonBody = await c.req.json();
        const validation = AccountSchema.partial().safeParse(jsonBody);
        if (!validation.success) {
            return c.json({ success: false, error: 'Invalid update data', details: validation.error.format() }, 400);
        }
        const key = `user:${userId}:account:${accountId}`;
        const current = await kv.get(key);
        if (!current) return c.json({ success: false, error: 'Account not found' }, 404);
        const updated = { ...current, ...validation.data };
        await kv.set(key, updated);
        return c.json({ success: true, account: updated });
    } catch {
        return c.json({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// Delete account
app.delete('/make-server-6e7daf8e/user/:userId/accounts/:accountId', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const accountId = c.req.param('accountId');
        const key = `user:${userId}:account:${accountId}`;
        await kv.del(key);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Get all expenses for a user
app.get('/make-server-6e7daf8e/user/:userId/expenses', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const prefix = `user:${userId}:expense:`;
        const expenses = await kv.getByPrefix(prefix);
        return c.json({ success: true, expenses: expenses || [] });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Create expense
app.post('/make-server-6e7daf8e/user/:userId/expenses', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const body = await c.req.json();
        const expenseId = generateId();
        const key = `user:${userId}:expense:${expenseId}`;
        const expense = { id: expenseId, ...body, createdAt: new Date().toISOString() };
        if (body.accountId) {
            const accountKey = `user:${userId}:account:${body.accountId}`;
            const account = await kv.get(accountKey);
            if (account) {
                account.balance -= body.amount;
                await kv.set(accountKey, account);
            }
        }
        await kv.set(key, expense);
        return c.json({ success: true, expense });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Update expense
app.put('/make-server-6e7daf8e/user/:userId/expenses/:expenseId', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const expenseId = c.req.param('expenseId');
        const body = await c.req.json();
        const key = `user:${userId}:expense:${expenseId}`;
        const currentExpense = await kv.get(key);
        if (!currentExpense) return c.json({ success: false, error: 'Expense not found' }, 404);
        const updatedExpense = { ...currentExpense, ...body };
        await kv.set(key, updatedExpense);
        return c.json({ success: true, expense: updatedExpense });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Delete expense
app.delete('/make-server-6e7daf8e/user/:userId/expenses/:expenseId', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const expenseId = c.req.param('expenseId');
        const key = `user:${userId}:expense:${expenseId}`;
        await kv.del(key);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Get all income for a user
app.get('/make-server-6e7daf8e/user/:userId/incomes', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const prefix = `user:${userId}:income:`;
        const incomes = await kv.getByPrefix(prefix);
        return c.json({ success: true, incomes: incomes || [] });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Create income
app.post('/make-server-6e7daf8e/user/:userId/incomes', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const body = await c.req.json();
        const incomeId = generateId();
        const key = `user:${userId}:income:${incomeId}`;
        const income = { id: incomeId, ...body, createdAt: new Date().toISOString() };
        if (body.accountId) {
            const accountKey = `user:${userId}:account:${body.accountId}`;
            const account = await kv.get(accountKey);
            if (account) {
                account.balance += body.amount;
                await kv.set(accountKey, account);
            }
        }
        await kv.set(key, income);
        return c.json({ success: true, income });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Update income
app.put('/make-server-6e7daf8e/user/:userId/incomes/:incomeId', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const incomeId = c.req.param('incomeId');
        const body = await c.req.json();
        const key = `user:${userId}:income:${incomeId}`;
        const currentIncome = await kv.get(key);
        if (!currentIncome) return c.json({ success: false, error: 'Income not found' }, 404);
        const updatedIncome = { ...currentIncome, ...body };
        await kv.set(key, updatedIncome);
        return c.json({ success: true, income: updatedIncome });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Delete income
app.delete('/make-server-6e7daf8e/user/:userId/incomes/:incomeId', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const incomeId = c.req.param('incomeId');
        const key = `user:${userId}:income:${incomeId}`;
        await kv.del(key);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Purge all data for a user
app.post('/make-server-6e7daf8e/user/:userId/purge', async (c: Context) => {
    try {
        const userId = c.req.param('userId');
        const confirmation = c.req.query('confirm');
        if (confirmation !== 'true') return c.json({ success: false, error: 'Purge must be confirmed' }, 400);
        const prefix = `user:${userId}:`;
        const keys = await kv.listKeys(prefix);
        for (const key of keys) await kv.del(key);
        return c.json({ success: true, message: `Purged ${keys.length} records` });
    } catch {
        return c.json({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// Get all debts for a user
app.get('/make-server-6e7daf8e/user/:userId/debts', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const prefix = `user:${userId}:debt:`;
        const debts = await kv.getByPrefix(prefix);
        return c.json({ success: true, debts: debts || [] });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Create debt
app.post('/make-server-6e7daf8e/user/:userId/debts', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const body = await c.req.json();
        const debtId = generateId();
        const key = `user:${userId}:debt:${debtId}`;
        const debt = { id: debtId, ...body, status: 'pending', createdAt: new Date().toISOString() };
        if (body.accountId) {
            const accountKey = `user:${userId}:account:${body.accountId}`;
            const account = await kv.get(accountKey);
            if (account) {
                if (body.type === 'borrowed') account.balance += body.amount;
                else if (body.type === 'lent') account.balance -= body.amount;
                await kv.set(accountKey, account);
            }
        }
        await kv.set(key, debt);
        return c.json({ success: true, debt });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Update debt (including settle)
app.put('/make-server-6e7daf8e/user/:userId/debts/:debtId', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const debtId = c.req.param('debtId');
        const body = await c.req.json();
        const key = `user:${userId}:debt:${debtId}`;
        const currentDebt = await kv.get(key);
        if (!currentDebt) return c.json({ success: false, error: 'Debt not found' }, 404);
        const updatedDebt = { ...currentDebt, ...body };
        await kv.set(key, updatedDebt);
        return c.json({ success: true, debt: updatedDebt });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Delete debt
app.delete('/make-server-6e7daf8e/user/:userId/debts/:debtId', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const debtId = c.req.param('debtId');
        const key = `user:${userId}:debt:${debtId}`;
        await kv.del(key);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Get all goals for a user
app.get('/make-server-6e7daf8e/user/:userId/goals', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const prefix = `user:${userId}:goal:`;
        const goals = await kv.getByPrefix(prefix);
        return c.json({ success: true, goals: goals || [] });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Create goal
app.post('/make-server-6e7daf8e/user/:userId/goals', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const body = await c.req.json();
        const goalId = generateId();
        const key = `user:${userId}:goal:${goalId}`;
        const goal = { id: goalId, ...body, currentAmount: body.currentAmount || 0, createdAt: new Date().toISOString() };
        await kv.set(key, goal);
        return c.json({ success: true, goal });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Update goal
app.put('/make-server-6e7daf8e/user/:userId/goals/:goalId', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const goalId = c.req.param('goalId');
        const body = await c.req.json();
        const key = `user:${userId}:goal:${goalId}`;
        const currentGoal = await kv.get(key);
        if (!currentGoal) return c.json({ success: false, error: 'Goal not found' }, 404);
        const updatedGoal = { ...currentGoal, ...body };
        await kv.set(key, updatedGoal);
        return c.json({ success: true, goal: updatedGoal });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Delete goal
app.delete('/make-server-6e7daf8e/user/:userId/goals/:goalId', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const goalId = c.req.param('goalId');
        const key = `user:${userId}:goal:${goalId}`;
        await kv.del(key);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Get recurring transactions for a user
app.get('/make-server-6e7daf8e/user/:userId/recurring', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const prefix = `user:${userId}:recurring:`;
        const recurring = await kv.getByPrefix(prefix);
        return c.json({ success: true, recurring: recurring || [] });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Create recurring transaction
app.post('/make-server-6e7daf8e/user/:userId/recurring', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const body = await c.req.json();
        const recurringId = generateId();
        const key = `user:${userId}:recurring:${recurringId}`;
        const recurring = { id: recurringId, ...body, createdAt: new Date().toISOString() };
        await kv.set(key, recurring);
        return c.json({ success: true, recurring });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

// Delete recurring transaction
app.delete('/make-server-6e7daf8e/user/:userId/recurring/:recurringId', async (c: any) => {
    try {
        const userId = c.req.param('userId');
        const recurringId = c.req.param('recurringId');
        const key = `user:${userId}:recurring:${recurringId}`;
        await kv.del(key);
        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, error: String(error) }, 500);
    }
});

export default app;
