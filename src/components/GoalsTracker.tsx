import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { Pencil, Trash2, Plus, Target, DollarSign, Wallet, Shield } from 'lucide-react';
import { Goal, CURRENCY_SYMBOLS, Account } from '../types';
import { toast } from 'sonner@2.0.3';

interface GoalsTrackerProps {
  goals: Goal[];
  currency: string;
  accounts?: Account[];
  expenses?: any[];
  incomes?: any[];
  onCreateGoal: (data: Omit<Goal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (goalId: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (goalId: string) => void;
  onDeductFromAccount?: (accountId: string, amount: number) => void;
}

export const GoalsTracker: React.FC<GoalsTrackerProps> = ({
  goals,
  currency,
  accounts = [],
  expenses = [],
  incomes = [],
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onDeductFromAccount
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFundsDialogOpen, setIsFundsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    emoji: '🎯'
  });
  const [fundsData, setFundsData] = useState({
    amount: '',
    accountId: '',
    deductFromAccount: false
  });

  const emojis = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💍', '🏖️', '🎸', '📷', '⌚'];

  const handleOpenDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        currentAmount: goal.currentAmount.toString(),
        targetDate: goal.targetDate,
        emoji: goal.emoji
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: '',
        emoji: '🎯'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount),
      targetDate: formData.targetDate,
      emoji: formData.emoji
    };

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, data);
    } else {
      onCreateGoal(data);
    }

    setIsDialogOpen(false);
  };

  const handleOpenFundsDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setFundsData({
      amount: '',
      accountId: accounts.length > 0 ? accounts[0].id : '',
      deductFromAccount: false
    });
    setIsFundsDialogOpen(true);
  };

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGoal) return;
    
    const amount = parseFloat(fundsData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Check if deducting from account
    if (fundsData.deductFromAccount && fundsData.accountId) {
      const selectedAccount = accounts.find(a => a.id === fundsData.accountId);
      if (selectedAccount && selectedAccount.balance < amount) {
        toast.error('Insufficient balance in selected account');
        return;
      }
      
      // Deduct from account
      if (onDeductFromAccount) {
        onDeductFromAccount(fundsData.accountId, amount);
      }
    }

    // Update goal
    onUpdateGoal(selectedGoal.id, {
      currentAmount: selectedGoal.currentAmount + amount
    });

    toast.success(`Added ${CURRENCY_SYMBOLS[currency]}${amount} to ${selectedGoal.name}!`);
    setIsFundsDialogOpen(false);
  };

  // Calculate goal allocations
  const totalGoalAllocated = goals.reduce((sum, g) => sum + (g?.currentAmount || 0), 0);
  const activeGoalsCount = goals.filter(g => g?.currentAmount < g?.targetAmount).length;

  // Get goal-related transactions
  const goalTransactions = [
    ...expenses.filter(e => 
      (e.tags && Array.isArray(e.tags) && e.tags.some((tag: string) => tag?.toLowerCase().includes('goal'))) ||
      (e.description && e.description.toLowerCase().includes('goal'))
    ),
    ...incomes.filter(i => 
      (i.tags && Array.isArray(i.tags) && i.tags.some((tag: string) => tag?.toLowerCase().includes('goal'))) ||
      (i.source && i.source.toLowerCase().includes('goal'))
    )
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Goal Allocation Summary */}
      {goals.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-purple-900 dark:text-purple-100">Goals Fund Allocated</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {activeGoalsCount} active goal{activeGoalsCount !== 1 ? 's' : ''} in progress
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl text-purple-600 dark:text-purple-400">
                {CURRENCY_SYMBOLS[currency]}{totalGoalAllocated.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Total Allocated
              </p>
            </div>
          </div>
          
          {/* Recent Goal Transactions */}
          {goalTransactions.length > 0 && (
            <div className="pt-4 border-t border-purple-200 dark:border-purple-700">
              <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">Recent Goal Transactions:</p>
              <div className="space-y-2">
                {goalTransactions.map((transaction, idx) => {
                  const isExpense = 'description' in transaction;
                  return (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {isExpense ? transaction.description : transaction.source}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className={`text-sm whitespace-nowrap ml-3 ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                        {isExpense ? '-' : '+'}{CURRENCY_SYMBOLS[currency]}{transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2>Savings Goals</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your progress toward financial milestones
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // This will be handled in App.tsx
              if ((window as any).showFundAllocation) {
                (window as any).showFundAllocation('goal');
              }
            }}
            className="gap-2"
          >
            <Target className="w-4 h-4" />
            Allocate Funds
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
              <DialogDescription>
                Set a savings goal and track your progress
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label>Select Emoji</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji })}
                      className={`text-3xl p-2 rounded-lg border-2 transition-all ${
                        formData.emoji === emoji
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-110'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Vacation Fund, Emergency Fund"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currentAmount">Current Amount</Label>
                  <Input
                    id="currentAmount"
                    type="number"
                    step="0.01"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2">No Goals Yet</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Set your first savings goal to start your journey!
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const isCompleted = progress >= 100;
            const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            return (
              <Card key={goal.id} className={`p-6 ${isCompleted ? 'border-green-500 dark:border-green-600' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{goal.emoji}</div>
                    <div>
                      <h3 className="text-lg">{goal.name}</h3>
                      {isCompleted ? (
                        <p className="text-xs text-green-600 dark:text-green-500">✓ Goal Completed!</p>
                      ) : (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(goal)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteGoal(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span>{Math.min(100, progress).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(100, progress)} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">
                      {CURRENCY_SYMBOLS[currency]}{goal.currentAmount.toLocaleString()}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      of {CURRENCY_SYMBOLS[currency]}{goal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {!isCompleted && (
                  <Button
                    onClick={() => handleOpenFundsDialog(goal)}
                    variant="outline"
                    className="w-full bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 hover:from-green-100 hover:to-blue-100 dark:hover:from-green-900/30 dark:hover:to-blue-900/30 border-2 border-green-200 dark:border-green-800"
                    size="sm"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Add Funds
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Funds Dialog */}
      <Dialog open={isFundsDialogOpen} onOpenChange={setIsFundsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Funds to {selectedGoal?.name}</DialogTitle>
            <DialogDescription>
              Contribute to your savings goal
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFunds} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={fundsData.amount}
                onChange={(e) => setFundsData({ ...fundsData, amount: e.target.value })}
                placeholder="Enter amount to add"
                className="text-lg mt-2"
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {CURRENCY_SYMBOLS[currency]}{fundsData.amount || '0'} will be added to your goal
              </p>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deduct"
                    checked={fundsData.deductFromAccount}
                    onCheckedChange={(checked) => 
                      setFundsData({ ...fundsData, deductFromAccount: checked as boolean })
                    }
                  />
                  <Label htmlFor="deduct" className="flex items-center gap-2 cursor-pointer">
                    <Wallet className="w-4 h-4" />
                    Deduct from account balance
                  </Label>
                </div>

                {fundsData.deductFromAccount && (
                  <div>
                    <Label htmlFor="account">Select Account</Label>
                    <Select 
                      value={fundsData.accountId} 
                      onValueChange={(value) => setFundsData({ ...fundsData, accountId: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{account.icon} {account.name}</span>
                              <span className="text-sm text-gray-500 ml-4">
                                {CURRENCY_SYMBOLS[currency]}{account.balance.toFixed(2)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fundsData.accountId && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Available: {CURRENCY_SYMBOLS[currency]}
                        {accounts.find(a => a.id === fundsData.accountId)?.balance.toFixed(2) || '0'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFundsDialogOpen(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Add Funds
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
