import { supabase } from '../lib/supabase';

// Category Helper
const getCategoryId = async (userId: string, name: string, type: 'expense' | 'income'): Promise<string | null> => {
  if (!name) return null;
  // Try finding existing
  const { data } = await supabase.from('categories')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', name)
    .eq('type', type)
    .maybeSingle();

  if (data?.id) return data.id;

  // Create new
  await supabase.from('categories')
    .insert([{ user_id: userId, name, type }]);

  // Fetch back to avoid 'select' on POST (400 Bad Request avoidance)
  const { data: newCat } = await supabase.from('categories')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', name)
    .eq('type', type)
    .maybeSingle();

  return newCat?.id || null;
};

export const api = {
  // --- Settings (user_profile) ---
  async getSettings(userId: string) {
    const { data, error } = await supabase.from('user_profile')
      .select('settings, theme, base_currency_code, name')
      .eq('user_id', userId)
      .maybeSingle();

    // Default settings if null
    const settings = data?.settings || {};
    if (data?.theme) settings.theme = data.theme;
    if (data?.base_currency_code) settings.currency = data.base_currency_code;
    if (data?.name) settings.name = data.name;

    return { success: !error, settings };
  },

  async updateSettings(userId: string, updates: any) {
    // Check existing to preserve values
    const { data: existing } = await supabase.from('user_profile')
      .select('base_currency_code, name, settings')
      .eq('user_id', userId)
      .maybeSingle();

    const payload: any = {
      user_id: userId,
      settings: { ...(existing?.settings || {}), ...updates },
      theme: updates.theme || existing?.settings?.theme || 'system',
      updated_at: new Date().toISOString()
    };

    if (updates.name) payload.name = updates.name;

    // Handle currency: explicit update > existing > default
    if (updates.currency) payload.base_currency_code = updates.currency;
    else if (existing?.base_currency_code) payload.base_currency_code = existing.base_currency_code;
    else payload.base_currency_code = 'INR';

    const { error } = await supabase.from('user_profile')
      .upsert(payload, { onConflict: 'user_id' });

    return { success: !error, settings: updates };
  },

  // --- Expenses (transactions type='expense') ---
  async getExpenses(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (name)
      `)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .order('txn_date', { ascending: false });

    const expenses = (data || []).map((t: any) => ({
      id: t.id,
      description: t.note || '',
      amount: t.amount,
      category: t.categories?.name || 'Uncategorized',
      date: t.txn_date,
      tags: t.tags || [],
      accountId: t.account_id,
      createdAt: t.created_at,
      liabilityId: t.entity_kind === 'loan' ? t.entity_id : undefined,
      investmentId: t.entity_kind === 'investment' ? t.entity_id : undefined,
      recurringId: t.entity_kind === 'subscription' ? t.entity_id : undefined,
      paymentMethod: t.payment_method,
      merchantName: t.merchant_name
    }));
    return { success: !error, expenses };
  },

  async createExpense(userId: string, data: any) {
    const categoryId = await getCategoryId(userId, data.category, 'expense');

    // FX handling: default to 1:1 if not provided
    const fxRate = data.fxRate || 1;
    const amount = data.amount;
    const baseAmount = data.baseAmount || (amount * fxRate);

    const payload: any = {
      user_id: userId,
      type: 'expense',
      amount: amount,
      currency_code: data.currency || 'INR',
      base_currency_code: data.baseCurrency || 'INR',
      base_amount: baseAmount,
      fx_rate: fxRate,
      fx_date: data.date,
      txn_date: data.date,
      note: data.description,
      account_id: data.accountId,
      category_id: categoryId,
      tags: data.tags || [],
      entity_kind: data.liabilityId ? 'loan' : (data.investmentId ? 'investment' : (data.recurringId ? 'subscription' : null)),
      entity_id: data.liabilityId || data.investmentId || data.recurringId || null
    };

    if (data.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
      payload.id = data.id;
    }

    const { data: txn, error } = await supabase.from('transactions')
      .upsert([payload], { onConflict: 'id' })
      .select().single();

    return {
      success: !error,
      error,
      expense: txn ? {
        ...data,
        id: txn.id,
        createdAt: txn.created_at,
        category: data.category // Keep passed value for UI
      } : { ...data, id: data.id || `temp_${Date.now()}` }
    };
  },

  async updateExpense(userId: string, expenseId: string, data: any) {
    const updates: any = {};
    if (data.amount !== undefined) {
      updates.amount = data.amount;
      updates.base_amount = data.baseAmount || data.amount; // Basic assumption if no complex FX
    }
    if (data.description) updates.note = data.description;
    if (data.date) {
      updates.txn_date = data.date;
      updates.fx_date = data.date;
    }
    if (data.tags) updates.tags = data.tags;
    if (data.category) {
      updates.category_id = await getCategoryId(userId, data.category, 'expense');
    }

    const { data: txn, error } = await supabase.from('transactions')
      .update(updates)
      .eq('id', expenseId)
      .eq('user_id', userId)
      .select().single();

    return { success: !error, error, expense: txn ? { ...data, id: txn.id, createdAt: txn.created_at } : null };
  },

  async deleteExpense(userId: string, expenseId: string) {
    const { error } = await supabase.from('transactions')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId);
    return { success: !error, error };
  },

  // --- Incomes (transactions type='income') ---
  async getIncomes(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, categories (name)`)
      .eq('user_id', userId)
      .eq('type', 'income')
      .order('txn_date', { ascending: false });

    const incomes = (data || []).map((t: any) => ({
      id: t.id,
      source: t.note || '',
      amount: t.amount,
      date: t.txn_date,
      tags: t.tags || [],
      accountId: t.account_id,
      createdAt: t.created_at,
      recurringId: t.entity_kind === 'subscription' ? t.entity_id : undefined,
      category: t.categories?.name || 'Income'
    }));
    return { success: !error, incomes };
  },

  async createIncome(userId: string, data: any) {
    const categoryId = await getCategoryId(userId, data.category || 'Income', 'income');

    const fxRate = data.fxRate || 1;
    const amount = data.amount;
    const baseAmount = data.baseAmount || (amount * fxRate);

    const payload: any = {
      user_id: userId,
      type: 'income',
      amount: amount,
      currency_code: data.currency || 'INR',
      base_currency_code: data.baseCurrency || 'INR',
      base_amount: baseAmount,
      fx_rate: fxRate,
      fx_date: data.date,
      txn_date: data.date,
      note: data.source || data.description || 'Income',
      account_id: data.accountId,
      category_id: categoryId,
      tags: data.tags || [],
      entity_kind: data.recurringId ? 'subscription' : null,
      entity_id: data.recurringId || null
    };

    if (data.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
      payload.id = data.id;
    }

    const { data: txn, error } = await supabase.from('transactions')
      .upsert([payload], { onConflict: 'id' })
      .select().single();

    return {
      success: !error,
      error,
      income: txn ? {
        ...data,
        id: txn.id,
        createdAt: txn.created_at,
        category: data.category || 'Income'
      } : { ...data, id: data.id || `temp_${Date.now()}` }
    };
  },

  async updateIncome(userId: string, incomeId: string, data: any) {
    const updates: any = {};
    if (data.amount !== undefined) {
      updates.amount = data.amount;
      updates.base_amount = data.baseAmount || data.amount;
    }
    if (data.source || data.description) {
      updates.note = data.source || data.description;
    }
    if (data.date) {
      updates.txn_date = data.date;
      updates.fx_date = data.date;
    }
    if (data.tags) updates.tags = data.tags;
    if (data.category) {
      updates.category_id = await getCategoryId(userId, data.category, 'income');
    }

    const { data: txn, error } = await supabase.from('transactions')
      .update(updates)
      .eq('id', incomeId)
      .eq('user_id', userId)
      .select().single();

    return { success: !error, error, income: txn ? { ...data, id: txn.id, createdAt: txn.created_at } : null };
  },

  async deleteIncome(userId: string, incomeId: string) {
    const { error } = await supabase.from('transactions')
      .delete()
      .eq('id', incomeId)
      .eq('user_id', userId);
    return { success: !error, error };
  },

  // --- Accounts (accounts table) ---
  async getAccounts(userId: string) {
    const { data, error } = await supabase.from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    return {
      success: !error,
      accounts: (data || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.current_balance,
        openingBalance: a.opening_balance,
        minBuffer: a.min_buffer,
        createdAt: a.created_at,
        currency: a.currency_code || 'INR'
      }))
    };
  },

  async createTransfer(userId: string, data: {
    sourceId: string;
    destinationId: string;
    amount: number;
    description: string;
    date: string;
  }) {
    const payload = {
      user_id: userId,
      type: 'transfer',
      amount: data.amount,
      txn_date: data.date,
      note: data.description,
      account_id: data.sourceId,
      to_account_id: data.destinationId,
      currency_code: 'INR',
      tags: ['transfer']
    };

    const { data: txn, error } = await supabase.from('transactions')
      .insert([payload])
      .select().single();

    return { success: !error, transaction: txn };
  },

  async createAccount(userId: string, data: any) {
    const payload = {
      user_id: userId,
      name: data.name,
      type: data.type || 'bank',
      currency_code: data.currency || 'INR',
      opening_balance: data.balance || 0,
      current_balance: 0, // Will be updated by ledger entry trigger
      min_buffer: data.minBuffer || 500,
      is_active: true
    };

    const { data: account, error } = await supabase.from('accounts')
      .insert([payload])
      .select().single();

    if (account && account.opening_balance !== 0) {
      // Create initial ledger entry for opening balance
      await supabase.from('ledger_entries').insert([{
        user_id: userId,
        account_id: account.id,
        direction: 'IN',
        amount: account.opening_balance,
        currency_code: account.currency_code,
        base_amount: account.opening_balance,
        description: 'Opening Balance',
        txn_date: new Date().toISOString().split('T')[0]
      }]);
    }

    return {
      success: !error,
      account: account ? {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.current_balance,
        openingBalance: account.opening_balance,
        minBuffer: account.min_buffer,
        createdAt: account.created_at,
        currency: account.currency_code
      } : null
    };
  },

  async updateAccount(userId: string, accountId: string, data: any) {
    const updates: any = {};
    if (data.name) updates.name = data.name;
    if (data.type) updates.type = data.type;
    if (data.minBuffer !== undefined) updates.min_buffer = data.minBuffer;
    if (data.currency) updates.currency_code = data.currency;
    if (data.isActive !== undefined) updates.is_active = data.isActive;

    // NOTE: current_balance is now ONLY updated via ledger_entries triggers.
    // Manual updates to current_balance are disabled to prevent data drift.

    const { data: account, error } = await supabase.from('accounts')
      .update(updates)
      .eq('id', accountId)
      .eq('user_id', userId)
      .select().single();

    return {
      success: !error,
      account: account ? {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.current_balance,
        openingBalance: account.opening_balance,
        minBuffer: account.min_buffer,
        createdAt: account.created_at,
        currency: account.currency_code
      } : null
    };
  },

  async deleteAccount(userId: string, accountId: string) {
    // Soft delete by marking as inactive
    const { error } = await supabase.from('accounts')
      .update({ is_active: false })
      .eq('id', accountId)
      .eq('user_id', userId);

    return { success: !error };
  },


  // --- Goals (goals table) ---
  async getGoals(userId: string) {
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId);
    const goals = (data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.target_amount,
      currentAmount: g.current_amount,
      currency: g.currency_code,
      deadline: g.deadline,
      category: g.category,
      status: g.status,
      createdAt: g.created_at
    }));
    return { success: !error, goals };
  },

  async createGoal(userId: string, data: any) {
    const payload: any = {
      user_id: userId,
      name: data.name,
      target_amount: data.targetAmount,
      current_amount: data.currentAmount || 0,
      currency_code: data.currency || 'INR',
      deadline: data.deadline,
      category: data.category,
      status: data.status || 'active'
    };

    if (data.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
      payload.id = data.id;
    }

    const { data: goal, error } = await supabase.from('goals')
      .insert([payload])
      .select().single();

    return {
      success: !error,
      goal: goal ? {
        id: goal.id,
        name: goal.name,
        targetAmount: goal.target_amount,
        currentAmount: goal.current_amount,
        currency: goal.currency_code,
        deadline: goal.deadline,
        category: goal.category,
        status: goal.status,
        createdAt: goal.created_at
      } : null
    };
  },

  async updateGoal(userId: string, goalId: string, data: any) {
    const updates: any = {};
    if (data.name) updates.name = data.name;
    if (data.targetAmount !== undefined) updates.target_amount = data.targetAmount;
    if (data.currentAmount !== undefined) updates.current_amount = data.currentAmount;
    if (data.status) updates.status = data.status;
    if (data.deadline) updates.deadline = data.deadline;

    const { data: goal, error } = await supabase.from('goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select().single();

    return {
      success: !error,
      goal: goal ? {
        id: goal.id,
        name: goal.name,
        targetAmount: goal.target_amount,
        currentAmount: goal.current_amount,
        currency: goal.currency_code,
        deadline: goal.deadline,
        category: goal.category,
        status: goal.status,
        createdAt: goal.created_at
      } : null
    };
  },

  async deleteGoal(userId: string, goalId: string) {
    const { error } = await supabase.from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);
    return { success: !error };
  },

  // --- Investments (investments table) ---
  async getInvestments(userId: string) {
    const { data, error } = await supabase.from('investments').select('*').eq('user_id', userId);
    const investments = (data || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      symbol: i.symbol,
      quantity: i.quantity,
      buyPrice: i.buy_price,
      principal: i.principal_amount,
      currentValue: i.current_value,
      currency: i.currency_code,
      startDate: i.start_date,
      purchaseDate: i.start_date,
      accountId: i.account_id,
      status: i.status,
      createdAt: i.created_at
    }));
    return { success: !error, investments };
  },

  async createInvestment(userId: string, data: any) {
    const payload: any = {
      user_id: userId,
      name: data.name,
      type: data.type,
      symbol: data.symbol,
      quantity: data.quantity || 1,
      buy_price: data.buyPrice || data.principal,
      principal_amount: data.principal,
      current_value: data.currentValue || data.principal,
      currency_code: data.currency || 'INR',
      start_date: data.startDate || new Date().toISOString().split('T')[0],
      account_id: data.accountId,
      status: 'active',
      note: data.note
    };

    const { data: inv, error } = await supabase.from('investments')
      .insert([payload])
      .select().single();

    return {
      success: !error,
      investment: inv ? {
        id: inv.id,
        name: inv.name,
        type: inv.type,
        symbol: inv.symbol,
        quantity: inv.quantity,
        buyPrice: inv.buy_price,
        principal: inv.principal_amount,
        currentValue: inv.current_value,
        currency: inv.currency_code,
        startDate: inv.start_date,
        purchaseDate: inv.start_date,
        createdAt: inv.created_at
      } : null
    };
  },

  async updateInvestment(userId: string, invId: string, data: any) {
    const updates: any = {};
    if (data.name) updates.name = data.name;
    if (data.type) updates.type = data.type;
    if (data.symbol) updates.symbol = data.symbol;
    if (data.quantity !== undefined) updates.quantity = data.quantity;
    if (data.buyPrice !== undefined) updates.buy_price = data.buyPrice;
    if (data.principal !== undefined) updates.principal_amount = data.principal;
    if (data.currentValue !== undefined) updates.current_value = data.currentValue;
    if (data.status) updates.status = data.status;

    const { data: inv, error } = await supabase.from('investments')
      .update(updates)
      .eq('id', invId)
      .eq('user_id', userId)
      .select().single();

    return {
      success: !error,
      investment: inv ? {
        id: inv.id,
        name: inv.name,
        type: inv.type,
        symbol: inv.symbol,
        quantity: inv.quantity,
        buyPrice: inv.buy_price,
        principal: inv.principal_amount,
        currentValue: inv.current_value,
        currency: inv.currency_code,
        startDate: inv.start_date,
        purchaseDate: inv.start_date,
        createdAt: inv.created_at
      } : null
    };
  },

  async deleteInvestment(userId: string, invId: string) {
    const { error } = await supabase.from('investments')
      .delete()
      .eq('id', invId)
      .eq('user_id', userId);
    return { success: !error };
  },

  // --- Liabilities (loans table) ---
  async getLiabilities(userId: string) {
    const { data, error } = await supabase.from('loans').select('*').eq('user_id', userId);
    const liabilities = (data || []).map((l: any) => ({
      id: l.id,
      name: l.person_name,
      type: l.type === 'borrowed' ? 'personal_loan' : 'other',
      direction: l.type,
      principal: l.principal,
      outstanding: l.principal, // Note: Snapshot-based for now
      interestRate: 0,
      emiAmount: 0,
      startDate: l.start_date,
      accountId: l.account_id,
      tenure: 0,
      createdAt: l.created_at,
      note: l.note
    }));
    return { success: !error, liabilities };
  },

  async createLiability(userId: string, data: any) {
    const { data: loan, error } = await supabase.from('loans').insert([{
      user_id: userId,
      type: data.direction || 'borrowed',
      person_name: data.name,
      principal: data.principal,
      currency_code: data.currency || 'INR',
      start_date: data.startDate || new Date().toISOString().split('T')[0],
      account_id: data.accountId,
      status: 'active',
      note: data.note
    }]).select().single();

    return {
      success: !error,
      liability: loan ? {
        ...data,
        id: loan.id,
        createdAt: loan.created_at
      } : null
    };
  },

  async updateLiability(userId: string, liabilityId: string, data: any) {
    const updates: any = {};
    if (data.name) updates.person_name = data.name;
    if (data.principal !== undefined) updates.principal = data.principal;
    if (data.status) updates.status = data.status;
    if (data.note) updates.note = data.note;

    const { data: loan, error } = await supabase.from('loans')
      .update(updates)
      .eq('id', liabilityId)
      .eq('user_id', userId)
      .select().single();

    return { success: !error, liability: loan };
  },

  async deleteLiability(userId: string, liabilityId: string) {
    const { error } = await supabase.from('loans')
      .delete()
      .eq('id', liabilityId)
      .eq('user_id', userId);
    return { success: !error };
  },

  // --- Recurring (subscriptions table) ---
  async getRecurring(userId: string) {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId);
    const recurring = (data || []).map((s: any) => ({
      id: s.id,
      type: s.type || 'expense',
      name: s.name,
      description: s.type === 'income' ? undefined : s.name,
      source: s.type === 'income' ? s.name : undefined,
      amount: s.amount,
      frequency: s.frequency,
      interval: s.interval,
      startDate: s.start_date,
      endDate: s.end_date,
      accountId: s.account_id,
      createdAt: s.created_at,
      lastGeneratedDate: s.last_generated_date,
      tags: s.tags || [],
      dueDay: s.due_day,
      kind: s.kind,
      reminderEnabled: s.reminder_enabled,
      categoryId: s.category_id,
      isMandateSuggested: s.is_mandate_suggested,
      mandateStatus: s.mandate_status,
    }));
    return { success: !error, recurring };
  },

  async createRecurring(userId: string, data: any) {
    const payload: any = {
      user_id: userId,
      type: data.type || 'expense',
      name: data.description || data.source || data.name || 'Recurring Transaction',
      amount: data.amount,
      currency_code: data.currency || 'INR',
      account_id: data.accountId,
      frequency: data.frequency || 'monthly',
      start_date: data.startDate,
      end_date: data.endDate || null,
      status: 'active',
      due_day: data.dueDay || (data.startDate ? new Date(data.startDate).getDate() : null),
      last_generated_date: data.lastGeneratedDate || null,
      interval: data.interval || 1,
      tags: data.tags || [],
      category_id: data.categoryId,
      kind: data.kind || (data.type === 'income' ? 'income' : 'subscription'),
      reminder_enabled: data.reminderEnabled ?? true,
      is_mandate_suggested: data.isMandateSuggested,
      mandate_status: data.mandateStatus || 'offered'
    };

    const { data: sub, error } = await supabase.from('subscriptions')
      .insert([payload])
      .select().single();

    if (error) console.error("Create recurring error:", error);

    const mappedSub = sub ? {
      id: sub.id,
      type: sub.type,
      name: sub.name,
      description: sub.type === 'income' ? undefined : sub.name,
      source: sub.type === 'income' ? sub.name : undefined,
      amount: sub.amount,
      frequency: sub.frequency,
      interval: sub.interval,
      startDate: sub.start_date,
      endDate: sub.end_date,
      accountId: sub.account_id,
      createdAt: sub.created_at,
      lastGeneratedDate: sub.last_generated_date,
      tags: sub.tags || [],
      dueDay: sub.due_day,
      kind: sub.kind,
      reminderEnabled: sub.reminder_enabled,
      categoryId: sub.category_id,
      isMandateSuggested: sub.is_mandate_suggested,
      mandateStatus: sub.mandate_status
    } : null;

    return { success: !error, recurring: mappedSub };
  },

  async updateRecurring(userId: string, ruleId: string, updates: any) {
    const dbUpdates: any = {};
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.description || updates.name || updates.source) {
      dbUpdates.name = updates.description || updates.name || updates.source;
    }
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.frequency) dbUpdates.frequency = updates.frequency;
    if (updates.startDate) dbUpdates.start_date = updates.startDate;
    if (updates.endDate) dbUpdates.end_date = updates.endDate;
    if (updates.accountId) dbUpdates.account_id = updates.accountId;
    if (updates.lastGeneratedDate !== undefined) dbUpdates.last_generated_date = updates.lastGeneratedDate;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.interval) dbUpdates.interval = updates.interval;
    if (updates.tags) dbUpdates.tags = updates.tags;
    if (updates.dueDay) dbUpdates.due_day = updates.dueDay;
    if (updates.categoryId) dbUpdates.category_id = updates.categoryId;
    if (updates.kind) dbUpdates.kind = updates.kind;
    if (updates.reminderEnabled !== undefined) dbUpdates.reminder_enabled = updates.reminderEnabled;
    if (updates.isMandateSuggested !== undefined) dbUpdates.is_mandate_suggested = updates.isMandateSuggested;
    if (updates.mandateStatus) dbUpdates.mandate_status = updates.mandateStatus;

    const { data: sub, error } = await supabase.from('subscriptions')
      .update(dbUpdates)
      .eq('id', ruleId)
      .eq('user_id', userId)
      .select().single();

    const mappedSub = sub ? {
      id: sub.id,
      type: sub.type,
      name: sub.name,
      description: sub.type === 'income' ? undefined : sub.name,
      source: sub.type === 'income' ? sub.name : undefined,
      amount: sub.amount,
      frequency: sub.frequency,
      interval: sub.interval,
      startDate: sub.start_date,
      endDate: sub.end_date,
      accountId: sub.account_id,
      createdAt: sub.created_at,
      lastGeneratedDate: sub.last_generated_date,
      tags: sub.tags || [],
      dueDay: sub.due_day,
      kind: sub.kind,
      reminderEnabled: sub.reminder_enabled,
      categoryId: sub.category_id,
      isMandateSuggested: sub.is_mandate_suggested,
      mandateStatus: sub.mandate_status
    } : null;

    return { success: !error, recurring: mappedSub };
  },

  async deleteRecurring(userId: string, ruleId: string) {
    const { error } = await supabase.from('subscriptions')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', userId);
    return { success: !error };
  },

  async processRecurring(userId: string) {
    // This is called on load to run backfills
    try {
      const { recurringService } = await import('@/features/recurringEngine/service');
      await recurringService.backfillAll(userId);
      return { success: true };
    } catch (error) {
      console.error("Backfill on load failed", error);
      return { success: false };
    }
  },

  async getSubscriptionSpend(userId: string, subscriptionId: string) {
    const { data, error } = await supabase.from('transactions')
      .select('base_amount')
      .eq('user_id', userId)
      .eq('entity_kind', 'subscription')
      .eq('entity_id', subscriptionId);

    if (error) {
      console.error("Failed to get subscription spend:", error);
      return { success: false, total: 0 };
    }

    const total = (data || []).reduce((sum: number, t: any) => sum + (Number(t.base_amount) || 0), 0);
    return { success: true, total };
  },

  // --- Debts (ious table) ---
  async getDebts(userId: string) {
    const { data, error } = await supabase.from('ious').select('*').eq('user_id', userId);
    const debts = (data || []).map((d: any) => ({
      id: d.id,
      personName: d.person_name,
      amount: d.principal_amount,
      outstanding: d.outstanding_amount,
      type: d.direction === 'IN' ? 'lent' : 'borrowed', // IN means money we will get back (lent)
      date: d.due_date,
      accountId: d.account_id,
      status: d.status === 'OPEN' ? 'pending' : 'settled',
      tags: d.contact_tag ? [d.contact_tag] : [],
      notes: d.notes,
      createdAt: d.created_at
    }));
    return { success: !error, debts };
  },

  async createDebt(userId: string, data: any) {
    const { data: debt, error } = await supabase.from('ious').insert([{
      user_id: userId,
      direction: data.type === 'lent' ? 'IN' : 'OUT',
      person_name: data.personName || data.name,
      principal_amount: data.amount,
      outstanding_amount: data.amount,
      due_date: data.date || data.dueDate,
      account_id: data.accountId,
      status: 'OPEN',
      notes: data.description || data.note || data.notes,
      contact_phone: data.phone
    }]).select().single();

    return {
      success: !error,
      debt: debt ? {
        id: debt.id,
        personName: debt.person_name,
        amount: debt.principal_amount,
        outstanding: debt.outstanding_amount,
        type: data.type,
        date: debt.due_date,
        status: 'pending',
        createdAt: debt.created_at
      } : null
    };
  },

  async updateDebt(userId: string, debtId: string, updates: any) {
    const payload: any = {};
    if (updates.status === 'settled') payload.status = 'PAID';
    if (updates.amount) {
      payload.principal_amount = updates.amount;
      payload.outstanding_amount = updates.amount;
    }
    if (updates.personName) payload.person_name = updates.personName;
    if (updates.date) payload.due_date = updates.date;

    const { data: debt, error } = await supabase.from('ious')
      .update(payload)
      .eq('id', debtId)
      .eq('user_id', userId)
      .select().single();

    return {
      success: !error,
      debt: debt ? {
        id: debt.id,
        personName: debt.person_name,
        amount: debt.principal_amount,
        outstanding: debt.outstanding_amount,
        status: debt.status === 'PAID' ? 'settled' : 'pending'
      } : null
    };
  },

  async deleteDebt(userId: string, debtId: string) {
    const { error } = await supabase.from('ious')
      .delete()
      .eq('id', debtId)
      .eq('user_id', userId);
    return { success: !error };
  },

  // AI & Others
  async categorize(description: string) {
    console.log("Categorizing", description);
    return { category: 'Other' };
  },
  async chat() { return { message: "AI Offline" }; },
  async getDashboardFeedback() { return { feedback: "No feedback" }; },
  async getExchangeRates() { return { rates: { INR: 1, USD: 0.012 } }; },
};
