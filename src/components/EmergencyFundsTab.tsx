import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { Shield, Heart, FileText, Plus, Pencil, Trash2, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../types';
import { toast } from 'sonner@2.0.3';

interface HealthInsurance {
  id: string;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premium: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  expiryDate: string;
  type: 'health';
}

interface TermInsurance {
  id: string;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premium: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  expiryDate: string;
  type: 'term';
}

interface EmergencyFund {
  id: string;
  targetAmount: number;
  currentAmount: number;
  monthlyExpenses: number;
  targetMonths: number;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon: string;
}

interface EmergencyFundsTabProps {
  currency: string;
  userId: string;
  expenses?: any[];
  incomes?: any[];
  accounts?: Account[];
  onEmergencyFundUpdate?: (amount: number) => void;
}

export function EmergencyFundsTab({ currency, userId, expenses = [], incomes = [], accounts = [], onEmergencyFundUpdate }: EmergencyFundsTabProps) {
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund>({
    id: '1',
    targetAmount: 0,
    currentAmount: 0,
    monthlyExpenses: 0,
    targetMonths: 6
  });

  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
  const [termInsurances, setTermInsurances] = useState<TermInsurance[]>([]);

  const [isHealthDialogOpen, setIsHealthDialogOpen] = useState(false);
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);

  const [editingHealth, setEditingHealth] = useState<HealthInsurance | null>(null);
  const [editingTerm, setEditingTerm] = useState<TermInsurance | null>(null);

  const [healthFormData, setHealthFormData] = useState({
    provider: '',
    policyNumber: '',
    coverageAmount: '',
    premium: '',
    frequency: 'yearly' as 'monthly' | 'quarterly' | 'yearly',
    startDate: '',
    expiryDate: ''
  });

  const [termFormData, setTermFormData] = useState({
    provider: '',
    policyNumber: '',
    coverageAmount: '',
    premium: '',
    frequency: 'yearly' as 'monthly' | 'quarterly' | 'yearly',
    startDate: '',
    expiryDate: ''
  });

  const [fundFormData, setFundFormData] = useState({
    monthlyExpenses: '',
    targetMonths: '6'
  });

  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [deductFromAccount, setDeductFromAccount] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Emergency Fund handlers
  const handleSetupFund = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyExpenses = parseFloat(fundFormData.monthlyExpenses);
    const targetMonths = parseInt(fundFormData.targetMonths);
    
    const updated = {
      ...emergencyFund,
      monthlyExpenses,
      targetMonths,
      targetAmount: monthlyExpenses * targetMonths
    };
    
    setEmergencyFund(updated);
    if (onEmergencyFundUpdate) {
      onEmergencyFundUpdate(updated.currentAmount);
    }
    setIsFundDialogOpen(false);
    toast.success('Emergency fund target set!');
  };

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addFundsAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (deductFromAccount && !selectedAccountId) {
      toast.error('Please select an account');
      return;
    }

    if (deductFromAccount && selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      if (!account) {
        toast.error('Account not found');
        return;
      }
      if (account.balance < amount) {
        toast.error('Insufficient account balance');
        return;
      }

      // This will be handled by parent component through callback
      if ((window as any).handleEmergencyFundDeduction) {
        (window as any).handleEmergencyFundDeduction(selectedAccountId, amount);
      }
    }

    const updated = {
      ...emergencyFund,
      currentAmount: emergencyFund.currentAmount + amount
    };

    setEmergencyFund(updated);
    if (onEmergencyFundUpdate) {
      onEmergencyFundUpdate(updated.currentAmount);
    }
    setIsAddFundsDialogOpen(false);
    setAddFundsAmount('');
    setDeductFromAccount(false);
    setSelectedAccountId('');
    toast.success(`Added ${CURRENCY_SYMBOLS[currency]}${amount} to emergency fund!`);
  };

  // Health Insurance handlers
  const handleHealthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newInsurance: HealthInsurance = {
      id: editingHealth?.id || `health_${Date.now()}`,
      provider: healthFormData.provider,
      policyNumber: healthFormData.policyNumber,
      coverageAmount: parseFloat(healthFormData.coverageAmount),
      premium: parseFloat(healthFormData.premium),
      frequency: healthFormData.frequency,
      startDate: healthFormData.startDate,
      expiryDate: healthFormData.expiryDate,
      type: 'health'
    };

    if (editingHealth) {
      setHealthInsurances(healthInsurances.map(h => h.id === editingHealth.id ? newInsurance : h));
      toast.success('Health insurance updated!');
    } else {
      setHealthInsurances([...healthInsurances, newInsurance]);
      toast.success('Health insurance added!');
    }

    resetHealthForm();
    setIsHealthDialogOpen(false);
  };

  const resetHealthForm = () => {
    setHealthFormData({
      provider: '',
      policyNumber: '',
      coverageAmount: '',
      premium: '',
      frequency: 'yearly',
      startDate: '',
      expiryDate: ''
    });
    setEditingHealth(null);
  };

  // Term Insurance handlers
  const handleTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newInsurance: TermInsurance = {
      id: editingTerm?.id || `term_${Date.now()}`,
      provider: termFormData.provider,
      policyNumber: termFormData.policyNumber,
      coverageAmount: parseFloat(termFormData.coverageAmount),
      premium: parseFloat(termFormData.premium),
      frequency: termFormData.frequency,
      startDate: termFormData.startDate,
      expiryDate: termFormData.expiryDate,
      type: 'term'
    };

    if (editingTerm) {
      setTermInsurances(termInsurances.map(t => t.id === editingTerm.id ? newInsurance : t));
      toast.success('Term insurance updated!');
    } else {
      setTermInsurances([...termInsurances, newInsurance]);
      toast.success('Term insurance added!');
    }

    resetTermForm();
    setIsTermDialogOpen(false);
  };

  const resetTermForm = () => {
    setTermFormData({
      provider: '',
      policyNumber: '',
      coverageAmount: '',
      premium: '',
      frequency: 'yearly',
      startDate: '',
      expiryDate: ''
    });
    setEditingTerm(null);
  };

  const progress = emergencyFund.targetAmount > 0 
    ? (emergencyFund.currentAmount / emergencyFund.targetAmount) * 100 
    : 0;

  const isGoalMet = progress >= 100;

  // Get emergency-related transactions
  const emergencyTransactions = expenses.filter(e => 
    e.category === 'Healthcare' ||
    (e.description && (
      e.description.toLowerCase().includes('insurance') ||
      e.description.toLowerCase().includes('medical') ||
      e.description.toLowerCase().includes('health') ||
      e.description.toLowerCase().includes('emergency')
    ))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const totalEmergencySpent = emergencyTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2>Emergency Funds & Insurance</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Build your safety net and manage insurance policies
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            // This will be handled in App.tsx
            if ((window as any).showFundAllocation) {
              (window as any).showFundAllocation('emergency');
            }
          }}
          className="gap-2"
        >
          <Shield className="w-4 h-4" />
          Allocate Funds
        </Button>
      </div>

      {/* Emergency Transaction Summary */}
      {emergencyTransactions.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-blue-900 dark:text-blue-100">Emergency Expenses</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Recent healthcare & insurance transactions
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl text-blue-600 dark:text-blue-400">
                {CURRENCY_SYMBOLS[currency]}{totalEmergencySpent.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Last 5 Transactions
              </p>
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">Recent Transactions:</p>
            <div className="space-y-2">
              {emergencyTransactions.map((transaction, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-red-600 whitespace-nowrap ml-3">
                    -{CURRENCY_SYMBOLS[currency]}{transaction.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Emergency Fund Card */}
      <Card className={`p-6 ${isGoalMet ? 'border-green-500 dark:border-green-600' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3>Emergency Fund</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {emergencyFund.targetMonths} months of expenses
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFundFormData({
                  monthlyExpenses: emergencyFund.monthlyExpenses.toString(),
                  targetMonths: emergencyFund.targetMonths.toString()
                });
                setIsFundDialogOpen(true);
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Setup
            </Button>
            {emergencyFund.targetAmount > 0 && !isGoalMet && (
              <Button
                size="sm"
                onClick={() => setIsAddFundsDialogOpen(true)}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Funds
              </Button>
            )}
          </div>
        </div>

        {emergencyFund.targetAmount > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span>{Math.min(100, progress).toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(100, progress)} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">
                {CURRENCY_SYMBOLS[currency]}{emergencyFund.currentAmount.toLocaleString()}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                of {CURRENCY_SYMBOLS[currency]}{emergencyFund.targetAmount.toLocaleString()}
              </span>
            </div>
            {isGoalMet && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mt-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  🎉 Congratulations! Your emergency fund goal is met!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Set up your emergency fund target
            </p>
            <Button onClick={() => setIsFundDialogOpen(true)}>
              <Shield className="w-4 h-4 mr-2" />
              Setup Emergency Fund
            </Button>
          </div>
        )}
      </Card>

      {/* Insurance Policies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Insurance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <h3>Health Insurance</h3>
            </div>
            <Button
              size="sm"
              onClick={() => {
                resetHealthForm();
                setIsHealthDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {healthInsurances.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No health insurance policies added
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {healthInsurances.map(insurance => (
                <div key={insurance.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{insurance.provider}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Policy #{insurance.policyNumber}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingHealth(insurance);
                          setHealthFormData({
                            provider: insurance.provider,
                            policyNumber: insurance.policyNumber,
                            coverageAmount: insurance.coverageAmount.toString(),
                            premium: insurance.premium.toString(),
                            frequency: insurance.frequency,
                            startDate: insurance.startDate,
                            expiryDate: insurance.expiryDate
                          });
                          setIsHealthDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setHealthInsurances(healthInsurances.filter(h => h.id !== insurance.id));
                          toast.success('Health insurance deleted');
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Coverage</p>
                      <p className="text-green-600">
                        {CURRENCY_SYMBOLS[currency]}{insurance.coverageAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Premium</p>
                      <p>{CURRENCY_SYMBOLS[currency]}{insurance.premium.toLocaleString()}/{insurance.frequency}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Expires: {new Date(insurance.expiryDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Term Insurance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h3>Term Insurance</h3>
            </div>
            <Button
              size="sm"
              onClick={() => {
                resetTermForm();
                setIsTermDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {termInsurances.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No term insurance policies added
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {termInsurances.map(insurance => (
                <div key={insurance.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{insurance.provider}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Policy #{insurance.policyNumber}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTerm(insurance);
                          setTermFormData({
                            provider: insurance.provider,
                            policyNumber: insurance.policyNumber,
                            coverageAmount: insurance.coverageAmount.toString(),
                            premium: insurance.premium.toString(),
                            frequency: insurance.frequency,
                            startDate: insurance.startDate,
                            expiryDate: insurance.expiryDate
                          });
                          setIsTermDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTermInsurances(termInsurances.filter(t => t.id !== insurance.id));
                          toast.success('Term insurance deleted');
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Coverage</p>
                      <p className="text-purple-600">
                        {CURRENCY_SYMBOLS[currency]}{insurance.coverageAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Premium</p>
                      <p>{CURRENCY_SYMBOLS[currency]}{insurance.premium.toLocaleString()}/{insurance.frequency}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Expires: {new Date(insurance.expiryDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Setup Emergency Fund Dialog */}
      <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Emergency Fund</DialogTitle>
            <DialogDescription>
              Calculate your emergency fund target based on monthly expenses
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSetupFund} className="space-y-4 mt-4">
            <div>
              <Label>Monthly Expenses</Label>
              <Input
                type="number"
                step="0.01"
                value={fundFormData.monthlyExpenses}
                onChange={(e) => setFundFormData({ ...fundFormData, monthlyExpenses: e.target.value })}
                placeholder="Enter your average monthly expenses"
                required
              />
            </div>

            <div>
              <Label>Target Months</Label>
              <Select
                value={fundFormData.targetMonths}
                onValueChange={(value) => setFundFormData({ ...fundFormData, targetMonths: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months (Minimum)</SelectItem>
                  <SelectItem value="6">6 months (Recommended)</SelectItem>
                  <SelectItem value="9">9 months (Safe)</SelectItem>
                  <SelectItem value="12">12 months (Very Safe)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Target Amount:</p>
              <p className="text-2xl text-blue-600">
                {CURRENCY_SYMBOLS[currency]}
                {(parseFloat(fundFormData.monthlyExpenses || '0') * parseInt(fundFormData.targetMonths)).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFundDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Set Target
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Emergency Fund</DialogTitle>
            <DialogDescription>
              Contribute to your emergency fund
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFunds} className="space-y-4 mt-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
                placeholder="Enter amount to add"
                autoFocus
                required
              />
            </div>

            {/* Deduct from account checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="deductFromAccount"
                checked={deductFromAccount}
                onChange={(e) => {
                  setDeductFromAccount(e.target.checked);
                  if (!e.target.checked) setSelectedAccountId('');
                }}
                className="w-4 h-4"
              />
              <Label htmlFor="deductFromAccount" className="cursor-pointer">
                Deduct from account balance
              </Label>
            </div>

            {/* Account Selector */}
            {deductFromAccount && accounts.length > 0 && (
              <div>
                <Label>Select Account</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <span>{account.icon}</span>
                          <span>{account.name}</span>
                          <span className="text-xs text-gray-500">
                            ({CURRENCY_SYMBOLS[currency]}{account.balance.toLocaleString()})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {deductFromAccount && accounts.length === 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-900 dark:text-yellow-100">
                ⚠️ No accounts available. Please add an account first.
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddFundsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-green-600 to-blue-600">
                Add Funds
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Health Insurance Dialog */}
      <Dialog open={isHealthDialogOpen} onOpenChange={setIsHealthDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHealth ? 'Edit' : 'Add'} Health Insurance</DialogTitle>
            <DialogDescription>
              Manage your health insurance policy details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleHealthSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Insurance Provider</Label>
              <Input
                value={healthFormData.provider}
                onChange={(e) => setHealthFormData({ ...healthFormData, provider: e.target.value })}
                placeholder="e.g., Blue Cross, UnitedHealth"
                required
              />
            </div>

            <div>
              <Label>Policy Number</Label>
              <Input
                value={healthFormData.policyNumber}
                onChange={(e) => setHealthFormData({ ...healthFormData, policyNumber: e.target.value })}
                placeholder="Enter policy number"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coverage Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={healthFormData.coverageAmount}
                  onChange={(e) => setHealthFormData({ ...healthFormData, coverageAmount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label>Premium</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={healthFormData.premium}
                  onChange={(e) => setHealthFormData({ ...healthFormData, premium: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Payment Frequency</Label>
              <Select
                value={healthFormData.frequency}
                onValueChange={(value: any) => setHealthFormData({ ...healthFormData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={healthFormData.startDate}
                  onChange={(e) => setHealthFormData({ ...healthFormData, startDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={healthFormData.expiryDate}
                  onChange={(e) => setHealthFormData({ ...healthFormData, expiryDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsHealthDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingHealth ? 'Update' : 'Add'} Policy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Term Insurance Dialog */}
      <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTerm ? 'Edit' : 'Add'} Term Insurance</DialogTitle>
            <DialogDescription>
              Manage your term insurance policy details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTermSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Insurance Provider</Label>
              <Input
                value={termFormData.provider}
                onChange={(e) => setTermFormData({ ...termFormData, provider: e.target.value })}
                placeholder="e.g., LIC, HDFC Life"
                required
              />
            </div>

            <div>
              <Label>Policy Number</Label>
              <Input
                value={termFormData.policyNumber}
                onChange={(e) => setTermFormData({ ...termFormData, policyNumber: e.target.value })}
                placeholder="Enter policy number"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coverage Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={termFormData.coverageAmount}
                  onChange={(e) => setTermFormData({ ...termFormData, coverageAmount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label>Premium</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={termFormData.premium}
                  onChange={(e) => setTermFormData({ ...termFormData, premium: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Payment Frequency</Label>
              <Select
                value={termFormData.frequency}
                onValueChange={(value: any) => setTermFormData({ ...termFormData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={termFormData.startDate}
                  onChange={(e) => setTermFormData({ ...termFormData, startDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={termFormData.expiryDate}
                  onChange={(e) => setTermFormData({ ...termFormData, expiryDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTermDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingTerm ? 'Update' : 'Add'} Policy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
