import React from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, TrendingDown, Infinity, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/numberFormat';
import { MeshBackground } from '@/components/ui/MeshBackground';

export interface CashflowForecastProps {
    daysRemaining: number;
    safeDailyLimit: number;
    currency: string;
    burnRate: number; // Daily burn rate
    availableLiquidity: number;
}

export const CashflowForecastCard: React.FC<CashflowForecastProps> = ({
    daysRemaining,
    safeDailyLimit,
    currency,
    burnRate,
    availableLiquidity
}) => {
    // Calculate survival runway
    // If burnRate is 0, effective runway is infinite (or huge).
    const runwayDays = burnRate > 0 ? Math.floor(availableLiquidity / burnRate) : 999;

    // Status Logic
    const isSafe = runwayDays > daysRemaining + 7; // Safe if we can survive current cycle + 1 week buffer
    const isCritical = runwayDays < 7;

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-full group">
            <MeshBackground variant={isCritical ? "debt" : "safe"} className="opacity-[0.05] group-hover:opacity-[0.1] transition-opacity" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${isCritical ? 'bg-rose-500/10' : 'bg-blue-500/10'}`}>
                        <CalendarClock className={`w-6 h-6 ${isCritical ? 'text-rose-400' : 'text-blue-400'}`} />
                    </div>
                    {isCritical && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase text-rose-400">Critical</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1 mb-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Runway Forecast</h3>
                    <div className="flex items-baseline gap-2">
                        {runwayDays === 999 ? (
                            <div className="flex items-center gap-2">
                                <Infinity className="w-8 h-8 text-emerald-400" />
                                <span className="text-xl font-bold text-emerald-500/50">Days</span>
                            </div>
                        ) : (
                            <>
                                <span className={`text-4xl font-black tabular-nums ${isCritical ? 'text-rose-400' : isSafe ? 'text-white' : 'text-amber-400'}`}>
                                    {runwayDays}
                                </span>
                                <span className="text-lg font-bold text-slate-500">Days Safe</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-wide">Daily Burn</span>
                        <span className="text-slate-300 font-mono tabular-nums">{formatCurrency(burnRate, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-wide">Safe Limit</span>
                        <span className={`font-mono tabular-nums font-bold ${safeDailyLimit < burnRate ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {formatCurrency(safeDailyLimit, currency)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Bar for Visual Context */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (runwayDays / 30) * 100)}%` }}
                    className={`h-full ${isCritical ? 'bg-rose-500' : isSafe ? 'bg-blue-500' : 'bg-amber-500'}`}
                />
            </div>
        </div>
    );
};
