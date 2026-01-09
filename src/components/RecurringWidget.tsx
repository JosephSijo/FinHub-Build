import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../utils/api';
import { RecurringTransaction, Liability } from '../types';
import { formatCurrency } from '../utils/numberFormat';

interface RecurringWidgetProps {
  userId: string;
  liabilities?: Liability[];
  currency: string;
  onNavigate: () => void;
}

export function RecurringWidget({ userId, liabilities = [], currency, onNavigate }: RecurringWidgetProps) {
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

  const totalLiabilityEMI = liabilities.reduce((sum, l) => sum + l.emiAmount, 0);

  const totalMonthlyExpenses = recurring
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + getMonthlyAmount(r.amount, r.frequency), 0) + totalLiabilityEMI;

  const totalMonthlyIncome = recurring
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + getMonthlyAmount(r.amount, r.frequency), 0);

  const subscriptions = recurring.filter(r =>
    r.type === 'expense' &&
    (r.description?.toLowerCase().includes('subscription') ||
      r.description?.toLowerCase().includes('netflix') ||
      r.description?.toLowerCase().includes('spotify') ||
      r.description?.toLowerCase().includes('prime') ||
      r.description?.toLowerCase().includes('google') ||
      r.description?.toLowerCase().includes('youtube') ||
      r.description?.toLowerCase().includes('apple') ||
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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <h3 className="truncate">Recurring & Subscriptions</h3>
        </div>
        <Button size="sm" variant="ghost" onClick={onNavigate}>
          View All
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-destructive/10 rounded-lg min-w-0">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">Monthly Out</p>
          <p className="text-destructive font-bold truncate">
            {formatCurrency(totalMonthlyExpenses, currency)}
          </p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Monthly Income</p>
          <p className="text-success font-bold truncate">
            {formatCurrency(totalMonthlyIncome, currency)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Recurring Bills</span>
          <span>{recurring.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Loan EMIs (Linked)</span>
          <span>{liabilities.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Subscriptions</span>
          <span>{subscriptions.length}</span>
        </div>
        <span className={`block text-right text-sm font-medium pt-2 border-t border-gray-100 dark:border-gray-800 ${totalMonthlyIncome - totalMonthlyExpenses >= 0 ? 'text-[#81C784]' : 'text-[#E57373]'}`}>
          Net: {formatCurrency(totalMonthlyIncome - totalMonthlyExpenses, currency)}
        </span>
      </div>


      {
        totalMonthlyExpenses > totalMonthlyIncome && totalMonthlyIncome > 0 && (
          <div className="mt-3 p-3 bg-[#E57373]/10 rounded-lg flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#E57373] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#E57373]">
              Your recurring expenses exceed income. Consider reviewing subscriptions.
            </p>
          </div>
        )
      }
    </Card >
  );
}
