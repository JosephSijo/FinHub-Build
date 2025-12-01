import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../utils/api';
import { RecurringTransaction, Account } from '../types';

interface RecurringWidgetProps {
  userId: string;
  accounts: Account[];
  currency: string;
  onNavigate: () => void;
}

export function RecurringWidget({ userId, accounts, currency, onNavigate }: RecurringWidgetProps) {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecurring();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadRecurring = async () => {
    try {
      const response = await api.getRecurring(userId);
      if (response.success) {
        setRecurring(response.recurring || []);
      }
    } catch (error) {
      console.error('Error loading recurring transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyAmount = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'daily': return amount * 30;
      case 'weekly': return amount * 4;
      case 'monthly': return amount;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  };

  const totalMonthlyExpenses = recurring
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + getMonthlyAmount(r.amount, r.frequency), 0);

  const totalMonthlyIncome = recurring
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + getMonthlyAmount(r.amount, r.frequency), 0);

  const subscriptions = recurring.filter(r => 
    r.type === 'expense' && 
    (r.description?.toLowerCase().includes('subscription') ||
     r.description?.toLowerCase().includes('netflix') ||
     r.description?.toLowerCase().includes('spotify') ||
     r.description?.toLowerCase().includes('prime') ||
     r.description?.toLowerCase().includes('gym'))
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (recurring.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="mb-2">Recurring Transactions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              No recurring transactions yet. Set up subscriptions, salary, or recurring bills.
            </p>
            <Button size="sm" variant="outline" onClick={onNavigate}>
              Set Up Recurring
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <h3>Recurring & Subscriptions</h3>
        </div>
        <Button size="sm" variant="ghost" onClick={onNavigate}>
          View All
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly Out</p>
          <p className="text-red-600">
            {currency === 'INR' ? '₹' : '$'}{totalMonthlyExpenses.toFixed(0)}
          </p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly In</p>
          <p className="text-green-600">
            {currency === 'INR' ? '₹' : '$'}{totalMonthlyIncome.toFixed(0)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Recurring</span>
          <span>{recurring.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Subscriptions</span>
          <span>{subscriptions.length}</span>
        </div>
        {totalMonthlyIncome > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Net Monthly</span>
            <span className={totalMonthlyIncome - totalMonthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}>
              {totalMonthlyIncome - totalMonthlyExpenses >= 0 ? '+' : ''}
              {currency === 'INR' ? '₹' : '$'}
              {(totalMonthlyIncome - totalMonthlyExpenses).toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {totalMonthlyExpenses > totalMonthlyIncome && totalMonthlyIncome > 0 && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-900 dark:text-yellow-100">
            Your recurring expenses exceed income. Consider reviewing subscriptions.
          </p>
        </div>
      )}
    </Card>
  );
}
