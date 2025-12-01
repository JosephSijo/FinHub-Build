import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Pencil, Trash2, Check, Search, ShoppingBag, Coffee, Car, Home, Smartphone, Heart, GraduationCap, Plane, ShoppingCart, Sparkles, DollarSign, TrendingUp, Users, RefreshCw, Calendar, TrendingDown, CreditCard, Target, Shield, Repeat, ListFilter, AlertCircle } from 'lucide-react';
import { Expense, Income, Debt, CURRENCY_SYMBOLS } from '../types';

interface TransactionListProps {
  expenses: Expense[];
  incomes: Income[];
  debts: Debt[];
  currency: string;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (id: string) => void;
  onSettleDebt: (id: string) => void;
}

// Icon mapping for categories
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'Food & Dining': <Coffee className="w-5 h-5" />,
    'Transport': <Car className="w-5 h-5" />,
    'Shopping': <ShoppingBag className="w-5 h-5" />,
    'Entertainment': <Sparkles className="w-5 h-5" />,
    'Bills & Utilities': <Smartphone className="w-5 h-5" />,
    'Healthcare': <Heart className="w-5 h-5" />,
    'Education': <GraduationCap className="w-5 h-5" />,
    'Travel': <Plane className="w-5 h-5" />,
    'Groceries': <ShoppingCart className="w-5 h-5" />,
    'Personal Care': <Sparkles className="w-5 h-5" />,
    'EMI': <CreditCard className="w-5 h-5" />,
    'Subscription': <Repeat className="w-5 h-5" />,
    'Personal IOU': <Users className="w-5 h-5" />,
    'Debt Payment': <Users className="w-5 h-5" />, // Legacy support
    'Other': <Home className="w-5 h-5" />,
  };
  return iconMap[category] || <Home className="w-5 h-5" />;
};

// Icon for income sources
const getIncomeIcon = (source: string) => {
  if (source.toLowerCase().includes('salary')) {
    return <DollarSign className="w-5 h-5" />;
  }
  if (source.toLowerCase().includes('freelance')) {
    return <TrendingUp className="w-5 h-5" />;
  }
  if (source.toLowerCase().includes('investment')) {
    return <TrendingUp className="w-5 h-5" />;
  }
  return <DollarSign className="w-5 h-5" />;
};

