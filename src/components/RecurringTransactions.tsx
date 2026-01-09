import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Plus, Trash2, RefreshCw, Calendar, Sparkles, ArrowUpRight, Wallet, History } from 'lucide-react';
import { MONEY_OUT_CATEGORIES, RecurringTransaction } from '../types';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/numberFormat';
import { MeshBackground } from './ui/MeshBackground';

export function RecurringTransactions() {
  const {
    accounts,
    currency,
    recurringTransactions: recurring,
    createRecurringTransaction,
    deleteRecurringTransaction,
    processRecurringTransactions
  } = useFinance();

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly'
    };
    return labels[freq] || freq;
  };

  // Helper component for categorized lists
  const RecurringCard = ({ rec }: { rec: RecurringTransaction }) => {
    const account = accounts.find(a => a.id === rec.accountId);
    return (
      <Card className="p-6 bg-slate-900/40 border-white/5 rounded-[28px] border hover:bg-slate-900/60 transition-all duration-300 group relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-5 -mr-12 -mt-12 transition-opacity group-hover:opacity-20 ${rec.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 border border-white/5 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform text-2xl ${rec.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
              {rec.type === 'income' ? '💰' : '💸'}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-100 truncate flex items-center gap-2">
                {rec.description || rec.source}
              </h3>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-600 mt-1">
                {getFrequencyLabel(rec.frequency)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteRecurringTransaction(rec.id)}
            className="w-10 h-10 p-0 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 text-slate-700 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-600 mb-1">Commitment</span>
              <span className={`text-2xl font-black tabular-nums leading-none ${rec.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                {rec.type === 'income' ? '+' : '-'}{formatCurrency(rec.amount, currency)}
              </span>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-600 mb-1">Wallet</span>
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                {account?.icon} {account?.name}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-wider">Timeline</span>
              </div>
              <div className="text-[10px] font-bold text-slate-300">
                {new Date(rec.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                {rec.endDate ? ` — ${new Date(rec.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` : ' — Ongoing'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {rec.category && (
                <div className="bg-slate-800/50 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 border border-white/5">
                  {rec.category}
                </div>
              )}
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-inner">
                {account?.icon || '🏦'}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const [formData, setFormData] = useState({
    type: 'expense' as 'expense' | 'income',
    description: '',
    source: '',
    amount: '',
    category: '',
    accountId: accounts.length > 0 ? accounts[0].id : '',
    frequency: 'monthly' as RecurringTransaction['frequency'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    tags: [] as string[]
  });

  const handleCreateRecurring = async () => {
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

    await createRecurringTransaction(data);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    await processRecurringTransactions();
    setIsProcessing(false);
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



  // Filter out zero/null amount transactions
  const filteredRecurring = recurring.filter(r => r.amount && r.amount > 0);

  const getCategorizedData = () => {
    const loans = filteredRecurring.filter(r => r.category === 'EMI' || r.description?.toLowerCase().includes('loan'));
    const subscriptions = filteredRecurring.filter(r =>
      r.category === 'Subscription' ||
      r.description?.toLowerCase().includes('subscription') ||
      ['netflix', 'spotify', 'prime', 'youtube', 'apple', 'hulu', 'disney', 'google'].some(kw =>
        r.description?.toLowerCase().includes(kw)
      )
    );
    const incomes = filteredRecurring.filter(r => r.type === 'income');
    const others = filteredRecurring.filter(r =>
      !loans.some(l => l.id === r.id) &&
      !subscriptions.some(s => s.id === r.id) &&
      !incomes.some(i => i.id === r.id)
    );

    return { loans, subscriptions, incomes, others };
  };

  const categorized = getCategorizedData();

  const getAIInsights = () => {
    const calculateMonthly = (r: RecurringTransaction) => {
      const amt = r.amount || 0;
      if (r.frequency === 'monthly') return amt;
      if (r.frequency === 'yearly') return amt / 12;
      if (r.frequency === 'weekly') return amt * 4;
      return amt * 30; // daily
    };

    const loanTotal = categorized.loans.reduce((sum, r) => sum + calculateMonthly(r), 0);
    const subTotal = categorized.subscriptions.reduce((sum, r) => sum + calculateMonthly(r), 0);
    const incomeTotal = categorized.incomes.reduce((sum, r) => sum + calculateMonthly(r), 0);
    const otherTotal = categorized.others.reduce((sum, r) => sum + calculateMonthly(r), 0);

    const totalOutflow = loanTotal + subTotal + otherTotal;
    const netMonthly = incomeTotal - totalOutflow;

    // Health Score calculation: Ratio of surplus to total income
    const healthScore = incomeTotal > 0
      ? Math.max(0, Math.min(100, (netMonthly / incomeTotal) * 100))
      : 0;

    return {
      loanTotal,
      subTotal,
      incomeTotal,
      otherTotal,
      totalOutflow,
      netMonthly,
      healthScore,
      totalActive: filteredRecurring.length
    };
  };

  const insights = getAIInsights();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Summary Dashboard Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-[32px] border-white/10 shadow-2xl p-8">
        <MeshBackground variant="spending" className="opacity-50" />
        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
          <History className="w-32 h-32" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 text-center md:text-left">
            <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">Monthly Leftover Cash</p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums mb-2">
              {insights.netMonthly >= 0 ? '+' : ''}{formatCurrency(insights.netMonthly, currency)}
              <span className="text-xl text-white/50 ml-2 font-medium italic">/month</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Loan EMIs</p>
              <span className="font-bold text-lg text-rose-300">-{formatCurrency(insights.loanTotal, currency)}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Subscriptions</p>
              <span className="font-bold text-lg text-indigo-200">-{formatCurrency(insights.subTotal, currency)}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Recur. Income</p>
              <span className="font-bold text-lg text-emerald-400">+{formatCurrency(insights.incomeTotal, currency)}</span>
            </div>
          </div>
        </div>

      </Card>

      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sticky top-0 z-30 py-2 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Commitment Stream</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleProcess}
            disabled={isProcessing || recurring.length === 0}
            className="flex-1 sm:flex-initial rounded-xl border border-white/5 hover:bg-slate-900/40 font-bold text-slate-400 hover:text-slate-100 px-4 h-10 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="sm"
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 h-10 font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* AI Insights Bar */}
      {recurring.length > 0 && (
        <div className="px-4">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5">Net Monthly Flow</p>
                <h4 className={`text-lg font-black tabular-nums leading-none ${insights.netMonthly >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {insights.netMonthly >= 0 ? '+' : ''}{formatCurrency(insights.netMonthly, currency)}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-6">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-black text-slate-600">Shadow Health</p>
                <div className="flex items-center gap-2">
                  <span className={`font-black text-lg tabular-nums ${insights.healthScore > 60 ? 'text-emerald-400' :
                    insights.healthScore > 30 ? 'text-indigo-400' : 'text-rose-400'
                    }`}>
                    {Math.round(insights.healthScore)}%
                  </span>
                  <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-tight text-slate-400">
                      {insights.healthScore >= 80 ? 'Elite' :
                        insights.healthScore >= 60 ? 'Strong' :
                          insights.healthScore >= 40 ? 'Stable' :
                            insights.healthScore >= 20 ? 'Warning' : 'Critical'}
                    </span>
                  </div>
                  <div className="flex gap-0.5 ml-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`w-1.5 h-3 rounded-full transition-colors duration-500 ${(insights.healthScore / 20) >= i
                          ? (insights.healthScore > 60 ? 'bg-emerald-500' : insights.healthScore > 30 ? 'bg-indigo-500' : 'bg-rose-500')
                          : 'bg-slate-800'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
                className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl font-bold"
              >
                {showInsights ? 'Hide Analysis' : 'Show Analysis'}
              </Button>
            </div>
          </div>

          {showInsights && (
            <div className="mt-4 animate-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900/40 border-white/5 p-4 rounded-2xl">
                <div className="flex items-center gap-3 mb-2 opacity-50">
                  <Wallet className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Outflow</span>
                </div>
                <p className="text-xl font-black text-rose-400">{formatCurrency(insights.totalOutflow, currency)}</p>
              </Card>
              <Card className="bg-slate-900/40 border-white/5 p-4 rounded-2xl">
                <div className="flex items-center gap-3 mb-2 opacity-50">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Inflow</span>
                </div>
                <p className="text-xl font-black text-emerald-400">{formatCurrency(insights.incomeTotal, currency)}</p>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 pb-20 space-y-12">
        {filteredRecurring.length === 0 ? (
          <Card className="py-24 text-center bg-slate-800/20 rounded-[40px] border border-dashed border-white/10">
            <Calendar className="w-20 h-20 mx-auto text-slate-700 mb-6" />
            <h3 className="text-2xl font-black text-slate-200 mb-3">No Active Commitments</h3>
            <p className="text-sm text-slate-500 font-bold mb-10 max-w-[320px] mx-auto leading-relaxed">
              Set up your subscriptions, EMIs, and monthly income to unlock deep financial insights.
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-600/20 rounded-2xl px-10 h-14 font-black"
            >
              <Plus className="w-5 h-5 mr-3" />
              Add First Commitment
            </Button>
          </Card>
        ) : (
          <>
            {/* Category: Income */}
            {categorized.incomes.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">Recurring Income</h3>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black">{categorized.incomes.length} SOURCE(S)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categorized.incomes.map((rec, idx) => <RecurringCard key={`${rec.id}-${idx}`} rec={rec} />)}
                </div>
              </div>
            )}

            {/* Category: Loans */}
            {categorized.loans.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-rose-500 pl-4 py-1">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">Loan EMIs</h3>
                  <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded text-[10px] font-black">{categorized.loans.length} COMMITMENT(S)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categorized.loans.map((rec, idx) => <RecurringCard key={`${rec.id}-${idx}`} rec={rec} />)}
                </div>
              </div>
            )}

            {/* Category: Subscriptions */}
            {categorized.subscriptions.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4 py-1">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">Active Subscriptions</h3>
                  <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-black">{categorized.subscriptions.length} SERVICE(S)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categorized.subscriptions.map((rec, idx) => <RecurringCard key={`${rec.id}-${idx}`} rec={rec} />)}
                </div>
              </div>
            )}

            {/* Category: Others */}
            {categorized.others.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-slate-500 pl-4 py-1">
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">Other Commitments</h3>
                  <span className="bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded text-[10px] font-black">{categorized.others.length} ITEM(S)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categorized.others.map((rec, idx) => <RecurringCard key={`${rec.id}-${idx}`} rec={rec} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md bg-slate-950 border-white/10 text-white rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">Create New Commitment</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold">
              Automate your financial shadow-wallets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.type === 'income' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                onClick={() => setFormData({ ...formData, type: 'income' })}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl mb-2">💰</div>
                <p className="text-xs font-black uppercase text-white">Money In</p>
                <p className="text-[10px] text-emerald-400 font-bold">Salary / Gift</p>
              </div>
              <div
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.type === 'expense' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl mb-2">💸</div>
                <p className="text-xs font-black uppercase text-white">Money Out</p>
                <p className="text-[10px] text-indigo-400 font-bold">Rent / Sub</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="group">
                <Label htmlFor="recurring-name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Commitment Name</Label>
                <Input
                  id="recurring-name"
                  name="description"
                  value={formData.type === 'expense' ? formData.description : formData.source}
                  onChange={(e) => setFormData({
                    ...formData,
                    [formData.type === 'expense' ? 'description' : 'source']: e.target.value
                  })}
                  placeholder={formData.type === 'expense' ? 'e.g. Netflix, Rent' : 'e.g. Salary'}
                  className="bg-white/5 border-white/5 rounded-xl h-12 focus:ring-indigo-500/50"
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurring-amount" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Amount</Label>
                  <Input
                    id="recurring-amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="bg-white/5 border-white/5 rounded-xl h-12"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="recurring-frequency" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                    <SelectTrigger id="recurring-frequency" name="frequency" className="bg-white/5 border-white/5 rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="recurring-account" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Funding Wallet</Label>
                <Select value={formData.accountId} onValueChange={(value: string) => setFormData({ ...formData, accountId: value })}>
                  <SelectTrigger id="recurring-account" name="accountId" className="bg-white/5 border-white/5 rounded-xl h-12">
                    <SelectValue placeholder="Target Account" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.icon} {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'expense' && (
                <div>
                  <Label htmlFor="recurring-category" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Category</Label>
                  <Select value={formData.category} onValueChange={(value: string) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger id="recurring-category" name="category" className="bg-white/5 border-white/5 rounded-xl h-12">
                      <SelectValue placeholder="Purpose" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white max-h-[200px]">
                      {MONEY_OUT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.emoji} {cat.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurring-start-date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date</Label>
                  <Input
                    id="recurring-start-date"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-white/5 border-white/5 rounded-xl h-12 text-xs"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="recurring-end-date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date (Optional)</Label>
                  <Input
                    id="recurring-end-date"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="bg-white/5 border-white/5 rounded-xl h-12"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 relative z-10">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="flex-1 rounded-2xl h-14 font-black text-slate-500 hover:bg-white/5">
                Discard
              </Button>
              <Button
                onClick={handleCreateRecurring}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-14 font-black shadow-lg shadow-indigo-600/20"
                disabled={
                  !formData.amount ||
                  (!formData.description && !formData.source) ||
                  !formData.accountId ||
                  (formData.type === 'expense' && !formData.category)
                }
              >
                Activate Flow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
