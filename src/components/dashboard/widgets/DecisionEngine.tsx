import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Zap,
    ArrowRight,
    HelpCircle,
    TrendingUp,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MeshBackground } from '@/components/ui/MeshBackground';

export interface DecisionEngineProps {
    analysis: {
        title: string;
        message: string;
        priority: number; // 0=Debts, 1=Security, 2=Savings, 3=Wealth
        alertColor?: string;
        pivotActions?: string[];
        tradeOff?: {
            comparisonMessage: string;
        };
    };
    onAction?: () => void;
}

export const DecisionEngine: React.FC<DecisionEngineProps> = ({ analysis, onAction }) => {
    const [showReasoning, setShowReasoning] = useState(false);

    // Determine primary icon and color theme based on priority
    const getTheme = () => {
        // High Alert / Debt
        if (analysis.priority === 0 || analysis.alertColor === '#730800') {
            return {
                icon: AlertTriangle,
                color: 'text-rose-400',
                bg: 'bg-rose-500/10',
                border: 'border-rose-500/20',
                mesh: 'debt',
                button: 'bg-rose-600 hover:bg-rose-500',
                accent: 'text-rose-500'
            };
        }
        // Security / Forecast
        if (analysis.priority === 1) {
            return {
                icon: ShieldCheck,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
                mesh: 'spending',
                button: 'bg-amber-600 hover:bg-amber-500',
                accent: 'text-amber-500'
            };
        }
        // Wealth / Savings
        return {
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            mesh: 'safe',
            button: 'bg-emerald-600 hover:bg-emerald-500',
            accent: 'text-emerald-500'
        };
    };

    const theme = getTheme();
    const Icon = theme.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`col-span-full relative overflow-hidden rounded-[2rem] border ${theme.border} bg-slate-950/50 shadow-2xl`}
        >
            <MeshBackground variant={analysis.priority > 0 ? (theme.mesh as any) : 'ghost'} animate className="opacity-10" />

            <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                {/* Main Content Area */}
                <div className="flex items-start gap-5 flex-1">
                    <div className={`w-14 h-14 rounded-2xl ${theme.bg} ${theme.border} border flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <Icon className={`w-7 h-7 ${theme.color}`} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-slate-900/50 ${theme.border} ${theme.color}`}>
                                Priority Action
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}'s Focus
                            </span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                            {analysis.title}
                        </h2>

                        <p className="text-sm font-medium text-slate-400 max-w-xl leading-relaxed">
                            {analysis.message}
                        </p>
                    </div>
                </div>

                {/* Actions Area */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <Button
                        onClick={() => setShowReasoning(!showReasoning)}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-400 hover:text-white hover:bg-white/5 uppercase tracking-wider font-bold w-full sm:w-auto"
                    >
                        <HelpCircle className="w-3.5 h-3.5 mr-2" />
                        {showReasoning ? "Hide Reasoning" : "Why this?"}
                    </Button>

                    <Button
                        onClick={onAction}
                        className={`${theme.button} text-white font-bold tracking-wide shadow-lg shadow-black/20 w-full sm:w-auto h-12 px-6 rounded-xl`}
                    >
                        Take Action
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

            {/* Expanded Reasoning Panel */}
            <AnimatePresence>
                {showReasoning && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-slate-900/40 relative z-10"
                    >
                        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Detailed Explanation */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    AI Logic Trace
                                </h4>
                                <p className="text-sm text-slate-300 leading-7 italic border-l-2 border-slate-700 pl-4">
                                    "{analysis.tradeOff?.comparisonMessage || "This action is prioritized to maximize your long-term financial stability based on your current cashflow and debt profile."}"
                                </p>
                            </div>

                            {/* Recommended Steps */}
                            {analysis.pivotActions && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        Recommended Steps
                                    </h4>
                                    <div className="space-y-2">
                                        {analysis.pivotActions.map((action, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${theme.bg.replace('/10', '')}`} />
                                                <span className="text-xs text-slate-200 font-medium">{action}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
