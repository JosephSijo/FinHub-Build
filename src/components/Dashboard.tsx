import React, { useState, useMemo } from 'react';
import {
  Target,
  TrendingUp,
  Wallet,
  Building2,
  CreditCard,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InteractiveFinancialValue } from './ui/InteractiveFinancialValue';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

import { TruthBanner } from './dashboard/TruthBanner';
import { TacticalRecovery } from './dashboard/TacticalRecovery';
import { AdvancedInsights } from './dashboard/AdvancedInsights';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { useShadowWallet } from '@/hooks/useShadowWallet';
import { formatCurrency, formatFinancialValue } from '@/utils/numberFormat';
import { MeshBackground } from './ui/MeshBackground';
import { CategoryBackdrop } from './ui/CategoryBackdrop';
import { isTransfer } from '@/utils/isTransfer';
import { Expense, Income, Account, Debt, AIContext, Goal, Liability, RecurringTransaction } from '@/types';
import { calculateFoundationMetrics } from '@/utils/architect';
import { ActionInsightCard, actionInsightsLogic } from '../features/actionInsights';
import { NotificationCard, notificationsLogic, NotificationContext } from '../features/notifications';
import { FinancialHealthClarity } from './dashboard/FinancialHealthClarity';

export interface DashboardProps {
  expenses: Expense[];
  incomes?: Income[];
  currency: string;
  goals?: any[];
  emergencyFundAmount?: number;
  liabilities?: any[];
  debts?: Debt[];
  investments?: any[];
  accounts?: Account[];
  healthScore?: number;
  userName?: string;
  isOffline?: boolean;
  isSampleMode?: boolean;
  recurringTransactions?: RecurringTransaction[];
  onNavigate?: (view: any) => void;
  onOpenSetupWizard?: () => void;
  onAddTransaction?: (type: any) => void;
}

