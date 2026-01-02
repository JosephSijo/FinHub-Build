import { TrendingUp, DollarSign } from 'lucide-react';
import { InteractiveFinancialValue } from '../ui/InteractiveFinancialValue';

interface PortfolioSummaryCardsProps {
    totalValue: number;
    totalGainLoss: number;
    gainLossPercentage: number;
    currency: string;
}

export function PortfolioSummaryCards({
    totalValue,
    totalGainLoss,
    gainLossPercentage,
    currency
}: PortfolioSummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="grid-widget">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Total Value</p>
                        <h3 className="text-xl font-bold tabular-nums text-white">
                            <InteractiveFinancialValue value={totalValue} currency={currency || 'USD'} />
                        </h3>
                    </div>
                </div>
            </div>

            <div className="grid-widget">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${totalGainLoss >= 0
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                        <TrendingUp className={`w-6 h-6 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600 dark:text-red-400'}`} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Total Gain/Loss</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className={`text-xl font-bold ${totalGainLoss >= 0 ? 'text-green-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} tabular-nums`}>
                                <InteractiveFinancialValue value={totalGainLoss} currency={currency} />
                            </h3>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums ${totalGainLoss >= 0
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-emerald-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {totalGainLoss >= 0 ? '+' : ''}{((totalGainLoss / (totalValue - totalGainLoss)) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-widget shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <TrendingUp className={`w-6 h-6 ${gainLossPercentage >= 0 ? 'text-green-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Net Returns</p>
                        <h3 className={`text-xl font-bold ${gainLossPercentage >= 0 ? 'text-green-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} tabular-nums`}>
                            <InteractiveFinancialValue value={totalGainLoss} currency={currency} />
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
