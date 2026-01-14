import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { RecurringTransactions } from "./components/RecurringTransactions";

// Icons moved to AppHeader
import { toast, Toaster } from "sonner";
import confetti from "canvas-confetti";
// import { Dashboard } from "./components/Dashboard"; // Lazy Loaded below
import { ScrollAwareLayout } from "./components/layout/ScrollAwareLayout";
import { TransactionForm } from "./components/TransactionForm";
import { RoundUpDialog } from "./components/RoundUpDialog";
// import { TransactionList } from "./components/TransactionList"; // Lazy Loaded
// import { GoalsTracker } from "./components/GoalsTracker"; // Lazy Loaded
// import { EmergencyFundsTab } from "./components/EmergencyFundsTab"; // Lazy Loaded
// import { AIAssistant } from "./components/AIAssistant"; // Replaced by Overlay
import { EnhancedSettingsPanel } from "./components/EnhancedSettingsPanel";
// import { QuoteOfTheDay } from "./components/QuoteOfTheDay"; // Removed in new design
// import { InvestmentsTab } from "./components/InvestmentsTab"; // Lazy Loaded
// import { LiabilityTab } from "./components/LiabilityTab"; // Lazy Loaded
// import { LiabilityDashboard } from "./components/LiabilityDashboard"; // Lazy Loaded
import { MoreTab } from "./components/MoreTab";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { AchievementDetailDialog } from "./components/AchievementDetailDialog";
import { FundAllocationDialog } from "./components/FundAllocationDialog";
import { useFinance } from "./context/FinanceContext";
import {
  Expense,
  Income,
  Debt,
  AIContext,
  CURRENCY_SYMBOLS,
} from "./types";
import { AccountsManager } from "./components/AccountsManager";
import { TransferForm } from "./components/TransferForm";
import { PullToRefresh } from "./components/PullToRefresh";
import { DashboardSkeleton } from "./components/LoadingSkeleton";
import { useEdgeSwipe } from "./utils/gestures";
import { generateBrainSummary } from "./utils/aiUtils";
import { FabStack } from "./components/layout/FabStack";
import { AIChatOverlay } from "./components/overlays/AIChatOverlay";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoginScreen } from "./components/auth/LoginScreen";
import { LoadingSprite } from "./components/ui/LoadingSprite";
import { motion, AnimatePresence } from "framer-motion";
import { AboutUsPopup } from "./components/overlays/AboutUsPopup";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Lazy Load Heavy Components
const Dashboard = lazy(() => import("./components/Dashboard").then(module => ({ default: module.Dashboard })));
const TransactionList = lazy(() => import("./components/TransactionList").then(module => ({ default: module.TransactionList })));
const GoalsTracker = lazy(() => import("./components/GoalsTracker").then(module => ({ default: module.GoalsTracker })));
const EmergencyFundsTab = lazy(() => import("./components/EmergencyFundsTab").then(module => ({ default: module.EmergencyFundsTab })));
const InvestmentsTab = lazy(() => import("./components/InvestmentsTab").then(module => ({ default: module.InvestmentsTab })));
const LiabilityTab = lazy(() => import("./components/LiabilityTab").then(module => ({ default: module.LiabilityTab })));
const LiabilityDashboard = lazy(() => import("./components/LiabilityDashboard").then(module => ({ default: module.LiabilityDashboard })));

type View = "dashboard" | "transactions" | "goals" | "investments" | "accounts" | "emergency" | "liability" | "more" | "recurring";
type TransactionType = "expense" | "income" | "debt";