const GENERIC_AVERAGES = {
  expenses: [
    // Current Month
    { id: 's1', description: 'Monthly Rent', amount: 35000, category: 'Housing', date: new Date().toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
    { id: 's2', description: 'Grocery Run', amount: 8000, category: 'Groceries', date: new Date().toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
    { id: 's3', description: 'Internet & Power', amount: 4500, category: 'Bills & Utilities', date: new Date().toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
    { id: 's4', description: 'Dining Out High', amount: 12000, category: 'Food & Dining', date: new Date().toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
    { id: 's5', description: 'Weekend Shopping', amount: 15000, category: 'Shopping', date: new Date().toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
    // Month -1
    { id: 's1-1', description: 'Rent', amount: 35000, category: 'Housing', date: new Date(new Date().setDate(0)).toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
    { id: 's4-1', description: 'Dining', amount: 5000, category: 'Food & Dining', date: new Date(new Date().setDate(0)).toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
    // Month -2
    { id: 's4-2', description: 'Dining', amount: 4500, category: 'Food & Dining', date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
  ] as Expense[],
  incomes: [
    { id: 'i1', amount: 150000, source: 'Monthly Salary', date: new Date().toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
    { id: 'i2', amount: 150000, source: 'Salary m-1', date: new Date(new Date().setDate(0)).toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
    { id: 'i3', amount: 150000, source: 'Salary m-2', date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(), tags: [], accountId: 'a1', createdAt: new Date().toISOString() },
  ] as Income[],
  accounts: [
    { id: 'a1', name: 'Primary Bank', balance: 450000, type: 'bank', color: '#3B82F6', icon: 'building', createdAt: new Date().toISOString() },
    { id: 'a2', name: 'Cash on Hand', balance: 5000, type: 'cash', color: '#10B981', icon: 'wallet', createdAt: new Date().toISOString() },
  ] as Account[],
  goals: [
    { id: 'g1', name: 'Emergency Fund', targetAmount: 240000, currentAmount: 240000, emoji: '🛡️', type: 'protection', targetDate: new Date().toISOString(), status: 'active', createdAt: new Date().toISOString(), monthly_contribution: 20000 },
    { id: 'g2', name: 'House Fund', targetAmount: 5000000, currentAmount: 1500000, emoji: '🏠', type: 'growth', targetDate: new Date().toISOString(), status: 'active', createdAt: new Date().toISOString() },
  ] as Goal[],
  liabilities: [
    {
      id: 'l1',
      name: 'Car Loan',
      type: 'car_loan',
      principal: 800000,
      outstanding: 400000,
      emiAmount: 15000,
      interestRate: 8.5,
      tenure: 60,
      startDate: '2023-01-01',
      createdAt: new Date().toISOString()
    }
  ] as Liability[],
  debts: [] as Debt[]
};

export const Dashboard: React.FC<DashboardProps> = React.memo(({
  expenses,
  incomes = [],
  currency,
  goals = [],
  emergencyFundAmount = 0,
  liabilities = [],
  debts = [],
  investments = [],
  accounts = [],
  healthScore = 50,
  userName = "User",
  isOffline = false,
  isSampleMode = false,
  recurringTransactions = [],
  onNavigate,
  onOpenSetupWizard,
  onAddTransaction
}) => {

  const displayExpenses = useMemo(() => isSampleMode ? GENERIC_AVERAGES.expenses : expenses, [isSampleMode, expenses]);
  const displayIncomes = useMemo(() => isSampleMode ? GENERIC_AVERAGES.incomes : incomes, [isSampleMode, incomes]);
  const displayAccounts = useMemo(() => isSampleMode ? GENERIC_AVERAGES.accounts : accounts, [isSampleMode, accounts]);
  const displayGoals = useMemo(() => isSampleMode ? GENERIC_AVERAGES.goals : goals, [isSampleMode, goals]);
  const displayLiabilities = useMemo(() => isSampleMode ? GENERIC_AVERAGES.liabilities : liabilities, [isSampleMode, liabilities]);
  const displayDebts = useMemo(() => isSampleMode ? GENERIC_AVERAGES.debts : debts, [isSampleMode, debts]);
  const displayHealthScore = isSampleMode ? 85 : healthScore;

  // 1. Cross-Account Reconciliation Logic
  const { reconciledExpenses, reconciledIncomes } = useMemo(() => {
    const rExpenses = displayExpenses.map(e => ({ ...e, isInternalTransfer: e.isInternalTransfer || isTransfer(e as any) }));
    const rIncomes = displayIncomes.map(i => ({ ...i, isInternalTransfer: i.isInternalTransfer || isTransfer(i as any) }));

    // Auto-detect matching outflow/inflow pairs on the same day across different accounts
    rExpenses.forEach(exp => {
      if (exp.isInternalTransfer) return;
      const match = rIncomes.find(inc =>
        !inc.isInternalTransfer &&
        inc.amount === exp.amount &&
        inc.date.split('T')[0] === exp.date.split('T')[0] &&
        inc.accountId !== exp.accountId
      );
      if (match) {
        exp.isInternalTransfer = true;
        match.isInternalTransfer = true;
      }
    });

    return { reconciledExpenses: rExpenses, reconciledIncomes: rIncomes };
  }, [displayExpenses, displayIncomes]);

  // Logic for Available-to-Spend
  const shadowWallet = useShadowWallet({
    accounts: displayAccounts as any,
    goals: displayGoals,
    liabilities: displayLiabilities,
    expenses: reconciledExpenses as any,
    emergencyFundAmount
  });

  const {
    shadowWalletTotal,
    totalReserved,
    availableToSpend,
    totalCreditUsage,
    totalCommitments
  } = shadowWallet;

  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Time & Filtering Logic for Guru Vitals
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = lastDayOfMonth - today.getDate() + 1;

    const currentMonthExpenses = reconciledExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && !e.isInternalTransfer;
    });

    const lastMonthExpenses = reconciledExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && !e.isInternalTransfer;
    });

    const activeGoalsCount = displayGoals.length;
    const totalLiabilities = displayLiabilities.reduce((sum: number, l: any) => sum + (l.outstanding || l.principal || 0), 0);

    const pendingBorrowedDebts = displayDebts.filter(d => d.type === 'borrowed' && d.status === 'pending');
    const totalMoneyOwed = pendingBorrowedDebts.reduce((sum, d) => sum + d.amount, 0);

    const pendingLentDebts = displayDebts.filter(d => d.type === 'lent' && d.status === 'pending');
    const totalMoneyLent = pendingLentDebts.reduce((sum, d) => sum + d.amount, 0);

    const filteredInvestments = investments.filter(inv => {
      if (inv.accountId && inv.accountId !== 'none') {
        const acc = displayAccounts.find(a => a.id === inv.accountId);
        if (acc && acc.type !== 'investment') return false;
      }
      return true;
    });

    const totalPrincipal = filteredInvestments.reduce((sum: number, inv: any) => sum + (inv.buyPrice * inv.quantity), 0);
    const totalInvestmentValue = filteredInvestments.reduce((sum: number, inv: any) => sum + ((inv.currentPrice || inv.buyPrice) * inv.quantity), 0);

    const portfolioVelocity = totalPrincipal > 0
      ? (((totalInvestmentValue - totalPrincipal) / totalPrincipal) * 100).toFixed(1)
      : "0.0";

    const m1Assets = displayAccounts
      .filter(acc => acc.type === 'bank' || acc.type === 'cash')
      .reduce((sum, acc) => sum + acc.balance, 0);

    const grossIncome = reconciledIncomes.filter(i => !i.isInternalTransfer).reduce((sum: number, i: Income) => sum + i.amount, 0) || 0;
    const grossBurn = currentMonthExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
    const lastMonthBurn = lastMonthExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);

    const spendingVariance = lastMonthBurn > 0
      ? Math.round(((grossBurn - lastMonthBurn) / lastMonthBurn) * 100)
      : 0;

    const subscriptionBurden = currentMonthExpenses
      .filter(e => e.category === 'Subscription')
      .reduce((sum, e) => sum + e.amount, 0);

    const velocityValue = m1Assets > 0 ? (grossBurn / m1Assets) : 0;
    const liquidVelocity = (velocityValue * 100).toFixed(1) + '%';

    // Advanced Insights Calculations
    const totalEMIs = displayLiabilities.reduce((sum: number, l: any) => sum + (l.emiAmount || 0), 0);
    const totalCCDebt = displayAccounts
      .filter(a => a.type === 'credit_card')
      .reduce((sum: number, a: any) => sum + Math.abs(a.balance), 0);
    const monthlyCCPayment = totalCCDebt * 0.05;
    const totalMonthlyDebt = totalEMIs + monthlyCCPayment;

    const bankAccountIds = displayAccounts.filter(a => a.type === 'bank').map(a => a.id);
    const spendAccountIds = displayAccounts.filter(a => ['bank', 'cash', 'credit_card'].includes(a.type)).map(a => a.id);

    const currentMonthIncomes = reconciledIncomes.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        bankAccountIds.includes(i.accountId) &&
        !i.isInternalTransfer;
    }).reduce((sum, i) => sum + i.amount, 0) || grossIncome;

    const currentMonthInvestments = investments.filter(inv => {
      const d = new Date(inv.purchaseDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, inv) => sum + (inv.buyPrice * inv.quantity), 0);

    const refinedSpend = reconciledExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        spendAccountIds.includes(e.accountId) &&
        !e.isInternalTransfer;
    }).reduce((sum, e) => sum + e.amount, 0);

    const totalOutflows = refinedSpend + currentMonthInvestments;
    const outflowRatio = currentMonthIncomes > 0 ? (totalOutflows / currentMonthIncomes) : 0;
    const finalSavingsRateScore = grossIncome > 0 ? ((grossIncome - grossBurn) / grossIncome * 100) : 0;
    const dtiRatio = grossIncome > 0 ? (totalMonthlyDebt / grossIncome) : 0;

    const architectureContext: AIContext = {
      totalIncome: displayIncomes.reduce((sum, i) => sum + i.amount, 0),
      totalExpenses: displayExpenses.reduce((sum, e) => sum + e.amount, 0),
      expenses: displayExpenses,
      incomes: displayIncomes,
      accounts: displayAccounts as any,
      liabilities: displayLiabilities as any,
      goals: displayGoals as any,
      healthScore: displayHealthScore,
      currency,
      investments: investments as any,
      debts: displayDebts as any,
      currentMonthExpenses: reconciledExpenses as any,
      recentTransactions: reconciledExpenses.slice(0, 5) as any,
      savingsRate: grossIncome > 0 ? (grossIncome - grossBurn) / grossIncome : 0,
      activeDebts: displayLiabilities.length + displayDebts.filter(d => d.status === 'pending').length,
      goalsCount: displayGoals.length
    };

    const foundationMetrics = calculateFoundationMetrics(architectureContext);
    const safeDailyLimit = foundationMetrics.foundationLimit;

    const hasExpensesInLast3Days = reconciledExpenses.some(e => {
      const diffTime = Math.abs(today.getTime() - new Date(e.date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    });

    const missingEssentials = !hasExpensesInLast3Days;

    return {
      daysRemaining,
      activeGoalsCount,
      totalLiabilities,
      pendingBorrowedDebts,
      totalMoneyOwed,
      pendingLentDebts,
      totalMoneyLent,
      totalInvestmentValue,
      portfolioVelocity,
      m1Assets,
      grossIncome,
      grossBurn,
      spendingVariance,
      subscriptionBurden,
      velocityValue,
      liquidVelocity,
      foundationMetrics,
      safeDailyLimit,
      missingEssentials,
      architectureContext,
      outflowRatio,
      finalSavingsRateScore,
      dtiRatio
    };
  }, [displayExpenses, displayIncomes, displayAccounts, displayGoals, displayLiabilities, displayDebts, investments, currency, displayHealthScore, reconciledExpenses, reconciledIncomes]);

  const {
    daysRemaining,
    activeGoalsCount,
    totalLiabilities,
    pendingBorrowedDebts,
    totalMoneyOwed,
    pendingLentDebts,
    totalMoneyLent,
    totalInvestmentValue,
    portfolioVelocity,
    m1Assets,
    grossIncome,
    grossBurn,
    spendingVariance,
    subscriptionBurden,
    velocityValue,
    liquidVelocity,
    foundationMetrics,
    safeDailyLimit,
    missingEssentials,
    outflowRatio,
    finalSavingsRateScore,
    dtiRatio
  } = stats;

  // commitment Metrics for Clarity Board
  const { commitmentIncome, commitmentOutflow } = useMemo(() => {
    const calcMonthly = (r: RecurringTransaction) => {
      const amt = r.amount || 0;
      if (r.frequency === 'monthly') return amt;
      if (r.frequency === 'yearly') return amt / 12;
      if (r.frequency === 'weekly') return amt * 4;
      return amt * 30; // daily
    };

    const incomes = recurringTransactions.filter(r => r.type === 'income' || r.kind === 'income');
    const outflows = recurringTransactions.filter(r => r.type === 'expense');

    // Filter outflows that are "Fixed" (Subscriptions, Bills, EMIs)
    const fixedOutflows = outflows.filter(r =>
      r.kind === 'subscription' ||
      r.kind === 'bill' ||
      r.category === 'EMI' ||
      r.category === 'Loan' ||
      !!r.liabilityId
    );

    return {
      commitmentIncome: (incomes.length > 0 ? incomes.reduce((sum, r) => sum + calcMonthly(r), 0) : grossIncome) || 0,
      commitmentOutflow: fixedOutflows.reduce((sum, r) => sum + calcMonthly(r), 0)
    };
  }, [recurringTransactions, grossIncome]);

  const toggleCard = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId);
  };

  const getVelocityInterpretation = React.useCallback((velocity: number) => {
    if (velocity > 1.0) return {
      status: 'Aggressive',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      advice: 'High-velocity detected. Spending is outpacing available cash. Priority: Build your safety buffer.',
      suggestion: 'Consolidate spending and pause savings transfers for 30 days.'
    };
    if (velocity < 0.3) return {
      status: 'Stagnant',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      advice: 'Low-velocity detected. Capital is sitting idle in liquid nodes and losing theoretical power.',
      suggestion: 'Highly recommended: Shift ' + formatCurrency(Math.floor(m1Assets * 0.2), currency) + ' to Money Growth.'
    };
    return {
      status: 'Optimal',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      advice: 'Optimal circulation. Capital flow is balanced between spending and holding.',
      suggestion: 'Continue current spending pattern. System is in high-efficiency state.'
    };
  }, [m1Assets, currency]);

  const velocityInfo = useMemo(() => getVelocityInterpretation(velocityValue), [velocityValue, getVelocityInterpretation]);

  const topInsight = useMemo(() => {
    return actionInsightsLogic.generateTopInsight(
      reconciledExpenses as any,
      displayIncomes as any,
      displayLiabilities as any,
      displayGoals as any,
      availableToSpend
    );
  }, [reconciledExpenses, displayIncomes, displayLiabilities, displayGoals, availableToSpend]);

  // Smart Notifications Engine
  const topNotifications = useMemo(() => {
    const today = new Date();
    const accountAge = displayAccounts.length > 0
      ? Math.ceil((today.getTime() - new Date(displayAccounts[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const lastExpenseDate = reconciledExpenses.length > 0
      ? new Date(Math.max(...reconciledExpenses.map(e => new Date(e.date).getTime())))
      : new Date(0);
    const daysSinceLastExpense = Math.ceil((today.getTime() - lastExpenseDate.getTime()) / (1000 * 60 * 60 * 24));

    const context: NotificationContext = {
      userId: 'current-user',
      accountCount: displayAccounts.length,
      totalBalance: shadowWalletTotal,
      hasIncome: displayIncomes.length > 0,
      transactionCount: reconciledExpenses.length + displayIncomes.length,
      accountAge,
      scheduledPayments: displayLiabilities.map(l => ({
        id: l.id,
        amount: l.emiAmount || 0,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
        accountBalance: shadowWalletTotal
      })),
      budgetGaps: [],
      overdueIOUs: [],
      missedEMIs: [],
      feeAlerts: [],
      daysSinceLastExpense,
      safeToSpend: availableToSpend
    };

    return notificationsLogic.generateNotifications(context, currency, 1);
  }, [displayAccounts, shadowWalletTotal, displayIncomes, reconciledExpenses, displayLiabilities, availableToSpend, currency]);

  return (
    <div className="main-grid">

      {isSampleMode && (
        <div className="mx-4 mb-6 pt-4">
        </div>
      )}

      {/* Missing Essentials Nudge */}
      {missingEssentials && !isSampleMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-full mx-4 mb-4 p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-3xl flex items-center gap-4 relative overflow-hidden"
        >
          <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6 text-yellow-500 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-yellow-500 mb-1">Reality Check</h4>
            <p className="text-sm text-slate-300 font-medium leading-tight">
              Zero expenses recorded in 3+ days. Did you forget <span className="text-white font-bold">Groceries</span>, <span className="text-white font-bold">Transport</span>, or <span className="text-white font-bold">Dining</span>?
            </p>
          </div>
        </motion.div>
      )}

      {/* AI Truth Banner */}
      <TruthBanner
        message={`Assessment: ${foundationMetrics.isRestricted ? 'Restricted' : 'Growth'} mode active. Foundation-adjusted limit is ${formatCurrency(safeDailyLimit, currency, true)} for the next ${foundationMetrics.remainingDays} days.`}
        icon={foundationMetrics.isRestricted ? <Zap className="w-4 h-4 text-orange-400" /> : <ShieldCheck className="w-4 h-4 text-blue-400" />}
      />

      {/* Financial Health Clarity Dashboard */}
      <FinancialHealthClarity
        income={commitmentIncome}
        fixedCosts={commitmentOutflow}
        currency={currency}
      />

      {/* 1. COLLAPSIBLE BALANCE BOARD - SAFE ZONE */}
      <motion.div
        layout
        initial={false}
        className={`bg-slate-900 border border-white/5 group transition-all duration-500 col-span-full relative overflow-hidden sq-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]`}
      >
        <MeshBackground variant="safe" animate />
        <CategoryBackdrop variant="safe" />
        <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500/50" />

        {/* Sub-Component A (The Cap) */}
        <div className="stack-cap relative z-10 py-10 px-8">

          <div className="flex flex-col items-center text-center relative z-20">
            <div className="flex flex-col items-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-14 h-14 bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-2xl backdrop-blur-md mb-4 sq-xl"
              >
                <Wallet className="text-blue-400 w-7 h-7" />
              </motion.div>
              <div className="space-y-1">
                <h3 className="text-label text-[11px] font-black tracking-[0.2em] text-blue-400/80 uppercase">Account Balance</h3>
                <div className="flex items-center gap-2 justify-center">
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-colors ${foundationMetrics.isRestricted ? 'bg-orange-500/10 text-orange-300 border-orange-500/20' : 'bg-blue-500/10 text-blue-300 border-blue-500/20'}`}>
                    {foundationMetrics.isRestricted ? 'Restricted Limit' : 'Growth-Ready'}
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${foundationMetrics.isRestricted ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                </div>
              </div>
            </div>

            <motion.div
              layoutId="balance-mount"
              className="text-[min(12vw,4.5rem)] leading-none tabular-nums font-mono text-white font-extrabold tracking-tight"
            >
              <InteractiveFinancialValue value={m1Assets} currency={currency} />
            </motion.div>

            {displayAccounts.length === 0 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenSetupWizard}
                className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/40 flex items-center gap-2 group transition-all hover:bg-blue-500"
              >
                Connect Your First Account
                <ArrowRightLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            ) : (
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-4">All Accounts Connected</p>
            )}
          </div>
        </div>

        {/* Sub-Component B (The Body) */}
        <div className="stack-body relative z-10 px-8">
          <div className="dotted-divider opacity-50 mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 opacity-60">
                <p className="text-label text-[10px] font-black uppercase">Daily Spend</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="w-3 h-3 text-slate-500" /></TooltipTrigger>
                    <TooltipContent className="bg-slate-900 border-white/10 p-4 sq-xl shadow-2xl backdrop-blur-xl z-[100]">
                      <div className="space-y-2 text-[10px] font-bold uppercase tracking-widest min-w-[200px]">
                        <p className="text-slate-500 mb-2 border-b border-white/5 pb-2">Daily Spending Limit Breakdown</p>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Available Cash</span>
                          <span className="text-white">{formatCurrency(m1Assets, currency)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Reserved (Goals + EF)</span>
                          <span className="text-rose-500">-{formatCurrency(shadowWalletTotal, currency)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Obligations (EMI/Bills)</span>
                          <span className="text-rose-500">-{formatCurrency(totalCommitments, currency)}</span>
                        </div>
                        <div className="h-px bg-white/5 my-2" />
                        <div className="flex justify-between gap-4 text-emerald-400">
                          <span>Available Safety</span>
                          <span>{formatCurrency(availableToSpend, currency)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-blue-400 pt-1">
                          <span>Cycle ({daysRemaining} days)</span>
                          <span>{formatCurrency(safeDailyLimit, currency)}/day</span>
                        </div>

                        {foundationMetrics.tier0DebtService > 0 && (
                          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2.5">
                            <div className="flex items-center gap-2">
                              <Zap className="w-3 h-3 text-rose-400" />
                              <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Intelligence: Opportunity Cost</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[8px] text-slate-500 uppercase font-black tracking-tight">Leak Rate</span>
                                <span className="text-[11px] text-rose-300 font-mono font-black leading-none">{foundationMetrics.maxInterestRate}%</span>
                              </div>
                              <div className="flex flex-col gap-0.5 border-l border-white/5 pl-2">
                                <span className="text-[8px] text-slate-500 uppercase font-black tracking-tight">Idle Capital</span>
                                <span className="text-[11px] text-blue-300 font-mono font-black leading-none">{formatCurrency(shadowWalletTotal, currency)}</span>
                              </div>
                            </div>

                            <p className="text-[9px] text-slate-400 leading-relaxed font-medium italic border-t border-rose-500/10 pt-2">
                              Holding cash while paying <span className="text-rose-300 font-bold">{foundationMetrics.maxInterestRate}%</span> interest is a <span className="not-italic text-rose-400 font-black">negative-sum game</span>.
                              Reserves cost you <span className="text-rose-300 font-bold">{formatCurrency((shadowWalletTotal * foundationMetrics.maxInterestRate / 100) / 12, currency)}/mo</span>.
                            </p>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-[clamp(1.5rem,5vw,1.875rem)] text-white font-black tabular-nums">
                <InteractiveFinancialValue value={safeDailyLimit} currency={currency} />
              </div>
            </div>
            <div>
              <p className="text-label text-[10px] mb-1.5 opacity-60 font-black">Budget Left</p>
              <div className="text-[clamp(1.5rem,5vw,1.875rem)] text-emerald-400 font-black tabular-nums">
                <InteractiveFinancialValue value={availableToSpend} currency={currency} />
              </div>
            </div>
          </div>

          <div className="dotted-divider opacity-50 mb-6" />
        </div>

        {/* Sub-Component C (The Footer) */}
        <div className="stack-footer relative z-10 space-y-2 px-8 pb-10">


          <CollapsibleSection
            title="Accounts"
            subtitle="Bank Accounts"
            icon={<Building2 className="w-4 h-4" />}
            value={formatCurrency(m1Assets, currency)}
            isOpen={activeCard === 'liquidity-group'}
            onToggle={() => toggleCard('liquidity-group')}
            variant="safe"
          >
            <div className="space-y-3">
              {accounts.filter(a => a.type === 'bank' || a.type === 'cash').map(acc => (
                <div id={`acc-${acc.id}`} key={acc.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    {acc.type === 'bank' ? <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" /> : <Wallet className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-200 uppercase truncate leading-tight">{acc.name}</p>
                      <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest truncate leading-tight">{acc.type === 'bank' ? 'Bank Account' : 'Cash'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums flex-shrink-0 ml-2">{formatCurrency(acc.balance, currency)}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Debt & Liability"
            subtitle="Capital Sourced"
            icon={<Activity className="w-4 h-4" />}
            value={<InteractiveFinancialValue value={totalLiabilities + totalMoneyOwed + totalCreditUsage} currency={currency} />}
            valueColor="text-rose-400"
            isOpen={activeCard === 'debt-group'}
            onToggle={() => toggleCard('debt-group')}
            variant="safe"
          >
            <div className="space-y-3">
              {[...liabilities, ...pendingBorrowedDebts, ...accounts.filter(a => a.type === 'credit_card' && a.balance < 0)].length === 0 ? (
                <div className="p-6 bg-slate-800/20 border border-dashed border-white/5 squircle-12 text-center">
                  <Activity className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No active liabilities found</p>
                  <p className="text-[10px] text-slate-600 mt-1 whitespace-nowrap">Your financial circulation is debt-free</p>
                </div>
              ) : (
                <>
                  {liabilities.map((l: any) => (
                    <div id={`liability-${l.id}`} key={l.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-200 uppercase truncate">{l.name}</p>
                          <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Loan Account</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-rose-400 tabular-nums">
                        <InteractiveFinancialValue value={l.outstanding || l.principal} currency={currency} />
                      </span>
                    </div>
                  ))}
                  {accounts.filter(a => a.type === 'credit_card' && a.balance < 0).map((card: any) => (
                    <div id={`card-${card.id}`} key={card.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-slate-500" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-200 uppercase truncate">{card.name}</p>
                          <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Card Usage</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-rose-400 tabular-nums">
                        <InteractiveFinancialValue value={Math.abs(card.balance)} currency={currency} />
                      </span>
                    </div>
                  ))}
                  {pendingBorrowedDebts.map((d: any) => (
                    <div id={`borrowed-${d.id}`} key={d.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-slate-500" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-200 uppercase truncate">{d.personName}</p>
                          <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Personal IOU</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-rose-400 tabular-nums">
                        <InteractiveFinancialValue value={d.amount} currency={currency} />
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Growth Assets"
            subtitle="Wealth Engines"
            icon={<TrendingUp className="w-4 h-4" />}
            value={<InteractiveFinancialValue value={totalInvestmentValue} currency={currency} />}
            isOpen={activeCard === 'invest-group'}
            onToggle={() => toggleCard('invest-group')}
            variant="safe"
          >
            <div className="space-y-3">
              {investments.length === 0 ? (
                <div className="p-6 bg-slate-800/20 border border-dashed border-white/5 squircle-12 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No active investments</p>
                </div>
              ) : (
                investments.slice(0, 3).map((inv: any) => (
                  <div id={`inv-${inv.id}`} key={inv.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-200 uppercase truncate">{inv.symbol || inv.name}</p>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{inv.type} Node</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {formatCurrency(inv.quantity * (inv.currentPrice || inv.buyPrice), currency)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Lent & Receivables"
            subtitle="Trust Capital Displaced"
            icon={<ArrowRightLeft className="w-4 h-4" />}
            value={<InteractiveFinancialValue value={totalMoneyLent} currency={currency} />}
            isOpen={activeCard === 'receivable-group'}
            onToggle={() => toggleCard('receivable-group')}
            variant="safe"
          >
            <div className="space-y-3">
              {pendingLentDebts.length === 0 ? (
                <div className="p-6 bg-slate-800/20 border border-dashed border-white/5 squircle-12 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No active receivables</p>
                  <p className="text-[10px] text-slate-600 mt-1 whitespace-nowrap">You haven't lent money recently</p>
                </div>
              ) : (
                pendingLentDebts.map((d: any) => (
                  <div id={`lent-${d.id}`} key={d.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-slate-500" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-200 uppercase truncate">{d.personName}</p>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Receivable Asset</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">
                      <InteractiveFinancialValue value={d.amount} currency={currency} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>
        </div>
      </motion.div>

      {/* 1.1 Action Insight Card (Conditional) */}
      {topInsight && (
        <div className="col-span-full mx-4">
          <ActionInsightCard
            insight={topInsight}
            onViewBudget={() => onNavigate?.('budgets')}
            onAddIncome={() => onAddTransaction?.('income')}
          />
        </div>
      )}

      {/* 1.2 Smart Notification Card (Evidence-Based) */}
      {topNotifications.length > 0 && (
        <div className="col-span-full mx-4">
          <NotificationCard
            notification={topNotifications[0]}
            onAction={() => {
              const route = topNotifications[0].action.route;
              if (route) {
                onNavigate?.(route.replace('/', ''));
              }
            }}
          />
        </div>
      )}


      {/* SECONDARY METRICS GRID (2x2 on Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-full">

        {/* 2. CIRCULATION ANALYSIS (Safe Zone - Teal) */}
        <div className="grid-widget bg-slate-900 border border-white/5 relative overflow-hidden h-full">
          <MeshBackground variant="safe" animate />
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/50" />
          <div className="relative z-10 p-6 h-full flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 sq-md flex-shrink-0">
                <Zap className="text-indigo-400 w-5 h-5" />
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] truncate">Circulation</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">Active Expense Node</p>
              </div>
            </div>

            <div className="space-y-2">
              <CollapsibleSection
                title="Cash Flow Speed"
                subtitle={velocityInfo.status}
                icon={<Activity className="w-4 h-4" />}
                value={liquidVelocity}
                valueColor={velocityInfo.color}
                isOpen={activeCard === 'flow-speed'}
                onToggle={() => toggleCard('flow-speed')}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-4 sq-md border border-white/5">
                    <span className="text-[8px] text-slate-500 uppercase block mb-1">Gross Income (Est)</span>
                    <div className="text-emerald-400 font-bold tabular-nums font-mono">
                      ~<InteractiveFinancialValue value={grossIncome} currency={currency} />
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-4 sq-md border border-white/5">
                    <span className="text-[8px] text-slate-500 uppercase block mb-1">Gross Burn</span>
                    <div className="text-red-400 font-bold tabular-nums font-mono">
                      <InteractiveFinancialValue value={grossBurn} currency={currency} />
                    </div>
                  </div>

                  <div className="col-span-2 space-y-4">
                    <div className={`p-5 rounded-xl border ${velocityInfo.bg} ${velocityInfo.border}`}>
                      <p className="text-xs text-slate-300 leading-relaxed">{velocityInfo.advice}</p>
                    </div>
                    <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <p className="text-xs text-white font-medium leading-relaxed">{velocityInfo.suggestion}</p>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Monthly Spending"
                subtitle={`${spendingVariance >= 0 ? 'Increase' : 'Decrease'} Node`}
                icon={<ArrowRightLeft className="w-4 h-4" />}
                value={`${spendingVariance > 0 ? '+' : ''}${spendingVariance}%`}
                valueColor={spendingVariance > 0 ? "text-rose-400" : "text-emerald-400"}
                isOpen={activeCard === 'spending-flow'}
                onToggle={() => toggleCard('spending-flow')}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                    <span className="text-[8px] text-slate-500 uppercase block mb-1">Daily Spend Avg</span>
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(Math.floor(grossBurn / 30), currency)}</span>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                    <span className="text-[8px] text-slate-500 uppercase block mb-1">Subscriptions</span>
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(subscriptionBurden, currency)}</span>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </div>

        {/* 3. RESERVE MANAGEMENT (Safe Zone - Blue) */}
        <div className="grid-widget bg-slate-900 border border-white/5 relative overflow-hidden h-full">
          <MeshBackground variant="safe" animate />
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/50" />
          <div className="relative z-10 p-6 h-full flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 sq-md flex-shrink-0">
                <ShieldCheck className="text-emerald-400 w-5 h-5" />
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] truncate">Reserves</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">Capital Accumulation</p>
              </div>
            </div>

            <div className="space-y-2">
              <CollapsibleSection
                title="Money Set Aside"
                subtitle={`${activeGoalsCount + (emergencyFundAmount > 0 ? 1 : 0) + (totalCommitments > 0 ? 1 : 0)} Buckets Active`}
                icon={<Wallet className="w-4 h-4" />}
                value={formatFinancialValue(totalReserved, currency)}
                valueColor="text-blue-400"
                isOpen={activeCard === 'reserve-vault'}
                onToggle={() => toggleCard('reserve-vault')}
              >
                <div className="space-y-4">
                  {emergencyFundAmount > 0 && (
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-300 block">Emergency Fund</span>
                      <div className="font-bold text-emerald-400 tabular-nums font-mono">
                        <InteractiveFinancialValue value={emergencyFundAmount} currency={currency} />
                      </div>
                    </div>
                  )}
                  {totalCommitments > 0 && (
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-300 block">Upcoming Bills/EMI</span>
                      <div className="font-bold text-red-400 tabular-nums font-mono">
                        <InteractiveFinancialValue value={totalCommitments} currency={currency} />
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Active Goals"
                subtitle="Targets Initialized"
                icon={<Target className="w-4 h-4" />}
                value={formatFinancialValue(shadowWalletTotal, currency)}
                valueColor="text-emerald-400"
                isOpen={activeCard === 'goals-vault'}
                onToggle={() => toggleCard('goals-vault')}
              >
                <div className="space-y-3">
                  {goals.map(g => (
                    <div id={`goal-${g.id}`} key={g.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{g.emoji || '🎯'}</span>
                        <div>
                          <span className="text-xs text-slate-300 block">{g.name}</span>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{g.type || 'Future Node'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white tabular-nums font-mono block">{formatCurrency(g.currentAmount, currency)}</span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-tighter">of {formatCurrency(g.targetAmount, currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </div>

        {/* 4. OBLIGATIONS (Safe Zone - Teal) */}
        <div className="grid-widget bg-slate-900 border border-white/5 relative overflow-hidden h-full">
          <MeshBackground variant="safe" animate />
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/50" />
          <div className="relative z-10 p-6 h-full flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center border border-blue-500/20 sq-md flex-shrink-0">
                <Activity className="text-blue-400 w-5 h-5" />
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] truncate">Obligations</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">Institutional Debt</p>
              </div>
            </div>

            <div className="space-y-2">
              <CollapsibleSection
                title="Active Liabilities"
                subtitle={`${liabilities.length + pendingBorrowedDebts.length} Active Strings`}
                icon={<Activity className="w-4 h-4" />}
                value={formatFinancialValue(totalLiabilities + totalMoneyOwed + totalCreditUsage, currency)}
                valueColor="text-rose-400"
                isOpen={activeCard === 'obligations-vault'}
                onToggle={() => toggleCard('obligations-vault')}
              >
                <div className="space-y-3">
                  {liabilities.map((l: any) => (
                    <div id={`ob-liability-${l.id}`} key={l.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-slate-300 uppercase truncate">{l.name}</span>
                      <span className="text-xs font-bold text-rose-400 tabular-nums font-mono">
                        {formatCurrency(l.outstanding || l.principal, currency)}
                      </span>
                    </div>
                  ))}
                  {totalCreditUsage > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-slate-300 uppercase">Card Usage</span>
                      <span className="text-xs font-bold text-rose-400 tabular-nums font-mono">
                        {formatCurrency(totalCreditUsage, currency)}
                      </span>
                    </div>
                  )}
                  {pendingBorrowedDebts.map((d: any) => (
                    <div id={`ob-borrowed-${d.id}`} key={d.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-slate-300 uppercase truncate">{d.personName}</span>
                      <span className="text-xs font-bold text-rose-400 tabular-nums font-mono">
                        {formatCurrency(d.amount, currency)}
                      </span>
                    </div>
                  ))}
                  {(liabilities.length === 0 && totalCreditUsage === 0 && pendingBorrowedDebts.length === 0) && (
                    <p className="text-[10px] text-slate-500 text-center py-4">No active obligations detected.</p>
                  )}
                </div>
              </CollapsibleSection>

              {/* Tactical Recovery shortcut if active */}
              {liabilities.length > 0 && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                  <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest mb-1">Tactical Mode Active</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Payback optimization logic is currently prioritizing high-interest nodes.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid-widget bg-slate-900 border border-white/5 relative overflow-hidden h-full">
          <MeshBackground variant="safe" animate />
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/50" />
          <div className="relative z-10 p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center border border-blue-500/20 sq-md">
                <TrendingUp className="text-blue-400 w-5 h-5" />
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Growth</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Asset Expansion</p>
              </div>
            </div>

            <div className="space-y-2">
              <CollapsibleSection
                title="Money Growth"
                subtitle={`${parseFloat(portfolioVelocity) >= 0 ? '+' : ''}${portfolioVelocity}% Velocity`}
                icon={<TrendingUp className="w-4 h-4" />}
                value={formatFinancialValue(totalInvestmentValue, currency)}
                valueColor="text-emerald-400"
                isOpen={activeCard === 'invest-growth-widget'}
                onToggle={() => toggleCard('invest-growth-widget')}
              >
                <div className="p-6 bg-white/5 border border-dashed border-white/10 rounded-xl text-center">
                  <Activity className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Portfolio Deep Dive</p>
                  <p className="text-[10px] text-slate-600 mt-1">Visit Investments tab for detailed node analysis</p>
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </div>
      </div>

      {/* 7. TACTICAL RECOVERY (if active) */}
      {liabilities.length > 0 && (
        <TacticalRecovery liabilities={liabilities} />
      )}

      {/* 8. ADVANCED INSIGHTS GRID */}
      <AdvancedInsights
        currency={currency}
        expenses={reconciledExpenses}
        incomes={reconciledIncomes}
        accounts={accounts}
        goals={goals}
        liabilities={liabilities}
        savingsRate={finalSavingsRateScore}
        dtiRatio={dtiRatio}
        outflowRatio={outflowRatio}
        healthScore={healthScore}
        userName={userName}
        debts={debts}
        isOffline={isOffline}
        investments={investments}
      />

      {/* FAB STACK IS NOW HANDLED BY layout/FabStack.tsx (FabDock) rendered in App.tsx */}

      {/* HIDDEN SPACER for Last Item Visibility */}
      <div className="h-24 w-full col-span-full" />

    </div>
  );
});
