import React from 'react';
import { Card } from './ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FinancialHealthScoreProps {
  score: number;
  savingsRate: number;
  debtRatio: number;
  spendingRatio: number;
}

export const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({
  score,
  savingsRate,
  debtRatio,
  spendingRatio
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    if (score >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getTrendIcon = (value: number, threshold: number, inverted = false) => {
    if (inverted) {
      if (value > threshold) return <TrendingDown className="w-4 h-4 text-red-500" />;
      if (value < threshold) return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else {
      if (value > threshold) return <TrendingUp className="w-4 h-4 text-green-500" />;
      if (value < threshold) return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4">Financial Health Score</h3>
      
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#scoreGradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(score / 100) * 351.86} 351.86`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={getScoreGradient(score).split(' ')[0].replace('from-', 'stop-color-')} />
                <stop offset="100%" className={getScoreGradient(score).split(' ')[1].replace('to-', 'stop-color-')} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl ${getScoreColor(score)}`}>{score}</span>
            <span className="text-xs text-gray-500">{getScoreLabel(score)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            {getTrendIcon(savingsRate, 0.15)}
            <span className="text-sm">Savings Rate</span>
          </div>
          <span className="text-sm">{(savingsRate * 100).toFixed(1)}%</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            {getTrendIcon(spendingRatio, 0.8, true)}
            <span className="text-sm">Spending Ratio</span>
          </div>
          <span className="text-sm">{(spendingRatio * 100).toFixed(1)}%</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            {getTrendIcon(debtRatio, 0.3, true)}
            <span className="text-sm">Debt Ratio</span>
          </div>
          <span className="text-sm">{(debtRatio * 100).toFixed(1)}%</span>
        </div>
      </div>
    </Card>
  );
};
