import React, { useState, useEffect, useRef } from "react";
import fabLogo from 'figma:asset/9af9850a100f6b0723b0e932676f145584e018b5.png';
import darkLogo from 'figma:asset/a006ac1226c6ec6f407876aa082bc4a0ab761900.png';
import lightLogo from 'figma:asset/b415be21c50f53d450601114da1e978c85047055.png';
import { Button } from "./components/ui/button";
import {
  Bell,
  Plus,
  TrendingUp,
  ListFilter,
  Target,
  User,
  PieChart,
  Settings,
  CreditCard,
  Bot
} from "lucide-react";
import { toast, Toaster } from "sonner";
import confetti from "canvas-confetti";
import { Dashboard } from "./components/Dashboard";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { FinancialHealthScore } from "./components/FinancialHealthScore";
import { GoalsTracker } from "./components/GoalsTracker";
import { EmergencyFundsTab } from "./components/EmergencyFundsTab";
import { AIAssistant } from "./components/AIAssistant";
import { EnhancedSettingsPanel } from "./components/EnhancedSettingsPanel";
import { QuoteOfTheDay } from "./components/QuoteOfTheDay";
import { InvestmentsTab } from "./components/InvestmentsTab";
import { LiabilityTab } from "./components/LiabilityTab";
import { LiabilityDashboard } from "./components/LiabilityDashboard";
import { MoreTab } from "./components/MoreTab";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { AchievementDetailDialog } from "./components/AchievementDetailDialog";
import { FundAllocationDialog } from "./components/FundAllocationDialog";
import { useFinance } from "./context/FinanceContext";
import {
  Expense,
  Income,
  Debt,
  Goal,
  AIContext,
  CURRENCY_SYMBOLS,
} from "./types";
import { AccountsManager } from "./components/AccountsManager";
import { PullToRefresh } from "./components/PullToRefresh";
import { useEdgeSwipe } from "./utils/gestures";

type View = "dashboard" | "transactions" | "goals" | "investments" | "accounts" | "emergency" | "liability" | "more";
type TransactionType = "expense" | "income" | "debt";

import { getBudgetPacingStatus, getHaloClasses } from "./utils/budgetUtils";

