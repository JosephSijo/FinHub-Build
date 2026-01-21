import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';
import { Label } from './ui/label';
import { MeshBackground } from './ui/MeshBackground';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { CreditCard, Plus, Pencil, Trash2, Calculator } from 'lucide-react';
import { Liability } from '../types';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/numberFormat';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { CyberButton } from './ui/CyberButton';
import { calculateLoanDetails as getLoanDetails } from '../utils/financeCalculations';




const LIABILITY_TYPES = [
  { value: 'home_loan', label: '🏠 Home Loan', icon: '🏠' },
  { value: 'car_loan', label: '🚗 Car Loan', icon: '🚗' },
  { value: 'personal_loan', label: '💳 Personal Loan', icon: '💳' },
  { value: 'credit_card', label: '💳 Credit Card', icon: '💳' },
  { value: 'education_loan', label: '🎓 Education Loan', icon: '🎓' },
  { value: 'other', label: '📋 Other', icon: '📋' }
];

interface LiabilityTabProps {
  currency: string;
  expenses?: any[];
  accounts?: any[];
  debts?: any[];
  liabilities?: Liability[];
}

export function LiabilityTab({ currency, expenses = [], accounts = [], debts = [], liabilities: propLiabilities }: LiabilityTabProps) {
  const {
    liabilities: contextLiabilities,
    isLoading: isGlobalLoading,
    createLiability,
    updateLiability,
    deleteLiability
  } = useFinance();

  const liabilities = propLiabilities || contextLiabilities || [];

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'institutional' | 'cards' | 'personal'>('all');

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
        await updateLiability(editingLiability.id, liabilityData);
      } else {
        await createLiability({ ...liabilityData, createdAt: new Date().toISOString() });
      }
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error saving liability:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this liability?')) return;
    await deleteLiability(id);
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
    const principalVal = parseFloat(formData.principal);
    const rateVal = parseFloat(formData.interestRate);
    const tenureVal = parseInt(formData.tenure);
    const startStr = formData.startDate;

    if (!principalVal || !rateVal || !tenureVal) {
      toast.error('Please enter Principal, Interest Rate, and Tenure first');
      return;
    }

    const tMonths = formData.tenureUnit === 'years' ? tenureVal * 12 : tenureVal;

    const details = getLoanDetails(principalVal, rateVal, tMonths, startStr);

    setFormData({
      ...formData,
      outstanding: details.outstanding.toString(),
      emiAmount: details.emi.toString()
    });

    toast.success(`Calculated (Reducing Balance): EMI ${formatCurrency(details.emi, currency)}, Outstanding ${formatCurrency(details.outstanding, currency)}`);
  };

  const calculateMonthsPaid = (liability: Liability) => {
    const lStart = new Date(liability.startDate);
    const lNow = new Date();

    if (lStart > lNow) return 0;

    let mElapsed = 0;
    const yD = lNow.getFullYear() - lStart.getFullYear();
    const mD = lNow.getMonth() - lStart.getMonth();
    const dD = lNow.getDate() - lStart.getDate();

    mElapsed = yD * 12 + mD;
    if (dD < 0) mElapsed--;
    mElapsed = Math.max(0, mElapsed);

    return Math.min(mElapsed, liability.tenure);
  };

  const totalEMI = liabilities.reduce((sum, l) => sum + l.emiAmount, 0);

  // Unify Data
  const institutionalLoans = liabilities.filter(l => l.type !== 'credit_card');
  const creditCards = liabilities.filter(l => l.type === 'credit_card');
  const personalIOUs = debts.filter(d => d.type === 'borrowed' && d.status === 'pending');

  const filteredItems = (() => {
    switch (activeCategory) {
      case 'institutional': return institutionalLoans.map(l => ({ ...l, viewType: 'institutional' }));
      case 'cards': return creditCards.map(l => ({ ...l, viewType: 'institutional' }));
      case 'personal': return personalIOUs.map(d => ({
        id: d.id,
        name: d.personName,
        outstanding: d.amount,
        principal: d.amount,
        interestRate: d.interestRate || 0,
        emiAmount: 0,
        tenure: 0,
        startDate: d.date,
        type: 'personal_loan',
        viewType: 'personal',
        originalDebt: d
      }));
      default: return [
        ...institutionalLoans.map(l => ({ ...l, viewType: 'institutional' })),
        ...creditCards.map(l => ({ ...l, viewType: 'institutional' })),
        ...personalIOUs.map(d => ({
          id: d.id,
          name: d.personName,
          outstanding: d.amount,
          principal: d.amount,
          interestRate: d.interestRate || 0,
          emiAmount: 0,
          tenure: 0,
          startDate: d.date,
          type: 'personal_loan',
          viewType: 'personal',
          originalDebt: d
        }))
      ];
    }
  })();

  // Get EMI-related transactions from expenses
  const emiTransactions = expenses.filter((e: any) =>
    e.category === 'EMI' ||
    e.tags?.includes('emi') ||
    e.tags?.includes('loan') ||
    (e.description && (
      e.description.toLowerCase().includes('emi') ||
      e.description.toLowerCase().includes('loan payment')
    ))
  ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const totalEMIPaid = emiTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Mini Dashboard */}
      {emiTransactions.length > 0 && (
        <div className="frosted-plate rounded-3xl border border-white/5 p-4 bg-transparent relative overflow-hidden">
          <MeshBackground variant="spending" />
          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#0A84FF]/10 border border-[#0A84FF]/20 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#0A84FF]" />
                </div>
                <div>
                  <h3 className="text-label text-[9px] mb-1">Liability Flow</h3>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Institutional Debt Streams
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-right">
                  <p className="text-label text-[8px] mb-1 opacity-60 uppercase font-bold tracking-widest">Total Monthly EMI</p>
                  <p className="text-balance text-xl text-rose-500 font-black tabular-nums font-mono">
                    {formatCurrency(totalEMI, currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-label text-[8px] mb-1 opacity-60">Capital Outflow</p>
                  <p className="text-balance text-xl text-[#FF9F0A]">
                    {formatCurrency(totalEMIPaid, currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent EMI Transactions */}
            <div className="pt-4 border-t border-white/5">
              <p className="text-label text-[8px] mb-3 opacity-60">Transactional History:</p>
              <div className="space-y-2">
                {emiTransactions.map((transaction: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{transaction.description}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-balance text-sm text-[#FF453A] whitespace-nowrap ml-3">
                      -{formatCurrency(transaction.amount, currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - Standardized Layout */}
      <div className="flex items-center justify-between px-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight truncate">Liabilities & Loans</h2>
          <p className="text-xs text-slate-500 mt-1 truncate">Manage institutional loans and EMIs</p>
        </div>
        <CyberButton
          onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
          icon={Plus}
          className="h-12"
        >
          Add Liability
        </CyberButton>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-2 overflow-x-auto no-scrollbar py-2">
        {[
          { id: 'all', label: 'All Debt' },
          { id: 'institutional', label: 'Institutional' },
          { id: 'cards', label: 'Cards' },
          { id: 'personal', label: 'Personal' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={`px-5 py-2.5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all whitespace-nowrap border ${activeCategory === tab.id
              ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liabilities List */}
      <div>
        <h3 className={`text-label text-[10px] mb-4 ${liabilities.length === 0 ? 'opacity-40' : ''}`}>Institutional Debt Portfolio</h3>

        {isGlobalLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-5 bg-slate-800/20 border border-white/5 rounded-[24px] animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-800 rounded w-1/4" />
                    <div className="h-3 bg-slate-800 rounded w-1/3" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-12 bg-slate-800/50 rounded-xl" />
                  ))}
                </div>
                <div className="h-2 bg-slate-800 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            onClick={() => setIsAddDialogOpen(true)}
            className="group cursor-pointer p-12 bg-black border-2 border-dashed border-white/5 sq-2xl hover:border-rose-500/30 hover:bg-white/5 transition-all duration-500 flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-16 h-16 sq-md bg-white/5 flex items-center justify-center border border-white/10 opacity-50 group-hover:scale-105 group-hover:opacity-100 transition-all text-slate-500 group-hover:text-rose-400">
              <CreditCard className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-slate-200 font-black text-xs uppercase tracking-[0.2em]">No {activeCategory !== 'all' ? activeCategory : ''} Entries</h3>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-2 font-bold opacity-60">Add your first debt account</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item: any) => {
              const monthsPaid = item.viewType === 'institutional' ? calculateMonthsPaid(item) : 0;
              const progress = item.principal > 0
                ? Math.max(0, ((item.principal - item.outstanding) / item.principal) * 100)
                : 0;
              const typeInfo = item.viewType === 'institutional'
                ? LIABILITY_TYPES.find(t => t.value === item.type)
                : { label: '👤 Personal IOU', icon: '👤' };

              const isPersonal = item.viewType === 'personal';

              return (
                <div
                  key={item.id}
                  className="bg-black sq-xl border border-white/5 p-6 group relative overflow-hidden transition-all duration-500 hover:border-rose-500/30"
                >
                  <div className="absolute inset-0 bg-white/[0.01] group-hover:bg-rose-500/[0.04] transition-all duration-500" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 sq-md flex items-center justify-center group-hover:border-rose-500/30 transition-all duration-500">
                          <span className="text-2xl">{typeInfo?.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-xs uppercase tracking-tight text-white truncate">{item.name}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {typeInfo?.label.split(' ')[1] || typeInfo?.label} // {item.interestRate}% RATE
                          </p>
                        </div>
                      </div>
                      {!isPersonal && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="w-8 h-8 p-0 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="w-8 h-8 p-0 text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div className="space-y-1.5">
                        <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest opacity-60">Outstanding</p>
                        <p className="text-sm font-black text-rose-500 tabular-nums font-mono">
                          {formatCurrency(item.outstanding, currency)}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest opacity-60">Monthly Flow</p>
                        <p className="text-sm font-black text-orange-500 tabular-nums font-mono">
                          {formatCurrency(item.emiAmount, currency)}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest opacity-60">Principal</p>
                        <p className="text-xs font-bold text-slate-400 tabular-nums font-mono">{formatCurrency(item.principal, currency)}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest opacity-60">Status</p>
                        <p className="text-xs font-bold text-slate-400 tracking-tighter font-mono">
                          {isPersonal ? (
                            <span className="text-emerald-500">ACTIVE IOU</span>
                          ) : (
                            <>{monthsPaid} <span className="text-[10px] opacity-40">/ {item.tenure}</span></>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-gradient-to-r from-rose-600 to-orange-500 shadow-[0_0_12px_rgba(225,29,72,0.4)]"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="text-rose-500/60">
                          {Math.min(100, progress).toFixed(0)}% RECLAIMED
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black border-white/5 text-white p-8 custom-scrollbar sq-2xl">
          <DialogHeader>
            <DialogTitle>{editingLiability ? 'Edit' : 'Add'} Liability</DialogTitle>
            <DialogDescription>
              {editingLiability ? 'Update' : 'Add'} your loan or liability details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <Label htmlFor="liability-name" className="text-label text-[10px] mb-3 block">Liability Name</Label>
              <Input
                id="liability-name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Home Loan - HDFC"
                className="bg-black border-white/5 sq-md h-14 text-white placeholder:text-slate-600 focus:border-[#0A84FF]/50 transition-colors"
                required
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="liability-type" className="text-label text-[10px] mb-3 block">Debt Category</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="liability-type" name="type" className="bg-black border-white/5 sq-md h-14 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/5 text-white">
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
                <Label htmlFor="liability-principal" className="text-label text-[10px] mb-3 block">Principal Amount</Label>
                <NumberInput
                  id="liability-principal"
                  name="principal"
                  value={formData.principal}
                  onChange={(value) => setFormData({ ...formData, principal: value })}
                  className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white"
                  placeholder="0.00"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="liability-outstanding" className="text-label text-[10px] mb-3 block">Outstanding</Label>
                <NumberInput
                  id="liability-outstanding"
                  name="outstanding"
                  value={formData.outstanding}
                  onChange={(value) => setFormData({ ...formData, outstanding: value })}
                  className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white"
                  placeholder="0.00"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="liability-rate" className="text-label text-[10px] mb-3 block">Interest Rate (%)</Label>
                <NumberInput
                  id="liability-rate"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={(value) => setFormData({ ...formData, interestRate: value })}
                  className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white"
                  placeholder="0.00"
                  required
                  autoComplete="off"
                  allowDecimals={true}
                  maxDecimals={2}
                />
              </div>
              <div>
                <Label htmlFor="liability-emi" className="text-label text-[10px] mb-3 block">Monthly EMI</Label>
                <NumberInput
                  id="liability-emi"
                  name="emiAmount"
                  value={formData.emiAmount}
                  onChange={(value) => setFormData({ ...formData, emiAmount: value })}
                  className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white"
                  placeholder="0.00"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Label htmlFor="liability-start-date" className="text-label text-[10px] mb-3 block">Actual EMI Due Date (Anchor)</Label>
              <Input
                id="liability-start-date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white"
                required
              />
              <div>
                <Label htmlFor="liability-tenure" className="text-label text-[10px] mb-3 block">Tenure</Label>
                <div className="flex gap-2">
                  <Input
                    id="liability-tenure"
                    name="tenure"
                    type="number"
                    value={formData.tenure}
                    onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                    placeholder={formData.tenureUnit === 'years' ? '5' : '60'}
                    required
                    className="flex-1 bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white"
                    autoComplete="off"
                  />
                  <Select
                    value={formData.tenureUnit}
                    onValueChange={(value: 'months' | 'years') => setFormData({ ...formData, tenureUnit: value })}
                  >
                    <SelectTrigger id="liability-tenure-unit" name="tenureUnit" className="w-[110px] bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C1C1E] border-[#38383A] text-white">
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={calculateLoanDetails}
                className="w-full h-12 rounded-xl border-[#38383A] text-slate-400 hover:bg-[#0A84FF]/10 hover:text-[#0A84FF] transition-all"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Auto-Calculate EMI & Outstanding
              </Button>
            </div>

            {accounts.length > 0 && (
              <div>
                <Label htmlFor="liability-account" className="text-label text-[10px] mb-3 block">Linked Account (Optional)</Label>
                <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                  <SelectTrigger id="liability-account" name="accountId" className="bg-[#2C2C2E] border-[#38383A] rounded-xl h-14 text-white">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1C1E] border-[#38383A] text-white">
                    <SelectItem value="none">Standalone (No Linking)</SelectItem>
                    {accounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.icon} {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="flex-1 h-12 rounded-xl border-[#38383A] text-slate-400 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-xl bg-[#0A84FF] hover:bg-[#007AFF] text-white border-none shadow-lg shadow-blue-600/10 font-bold"
              >
                {editingLiability ? 'Update' : 'Initialize'} Liability
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}