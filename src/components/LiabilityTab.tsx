import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Progress } from './ui/progress';
import { CreditCard, Plus, Pencil, Trash2, TrendingDown, Calendar, DollarSign, AlertCircle, CheckCircle, Building, Calculator } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../types';
import { toast } from 'sonner@2.0.3';
import { api } from '../utils/api';

interface Liability {
  id: string;
  name: string;
  type: 'home_loan' | 'car_loan' | 'personal_loan' | 'credit_card' | 'education_loan' | 'other';
  principal: number;
  outstanding: number;
  interestRate: number;
  emiAmount: number;
  startDate: string;
  tenure: number; // in months
  accountId?: string;
}

interface LiabilityTabProps {
  currency: string;
  userId: string;
  expenses?: any[];
  incomes?: any[];
  accounts?: any[];
}

const LIABILITY_TYPES = [
  { value: 'home_loan', label: '🏠 Home Loan', icon: '🏠' },
  { value: 'car_loan', label: '🚗 Car Loan', icon: '🚗' },
  { value: 'personal_loan', label: '💳 Personal Loan', icon: '💳' },
  { value: 'credit_card', label: '💳 Credit Card', icon: '💳' },
  { value: 'education_loan', label: '🎓 Education Loan', icon: '🎓' },
  { value: 'other', label: '📋 Other', icon: '📋' }
];

