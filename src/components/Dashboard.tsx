import React, { useState } from 'react';
import {
  Target,
  TrendingUp,
  Wallet,
  Building2,
  CreditCard,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRightLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InteractiveFinancialValue } from './ui/InteractiveFinancialValue';

import { TruthBanner } from './dashboard/TruthBanner';
import { TacticalRecovery } from './dashboard/TacticalRecovery';
import { AdvancedInsights } from './dashboard/AdvancedInsights';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { useShadowWallet } from '@/hooks/useShadowWallet';
import { formatCurrency, formatFinancialValue } from '@/utils/numberFormat';
import { isTransfer } from '@/utils/isTransfer';
import { Expense, Income, Account, Debt } from '@/types';

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
}

export const Dashboard: React.FC<DashboardProps> = ({
  expenses,
  incomes = [],
  currency,
  goals = [],
  emergencyFundAmount = 0,
  liabilities = [],
  debts = [],
  investments = [],
  accounts = []
}) => {

  // 1. Cross-Account Reconciliation Logic
  const reconciledExpenses = expenses.map(e => ({ ...e, isInternalTransfer: e.isInternalTransfer || isTransfer(e) }));
  const reconciledIncomes = incomes.map(i => ({ ...i, isInternalTransfer: i.isInternalTransfer || isTransfer(i) }));

  // Auto-detect matching outflow/inflow pairs on the same day across different accounts
  reconciledExpenses.forEach(exp => {
    if (exp.isInternalTransfer) return;
    const match = reconciledIncomes.find(inc =>
      !inc.isInternalTransfer &&
      inc.amount === exp.amount &&
      inc.date.split('T')[0] === exp.date.split('T')[0] && // Compare date parts only
      inc.accountId !== exp.accountId
    );
    if (match) {
      exp.isInternalTransfer = true;
      match.isInternalTransfer = true;
    }
  });

  // Logic for Available-to-Spend
  const {
    shadowWalletTotal,
    totalReserved,
    availableToSpend,
    totalCreditUsage,
    totalCommitments
  } = useShadowWallet({
    accounts,
    goals,
    liabilities,
    expenses: reconciledExpenses,
    emergencyFundAmount
  });

  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Time & Filtering Logic for Guru Vitals
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();

  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = lastDayOfMonth - today.getDate() + 1;


  // Filter expenses for current month only for accurate velocity
  const currentMonthExpenses = reconciledExpenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && !e.isInternalTransfer;
  });

  const lastMonthExpenses = reconciledExpenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && !e.isInternalTransfer;
  });

  const toggleCard = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId);
  };

  // derived stats
  const activeGoalsCount = goals.length;
  const totalLiabilities = liabilities.reduce((sum: number, l: any) => sum + (l.outstanding || l.principal || 0), 0);

  // Money Owed: Pending Borrowed Debts
  const pendingBorrowedDebts = debts.filter(d => d.type === 'borrowed' && d.status === 'pending');
  const totalMoneyOwed = pendingBorrowedDebts.reduce((sum, d) => sum + d.amount, 0);

  // Money I Lent: Pending Lent Debts
  const pendingLentDebts = debts.filter(d => d.type === 'lent' && d.status === 'pending');
  const totalMoneyLent = pendingLentDebts.reduce((sum, d) => sum + d.amount, 0);

  // Investment Speed: (Current Value - Principal) / Principal * 100
  // Aggregation Rule: Source Independence & Ghost Node Protection
  const filteredInvestments = investments.filter(inv => {
    if (inv.accountId && inv.accountId !== 'none') {
      const acc = accounts.find(a => a.id === inv.accountId);
      if (acc && acc.type !== 'investment') return false;
    }

    // Time-Weighting: Optional filtering by purchase date
    // Removed timeRange filtering as it's no longer used
    return true;
  });

  const totalPrincipal = filteredInvestments.reduce((sum: number, inv: any) => sum + (inv.buyPrice * inv.quantity), 0);
  const totalInvestmentValue = filteredInvestments.reduce((sum: number, inv: any) => sum + ((inv.currentPrice || inv.buyPrice) * inv.quantity), 0);

  const portfolioVelocity = totalPrincipal > 0
    ? (((totalInvestmentValue - totalPrincipal) / totalPrincipal) * 100).toFixed(1)
    : "0.0";

  // Total M1 assets (Bank + Cash)
  const m1Assets = accounts
    .filter(acc => acc.type === 'bank' || acc.type === 'cash')
    .reduce((sum, acc) => sum + acc.balance, 0);

  // Guru Vitals
  const grossIncome = reconciledIncomes.filter(i => !i.isInternalTransfer).reduce((sum: number, i: Income) => sum + i.amount, 0) || 42500;
  const grossBurn = currentMonthExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
  const lastMonthBurn = lastMonthExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);

  // Spending Variance (+/- %)
  const spendingVariance = lastMonthBurn > 0
    ? Math.round(((grossBurn - lastMonthBurn) / lastMonthBurn) * 100)
    : 0;

  const subscriptionBurden = currentMonthExpenses
    .filter(e => e.category === 'Subscription')
    .reduce((sum, e) => sum + e.amount, 0);

  // Cash Flow Speed = (Total Monthly Spending / M1 Assets) * 100
  const velocityValue = m1Assets > 0 ? (grossBurn / m1Assets) : 0;
  const liquidVelocity = (velocityValue * 100).toFixed(1) + '%';

  const getVelocityInterpretation = (velocity: number) => {
    if (velocity > 1.0) return {
      status: 'Aggressive',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      advice: 'High-velocity detected. Spending is outpacing liquid nodes. Priority: Solidify safety buffer.',
      suggestion: 'Consolidate spending and pause growth node transfers for 30 days.'
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
      suggestion: 'Protocol: Continue current flow. System is in high-efficiency state.'
    };
  };

  const velocityInfo = getVelocityInterpretation(velocityValue);

  // Daily Spending Limit = Available / Days remaining
  const safeDailyLimit = daysRemaining > 0 ? Math.floor(availableToSpend / daysRemaining) : 0;



  return (
    <div className="main-grid">

      {/* AI Truth Banner */}
      <TruthBanner
        message={`Assessment: ₹${formatCurrency(totalReserved, currency, true)} reserved. Safe daily spending limit is ₹${formatCurrency(safeDailyLimit, currency, true)} for the next ${daysRemaining} days.`}
      />

      {/* 1. COLLAPSIBLE BALANCE BOARD */}
      <motion.div
        layout
        initial={false}
        className={`segmented-stack mesh-gradient-card group transition-all duration-500 col-span-full`}
      >
        {/* Sub-Component A (The Cap) */}
        <div className="stack-cap relative z-10 border-none bg-transparent">
          {/* Animated Mesh Blobs */}
          <div className="mesh-blob mesh-blob-1" />
          <div className="mesh-blob mesh-blob-2" />
          <div className="mesh-blob mesh-blob-3" />

          {/* Ghost Header Icon */}
          <Wallet className="hero-ghost-icon" />

          <div className="flex justify-between items-start relative z-20">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-label text-[9px]">Balance Board</h3>
                <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-500/20 bg-blue-500/10 text-[#0A84FF]">
                  Total Liquidity
                </div>
              </div>
              <motion.div
                layoutId="balance-mount"
                className="hero-text text-5xl md:text-6xl lg:text-7xl tabular-nums text-white"
              >
                <InteractiveFinancialValue value={m1Assets} currency={currency} />
              </motion.div>
            </div>
            <div className="w-14 h-14 bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-xl group-hover:scale-110 transition-transform duration-500 rounded-2xl">
              <Wallet className="text-blue-400 w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Sub-Component B (The Body) */}
        <div className="stack-body relative z-10">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-label text-[10px] mb-1.5 opacity-60">Daily Spend</p>
              <div className="text-balance text-xl text-white tabular-nums">
                <InteractiveFinancialValue value={safeDailyLimit} currency={currency} />
              </div>
            </div>
            <div>
              <p className="text-label text-[10px] mb-1.5 opacity-60">Budget Left</p>
              <div className="text-balance text-xl text-[#30D158] tabular-nums">
                <InteractiveFinancialValue value={availableToSpend} currency={currency} />
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Component C (The Footer) */}
        <div className="stack-footer relative z-10 bg-transparent border-t border-white/5 py-6">

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-label text-[10px] mb-1.5 opacity-60">Daily Spend</p>
              <p className="text-balance text-xl text-white tabular-nums">
                {formatCurrency(safeDailyLimit, currency)}
              </p>
            </div>
            <div>
              <p className="text-label text-[10px] mb-1.5 opacity-60">Budget Left</p>
              <p className="text-balance text-xl text-[#30D158] tabular-nums">
                {formatCurrency(availableToSpend, currency)}
              </p>
            </div>
          </div>


          <CollapsibleSection
            title="Liquidity Nodes"
            subtitle="Institutional Reservoirs"
            icon={<Building2 className="w-4 h-4" />}
            value={formatCurrency(m1Assets, currency)}
            isOpen={activeCard === 'liquidity-group'}
            onToggle={() => toggleCard('liquidity-group')}
          >
            <div className="space-y-3">
              {accounts.filter(a => a.type === 'bank' || a.type === 'cash').map(acc => (
                <div key={acc.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    {acc.type === 'bank' ? <Building2 className="w-4 h-4 text-blue-400" /> : <Wallet className="w-4 h-4 text-emerald-400" />}
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-200 uppercase truncate">{acc.name}</p>
                      <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{acc.type === 'bank' ? 'Institutional Reservoir' : 'Physical Cash Node'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">{formatCurrency(acc.balance, currency)}</span>
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
                    <div key={l.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-200 uppercase truncate">{l.name}</p>
                          <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Loan Reservoir</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-rose-400 tabular-nums">
                        <InteractiveFinancialValue value={l.outstanding || l.principal} currency={currency} />
                      </span>
                    </div>
                  ))}
                  {accounts.filter(a => a.type === 'credit_card' && a.balance < 0).map((card: any) => (
                    <div key={card.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-white/5">
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
                    <div key={d.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-white/5">
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
            title="Lent & Receivables"
            subtitle="Capital Displaced"
            icon={<TrendingUp className="w-4 h-4" />}
            value={<InteractiveFinancialValue value={totalMoneyLent} currency={currency} />}
            valueColor="text-emerald-400"
            isOpen={activeCard === 'receivable-group'}
            onToggle={() => toggleCard('receivable-group')}
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
                  <div key={d.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-white/5">
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


      {/* SECONDARY METRICS GRID (2x2 on Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-full">
        {/* 2. CIRCULATION ANALYSIS */}
        <div className="grid-widget mesh-gradient-card group relative">
          {/* Animated Mesh Blobs */}
          <div className="mesh-blob mesh-blob-1 opacity-10" />
          <div className="mesh-blob mesh-blob-3 opacity-10" />

          {/* Ghost Icon */}
          <Zap className="hero-ghost-icon" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center border border-blue-500/20 rounded-xl">
                <Zap className="text-blue-400 w-5 h-5" />
              </div>
              <div>
                <h3 className="text-label text-[10px]">Circulation</h3>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Efficiency</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-5 rounded-xl border border-white/5">
                    <span className="text-[8px] text-slate-500 uppercase block mb-1">Gross Income (Est)</span>
                    <div className="text-emerald-400 font-bold tabular-nums">
                      ~<InteractiveFinancialValue value={grossIncome} currency={currency} />
                    </div>
                  </div>
                  <div className="bg-slate-800 p-5 rounded-xl border border-white/5">
                    <span className="text-[8px] text-slate-500 uppercase block mb-1">Gross Burn</span>
                    <div className="text-red-400 font-bold tabular-nums">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800 rounded-xl border border-white/5">
                    <span className="text-[8px] text-slate-500 uppercase block mb-1">Daily Spend Avg</span>
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(Math.floor(grossBurn / 30), currency)}</span>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-xl border border-white/5">
                    <span className="text-[8px] text-slate-500 uppercase block mb-1">Subscriptions</span>
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(subscriptionBurden, currency)}</span>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </div>

        {/* 3. RESERVE MANAGEMENT */}
        <div className="grid-widget mesh-gradient-card group relative">
          {/* Animated Mesh Blobs */}
          <div className="mesh-blob mesh-blob-2 opacity-10" />
          <div className="mesh-blob mesh-blob-3 opacity-10" />

          {/* Ghost Icon */}
          <ShieldCheck className="hero-ghost-icon" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/10 flex items-center justify-center border border-purple-500/20 rounded-xl">
                <ShieldCheck className="text-purple-400 w-5 h-5" />
              </div>
              <div>
                <h3 className="text-label text-[10px]">Reserves</h3>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Allocations</p>
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
                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-300 block">Emergency Fund</span>
                      <div className="font-bold text-emerald-400 tabular-nums">
                        <InteractiveFinancialValue value={emergencyFundAmount} currency={currency} />
                      </div>
                    </div>
                  )}
                  {totalCommitments > 0 && (
                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-300 block">Upcoming Bills/EMI</span>
                      <div className="font-bold text-red-400 tabular-nums">
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
                    <div key={g.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{g.emoji || '🎯'}</span>
                        <div>
                          <span className="text-xs text-slate-300 block">{g.name}</span>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{g.type || 'Future Node'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white tabular-nums block">{formatCurrency(g.currentAmount, currency)}</span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-tighter">of {formatCurrency(g.targetAmount, currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </div>

        {/* 4. INVESTMENTS (Money Growth) */}
        <div className="grid-widget mesh-gradient-card group relative">
          {/* Animated Mesh Blobs */}
          <div className="mesh-blob mesh-blob-1 opacity-10" />
          <div className="mesh-blob mesh-blob-2 opacity-10" />

          {/* Ghost Icon */}
          <TrendingUp className="hero-ghost-icon" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 rounded-xl">
                <TrendingUp className="text-emerald-400 w-5 h-5" />
              </div>
              <div>
                <h3 className="text-label text-[10px]">Growth</h3>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Valuation</p>
              </div>
            </div>

            <CollapsibleSection
              title="Money Growth"
              subtitle={`${parseFloat(portfolioVelocity) >= 0 ? '+' : ''}${portfolioVelocity}% Velocity`}
              icon={<TrendingUp className="w-4 h-4" />}
              value={formatFinancialValue(totalInvestmentValue, currency)}
              valueColor="text-emerald-400"
              isOpen={activeCard === 'invest-growth'}
              onToggle={() => toggleCard('invest-growth')}
            >
              <div className="p-6 bg-slate-800/20 border border-dashed border-white/5 rounded-xl text-center">
                <Activity className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Portfolio Deep Dive</p>
                <p className="text-[10px] text-slate-600 mt-1">Visit Investments tab for detailed node analysis</p>
              </div>
            </CollapsibleSection>
          </div>
        </div>

        {/* 7. TACTICAL RECOVERY (if active) */}
        {liabilities.length > 0 && (
          <TacticalRecovery liabilities={liabilities} />
        )}
      </div>

      {/* 8. ADVANCED INSIGHTS GRID */}
      {(() => {
        const totalEMIs = liabilities.reduce((sum, l) => sum + (l.emiAmount || 0), 0);
        const totalCCDebt = accounts
          .filter(a => a.type === 'credit_card')
          .reduce((sum, a) => sum + Math.abs(a.balance), 0);
        const monthlyCCPayment = totalCCDebt * 0.05; // 5% minimum payment estimate
        const totalMonthlyDebt = totalEMIs + monthlyCCPayment;

        // Outflow Calculation for Leakage Tracker (Multi-Account Aggregate)
        const bankAccountIds = accounts.filter(a => a.type === 'bank').map(a => a.id);
        const spendAccountIds = accounts.filter(a => ['bank', 'cash', 'credit_card'].includes(a.type)).map(a => a.id);

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

        // Outflow = Spending from Credit Cards + Cash + Bank
        const refinedSpend = reconciledExpenses.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() === currentMonth &&
            d.getFullYear() === currentYear &&
            spendAccountIds.includes(e.accountId) &&
            !e.isInternalTransfer;
        }).reduce((sum, e) => sum + e.amount, 0);

        // Leakage = Refined Spending + Investments
        const totalOutflows = refinedSpend + currentMonthInvestments;
        const outflowRatio = currentMonthIncomes > 0 ? (totalOutflows / currentMonthIncomes) : 0;

        return (
          <AdvancedInsights
            currency={currency}
            expenses={reconciledExpenses}
            incomes={reconciledIncomes}
            accounts={accounts}
            savingsRate={grossIncome > 0 ? ((grossIncome - grossBurn) / grossIncome * 100) : 0}
            dtiRatio={grossIncome > 0 ? (totalMonthlyDebt / grossIncome) : 0}
            outflowRatio={outflowRatio}
          />
        );
      })()}

      {/* FAB STACK IS NOW HANDLED BY layout/FabStack.tsx (FabDock) rendered in App.tsx */}

      {/* HIDDEN SPACER for Last Item Visibility */}
      <div className="h-24 w-full col-span-full" />

    </div>
  );
};
