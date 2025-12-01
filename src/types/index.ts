// Account types
export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit_card';
  balance: number;
  color: string;
  icon: string;
  createdAt: string;
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
  endDate?: string;
  createdAt: string;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
  tags: string[];
  accountId: string;
  isRecurring?: boolean;
  endDate?: string;
  createdAt: string;
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
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  emoji: string;
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
}

// AI Context
export interface AIContext {
  totalIncome: number;
  totalExpenses: number;
  activeDebts: number;
  goalsCount: number;
  recentTransactions: any[];
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
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  tags: string[];
  createdAt: string;
}

// Investment
export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'mutual_fund' | 'sip' | 'crypto';
  quantity: number;
  buyPrice: number;
  currentPrice?: number;
  purchaseDate: string;
  currency: string;
  createdAt: string;
}

// Notification
export interface Notification {
  id: string;
  type: 'achievement' | 'goal' | 'alert' | 'insight';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  achievementId?: string;
}
