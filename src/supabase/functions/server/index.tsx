import { Hono, Context } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { z } from 'npm:zod';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Security: Restrict CORS to specific origins
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://finhub-beta.vercel.app'], // Replace with actual production URL when ready
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Use a sanitized logger that doesn't dump raw request bodies in production
app.use('*', logger((str: string) => {
  // Only log method and path for privacy
  console.log(`[API] ${str}`);
}));

// Helper function to generate unique IDs
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ===== SCHEMAS =====
const SettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  currency: z.string().length(3).optional(),
  name: z.string().max(50).optional(),
  notificationsEnabled: z.boolean().optional(),
  roundUpEnabled: z.boolean().optional(),
  aiProvider: z.enum(['openai', 'anthropic', 'gemini']).optional(),
});

// ===== AI DISPATCHER =====
app.post('/server', async (c: any) => {
  try {
    const { action, ...payload } = await c.req.json();

    switch (action) {
      case 'categorize':
        return await handleCategorize(c, payload);
      case 'chat':
        return await handleChat(c, payload);
      case 'dashboard-feedback':
        return await handleDashboardFeedback(c, payload);
      default:
        return c.json({ success: false, error: 'Unknown AI action' }, 400);
    }
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

const AccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['bank', 'cash', 'credit_card', 'investment', 'other']),
  balance: z.number(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const TransactionSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  accountId: z.string(),
  type: z.enum(['income', 'expense']),
  tags: z.array(z.string()).optional(),
  recurringId: z.string().optional(),
  goalId: z.string().optional(),
});

// ===== USER ROUTES =====

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
    console.log(`Error fetching user settings: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update user settings
app.post('/make-server-6e7daf8e/user/:userId/settings', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const jsonBody = await c.req.json();

    // Validation
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

// ===== ACCOUNT ROUTES =====

// Get all accounts for a user
app.get('/make-server-6e7daf8e/user/:userId/accounts', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const prefix = `user:${userId}:account:`;
    const accounts = await kv.getByPrefix(prefix);

    return c.json({ success: true, accounts: accounts || [] });
  } catch (error) {
    console.log(`Error fetching accounts: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create account
app.post('/make-server-6e7daf8e/user/:userId/accounts', async (c: Context) => {
  try {
    const userId = c.req.param('userId');
    const jsonBody = await c.req.json();

    // Validation
    const validation = AccountSchema.safeParse(jsonBody);
    if (!validation.success) {
      return c.json({ success: false, error: 'Invalid account data', details: validation.error.format() }, 400);
    }

    const accountId = generateId();
    const key = `user:${userId}:account:${accountId}`;

    const account = {
      id: accountId,
      ...validation.data,
      createdAt: new Date().toISOString()
    };

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

    // Partial validation for updates
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
    console.log(`Error deleting account: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== TRANSACTION ROUTES (EXPENSES) =====

// Get all expenses for a user
app.get('/make-server-6e7daf8e/user/:userId/expenses', async (c: Context) => {
  try {
    const userId = c.req.param('userId');
    const prefix = `user:${userId}:expense:`;
    const expenses = await kv.getByPrefix(prefix);

    return c.json({ success: true, expenses: expenses || [] });
  } catch (error) {
    console.log(`Error fetching expenses: ${error}`);
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

    const expense = {
      id: expenseId,
      ...body,
      createdAt: new Date().toISOString()
    };

    // Update account balance if accountId is provided
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
    console.log(`Error creating expense: ${error}`);
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
    if (!currentExpense) {
      return c.json({ success: false, error: 'Expense not found' }, 404);
    }

    const updatedExpense = { ...currentExpense, ...body };
    await kv.set(key, updatedExpense);

    return c.json({ success: true, expense: updatedExpense });
  } catch (error) {
    console.log(`Error updating expense: ${error}`);
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
    console.log(`Error deleting expense: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== INCOME ROUTES =====

// Get all income for a user
app.get('/make-server-6e7daf8e/user/:userId/incomes', async (c: Context) => {
  try {
    const userId = c.req.param('userId');
    const prefix = `user:${userId}:income:`;
    const incomes = await kv.getByPrefix(prefix);

    return c.json({ success: true, incomes: incomes || [] });
  } catch (error) {
    console.log(`Error fetching incomes: ${error}`);
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

    const income = {
      id: incomeId,
      ...body,
      createdAt: new Date().toISOString()
    };

    // Update account balance if accountId is provided
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
    console.log(`Error creating income: ${error}`);
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
    if (!currentIncome) {
      return c.json({ success: false, error: 'Income not found' }, 404);
    }

    const updatedIncome = { ...currentIncome, ...body };
    await kv.set(key, updatedIncome);

    return c.json({ success: true, income: updatedIncome });
  } catch (error) {
    console.log(`Error updating income: ${error}`);
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
    console.log(`Error deleting income: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== DEBT ROUTES =====

// Purge all data for a user
app.post('/make-server-6e7daf8e/user/:userId/purge', async (c: Context) => {
  try {
    const userId = c.req.param('userId');
    const confirmation = c.req.query('confirm');

    if (confirmation !== 'true') {
      return c.json({ success: false, error: 'Purge must be confirmed' }, 400);
    }

    const prefix = `user:${userId}:`;
    const keys = await kv.listKeys(prefix);

    for (const key of keys) {
      await kv.del(key);
    }

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
    console.log(`Error fetching debts: ${error}`);
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

    const debt = {
      id: debtId,
      ...body,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Update account balance if accountId is provided
    if (body.accountId) {
      const accountKey = `user:${userId}:account:${body.accountId}`;
      const account = await kv.get(accountKey);
      if (account) {
        // For borrowed debt, increase balance (money received)
        // For lent debt, decrease balance (money given)
        if (body.type === 'borrowed') {
          account.balance += body.amount;
        } else if (body.type === 'lent') {
          account.balance -= body.amount;
        }
        await kv.set(accountKey, account);
      }
    }

    await kv.set(key, debt);
    return c.json({ success: true, debt });
  } catch (error) {
    console.log(`Error creating debt: ${error}`);
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
    if (!currentDebt) {
      return c.json({ success: false, error: 'Debt not found' }, 404);
    }

    const updatedDebt = { ...currentDebt, ...body };
    await kv.set(key, updatedDebt);

    return c.json({ success: true, debt: updatedDebt });
  } catch (error) {
    console.log(`Error updating debt: ${error}`);
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
    console.log(`Error deleting debt: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== GOALS ROUTES =====

// Get all goals for a user
app.get('/make-server-6e7daf8e/user/:userId/goals', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const prefix = `user:${userId}:goal:`;
    const goals = await kv.getByPrefix(prefix);

    return c.json({ success: true, goals: goals || [] });
  } catch (error) {
    console.log(`Error fetching goals: ${error}`);
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

    const goal = {
      id: goalId,
      ...body,
      currentAmount: body.currentAmount || 0,
      createdAt: new Date().toISOString()
    };

    await kv.set(key, goal);
    return c.json({ success: true, goal });
  } catch (error) {
    console.log(`Error creating goal: ${error}`);
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
    if (!currentGoal) {
      return c.json({ success: false, error: 'Goal not found' }, 404);
    }

    const updatedGoal = { ...currentGoal, ...body };
    await kv.set(key, updatedGoal);

    return c.json({ success: true, goal: updatedGoal });
  } catch (error) {
    console.log(`Error updating goal: ${error}`);
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
    console.log(`Error deleting goal: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== AI ASSISTANT ROUTES =====

// Smart categorization suggestion
const handleCategorize = async (c: Context, payload: any) => {
  try {
    const { description } = payload;
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return c.json({ success: false, error: 'Gemini API key not configured' }, 500);
    }

    const response = await fetch(
      `https://generative-language.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Given this transaction description: "${description}", suggest a single category and up to 3 relevant tags. Respond ONLY with a JSON object in this exact format: {"category": "CategoryName", "tags": ["tag1", "tag2", "tag3"]}. 
              
              Valid categories: Food & Dining, Transport, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Groceries, Personal Care, Salary, Freelance, Investment, Gift, Other.
              
              Keep tags short, lowercase, and descriptive.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200
          }
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestion = JSON.parse(jsonMatch[0]);
        return c.json({ success: true, suggestion });
      }
    }

    return c.json({ success: true, suggestion: { category: 'Other', tags: [] } });
  } catch (error) {
    console.log(`Error in AI categorization: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
};
app.post('/make-server-6e7daf8e/ai/categorize', async (c) => handleCategorize(c, await c.req.json()));

// AI Finance Guru chat
const handleChat = async (c: Context, payload: any) => {
  try {
    const { message, context } = payload;
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return c.json({ success: false, error: 'Gemini API key not configured' }, 500);
    }

    const systemPrompt = `You are a friendly, supportive AI Finance Guru helping users manage their personal finances. Be encouraging, provide actionable advice, and use simple language. 
    
    User's financial context:
    - Total Income: ${context.totalIncome || 0}
    - Total Expenses: ${context.totalExpenses || 0}
    - Active Debts: ${context.activeDebts || 0}
    - Savings Goals: ${context.goalsCount || 0}
    - Recent transactions: ${JSON.stringify(context.recentTransactions || [])}
    
    Provide specific, personalized advice based on this data.`;

    const response = await fetch(
      `https://generative-language.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser question: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const reply = data.candidates[0].content.parts[0].text;
      return c.json({ success: true, reply });
    }

    return c.json({ success: false, error: 'No response from AI' }, 500);
  } catch (error) {
    console.log(`Error in AI chat: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
};
app.post('/make-server-6e7daf8e/ai/chat', async (c) => handleChat(c, await c.req.json()));

// Generate dashboard AI feedback
const handleDashboardFeedback = async (c: Context, payload: any) => {
  try {
    const { context } = payload;
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return c.json({ success: false, error: 'Gemini API key not configured' }, 500);
    }

    const prompt = `Based on this user's financial data, generate a short, encouraging motivational tip (max 2 sentences):
    - Total Income: ${context.totalIncome || 0}
    - Total Expenses: ${context.totalExpenses || 0}
    - Spending percentage: ${context.spendingPercentage || 0}%
    - Recent category: ${context.topCategory || 'N/A'}
    
    Make it personal, actionable, and positive.`;

    const response = await fetch(
      `https://generative-language.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 150
          }
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const feedback = data.candidates[0].content.parts[0].text;
      return c.json({ success: true, feedback });
    }

    return c.json({ success: true, feedback: 'Keep up the great work tracking your finances! 💪' });
  } catch (error) {
    console.log(`Error generating dashboard feedback: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
};
app.post('/make-server-6e7daf8e/ai/dashboard-feedback', async (c) => handleDashboardFeedback(c, await c.req.json()));

// ===== RECURRING TRANSACTIONS ROUTES =====

// Get recurring transactions for a user
app.get('/make-server-6e7daf8e/user/:userId/recurring', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const prefix = `user:${userId}:recurring:`;
    const recurring = await kv.getByPrefix(prefix);

    return c.json({ success: true, recurring: recurring || [] });
  } catch (error) {
    console.log(`Error fetching recurring transactions: ${error}`);
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

    const recurring = {
      id: recurringId,
      ...body,
      createdAt: new Date().toISOString()
    };

    await kv.set(key, recurring);
    return c.json({ success: true, recurring });
  } catch (error) {
    console.log(`Error creating recurring transaction: ${error}`);
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
    console.log(`Error deleting recurring transaction: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Process recurring transactions (called by cron or manually)
app.post('/make-server-6e7daf8e/user/:userId/recurring/process', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const prefix = `user:${userId}:recurring:`;
    const recurring = await kv.getByPrefix(prefix);

    const today = new Date();
    const processed = [];

    for (const rec of recurring || []) {
      const startDate = new Date(rec.startDate);
      const endDate = rec.endDate ? new Date(rec.endDate) : null;

      // Check if transaction is active
      if (today >= startDate && (!endDate || today <= endDate)) {
        // Check if we need to create transaction based on frequency
        const lastProcessedKey = `user:${userId}:recurring:${rec.id}:last_processed`;
        const lastProcessed = await kv.get(lastProcessedKey);
        const lastProcessedDate = lastProcessed ? new Date(lastProcessed) : null;

        let shouldProcess = false;

        if (!lastProcessedDate) {
          // Never processed before - check if start date has passed
          shouldProcess = today >= startDate;
        } else {
          // Check based on frequency
          const daysSinceProcessed = Math.floor((today.getTime() - lastProcessedDate.getTime()) / (1000 * 60 * 60 * 24));

          switch (rec.frequency) {
            case 'daily':
              shouldProcess = daysSinceProcessed >= 1;
              break;
            case 'weekly':
              shouldProcess = daysSinceProcessed >= 7;
              break;
            case 'monthly':
              // Check if it's a different month
              shouldProcess = lastProcessedDate.getMonth() !== today.getMonth() ||
                lastProcessedDate.getFullYear() !== today.getFullYear();
              break;
            case 'yearly':
              // Check if it's a different year
              shouldProcess = lastProcessedDate.getFullYear() !== today.getFullYear();
              break;
            default:
              // Default to monthly if frequency not specified
              shouldProcess = lastProcessedDate.getMonth() !== today.getMonth() ||
                lastProcessedDate.getFullYear() !== today.getFullYear();
          }
        }

        if (shouldProcess) {

          // Update account balance first
          const accountKey = `user:${userId}:account:${rec.accountId}`;
          const account = await kv.get(accountKey);

          if (account) {
            if (rec.type === 'expense') {
              account.balance -= rec.amount;
            } else if (rec.type === 'income') {
              account.balance += rec.amount;
            }
            await kv.set(accountKey, account);
          }

          // Create the transaction based on type
          const transactionId = generateId();
          let transactionKey = '';
          let transaction = {};

          if (rec.type === 'expense') {
            transactionKey = `user:${userId}:expense:${transactionId}`;
            transaction = {
              id: transactionId,
              description: rec.description,
              amount: rec.amount,
              category: rec.category,
              accountId: rec.accountId,
              date: today.toISOString().split('T')[0],
              tags: [...(rec.tags || []), 'recurring'],
              createdAt: new Date().toISOString()
            };
          } else if (rec.type === 'income') {
            transactionKey = `user:${userId}:income:${transactionId}`;
            transaction = {
              id: transactionId,
              source: rec.source,
              amount: rec.amount,
              accountId: rec.accountId,
              date: today.toISOString().split('T')[0],
              tags: [...(rec.tags || []), 'recurring'],
              createdAt: new Date().toISOString()
            };
          }

          await kv.set(transactionKey, transaction);
          await kv.set(lastProcessedKey, today.toISOString());
          processed.push(transaction);
        }
      }
    }

    return c.json({ success: true, processed, count: processed.length });
  } catch (error) {
    console.log(`Error processing recurring transactions: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== LIABILITY ROUTES =====

// Get all liabilities for a user
app.get('/make-server-6e7daf8e/user/:userId/liabilities', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const prefix = `user:${userId}:liability:`;
    const liabilities = await kv.getByPrefix(prefix);

    return c.json({ success: true, liabilities: liabilities || [] });
  } catch (error) {
    console.log(`Error fetching liabilities: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create liability
app.post('/make-server-6e7daf8e/user/:userId/liabilities', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    const liabilityId = generateId();
    const key = `user:${userId}:liability:${liabilityId}`;

    const liability = {
      id: liabilityId,
      ...body,
      createdAt: new Date().toISOString()
    };

    await kv.set(key, liability);
    return c.json({ success: true, liability });
  } catch (error) {
    console.log(`Error creating liability: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update liability
app.put('/make-server-6e7daf8e/user/:userId/liabilities/:liabilityId', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const liabilityId = c.req.param('liabilityId');
    const body = await c.req.json();
    const key = `user:${userId}:liability:${liabilityId}`;

    const currentLiability = await kv.get(key);
    if (!currentLiability) {
      return c.json({ success: false, error: 'Liability not found' }, 404);
    }

    const updatedLiability = { ...currentLiability, ...body };
    await kv.set(key, updatedLiability);

    return c.json({ success: true, liability: updatedLiability });
  } catch (error) {
    console.log(`Error updating liability: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete liability
app.delete('/make-server-6e7daf8e/user/:userId/liabilities/:liabilityId', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const liabilityId = c.req.param('liabilityId');
    const key = `user:${userId}:liability:${liabilityId}`;

    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting liability: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== INVESTMENT ROUTES =====

// Get all investments for a user
app.get('/make-server-6e7daf8e/user/:userId/investments', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const prefix = `user:${userId}:investment:`;
    const investments = await kv.getByPrefix(prefix);

    return c.json({ success: true, investments: investments || [] });
  } catch (error) {
    console.log(`Error fetching investments: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create investment
app.post('/make-server-6e7daf8e/user/:userId/investments', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    const investmentId = generateId();
    const key = `user:${userId}:investment:${investmentId}`;

    const investment = {
      id: investmentId,
      ...body,
      createdAt: new Date().toISOString()
    };

    await kv.set(key, investment);
    return c.json({ success: true, investment });
  } catch (error) {
    console.log(`Error creating investment: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update investment
app.put('/make-server-6e7daf8e/user/:userId/investments/:investmentId', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const investmentId = c.req.param('investmentId');
    const body = await c.req.json();
    const key = `user:${userId}:investment:${investmentId}`;

    const currentInvestment = await kv.get(key);
    if (!currentInvestment) {
      return c.json({ success: false, error: 'Investment not found' }, 404);
    }

    const updatedInvestment = { ...currentInvestment, ...body };
    await kv.set(key, updatedInvestment);

    return c.json({ success: true, investment: updatedInvestment });
  } catch (error) {
    console.log(`Error updating investment: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete investment
app.delete('/make-server-6e7daf8e/user/:userId/investments/:investmentId', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const investmentId = c.req.param('investmentId');
    const key = `user:${userId}:investment:${investmentId}`;

    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting investment: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== CURRENCY CONVERSION =====

// Get exchange rates (proxy to avoid CORS issues)
app.get('/make-server-6e7daf8e/currency/rates/:baseCurrency', async (c: any) => {
  try {
    const baseCurrency = c.req.param('baseCurrency');
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    return c.json({ success: true, rates: data.rates, base: data.base });
  } catch (error) {
    console.log(`Error fetching exchange rates: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Health check
app.get('/make-server-6e7daf8e/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
