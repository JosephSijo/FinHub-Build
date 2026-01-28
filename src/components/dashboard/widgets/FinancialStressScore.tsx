import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ShieldCheck, AlertOctagon, TrendingUp, Wallet, Activity } from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface FinancialStressScoreProps {
    score: number; // 0-100
    metrics: {
        savings: number; // 0-100
        debt: number; // 0-100 (Where 0 is Good here? No, let's standardize: Higher Score = Better Health)
        efficiency: number; // 0-100
        buffer: number; // 0-100
        incomeStability: number; // 0-100
    };
    income: number;
}

export const FinancialStressScore: React.FC<FinancialStressScoreProps> = ({ score, metrics, income }) => {

    // Determine Status
    const getStatus = (s: number) => {
        if (s >= 80) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500' };
        if (s >= 60) return { label: 'Stable', color: 'text-blue-400', bg: 'bg-blue-500' };
        if (s >= 40) return { label: 'Strained', color: 'text-amber-400', bg: 'bg-amber-500' };
        return { label: 'Critical', color: 'text-rose-400', bg: 'bg-rose-500' };
    };

    const status = getStatus(score);

    // Data for the mini bar chart
    const data = [
        { name: 'Income', value: metrics.incomeStability, icon: Wallet },
        { name: 'Savings', value: metrics.savings, icon: TrendingUp },
        { name: 'Debt', value: metrics.debt, icon: ShieldCheck }, // Assuming standardized High = Good (Low Debt)
        { name: 'Buffer', value: metrics.buffer, icon: Activity },
        { name: 'Spend', value: metrics.efficiency, icon: AlertOctagon }, // Assumed High = Good Efficiency
    ];

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-full">

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Financial Health</h3>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black ${status.color}`}>{score}</span>
                        <span className={`text-sm font-bold uppercase tracking-wide ${status.color} opacity-80`}>{status.label}</span>
                    </div>
                </div>

                {/* Visual Circle Indicator */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="4"
                        />
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={score >= 80 ? '#34d399' : score >= 60 ? '#60a5fa' : score >= 40 ? '#fbbf24' : '#fb7185'}
                            strokeWidth="4"
                            strokeDasharray={`${score}, 100`}
                            className="drop-shadow-lg"
                        />
                    </svg>
                </div>
            </div>

            {/* Mini Bar Breakdown */}
            <div className="space-y-3">
                <div className="flex justify-between items-end h-[60px] px-2">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 group w-full">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative w-full flex justify-center h-full items-end cursor-help">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max(10, item.value)}%` }}
                                                className={`w-1.5 rounded-full transition-all duration-500 ${item.value >= 80 ? 'bg-emerald-500/80' :
                                                        item.value >= 50 ? 'bg-blue-500/80' :
                                                            item.value >= 30 ? 'bg-amber-500/80' : 'bg-rose-500/80'
                                                    } group-hover:scale-110 group-hover:brightness-125`}
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border border-white/10 text-xs font-bold">
                                        {item.name}: {item.value}/100
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <item.icon className="w-3 h-3 text-slate-600 group-hover:text-slate-300 transition-colors" />
                        </div>
                    ))}
                </div>

                {/* Income Warning */}
                {income === 0 && (
                    <div className="mt-4 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
                        <AlertOctagon className="w-3 h-3 text-rose-400" />
                        <p className="text-[9px] font-bold text-rose-300 uppercase tracking-wide">
                            Critical: Zero Income Detected
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
