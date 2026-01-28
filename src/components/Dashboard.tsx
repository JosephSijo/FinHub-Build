import React, { useState, useMemo } from 'react';
import {
  Info,
  CreditCard,
  Wallet
} from 'lucide-react';
import { DecisionEngine } from './dashboard/widgets/DecisionEngine';
import { FinancialStressScore } from './dashboard/widgets/FinancialStressScore';
import { CashflowForecastCard } from './dashboard/widgets/CashflowForecastCard';
import { SmartTriggers, Trigger } from './dashboard/widgets/SmartTriggers';
import { TrendMonitor } from './dashboard/widgets/TrendMonitor';
import { SubscriptionIntelligenceCard } from './dashboard/widgets/SubscriptionIntelligenceCard';
// GoalDriftIndicator removed
import { SpendingEfficiency } from './dashboard/widgets/SpendingEfficiency';
import { DTIRiskZone } from './dashboard/widgets/DTIRiskZone';

// Logic & Utils
import { useAssistantInsights } from '@/hooks/useAssistantInsights';
import { isTransfer } from '@/utils/isTransfer';
import { Expense, Income, Account, Debt, AIContext, Goal, Liability, RecurringTransaction } from '@/types';
import { calculateCoreHealthMetrics } from '@/utils/architect';
import { actionInsightsLogic } from '../features/actionInsights';
import { notificationsLogic, NotificationContext } from '../features/notifications';
import { formatCurrency } from '@/utils/numberFormat';
import { CollapsibleSection } from './ui/CollapsibleSection';

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
  expenses: [] as Expense[], // Keeping structure but empty for brevity in rewrite if unused, logic handles partials
  incomes: [] as Income[],
  accounts: [] as Account[],
  goals: [] as Goal[],
  liabilities: [] as Liability[],
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
  isSampleMode = false,
  recurringTransactions = [],
  onNavigate,
}) => {

  // --- Prep Data (Legacy Support + New Widgets) ---
  const displayExpenses = useMemo(() => isSampleMode ? GENERIC_AVERAGES.expenses : expenses, [isSampleMode, expenses]);
  const displayIncomes = useMemo(() => isSampleMode ? GENERIC_AVERAGES.incomes : incomes, [isSampleMode, incomes]);
  const displayAccounts = useMemo(() => isSampleMode ? GENERIC_AVERAGES.accounts : accounts, [isSampleMode, accounts]);
  const displayGoals = useMemo(() => isSampleMode ? GENERIC_AVERAGES.goals : goals, [isSampleMode, goals]);
  const displayLiabilities = useMemo(() => isSampleMode ? GENERIC_AVERAGES.liabilities : liabilities, [isSampleMode, liabilities]);
  const displayDebts = useMemo(() => isSampleMode ? GENERIC_AVERAGES.debts : debts, [isSampleMode, debts]);
  const displayHealthScore = isSampleMode ? 85 : healthScore;

  // Reconcile Transfers
  const { reconciledExpenses, reconciledIncomes } = useMemo(() => {
    const rExpenses = displayExpenses.map(e => ({ ...e, isInternalTransfer: e.isInternalTransfer || isTransfer(e as any) }));
    const rIncomes = displayIncomes.map(i => ({ ...i, isInternalTransfer: i.isInternalTransfer || isTransfer(i as any) }));
    return { reconciledExpenses: rExpenses, reconciledIncomes: rIncomes };
  }, [displayExpenses, displayIncomes]);

  const {
    reservedFundsTotal,
    availableToSpend
  } = useAssistantInsights({
    accounts: displayAccounts as any,
    goals: displayGoals,
    liabilities: displayLiabilities,
    expenses: reconciledExpenses as any,
    emergencyFundAmount
  });

  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Stats Calculation for Widgets
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = lastDayOfMonth - today.getDate() + 1;

    // Filtered Lists
    const currentMonthExpenses = reconciledExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && !e.isInternalTransfer;
    });

    const lastMonthExpenses = reconciledExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && !e.isInternalTransfer;
    });

    // Totals
    // Totals
    // m1Assets removed if unused
    const grossIncome = reconciledIncomes.filter(i => !i.isInternalTransfer).reduce((sum, i) => sum + i.amount, 0) || 0;
    const grossBurn = currentMonthExpenses.reduce((sum, e: Expense) => sum + e.amount, 0);
    const lastMonthBurn = lastMonthExpenses.reduce((sum, e: Expense) => sum + e.amount, 0);

    // Daily Burn Rate (Simple Average)
    const dayOfMonth = today.getDate();
    const dailyBurnRate = dayOfMonth > 0 ? grossBurn / dayOfMonth : 0;

    // Spending Categories for Donut
    const categoryTotals = currentMonthExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value, color: '#3b82f6' })) // Default color, can refine
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Debt & Subscriptions
    const totalEMIs = displayLiabilities.reduce((sum: number, l: any) => sum + (l.emiAmount || 0), 0);
    const totalCCDebt = displayAccounts.filter(a => a.type === 'credit_card').reduce((sum, a) => sum + Math.abs(a.cachedBalance), 0);
    const totalMonthlyDebt = totalEMIs + (totalCCDebt * 0.05); // 5% Min Due assumption
    const dtiRatio = grossIncome > 0 ? (totalMonthlyDebt / grossIncome) : 0;
    const totalDebt = displayLiabilities.reduce((sum: number, l: any) => sum + (l.outstanding || 0), 0) + totalCCDebt;

    // Core Metrics
    const architectureContext: AIContext = {
      totalIncome: grossIncome,
      totalExpenses: grossBurn,
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
      activeDebts: displayLiabilities.length,
      goalsCount: displayGoals.length
    };

    const coreHealthMetrics = calculateCoreHealthMetrics(architectureContext);

    return {
      daysRemaining,
      availableLiquidity: availableToSpend, // Using availableToSpend which deducts reserves
      grossIncome,
      grossBurn,
      lastMonthBurn,
      dailyBurnRate,
      categoryData,
      safeDailyLimit: coreHealthMetrics.dailySpendingLimit,
      dtiRatio,
      totalDebt,
      coreHealthMetrics,
      savingsRate: architectureContext.savingsRate
    };
  }, [reconciledExpenses, displayAccounts, displayIncomes, displayLiabilities, displayGoals, availableToSpend, currency, displayHealthScore]);


  // --- Logic for Widgets ---

  // 1. Decision Engine Data
  const topInsight = useMemo(() => {
    const rawInsight = actionInsightsLogic.generateTopInsight(
      reconciledExpenses as any,
      displayIncomes as any,
      displayLiabilities as any,
      displayGoals as any,
      availableToSpend
    );

    // Map to DecisionEngine format if needed, or maintain compatibility
    // Assuming generated insight has similar structure
    return {
      title: rawInsight.title,
      message: rawInsight.message,
      priority: rawInsight.priority === 'high' ? 0 : rawInsight.priority === 'medium' ? 1 : 2,
      pivotActions: rawInsight.actions ? rawInsight.actions.map(a => a.label) : [],
      tradeOff: { comparisonMessage: rawInsight.type === 'warning' ? "Immediate action required to prevent financial drag." : "Optimization opportunity detected." }
    };
  }, [reconciledExpenses, displayIncomes, displayLiabilities, displayGoals, availableToSpend]);

  // 2. Notifications to Smart Triggers
  const triggers: Trigger[] = useMemo(() => {
    const context: NotificationContext = {
      userId: 'current-user',
      accountCount: displayAccounts.length,
      totalBalance: reservedFundsTotal,
      hasIncome: displayIncomes.length > 0,
      transactionCount: reconciledExpenses.length + displayIncomes.length,
      accountAge: 30, // Mock
      scheduledPayments: [],
      budgetGaps: [],
      overdueIOUs: [],
      missedEMIs: [],
      feeAlerts: [],
      daysSinceLastExpense: 0,
      safeToSpend: availableToSpend
    };

    const notifs = notificationsLogic.generateNotifications(context, currency, 1);

    return notifs.map((n: any) => ({
      id: n.id,
      title: n.message.slice(0, 20) + '...', // Fallback title or map from type
      message: n.message,
      type: (n.priority === 'CRITICAL' || n.priority === 'HIGH') ? 'critical' : n.priority === 'MEDIUM' ? 'optimization' : 'info',
      actionLabel: n.action?.label,
      onAction: n.action?.handler
    }));
  }, [displayAccounts, reservedFundsTotal, displayIncomes, reconciledExpenses, availableToSpend, currency]);

  // 3. Renewals
  const renewals = useMemo(() => {
    return recurringTransactions
      .filter(t => t.type === 'expense') // Only expenses
      .map(t => ({
        id: t.id,
        name: t.description || t.source || 'Subscription',
        amount: t.amount,
        date: new Date(new Date().getFullYear(), new Date().getMonth(), t.dueDay || 1).toISOString(),
        daysUntil: Math.max(0, (t.dueDay || 1) - new Date().getDate())
      }));
  }, [recurringTransactions]);


  // --- Render Layout ---

  return (
    <div className="main-grid gap-4 sm:gap-6 pb-20">

      {/* 1. LAYER 1: PRIORITY DECISION */}
      <DecisionEngine
        analysis={topInsight}
        onAction={() => onNavigate?.('action_center')}
      />

      {/* 2. LAYER 2: SURVIVAL STATUS */}
      <section className="col-span-full grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* Health Score (Left) */}
        <div className="md:col-span-4 h-full">
          <FinancialStressScore
            score={displayHealthScore}
            income={stats.grossIncome}
            metrics={{
              savings: Math.min(100, (stats.savingsRate * 100) / 0.3), // Normalized score (30% = 100)
              debt: 100 - (stats.dtiRatio * 100), // Invert DTI for "Good" score
              efficiency: 100 - (stats.grossIncome > 0 ? (stats.grossBurn / stats.grossIncome) * 100 : 0),
              buffer: 60, // Mock for now or calc from runway
              incomeStability: stats.grossIncome > 0 ? 100 : 0
            }}
          />
        </div>

        {/* Cashflow Forecast (Middle) */}
        <div className="md:col-span-4 h-full">
          <CashflowForecastCard
            daysRemaining={stats.daysRemaining}
            safeDailyLimit={stats.safeDailyLimit}
            burnRate={stats.dailyBurnRate}
            availableLiquidity={stats.availableLiquidity}
            currency={currency}
          />
        </div>

        {/* Smart Triggers (Right) */}
        <div className="md:col-span-4 h-full">
          {triggers.length > 0 ? (
            <SmartTriggers triggers={triggers} />
          ) : (
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 h-full flex items-center justify-center">
              <div className="text-center text-slate-500">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold uppercase tracking-widest">No Alerts</p>
              </div>
            </div>
          )}
        </div>

      </section>

      {/* Conditionally Render DTI Warning if Critical */}
      <DTIRiskZone
        dtiRatio={stats.dtiRatio}
        totalDebt={stats.totalDebt}
        currency={currency}
      />

      {/* 3. LAYER 3: BEHAVIOR & TRENDS */}
      <section className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Trend Monitor */}
        <div className="md:col-span-1 h-56">
          <TrendMonitor
            currency={currency}
            currentMonthSpending={stats.grossBurn}
            lastMonthSpending={stats.lastMonthBurn}
            isSpiking={stats.grossBurn > stats.lastMonthBurn * 1.15}
            data={stats.categoryData}
          />
        </div>

        {/* Spending Efficiency */}
        <div className="md:col-span-1 h-56">
          <SpendingEfficiency
            income={stats.grossIncome}
            spending={stats.grossBurn}
          />
        </div>

        {/* Goal Drift / Subscriptions split column */}
        <div className="md:col-span-1 flex flex-col gap-4 h-56">
          <div className="flex-1 min-h-0">
            <SubscriptionIntelligenceCard
              renewals={renewals}
              totalMonthly={stats.grossBurn} // Approximation
            />
          </div>
          {/* Or Drift if needed */}
        </div>

      </section>

      {/* 4. DETAILS - COLLAPSIBLE (Keeping Legacy Details for now, but usually hidden/minimized) */}
      <div className="col-span-full mt-8 opacity-50 hover:opacity-100 transition-opacity">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-600 mb-4">Detailed Assets & Liabilities</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CollapsibleSection title="Accounts" subtitle={`${displayAccounts.length} Connected`} icon={<Wallet className="w-4 h-4" />} value="" isOpen={activeCard === 'acc'} onToggle={() => setActiveCard(activeCard === 'acc' ? null : 'acc')}>
            {displayAccounts.map(a => (
              <div key={a.id} className="p-3 border-b border-white/5 last:border-0 flex justify-between text-xs">
                <span className="text-slate-300">{a.name}</span>
                <span className="font-mono">{formatCurrency(a.cachedBalance, currency)}</span>
              </div>
            ))}
          </CollapsibleSection>

          <CollapsibleSection title="Liabilities" subtitle={`${displayLiabilities.length} Active`} icon={<CreditCard className="w-4 h-4" />} value="" isOpen={activeCard === 'lia'} onToggle={() => setActiveCard(activeCard === 'lia' ? null : 'lia')}>
            {displayLiabilities.map(a => (
              <div key={a.id} className="p-3 border-b border-white/5 last:border-0 flex justify-between text-xs">
                <span className="text-slate-300">{a.name}</span>
                <span className="font-mono text-rose-400">{formatCurrency(a.outstanding, currency)}</span>
              </div>
            ))}
          </CollapsibleSection>
        </div>
      </div>

    </div>
  );
});