export default function App() {
  const {
    userId,
    settings,
    expenses,
    incomes,
    debts,
    goals,
    accounts,
    liabilities,
    notifications,
    emergencyFundAmount,
    isLoading,
    refreshData,
    updateSettings,
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
    setNotifications
  } = useFinance();

  const [view, setView] = useState<View>("dashboard");
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionFormType, setTransactionFormType] = useState<TransactionType>("expense");
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [isAchievementDialogOpen, setIsAchievementDialogOpen] = useState(false);
  const [isFundAllocationOpen, setIsFundAllocationOpen] = useState(false);
  const [fundAllocationType, setFundAllocationType] = useState<'goal' | 'emergency'>('goal');

  const mainContentRef = useRef<HTMLDivElement>(null);

  // Setup edge swipe gestures
  useEffect(() => {
    const cleanup = useEdgeSwipe(
      () => setIsSettingsOpen(true),  // Left edge swipe - Settings
      () => setIsNotificationsOpen(true)  // Right edge swipe - Notifications
    );
    return cleanup;
  }, []);

  // Expose fund allocation function to window for child components
  useEffect(() => {
    (window as any).showFundAllocation = (type: 'goal' | 'emergency') => {
      setFundAllocationType(type);
      setIsFundAllocationOpen(true);
    };

    // Expose emergency fund deduction handler
    (window as any).handleEmergencyFundDeduction = async (accountId: string, amount: number) => {
      const account = accounts.find(a => a.id === accountId);
      if (account) {
        await updateAccount(accountId, {
          balance: account.balance - amount
        });
      }
    };

    return () => {
      delete (window as any).showFundAllocation;
      delete (window as any).handleEmergencyFundDeduction;
    };
  }, [accounts, updateAccount]);

  // Handle pull to refresh
  const handleRefresh = async () => {
    await refreshData();
  };

  // Fund allocation handler
  const handleFundAllocation = async (data: {
    accountId: string;
    destinationId: string;
    amount: number;
    destinationType: 'goal' | 'emergency';
  }) => {
    const account = accounts.find(a => a.id === data.accountId);
    if (!account) {
      toast.error('Account not found');
      return;
    }

    // Update account balance
    await updateAccount(data.accountId, {
      balance: account.balance - data.amount
    });

    // Update goal or emergency fund
    if (data.destinationType === 'goal') {
      const goal = goals.find(g => g.id === data.destinationId);
      if (goal) {
        await updateGoal(data.destinationId, {
          currentAmount: goal.currentAmount + data.amount
        });
      }
    } else {
      setEmergencyFundAmount(prev => prev + data.amount);
    }

    toast.success(
      `Successfully allocated ${CURRENCY_SYMBOLS[settings.currency]}${data.amount.toLocaleString()} from ${account.name}!`,
      {
        description: `${data.destinationType === 'goal' ? 'Goal' : 'Emergency Fund'} balance updated`
      }
    );
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
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
      } else if (transactionFormType === "income") {
        createIncome(data);
      } else if (transactionFormType === "debt") {
        createDebt(data);
      }
    }
  };

  // Calculate financial health score
  const calculateHealthScore = () => {
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const activeDebts = debts
      .filter((d) => d.status === "pending")
      .reduce((sum, d) => sum + d.amount, 0);

    if (totalIncome === 0)
      return {
        score: 50,
        savingsRate: 0,
        debtRatio: 0,
        spendingRatio: 0,
      };

    const savingsRate = (totalIncome - totalExpenses) / totalIncome;
    const spendingRatio = totalExpenses / totalIncome;
    const debtRatio = activeDebts / totalIncome;

    let score = 50;

    // Savings rate impact (30 points)
    if (savingsRate >= 0.3) score += 30;
    else if (savingsRate >= 0.2) score += 25;
    else if (savingsRate >= 0.1) score += 15;
    else if (savingsRate >= 0) score += 5;
    else score -= 10;

    // Spending ratio impact (30 points)
    if (spendingRatio <= 0.6) score += 30;
    else if (spendingRatio <= 0.8) score += 20;
    else if (spendingRatio <= 1.0) score += 10;
    else score -= 20;

    // Debt ratio impact (20 points)
    if (debtRatio === 0) score += 20;
    else if (debtRatio <= 0.1) score += 15;
    else if (debtRatio <= 0.3) score += 5;
    else score -= 15;

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      savingsRate,
      debtRatio,
      spendingRatio,
    };
  };

  const healthScore = calculateHealthScore();

  // Calculate pacing status for Halo
  const totalIncomeForHalo = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpensesForHalo = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pacingStatus = getBudgetPacingStatus(totalIncomeForHalo, totalExpensesForHalo);
  const haloClass = getHaloClasses(pacingStatus);

  // AI Context
  const aiContext: AIContext = {
    totalIncome: incomes.reduce((sum, i) => sum + i.amount, 0),
    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    activeDebts: debts.filter((d) => d.status === "pending").length,
    goalsCount: goals.length,
    recentTransactions: [
      ...expenses.slice(0, 5).map((e) => ({ type: "expense", ...e })),
      ...incomes.slice(0, 5).map((i) => ({ type: "income", ...i })),
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading FinHub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <div className={`absolute left-1/2 transform -translate-x-1/2 p-1 rounded-full ${haloClass}`}>
              <img
                src={settings.theme === 'dark' ? darkLogo : lightLogo}
                alt="FinHub"
                className="h-10 w-auto rounded-full"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation - Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-1">
          <div className="flex justify-around items-center py-2">
            {[
              { id: "dashboard", icon: TrendingUp, label: "Home" },
              { id: "transactions", icon: ListFilter, label: "Txns" },
              { id: "liability", icon: CreditCard, label: "Liability" },
              { id: "goals", icon: Target, label: "Goals" },
              { id: "investments", icon: PieChart, label: "Invest" },
              { id: "more", icon: User, label: "More" },
            ].map((item) => (
              <Button
                key={item.id}
                variant={view === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setView(item.id as View)}
                className="flex-col h-auto py-2 px-1"
              >
                <item.icon className="w-5 h-5 mb-0.5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main
        ref={mainContentRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto pb-24"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        <PullToRefresh onRefresh={handleRefresh}>
          {view === "dashboard" && (
            <div className="space-y-6">
              <QuoteOfTheDay />
              <Dashboard
                expenses={expenses}
                incomes={incomes}
                debts={debts}
                currency={settings.currency}
                userId={userId}
                goals={goals}
                liabilities={liabilities}
                emergencyFundAmount={emergencyFundAmount}
              />
              {liabilities.length > 0 && (
                <LiabilityDashboard
                  liabilities={liabilities}
                  currency={settings.currency}
                />
              )}
              <FinancialHealthScore
                score={healthScore.score}
                savingsRate={healthScore.savingsRate}
                debtRatio={healthScore.debtRatio}
                spendingRatio={healthScore.spendingRatio}
              />
            </div>
          )}

          {view === "transactions" && (
            <TransactionList
              expenses={expenses}
              incomes={incomes}
              debts={debts}
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
              onDeductFromAccount={async (accountId, amount) => {
                const account = accounts.find(a => a.id === accountId);
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
            <InvestmentsTab
              currency={settings.currency}
              userId={userId}
              expenses={expenses}
              incomes={incomes}
            />
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
            <LiabilityTab
              currency={settings.currency}
              userId={userId}
              expenses={expenses}
              incomes={incomes}
              accounts={accounts}
            />
          )}

          {view === "more" && (
            <MoreTab
              onNavigate={(targetView) => setView(targetView)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              emergencyFundAmount={emergencyFundAmount}
              accountsCount={accounts.length}
              currency={settings.currency}
              currencySymbol={CURRENCY_SYMBOLS[settings.currency]}
            />
          )}
        </PullToRefresh>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 left-6 z-50">
        <Button
          onClick={() => setIsAIOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>

      <div className="fixed bottom-24 right-6 z-50">
        <div className="relative">
          {isFabMenuOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsFabMenuOpen(false)}
            />
          )}

          <Button
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 relative z-50"
          >
            <Plus className={`w-6 h-6 transition-transform ${isFabMenuOpen ? 'rotate-45' : ''}`} />
          </Button>

          {isFabMenuOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-xl z-50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  openAddTransaction("expense");
                  setIsFabMenuOpen(false);
                }}
                className="justify-start whitespace-nowrap"
              >
                💸 Money Out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  openAddTransaction("income");
                  setIsFabMenuOpen(false);
                }}
                className="justify-start whitespace-nowrap"
              >
                💰 Money In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  openAddTransaction("debt");
                  setIsFabMenuOpen(false);
                }}
                className="justify-start whitespace-nowrap"
              >
                🤝 Personal IOU
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TransactionForm
        isOpen={isTransactionFormOpen}
        onClose={() => {
          setIsTransactionFormOpen(false);
          setEditingTransaction(null);
        }}
        type={transactionFormType}
        onSubmit={handleTransactionSubmit}
        initialData={editingTransaction}
        userId={userId}
        accounts={accounts}
      />

      <AIAssistant
        userId={userId}
        context={aiContext}
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />

      <EnhancedSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onAchievementClick={(achievementId) => {
          setSelectedAchievementId(achievementId);
          setIsAchievementDialogOpen(true);
        }}
      />

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onNotificationClick={(notification) => {
          if (notification.achievementId) {
            setSelectedAchievementId(notification.achievementId);
            setIsAchievementDialogOpen(true);
          }
        }}
        onMarkAsRead={(id) => {
          setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
          );
        }}
        onClearRead={() => {
          setNotifications(prev => prev.filter(n => !n.read));
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
        onClose={() => setIsFundAllocationOpen(false)}
        accounts={accounts}
        goals={goals}
        currency={settings.currency}
        destinationType={fundAllocationType}
        emergencyFund={{
          currentAmount: emergencyFundAmount,
          targetAmount: 100000
        }}
        onAllocate={handleFundAllocation}
      />

      <Toaster position="top-right" richColors />
    </div>
  );
}