export function LiabilityTab({ currency, userId, expenses = [], incomes = [], accounts = [] }: LiabilityTabProps) {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    type: 'personal_loan' as Liability['type'],
    principal: '',
    outstanding: '',
    interestRate: '',
    emiAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    tenure: '',
    tenureUnit: 'months' as 'months' | 'years',
    accountId: 'none'
  });

  useEffect(() => {
    loadLiabilities();
  }, [userId]);

  const loadLiabilities = async () => {
    setIsLoading(true);
    try {
      const response = await api.getLiabilities(userId);
      if (response.success) {
        setLiabilities(response.liabilities || []);
      }
    } catch (error) {
      console.error('Error loading liabilities:', error);
      toast.error('Failed to load liabilities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert tenure to months if in years
    const tenureInMonths = formData.tenureUnit === 'years' 
      ? parseInt(formData.tenure) * 12 
      : parseInt(formData.tenure);

    const liabilityData = {
      name: formData.name,
      type: formData.type,
      principal: parseFloat(formData.principal),
      outstanding: parseFloat(formData.outstanding),
      interestRate: parseFloat(formData.interestRate),
      emiAmount: parseFloat(formData.emiAmount),
      startDate: formData.startDate,
      tenure: tenureInMonths,
      accountId: formData.accountId && formData.accountId !== 'none' ? formData.accountId : undefined
    };

    try {
      if (editingLiability) {
        const response = await api.updateLiability(userId, editingLiability.id, liabilityData);
        if (response.success) {
          setLiabilities(liabilities.map(l => l.id === editingLiability.id ? response.liability : l));
          toast.success('Liability updated successfully!');
        }
      } else {
        const response = await api.createLiability(userId, liabilityData);
        if (response.success) {
          setLiabilities([...liabilities, response.liability]);
          toast.success('Liability added successfully!');
        }
      }
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error saving liability:', error);
      toast.error('Failed to save liability');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this liability?')) return;

    try {
      const response = await api.deleteLiability(userId, id);
      if (response.success) {
        setLiabilities(liabilities.filter(l => l.id !== id));
        toast.success('Liability deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting liability:', error);
      toast.error('Failed to delete liability');
    }
  };

  const handleEdit = (liability: Liability) => {
    setEditingLiability(liability);
    
    // Smart tenure conversion: use years if it's a whole number, otherwise use months
    const isWholeYears = liability.tenure % 12 === 0 && liability.tenure >= 12;
    const tenureValue = isWholeYears ? liability.tenure / 12 : liability.tenure;
    const tenureUnit = isWholeYears ? 'years' : 'months';
    
    setFormData({
      name: liability.name,
      type: liability.type,
      principal: liability.principal.toString(),
      outstanding: liability.outstanding.toString(),
      interestRate: liability.interestRate.toString(),
      emiAmount: liability.emiAmount.toString(),
      startDate: liability.startDate,
      tenure: tenureValue.toString(),
      tenureUnit: tenureUnit,
      accountId: liability.accountId || 'none'
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'personal_loan',
      principal: '',
      outstanding: '',
      interestRate: '',
      emiAmount: '',
      startDate: new Date().toISOString().split('T')[0],
      tenure: '',
      tenureUnit: 'months',
      accountId: 'none'
    });
    setEditingLiability(null);
  };

  // Auto-calculate outstanding amount and EMI
  const calculateLoanDetails = () => {
    const principal = parseFloat(formData.principal);
    const interestRate = parseFloat(formData.interestRate);
    const tenureValue = parseInt(formData.tenure);
    const startDate = formData.startDate;

    if (!principal || !interestRate || !tenureValue) {
      toast.error('Please enter Principal, Interest Rate, and Tenure first');
      return;
    }

    // Convert tenure to months if needed
    const tenureInMonths = formData.tenureUnit === 'years' ? tenureValue * 12 : tenureValue;
    const tenureInYears = tenureInMonths / 12;

    // Calculate total interest (Simple Interest for the full tenure)
    const totalInterest = principal * (interestRate / 100) * tenureInYears;
    
    // Total amount to be repaid
    const totalAmount = principal + totalInterest;
    
    // Monthly EMI
    const monthlyEMI = totalAmount / tenureInMonths;

    // Calculate months already paid
    const startDateObj = new Date(startDate);
    const today = new Date();
    let monthsPaid = 0;
    
    if (startDateObj <= today) {
      const yearsDiff = today.getFullYear() - startDateObj.getFullYear();
      const monthsDiff = today.getMonth() - startDateObj.getMonth();
      const daysDiff = today.getDate() - startDateObj.getDate();
      
      monthsPaid = yearsDiff * 12 + monthsDiff;
      if (daysDiff < 0) {
        monthsPaid--;
      }
      monthsPaid = Math.max(0, Math.min(monthsPaid, tenureInMonths));
    }

    // Calculate current outstanding
    const amountPaid = monthlyEMI * monthsPaid;
    const currentOutstanding = Math.max(0, totalAmount - amountPaid);

    // Update form with calculated values
    setFormData({
      ...formData,
      outstanding: currentOutstanding.toFixed(2),
      emiAmount: monthlyEMI.toFixed(2)
    });

    toast.success(`Calculated: EMI ₹${monthlyEMI.toFixed(2)}, Outstanding ₹${currentOutstanding.toFixed(2)} (${monthsPaid} months paid)`);
  };

  const calculateMonthsPaid = (liability: Liability) => {
    const startDate = new Date(liability.startDate);
    const today = new Date();
    
    // If start date is in the future, no months have been paid yet
    if (startDate > today) {
      return 0;
    }
    
    // Calculate the number of complete months elapsed since start date
    let monthsPaid = 0;
    const yearsDiff = today.getFullYear() - startDate.getFullYear();
    const monthsDiff = today.getMonth() - startDate.getMonth();
    const daysDiff = today.getDate() - startDate.getDate();
    
    monthsPaid = yearsDiff * 12 + monthsDiff;
    
    // Only count the current month if we've passed the start day
    if (daysDiff < 0) {
      monthsPaid--;
    }
    
    // Ensure we don't go negative
    monthsPaid = Math.max(0, monthsPaid);
    
    // Cap at total tenure
    return Math.min(monthsPaid, liability.tenure);
  };

  const totalOutstanding = liabilities.reduce((sum, l) => sum + l.outstanding, 0);
  const totalEMI = liabilities.reduce((sum, l) => sum + l.emiAmount, 0);
  const totalPrincipal = liabilities.reduce((sum, l) => sum + l.principal, 0);
  const totalPaid = totalPrincipal - totalOutstanding;

  // Get EMI-related transactions from expenses
  const emiTransactions = expenses.filter(e => 
    e.category === 'EMI' || 
    e.tags?.includes('emi') ||
    e.tags?.includes('loan') ||
    (e.description && (
      e.description.toLowerCase().includes('emi') ||
      e.description.toLowerCase().includes('loan payment')
    ))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const totalEMIPaid = emiTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Mini Dashboard */}
      {emiTransactions.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-orange-900 dark:text-orange-100">EMI Payments</h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Recent loan transactions
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total EMI/Month</p>
                <p className="text-xl text-red-600 dark:text-red-400">
                  {CURRENCY_SYMBOLS[currency]}{totalEMI.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Recent Payments</p>
                <p className="text-xl text-orange-600 dark:text-orange-400">
                  {CURRENCY_SYMBOLS[currency]}{totalEMIPaid.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Recent EMI Transactions */}
          <div className="pt-4 border-t border-orange-200 dark:border-orange-700">
            <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">Recent EMI Payments:</p>
            <div className="space-y-2">
              {emiTransactions.map((transaction, idx) => (
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

      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-blue-900 dark:text-blue-100">What are Liabilities?</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Liabilities are institutional loans (Home, Car, Personal, Credit Card) with EMI payments. 
              For personal money borrowed/lent to friends or family, use <strong>Personal IOUs</strong> from the + button.
            </p>
          </div>
        </div>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Liabilities & Loans</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track and manage all your institutional loans and EMIs
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Liability
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Outstanding</p>
              <h3 className="text-red-600">{CURRENCY_SYMBOLS[currency]}{totalOutstanding.toLocaleString()}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly EMI</p>
              <h3 className="text-orange-600">{CURRENCY_SYMBOLS[currency]}{totalEMI.toLocaleString()}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
              <h3 className="text-green-600">{CURRENCY_SYMBOLS[currency]}{totalPaid.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Liabilities List */}
      <Card className="p-6">
        <h3 className="mb-4">Active Liabilities</h3>

        {liabilities.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No liabilities yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Add your loans and track EMI payments
            </p>
            <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Liability
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {liabilities.map((liability) => {
              const monthsPaid = calculateMonthsPaid(liability);
              const progress = (monthsPaid / liability.tenure) * 100;
              const typeInfo = LIABILITY_TYPES.find(t => t.value === liability.type);

              return (
                <div key={liability.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-xl">{typeInfo?.icon}</span>
                      </div>
                      <div>
                        <h4>{liability.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {typeInfo?.label.replace(/^\S+ /, '')} • {liability.interestRate}% interest
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(liability)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(liability.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Principal</p>
                      <p className="text-sm">{CURRENCY_SYMBOLS[currency]}{liability.principal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Outstanding</p>
                      <p className="text-sm text-red-600">{CURRENCY_SYMBOLS[currency]}{liability.outstanding.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Monthly EMI</p>
                      <p className="text-sm text-orange-600">{CURRENCY_SYMBOLS[currency]}{liability.emiAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Tenure</p>
                      <p className="text-sm">{monthsPaid} / {liability.tenure} months</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Repayment Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLiability ? 'Edit' : 'Add'} Liability</DialogTitle>
            <DialogDescription>
              {editingLiability ? 'Update' : 'Add'} your loan or liability details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Liability Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Home Loan - HDFC"
                required
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIABILITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Principal Amount</Label>
                <NumberInput
                  value={formData.principal}
                  onChange={(value) => setFormData({ ...formData, principal: value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label>Outstanding</Label>
                <NumberInput
                  value={formData.outstanding}
                  onChange={(value) => setFormData({ ...formData, outstanding: value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Interest Rate (%)</Label>
                <NumberInput
                  value={formData.interestRate}
                  onChange={(value) => setFormData({ ...formData, interestRate: value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label>Monthly EMI</Label>
                <NumberInput
                  value={formData.emiAmount}
                  onChange={(value) => setFormData({ ...formData, emiAmount: value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Tenure</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.tenure}
                    onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                    placeholder={formData.tenureUnit === 'years' ? '5' : '60'}
                    required
                    className="flex-1"
                  />
                  <Select 
                    value={formData.tenureUnit} 
                    onValueChange={(value: 'months' | 'years') => setFormData({ ...formData, tenureUnit: value })}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={calculateLoanDetails} className="flex-1">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate EMI & Outstanding
              </Button>
            </div>

            {accounts.length > 0 && (
              <div>
                <Label>Linked Account (Optional)</Label>
                <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.icon} {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingLiability ? 'Update' : 'Add'} Liability
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}