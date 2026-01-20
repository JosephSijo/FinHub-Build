import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowRight, AlertCircle, Sparkles, Wallet, Target, Info, ChevronUp } from 'lucide-react';
import { Account, Goal, Liability } from '../types';
import { formatCurrency } from '../utils/numberFormat';
import { toast } from 'sonner';
import { useShadowWallet } from '../hooks/useShadowWallet';
import { MeshBackground } from './ui/MeshBackground';
import { CyberButton } from './ui/CyberButton';

interface FundAllocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  goals: Goal[];
  currency: string;
  destinationType: 'goal' | 'emergency';
  emergencyFund?: {
    currentAmount: number;
    targetAmount: number;
  };
  onAllocate: (data: {
    accountId: string;
    destinationId: string;
    amount: number;
    destinationType: 'goal' | 'emergency';
  }) => void;
  liabilities?: Liability[];
  expenses?: any[];
}

export function FundAllocationDialog({
  isOpen,
  onClose,
  accounts,
  goals,
  currency,
  destinationType,
  emergencyFund,
  onAllocate,
  liabilities = [],
  expenses = []
}: FundAllocationDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [amount, setAmount] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);

  // Get surplus from shadow wallet
  const {
    availableToSpend,
    totalBankBalance,
    shadowWalletTotal,
    totalCommitments
  } = useShadowWallet({
    accounts,
    goals,
    liabilities,
    expenses,
    emergencyFundAmount: emergencyFund?.currentAmount || 0
  });

  // Smart source suggestion
  useEffect(() => {
    if (isOpen && !selectedAccountId && accounts.length > 0) {
      const liquidAccounts = accounts.filter(a => a.type === 'bank' || a.type === 'cash');
      if (liquidAccounts.length > 0) {
        // Suggest account with enough balance, or highest balance
        const bestFit = liquidAccounts.find(a => a.balance >= availableToSpend) ||
          [...liquidAccounts].sort((a, b) => b.balance - a.balance)[0];
        if (bestFit) {
          queueMicrotask(() => {
            setSelectedAccountId(bestFit.id);
          });
        }
      }
    }
  }, [isOpen, availableToSpend, accounts, selectedAccountId]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const selectedGoal = goals.find(g => g.id === selectedDestinationId);
  const amountNum = parseFloat(amount) || 0;

  // Auto-fill logic
  const handleAutoFill = () => {
    if (availableToSpend > 0) {
      setAmount(availableToSpend.toString());

      // Suggest distribution if destination not selected
      if (destinationType === 'goal' && !selectedDestinationId && goals.length > 0) {
        const sortedGoals = [...goals].sort((a, b) => {
          // Priority 1: Goal proximity (Target date closest to today)
          const dateA = new Date(a.targetDate).getTime();
          const dateB = new Date(b.targetDate).getTime();
          if (dateA !== dateB) return dateA - dateB;

          // Priority 2: Percentage completion (lowest synchronized value)
          const progressA = (a.currentAmount / a.targetAmount);
          const progressB = (b.currentAmount / b.targetAmount);
          return progressA - progressB;
        });

        setSelectedDestinationId(sortedGoals[0].id);
        toast.info(`Suggested: ${sortedGoals[0].name} based on timeline & progress`, {
          icon: <Sparkles className="w-4 h-4 text-blue-400" />
        });
      }
    } else {
      toast.error('No surplus cash available for auto-fill');
    }
  };

  const handlePreview = () => {
    if (!selectedAccountId) {
      toast.error('Please select an account');
      return;
    }
    if (destinationType === 'goal' && !selectedDestinationId) {
      toast.error('Please select a goal');
      return;
    }
    if (!amount || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (selectedAccount && amountNum > selectedAccount.balance) {
      toast.error('Insufficient balance in selected account');
      return;
    }
    setShowPreview(true);
  };

  const handleConfirm = () => {
    onAllocate({
      accountId: selectedAccountId,
      destinationId: destinationType === 'goal' ? selectedDestinationId : 'emergency-fund',
      amount: amountNum,
      destinationType
    });

    // Reset form
    setSelectedAccountId('');
    setSelectedDestinationId('');
    setAmount('');
    setShowPreview(false);
    onClose();
  };

  const handleBack = () => {
    setShowPreview(false);
  };

  const resetAndClose = () => {
    setSelectedAccountId('');
    setSelectedDestinationId('');
    setAmount('');
    setShowPreview(false);
    setShowCalculation(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md bg-black border-white/5 text-white p-0 custom-scrollbar sq-2xl overflow-hidden">
        <div className="max-h-[85vh] overflow-y-auto p-8 custom-scrollbar">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-black tracking-tight text-white mb-1">
              {destinationType === 'goal' ? '🎯 ALLOCATE TO GOAL' : '🛡️ ADD TO EMERGENCY FUND'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
              Move money from account to {destinationType === 'goal' ? 'savings goal' : 'emergency fund'}
            </DialogDescription>
          </DialogHeader>

          {!showPreview ? (
            <div className="space-y-6">
              {/* Prominent Surplus Card */}
              {availableToSpend > 0 && (
                <div className="relative group overflow-hidden sq-xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition-all hover:bg-emerald-500/10 mb-2">
                  <MeshBackground variant="savings" />
                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 sq-md flex items-center justify-center border border-emerald-500/30">
                          <Sparkles className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[9px] text-emerald-500/70 font-black uppercase tracking-widest">Extra Cash Detected</p>
                          <h4 className="text-xl font-black text-white tabular-nums">
                            {formatCurrency(availableToSpend, currency)}
                          </h4>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCalculation(!showCalculation)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white"
                        title="Show Calculation"
                      >
                        {showCalculation ? <ChevronUp className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                      </button>
                    </div>

                    {showCalculation && (
                      <div className="py-3 border-t border-emerald-500/10 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between text-[10px] text-emerald-500/60 font-medium">
                          <span>Total Cash</span>
                          <span>{formatCurrency(totalBankBalance, currency)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-rose-500/60 font-medium">
                          <span>Reserved Funds (Goals + EF)</span>
                          <span>-{formatCurrency(shadowWalletTotal, currency)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-rose-500/60 font-medium pb-2 border-b border-emerald-500/10">
                          <span>Total Commitments (Bills)</span>
                          <span>-{formatCurrency(totalCommitments, currency)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-emerald-400 font-bold uppercase pt-1">
                          <span>Extra Cash</span>
                          <span>{formatCurrency(availableToSpend, currency)}</span>
                        </div>
                      </div>
                    )}

                    <CyberButton
                      onClick={() => {
                        handleAutoFill();
                        if (selectedAccount && availableToSpend > selectedAccount.balance) {
                          toast.warning('Transfer exceeds selected account balance. Source adjusted.');
                        }
                      }}
                      className="w-full h-11 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black tracking-widest"
                    >
                      Allocate All Surplus
                    </CyberButton>
                  </div>
                </div>
              )}
              {/* Source Account Selection */}
              <div className="space-y-2 text-label">
                <Label htmlFor="allocate-from-account" className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2 block">From Account</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger id="allocate-from-account" name="fromAccountId" className="bg-black border-white/5 sq-md h-14 text-white focus:ring-1 focus:ring-blue-500/50">
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white sq-xl">
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id} className="hover:bg-white/5">
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
                {selectedAccount && (
                  <p className="text-[10px] text-slate-500 mt-2 italic px-1">
                    Available Cash: {formatCurrency(selectedAccount.balance, currency)}
                  </p>
                )}
              </div>

              {/* Destination Selection */}
              {destinationType === 'goal' ? (
                <div className="space-y-2 text-label">
                  <Label htmlFor="allocate-to-goal" className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2 block">Target Goal</Label>
                  <Select value={selectedDestinationId} onValueChange={setSelectedDestinationId}>
                    <SelectTrigger id="allocate-to-goal" name="toGoalId" className="bg-black border-white/5 sq-md h-14 text-white focus:ring-1 focus:ring-emerald-500/50">
                      <SelectValue placeholder="Choose Destination Goal" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white sq-xl">
                      {goals.map(goal => {
                        const progress = (goal.currentAmount / goal.targetAmount) * 100;
                        return (
                          <SelectItem key={goal.id} value={goal.id} className="hover:bg-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{goal.emoji}</span>
                              <div className="min-w-0">
                                <div className="font-bold text-xs uppercase tracking-tight">{goal.name}</div>
                                <div className="text-[9px] text-slate-500 font-mono">
                                  {Math.round(progress)}% SAVED • {formatCurrency(goal.currentAmount, currency)}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2 text-label">
                  <Label className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2 block">Emergency Fund</Label>
                  <div className="p-4 bg-white/5 border border-white/10 sq-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 sq-md flex items-center justify-center border border-blue-500/20">
                        🛡️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xs uppercase tracking-widest text-white">Emergency Fund</p>
                        {emergencyFund && (
                          <p className="text-[9px] text-slate-500 font-mono mt-1">
                            {formatCurrency(emergencyFund.currentAmount, currency)} / {formatCurrency(emergencyFund.targetAmount, currency)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2 text-label">
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="allocate-amount" className="text-[10px] uppercase tracking-widest font-black text-slate-500 block">Amount To Transfer</Label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {currency === 'INR' ? '₹' : '$'}
                  </span>
                  <Input
                    id="allocate-amount"
                    name="amount"
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 bg-black border-white/5 h-12"
                    min="0"
                    step="0.01"
                  />
                </div>
                {selectedAccount && amountNum > selectedAccount.balance && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Amount exceeds available balance</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <CyberButton
                  onClick={resetAndClose}
                  className="flex-1 h-12 text-slate-500 hover:text-white border-white/5 font-black tracking-[0.2em]"
                >
                  Abort
                </CyberButton>
                <CyberButton
                  onClick={handlePreview}
                  className="flex-1 h-12 bg-blue-600/20 text-blue-400 border-blue-500/30 font-black tracking-[0.2em] shadow-lg shadow-blue-500/10"
                >
                  Preview Mode
                </CyberButton>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Preview Header */}
              <div className="text-center pt-2">
                <p className="text-[10px] text-emerald-500 uppercase font-black tracking-[0.2em] animate-pulse">
                  Ready to Allocate Funds
                </p>
              </div>

              {/* Visual Flow */}
              <div className="space-y-4">
                {/* Source Account - Before */}
                <div className="p-5 bg-white/5 sq-md border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-3 opacity-60">From Account</p>
                  <p className="font-black text-sm text-white tracking-tight">{selectedAccount?.name}</p>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-slate-400 uppercase tracking-tighter">Current Balance</span>
                      <span className="font-mono text-white">{formatCurrency(selectedAccount?.balance || 0, currency)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-rose-500">
                      <span className="uppercase tracking-tighter">Debit Amount</span>
                      <span className="font-mono">-{formatCurrency(amountNum, currency)}</span>
                    </div>
                    <div className="h-px bg-white/5"></div>
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-500 uppercase tracking-widest">New Balance</span>
                      <span className="text-blue-400 font-mono">
                        {formatCurrency((selectedAccount?.balance || 0) - amountNum, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center -my-2 relative z-10">
                  <div className="w-10 h-10 bg-blue-600 sq-md flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/20">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Destination - After */}
                <div className={`p-5 sq-md border relative overflow-hidden ${destinationType === 'goal'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-blue-500/5 border-blue-500/20'
                  }`}>
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    {destinationType === 'goal' ? <Sparkles className="w-8 h-8 text-emerald-500" /> : <Target className="w-8 h-8 text-blue-500" />}
                  </div>
                  <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-3 opacity-60">To Account</p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{destinationType === 'goal' ? selectedGoal?.emoji : '🛡️'}</span>
                    <p className="font-black text-sm text-white tracking-tight">
                      {destinationType === 'goal' ? selectedGoal?.name : 'Emergency Reserve'}
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-slate-400 uppercase tracking-tighter">Current Level</span>
                      <span className="font-mono text-white">
                        {formatCurrency((destinationType === 'goal'
                          ? selectedGoal?.currentAmount
                          : emergencyFund?.currentAmount) || 0, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-emerald-400">
                      <span className="uppercase tracking-tighter">Credit Amount</span>
                      <span className="font-mono">+{formatCurrency(amountNum, currency)}</span>
                    </div>
                    <div className="h-px bg-white/5"></div>
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-500 uppercase tracking-widest">New Goal Balance</span>
                      <span className="text-emerald-400 font-mono">
                        {formatCurrency(((destinationType === 'goal'
                          ? selectedGoal?.currentAmount
                          : emergencyFund?.currentAmount) || 0) + amountNum, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Impact Notice */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 sq-md">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px]">
                    <p className="font-black text-amber-400 uppercase tracking-widest mb-1">
                      Balance Warning
                    </p>
                    <p className="text-amber-500/70 font-bold leading-relaxed">
                      Net Cash and {selectedAccount?.name} reserves will be reduced by {formatCurrency(amountNum, currency)} immediately. This action is final.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <CyberButton
                  onClick={handleBack}
                  className="flex-1 h-12 text-slate-500 hover:text-white border-white/5 font-black tracking-[0.2em]"
                >
                  Re-Configure
                </CyberButton>
                <CyberButton
                  onClick={handleConfirm}
                  className="flex-1 h-12 bg-emerald-600/20 text-emerald-400 border-emerald-500/30 font-black tracking-[0.2em] shadow-lg shadow-emerald-500/10"
                >
                  Confirm Move
                </CyberButton>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
