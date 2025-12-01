import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6e7daf8e`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`
};

// User settings
export const api = {
  async getSettings(userId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}`, { headers });
    return response.json();
  },

  async updateSettings(userId: string, updates: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/settings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  // Expenses
  async getExpenses(userId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/expenses`, { headers });
    return response.json();
  },

  async createExpense(userId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateExpense(userId: string, expenseId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/expenses/${expenseId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteExpense(userId: string, expenseId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  // Incomes
  async getIncomes(userId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/incomes`, { headers });
    return response.json();
  },

  async createIncome(userId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/incomes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateIncome(userId: string, incomeId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/incomes/${incomeId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteIncome(userId: string, incomeId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/incomes/${incomeId}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  // Debts
  async getDebts(userId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/debts`, { headers });
    return response.json();
  },

  async createDebt(userId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/debts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateDebt(userId: string, debtId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/debts/${debtId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteDebt(userId: string, debtId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/debts/${debtId}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  // Goals
  async getGoals(userId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/goals`, { headers });
    return response.json();
  },

  async createGoal(userId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/goals`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateGoal(userId: string, goalId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/goals/${goalId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteGoal(userId: string, goalId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/goals/${goalId}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  // Accounts
  async getAccounts(userId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/accounts`, { headers });
    return response.json();
  },

  async createAccount(userId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateAccount(userId: string, accountId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/accounts/${accountId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteAccount(userId: string, accountId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/accounts/${accountId}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  // AI
  async categorize(description: string) {
    const response = await fetch(`${API_BASE}/ai/categorize`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ description })
    });
    return response.json();
  },

  async chat(message: string, context: any) {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, context })
    });
    return response.json();
  },

  async getDashboardFeedback(context: any) {
    const response = await fetch(`${API_BASE}/ai/dashboard-feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ context })
    });
    return response.json();
  },

  // Recurring Transactions
  async getRecurring(userId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/recurring`, { headers });
    return response.json();
  },

  async createRecurring(userId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/recurring`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteRecurring(userId: string, recurringId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/recurring/${recurringId}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  async processRecurring(userId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/recurring/process`, {
      method: 'POST',
      headers
    });
    return response.json();
  },

  // Investments
  async getInvestments(userId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/investments`, { headers });
    return response.json();
  },

  async createInvestment(userId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/investments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateInvestment(userId: string, investmentId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/investments/${investmentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteInvestment(userId: string, investmentId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/investments/${investmentId}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  // Liabilities
  async getLiabilities(userId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/liabilities`, { headers });
    return response.json();
  },

  async createLiability(userId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/liabilities`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateLiability(userId: string, liabilityId: string, data: any) {
    const response = await fetch(`${API_BASE}/user/${userId}/liabilities/${liabilityId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteLiability(userId: string, liabilityId: string) {
    const response = await fetch(`${API_BASE}/user/${userId}/liabilities/${liabilityId}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },

  // Currency
  async getExchangeRates(baseCurrency: string) {
    const response = await fetch(`${API_BASE}/currency/rates/${baseCurrency}`, { headers });
    return response.json();
  }
};
