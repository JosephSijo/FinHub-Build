import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, TrendingUp, TrendingDown, DollarSign, CreditCard, Users, Loader2, Filter, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Expense, Income, Debt, CURRENCY_SYMBOLS } from '../types';
import { api } from '../utils/api';
import { getBudgetPacingStatus, getHaloClasses } from '../utils/budgetUtils';

type TimeRange = 'this-month' | 'last-month' | 'last-3-months' | 'all';
type ChartType = 'pie' | 'bar' | 'line';

interface DashboardProps {
  expenses: Expense[];
  incomes: Income[];
  goals?: any[];
  emergencyFundAmount?: number;
  debts: Debt[];
  currency: string;
  userId: string;
  liabilities?: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  expenses,
  incomes,
  debts,
  currency,
  userId,
  goals = [],
  emergencyFundAmount = 0,
  liabilities = []
}) => {
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('this-month');
  const [categoryChartType, setCategoryChartType] = useState<ChartType>('pie');

  // Filter data by time range
  const filterByTimeRange = (date: string): boolean => {
    const itemDate = new Date(date);
    const now = new Date();

    switch (timeRange) {
      case 'this-month':
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
      case 'last-3-months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return itemDate >= threeMonthsAgo;
      default:
        return true;
    }
  };

  const filteredExpenses = expenses.filter(e => filterByTimeRange(e.date));
  const filteredIncomes = incomes.filter(i => filterByTimeRange(i.date));

  // Calculate totals
  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalDebts = debts.filter(d => d.status === 'pending').reduce((sum, debt) => sum + debt.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.outstanding, 0);
  const netBalance = totalIncome - totalExpenses;
  const spendingPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  // Spending by category
  const categoryData = filteredExpenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.name === expense.category);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Monthly trend (last 6 months)
  const getMonthlyData = () => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();

      const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
      }).reduce((sum, e) => sum + e.amount, 0);

      const monthIncomes = incomes.filter(i => {
        const incomeDate = new Date(i.date);
        return incomeDate.getMonth() === date.getMonth() && incomeDate.getFullYear() === date.getFullYear();
      }).reduce((sum, i) => sum + i.amount, 0);

      months.push({
        month: `${monthName} ${year}`,
        income: monthIncomes,
        expenses: monthExpenses
      });
    }

    return months;
  };

  const monthlyData = getMonthlyData();

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const getSpendingColor = () => {
    if (spendingPercentage >= 90) return 'text-red-600';
    if (spendingPercentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSpendingBgColor = () => {
    if (spendingPercentage >= 90) return 'from-red-500 to-red-600';
    if (spendingPercentage >= 70) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  // Load AI feedback
  useEffect(() => {
    if (totalIncome > 0 || totalExpenses > 0) {
      loadAIFeedback();
    }
  }, [totalIncome, totalExpenses, expenses.length]);

  const loadAIFeedback = async () => {
    setIsLoadingFeedback(true);
    try {
      const topCategory = categoryData.length > 0
        ? categoryData.sort((a, b) => b.value - a.value)[0].name
        : 'N/A';

      const response = await api.getDashboardFeedback({
        totalIncome,
        totalExpenses,
        spendingPercentage,
        topCategory
      });

      if (response.success && response.feedback) {
        setAiFeedback(response.feedback);
      }
    } catch (error) {
      console.error('Error loading AI feedback:', error);
      setAiFeedback('Track your transactions to get personalized insights! 💡');
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm mr-2">Time Range:</span>
          <Button
            variant={timeRange === 'this-month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('this-month')}
          >
            This Month
          </Button>
          <Button
            variant={timeRange === 'last-month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('last-month')}
          >
            Last Month
          </Button>
          <Button
            variant={timeRange === 'last-3-months' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('last-3-months')}
          >
            Last 3 Months
          </Button>
          <Button
            variant={timeRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('all')}
          >
            All Time
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Income (Money In)</p>
              <p className="text-2xl text-emerald-600 mt-1">
                {CURRENCY_SYMBOLS[currency]}{totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Net Balance</p>
              <p className={`text-2xl mt-1 ${netBalance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-rose-600'}`}>
                {CURRENCY_SYMBOLS[currency]}{netBalance.toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getHaloClasses(getBudgetPacingStatus(totalIncome, totalExpenses))}`}>
              <DollarSign className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Fund</p>
              <p className="text-2xl text-blue-600 mt-1">
                {CURRENCY_SYMBOLS[currency]}{emergencyFundAmount.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expense (Money Out)</p>
              <p className="text-2xl text-rose-600 mt-1">
                {CURRENCY_SYMBOLS[currency]}{totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Liabilities</p>
              <p className="text-2xl text-orange-600 mt-1">
                {CURRENCY_SYMBOLS[currency]}{totalLiabilities.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Goals Allocated</p>
              <p className="text-2xl text-purple-600 mt-1">
                {CURRENCY_SYMBOLS[currency]}{goals.reduce((sum, g) => sum + g.currentAmount, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Debt (IOU)</p>
              <p className="text-2xl text-amber-600 mt-1">
                {CURRENCY_SYMBOLS[currency]}{totalDebts.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* AI Feedback Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="mb-2 text-blue-900 dark:text-blue-100">AI Finance Guru Says:</h3>
            {isLoadingFeedback ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm text-blue-800 dark:text-blue-200">Analyzing your finances...</p>
              </div>
            ) : (
              <p className="text-sm text-blue-900 dark:text-blue-100">{aiFeedback}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadAIFeedback}
              className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Refresh Insights
            </Button>
          </div>
        </div>
      </Card>

      {/* Spending Gauge */}
      {totalIncome > 0 && (
        <Card className="p-6">
          <h3 className="mb-4">Income vs Spending</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="20"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="20"
                  fill="none"
                  strokeDasharray={`${(Math.min(spendingPercentage, 100) / 100) * 628} 628`}
                  className={`${getSpendingColor()} transition-all duration-1000`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl ${getSpendingColor()}`}>
                  {spendingPercentage.toFixed(0)}%
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">of income spent</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
              {spendingPercentage < 70 && '✨ Great job! You\'re spending wisely.'}
              {spendingPercentage >= 70 && spendingPercentage < 90 && '⚠️ You\'re spending most of your income.'}
              {spendingPercentage >= 90 && '🚨 Warning: You\'re spending more than you should!'}
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Spending by Category</h3>
              <div className="flex gap-2">
                <Button
                  variant={categoryChartType === 'pie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryChartType('pie')}
                >
                  Pie
                </Button>
                <Button
                  variant={categoryChartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryChartType('bar')}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={categoryChartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryChartType('line')}
                >
                  <LineChartIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <ResponsiveContainer width="100%" height={420}>
                {categoryChartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="42%"
                      labelLine={{
                        stroke: '#888',
                        strokeWidth: 1.5
                      }}
                      label={({ percent }) => {
                        if (percent < 0.05) return null;
                        return `${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={115}
                      innerRadius={55}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          stroke="#fff"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${CURRENCY_SYMBOLS[currency]}${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      itemStyle={{
                        color: '#1f2937',
                        fontWeight: 500
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      height={70}
                      wrapperStyle={{
                        paddingTop: '25px',
                        fontSize: '13px'
                      }}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value, entry: any) => {
                        if (!entry?.payload?.value) return value;
                        const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                        const percentage = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : '0';
                        return `${value} (${percentage}%)`;
                      }}
                    />
                  </PieChart>
                ) : categoryChartType === 'bar' ? (
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${CURRENCY_SYMBOLS[currency]}${value.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#3b82f6">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={categoryData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${CURRENCY_SYMBOLS[currency]}${value.toLocaleString()}`} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Monthly Trend */}
        {monthlyData.some(m => m.income > 0 || m.expenses > 0) && (
          <Card className="p-6">
            <h3 className="mb-4">6-Month Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${CURRENCY_SYMBOLS[currency]}${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
};
