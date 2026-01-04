/* eslint-disable react/forbid-component-props, react/forbid-dom-props */
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { CyberButton } from './ui/CyberButton';
import { Checkbox } from './ui/checkbox';
import { Pencil, Trash2, Plus, Target, DollarSign, Wallet } from 'lucide-react';
import { Goal, Account } from '../types';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/numberFormat';
import { MeshBackground } from './ui/MeshBackground';

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
  // - [x] **Goals**: Implement "Emerald Victory" theme.

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
      <div className="mesh-gradient-card sq-2xl overflow-hidden group relative">
        <MeshBackground variant="savings" />
        <div className="bg-transparent p-0 relative z-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leaf.png')] opacity-[0.05] pointer-events-none z-0" />

          {/* stack-cap */}
          <div className="p-6 flex items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 bg-emerald-500/10 sq-md flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.3em]">Victory Node</h3>
                <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest mt-1">
                  Capital Accumulation Drive
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Matured Reserve</p>
              <div className="relative">
                <div className="text-xl font-black text-emerald-400 tabular-nums font-mono">
                  {formatCurrency(totalGoalAllocated, currency)}
                </div>
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl -z-10 animate-pulse" />
              </div>
            </div>
          </div>

          {/* stack-body */}
          <div className="py-4 px-6 relative z-10 border-t border-white/5">
            {goalTransactions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-3 opacity-50">Victory Log</p>
                {goalTransactions.map((transaction: any, idx) => {
                  const isExpense = 'description' in transaction;
                  return (
                    <div key={`${transaction.id || idx}-${idx}`} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-emerald-500/5 transition-colors px-2 -mx-2 rounded-lg group/item">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-300 truncate group-hover/item:text-emerald-400 transition-colors">
                          {isExpense ? transaction.description : transaction.source}
                        </p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5 opacity-50">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className={`text-xs font-black font-mono tabular-nums ${isExpense ? 'text-rose-500' : 'text-emerald-400'}`}>
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
          <div className="p-4 border-t border-white/5 bg-emerald-500/5 relative z-10">
            <Button
              variant="ghost"
              onClick={() => {
                if ((window as any).showFundAllocation) {
                  (window as any).showFundAllocation('goal');
                }
              }}
              className="w-full h-10 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center justify-center transition-all bg-emerald-500/5 sq-md border border-emerald-500/10"
            >
              <Wallet className="w-3.5 h-3.5 mr-2" />
              Inject Surplus Liquidity
            </Button>
          </div>
        </div>
      </div>

      {/* Header & Actions - Aligned with Growth Tab design */}
      <div className="flex items-center justify-between px-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight truncate">Saving Milestones</h2>
          <p className="text-xs text-slate-500 mt-1 truncate">Track progress toward long-term targets</p>
        </div>
        <CyberButton
          onClick={() => handleOpenDialog()}
          icon={Plus}
          className="h-12"
        >
          New Goal
        </CyberButton>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black border-white/5 text-white p-8 custom-scrollbar sq-2xl">
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
                    className={`text-2xl sm:text-3xl p-3 sq-md border transition-all ${formData.emoji === emoji
                      ? 'border-[#0A84FF] bg-[#0A84FF]/10 scale-105'
                      : 'border-white/5 bg-white/5 hover:border-slate-500'
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
                className="bg-black border-white/5 sq-md h-14 text-white placeholder:text-slate-600 focus:border-[#0A84FF]/50 transition-colors"
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
                  className="bg-black border-white/5 sq-md h-14 text-white"
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
                  className="bg-black border-white/5 sq-md h-14 text-white"
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
                className="bg-black border-white/5 sq-md h-14 text-white"
                required
              />
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 h-12 sq-md border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 sq-md bg-[#0A84FF] hover:bg-[#007AFF] text-white border-none shadow-lg shadow-blue-600/10"
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
          className="group cursor-pointer p-12 bg-black border-2 border-dashed border-white/5 sq-2xl hover:border-slate-600/50 hover:bg-white/5 transition-all duration-300 flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-16 h-16 sq-md bg-white/5 flex items-center justify-center border border-white/5 opacity-50 group-hover:scale-105 transition-transform">
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
              <div key={`${goal.id}-${idx}`} className="bg-black sq-xl border border-white/5 p-6 group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.01] group-hover:bg-emerald-500/[0.04] transition-all duration-500" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 border border-white/10 sq-md flex items-center justify-center group-hover:border-emerald-500/30 transition-all duration-500">
                        <span className="text-2xl">{goal.emoji}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-xs uppercase tracking-tight text-white truncate">{goal.name || 'UNNAMED NODE'}</h4>
                        {isCompleted ? (
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            Target Secured
                          </p>
                        ) : (
                          <p className={`text-[11px] font-black uppercase tracking-widest mt-1 ${daysLeft > 0 ? 'text-slate-500' : 'text-rose-500'}`}>
                            {daysLeft > 0 ? `${daysLeft} DAYS REMAINING` : 'TEMPORAL DRIFT'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(goal)} className="w-8 h-8 p-0 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteGoal(goal.id)} className="w-8 h-8 p-0 text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Locked Reserve</p>
                      <p className="text-sm font-black text-emerald-400 tabular-nums font-mono">{formatCurrency(goal.currentAmount, currency)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Success Point</p>
                      <p className="text-sm font-black text-slate-300 tabular-nums font-mono opacity-60">{formatCurrency(goal.targetAmount, currency)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-gradient-to-r from-emerald-600 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                          }`}
                        {...{ style: progressStyle }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <span className={isCompleted ? 'text-emerald-400' : 'text-emerald-500/60'}>
                        {Math.min(100, progress).toFixed(0)}% SYNCHRONIZED
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleOpenFundsDialog(goal)}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 sq-md font-black text-[10px] uppercase tracking-widest py-6 transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Inject Capital
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Funds Dialog */}
      <Dialog open={isFundsDialogOpen} onOpenChange={setIsFundsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black border-white/5 text-white p-8 custom-scrollbar sq-2xl">
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
                className="bg-black border-white/5 sq-md h-14 text-white text-lg placeholder:text-slate-600"
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
                <div className="flex items-center space-x-2 bg-black p-4 sq-md border border-white/5">
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
                      <SelectTrigger id="fund-account" name="accountId" className="bg-black border-white/5 sq-md h-14 text-white">
                        <SelectValue placeholder="Choose account" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/5 text-white">
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
                className="flex-1 h-12 sq-md border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 sq-md bg-[#30D158] hover:bg-[#28B54C] text-white border-none shadow-lg shadow-green-600/10"
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
