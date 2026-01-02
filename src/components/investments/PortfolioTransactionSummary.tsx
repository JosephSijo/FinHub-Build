import React from 'react';
import { Card } from '../ui/card';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/numberFormat';

interface Transaction {
    description?: string;
    source?: string;
    amount: number;
    date: string;
}

interface PortfolioTransactionSummaryProps {
    transactions: Transaction[];
    totalInvested: number;
    totalReturns: number;
    currency: string;
}

export function PortfolioTransactionSummary({
    transactions,
    totalInvested,
    totalReturns,
    currency
}: PortfolioTransactionSummaryProps) {
    if (transactions.length === 0) return null;

    return (
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 dark:bg-gray-800 border-2 border-emerald-200 dark:border-none shadow-medium">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-emerald-900 dark:text-emerald-100">Investment Activity</h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            Recent transactions
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Invested</p>
                        <p className="text-xl text-red-600 dark:text-red-400">
                            {formatCurrency(totalInvested, currency)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Returns</p>
                        <p className="text-xl text-green-600 dark:text-green-400">
                            {formatCurrency(totalReturns, currency)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-emerald-200 dark:border-emerald-700">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-3">Recent Transactions:</p>
                <div className="space-y-2">
                    {transactions.map((transaction, idx) => {
                        const isExpense = 'description' in transaction;
                        const name = isExpense ? transaction.description : transaction.source;
                        return (
                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">
                                        {name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <p className={`text-sm whitespace-nowrap ml-3 ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(transaction.amount, currency)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}
