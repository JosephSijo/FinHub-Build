import React, { useState, useEffect, useRef } from "react";
import fabLogo from 'figma:asset/9af9850a100f6b0723b0e932676f145584e018b5.png';
import darkLogo from 'figma:asset/a006ac1226c6ec6f407876aa082bc4a0ab761900.png';
import lightLogo from 'figma:asset/b415be21c50f53d450601114da1e978c85047055.png';
import { Button } from "./components/ui/button";
import {
  Bell,
  Plus,
  Menu,
  Bot,
  TrendingUp,
  ListFilter,
  Target,
  User,
  PieChart,
  Settings,
  ArrowLeftRight,
  CreditCard,
} from "lucide-react";
import { toast, Toaster } from "sonner@2.0.3";
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
import { CurrencyConverter } from "./components/CurrencyConverter";
import { InvestmentsTab } from "./components/InvestmentsTab";
import { LiabilityTab } from "./components/LiabilityTab";
import { LiabilityDashboard } from "./components/LiabilityDashboard";
import { MoreTab } from "./components/MoreTab";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { AchievementDetailDialog } from "./components/AchievementDetailDialog";
import { FundAllocationDialog } from "./components/FundAllocationDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./components/ui/sheet";
import { api } from "./utils/api";
import {
  checkAchievements,
  getAchievement,
} from "./utils/achievements";
import {
  Expense,
  Income,
  Debt,
  Goal,
  UserSettings,
  AIContext,
  Account,
  Notification,
  CURRENCY_SYMBOLS,
} from "./types";
import { AccountsManager } from "./components/AccountsManager";
import { PullToRefresh } from "./components/PullToRefresh";
import { useEdgeSwipe } from "./utils/gestures";

type View = "dashboard" | "transactions" | "goals" | "investments" | "accounts" | "emergency" | "liability" | "more";
type TransactionType = "expense" | "income" | "debt";

