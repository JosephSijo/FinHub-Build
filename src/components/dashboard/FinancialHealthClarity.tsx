import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowUpRight,
    ShieldCheck,
    Zap,
    Info,
} from 'lucide-react';
import { formatCurrency } from '@/utils/numberFormat';
import { MeshBackground } from '../ui/MeshBackground';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";

interface FinancialHealthClarityProps {
    income: number;
    fixedCosts: number;
    currency: string;
    bufferPercentage?: number;
}

export const FinancialHealthClarity: React.FC<FinancialHealthClarityProps> = ({
    income,
    fixedCosts,
    currency,
    bufferPercentage = 15
}) => {
    const bufferAmount = income * (bufferPercentage / 100);
    const safeToSpend = Math.max(0, income - fixedCosts - bufferAmount);

    // Calculate percentage of fixed costs relative to income
    const burnRate = income > 0 ? (fixedCosts / income) * 100 : 0;
    const bufferRate = income > 0 ? (bufferAmount / income) * 100 : 0;
    const safeRate = income > 0 ? (safeToSpend / income) * 100 : 0;

    return (
        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 px-4 sm:px-0">
            {/* Monthly Inflow Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden group bg-slate-900/40 border border-white/5 p-6 rounded-[32px] hover:bg-slate-900/60 transition-all duration-500"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ArrowUpRight className="w-12 h-12 text-emerald-400" />
                </div>

                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 font-mono">Monthly Inflow</p>
                    <div className="flex items-baseline gap-1">
                        <h2 className="text-3xl font-black text-white tabular-nums font-mono">
                            {formatCurrency(income, currency)}
                        </h2>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest">Active Commitment</p>
                    </div>
                </div>
            </motion.div>

            {/* Fixed Costs Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden group bg-slate-900/40 border border-white/5 p-6 rounded-[32px] hover:bg-slate-900/60 transition-all duration-500"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-12 h-12 text-rose-400" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">Commitment Burden</p>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger><Info className="w-3 h-3 text-slate-600" /></TooltipTrigger>
                                <TooltipContent className="bg-slate-950 border-white/10 p-3 sq-xl">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Includes Subscriptions, Monthly Bills & Loan EMIs</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <h2 className="text-3xl font-black text-rose-400 tabular-nums font-mono">
                        {formatCurrency(fixedCosts, currency)}
                    </h2>
                    <div className="mt-4 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, burnRate)}%` }}
                            className={`h-full ${burnRate > 50 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        />
                    </div>
                    <p className="mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        {burnRate.toFixed(0)}% of your income base
                    </p>
                </div>
            </motion.div>

            {/* Safe-to-Spend Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden group bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[32px] hover:bg-indigo-600/20 transition-all duration-500 shadow-2xl shadow-indigo-600/10"
            >
                <MeshBackground variant="safe" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 font-mono">Safe-to-Spend</p>
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-black text-white tabular-nums font-mono">
                        {formatCurrency(safeToSpend, currency)}
                    </h2>

                    <div className="mt-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">After {bufferPercentage}% Buffer</span>
                            <span className="text-indigo-400">-{formatCurrency(bufferAmount, currency)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                            <div
                                className="h-full bg-rose-500/50 border-r border-slate-950/20"
                                style={{ width: `${burnRate}%` }}
                            />
                            <div
                                className="h-full bg-amber-500/50 border-r border-slate-950/20"
                                style={{ width: `${bufferRate}%` }}
                            />
                            <div
                                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                style={{ width: `${safeRate}%` }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