export const TransactionList: React.FC<TransactionListProps> = ({
  expenses,
  incomes,
  debts,
  currency,
  onEditExpense,
  onDeleteExpense,
  onEditIncome,
  onDeleteIncome,
  onEditDebt,
  onDeleteDebt,
  onSettleDebt
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'expenses' | 'income' | 'debts' | 'subs' | 'emis' | 'emergency' | 'goals'>('all');

  // Combine all transactions
  const allTransactions = [
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
    ...incomes.map(i => ({ ...i, type: 'income' as const })),
    ...debts.map(d => ({ ...d, type: 'debt' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = allTransactions.filter((t) => {
    const matchesSearch = 
      ('description' in t && t.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ('source' in t && t.source?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ('personName' in t && t.personName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.tags && Array.isArray(t.tags) && t.tags.some(tag => tag?.toLowerCase().includes(searchTerm.toLowerCase())));

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "expenses") return t.type === "expense";
    if (filter === "income") return t.type === "income";
    if (filter === "debts") return t.type === "debt";
    if (filter === "subs") {
      // Subscription transactions
      if (t.type === "expense") {
        return ('category' in t && t.category === 'Subscription') ||
               (t.tags && t.tags.includes("subscription")) ||
               ('description' in t && t.description && (
                 t.description.toLowerCase().includes('subscription') ||
                 t.description.toLowerCase().includes('netflix') ||
                 t.description.toLowerCase().includes('spotify') ||
                 t.description.toLowerCase().includes('prime')
               ));
      }
      return false;
    }
    if (filter === "emis") {
      // EMI/Loan payment transactions
      if (t.type === "expense") {
        return ('category' in t && t.category === 'EMI') ||
               (t.tags && (t.tags.includes("emi") || t.tags.includes("loan"))) ||
               ('description' in t && t.description && (
                 t.description.toLowerCase().includes('emi') ||
                 t.description.toLowerCase().includes('loan payment') ||
                 t.description.toLowerCase().includes('loan')
               ));
      }
      return false;
    }
    if (filter === "emergency") {
      // Emergency fund transactions: Healthcare expenses and insurance
      if (t.type === "expense") {
        return ('category' in t && t.category === 'Healthcare') ||
               ('description' in t && t.description && (
                 t.description.toLowerCase().includes('insurance') ||
                 t.description.toLowerCase().includes('medical') ||
                 t.description.toLowerCase().includes('health') ||
                 t.description.toLowerCase().includes('emergency')
               ));
      }
      return false;
    }
    if (filter === "goals") {
      // Goal-related transactions
      return (t.tags && Array.isArray(t.tags) && t.tags.some((tag: string) => tag?.toLowerCase().includes('goal'))) ||
             ('description' in t && t.description && (
               t.description.toLowerCase().includes('goal') ||
               t.description.toLowerCase().includes('saving')
             ));
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate transaction summary
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthTransactions = {
    expenses: expenses.filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }),
    incomes: incomes.filter(i => {
      const date = new Date(i.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
  };

  const totalMoneyIn = currentMonthTransactions.incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalMoneyOut = currentMonthTransactions.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalMoneyIn - totalMoneyOut;

  // Get recent transactions (last 5)
  const recentTransactions = allTransactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Mini-Dashboard */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800">
        <div className="space-y-4">
          {/* Header Section */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <ListFilter className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-indigo-900 dark:text-indigo-100">Transaction Overview</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Current month activity
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Money In</p>
              <p className="text-lg text-green-600 dark:text-green-400">
                +{CURRENCY_SYMBOLS[currency]}{totalMoneyIn.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {currentMonthTransactions.incomes.length} transactions
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Money Out</p>
              <p className="text-lg text-red-600 dark:text-red-400">
                -{CURRENCY_SYMBOLS[currency]}{totalMoneyOut.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {currentMonthTransactions.expenses.length} transactions
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Net Balance</p>
              <p className={`text-lg ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {netBalance >= 0 ? '+' : ''}{CURRENCY_SYMBOLS[currency]}{netBalance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                This month
              </p>
            </div>
          </div>

          {/* Recent Activity Summary */}
          {recentTransactions.length > 0 && (
            <div className="pt-4 border-t border-indigo-200 dark:border-indigo-700">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-3">Recent Activity:</p>
              <div className="space-y-2">
                {recentTransactions.map((transaction, idx) => {
                  const isIncome = transaction.type === 'income';
                  const isDebt = transaction.type === 'debt';
                  return (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-lg">
                          {isIncome ? '💰' : isDebt ? '🤝' : '💸'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">
                            {isIncome 
                              ? (transaction as Income).source 
                              : isDebt 
                                ? `${(transaction as Debt).type === 'borrowed' ? 'Borrowed from' : 'Lent to'} ${(transaction as Debt).personName}`
                                : (transaction as Expense).description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className={`text-xs whitespace-nowrap ml-3 ${
                        isIncome ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isIncome ? '+' : '-'}{CURRENCY_SYMBOLS[currency]}{transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Header */}
      <div>
        <h2 className="mb-2">All Transactions</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track and manage all your financial transactions
        </p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search transactions, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="gap-1.5"
        >
          <ListFilter className="w-4 h-4" />
          All
        </Button>
        <Button
          variant={filter === "expenses" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("expenses")}
          className={`gap-1.5 ${filter !== "expenses" ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20" : ""}`}
        >
          <TrendingDown className="w-4 h-4" />
          Expenses
        </Button>
        <Button
          variant={filter === "income" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("income")}
          className={`gap-1.5 ${filter !== "income" ? "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20" : ""}`}
        >
          <TrendingUp className="w-4 h-4" />
          Income
        </Button>
        <Button
          variant={filter === "debts" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("debts")}
          className={`gap-1.5 ${filter !== "debts" ? "border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/20" : ""}`}
        >
          <Users className="w-4 h-4" />
          IOUs
        </Button>
        <Button
          variant={filter === "subs" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("subs")}
          className={`gap-1.5 ${filter !== "subs" ? "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20" : ""}`}
        >
          <Repeat className="w-4 h-4" />
          Subs
        </Button>
        <Button
          variant={filter === "emis" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("emis")}
          className={`gap-1.5 ${filter !== "emis" ? "border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20" : ""}`}
        >
          <CreditCard className="w-4 h-4" />
          EMIs
        </Button>
        <Button
          variant={filter === "emergency" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("emergency")}
          className={`gap-1.5 ${filter !== "emergency" ? "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20" : ""}`}
        >
          <Shield className="w-4 h-4" />
          Emergency
        </Button>
        <Button
          variant={filter === "goals" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("goals")}
          className={`gap-1.5 ${filter !== "goals" ? "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20" : ""}`}
        >
          <Target className="w-4 h-4" />
          Goals
        </Button>
      </div>

      {/* Info Banner for EMI Filter */}
      {filter === "emis" && (
        <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex gap-3">
            <CreditCard className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-orange-900 dark:text-orange-100">EMI Payments</h4>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                These are loan EMI payment transactions. Manage your loans in the <strong>Liability tab</strong>.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No transactions found.</p>
            <p className="text-sm text-gray-400 mt-2">
              {filter === "emis" 
                ? "No EMI payments recorded. Add expenses with 'EMI' category or visit the Liability tab to track loans."
                : "Try adjusting your filters or search term"}
            </p>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => {
            if (transaction.type === 'expense') {
              const expense = transaction as Expense & { type: 'expense' };
              
              // Check if transaction is goal-related
              const isGoalRelated = (expense.tags && Array.isArray(expense.tags) && expense.tags.some((tag: string) => tag?.toLowerCase().includes('goal'))) ||
                                   (expense.description && expense.description.toLowerCase().includes('goal')) ||
                                   (expense.description && expense.description.toLowerCase().includes('saving'));
              
              // Check if emergency fund related
              const isEmergencyRelated = expense.category === 'Healthcare' ||
                                        (expense.description && expense.description.toLowerCase().includes('insurance')) ||
                                        (expense.description && expense.description.toLowerCase().includes('medical')) ||
                                        (expense.description && expense.description.toLowerCase().includes('emergency'));
              
              return (
                <Card key={expense.id} className={`p-4 hover:shadow-md transition-shadow ${
                  isGoalRelated ? 'border-l-4 border-l-purple-500' : ''
                } ${isEmergencyRelated ? 'border-l-4 border-l-blue-500' : ''}`}>
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 flex-shrink-0">
                      {getCategoryIcon(expense.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="truncate">{expense.description}</h4>
                        {expense.isRecurring && (
                          <RefreshCw className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        )}
                        {isGoalRelated && (
                          <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400">
                            🎯 Goal
                          </Badge>
                        )}
                        {isEmergencyRelated && (
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400">
                            🛡️ Emergency
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {expense.category} • {formatDate(expense.date)}
                      </p>
                      {expense.tags && Array.isArray(expense.tags) && expense.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {expense.tags.map((tag, idx) => (
                            <Badge key={`${tag}-${idx}`} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-3">
                      <p className="text-red-600 whitespace-nowrap">
                        -{CURRENCY_SYMBOLS[currency]}{expense.amount.toLocaleString()}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditExpense(expense)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteExpense(expense.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            } else if (transaction.type === 'income') {
              const income = transaction as Income & { type: 'income' };
              
              // Check if transaction is goal-related
              const isGoalRelated = (income.tags && Array.isArray(income.tags) && income.tags.some((tag: string) => tag?.toLowerCase().includes('goal'))) ||
                                   (income.source && income.source.toLowerCase().includes('goal')) ||
                                   (income.source && income.source.toLowerCase().includes('saving'));
              
              return (
                <Card key={income.id} className={`p-4 hover:shadow-md transition-shadow ${
                  isGoalRelated ? 'border-l-4 border-l-purple-500' : ''
                }`}>
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 flex-shrink-0">
                      {getIncomeIcon(income.source)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="truncate">{income.source}</h4>
                        {income.isRecurring && (
                          <RefreshCw className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        )}
                        {isGoalRelated && (
                          <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400">
                            🎯 Goal
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Income • {formatDate(income.date)}
                      </p>
                      {income.tags && Array.isArray(income.tags) && income.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {income.tags.map((tag, idx) => (
                            <Badge key={`${tag}-${idx}`} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-3">
                      <p className="text-green-600 whitespace-nowrap">
                        +{CURRENCY_SYMBOLS[currency]}{income.amount.toLocaleString()}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditIncome(income)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteIncome(income.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            } else {
              const debt = transaction as Debt & { type: 'debt' };
              return (
                <Card key={debt.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      debt.type === 'lent' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                    }`}>
                      <Users className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate">{debt.personName}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {debt.type === 'lent' ? 'You lent' : 'You borrowed'} • {formatDate(debt.date)}
                      </p>
                      {debt.status === 'settled' && (
                        <Badge variant="outline" className="text-xs mt-1 bg-green-50 dark:bg-green-900/20 text-green-700">
                          ✓ Settled
                        </Badge>
                      )}
                      {debt.tags && Array.isArray(debt.tags) && debt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {debt.tags.map((tag, idx) => (
                            <Badge key={`${tag}-${idx}`} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-3">
                      <p className={debt.type === 'lent' ? 'text-blue-600' : 'text-orange-600'}>
                        {CURRENCY_SYMBOLS[currency]}{debt.amount.toLocaleString()}
                      </p>
                      <div className="flex gap-1">
                        {debt.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSettleDebt(debt.id)}
                            title="Mark as Settled"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditDebt(debt)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteDebt(debt.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }
          })
        )}
      </div>
    </div>
  );
};
