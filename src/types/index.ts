export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'cash' | 'investment';
  balance: number;
  color: string;
  icon: string;
  createdAt: string;
  // Credit Card Specific
  creditLimit?: number;
  safeLimitPercentage?: number; // e.g., 30 for 30%
  serviceChargePercentage?: number; // e.g., 2.5 for 2.5%
  statementDate?: number; // Day of month 1-31
}

// Core transaction types
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  tags: string[];
  accountId: string;
  isRecurring?: boolean;
  recurringId?: string;
  endDate?: string;
  createdAt: string;
  // Credit Card Justification
  isIncomeGenerating?: boolean;
  justification?: string;
  serviceChargeAmount?: number;
  isInternalTransfer?: boolean;
  liabilityId?: string;
  investmentId?: string;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
  tags: string[];
  accountId: string;
  isRecurring?: boolean;
  recurringId?: string;
  endDate?: string;
  createdAt: string;
  isInternalTransfer?: boolean;
  liabilityId?: string;
  investmentId?: string;
}

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  type: 'borrowed' | 'lent';
  date: string;
  status: 'pending' | 'settled';
  tags: string[];
  accountId: string;
  dueDate?: string;
  interestRate?: number; // Added for Tier 0 Wealth Leaks
  recurringId?: string;
  createdAt: string;
}

export type GoalType = 'growth' | 'stability' | 'protection' | 'other';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  emoji: string;
  type?: GoalType; // Defaults to 'growth' if undefined
  status?: 'active' | 'completed' | 'leaking'; // Defaults to 'active'
  monthly_contribution?: number;
  is_discretionary?: boolean;
  startDate?: string;
  accountId?: string;
  createdAt: string;
}

// User settings
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR';
  unlockedAchievements: string[];
  name: string;
  photoURL: string;
  notificationsEnabled: boolean;
  roundUpEnabled: boolean;
  passiveIncomeTarget?: number;
  isSampleMode?: boolean;
  apiKeys?: {
    openai?: string;
    anthropic?: string;
    gemini?: string;
    deepseek?: string;
    perplexity?: string;
  };
  aiProvider?: string;
}

// AI Context
export interface AIContext {
  totalIncome: number;
  totalExpenses: number;
  activeDebts: number;
  goalsCount: number;
  recentTransactions: any[];
  expenses: Expense[];
  currentMonthExpenses: Expense[];
  incomes: Income[];
  accounts: Account[];
  investments: Investment[];
  liabilities: Liability[];
  goals: Goal[];
  debts: Debt[];
  savingsRate: number;
  healthScore: number;
  brainSummary?: string;
  userName?: string;
  currency?: string;
}

// Categories for Money Out
export const MONEY_OUT_CATEGORIES = [
  { value: 'Food & Dining', emoji: '🍔' },
  { value: 'Transport', emoji: '🚗' },
  { value: 'Shopping', emoji: '🛍️' },
  { value: 'Entertainment', emoji: '🎬' },
  { value: 'Bills & Utilities', emoji: '📱' },
  { value: 'Healthcare', emoji: '🏥' },
  { value: 'Education', emoji: '📚' },
  { value: 'Travel', emoji: '✈️' },
  { value: 'Groceries', emoji: '🛒' },
  { value: 'Personal Care', emoji: '💅' },
  { value: 'EMI', emoji: '🏦' },
  { value: 'Subscription', emoji: '📺' },
  { value: 'Personal IOU', emoji: '🤝' },
  { value: 'Transfer', emoji: '🔄' },
  { value: 'Insurance', emoji: '🛡️' }, // Added for Tier 1 Vital Security
  { value: 'Other', emoji: '📦' }
];

// Legacy export for backwards compatibility
export const EXPENSE_CATEGORIES = MONEY_OUT_CATEGORIES;

