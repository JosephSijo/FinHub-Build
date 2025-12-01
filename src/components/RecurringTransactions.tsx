import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Plus, Trash2, RefreshCw, Calendar, Sparkles, XCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api } from '../utils/api';
import { RecurringTransaction, Account, MONEY_OUT_CATEGORIES, MONEY_IN_SOURCES } from '../types';

interface RecurringTransactionsProps {
  userId: string;
  accounts: Account[];
  currency: string;
}

export function RecurringTransactions({ userId, accounts, currency }: RecurringTransactionsProps) {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'expense' as 'expense' | 'income',
    description: '',
    source: '',
    amount: '',
    category: '',
    accountId: '',
    frequency: 'monthly' as RecurringTransaction['frequency'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    tags: [] as string[]
  });

  useEffect(() => {
    loadRecurring();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecurring = async () => {
    try {
      const response = await api.getRecurring(userId);
      if (response.success) {
        setRecurring(response.recurring || []);
      }
    } catch (error) {
      console.error('Error loading recurring transactions:', error);
    }
  };

  const handleAddRecurring = async () => {
    try {
      const data: any = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        accountId: formData.accountId,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        tags: formData.tags
      };

      if (formData.type === 'expense') {
        data.description = formData.description;
        data.category = formData.category;
      } else {
        data.source = formData.source;
      }

      const response = await api.createRecurring(userId, data);
      if (response.success) {
        setRecurring([...recurring, response.recurring]);
        setIsAddDialogOpen(false);
        resetForm();
        toast.success('Recurring transaction created!');
      }
    } catch (error) {
      console.error('Error creating recurring transaction:', error);
      toast.error('Failed to create recurring transaction');
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) return;

    try {
      const response = await api.deleteRecurring(userId, id);
      if (response.success) {
        setRecurring(recurring.filter(r => r.id !== id));
        toast.success('Recurring transaction deleted');
      }
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      toast.error('Failed to delete recurring transaction');
    }
  };

  const handleProcessRecurring = async () => {
    setIsProcessing(true);
    try {
      const response = await api.processRecurring(userId);
      if (response.success) {
        toast.success(`Processed ${response.count} recurring transactions!`);
      }
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      toast.error('Failed to process recurring transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseAll = async () => {
    if (!confirm(`Are you sure you want to delete all ${recurring.length} recurring transactions?`)) return;

    try {
      const deletePromises = recurring.map(r => api.deleteRecurring(userId, r.id));
      await Promise.all(deletePromises);
      setRecurring([]);
      toast.success('All recurring transactions deleted!');
    } catch (error) {
      console.error('Error deleting all recurring transactions:', error);
      toast.error('Failed to delete all recurring transactions');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      description: '',
      source: '',
      amount: '',
      category: '',
      accountId: accounts.length > 0 ? accounts[0].id : '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      tags: []
    });
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly'
    };
    return labels[freq] || freq;
  };

  // AI Insights
  const getAIInsights = () => {
    const totalMonthlyExpenses = recurring
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => {
        const monthly = r.frequency === 'monthly' ? r.amount :
                       r.frequency === 'yearly' ? r.amount / 12 :
                       r.frequency === 'weekly' ? r.amount * 4 :
                       r.amount * 30;
        return sum + monthly;
      }, 0);

    const totalMonthlyIncome = recurring
      .filter(r => r.type === 'income')
      .reduce((sum, r) => {
        const monthly = r.frequency === 'monthly' ? r.amount :
                       r.frequency === 'yearly' ? r.amount / 12 :
                       r.frequency === 'weekly' ? r.amount * 4 :
                       r.amount * 30;
        return sum + monthly;
      }, 0);

    const subscriptions = recurring.filter(r => 
      r.type === 'expense' && 
      (r.description?.toLowerCase().includes('subscription') ||
       r.description?.toLowerCase().includes('netflix') ||
       r.description?.toLowerCase().includes('spotify') ||
       r.description?.toLowerCase().includes('prime'))
    );

    const loans = recurring.filter(r =>
      r.type === 'expense' &&
      (r.description?.toLowerCase().includes('loan') ||
       r.description?.toLowerCase().includes('emi') ||
       r.description?.toLowerCase().includes('mortgage'))
    );

    return {
      totalMonthlyExpenses,
      totalMonthlyIncome,
      netMonthly: totalMonthlyIncome - totalMonthlyExpenses,
      subscriptions,
      loans,
      totalRecurring: recurring.length
    };
  };

  const insights = getAIInsights();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recurring Transactions & Subscriptions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage subscriptions, loans, salary and recurring payments
          </p>
        </div>
        <div className="flex gap-2">
          {recurring.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInsights(!showInsights)}
              title="Show AI Insights"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessRecurring}
            disabled={isProcessing || recurring.length === 0}
            title="Process Recurring"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* AI Insights */}
      {showInsights && recurring.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="mb-3">AI Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400">Monthly Expenses</p>
                  <p className="text-red-600 mt-1">
                    {currency === 'INR' ? '₹' : '$'}{insights.totalMonthlyExpenses.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400">Monthly Income</p>
                  <p className="text-green-600 mt-1">
                    {currency === 'INR' ? '₹' : '$'}{insights.totalMonthlyIncome.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400">Net Monthly</p>
                  <p className={insights.netMonthly >= 0 ? 'text-green-600' : 'text-red-600'} style={{ marginTop: '0.25rem' }}>
                    {insights.netMonthly >= 0 ? '+' : ''}{currency === 'INR' ? '₹' : '$'}{insights.netMonthly.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400">Subscriptions</p>
                  <p className="mt-1">{insights.subscriptions.length} active</p>
                </div>
              </div>
              {insights.loans.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    💡 You have {insights.loans.length} active loan{insights.loans.length > 1 ? 's' : ''} or EMI payment{insights.loans.length > 1 ? 's' : ''}.
                  </p>
                </div>
              )}
              {insights.netMonthly < 0 && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-900 dark:text-red-100">
                    ⚠️ Your recurring expenses exceed your recurring income. Consider reviewing your subscriptions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {recurring.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No recurring transactions</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Set up automatic transactions for rent, salary, subscriptions, loans, etc.
          </p>
          <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Recurring Transaction
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Close All ({recurring.length})
            </Button>
          </div>
          <div className="space-y-3">
            {recurring.map((rec) => {
              const account = accounts.find(a => a.id === rec.accountId);
              return (
                <div key={rec.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        rec.type === 'income' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                      }`}>
                        {rec.type === 'income' ? '💰' : '💸'}
                      </div>
                      <div>
                        <h4>{rec.description || rec.source}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getFrequencyLabel(rec.frequency)} • {account?.icon} {account?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={rec.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {rec.type === 'income' ? '+' : '-'}{currency === 'INR' ? '₹' : '$'}{rec.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Since {new Date(rec.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRecurring(rec.id)}
                    className="ml-4"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Recurring Transaction</DialogTitle>
            <DialogDescription>
              Set up automatic transactions that repeat on a schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Money In</SelectItem>
                  <SelectItem value="expense">Money Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{formData.type === 'expense' ? 'Description' : 'Source'}</Label>
              <Input
                value={formData.type === 'expense' ? formData.description : formData.source}
                onChange={(e) => setFormData({
                  ...formData,
                  [formData.type === 'expense' ? 'description' : 'source']: e.target.value
                })}
                placeholder={formData.type === 'expense' ? 'e.g., Netflix Subscription, Home Loan EMI' : 'e.g., Monthly Salary'}
              />
            </div>

            {formData.type === 'expense' && (
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONEY_OUT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <Label>Account</Label>
              <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.icon} {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label>End Date (optional)</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleAddRecurring} 
                className="flex-1"
                disabled={
                  !formData.amount || 
                  (!formData.description && !formData.source) || 
                  !formData.accountId ||
                  (formData.type === 'expense' && !formData.category)
                }
              >
                Add Recurring
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
