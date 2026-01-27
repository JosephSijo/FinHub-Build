import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Plus, Trash2, RefreshCw, Calendar, Edit2, TrendingDown, Sparkles, Wallet, ArrowUpRight, Brain, Zap } from 'lucide-react';
import { calculateSubscriptionROI } from '../utils/subscriptionROI';
import { getCancellationStrategy } from '../utils/smartCancellation';
import { MONEY_OUT_CATEGORIES, RecurringTransaction } from '../types';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/numberFormat';
import { MeshBackground } from './ui/MeshBackground';
import { SubscriptionStrategist } from './SubscriptionStrategist';
import { LiabilityDashboard } from './LiabilityDashboard';
import { BillLateFlag } from './BillLateFlag';
import { toast } from 'sonner';
import { Switch } from './ui/switch';
import { CancellationFlowModal } from './CancellationFlowModal';
import { ShieldAlert } from 'lucide-react';

export function RecurringTransactions() {
  const {
    accounts,
    currency,
    recurringTransactions: recurring,
    liabilities,
    debts,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    processRecurringTransactions,
    createLiability,
    updateLiability,
    deleteLiability
  } = useFinance();

  const [viewMode, setViewMode] = useState<'list' | 'advisor' | 'debt'>('list');

  // Calculate total monthly income for Strategist
  // Note: This is an approximation based on recurring incomes. Ideally usage of actual monthly income logic.
  const totalMonthlyIncome = recurring
    .filter(r => r.type === 'income')
    .reduce((sum, r) => {
      let amt = r.amount;
      if (r.frequency === 'yearly') amt = r.amount / 12;
      if (r.frequency === 'weekly') amt = r.amount * 4;
      return sum + amt;
    }, 0);

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
    const { updateRecurringTransaction, expenses, currency } = useFinance();
    const isSubscription = rec.kind === 'subscription';

    // Calculate ROI for subscriptions
    const roi = isSubscription ? calculateSubscriptionROI(rec, expenses) : null;

    // Calculate Smart Cancellation Strategy
    const cancelStrategy = isSubscription ? getCancellationStrategy(rec) : null;

    const handleLogUse = async (e: React.MouseEvent) => {
      e.stopPropagation();
      const currentCount = rec.manualUsageCount || 0;
      await updateRecurringTransaction(rec.id, {
        manualUsageCount: currentCount + 1,
        lastUsedAt: new Date().toISOString()
      });
      toast.success(`Logged use for ${rec.description || 'subscription'}`, {
        icon: '⚡'
      });
    };
    const account = accounts.find(a => a.id === rec.accountId);
    const liability = liabilities.find(l => l.id === rec.liabilityId);
    const progress = liability ? Math.max(0, Math.min(100, ((liability.principal - liability.outstanding) / liability.principal) * 100)) : 0;

    return (
      <Card className={`p-6 bg-slate-900/40 border-white/5 rounded-[28px] border hover:bg-slate-900/60 transition-all duration-300 group relative overflow-hidden ${rec.status === 'cancelled' ? 'opacity-50 grayscale' : ''}`}>
        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-5 -mr-12 -mt-12 transition-opacity group-hover:opacity-20 ${rec.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 border border-white/5 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform text-2xl ${rec.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
              {rec.status === 'cancelled' ? '🚫' : rec.type === 'income' ? '💰' : liability ? '🏦' : '💸'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 truncate flex items-center gap-2">
                  <span className="opacity-40 text-xs">🔄</span> {rec.description || rec.source}
                  <BillLateFlag recurring={rec} />
                </h3>
                {rec.status === 'cancellation_pending' && (
                  <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border border-amber-500/20">Pending Cancel</span>
                )}
                {rec.status === 'cancelled' && (
                  <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border border-rose-500/20">Cancelled</span>
                )}
              </div>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-600 mt-1">
                {getFrequencyLabel(rec.frequency)} {rec.kind === 'bill' ? '• Bill' : liability ? '• Loan' : rec.kind === 'subscription' ? '• Subscription' : ''}
                {rec.endDate ? ` • Until ${new Date(rec.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` : ' • Ongoing'}
              </p>
            </div>
          </div>
          <div className="flex bg-slate-900/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            {isSubscription && rec.status !== 'cancelled' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelInitiate(rec)}
                  className={`w-10 h-10 p-0 hover:bg-rose-500/10 ${rec.status === 'cancellation_pending' ? 'text-amber-400' : 'text-slate-500 hover:text-rose-400'}`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </Button>
                <div className="w-px bg-white/10 my-2" />
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(rec)}
              className="w-10 h-10 p-0 hover:bg-slate-800 text-slate-500 hover:text-indigo-400"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <div className="w-px bg-white/10 my-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(rec)}
              className="w-10 h-10 p-0 rounded-r-xl hover:bg-rose-500/10 hover:text-rose-400 text-slate-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ROI Overlay for subscriptions */}
        {isSubscription && roi && (
          <div className="mb-4 flex items-center gap-3 relative z-10 px-1">
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 ${roi.isPoorROI ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
              <Zap className="w-3 h-3" />
              {formatCurrency(roi.costPerUse, currency)} / use
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {roi.totalUsage} {roi.totalUsage === 1 ? 'use' : 'uses'} this month
            </span>
          </div>
        )}


        {/* Smart Cancellation Alert */}
        {
          isSubscription && cancelStrategy && (
            <div className={`mb-4 p-3 rounded-xl border flex items-start gap-3 relative z-10 ${cancelStrategy.urgency === 'high' ? 'bg-rose-500/10 border-rose-500/20' :
              cancelStrategy.urgency === 'medium' ? 'bg-amber-500/10 border-amber-500/20' :
                'bg-indigo-500/10 border-indigo-500/20'
              }`}>
              <div className={`mt-0.5 ${cancelStrategy.urgency === 'high' ? 'text-rose-400' :
                cancelStrategy.urgency === 'medium' ? 'text-amber-400' :
                  'text-indigo-400'
                }`}>
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${cancelStrategy.urgency === 'high' ? 'text-rose-400' :
                  cancelStrategy.urgency === 'medium' ? 'text-amber-400' :
                    'text-indigo-400'
                  }`}>
                  {cancelStrategy.reason}
                </p>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {cancelStrategy.message}
                </p>
                {cancelStrategy.savings > 0 && (
                  <p className="text-[10px] text-emerald-400 font-bold mt-1">
                    Save {formatCurrency(cancelStrategy.savings, currency)}
                  </p>
                )}
              </div>
            </div>
          )
        }

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-600 mb-1 font-mono">{liability ? 'Monthly EMI' : 'Payment Flow'}</span>
              <span className={`text-2xl font-black tabular-nums leading-none font-mono ${rec.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
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

          {liability && (
            <div className="pt-4 space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[10px] uppercase font-black text-rose-500/60 tracking-wider">Debt Clearance</p>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-300 tabular-nums">{progress.toFixed(0)}%</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Outstanding</span>
                  <span className="text-[11px] font-black text-rose-400/80">{formatCurrency(liability.outstanding, currency)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Remaining</span>
                  <span className="text-[11px] font-black text-slate-400">{liability.tenure} Months</span>
                </div>
              </div>
            </div>
          )}

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
              <div className="flex items-center gap-2">
                {isSubscription && (
                  <Button
                    onClick={handleLogUse}
                    className="h-8 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-600/20 text-[10px] font-black uppercase tracking-tight px-3"
                  >
                    Log Use
                  </Button>
                )}
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-inner">
                  {account?.icon || '🏦'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card >
    );
  };

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedForCancel, setSelectedForCancel] = useState<RecurringTransaction | null>(null);

  const handleCancelInitiate = (rec: RecurringTransaction) => {
    setSelectedForCancel(rec);
    setIsCancelModalOpen(true);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    await updateRecurringTransaction(id, { status: newStatus });
  };

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
    tags: [] as string[],
    // Liability fields
    principal: '',
    interestRate: '',
    tenure: '',
    liabilityId: '',
    kind: 'subscription' as RecurringTransaction['kind'],
    reminderEnabled: true,
    dueDay: new Date().getDate().toString()
  });

  // Smart Detection Logic
  useEffect(() => {
    const name = (formData.type === 'expense' ? formData.description : formData.source).toLowerCase().trim();
    if (!name || editingId) return;

    const subKeywords = ['netflix', 'spotify', 'prime', 'youtube', 'apple', 'hulu', 'disney', 'google', 'icloud', 'adobe', 'canva', 'figma', 'chatgpt', 'openai', 'claude', 'midjourney', 'github', 'cursor'];
    const emiKeywords = ['emi', 'loan', 'mortgage', 'bajaj', 'hdfc loan', 'sbi loan', 'icici loan', 'finance'];
    const billKeywords = ['rent', 'electricity', 'internet', 'water', 'gas', 'school fee', 'maintenance', 'mobile bill', 'broadband'];

    if (subKeywords.some(kw => name.includes(kw))) {
      if (formData.type !== 'expense' || formData.kind !== 'subscription') {
        queueMicrotask(() => {
          setFormData(prev => ({
            ...prev,
            type: 'expense',
            kind: 'subscription',
            category: 'Subscription',
            description: prev.source || prev.description // Sync name if switched
          }));
        });
        toast.info(`Smart Detection: Categorized as Subscription`, { icon: '🤖' });
      }
    } else if (emiKeywords.some(kw => name.includes(kw)) || billKeywords.some(kw => name.includes(kw))) {
      const isEMI = emiKeywords.some(kw => name.includes(kw));
      if (formData.type !== 'expense' || formData.kind !== 'bill') {
        queueMicrotask(() => {
          setFormData(prev => ({
            ...prev,
            type: 'expense',
            kind: 'bill',
            category: isEMI ? 'EMI' : 'Bills & Utilities',
            description: prev.source || prev.description
          }));
        });
        toast.info(`Smart Detection: Categorized as ${isEMI ? 'EMI' : 'Bill'}`, { icon: '🤖' });
      }
    }
  }, [formData.description, formData.source, formData.type, formData.category, formData.kind, editingId]);

  const handleCreateRecurring = async () => {
    const data: any = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      accountId: formData.accountId,
      frequency: formData.frequency,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      tags: formData.tags,
      kind: formData.kind,
      reminderEnabled: formData.reminderEnabled,
      dueDay: parseInt(formData.dueDay) || undefined
    };

    if (formData.type === 'expense') {
      data.description = formData.description;
      data.category = formData.category;
    } else {
      data.source = formData.source;
    }

    if (editingId) {
      await updateRecurringTransaction(editingId, data);

      // If linked to a liability, update that too
      if (formData.liabilityId) {
        await updateLiability(formData.liabilityId, {
          name: formData.type === 'expense' ? formData.description : formData.source,
          principal: parseFloat(formData.principal) || 0,
          interestRate: parseFloat(formData.interestRate) || 0,
          emiAmount: parseFloat(formData.amount) || 0,
          tenure: parseInt(formData.tenure) || 0,
          accountId: formData.accountId
        });
      }
    } else {
      if (formData.category === 'EMI' || formData.category === 'Loan') {
        // Create as Liability (which will auto-create recurring)
        await createLiability({
          name: formData.type === 'expense' ? formData.description : formData.source,
          type: 'personal_loan',
          principal: parseFloat(formData.principal) || parseFloat(formData.amount),
          outstanding: parseFloat(formData.principal) || parseFloat(formData.amount),
          interestRate: parseFloat(formData.interestRate) || 0,
          emiAmount: parseFloat(formData.amount),
          startDate: formData.startDate,
          tenure: parseInt(formData.tenure) || 12,
          accountId: formData.accountId,
          kind: 'bill',
          reminderEnabled: formData.reminderEnabled,
          dueDay: parseInt(formData.dueDay) || new Date(formData.startDate).getDate(),
          createdAt: new Date().toISOString()
        });
      } else {
        await createRecurringTransaction(data);
      }
    }
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (rec: RecurringTransaction) => {
    setFormData({
      type: rec.type,
      description: rec.description || '',
      source: rec.source || '',
      amount: rec.amount.toString(),
      category: rec.category || '',
      accountId: rec.accountId,
      frequency: rec.frequency,
      startDate: rec.startDate.split('T')[0],
      endDate: rec.endDate ? rec.endDate.split('T')[0] : '',
      tags: rec.tags || [],
      principal: '',
      interestRate: '',
      tenure: '',
      liabilityId: rec.liabilityId || '',
      kind: rec.kind || (rec.type === 'income' ? 'income' : 'subscription'),
      reminderEnabled: rec.reminderEnabled ?? true,
      dueDay: (rec.dueDay || new Date(rec.startDate).getDate()).toString()
    });

    const liability = liabilities.find(l => l.id === rec.liabilityId);
    if (liability) {
      setFormData(prev => ({
        ...prev,
        principal: liability.principal.toString(),
        interestRate: liability.interestRate.toString(),
        tenure: liability.tenure.toString()
      }));
    }
    setEditingId(rec.id);
    setIsAddDialogOpen(true);
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
      tags: [],
      principal: '',
      interestRate: '',
      tenure: '',
      liabilityId: '',
      kind: 'subscription',
      reminderEnabled: true,
      dueDay: new Date().getDate().toString()
    });
    setEditingId(null);
  };

  const handleDelete = async (rec: RecurringTransaction) => {
    if (rec.liabilityId) {
      const confirmDelete = window.confirm(`Deleting this flow will also remove the linked liability "${rec.description || 'Loan'}". Continue?`);
      if (confirmDelete) {
        await deleteLiability(rec.liabilityId);
        toast.success('Liability and flow removed');
      }
    } else {
      await deleteRecurringTransaction(rec.id);
    }
  };

  const handleAdvisorDelete = (id: string, _description: string) => {
    const rec = recurring.find(r => r.id === id);
    if (rec) handleDelete(rec);
  };



  // Filter out zero/null amount transactions
  const filteredRecurring = recurring.filter(r => r.amount && r.amount > 0);

  const getCategorizedData = () => {
    const loans = filteredRecurring.filter(r =>
      r.category === 'EMI' ||
      (r.description || '').toLowerCase().includes('loan') ||
      (r.source || '').toLowerCase().includes('loan')
    );
    const subscriptions = filteredRecurring.filter(r =>
      r.kind === 'subscription' ||
      (r.category === 'Subscription' ||
        (r.description || '').toLowerCase().includes('subscription') ||
        (r.source || '').toLowerCase().includes('subscription') ||
        ['netflix', 'spotify', 'prime', 'youtube', 'apple', 'hulu', 'disney', 'google'].some(kw =>
          (r.description || '').toLowerCase().includes(kw) ||
          (r.source || '').toLowerCase().includes(kw)
        )
      )
    );
    const bills = filteredRecurring.filter(r =>
      r.kind === 'bill' ||
      (!loans.some(l => l.id === r.id) &&
        !subscriptions.some(s => s.id === r.id) &&
        r.type === 'expense' &&
        ['rent', 'electricity', 'internet', 'water', 'gas', 'fee', 'maintenance', 'bill'].some(kw =>
          (r.description || '').toLowerCase().includes(kw)
        )
      )
    );
    const incomes = filteredRecurring.filter(r => r.type === 'income' || r.kind === 'income');
    const others = filteredRecurring.filter(r =>
      !loans.some(l => l.id === r.id) &&
      !subscriptions.some(s => s.id === r.id) &&
      !bills.some(b => b.id === r.id) &&
      !incomes.some(i => i.id === r.id)
    );

    return { loans, subscriptions, bills, incomes, others };
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
    const billTotal = categorized.bills.reduce((sum, r) => sum + calculateMonthly(r), 0);
    const incomeTotal = categorized.incomes.reduce((sum, r) => sum + calculateMonthly(r), 0);
    const otherTotal = categorized.others.reduce((sum, r) => sum + calculateMonthly(r), 0);

    const totalOutflow = loanTotal + subTotal + billTotal + otherTotal;
    const netMonthly = incomeTotal - totalOutflow;

    // Health Score calculation: Ratio of surplus to total income
    const healthScore = incomeTotal > 0
      ? Math.max(0, Math.min(100, (netMonthly / incomeTotal) * 100))
      : 0;

    return {
      loanTotal,
      subTotal,
      billTotal,
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
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-900/60 p-1 rounded-2xl flex gap-1 border border-white/5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Flow List
            </button>
            <button
              onClick={() => setViewMode('advisor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'advisor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Brain className="w-3.5 h-3.5" />
              Advisor
            </button>
            <button
              onClick={() => setViewMode('debt')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'debt' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Bills & Debt
            </button>
          </div>
        </div>

        {viewMode === 'debt' ? (
          <LiabilityDashboard
            liabilities={liabilities}
            debts={debts}
            currency={currency}
            totalMonthlyIncome={totalMonthlyIncome || 1}
          />
        ) : viewMode === 'advisor' ? (
          <SubscriptionStrategist
            recurring={recurring}
            currency={currency}
            totalMonthlyIncome={totalMonthlyIncome}
            onDelete={handleAdvisorDelete}
          />
        ) : (
          <>
            {/* Summary Dashboard Card - Aligned with History Tab */}
            <div className="frosted-plate rounded-[32px] border border-white/5 relative overflow-hidden p-8 shadow-2xl">
              <MeshBackground variant="spending" />

              <div className="relative z-10">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                      <RefreshCw className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-slate-100 font-bold text-xs uppercase tracking-widest font-mono">Payment Analysis</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                        Monthly Leftover Cash
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold font-mono">Regular Payments</p>
                    <p className="text-sm font-black text-white tabular-nums font-mono">
                      {insights.totalActive} Active
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="space-y-2 text-center md:text-left">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest font-mono">Projected Monthly Surplus</p>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums text-white font-mono">
                      {insights.netMonthly >= 0 ? '+' : ''}{formatCurrency(insights.netMonthly, currency)}
                    </h1>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                    {/* Loan EMIs */}
                    <div className="bg-slate-800/40 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center min-w-[120px]">
                      <p className="text-[10px] uppercase font-black text-slate-500 mb-1 font-mono tracking-widest">Loan EMIs</p>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black leading-none text-rose-400/80 font-mono mb-1">-</span>
                        <span className="font-black text-lg text-rose-400 font-mono tabular-nums">{formatCurrency(Math.abs(insights.loanTotal), currency)}</span>
                      </div>
                    </div>
                    {/* Monthly Bills */}
                    <div className="bg-slate-800/40 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center min-w-[120px]">
                      <p className="text-[10px] uppercase font-black text-slate-500 mb-1 font-mono tracking-widest">Monthly Bills</p>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black leading-none text-rose-400/80 font-mono mb-1">-</span>
                        <span className="font-black text-lg text-rose-400 font-mono tabular-nums">{formatCurrency(Math.abs(insights.billTotal), currency)}</span>
                      </div>
                    </div>
                    {/* Subscriptions */}
                    <div className="bg-slate-800/40 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center min-w-[120px]">
                      <p className="text-[10px] uppercase font-black text-slate-500 mb-1 font-mono tracking-widest">Subscriptions</p>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black leading-none text-indigo-400/80 font-mono mb-1">-</span>
                        <span className="font-black text-lg text-indigo-400 font-mono tabular-nums">{formatCurrency(Math.abs(insights.subTotal), currency)}</span>
                      </div>
                    </div>
                    {/* Regular Income */}
                    <div className="bg-slate-800/40 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center min-w-[120px]">
                      <p className="text-[10px] uppercase font-black text-slate-500 mb-1 font-mono tracking-widest">Regular Income</p>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black leading-none text-emerald-400/80 font-mono mb-1">+</span>
                        <span className="font-black text-lg text-emerald-400 font-mono tabular-nums">{formatCurrency(Math.abs(insights.incomeTotal), currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sticky top-0 z-30 py-2 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Regular Payments</p>
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
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5 font-mono">Net Monthly Flow</p>
                  <h4 className={`text-lg font-black tabular-nums leading-none font-mono ${insights.netMonthly >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {insights.netMonthly >= 0 ? '+' : ''}{formatCurrency(insights.netMonthly, currency)}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-6">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-black text-slate-600">Flow Health</p>
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
              <h3 className="text-2xl font-black text-slate-200 mb-3">No Regular Payments</h3>
              <p className="text-sm text-slate-500 font-bold mb-10 max-w-[320px] mx-auto leading-relaxed">
                Set up your subscriptions, EMIs, and monthly income to unlock deep financial insights.
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-600/20 rounded-2xl px-10 h-14 font-black"
              >
                <Plus className="w-5 h-5 mr-3" />
                Add First Payment
              </Button>
            </Card>
          ) : (
            <>
              {/* Category: Income */}
              {categorized.incomes.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                    <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight font-mono">Regular Income</h3>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black font-mono">{categorized.incomes.length} SOURCE(S)</span>
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
                    <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight font-mono">Loan EMIs</h3>
                    <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded text-[10px] font-black font-mono">{categorized.loans.length} PAYMENT(S)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categorized.loans.map((rec, idx) => <RecurringCard key={`${rec.id}-${idx}`} rec={rec} />)}
                  </div>
                </div>
              )}

              {/* Category: Bills */}
              {categorized.bills.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-rose-400 pl-4 py-1">
                    <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight font-mono">Monthly Bills</h3>
                    <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded text-[10px] font-black font-mono">{categorized.bills.length} BILL(S)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categorized.bills.map((rec, idx) => <RecurringCard key={`${rec.id}-${idx}`} rec={rec} />)}
                  </div>
                </div>
              )}

              {/* Category: Subscriptions */}
              {categorized.subscriptions.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4 py-1">
                    <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight font-mono">Active Subscriptions</h3>
                    <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-black font-mono">{categorized.subscriptions.length} SERVICE(S)</span>
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
                    <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">Other Regular Payments</h3>
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
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md bg-slate-950 border-white/10 text-white rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">
              {editingId ? 'Edit Regular Flow' : 'Create New Regular Flow'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold">
              {editingId ? 'Modify existing flow parameters.' : 'Automate your regular financial entries.'}
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
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Payment Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, kind: 'subscription', category: 'Subscription' })}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.kind === 'subscription' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                  >
                    Subscription
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, kind: 'bill', category: 'Bills & Utilities' })}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.kind === 'bill' ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                  >
                    Monthly Bill
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, kind: 'income', category: 'Income' })}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.kind === 'income' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                  >
                    Recur. Income
                  </button>
                </div>
              </div>

              {formData.kind === 'bill' && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-slate-200">Auto Reminders</Label>
                      <p className="text-[9px] text-slate-500 font-medium">Get notified 2 days before due date</p>
                    </div>
                    <Switch
                      checked={formData.reminderEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, reminderEnabled: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-day" className="text-[10px] font-black uppercase text-slate-500">Day of Month Due</Label>
                    <Input
                      id="due-day"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dueDay}
                      onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                      className="bg-white/5 border-white/5 h-10 text-xs rounded-lg"
                    />
                  </div>
                </div>
              )}

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

                {(formData.category === 'EMI' || formData.category === 'Loan' || formData.liabilityId) && (
                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 pl-1">Liability Details</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="liability-principal" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Principal</Label>
                        <Input
                          id="liability-principal"
                          type="number"
                          value={formData.principal}
                          onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                          placeholder="Total Loan"
                          className="bg-white/5 border-white/5 rounded-xl h-11 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="liability-tenure" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Tenure (Mo)</Label>
                        <Input
                          id="liability-tenure"
                          type="number"
                          value={formData.tenure}
                          onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                          placeholder="Months"
                          className="bg-white/5 border-white/5 rounded-xl h-11 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="liability-rate" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Interest Rate (%)</Label>
                      <Input
                        id="liability-rate"
                        type="number"
                        value={formData.interestRate}
                        onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                        placeholder="Annual %"
                        className="bg-white/5 border-white/5 rounded-xl h-11 text-xs"
                      />
                    </div>
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
                  {editingId ? 'Update Flow' : 'Activate Flow'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {selectedForCancel && (
        <CancellationFlowModal
          isOpen={isCancelModalOpen}
          onOpenChange={setIsCancelModalOpen}
          subscription={selectedForCancel}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </>
  );
}
