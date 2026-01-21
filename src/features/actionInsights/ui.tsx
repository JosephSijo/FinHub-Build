import React from 'react';
import { ActionInsight } from './types';

interface ActionInsightCardProps {
    insight: ActionInsight | null;
    onViewBudget: () => void;
    onAddIncome: () => void;
}

export const ActionInsightCard: React.FC<ActionInsightCardProps> = ({
    insight,
    onViewBudget,
    onAddIncome
}) => {
    if (!insight) return null;

    const severityColors = {
        low: 'from-blue-500/10 to-transparent border-blue-500/20 text-blue-400',
        medium: 'from-yellow-500/10 to-transparent border-yellow-500/20 text-yellow-400',
        high: 'from-orange-500/10 to-transparent border-orange-500/20 text-orange-400',
        critical: 'from-red-500/10 to-transparent border-red-500/20 text-red-400'
    };

    const iconColors = {
        low: 'text-blue-500',
        medium: 'text-yellow-500',
        high: 'text-orange-500',
        critical: 'text-red-500'
    };

    return (
        <div className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${severityColors[insight.severity]} p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50`}>
            {/* Subtle light effect */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

            <div className="relative flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/40 border border-white/5 ${iconColors[insight.severity]}`}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Action Intelligence</span>
                            <span className={`h-1 w-1 rounded-full ${insight.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-white">
                            {insight.message}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-14">
                    <button
                        onClick={onViewBudget}
                        className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/20 active:scale-95 border border-white/5"
                    >
                        View Budget
                    </button>
                    <button
                        onClick={onAddIncome}
                        className="rounded-xl bg-white text-black px-4 py-2 text-xs font-bold transition-all hover:bg-slate-200 active:scale-95 shadow-lg shadow-white/10"
                    >
                        Add Income
                    </button>
                </div>
            </div>
        </div>
    );
};
