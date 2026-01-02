/* eslint-disable react/forbid-component-props, react/forbid-dom-props */
import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Pencil, Trash2, Plus, Target, DollarSign, Wallet } from 'lucide-react';
import { Goal, Account } from '../types';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/numberFormat';

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
    targetAmount: 0,
    currentAmount: 0,
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
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate || '',
        emoji: goal.emoji || '🎯'
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
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
      targetAmount: formData.targetAmount,
      currentAmount: formData.currentAmount,
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

    toast.success(`Added ${formatCurrency(amount, currency)} to ${selectedGoal.name}!`);
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
    <div className="space-y-6 pb-20">
      {/* Goal Allocation Summary Card (Segmented Stack Pattern) */}
      <div className="segmented-stack">
        {/* stack-cap */}
        <div className="stack-cap">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#30D158]/10 rounded-xl flex items-center justify-center border border-[#30D158]/20">
              <Target className="w-5 h-5 text-[#30D158]" />
            </div>
            <div>
              <p className="text-label text-[10px]">Capital Accumulation</p>
              <h3 className="text-balance text-lg text-slate-100">
                {formatCurrency(totalGoalAllocated, currency)}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-label text-[10px] opacity-60">Active Targets</p>
            <p className="text-balance text-sm text-[#30D158]">
              {activeGoalsCount} <span className="text-[10px] opacity-60 uppercase font-black tracking-widest">Milestones</span>
            </p>
          </div>
        </div>

        {/* stack-body */}
        <div className="stack-body py-4 px-6">
          {/* Recent Goal Activity */}
          {goalTransactions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-label text-[8px] opacity-50 uppercase font-black tracking-widest mb-3">Audit Trail</p>
              {goalTransactions.map((transaction: any, idx) => {
                const isExpense = 'description' in transaction;
                return (
                  <div key={`${transaction.id || idx}-${idx}`} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-2 -mx-2 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">
                        {isExpense ? transaction.description : transaction.source}
                      </p>
                      <p className="text-label text-[8px] mt-0.5 opacity-50">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-balance text-xs font-bold ${isExpense ? 'text-[#FF453A]' : 'text-[#30D158]'}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(transaction.amount, currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">No recent goal movements</p>
            </div>
          )}
        </div>

        {/* stack-footer */}
        <div className="stack-footer">
          <Button
            variant="ghost"
            onClick={() => {
              if ((window as any).showFundAllocation) {
                (window as any).showFundAllocation('goal');
              }
            }}
            className="w-full h-10 text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-white/5 flex items-center justify-center transition-all bg-black/20"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Allocate Excess Capital to Goals
          </Button>
        </div>
      </div>

      {/* Header & Actions - Aligned with Growth Tab design */}
      <div className="flex items-center justify-between px-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight truncate">Saving Milestones</h2>
          <p className="text-xs text-slate-500 mt-1 truncate">Track progress toward long-term targets</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-[#0A84FF] hover:bg-[#007AFF] text-white rounded-xl h-12 px-6 border-none shadow-lg shadow-blue-600/10 flex items-center gap-2 group transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="font-bold hidden sm:inline">New Goal</span>
          <span className="font-bold sm:hidden">Add</span>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#1C1C1E] border-[#38383A] text-white p-8 custom-scrollbar">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
            <DialogDescription>
              Set a savings goal and track your progress
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <Label className="text-label text-[10px] mb-3 block">Select Emoji</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                {emojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, emoji })}
                    className={`text-2xl sm:text-3xl p-3 rounded-2xl border transition-all ${formData.emoji === emoji
                      ? 'border-[#0A84FF] bg-[#0A84FF]/10 scale-105'
                      : 'border-[#38383A] bg-[#2C2C2E] hover:border-[#8E8E93]'
                      }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="goal-name" className="text-label text-[10px] mb-3 block">Goal Name</Label>
              <Input
                id="goal-name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white placeholder:text-slate-600 focus:border-[#0A84FF]/50 transition-colors"
                placeholder="e.g., Vacation Fund, Emergency Fund"
                required
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetAmount" className="text-label text-[10px] mb-3 block">Target Amount</Label>
                <NumberInput
                  id="targetAmount"
                  name="targetAmount"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(val: string) => setFormData({ ...formData, targetAmount: parseFloat(val) || 0 })}
                  className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white"
                  placeholder="0.00"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor="currentAmount" className="text-label text-[10px] mb-3 block">Current Amount</Label>
                <NumberInput
                  id="currentAmount"
                  name="currentAmount"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(val: string) => setFormData({ ...formData, currentAmount: parseFloat(val) || 0 })}
                  className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white"
                  placeholder="0.00"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="targetDate" className="text-label text-[10px] mb-3 block">Target Date</Label>
              <Input
                id="targetDate"
                name="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white"
                required
              />
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 h-12 rounded-xl border-[#38383A] text-slate-400 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-xl bg-[#0A84FF] hover:bg-[#007AFF] text-white border-none shadow-lg shadow-blue-600/10"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {goals.length === 0 ? (
        <div
          onClick={() => handleOpenDialog()}
          className="group cursor-pointer p-12 bg-slate-800/10 border-2 border-dashed border-slate-700/30 rounded-[32px] hover:border-slate-600/50 hover:bg-slate-800/20 transition-all duration-300 flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5 opacity-50 group-hover:scale-105 transition-transform">
            <Target className="w-8 h-8 text-slate-500" />
          </div>
          <div className="text-center">
            <h3 className="text-slate-200 font-bold text-lg">No goals tracked yet. Want to see your future here?</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-2 font-black">Tap to Define Savings Target</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, idx) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const isCompleted = progress >= 100;
            const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const progressStyle = { '--progress-width': `${Math.min(100, progress)}%` } as React.CSSProperties;

            return (
              <Card key={`${goal.id}-${idx}`} className={`p-6 bg-[#1C1C1E] border-white/5 rounded-[28px] border hover:bg-[#2C2C2E] transition-all duration-300 group ${isCompleted ? 'ring-2 ring-[#30D158]/20' : ''}`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-800 border border-white/5 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform text-3xl">
                      {goal.emoji}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-100 truncate">
                        {goal.name || 'Unnamed Goal'}
                      </h3>
                      {isCompleted ? (
                        <p className="text-label text-[8px] text-[#30D158] mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
                          Target Reached
                        </p>
                      ) : (
                        <p className={`text-label text-[8px] mt-1 ${daysLeft > 0 ? 'text-[#8E8E93]' : 'text-[#FF453A]'}`}>
                          {daysLeft > 0 ? `${daysLeft} days remaining` : 'Schedule Slip'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(goal)}
                      className="w-8 h-8 p-0 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 text-slate-500"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteGoal(goal.id)}
                      className="w-8 h-8 p-0 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 text-slate-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-label text-[8px] opacity-60 mb-0.5">Funded</span>
                      <span className="text-balance text-lg text-slate-100 leading-none">
                        {formatCurrency(goal.currentAmount, currency)}
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-label text-[8px] opacity-60 mb-0.5">Target</span>
                      <span className="text-balance text-xs text-[#8E8E93] leading-none">
                        {formatCurrency(goal.targetAmount, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="relative h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                    {(() => {
                      const barProps = { style: progressStyle };
                      return (
                        <div
                          className={`h-full rounded-full transition-all duration-1000 w-[var(--progress-width)] ${isCompleted ? 'bg-[#30D158] shadow-[0_0_10px_rgba(48,209,88,0.3)]' : 'bg-[#0A84FF] shadow-[0_0_10px_rgba(10,132,255,0.3)]'
                            }`}
                          {...barProps}
                        />
                      );
                    })()}
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className={isCompleted ? 'text-emerald-500' : 'text-blue-500'}>
                      {Math.min(100, progress).toFixed(0)}% Progress
                    </span>
                    <span className="text-slate-600">
                      {goal.targetDate ? `By ${new Date(goal.targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` : ''}
                    </span>
                  </div>
                </div>

                {!isCompleted && (
                  <Button
                    onClick={() => handleOpenFundsDialog(goal)}
                    className="w-full bg-[#30D158]/10 hover:bg-[#30D158] text-[#30D158] hover:text-white border border-[#30D158]/20 hover:border-[#30D158] rounded-xl font-bold py-6 transition-all"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Capitalize
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Funds Dialog */}
      <Dialog open={isFundsDialogOpen} onOpenChange={setIsFundsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#1C1C1E] border-[#38383A] text-white p-8 custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Add Funds to {selectedGoal?.name}</DialogTitle>
            <DialogDescription>
              Contribute to your savings goal
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFunds} className="space-y-6 mt-6">
            <div>
              <Label htmlFor="fund-amount" className="text-label text-[10px] mb-3 flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-[#30D158]" />
                Contribution Amount
              </Label>
              <Input
                id="fund-amount"
                name="amount"
                type="number"
                step="0.01"
                value={fundsData.amount}
                onChange={(e) => setFundsData({ ...fundsData, amount: e.target.value })}
                placeholder="0.00"
                className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white text-lg placeholder:text-slate-600"
                required
                autoFocus
                autoComplete="off"
              />
              <p className="text-[10px] text-slate-500 mt-2 italic px-1">
                {formatCurrency(fundsData.amount || 0, currency)} will be added to your milestone
              </p>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 bg-[#2C2C2E] p-4 rounded-xl border border-[#38383A]">
                  <Checkbox
                    id="deduct"
                    checked={fundsData.deductFromAccount}
                    onCheckedChange={(checked: boolean) =>
                      setFundsData({ ...fundsData, deductFromAccount: checked })
                    }
                    className="border-slate-500 data-[state=checked]:bg-[#30D158] data-[state=checked]:border-[#30D158]"
                  />
                  <Label htmlFor="deduct" className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-500" />
                    Deduct from Liquidity Node
                  </Label>
                </div>

                {fundsData.deductFromAccount && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <Label htmlFor="fund-account" className="text-label text-[10px] mb-3 block">Source Account</Label>
                    <Select
                      value={fundsData.accountId}
                      onValueChange={(value: string) => setFundsData({ ...fundsData, accountId: value })}
                    >
                      <SelectTrigger id="fund-account" name="accountId" className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white">
                        <SelectValue placeholder="Choose account" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1C1C1E] border-[#38383A] text-white">
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{account.icon} {account.name}</span>
                              <span className="text-[10px] text-slate-500 ml-4 font-mono">
                                {formatCurrency(account.balance, currency)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fundsData.accountId && (
                      <p className="text-[10px] text-slate-500 mt-2 italic px-1">
                        Available Liquidity: {formatCurrency(accounts.find(a => a.id === fundsData.accountId)?.balance || 0, currency)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFundsDialogOpen(false)}
                className="flex-1 h-12 rounded-xl border-[#38383A] text-slate-400 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-xl bg-[#30D158] hover:bg-[#28B54C] text-white border-none shadow-lg shadow-green-600/10"
              >
                Capitalize Milestone
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
