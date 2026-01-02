import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowRight, TrendingDown, AlertCircle } from 'lucide-react';
import { Account, Goal } from '../types';
import { formatCurrency } from '../utils/numberFormat';
import { toast } from 'sonner';

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
}

export function FundAllocationDialog({
  isOpen,
  onClose,
  accounts,
  goals,
  currency,
  destinationType,
  emergencyFund,
  onAllocate
}: FundAllocationDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [amount, setAmount] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const selectedGoal = goals.find(g => g.id === selectedDestinationId);
  const amountNum = parseFloat(amount) || 0;

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
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {destinationType === 'goal' ? '🎯 Allocate to Goal' : '🛡️ Allocate to Emergency Fund'}
          </DialogTitle>
          <DialogDescription>
            Move funds from your account to {destinationType === 'goal' ? 'a savings goal' : 'emergency fund'}
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6 py-4">
            {/* Source Account Selection */}
            <div className="space-y-2">
              <Label htmlFor="allocate-from-account">From Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger id="allocate-from-account" name="fromAccountId">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <span className="text-sm text-gray-500 ml-4">
                          {formatCurrency(account.balance, currency)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAccount && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Available: {formatCurrency(selectedAccount.balance, currency)}
                </p>
              )}
            </div>

            {/* Destination Selection */}
            {destinationType === 'goal' ? (
              <div className="space-y-2">
                <Label htmlFor="allocate-to-goal">To Goal</Label>
                <Select value={selectedDestinationId} onValueChange={setSelectedDestinationId}>
                  <SelectTrigger id="allocate-to-goal" name="toGoalId">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map(goal => {
                      const progress = (goal.currentAmount / goal.targetAmount) * 100;
                      return (
                        <SelectItem key={goal.id} value={goal.id}>
                          <div className="flex items-center gap-2">
                            <span>{goal.emoji}</span>
                            <div>
                              <div>{goal.name}</div>
                              <div className="text-xs text-gray-500">
                                {Math.round(progress)}% • {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
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
              <div className="space-y-2">
                <Label>To Emergency Fund</Label>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      🛡️
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Emergency Fund</p>
                      {emergencyFund && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(emergencyFund.currentAmount, currency)} / {formatCurrency(emergencyFund.targetAmount, currency)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="allocate-amount">Amount to Allocate</Label>
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
                  className="pl-8"
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
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetAndClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePreview} className="flex-1">
                Preview
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Preview Header */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Review your allocation
              </p>
            </div>

            {/* Visual Flow */}
            <div className="space-y-4">
              {/* Source Account - Before */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-2">FROM</p>
                <p className="font-medium">{selectedAccount?.name}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Current Balance:</span>
                    <span className="font-medium">{formatCurrency(selectedAccount?.balance || 0, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                    <span>Allocation:</span>
                    <span>-{formatCurrency(amountNum, currency)}</span>
                  </div>
                  <div className="h-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex justify-between">
                    <span className="font-medium">New Balance:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency((selectedAccount?.balance || 0) - amountNum, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Destination - After */}
              <div className={`p-4 rounded-lg border-2 ${destinationType === 'goal'
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                <p className="text-xs text-gray-500 mb-2">TO</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{destinationType === 'goal' ? selectedGoal?.emoji : '🛡️'}</span>
                  <p className="font-medium">
                    {destinationType === 'goal' ? selectedGoal?.name : 'Emergency Fund'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Current Amount:</span>
                    <span className="font-medium">
                      {formatCurrency((destinationType === 'goal'
                        ? selectedGoal?.currentAmount
                        : emergencyFund?.currentAmount) || 0, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Adding:</span>
                    <span>+{formatCurrency(amountNum, currency)}</span>
                  </div>
                  <div className="h-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex justify-between">
                    <span className="font-medium">New Amount:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(((destinationType === 'goal'
                        ? selectedGoal?.currentAmount
                        : emergencyFund?.currentAmount) || 0) + amountNum, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Impact Notice */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex gap-2">
                <TrendingDown className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    Dashboard Balance Impact
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Your Net Balance and {selectedAccount?.name} balance will be reduced by {formatCurrency(amountNum, currency)} immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConfirm} className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                Confirm Allocation
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
