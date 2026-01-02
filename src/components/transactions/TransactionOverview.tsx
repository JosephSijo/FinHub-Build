import { useState } from 'react';
import { Card } from '../ui/card';
import { ListFilter, ChevronDown, ChevronUp } from 'lucide-react';
import { Expense, Income, Debt } from '../../types';
import { formatCurrency } from '../../utils/numberFormat';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionOverviewProps {
    currentMonthTransactions: {
        expenses: Expense[];
        incomes: Income[];
    };
    recentTransactions: (Expense | Income | Debt)[];
    totalLiquidity: number;
    currency: string;
}

export function TransactionOverview({
    currentMonthTransactions,
    recentTransactions,
    totalLiquidity,
    currency
}: TransactionOverviewProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const totalMoneyIn = currentMonthTransactions.incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalMoneyOut = currentMonthTransactions.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalServiceCharges = currentMonthTransactions.expenses.reduce((sum, e) => sum + (e.serviceChargeAmount || 0), 0);
    const netBalance = totalMoneyIn - totalMoneyOut - totalServiceCharges;

    return (
        <Card className="p-0 bg-[#0F172A] border border-white/10 shadow-xl overflow-hidden rounded-[24px]">
            {/* Header / Toggle Section */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <ListFilter className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-slate-100 font-medium text-sm sm:text-base">Transaction Overview</h3>
                        <p className="text-xs text-slate-400">
                            Current month activity
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right mr-2">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Liquidity</p>
                        <p className="text-sm font-black text-white tabular-nums">
                            {formatCurrency(totalLiquidity, currency)}
                        </p>
                    </div>
                    <div className="hidden sm:block text-right mr-2 border-l border-white/10 pl-4">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Monthly Net Flow</p>
                        <p className={`text-xs font-bold ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(netBalance, currency)}
                        </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-white/5">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 space-y-4">
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-slate-800/50 border border-white/5 p-3 rounded-2xl">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Money In</p>
                                    <p className="text-base sm:text-lg font-bold text-emerald-400 truncate">
                                        {formatCurrency(totalMoneyIn, currency)}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        {currentMonthTransactions.incomes.length} transactions
                                    </p>
                                </div>
                                <div className="bg-slate-800/50 border border-white/5 p-3 rounded-2xl">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Burn</p>
                                    <p className="text-base sm:text-lg font-bold text-rose-400 truncate">
                                        {formatCurrency(totalMoneyOut, currency)}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        {currentMonthTransactions.expenses.length} transactions
                                    </p>
                                </div>
                                <div className="bg-slate-800/50 border border-white/5 p-3 rounded-2xl">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Service Costs</p>
                                    <p className="text-base sm:text-lg font-bold text-amber-400 truncate">
                                        {formatCurrency(totalServiceCharges, currency)}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        Credit fees tracked
                                    </p>
                                </div>
                            </div>

                            {/* Recent Activity Summary */}
                            {recentTransactions.length > 0 && (
                                <div className="pt-4 border-t border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Recent Activity</p>
                                    <div className="space-y-2">
                                        {recentTransactions.map((transaction, idx) => {
                                            const isIncome = (transaction as any).type === 'income';
                                            const isDebt = (transaction as any).type === 'debt';

                                            let name = '';
                                            if (isIncome) name = (transaction as Income).source;
                                            else if (isDebt) name = `${(transaction as Debt).type === 'borrowed' ? 'Borrowed from' : 'Lent to'} ${(transaction as Debt).personName}`;
                                            else name = (transaction as Expense).description;

                                            return (
                                                <div key={idx} className="flex items-center justify-between bg-slate-800/30 border border-white/5 p-2 rounded-xl">
                                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                                        <span className="text-lg">
                                                            {isIncome ? '💰' : isDebt ? '🤝' : '💸'}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs truncate text-slate-200">
                                                                {name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500">
                                                                {new Date(transaction.date).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className={`text-xs font-medium whitespace-nowrap ml-3 ${isIncome ? 'text-emerald-400' : 'text-rose-400'
                                                        }`}>
                                                        {formatCurrency(transaction.amount, currency)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};
