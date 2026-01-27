import { motion } from 'motion/react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/numberFormat';
import { ShieldAlert, TrendingDown, Zap, ShieldCheck } from 'lucide-react';

export function CashflowForecast() {
    const { cashflowForecast, currency } = useFinance();

    if (!cashflowForecast) return null;

    const forecasts = [
        { days: 30, data: cashflowForecast[30] },
        { days: 60, data: cashflowForecast[60] },
        { days: 90, data: cashflowForecast[90] },
    ];

    const dailyBurn = cashflowForecast[30].dailyBurnTotal / 30;

    return (
        <div className="space-y-6">
            {/* Header / Daily Burn Stats */}
            <div className="flex items-center justify-between px-2">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Essential Daily Burn</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{formatCurrency(dailyBurn, currency)}</span>
                        <span className="text-[10px] text-slate-500 font-bold">/ day</span>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Zap className="w-6 h-6" />
                </div>
            </div>

            {/* Forecast Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {forecasts.map(({ days, data }) => (
                    <motion.div
                        key={days}
                        whileHover={{ scale: 1.02 }}
                        className={`p-5 rounded-[28px] border relative overflow-hidden transition-all bg-slate-900/40 ${data.riskLevel === 'high' ? 'border-rose-500/30' :
                            data.riskLevel === 'medium' ? 'border-amber-500/30' :
                                'border-white/5'
                            }`}
                    >
                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">{days} Days Forecast</p>
                                <p className={`text-xl font-black tabular-nums ${data.riskLevel === 'high' ? 'text-rose-400' :
                                    data.riskLevel === 'medium' ? 'text-amber-400' :
                                        'text-white'
                                    }`}>
                                    {formatCurrency(data.projectedBalance, currency)}
                                </p>
                            </div>

                            <div className="flex items-center justify-between text-[9px] font-bold">
                                <span className={`${data.riskLevel === 'high' ? 'text-rose-500' :
                                    data.riskLevel === 'medium' ? 'text-amber-500' :
                                        'text-emerald-500'
                                    } bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5 flex items-center gap-1.5 uppercase tracking-wider`}>
                                    {data.riskLevel === 'high' && <ShieldAlert className="w-3 h-3" />}
                                    {data.riskLevel === 'medium' && <TrendingDown className="w-3 h-3" />}
                                    {data.riskLevel === 'low' && <ShieldCheck className="w-3 h-3" />}
                                    {data.riskLevel.toUpperCase()} RISK
                                </span>
                            </div>
                        </div>

                        {/* Background Glow */}
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 -mr-12 -mt-12 ${data.riskLevel === 'high' ? 'bg-rose-500' :
                            data.riskLevel === 'medium' ? 'bg-amber-500' :
                                'bg-indigo-500'
                            }`} />
                    </motion.div>
                ))}
            </div>

            {/* Insight Alerts (Only if Deficit Risk) */}
            {forecasts.some(f => f.data.riskLevel !== 'low') && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-rose-400 uppercase tracking-tight">Deficit Risk Detected</h4>
                        <p className="text-xs text-rose-100/70 leading-relaxed font-bold">
                            Based on your behavioral burn and upcoming fixed commitments, you might hit a deficit within the next 90 days.
                            Consider reducing discretionary spending or checking for unnecessary subscriptions.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