// Sources for Money In
export const MONEY_IN_SOURCES = [
  { value: 'Salary', emoji: '💼' },
  { value: 'Freelance', emoji: '💻' },
  { value: 'Investment', emoji: '📈' },
  { value: 'Gift', emoji: '🎁' },
  { value: 'Transfer', emoji: '🔄' },
  { value: 'Other', emoji: '💰' }
];

// Legacy export for backwards compatibility
export const INCOME_SOURCES = MONEY_IN_SOURCES;

// Account colors and icons
export const ACCOUNT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export const ACCOUNT_ICONS = [
  { value: '🏦', label: 'Bank' },
  { value: '💳', label: 'Card' },
  { value: '💰', label: 'Cash' },
  { value: '📱', label: 'Digital' },
  { value: '🏪', label: 'Merchant' },
  { value: '💵', label: 'Money' },
  { value: '🎯', label: 'Target' },
  { value: '⭐', label: 'Star' },
];

// Currency symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SAR: '﷼'
};

// Achievement
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (data: any) => boolean;
}

// Recurring Transaction
export interface RecurringTransaction {
  id: string;
  type: 'expense' | 'income';
  description?: string;
  source?: string;
  amount: number;
  category?: string;
  accountId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customIntervalDays?: number; // For cycles like 28 days
  startDate: string;
  endDate?: string;
  tags: string[];
  goalId?: string;
  investmentId?: string;
  liabilityId?: string;
  kind?: 'subscription' | 'bill' | 'income';
  reminderEnabled?: boolean;
  dueDay?: number;
  createdAt: string;
}

// Investment
export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'mutual_fund' | 'sip' | 'crypto' | 'physical_asset';
  quantity: number;
  buyPrice: number;
  currentPrice?: number;
  totalYield?: number; // Dividends, Interest, or extra generated cash
  isPhysicalAsset?: boolean;
  accountId?: string; // ID of the holding account (for Source Independence)
  purchaseDate: string;
  expected_return?: number; // annual percentage, e.g. 0.12
  currency: string;
  createdAt: string;
}

// Liability
export interface Liability {
  id: string;
  name: string;
  type: 'home_loan' | 'car_loan' | 'personal_loan' | 'credit_card' | 'education_loan' | 'other';
  principal: number;
  outstanding: number;
  interestRate: number; // nominal APR
  emiAmount: number;
  startDate: string;
  tenure: number; // in months
  accountId?: string;
  // Strategic Fields
  apr_nominal?: number;
  effective_rate?: number;
  min_payment?: number;
  penalty_applied?: boolean;
  next_due_date?: string;
  kind?: 'subscription' | 'bill' | 'income';
  reminderEnabled?: boolean;
  dueDay?: number;
  createdAt: string;
}

// Notification
export interface Notification {
  id: string;
  type: 'achievement' | 'goal' | 'alert' | 'insight' | 'reminder';
  priority: 'high' | 'medium' | 'low';
  category: 'reminders' | 'transactions' | 'achievements' | 'insights';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  achievementId?: string;
  action?: {
    type: 'verify_subscription';
    label?: string;
    payload: {
      id?: string;
      description: string;
      amount: number;
      category: string;
      accountId: string;
      date?: string;
    };
    status: 'pending' | 'completed' | 'dismissed';
  };
}

export interface AuthUser {
  id: string;
  mobile: string;
  name: string;
}

export interface FinanceContextType {
  // State
  userId: string;
  settings: UserSettings;
  currency: string;
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
  updateRecurringTransaction: (id: string, data: any) => Promise<void>;
  createRecurring: (data: any) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  processRecurringTransactions: () => Promise<void>;

  setEmergencyFundAmount: (amount: number | ((prev: number) => number)) => void;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;

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
  clearAllData: () => void;

  // Backfill Logic
  backfillRequest: { count: number; dates: Date[]; recurring: any } | null;
  setBackfillRequest: React.Dispatch<React.SetStateAction<{ count: number; dates: Date[]; recurring: any } | null>>;
  executeBackfill: () => Promise<void>;
}