export default function App() {
  const [userId] = useState("demo-user-001"); // In production, this would come from auth
  const [view, setView] = useState<View>("dashboard");
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    theme: "system",
    currency: "INR",
    unlockedAchievements: [],
    name: "",
    photoURL: "",
    notificationsEnabled: false,
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [emergencyFundAmount, setEmergencyFundAmount] = useState(0);

  const [isTransactionFormOpen, setIsTransactionFormOpen] =
    useState(false);
  const [transactionFormType, setTransactionFormType] =
    useState<TransactionType>("expense");
  const [editingTransaction, setEditingTransaction] =
    useState<any>(null);

  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [isAchievementDialogOpen, setIsAchievementDialogOpen] = useState(false);
  const [isFundAllocationOpen, setIsFundAllocationOpen] = useState(false);
  const [fundAllocationType, setFundAllocationType] = useState<'goal' | 'emergency'>('goal');
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

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
        await handleUpdateAccount(accountId, {
          balance: account.balance - amount
        });
      }
    };

    return () => {
      delete (window as any).showFundAllocation;
      delete (window as any).handleEmergencyFundDeduction;
    };
  }, [accounts]);

  // Handle pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  };

  // View swipe navigation
  const views: View[] = ["dashboard", "transactions", "liability", "goals", "investments", "more"];
  const currentViewIndex = views.indexOf(view);

  const handleSwipeLeft = () => {
    if (currentViewIndex < views.length - 1) {
      setView(views[currentViewIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    if (currentViewIndex > 0) {
      setView(views[currentViewIndex - 1]);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Auto-process recurring transactions first
      try {
        const recurringRes = await api.processRecurring(userId);
        if (recurringRes.success && recurringRes.count > 0) {
          console.log(`Auto-processed ${recurringRes.count} recurring transactions`);
        }
      } catch (error) {
        console.error("Error processing recurring transactions:", error);
      }

      // Load data with individual error handling
      const settingsRes = await api.getSettings(userId).catch(err => {
        console.error("Error loading settings:", err);
        return { success: false };
      });
      
      const accountsRes = await api.getAccounts(userId).catch(err => {
        console.error("Error loading accounts:", err);
        return { success: false };
      });
      
      const expensesRes = await api.getExpenses(userId).catch(err => {
        console.error("Error loading expenses:", err);
        return { success: false };
      });
      
      const incomesRes = await api.getIncomes(userId).catch(err => {
        console.error("Error loading incomes:", err);
        return { success: false };
      });
      
      const debtsRes = await api.getDebts(userId).catch(err => {
        console.error("Error loading debts:", err);
        return { success: false };
      });
      
      const goalsRes = await api.getGoals(userId).catch(err => {
        console.error("Error loading goals:", err);
        return { success: false };
      });

      const liabilitiesRes = await api.getLiabilities(userId).catch(err => {
        console.error("Error loading liabilities:", err);
        return { success: false };
      });

      if (settingsRes.success) {
        setSettings(settingsRes.settings);
        applyTheme(settingsRes.settings.theme);
      }
      if (accountsRes.success)
        setAccounts(accountsRes.accounts || []);
      if (expensesRes.success)
        setExpenses(expensesRes.expenses || []);
      if (incomesRes.success)
        setIncomes(incomesRes.incomes || []);
      if (debtsRes.success) setDebts(debtsRes.debts || []);
      if (goalsRes.success) setGoals(goalsRes.goals || []);
      if (liabilitiesRes.success) setLiabilities(liabilitiesRes.liabilities || []);

      toast.success("Data loaded successfully!");
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(
        "Failed to load data. Using offline mode.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (theme: "light" | "dark" | "system") => {
    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.classList.toggle(
        "dark",
        prefersDark,
      );
    } else {
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark",
      );
    }
  };

  // Check for new achievements
  useEffect(() => {
    const checkForAchievements = () => {
    const totalTransactions =
      expenses.length + incomes.length + debts.length;
    const settledDebts = debts.filter(
      (d) => d.status === "settled",
    ).length;
    const completedGoals = goals.filter(
      (g) => g.currentAmount >= g.targetAmount,
    ).length;
    const totalIncome = incomes.reduce(
      (sum, i) => sum + i.amount,
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );
    const savingsRate =
      totalIncome > 0
        ? (totalIncome - totalExpenses) / totalIncome
        : 0;
    const monthlySpendingRatio =
      totalIncome > 0 ? totalExpenses / totalIncome : 0;

    const achievementData = {
      totalTransactions,
      totalGoals: goals.length,
      completedGoals,
      totalDebts: debts.length,
      settledDebts,
      savingsRate,
      monthlySpendingRatio,
      notificationsEnabled: settings.notificationsEnabled,
      themeChanged: settings.theme !== "system",
      aiInteractions: 0, // Track this separately in production
      currentStreak: totalTransactions > 0 ? Math.min(totalTransactions, 3) : 0, // Simplified streak calculation
      dailyLogin: true, // Set to true on app load
      profileComplete: settings.name !== '' && settings.photoURL !== '',
      totalAccounts: accounts.length,
    };

    const newAchievements = checkAchievements(
      achievementData,
      settings.unlockedAchievements,
    );

    if (newAchievements.length > 0) {
      newAchievements.forEach((achievementId) => {
        const achievement = getAchievement(achievementId);
        if (achievement) {
          // Create notification
          const notification: Notification = {
            id: `notif_${Date.now()}_${achievementId}`,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `${achievement.icon} ${achievement.name}`,
            timestamp: new Date(),
            read: false,
            achievementId: achievementId
          };
          setNotifications(prev => [notification, ...prev]);

          toast.success(
            `Achievement Unlocked: ${achievement.icon} ${achievement.name}!`,
            {
              duration: 5000,
              onClick: () => {
                setSelectedAchievementId(achievementId);
                setIsAchievementDialogOpen(true);
              },
            },
          );
        }
      });

      updateSettings({
        unlockedAchievements: [
          ...settings.unlockedAchievements,
          ...newAchievements,
        ],
      });
    }
    };

    checkForAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expenses.length,
    incomes.length,
    debts.length,
    goals.length,
    settings.notificationsEnabled,
    settings.theme,
  ]);

  // Update settings
  const updateSettings = async (
    updates: Partial<UserSettings>,
  ) => {
    try {
      const response = await api.updateSettings(
        userId,
        updates,
      );
      if (response.success) {
        setSettings(response.settings);
        
        // Apply theme immediately if theme is updated
        if (updates.theme) {
          applyTheme(updates.theme);
        }
      } else {
        throw new Error(response.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      // Still update local state even if backend fails
      setSettings(prev => ({ ...prev, ...updates }));
      if (updates.theme) {
        applyTheme(updates.theme);
      }
      toast.error("Settings updated locally (offline mode)");
    }
  };

  // Expense handlers
  const handleCreateExpense = async (data: any) => {
    try {
      const response = await api.createExpense(userId, data);
      if (response.success) {
        setExpenses([...expenses, response.expense]);
        
        // If recurring, also create recurring transaction
        if (data.isRecurring) {
          const recurringData = {
            type: 'expense',
            description: data.description,
            amount: data.amount,
            category: data.category,
            accountId: data.accountId,
            frequency: data.frequency || 'monthly',
            startDate: data.startDate || data.date,
            endDate: data.endDate,
            tags: data.tags
          };
          await api.createRecurring(userId, recurringData);
          toast.success("Recurring expense created!");
        } else {
          toast.success("Expense added successfully!");
        }
      } else {
        throw new Error(response.error || 'Failed to create expense');
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      // Create temporary ID for offline mode
      const tempExpense = {
        id: `temp_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      setExpenses([...expenses, tempExpense]);
      toast.error("Added locally (offline mode)");
    }
  };

  const handleUpdateExpense = async (
    expenseId: string,
    data: any,
  ) => {
    try {
      const response = await api.updateExpense(
        userId,
        expenseId,
        data,
      );
      if (response.success) {
        setExpenses(
          expenses.map((e) =>
            e.id === expenseId ? response.expense : e,
          ),
        );
        toast.success("Expense updated successfully!");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await api.deleteExpense(
        userId,
        expenseId,
      );
      if (response.success) {
        setExpenses(expenses.filter((e) => e.id !== expenseId));
        toast.success("Expense deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  // Income handlers
  const handleCreateIncome = async (data: any) => {
    try {
      const response = await api.createIncome(userId, data);
      if (response.success) {
        setIncomes([...incomes, response.income]);
        
        // If recurring, also create recurring transaction
        if (data.isRecurring) {
          const recurringData = {
            type: 'income',
            source: data.source,
            amount: data.amount,
            accountId: data.accountId,
            frequency: data.frequency || 'monthly',
            startDate: data.startDate || data.date,
            endDate: data.endDate,
            tags: data.tags
          };
          await api.createRecurring(userId, recurringData);
          toast.success("Recurring income created!");
        } else {
          toast.success("Income added successfully!");
        }
      } else {
        throw new Error(response.error || 'Failed to create income');
      }
    } catch (error) {
      console.error("Error creating income:", error);
      const tempIncome = {
        id: `temp_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      setIncomes([...incomes, tempIncome]);
      toast.error("Added locally (offline mode)");
    }
  };

  const handleUpdateIncome = async (
    incomeId: string,
    data: any,
  ) => {
    try {
      const response = await api.updateIncome(
        userId,
        incomeId,
        data,
      );
      if (response.success) {
        setIncomes(
          incomes.map((i) =>
            i.id === incomeId ? response.income : i,
          ),
        );
        toast.success("Income updated successfully!");
      }
    } catch (error) {
      console.error("Error updating income:", error);
      toast.error("Failed to update income");
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    try {
      const response = await api.deleteIncome(userId, incomeId);
      if (response.success) {
        setIncomes(incomes.filter((i) => i.id !== incomeId));
        toast.success("Income deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting income:", error);
      toast.error("Failed to delete income");
    }
  };

  // Debt handlers
  const handleCreateDebt = async (data: any) => {
    try {
      const response = await api.createDebt(userId, data);
      if (response.success) {
        setDebts([...debts, response.debt]);
        toast.success("Debt added successfully!");
      } else {
        throw new Error(response.error || 'Failed to create debt');
      }
    } catch (error) {
      console.error("Error creating debt:", error);
      const tempDebt = {
        id: `temp_${Date.now()}`,
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      setDebts([...debts, tempDebt]);
      toast.error("Added locally (offline mode)");
    }
  };

  const handleUpdateDebt = async (
    debtId: string,
    data: any,
  ) => {
    try {
      const response = await api.updateDebt(
        userId,
        debtId,
        data,
      );
      if (response.success) {
        setDebts(
          debts.map((d) =>
            d.id === debtId ? response.debt : d,
          ),
        );
        toast.success("Debt updated successfully!");
      }
    } catch (error) {
      console.error("Error updating debt:", error);
      toast.error("Failed to update debt");
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      const response = await api.deleteDebt(userId, debtId);
      if (response.success) {
        setDebts(debts.filter((d) => d.id !== debtId));
        toast.success("Debt deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting debt:", error);
      toast.error("Failed to delete debt");
    }
  };

  const handleSettleDebt = async (debtId: string) => {
    try {
      const response = await api.updateDebt(userId, debtId, {
        status: "settled",
      });
      if (response.success) {
        setDebts(
          debts.map((d) =>
            d.id === debtId ? response.debt : d,
          ),
        );
        toast.success("🎉 Debt settled! Great job!");
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error("Error settling debt:", error);
      toast.error("Failed to settle debt");
    }
  };

  // Goal handlers
  const handleCreateGoal = async (
    data: Omit<Goal, "id" | "createdAt">,
  ) => {
    try {
      const response = await api.createGoal(userId, data);
      if (response.success) {
        setGoals([...goals, response.goal]);
        toast.success("Goal created successfully!");
      } else {
        throw new Error(response.error || 'Failed to create goal');
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      const tempGoal = {
        id: `temp_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      setGoals([...goals, tempGoal]);
      toast.error("Created locally (offline mode)");
    }
  };

  const handleUpdateGoal = async (
    goalId: string,
    updates: Partial<Goal>,
  ) => {
    try {
      const response = await api.updateGoal(
        userId,
        goalId,
        updates,
      );
      if (response.success) {
        setGoals(
          goals.map((g) =>
            g.id === goalId ? response.goal : g,
          ),
        );

        // Check if goal is completed
        if (
          response.goal.currentAmount >=
          response.goal.targetAmount
        ) {
          toast.success(
            `🎉 Goal "${response.goal.name}" completed! Congratulations!`,
          );
          confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.5 },
          });
        } else {
          toast.success("Goal updated successfully!");
        }
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await api.deleteGoal(userId, goalId);
      if (response.success) {
        setGoals(goals.filter((g) => g.id !== goalId));
        toast.success("Goal deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  // Account handlers
  const handleCreateAccount = async (
    data: Omit<Account, "id" | "createdAt">,
  ) => {
    try {
      const response = await api.createAccount(userId, data);
      if (response.success) {
        setAccounts([...accounts, response.account]);
        toast.success("Account created successfully!");
      } else {
        throw new Error(response.error || 'Failed to create account');
      }
    } catch (error) {
      console.error("Error creating account:", error);
      const tempAccount = {
        id: `temp_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      setAccounts([...accounts, tempAccount]);
      toast.error("Created locally (offline mode)");
    }
  };

  const handleUpdateAccount = async (
    accountId: string,
    updates: Partial<Account>,
  ) => {
    try {
      const response = await api.updateAccount(
        userId,
        accountId,
        updates,
      );
      if (response.success) {
        setAccounts(
          accounts.map((a) =>
            a.id === accountId ? response.account : a,
          ),
        );
        toast.success("Account updated successfully!");
      }
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error("Failed to update account");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const response = await api.deleteAccount(
        userId,
        accountId,
      );
      if (response.success) {
        setAccounts(accounts.filter((a) => a.id !== accountId));
        toast.success("Account deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
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
    await handleUpdateAccount(data.accountId, {
      balance: account.balance - data.amount
    });

    // Update goal or emergency fund
    if (data.destinationType === 'goal') {
      const goal = goals.find(g => g.id === data.destinationId);
      if (goal) {
        await handleUpdateGoal(data.destinationId, {
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
        handleUpdateExpense(editingTransaction.id, data);
      } else if (transactionFormType === "income") {
        handleUpdateIncome(editingTransaction.id, data);
      } else if (transactionFormType === "debt") {
        handleUpdateDebt(editingTransaction.id, data);
      }
    } else {
      // Create new
      if (transactionFormType === "expense") {
        handleCreateExpense(data);
      } else if (transactionFormType === "income") {
        handleCreateIncome(data);
      } else if (transactionFormType === "debt") {
        handleCreateDebt(data);
      }
    }
  };

  // Export data
  const handleExportData = () => {
    const data = {
      expenses,
      incomes,
      debts,
      goals,
      settings,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-hub-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Data exported successfully!");
  };

  // Calculate financial health score
  const calculateHealthScore = () => {
    const totalIncome = incomes.reduce(
      (sum, i) => sum + i.amount,
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );
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

    const savingsRate =
      (totalIncome - totalExpenses) / totalIncome;
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

  // AI Context
  const aiContext: AIContext = {
    totalIncome: incomes.reduce((sum, i) => sum + i.amount, 0),
    totalExpenses: expenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    ),
    activeDebts: debts.filter((d) => d.status === "pending")
      .length,
    goalsCount: goals.length,
    recentTransactions: [
      ...expenses
        .slice(0, 5)
        .map((e) => ({ type: "expense", ...e })),
      ...incomes
        .slice(0, 5)
        .map((i) => ({ type: "income", ...i })),
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading FinHub...
          </p>
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
            {/* Left: Settings Icon */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>

            {/* Center: App Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img 
                src={settings.theme === 'dark' ? darkLogo : lightLogo} 
                alt="FinHub" 
                className="h-10 w-auto"
              />
            </div>

            {/* Right: Notifications Icon */}
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
            <Button
              variant={view === "dashboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("dashboard")}
              className="flex-col h-auto py-2 px-2"
            >
              <TrendingUp className="w-5 h-5 mb-0.5" />
              <span className="text-xs">Home</span>
            </Button>
            <Button
              variant={view === "transactions" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("transactions")}
              className="flex-col h-auto py-2 px-2"
            >
              <ListFilter className="w-5 h-5 mb-0.5" />
              <span className="text-xs">Txns</span>
            </Button>
            <Button
              variant={view === "liability" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("liability")}
              className="flex-col h-auto py-2 px-2"
            >
              <CreditCard className="w-5 h-5 mb-0.5" />
              <span className="text-xs">Liability</span>
            </Button>
            <Button
              variant={view === "goals" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("goals")}
              className="flex-col h-auto py-2 px-2"
            >
              <Target className="w-5 h-5 mb-0.5" />
              <span className="text-xs">Goals</span>
            </Button>
            <Button
              variant={view === "investments" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("investments")}
              className="flex-col h-auto py-2 px-1"
            >
              <PieChart className="w-5 h-5 mb-0.5" />
              <span className="text-xs">Invest</span>
            </Button>
            <Button
              variant={view === "more" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("more")}
              className="flex-col h-auto py-2 px-1"
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-xs">More</span>
            </Button>
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
            onDeleteExpense={handleDeleteExpense}
            onEditIncome={handleEditIncome}
            onDeleteIncome={handleDeleteIncome}
            onEditDebt={handleEditDebt}
            onDeleteDebt={handleDeleteDebt}
            onSettleDebt={handleSettleDebt}
          />
        )}

        {view === "goals" && (
          <GoalsTracker
            goals={goals}
            currency={settings.currency}
            accounts={accounts}
            expenses={expenses}
            incomes={incomes}
            onCreateGoal={handleCreateGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onDeductFromAccount={(accountId, amount) => {
              handleUpdateAccount(accountId, {
                balance: accounts.find(a => a.id === accountId)!.balance - amount
              });
            }}
          />
        )}

        {view === "accounts" && (
          <AccountsManager
            accounts={accounts}
            currency={settings.currency}
            onCreateAccount={handleCreateAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
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
        {/* Ask Guruji FAB - Bottom Left */}
        <Button
          onClick={() => setIsAIOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>

      <div className="fixed bottom-24 right-6 z-50">
        {/* Add Transaction FAB - Bottom Right */}
        <div className="relative">
          {/* Backdrop to close menu on outside click */}
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
          targetAmount: 100000 // This should come from emergency fund settings
        }}
        onAllocate={handleFundAllocation}
      />

      <Toaster position="top-right" richColors />
    </div>
  );
}