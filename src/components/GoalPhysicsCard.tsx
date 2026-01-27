import React from 'react';
import { Goal, Expense } from '../types';
import { analyzeGoalDrift } from '../utils/goalAnalytics';
import { formatCurrency } from '../utils/numberFormat';
import { AlertCircle, ArrowUpCircle, Calendar, Target, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface GoalPhysicsCardProps {
    goal: Goal;
    expenses: Expense[];
    currency: string;
    onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
}

export const GoalPhysicsCard: React.FC<GoalPhysicsCardProps> = ({
    goal,
    expenses,
    currency,
    onUpdateGoal
}) => {
    const analysis = analyzeGoalDrift(goal, expenses);

    if (!analysis || !analysis.isBehind) return null;

    const { adjustments, actualRate, requiredRate } = analysis;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-4"
        >
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-rose-400">Physics Alert: Behind Schedule</h5>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Your pace ({formatCurrency(actualRate, currency)}/mo) is insufficient.
                        To hit this target by {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'deadline'},
                        you need {formatCurrency(requiredRate, currency)}/mo.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">Adjustment Options</p>

                {/* Increase Savings */}
                <button
                    onClick={() => onUpdateGoal(goal.id, { monthly_contribution: adjustments.increaseSavings.newMonthly })}
                    className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all text-left group"
                >
                    <div className="flex items-center gap-3">
                        <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-emerald-400">Increase Savings</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Save {formatCurrency(adjustments.increaseSavings.extraNeeded, currency)} more each month</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 group-hover:translate-x-1 transition-transform">→</span>
                </button>

                {/* Extend Deadline */}
                <button
                    onClick={() => onUpdateGoal(goal.id, { targetDate: adjustments.extendDeadline.newDate })}
                    className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all text-left group"
                >
                    <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-blue-400">Extend Deadline</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Move target to {new Date(adjustments.extendDeadline.newDate).toLocaleDateString()} (+{adjustments.extendDeadline.monthsMore} mo)</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                </button>

                {/* Reduce Target */}
                <button
                    onClick={() => onUpdateGoal(goal.id, { targetAmount: adjustments.reduceTarget.newTarget })}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all text-left group"
                >
                    <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-amber-400" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-amber-400">Reduce Target</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Adjust total goal to {formatCurrency(adjustments.reduceTarget.newTarget, currency)}</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-amber-400 group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-rose-500/10">
                <Info className="w-3 h-3 text-slate-600" />
                <p className="text-[9px] text-slate-600 italic">No shame. Just physics.</p>
            </div>
        </motion.div>
    );
};
