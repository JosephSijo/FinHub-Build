import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Zap, 
  DollarSign, 
  RefreshCw, 
  TrendingUp,
  ChevronRight,
  Snowflake,
  Mountain,
  LayoutGrid,
  Lightbulb,
  CheckCircle2,
  Info
} from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../types';

interface Liability {
  id: string;
  name: string;
  type: string;
  principal: number;
  outstanding: number;
  interestRate: number;
  emiAmount: number;
  startDate: string;
  tenure: number;
}

interface LiabilityDashboardProps {
  liabilities: Liability[];
  currency: string;
}

export function LiabilityDashboard({ liabilities, currency }: LiabilityDashboardProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  if (!liabilities || liabilities.length === 0) {
    return null; // Don't show if no liabilities
  }

  const totalOutstanding = liabilities.reduce((sum, l) => sum + l.outstanding, 0);
  const totalEMI = liabilities.reduce((sum, l) => sum + l.emiAmount, 0);
  const averageInterestRate = liabilities.reduce((sum, l) => sum + l.interestRate, 0) / liabilities.length;

  // Calculate months to debt freedom (simple calculation)
  const monthsToFreedom = totalEMI > 0 ? Math.ceil(totalOutstanding / totalEMI) : 0;

  // Find highest and lowest interest rate loans
  const highestInterestLoan = [...liabilities].sort((a, b) => b.interestRate - a.interestRate)[0];
  const lowestInterestLoan = [...liabilities].sort((a, b) => a.interestRate - b.interestRate)[0];

  // Snowball strategy - sort by outstanding (smallest to largest)
  const snowballOrder = [...liabilities].sort((a, b) => a.outstanding - b.outstanding);

  // Avalanche strategy - sort by interest rate (highest to lowest)
  const avalancheOrder = [...liabilities].sort((a, b) => b.interestRate - a.interestRate);

  const strategies = [
    {
      id: 'avalanche',
      icon: Mountain,
      title: 'Avalanche Method',
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-600',
      description: 'Pay off highest interest rate loans first',
      savings: 'Saves the most money on interest',
      order: avalancheOrder.slice(0, 3),
      recommended: highestInterestLoan && highestInterestLoan.interestRate > 10
    },
    {
      id: 'snowball',
      icon: Snowflake,
      title: 'Snowball Method',
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-600',
      description: 'Pay off smallest balances first',
      savings: 'Builds momentum with quick wins',
      order: snowballOrder.slice(0, 3),
      recommended: liabilities.length > 3
    },
    {
      id: 'consolidation',
      icon: LayoutGrid,
      title: 'Debt Consolidation',
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-600',
      description: 'Combine multiple debts into one loan',
      savings: 'Simplifies payments, may lower rate',
      recommended: liabilities.length >= 3 && averageInterestRate > 8,
      consolidationRate: Math.max(6, averageInterestRate - 2) // Potential consolidated rate
    }
  ];

  const actionItems = [
    {
      icon: Zap,
      title: 'Make Extra Payments',
      description: 'Even small extra payments can significantly reduce interest',
      impact: 'High',
      color: 'orange',
      suggestion: `Add ${CURRENCY_SYMBOLS[currency]}${Math.round(totalEMI * 0.1).toLocaleString()} extra/month to save on interest`
    },
    {
      icon: RefreshCw,
      title: 'Refinance Your Loan',
      description: 'Lower interest rates can reduce monthly payments',
      impact: 'High',
      color: 'blue',
      suggestion: highestInterestLoan 
        ? `Refinancing ${highestInterestLoan.name} at ${(highestInterestLoan.interestRate - 2).toFixed(1)}% could save ${CURRENCY_SYMBOLS[currency]}${Math.round(highestInterestLoan.outstanding * 0.02).toLocaleString()}`
        : 'Consider refinancing high-interest loans'
    },
    {
      icon: Target,
      title: 'Prioritize High-Interest Loans',
      description: 'Focus extra money on loans with highest rates',
      impact: 'Medium',
      color: 'red',
      suggestion: highestInterestLoan 
        ? `Focus on ${highestInterestLoan.name} (${highestInterestLoan.interestRate}% interest)`
        : 'Review interest rates regularly'
    },
    {
      icon: TrendingUp,
      title: 'Increase Income Sources',
      description: 'Additional income accelerates debt payoff',
      impact: 'High',
      color: 'green',
      suggestion: 'Consider side income to pay off debt faster'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-red-900 dark:text-red-100">Liability Overview</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Smart strategies to manage your debt effectively
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Outstanding</p>
            <p className="text-red-600 mt-1">
              {CURRENCY_SYMBOLS[currency]}{totalOutstanding.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Monthly EMI</p>
            <p className="text-orange-600 mt-1">
              {CURRENCY_SYMBOLS[currency]}{totalEMI.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg. Interest</p>
            <p className="text-yellow-600 mt-1">
              {averageInterestRate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Debt Freedom</p>
            <p className="text-blue-600 mt-1">
              {monthsToFreedom} months
            </p>
          </div>
        </div>
      </Card>

      {/* Repayment Strategies */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h4>Debt Repayment Strategies</h4>
        </div>

        <div className="space-y-3">
          {strategies.map((strategy) => {
            const Icon = strategy.icon;
            const isExpanded = selectedStrategy === strategy.id;

            return (
              <div
                key={strategy.id}
                className={`border-2 rounded-lg overflow-hidden transition-all ${
                  isExpanded ? strategy.borderColor : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <button
                  onClick={() => setSelectedStrategy(isExpanded ? null : strategy.id)}
                  className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                    isExpanded ? strategy.bgColor : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${strategy.bgColor}`}>
                    <Icon className={`w-5 h-5 ${strategy.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm">{strategy.title}</h4>
                      {strategy.recommended && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {strategy.description}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{strategy.savings}</span>
                      </div>
                      {strategy.id === 'consolidation' && strategy.consolidationRate && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Potential consolidated rate: <span className="font-semibold text-green-600">{strategy.consolidationRate.toFixed(1)}%</span>
                        </p>
                      )}
                    </div>

                    {strategy.order && strategy.order.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {strategy.id === 'avalanche' ? 'Priority order (highest interest first):' : 'Priority order (smallest balance first):'}
                        </p>
                        <div className="space-y-2">
                          {strategy.order.map((liability, index) => (
                            <div key={liability.id} className="flex items-center gap-2 text-sm">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs">
                                {index + 1}
                              </span>
                              <span className="flex-1 truncate">{liability.name}</span>
                              <span className="text-red-600">
                                {CURRENCY_SYMBOLS[currency]}{liability.outstanding.toLocaleString()}
                              </span>
                              <span className="text-yellow-600 text-xs">
                                {liability.interestRate}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Action Items */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-600" />
          <h4>Action Items to Reduce Debt</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actionItems.map((item) => {
            const Icon = item.icon;
            const impactColors = {
              High: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
              Medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
              Low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            };

            return (
              <div key={item.title} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-${item.color}-100 dark:bg-${item.color}-900/30`}>
                    <Icon className={`w-4 h-4 text-${item.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm">{item.title}</h5>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${impactColors[item.impact as keyof typeof impactColors]}`}>
                        {item.impact} Impact
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-start gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      <Info className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-blue-700 dark:text-blue-300">{item.suggestion}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Warning if high debt */}
      {totalOutstanding > 0 && totalEMI > 0 && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <h4 className="text-yellow-900 dark:text-yellow-100">Stay on Track</h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Your total monthly EMI is {CURRENCY_SYMBOLS[currency]}{totalEMI.toLocaleString()}. 
                Make sure this doesn't exceed 40% of your monthly income to avoid financial stress.
                {monthsToFreedom > 0 && ` At the current rate, you'll be debt-free in approximately ${monthsToFreedom} months.`}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
