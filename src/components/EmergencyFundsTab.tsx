import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Switch } from './ui/switch';
import { Shield, Heart, FileText, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/numberFormat';

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

export function EmergencyFundsTab({ currency, expenses = [], accounts = [], onEmergencyFundUpdate }: EmergencyFundsTabProps) {
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
    toast.success(`Added ${formatCurrency(amount, currency)} to emergency fund!`);
  };

  const resetHealthForm = React.useCallback(() => {
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
  }, [setHealthFormData, setEditingHealth]);

  // Health Insurance handlers
  const handleHealthSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = new Date().getTime();
    const newInsurance: HealthInsurance = {
      id: editingHealth?.id || `health_${timestamp}`,
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
  }, [editingHealth, healthFormData, healthInsurances, setHealthInsurances, resetHealthForm, setIsHealthDialogOpen]);

  const resetTermForm = React.useCallback(() => {
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
  }, [setTermFormData, setEditingTerm]);

  // Term Insurance handlers
  const handleTermSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = new Date().getTime();
    const newInsurance: TermInsurance = {
      id: editingTerm?.id || `term_${timestamp}`,
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
  }, [editingTerm, termFormData, termInsurances, setTermInsurances, resetTermForm, setIsTermDialogOpen]);

  const progress = emergencyFund.targetAmount > 0
    ? (emergencyFund.currentAmount / emergencyFund.targetAmount) * 100
    : 0;

  const isGoalMet = progress >= 100;
  const progressStyle = { '--progress-width': `${Math.min(100, progress)}%` } as React.CSSProperties;

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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 pb-24">
      {/* Page Signature */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight leading-none mb-3">Safety Net</h2>
          <p className="text-slate-500 font-bold max-w-md">
            Build your financial fortress and manage your security assets.
          </p>
        </div>
        <Button
          onClick={() => {
            if ((window as any).showFundAllocation) {
              (window as any).showFundAllocation('emergency');
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Shield className="w-4 h-4 mr-2" />
          Allocate Capital
        </Button>
      </div>

      {/* Emergency Transaction Pulse */}
      {emergencyTransactions.length > 0 && (
        <Card className="p-8 bg-slate-900 border-white/5 rounded-[32px] border relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 blur-3xl opacity-5 -mr-16 -mt-16 group-hover:opacity-10 transition-opacity" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-105 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-100">Protection Pulse</h3>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1">Healthcare & Insurance Burn</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block mb-1">Recent Outflow</span>
              <p className="text-3xl font-black text-rose-400 tabular-nums leading-none">
                {formatCurrency(totalEmergencySpent, currency)}
              </p>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {emergencyTransactions.slice(0, 3).map((transaction, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group/item">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs opacity-50 font-black">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-slate-200 group-hover/item:text-blue-400 transition-colors">{transaction.description}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-xs font-black text-rose-400 tabular-nums">
                  -{formatCurrency(transaction.amount, currency)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Core Protection Assets */}
      <Card className={`p-8 bg-slate-900 border-white/5 rounded-[32px] border relative overflow-hidden group transition-all duration-500 ${isGoalMet ? ' ring-2 ring-emerald-500/50 shadow-2xl shadow-emerald-500/10' : ''}`}>
        <div className={`absolute top-0 right-0 w-48 h-48 blur-[100px] opacity-10 -mr-24 -mt-24 transition-opacity group-hover:opacity-20 ${isGoalMet ? 'bg-emerald-500' : 'bg-blue-500'}`} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-white/5 transition-all duration-500 group-hover:scale-105 ${isGoalMet ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {isGoalMet ? '🏰' : '🛡️'}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-100">Stability Reserve</h3>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1">
                Allocated for <span className="text-slate-300">{emergencyFund.targetMonths} Cycles</span> of operation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFundFormData({
                  monthlyExpenses: emergencyFund.monthlyExpenses.toString(),
                  targetMonths: emergencyFund.targetMonths.toString()
                });
                setIsFundDialogOpen(true);
              }}
              className="rounded-xl border border-white/5 hover:bg-white/5 text-slate-500 hover:text-white font-bold h-12 px-6"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Calibrate
            </Button>
            {emergencyFund.targetAmount > 0 && !isGoalMet && (
              <Button
                size="sm"
                onClick={() => setIsAddFundsDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-12 px-8 font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Inject Funds
              </Button>
            )}
          </div>
        </div>

        {emergencyFund.targetAmount > 0 ? (
          <div className="mt-12 space-y-6 relative z-10">
            <div className="flex justify-between items-end mb-2">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Current Capital</span>
                <p className={`text-4xl font-black tabular-nums transition-colors duration-500 ${isGoalMet ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {formatCurrency(emergencyFund.currentAmount, currency)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Goal Target</span>
                <p className="text-xl font-bold text-slate-500 tabular-nums">
                  {formatCurrency(emergencyFund.targetAmount, currency)}
                </p>
              </div>
            </div>

            <div className="relative h-6 bg-slate-800/50 rounded-full border border-white/5 overflow-hidden p-1">
              {(() => {
                const barProps = { style: progressStyle };
                return (
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out relative shadow-lg w-[var(--progress-width)] ${isGoalMet ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-500'}`}
                    {...barProps}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
              <span className={isGoalMet ? 'text-emerald-500 animate-pulse' : 'text-slate-600'}>
                {isGoalMet ? 'Fortress Secured' : 'Fortifying Reserve'}
              </span>
              <span className="text-slate-500">{Math.min(100, progress).toFixed(0)}% Completion</span>
            </div>
          </div>
        ) : (
          <div className="mt-10 py-12 text-center rounded-[40px] border border-dashed border-white/10 bg-slate-800/20 relative z-10">
            <AlertCircle className="w-16 h-16 mx-auto text-slate-700 mb-6" />
            <h4 className="text-xl font-black text-slate-300 mb-2">Reserve Uninitialized</h4>
            <p className="text-sm text-slate-500 font-bold mb-8 max-w-[280px] mx-auto">Establish your survival threshold to activate the safety features.</p>
            <Button
              onClick={() => setIsFundDialogOpen(true)}
              className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-600/20 rounded-2xl px-10 h-14 font-black"
            >
              <Shield className="w-4 h-4 mr-2" />
              Initialize Reserve
            </Button>
          </div>
        )}
      </Card>

      {/* Insurance Policies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Health Insurance */}
        <Card className="p-8 bg-slate-900 border-white/5 rounded-[32px] border relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500 blur-3xl opacity-5 -mr-12 -mt-12 group-hover:opacity-10 transition-opacity" />

          <div className={`flex items-center justify-between mb-8 relative z-10 ${healthInsurances.length === 0 ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 shadow-inner group-hover:scale-105 transition-transform">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-100">Health Security</h3>
            </div>
            <Button
              size="sm"
              onClick={() => {
                resetHealthForm();
                setIsHealthDialogOpen(true);
              }}
              className="rounded-xl border border-white/5 hover:bg-white/5 text-slate-500 hover:text-white font-bold h-10 px-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {healthInsurances.length === 0 ? (
            <div
              onClick={() => setIsHealthDialogOpen(true)}
              className="group cursor-pointer p-12 bg-slate-800/10 border-2 border-dashed border-slate-700/30 rounded-[24px] hover:border-slate-600/50 hover:bg-slate-800/20 transition-all duration-300 flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto border border-white/5 text-slate-600 opacity-50 group-hover:scale-105 transition-transform">
                <Heart className="w-8 h-8" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose text-center">
                No active health security.<br />Want to protect your stability?
              </p>
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              {healthInsurances.map(insurance => (
                <div key={insurance.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group/item">
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-100 truncate group-hover/item:text-red-400 transition-colors uppercase tracking-tight">{insurance.provider}</p>
                      <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">
                        Policy #{insurance.policyNumber}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
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
                        className="w-8 h-8 p-0 rounded-lg hover:bg-white/5 text-slate-400"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setHealthInsurances(healthInsurances.filter(h => h.id !== insurance.id));
                          toast.success('Health insurance deleted');
                        }}
                        className="w-8 h-8 p-0 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Max Coverage</p>
                      <p className="text-base font-black text-emerald-400 tabular-nums">
                        {formatCurrency(insurance.coverageAmount, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Commitment</p>
                      <p className="text-base font-black text-slate-100 tabular-nums">
                        {formatCurrency(insurance.premium, currency)} <span className="text-[10px] font-bold text-slate-600 uppercase">/ {insurance.frequency}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-700">
                    <span>Duration</span>
                    <span>Expires: {new Date(insurance.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Term Insurance */}
        <Card className="p-8 bg-slate-900 border-white/5 rounded-[32px] border relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500 blur-3xl opacity-5 -mr-12 -mt-12 group-hover:opacity-10 transition-opacity" />

          <div className={`flex items-center justify-between mb-8 relative z-10 ${termInsurances.length === 0 ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 shadow-inner group-hover:scale-105 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-100">Capital Protection</h3>
            </div>
            <Button
              size="sm"
              onClick={() => {
                resetTermForm();
                setIsTermDialogOpen(true);
              }}
              className="rounded-xl border border-white/5 hover:bg-white/5 text-slate-500 hover:text-white font-bold h-10 px-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {termInsurances.length === 0 ? (
            <div
              onClick={() => setIsTermDialogOpen(true)}
              className="group cursor-pointer p-12 bg-slate-800/10 border-2 border-dashed border-slate-700/30 rounded-[24px] hover:border-slate-600/50 hover:bg-slate-800/20 transition-all duration-300 flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto border border-white/5 text-slate-600 opacity-50 group-hover:scale-105 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose text-center">
                No term security layers.<br />Want to see your family secured?
              </p>
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              {termInsurances.map(insurance => (
                <div key={insurance.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group/item">
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-100 truncate group-hover/item:text-purple-400 transition-colors uppercase tracking-tight">{insurance.provider}</p>
                      <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">
                        Policy #{insurance.policyNumber}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
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
                        className="w-8 h-8 p-0 rounded-lg hover:bg-white/5 text-slate-400"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTermInsurances(termInsurances.filter(t => t.id !== insurance.id));
                          toast.success('Term insurance deleted');
                        }}
                        className="w-8 h-8 p-0 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Face Value</p>
                      <p className="text-base font-black text-purple-400 tabular-nums">
                        {formatCurrency(insurance.coverageAmount, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Periodic Fuel</p>
                      <p className="text-base font-black text-slate-100 tabular-nums">
                        {formatCurrency(insurance.premium, currency)} <span className="text-[10px] font-bold text-slate-600 uppercase">/ {insurance.frequency}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-700">
                    <span>Horizon</span>
                    <span>Expires: {new Date(insurance.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Setup Emergency Fund Dialog */}
      <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
        <DialogContent className="max-w-md bg-[#020408] border-white/10 text-white rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">Calibrate Stability Reserve</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold">
              Define your financial survival parameters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSetupFund} className="space-y-6 mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="monthlyOperationalBurn" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Monthly Operational Burn</Label>
              <Input
                id="monthlyOperationalBurn"
                name="monthlyExpenses"
                type="number"
                step="0.01"
                value={fundFormData.monthlyExpenses}
                onChange={(e) => setFundFormData({ ...fundFormData, monthlyExpenses: e.target.value })}
                placeholder="Enter average monthly costs"
                required
                className="bg-white/5 border-white/5 rounded-xl h-14"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stabilityThreshold" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Stability Threshold</Label>
              <Select
                value={fundFormData.targetMonths}
                onValueChange={(value) => setFundFormData({ ...fundFormData, targetMonths: value })}
              >
                <SelectTrigger id="stabilityThreshold" name="targetMonths" className="bg-white/5 border-white/5 rounded-xl h-14">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="3">3 Months (Minimal Security)</SelectItem>
                  <SelectItem value="6">6 Months (Recommended)</SelectItem>
                  <SelectItem value="9">9 Months (Robust)</SelectItem>
                  <SelectItem value="12">12 Months (Ironclad)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Calculated Target Objective</p>
              <p className="text-3xl font-black text-white tabular-nums">
                {formatCurrency(parseFloat(fundFormData.monthlyExpenses || '0') * parseInt(fundFormData.targetMonths), currency)}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsFundDialogOpen(false)} className="flex-1 h-14 font-black text-slate-500 hover:bg-white/5 rounded-2xl">
                Abort
              </Button>
              <Button type="submit" className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20">
                Deploy Target
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
        <DialogContent className="max-w-md bg-[#020408] border-white/10 text-white rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">Inject Capital</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold">
              Fortify your stability reserve with additional liquidity.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFunds} className="space-y-6 mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="injectionAmount" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Injection Amount</Label>
              <Input
                id="injectionAmount"
                name="amount"
                type="number"
                step="0.01"
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                required
                className="bg-white/5 border-white/5 rounded-xl h-14 text-white text-lg font-black"
                autoComplete="off"
              />
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <Switch
                id="deductFromAccount"
                checked={deductFromAccount}
                onCheckedChange={(checked: boolean) => {
                  setDeductFromAccount(checked);
                  if (!checked) setSelectedAccountId('');
                }}
              />
              <Label htmlFor="deductFromAccount" className="text-xs font-bold text-slate-300 cursor-pointer">
                Deduct from system wallet balance
              </Label>
            </div>

            {deductFromAccount && accounts.length > 0 && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <Label htmlFor="sourceWallet" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Source Wallet</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger id="sourceWallet" name="accountId" className="bg-white/5 border-white/5 rounded-xl h-14">
                    <SelectValue placeholder="Select Capital Source" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <span>{account.icon}</span>
                          <span className="font-bold">{account.name}</span>
                          <span className="text-[10px] text-slate-500 font-black">
                            ({formatCurrency(account.balance, currency)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {deductFromAccount && accounts.length === 0 && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-[10px] font-bold text-rose-300 uppercase leading-relaxed">
                  No compatible system wallets detected. Link a wallet to enable balance deduction.
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsAddFundsDialogOpen(false)} className="flex-1 h-14 font-black text-slate-500 hover:bg-white/5 rounded-2xl">
                Discard
              </Button>
              <Button type="submit" className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20">
                Confirm Injection
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Health Insurance Dialog */}
      <Dialog open={isHealthDialogOpen} onOpenChange={setIsHealthDialogOpen}>
        <DialogContent className="max-w-md bg-slate-950 border-white/10 text-white rounded-[32px] p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">{editingHealth ? 'Refine' : 'New'} Health Security</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold">
              Configure parameters for medical capital protection.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleHealthSubmit} className="space-y-5 mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="health-provider" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Provider Intelligence</Label>
              <Input
                id="health-provider"
                name="provider"
                value={healthFormData.provider}
                onChange={(e) => setHealthFormData({ ...healthFormData, provider: e.target.value })}
                placeholder="e.g. Blue Cross"
                required
                className="bg-white/5 border-white/5 rounded-xl h-12"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="health-policy" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Policy ID</Label>
              <Input
                id="health-policy"
                name="policyNumber"
                value={healthFormData.policyNumber}
                onChange={(e) => setHealthFormData({ ...healthFormData, policyNumber: e.target.value })}
                placeholder="Enter unique identification"
                required
                className="bg-white/5 border-white/5 rounded-xl h-12"
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="health-coverage" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Face Coverage</Label>
                <Input
                  id="health-coverage"
                  name="coverageAmount"
                  type="number"
                  value={healthFormData.coverageAmount}
                  onChange={(e) => setHealthFormData({ ...healthFormData, coverageAmount: e.target.value })}
                  placeholder="0.00"
                  required
                  className="bg-white/5 border-white/5 rounded-xl h-12"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="health-premium" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Premium Fuel</Label>
                <Input
                  id="health-premium"
                  name="premium"
                  type="number"
                  value={healthFormData.premium}
                  onChange={(e) => setHealthFormData({ ...healthFormData, premium: e.target.value })}
                  placeholder="0.00"
                  required
                  className="bg-white/5 border-white/5 rounded-xl h-12"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="health-frequency" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Renewal Cycle</Label>
              <Select
                value={healthFormData.frequency}
                onValueChange={(value: any) => setHealthFormData({ ...healthFormData, frequency: value })}
              >
                <SelectTrigger id="health-frequency" name="frequency" className="bg-white/5 border-white/5 rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="monthly">Monthly Cycle</SelectItem>
                  <SelectItem value="quarterly">Quarterly Cycle</SelectItem>
                  <SelectItem value="yearly">Yearly Cycle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="health-start" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Activation Date</Label>
                <Input
                  id="health-start"
                  name="startDate"
                  type="date"
                  value={healthFormData.startDate}
                  onChange={(e) => setHealthFormData({ ...healthFormData, startDate: e.target.value })}
                  required
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-xs"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="health-expiry" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Expiry Horizon</Label>
                <Input
                  id="health-expiry"
                  name="expiryDate"
                  type="date"
                  value={healthFormData.expiryDate}
                  onChange={(e) => setHealthFormData({ ...healthFormData, expiryDate: e.target.value })}
                  required
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-xs"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsHealthDialogOpen(false)} className="flex-1 h-12 font-black text-slate-500 hover:bg-white/5 rounded-xl">
                Abort
              </Button>
              <Button type="submit" className="flex-1 h-12 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-600/20">
                {editingHealth ? 'Commit Update' : 'Initialize security'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Term Insurance Dialog */}
      <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
        <DialogContent className="max-w-md bg-slate-950 border-white/10 text-white rounded-[32px] p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">{editingTerm ? 'Refine' : 'New'} Capital Protection</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold">
              Establish financial safety plans.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTermSubmit} className="space-y-5 mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="term-provider" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Agency Identification</Label>
              <Input
                id="term-provider"
                name="provider"
                value={termFormData.provider}
                onChange={(e) => setTermFormData({ ...termFormData, provider: e.target.value })}
                placeholder="e.g. Prudential Core"
                required
                className="bg-white/5 border-white/5 rounded-xl h-12"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="term-policy" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Policy Number</Label>
              <Input
                id="term-policy"
                name="policyNumber"
                value={termFormData.policyNumber}
                onChange={(e) => setTermFormData({ ...termFormData, policyNumber: e.target.value })}
                placeholder="Enter unique identification"
                required
                className="bg-white/5 border-white/5 rounded-xl h-12"
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="term-coverage" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Face Valuation</Label>
                <Input
                  id="term-coverage"
                  name="coverageAmount"
                  type="number"
                  value={termFormData.coverageAmount}
                  onChange={(e) => setTermFormData({ ...termFormData, coverageAmount: e.target.value })}
                  placeholder="0.00"
                  required
                  className="bg-white/5 border-white/5 rounded-xl h-12"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="term-premium" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Periodic Fuel</Label>
                <Input
                  id="term-premium"
                  name="premium"
                  type="number"
                  value={termFormData.premium}
                  onChange={(e) => setTermFormData({ ...termFormData, premium: e.target.value })}
                  placeholder="0.00"
                  required
                  className="bg-white/5 border-white/5 rounded-xl h-12"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="term-frequency" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Renewal Cycle</Label>
              <Select
                value={termFormData.frequency}
                onValueChange={(value: any) => setTermFormData({ ...termFormData, frequency: value })}
              >
                <SelectTrigger id="term-frequency" name="frequency" className="bg-white/5 border-white/5 rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="monthly">Monthly Cycle</SelectItem>
                  <SelectItem value="quarterly">Quarterly Cycle</SelectItem>
                  <SelectItem value="yearly">Yearly Cycle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="term-start" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Inception Date</Label>
                <Input
                  id="term-start"
                  name="startDate"
                  type="date"
                  value={termFormData.startDate}
                  onChange={(e) => setTermFormData({ ...termFormData, startDate: e.target.value })}
                  required
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-xs"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="term-expiry" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Maturity Horizon</Label>
                <Input
                  id="term-expiry"
                  name="expiryDate"
                  type="date"
                  value={termFormData.expiryDate}
                  onChange={(e) => setTermFormData({ ...termFormData, expiryDate: e.target.value })}
                  required
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-xs"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsTermDialogOpen(false)} className="flex-1 h-12 font-black text-slate-500 hover:bg-white/5 rounded-xl">
                Abort
              </Button>
              <Button type="submit" className="flex-1 h-12 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl shadow-lg shadow-purple-600/20">
                {editingTerm ? 'Commit Refinement' : 'Create Policy'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