export default function App() {
  const {
    settings,
    expenses,
    incomes,
    debts,
    goals,
    accounts,
    liabilities,
    notifications,
    emergencyFundAmount,
    investments,
    isLoading,
    refreshData,
    updateSettings,
    userId,
    createExpense,
    updateExpense,
    deleteExpense,
    createIncome,
    updateIncome,
    deleteIncome,
    createDebt,
    updateDebt,
    deleteDebt,
    settleDebt,
    createGoal,
    updateGoal,
    deleteGoal,
    createAccount,
    updateAccount,
    deleteAccount,
    setEmergencyFundAmount,
    setNotifications,
    // Fund Allocation from Context
    isFundAllocationOpen,
    fundAllocationType,
    closeFundAllocation,
    performFundAllocation,
    transferFunds,
    authStatus,
    isOffline,
    authMessage,
    // Backfill
    backfillRequest,
    setBackfillRequest,
    executeBackfill,
    createRecurring
  } = useFinance();

  const [view, setView] = useState<View>("dashboard");



  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionFormType, setTransactionFormType] = useState<TransactionType>("expense");
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [isAchievementDialogOpen, setIsAchievementDialogOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);

  // Round-Up State
  const [isRoundUpOpen, setIsRoundUpOpen] = useState(false);
  const [roundUpData] = useState<{
    expenseAmount: number;
    roundedAmount: number;
    transactionId?: string;
    accountId: string;
  } | null>(null);

  // Setup edge swipe gestures
  useEffect(() => {
    const cleanup = useEdgeSwipe(
      () => setIsSettingsOpen(true),  // Left edge swipe - Settings
      () => setIsNotificationsOpen(true)  // Right edge swipe - Notifications
    );
    return cleanup;
  }, []);

  // Handle Native Local Notifications Click/Navigation
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const checkPermissions = async () => {
        try {
          const status = await LocalNotifications.checkPermissions();
          if (status.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }
        } catch (e) {
          console.error('Error checking notification permissions:', e);
        }
      };

      checkPermissions();

      const actionListener = LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
        const { notification } = notificationAction;
        const extra = notification.extra;

        console.log('Native notification clicked:', notification);

        if (extra) {
          if (extra.achievementId) {
            setSelectedAchievementId(extra.achievementId);
            setIsAchievementDialogOpen(true);
          } else if (extra.view) {
            setView(extra.view as View);
          }
        }
      });

      return () => {
        actionListener.remove();
      };
    }
  }, []);

  // Theme support
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const { openFundAllocation } = useFinance();

  // Expose fund allocation to window for components that use it via window.showFundAllocation
  useEffect(() => {
    (window as any).showFundAllocation = openFundAllocation;
  }, [openFundAllocation]);

  // Calculate financial health score
  const { currentMonthExpenses } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const reconciledExpenses = expenses.filter(e => !e.isInternalTransfer);
    const cmExpenses = reconciledExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    return { currentMonthExpenses: cmExpenses };
  }, [expenses]);

  const healthScore = useMemo(() => {
    const totalIncomeCalc = incomes.reduce((sum: number, i: Income) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
    const totalDebts = debts.reduce((sum: number, d: Debt) => sum + d.amount, 0);

    if (totalIncomeCalc === 0 && totalDebts === 0)
      return {
        score: 50,
        savingsRate: 0,
        debtRatio: 0,
        spendingRatio: 0,
      };

    // Calculate months active to annualize income
    const allTransactions = [...incomes, ...expenses, ...debts];
    let monthsActive = 1;
    if (allTransactions.length > 0) {
      const dates = allTransactions.map((t: any) => new Date(t.date).getTime());
      const firstTransactionDate = new Date(Math.min(...dates));
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - firstTransactionDate.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      monthsActive = Math.max(1, diffMonths);
    }

    const avgMonthlyIncome = totalIncomeCalc / monthsActive;
    const annualizedIncome = avgMonthlyIncome * 12;

    const savingsRate = totalIncomeCalc > 0 ? (totalIncomeCalc - totalExpenses) / totalIncomeCalc : 0;
    const spendingRatio = totalIncomeCalc > 0 ? totalExpenses / totalIncomeCalc : 0;

    // Debt Ratio: Total Debt / Annualized Income
    const debtRatio = annualizedIncome > 0
      ? totalDebts / annualizedIncome
      : (totalDebts > 0 ? Infinity : 0);

    let score = 50;

    // 1. Savings Rate Impact (Max 30, Min -20)
    if (savingsRate >= 0.4) score += 30;       // Excellent Saver
    else if (savingsRate >= 0.2) score += 20;  // Good Saver
    else if (savingsRate >= 0.1) score += 10;  // Modest Saver
    else if (savingsRate > 0) score += 5;      // Barely Saving
    else score -= 20;                          // Living Beyond Means

    // 2. Debt-to-Income Ratio Impact (Max 20, Min -50)
    if (debtRatio === 0) score += 20;          // Debt Free
    else if (debtRatio <= 0.3) score += 10;    // Manageable (e.g. 3.6 months salary)
    else if (debtRatio <= 0.6) score -= 10;    // Warning Zone (e.g. 7.2 months salary)
    else if (debtRatio <= 1.0) score -= 30;    // High Debt (e.g. 1 year salary)
    else score -= 50;                          // Critical Condition (Debt > Annual Income)

    // 3. Spending Ratio Impact (Max 20, Min -10)
    if (spendingRatio <= 0.5) score += 20;     // Very Lean
    else if (spendingRatio <= 0.7) score += 10;// Comfortable
    else if (spendingRatio <= 0.9) score += 0; // Tight
    else score -= 10;                          // Living on the Edge

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      savingsRate,
      debtRatio,
      spendingRatio,
    };
  }, [incomes, expenses, debts]); // Dependencies

  // AI Context - Memoized
  const aiContext: AIContext = useMemo(() => ({
    totalIncome: incomes.reduce((sum: number, i: Income) => sum + i.amount, 0),
    totalExpenses: expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0),
    activeDebts: debts.filter((d: Debt) => d.status === "pending").length,
    goalsCount: goals.length,
    recentTransactions: [
      ...expenses.slice(0, 5).map((e: Expense) => ({ type: "expense", ...e })),
      ...incomes.slice(0, 5).map((i: Income) => ({ type: "income", ...i })),
    ] as any[], // Casting to avoid complex switch types for now
    expenses,
    incomes,
    accounts,
    investments,
    liabilities,
    goals,
    debts,
    currentMonthExpenses,
    savingsRate: healthScore.savingsRate,
    healthScore: healthScore.score,
    brainSummary: generateBrainSummary(
      { incomes, expenses, investments, accounts, liabilities, goals, debts, currentMonthExpenses, healthScore: healthScore.score, savingsRate: healthScore.savingsRate, totalIncome: incomes.reduce((sum: number, i: Income) => sum + i.amount, 0), totalExpenses: expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0), activeDebts: debts.filter((d: Debt) => d.status === "pending").length, goalsCount: goals.length, recentTransactions: [] },
      settings.currency,
      view
    )
  }), [incomes, expenses, debts, goals, healthScore.savingsRate, healthScore.score, accounts, investments, liabilities, currentMonthExpenses, settings.currency, view]);

  // Calculate totals
  const totalIncome = useMemo(() => incomes.reduce((sum: number, i: Income) => sum + i.amount, 0), [incomes]);

  // Show branded loader while initial data is being fetched
  if (isLoading) {
    return <LoadingSprite />;
  }

  // Hide splash screen once loading is done
  if (Capacitor.isNativePlatform()) {
    SplashScreen.hide().catch(err => console.error('Splash hide error:', err));
  }

  // Handle pull to refresh
  const handleRefresh = async () => {
    await refreshData();
  };

  // Transaction form handlers
  const openAddTransaction = (type: TransactionType) => {
    setTransactionFormType(type);
    setEditingTransaction(null);
    setIsTransactionFormOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setTransactionFormType("expense");
    setEditingTransaction(expense);
    setIsTransactionFormOpen(true);
  };

  const handleEditIncome = (income: Income) => {
    setTransactionFormType("income");
    setEditingTransaction(income);
    setIsTransactionFormOpen(true);
  };

  const handleEditDebt = (debt: Debt) => {
    setTransactionFormType("debt");
    setEditingTransaction(debt);
    setIsTransactionFormOpen(true);
  };

  const handleTransactionSubmit = (data: any) => {
    if (editingTransaction) {
      // Update existing
      if (transactionFormType === "expense") {
        updateExpense(editingTransaction.id, data);
      } else if (transactionFormType === "income") {
        updateIncome(editingTransaction.id, data);
      } else if (transactionFormType === "debt") {
        updateDebt(editingTransaction.id, data);
      }
    } else {
      // Create new
      if (transactionFormType === "expense") {
        createExpense(data);

        // Handle Manual Round Up from Form
        if (data.roundUpAmount) {
          handleRoundUpConfirm(
            goals.length > 0 ? goals[0].id : 'general', // Default to first goal or create new
            'goal',
            undefined,
            data.roundUpAmount, // Pass explicit amount
            data.accountId
          );
        }
      } else if (transactionFormType === "income") {
        createIncome(data);
      } else if (transactionFormType === "debt") {
        createDebt(data);
      }
    }
  };

  const handleRoundUpConfirm = async (
    destinationId: string,
    destinationType: 'goal' | 'emergency',
    _muteDuration?: 'today' | 'week' | 'month',
    explicitAmount?: number,
    explicitAccountId?: string
  ) => {
    // If explicit amount provided, use it; otherwise fallback to state
    if (!explicitAmount && !roundUpData) return;

    const diff = explicitAmount || (roundUpData ? roundUpData.roundedAmount - roundUpData.expenseAmount : 0);
    const targetAccountId = explicitAccountId || (roundUpData ? roundUpData.accountId : '');

    // Deduct from the same account used for expense
    const account = accounts.find(a => a.id === targetAccountId);

    if (account) {
      await updateAccount(account.id, {
        balance: account.balance - diff
      });
    }

    // Add to Goal or Emergency Fund
    if (destinationType === 'goal') {
      const goal = goals.find(g => g.id === destinationId);
      if (goal) {
        await updateGoal(destinationId, {
          currentAmount: goal.currentAmount + diff
        });
        toast.success(`Saved ${CURRENCY_SYMBOLS[settings.currency]}${diff} to ${goal.name}!`);
      } else {
        const generalSavings = goals.find(g => g.name === "General Savings");

        if (generalSavings) {
          await updateGoal(generalSavings.id, {
            currentAmount: generalSavings.currentAmount + diff
          });
          toast.success(`Saved ${CURRENCY_SYMBOLS[settings.currency]}${diff} to General Savings!`);
        } else {
          const newGoal = {
            name: "General Savings",
            targetAmount: 10000,
            currentAmount: diff,
            targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            emoji: "🐷"
          };
          createGoal(newGoal);
          toast.success(`Created "General Savings" and saved ${CURRENCY_SYMBOLS[settings.currency]}${diff}!`);
        }
      }
    } else {
      setEmergencyFundAmount((prev: number) => prev + diff);
      toast.success(`Saved ${CURRENCY_SYMBOLS[settings.currency]}${diff} to Emergency Fund!`);
    }

    setIsRoundUpOpen(false);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleRoundUpMute = (duration: 'today' | 'week' | 'month') => {
    const dates: Record<string, number> = {
      today: 1,
      week: 7,
      month: 30
    };

    const date = new Date();
    date.setDate(date.getDate() + dates[duration]);
    localStorage.setItem('roundUpMutedUntil', date.toISOString());
    setIsRoundUpOpen(false);
    toast.info(`Round ups muted for ${duration === 'today' ? 'today' : duration === 'week' ? 'a week' : 'a month'}`);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {(authStatus === 'guest' || authStatus === 'authenticating') && (
          <motion.div
            key="login-container"
            className="fixed inset-0 z-0"
            exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
            transition={{ duration: 0.8 }}
          >
            <LoginScreen />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {authStatus === 'authenticating' && (
          <motion.div
            key="loading-sprite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50"
          >
            <LoadingSprite
              message={authMessage?.message}
              subMessage={authMessage?.subMessage}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {authStatus === 'authenticated' && (!settings.onboardingPhase || settings.onboardingPhase < 3) && !settings.isSampleMode && (
          <OnboardingFlow />
        )}

        {authStatus === 'authenticated' && ((settings.onboardingPhase ?? 0) >= 3 || settings.isSampleMode) && (
          <motion.div
            key="main-app"
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="min-h-screen bg-transparent text-foreground transition-colors font-sans">
              <ScrollAwareLayout
                activeTab={view}
                onTabChange={(tab: string) => setView(tab as View)}
                notificationCount={notifications.filter((n: any) => !n.read).length}
                onNotificationClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                onSettingsClick={() => setIsSettingsOpen(!isSettingsOpen)}
                forceHide={isAchievementDialogOpen}
                renderFab={(isVisible: boolean) => (
                  <FabStack
                    isVisible={isVisible && !isSettingsOpen && !isNotificationsOpen && !isAchievementDialogOpen}
                    onOpenAI={() => setIsAIAssistantOpen(true)}
                    onAddTransaction={openAddTransaction}
                    onMigrate={() => setIsTransferFormOpen(true)}
                  />
                )}
              >
                <PullToRefresh onRefresh={handleRefresh}>
                  <ErrorBoundary>
                    <Suspense fallback={
                      <div className="space-y-6 pt-12">
                        <DashboardSkeleton />
                        <p className="text-center text-slate-500 text-sm">Loading Component...</p>
                      </div>
                    }>
                      {view === "dashboard" && (
                        <div className="space-y-6">
                          <Dashboard
                            expenses={expenses}
                            incomes={incomes}
                            currency={settings.currency}
                            goals={goals}
                            liabilities={liabilities}
                            debts={debts}
                            investments={investments}
                            accounts={accounts}
                            emergencyFundAmount={emergencyFundAmount}
                            healthScore={healthScore.score}
                            userName={settings.name}
                            isOffline={isOffline}
                            isSampleMode={settings.isSampleMode}
                            onResumeOnboarding={() => updateSettings({ isSampleMode: false })}
                          />
                        </div>
                      )}

                      {view === "transactions" && (
                        <TransactionList
                          expenses={expenses}
                          incomes={incomes}
                          debts={debts}
                          accounts={accounts}
                          currency={settings.currency}
                          onEditExpense={handleEditExpense}
                          onDeleteExpense={deleteExpense}
                          onEditIncome={handleEditIncome}
                          onDeleteIncome={deleteIncome}
                          onEditDebt={handleEditDebt}
                          onDeleteDebt={deleteDebt}
                          onSettleDebt={settleDebt}
                        />
                      )}

                      {view === "goals" && (
                        <GoalsTracker
                          goals={goals}
                          currency={settings.currency}
                          accounts={accounts}
                          expenses={expenses}
                          incomes={incomes}
                          onCreateGoal={createGoal}
                          onUpdateGoal={updateGoal}
                          onDeleteGoal={deleteGoal}
                          onDeductFromAccount={async (accountId: string, amount: number) => {
                            const account = accounts.find((a: any) => a.id === accountId);
                            if (account) {
                              await updateAccount(accountId, {
                                balance: account.balance - amount
                              });
                            }
                          }}
                        />
                      )}

                      {view === "accounts" && (
                        <AccountsManager
                          accounts={accounts}
                          currency={settings.currency}
                          onCreateAccount={createAccount}
                          onUpdateAccount={updateAccount}
                          onDeleteAccount={deleteAccount}
                        />
                      )}

                      {view === "investments" && (
                        <InvestmentsTab />
                      )}

                      {view === "emergency" && (
                        <EmergencyFundsTab
                          currency={settings.currency}
                          userId={userId}
                          expenses={expenses}
                          incomes={incomes}
                          accounts={accounts}
                          onEmergencyFundUpdate={(amount) => setEmergencyFundAmount(amount)}
                        />
                      )}

                      {view === "liability" && (
                        <div className="space-y-6">
                          {/* Only show LiabilityDashboard when specifically in liability tab */}
                          <LiabilityDashboard
                            liabilities={liabilities}
                            debts={debts}
                            currency={settings.currency}
                            totalMonthlyIncome={totalIncome}
                          />
                          <LiabilityTab
                            currency={settings.currency}
                            expenses={expenses}
                            accounts={accounts}
                            debts={debts}
                            liabilities={liabilities}
                          />
                        </div>
                      )}

                      {view === "recurring" && (
                        <RecurringTransactions />
                      )}

                      {view === "more" && (
                        <MoreTab
                          onNavigate={(targetView: View) => setView(targetView)}
                          onOpenSettings={() => setIsSettingsOpen(true)}
                          onOpenNotifications={() => setIsNotificationsOpen(true)}
                          emergencyFundAmount={emergencyFundAmount}
                          bankAccountsCount={accounts.filter((a: any) => a.type === 'bank').length}
                          cardsCount={accounts.filter((a: any) => a.type === 'credit_card').length}
                          currency={settings.currency}
                          onOpenAbout={() => setIsAboutUsOpen(true)}
                        />
                      )}
                    </Suspense>
                  </ErrorBoundary>
                </PullToRefresh>
              </ScrollAwareLayout>

              {/* Modals */}
              {isTransactionFormOpen && (
                <TransactionForm
                  isOpen={isTransactionFormOpen}
                  onClose={() => {
                    setIsTransactionFormOpen(false);
                    setEditingTransaction(null);
                  }}
                  type={transactionFormType}
                  onSubmit={handleTransactionSubmit}
                  initialData={editingTransaction}
                  accounts={accounts}
                  liabilities={liabilities}
                  currency={settings.currency}
                  roundUpEnabled={settings.roundUpEnabled}
                />
              )}

              {/* Round Up Dialog */}
              {roundUpData && (
                <RoundUpDialog
                  isOpen={isRoundUpOpen}
                  onClose={() => setIsRoundUpOpen(false)}
                  onConfirm={handleRoundUpConfirm}
                  expenseAmount={roundUpData.expenseAmount}
                  roundedAmount={roundUpData.roundedAmount}
                  currency={settings.currency}
                  goals={goals}
                  onMute={handleRoundUpMute}
                />
              )}

              {/* Replaced AIAssistant with Overlay */}
              <AIChatOverlay
                isOpen={isAIAssistantOpen}
                onClose={() => setIsAIAssistantOpen(false)}
                context={aiContext}
                settings={settings}
                isOffline={isOffline}
              />

              <EnhancedSettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onUpdateSettings={updateSettings}
                onAchievementClick={(achievementId: string) => {
                  setSelectedAchievementId(achievementId);
                  setIsAchievementDialogOpen(true);
                  setIsSettingsOpen(false);
                }}
                onOpenAbout={() => setIsAboutUsOpen(true)}
              />

              <NotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                onNotificationClick={async (notification: any) => {
                  if (notification.achievementId) {
                    setSelectedAchievementId(notification.achievementId);
                    setIsAchievementDialogOpen(true);
                  }

                  // Handle Subscription Verification Action
                  if (notification.action && notification.action.type === 'verify_subscription' && notification.action.status === 'completed') {
                    const { description, amount, category, accountId, date } = notification.action.payload;
                    try {
                      await createRecurring({
                        type: 'expense',
                        description,
                        amount,
                        category,
                        accountId,
                        frequency: 'monthly',
                        startDate: date || new Date().toISOString().split('T')[0],
                        tags: ['auto-verified', 'subscription']
                      });
                      toast.success(`Verified: ${description} is now a recurring subscription.`);

                      // Mark as read
                      setNotifications((prev: any[]) =>
                        prev.map((n: any) => n.id === notification.id ? { ...n, read: true } : n)
                      );
                    } catch (error) {
                      toast.error("Failed to automate subscription.");
                    }
                  } else if (notification.action && notification.action.status === 'dismissed') {
                    toast.info("Marked as one-time purchase.");
                    setNotifications((prev: any[]) =>
                      prev.map((n: any) => n.id === notification.id ? { ...n, read: true } : n)
                    );
                  }

                  // Only close if it wasn't an action interaction (actions stopPropagation, but just in case)
                  if (!notification.action) {
                    if (notification.category === 'reminders') {
                      setView('liability');
                    } else if (notification.category === 'transactions') {
                      setView('transactions');
                    }
                    setIsNotificationsOpen(false);
                  }
                }}
                onMarkAsRead={(id: string) => {
                  setNotifications((prev: any[]) =>
                    prev.map((n: any) => n.id === id ? { ...n, read: true } : n)
                  );
                }}
                onClearRead={() => {
                  setNotifications((prev: any[]) => prev.filter((n: any) => !n.read));
                  toast.success('Read notifications cleared');
                }}
              />

              <AchievementDetailDialog
                isOpen={isAchievementDialogOpen}
                onClose={() => {
                  setIsAchievementDialogOpen(false);
                  setSelectedAchievementId(null);
                }}
                achievementId={selectedAchievementId}
              />

              <FundAllocationDialog
                isOpen={isFundAllocationOpen}
                onClose={closeFundAllocation}
                accounts={accounts}
                goals={goals}
                currency={settings.currency}
                destinationType={fundAllocationType}
                emergencyFund={{
                  currentAmount: emergencyFundAmount,
                  targetAmount: 100000
                }}
                onAllocate={performFundAllocation}
                liabilities={liabilities}
                expenses={expenses}
              />

              <TransferForm
                isOpen={isTransferFormOpen}
                onClose={() => setIsTransferFormOpen(false)}
                accounts={accounts}
                currency={settings.currency}
                onTransfer={transferFunds}
              />

              <AboutUsPopup
                isOpen={isAboutUsOpen}
                onClose={() => setIsAboutUsOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backfill Confirmation Dialog - Root Level */}
      {backfillRequest && (
        <AlertDialog open={true} onOpenChange={() => setBackfillRequest(null)}>
          <AlertDialogContent className="bg-slate-900/95 border-white/10 text-slate-100 z-[99999999] backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white text-xl font-bold font-sans">Backfill Configuration Required</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 text-base">
                System detected <span className="text-emerald-400 font-bold">{backfillRequest.count} missing entries</span> in the transaction history
                {backfillRequest.dates?.length > 0 && (
                  <>
                    {' '}from <span className="text-white font-medium">{backfillRequest.dates[0]?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {' '}to <span className="text-white font-medium">{backfillRequest.dates[backfillRequest.dates.length - 1]?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </>
                )}.
                <br /><br />
                Would you like to auto-populate the ledger for this period?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel onClick={() => setBackfillRequest(null)} className="bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-12 uppercase tracking-wider text-xs font-bold">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { executeBackfill(); setBackfillRequest(null); }} className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 font-bold rounded-xl h-12 px-8 shadow-lg shadow-indigo-600/20">
                Generate Ledger
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Toaster
        position="bottom-center"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: '#1C1C1E',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            borderRadius: '20px',
            backdropFilter: 'none',
            zIndex: 999999,
          },
        }}
        className="!z-[999999]"
      />


    </>
  );
}
