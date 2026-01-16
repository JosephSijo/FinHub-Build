import { RecurringTransaction } from '../../types';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurringRule extends RecurringTransaction {
    interval?: number;     // e.g., 1 (default), 2 (every 2 weeks)
    dayOfMonth?: number;   // 1-31 (clamped)
    weekday?: number;      // 0-6 (Sunday-Saturday)
    nthWeek?: number;      // 1-4, -1 (last week)
    lastGeneratedDate?: string; // ISO date string (YYYY-MM-DD)
}

export interface GeneratedOccurrence {
    recurringId: string;
    date: string; // ISO date YYYY-MM-DD
    amount: number;
    description: string;
    category: string;
    accountId: string;
    type: 'expense' | 'income';
    tags: string[];
    goalId?: string;
    investmentId?: string;
    liabilityId?: string;
}
