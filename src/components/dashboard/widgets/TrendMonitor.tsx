import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/numberFormat';

export interface TrendMonitorProps {
    currency: string;
    currentMonthSpending: number;
    lastMonthSpending: number;
    isSpiking: boolean;
    data: { name: string; value: number; color: string }[];
}

export const TrendMonitor: React.FC<TrendMonitorProps> = ({
    currency,
    currentMonthSpending,
    lastMonthSpending,
    isSpiking,
    data
}) => {

    // Trend Calculation
    const diff = currentMonthSpending - lastMonthSpending;
    const percentDiff = lastMonthSpending > 0 ? Math.round((diff / lastMonthSpending) * 100) : 0;
    const isUp = diff > 0;

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden h-full flex flex-col">

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Spend Monitor</h3>
                    {isSpiking ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 roundedElement bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3" />
                            Spiking
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 roundedElement bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                            <TrendingDown className="w-3 h-3" />
                            Normal Range
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex items-center gap-6">

                {/* Donut */}
                <div className="relative w-24 h-24 flex-shrink-0">
                    <PieChart width={96} height={96}>
                        <Pie
                            data={data}
                            innerRadius={35}
                            outerRadius={45}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className={`text-xs font-black ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {isUp ? '+' : ''}{percentDiff}%
                        </span>
                    </div>
                </div>

                {/* Legend / Stats */}
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Last Month</span>
                        <span className="text-xs font-mono text-slate-400">{formatCurrency(lastMonthSpending, currency, true)}</span>
                    </div>

                    <div className="flex justify-between items-end">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">This Month</span>
                        <span className={`text-sm font-black font-mono ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {formatCurrency(currentMonthSpending, currency, true)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Top Category Label */}
            {data.length > 0 && (
                <div className="mt-4 text-center">
                    <p className="text-[10px] text-slate-500 font-medium">
                        Top Driver: <span className="text-slate-300 font-bold">{data[0].name}</span> ({Math.round((data[0].value / currentMonthSpending) * 100)}%)
                    </p>
                </div>
            )}
        </div>
    );
};
