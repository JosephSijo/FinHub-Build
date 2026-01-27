import { motion } from 'motion/react';
import { useFinance } from '../context/FinanceContext';
import { AlertTriangle, CheckCircle2, CloudRain, ShieldAlert } from 'lucide-react';

export function StressScoreCard() {
    const { stressScore } = useFinance();

    if (!stressScore) return null;

    const { score, level, message, factors } = stressScore;

    const getColor = (lvl: string) => {
        switch (lvl) {
            case 'low': return 'text-emerald-400';
            case 'moderate': return 'text-amber-400';
            case 'high': return 'text-rose-400';
            case 'critical': return 'text-rose-600';
            default: return 'text-slate-400';
        }
    };

    const getBgColor = (lvl: string) => {
        switch (lvl) {
            case 'low': return 'bg-emerald-500/10 border-emerald-500/20';
            case 'moderate': return 'bg-amber-500/10 border-amber-500/20';
            case 'high': return 'bg-rose-500/10 border-rose-500/20';
            case 'critical': return 'bg-rose-600/20 border-rose-600/30';
            default: return 'bg-slate-500/10 border-slate-500/20';
        }
    };

    const getIcon = (lvl: string) => {
        switch (lvl) {
            case 'low': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            case 'moderate': return <CloudRain className="w-5 h-5 text-amber-400" />;
            case 'high': return <AlertTriangle className="w-5 h-5 text-rose-400" />;
            case 'critical': return <ShieldAlert className="w-5 h-5 text-rose-500" />;
            default: return null;
        }
    };

    // Gauge logic uses score directly in transform

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-4 relative">
                {/* Gauge Background */}
                <div className="w-48 h-24 overflow-hidden relative">
                    <div className="w-48 h-48 rounded-full border-[12px] border-white/5" />
                    <div className={`absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-t-transparent border-l-transparent transition-all duration-1000 ${getColor(level)}`}
                        style={{
                            transform: `rotate(${45 + (score * 1.8)}deg)`,
                            borderColor: 'currentColor'
                        }}
                    />
                </div>

                {/* Score Number */}
                <div className="absolute top-16 flex flex-col items-center">
                    <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-5xl font-black ${getColor(level)}`}
                    >
                        {score}
                    </motion.span>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Stress Index</span>
                </div>
            </div>

            {/* Status Message */}
            <div className={`p-4 rounded-2xl border flex gap-4 items-start ${getBgColor(level)}`}>
                <div className="shrink-0 mt-0.5">{getIcon(level)}</div>
                <div className="space-y-1">
                    <h4 className={`text-sm font-black uppercase tracking-tight ${getColor(level)}`}>
                        {level.toUpperCase()} PRESSURE
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-bold">
                        {message}
                    </p>
                </div>
            </div>

            {/* Factor Breakdown */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'EMI Load', value: factors.emiLoad },
                    { label: 'Fixed Ratio', value: factors.commitmentRatio },
                    { label: 'Volatility', value: factors.volatility },
                    { label: 'Cash Runway', value: factors.cashRunway }
                ].map((f) => (
                    <div key={f.label} className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{f.label}</span>
                        <div className="flex items-center justify-between">
                            <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden mr-3">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${f.value}%` }}
                                    className={`h-full ${f.value > 70 ? 'bg-rose-500' : f.value > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-white tabular-nums">{f.value}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
