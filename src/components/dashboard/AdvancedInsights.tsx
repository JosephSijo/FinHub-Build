import React, { useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar
} from 'recharts';
import { CircleDot, ShieldCheck, Zap, TrendingUp, AlertTriangle, ShieldAlert, TrendingDown, ChevronDown, Info } from 'lucide-react';
import { formatCurrency, formatFinancialValue } from '@/utils/numberFormat';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics } from '@/utils/haptics';
import { MeshBackground } from '../ui/MeshBackground';

import { Expense, Income, Account, Goal, Liability } from '@/types';
import { analyzeFinancialFreedom } from '@/utils/architect';

interface AdvancedInsightsProps {
    currency: string;
    expenses: Expense[];
    incomes: Income[];
    accounts: Account[];
    goals: Goal[];
    liabilities: Liability[];
    savingsRate: number;
    dtiRatio: number;
    outflowRatio: number;
    healthScore: number;
    userName?: string;
    investments?: any[];
}

const COLORS = ['#FF3B3B', '#3B82F6', '#A855F7', '#F59E0B'];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Normalizes a financial metric into a 0-100 score.
 * @param value The raw value (ratio or percentage)
 * @param benchmark The target threshold
 * @param inverted If higher value is worse (e.g. DTI)
 * @param hasData Flag to trigger pre-flight default
 */
const normalizeScore = (value: number, benchmark: number, inverted: boolean = false, hasData: boolean = true): number => {
    if (!hasData) return 50;

    let score: number;
    if (inverted) {
        // For inverted: 0 is perfect (100), benchmark or above is 0
        score = Math.max(0, 100 - (value / benchmark * 100));
    } else {
        // For normal: benchmark or above is 100
        score = Math.min(100, (value / benchmark * 100));
    }
    return Math.round(score);
};


export const AdvancedInsights: React.FC<AdvancedInsightsProps> = ({
    currency,
    expenses,
    incomes,
    accounts,
    goals,
    liabilities,
    savingsRate,
    dtiRatio,
    outflowRatio,
    healthScore,
    userName = "User",
    investments = []
}) => {

    const [expandedTrigger, setExpandedTrigger] = useState<string | null>(null);

    const {
        healthData,
        overallHealth,
        spendingData,
        peakCategory,
        peakPercentage,
        flowData,
        trendData,
        scoreDebt,
        totalSpent,
        totalIncome,
        scoreLeakage
    } = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const currentMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && !e.isInternalTransfer;
        });

        // Multi-Account Aggregate Rules
        const bankAccountIds = accounts.filter(a => a.type === 'bank').map(a => a.id);
        const spendAccountIds = accounts.filter(a => ['bank', 'cash', 'credit_card'].includes(a.type)).map(a => a.id);

        const totalIncome = incomes.filter(i => {
            const d = new Date(i.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && bankAccountIds.includes(i.accountId) && !i.isInternalTransfer;
        }).reduce((sum, i) => sum + i.amount, 0) || 1;

        const totalSpent = currentMonthExpenses.filter(e => spendAccountIds.includes(e.accountId)).reduce((sum, e) => sum + e.amount, 0);

        // 1. Flow & Trend Data
        const localFlowData = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            const m = d.getMonth();
            const y = d.getFullYear();

            const mIncome = incomes.filter(inc => {
                const id = new Date(inc.date);
                return id.getMonth() === m && id.getFullYear() === y && !inc.isInternalTransfer;
            }).reduce((sum, inc) => sum + inc.amount, 0);

            const mBurn = expenses.filter(exp => {
                const ed = new Date(exp.date);
                return ed.getMonth() === m && ed.getFullYear() === y && !exp.isInternalTransfer;
            }).reduce((sum, exp) => sum + exp.amount, 0);

            return {
                month: MONTH_NAMES[m],
                Fuel: mIncome,
                Burn: mBurn
            };
        });

        const localTrendData = localFlowData.map(f => ({ month: f.month, value: f.Burn }));

        // 2. Scoring Logic (Centralized Normalization)

        // Savings Score: 30% savings rate = 100
        const scoreSavings = normalizeScore(savingsRate, 30, false, incomes.length > 0);

        // Debt Score: 50% DTI = 0 (Lower is better)
        const scoreDebt = normalizeScore(dtiRatio, 0.50, true, accounts.some(a => a.type === 'credit_card') || dtiRatio > 0);

        // Outflow/Leakage Score: 100% Leakage = 0 (Lower is better, benchmark 70% for perfection)
        // Adjusting benchmark logic: at 0.7 ratio -> 100 score, at 1.0 ratio -> 0 score.
        // We can pass a custom ratio to normalizeScore or manually handle the 0.7 offset.
        const leakageValue = Math.max(0, outflowRatio - 0.7);
        const scoreLeakage = (totalIncome > 1 || totalSpent > 0)
            ? normalizeScore(leakageValue, 0.3, true, true)
            : 50;

        const scoreSpend = scoreLeakage;

        // Buffer/Velocity Scoring
        const currentM1 = accounts.filter(a => a.type === 'bank' || a.type === 'cash').reduce((sum, a) => sum + a.balance, 0);
        const currentVelocity = currentM1 > 0 ? (totalSpent / currentM1) : 0;

        let scoreBuffer = 50;
        if (currentM1 > 0 || totalSpent > 0) {
            // Benchmark is 1.0 (Liquid exhaustion). Velocity <= 0.3 is optimal (100).
            scoreBuffer = normalizeScore(currentVelocity, 1.0, true, true);
        }

        // Consistency Scoring
        const historicalBurn = localFlowData.map(f => f.Burn).filter(b => b > 0);
        let scoreConsistency = 50;
        if (historicalBurn.length > 1) {
            const avgBurn = historicalBurn.reduce((a, b) => a + b, 0) / historicalBurn.length;
            const variance = historicalBurn.reduce((a, b) => a + Math.pow(b - avgBurn, 2), 0) / historicalBurn.length;
            const stdDev = Math.sqrt(variance);
            const cv = stdDev / avgBurn;
            // CV 0 = Perfect (100), CV 0.5+ = Poor (0)
            scoreConsistency = normalizeScore(cv, 0.5, true, true);
        } else if (historicalBurn.length === 1) {
            scoreConsistency = 75;
        }

        const localHealthData = [
            { subject: 'Savings', A: scoreSavings, fullMark: 100 },
            { subject: 'Debt', A: scoreDebt, fullMark: 100 },
            { subject: 'Leakage', A: scoreSpend, fullMark: 100 },
            { subject: 'Buffer', A: scoreBuffer, fullMark: 100 },
            { subject: 'Cash Flow Speed', A: scoreConsistency, fullMark: 100 },
        ];

        const localOverallHealth = Math.round((scoreSavings + scoreDebt + scoreSpend + scoreBuffer + scoreConsistency) / 5);

        // 3. Spending Nodes
        const categoryTotals = currentMonthExpenses.reduce((acc: Record<string, number>, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});

        const localSpendingData = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 4);

        const localPeakCategory = localSpendingData[0]?.name || 'None';
        const localPeakPercentage = totalSpent > 0 ? Math.round((localSpendingData[0]?.value / totalSpent) * 100) : 0;

        return {
            healthData: localHealthData,
            overallHealth: localOverallHealth,
            spendingData: localSpendingData,
            peakCategory: localPeakCategory,
            peakPercentage: localPeakPercentage,
            flowData: localFlowData,
            trendData: localTrendData,
            scoreDebt,
            totalSpent,
            totalIncome,
            scoreLeakage
        };
    }, [expenses, incomes, accounts, savingsRate, dtiRatio, outflowRatio]);

    // Custom Chart Components
    const CustomTooltip = ({ active, payload, label }: any) => {
        const [lastLabel, setLastLabel] = React.useState<string | null>(null);

        React.useEffect(() => {
            if (active && label !== lastLabel) {
                Haptics.light();
                setLastLabel(label);
            }
        }, [active, label, lastLabel]);

        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1C1C1E] border border-white/5 p-3 squircle-12 shadow-2xl backdrop-blur-xl">
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">{label}</p>
                    <div className="space-y-1.5">
                        {payload.map((p: any, idx: number) => {
                            let colorClass = "text-slate-200";
                            const hex = p.color?.toUpperCase();
                            if (hex === '#FF3B3B') colorClass = "text-[#FF453A]";
                            else if (hex === '#3B82F6') colorClass = "text-[#0A84FF]";
                            else if (hex === '#A855F7') colorClass = "text-[#BF5AF2]";
                            else if (hex === '#F59E0B') colorClass = "text-[#FF9F0A]";
                            else if (hex === '#10B981') colorClass = "text-[#30D158]";
                            else if (p.name === 'Burn') colorClass = "text-slate-400";

                            return (
                                <div key={idx} className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{p.name}</span>
                                    <span className={`text-xs font-black tabular-nums ${colorClass}`}>
                                        {formatCurrency(p.value, currency)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="col-span-full mt-12 mb-4">
            {/* Section Header */}
            <div className="flex items-center gap-6 mb-10">
                <div className="h-px bg-white/5 flex-1"></div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">Antigravity Architect</span>
                <div className="h-px bg-white/5 flex-1"></div>
            </div>

            {/* Architect Strategic Card */}
            {(() => {
                const analysis = analyzeFinancialFreedom({
                    totalIncome: incomes.reduce((sum, i) => sum + i.amount, 0),
                    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
                    activeDebts: liabilities.length,
                    goalsCount: goals.length,
                    recentTransactions: [],
                    expenses,
                    incomes,
                    accounts,
                    investments,
                    liabilities,
                    goals,
                    savingsRate: savingsRate / 100,
                    healthScore: healthScore,
                    userName: userName
                });

                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`col-span-full mb-8 segmented-stack relative overflow-hidden ${analysis.alertColor === '#730800' ? 'garnet-alert border-2 shadow-2xl shadow-red-900/20 text-red-100' : 'mesh-gradient-card mesh-invest'}`}
                    >
                        {analysis.alertColor === '#730800' ? (
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#730800,transparent)]" />
                        ) : (
                            <MeshBackground variant="invest" />
                        )}
                        <div className="stack-cap flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-500/10 flex items-center justify-center rounded-lg border border-blue-500/20">
                                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-[10px] uppercase tracking-widest">{analysis.title}</h3>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Strategic Directive</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Current Protocol</p>
                                <span
                                    className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${analysis.alertColor === '#730800' ? 'garnet-pill' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}
                                >
                                    {analysis.priority === 3 ? 'GROWTH' : 'RECOVERY'}
                                </span>
                            </div>
                        </div>
                        <div className="stack-body px-8 py-6 relative z-10">
                            <p className="text-sm text-slate-300 font-medium leading-relaxed mb-6 italic opacity-90">
                                "{analysis.message}"
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">80/20 Sanity Allocation</span>
                                        <span className="text-[10px] font-bold text-blue-400">Tactical Balance</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-white/5 relative z-10">
                                        <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] w-[80%]" />
                                        <div className="h-full bg-emerald-400/50 w-[20%]" />
                                    </div>
                                    <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter">
                                        <span className="text-blue-400">80% Priority: {analysis.priority === 0 ? 'DEBT' : analysis.priority === 1 ? 'INSURANCE' : analysis.priority === 2 ? 'BUFFER' : 'GROWTH'}</span>
                                        <span className="text-emerald-400">20% Motivation: LEISURE</span>
                                    </div>

                                    {/* Real Freedom Honesty Check */}
                                    {analysis.realReturn && (
                                        <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between group overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            <div>
                                                <p className="text-[8px] text-emerald-500/60 uppercase font-black mb-0.5 tracking-widest">Real Freedom Yield</p>
                                                <p className="text-[10px] font-bold text-emerald-400 italic">
                                                    {analysis.realReturn.message}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-emerald-400">
                                                    +{(analysis.realReturn.value * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Next Milestone</p>
                                        <p className="text-xs font-bold text-white uppercase tracking-widest">{analysis.nextMilestone}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-amber-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Devil's Advocate Section */}
                            {analysis.tradeOff && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-8 pt-8 border-t border-white/5"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] font-black text-amber-400 uppercase tracking-tighter">
                                            Devil's Advocate
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trade-Off Analysis</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="group p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-help">
                                            <p className="text-[9px] text-slate-500 font-black uppercase mb-2">Option A: Acceleration</p>
                                            <p className="text-sm font-bold text-white">Save {analysis.tradeOff.timeSavedMonths} Months</p>
                                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed italic">
                                                By plugging the leak now, you reach {analysis.nextMilestone} significantly sooner.
                                            </p>
                                        </div>

                                        <div className="group p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-help">
                                            <p className="text-[9px] text-slate-500 font-black uppercase mb-2">Option B: Wealth Building</p>
                                            <p className="text-sm font-bold text-emerald-400">+{formatCurrency(analysis.tradeOff.potentialGrowthAmount, currency)} Potential</p>
                                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed italic">
                                                Investing this surplus instead could yield this growth over the same period.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                        <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                                            <ShieldCheck className="w-full h-full text-blue-400/50" />
                                        </div>
                                        <p className="text-[11px] text-slate-300 font-medium italic">
                                            "Architect's Note: {analysis.tradeOff.comparisonMessage}"
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Optimistic Pivot Actions */}
                            {analysis.pivotActions && analysis.pivotActions.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[8px] font-black text-red-400 uppercase tracking-tighter">
                                            Optimistic Pivot
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actionable Guidance</span>
                                    </div>
                                    <div className="space-y-3">
                                        {analysis.pivotActions.map((action, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                                                    {action}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}


                            {/* Strategic Triggers Session */}
                            {analysis.triggers && analysis.triggers.length > 0 && (
                                <div className="mt-8 space-y-3">
                                    {analysis.triggers.map((trigger) => (
                                        <motion.div
                                            key={trigger.id}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            onClick={() => setExpandedTrigger(expandedTrigger === trigger.id ? null : trigger.id)}
                                            className={`relative overflow-hidden p-5 rounded-2xl border transition-all cursor-pointer group ${trigger.id === 'safety_breach' ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15' :
                                                trigger.id === 'debt_spike' ? 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15' :
                                                    trigger.id === 'inflation_alert' ? 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15' :
                                                        trigger.severity === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                                            'bg-blue-500/10 border-blue-500/20'
                                                }`}
                                        >
                                            {/* Accent Gradient */}
                                            <div className={`absolute top-0 left-0 w-1 h-full ${trigger.id === 'safety_breach' ? 'bg-red-500' :
                                                trigger.id === 'debt_spike' ? 'bg-orange-500' :
                                                    trigger.id === 'inflation_alert' ? 'bg-indigo-500' :
                                                        'bg-slate-700'
                                                }`} />

                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={`p-2.5 rounded-xl ${trigger.id === 'safety_breach' ? 'bg-red-500/20 text-red-400' :
                                                    trigger.id === 'debt_spike' ? 'bg-orange-500/20 text-orange-400' :
                                                        trigger.id === 'inflation_alert' ? 'bg-indigo-500/20 text-indigo-400' :
                                                            trigger.severity === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {trigger.id === 'safety_breach' ? <ShieldAlert className="w-5 h-5" /> :
                                                        trigger.id === 'debt_spike' ? <Zap className="w-5 h-5" /> :
                                                            trigger.id === 'inflation_alert' ? <TrendingDown className="w-5 h-5" /> :
                                                                trigger.type === 'windfall' ? <TrendingUp className="w-5 h-5" /> :
                                                                    <AlertTriangle className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                                                            {trigger.title}
                                                        </h4>
                                                        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${expandedTrigger === trigger.id ? 'rotate-180' : ''}`} />
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                                        {trigger.message}
                                                    </p>

                                                    <AnimatePresence>
                                                        {expandedTrigger === trigger.id && trigger.explanation && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                        <Info className="w-3 h-3" />
                                                                        Architect's Logic
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-300 leading-relaxed italic pr-4">
                                                                        "{trigger.explanation}"
                                                                    </p>
                                                                    {trigger.actionLabel && (
                                                                        <button className={`mt-4 w-full py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${trigger.id === 'safety_breach' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                                                                            trigger.id === 'debt_spike' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                                                                                trigger.id === 'inflation_alert' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' :
                                                                                    'bg-slate-700 text-white'
                                                                            }`}>
                                                                            {trigger.actionLabel}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })()}

            <div className="flex items-center gap-6 mb-10">
                <div className="h-px bg-white/5 flex-1"></div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">Intelligence Center</span>
                <div className="h-px bg-white/5 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* 1. Health Score (Radar) */}
                <div className="segmented-stack mesh-ghost-blue relative">
                    <MeshBackground variant="ghost" />
                    <div className="stack-cap flex justify-between items-start border-white/5 relative z-10">
                        <div>
                            <h3 className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Financial Health</h3>
                            <div className="text-4xl font-black text-white">{overallHealth}<span className="text-sm text-slate-500 font-normal ml-2">/100</span></div>
                        </div>
                        <div className={`text-[9px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest ${overallHealth > 70 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                            {overallHealth > 70 ? 'Stable' : 'Warning'}
                        </div>
                    </div>
                    <div className="stack-body px-0 pt-8 pb-4 h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={healthData}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 900 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Health"
                                    dataKey="A"
                                    stroke="#00FF85"
                                    strokeWidth={2}
                                    fill="rgba(0, 255, 133, 0.15)"
                                    fillOpacity={0.3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Spending Nodes (Donut) */}
                <div className="segmented-stack mesh-ghost-blue relative">
                    <MeshBackground variant="ghost" />
                    <div className="stack-cap flex justify-between items-center border-white/5 relative z-10">
                        <div>
                            <h3 className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Spending Power</h3>
                            <div className="text-2xl font-black text-white">{peakCategory}</div>
                        </div>
                        <CircleDot className="text-slate-700 w-4 h-4" />
                    </div>
                    <div className="stack-body px-0 h-[240px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={spendingData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={62}
                                    outerRadius={82}
                                    paddingAngle={3}
                                    cornerRadius={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {spendingData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            style={{ filter: `drop-shadow(0 0 6px ${COLORS[index % COLORS.length]}88)` }}
                                            className="transition-all duration-500 hover:opacity-80"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Centered Label */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-[10px] text-slate-500 block font-bold">{peakPercentage}%</span>
                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block">BURN</span>
                        </div>
                    </div>
                    <div className="stack-footer py-4">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">High Power Node identified</span>
                            <span className="text-xs font-bold text-blue-400">{peakCategory}</span>
                        </div>
                    </div>
                </div>

                {/* 3. 6-Month Trend (Area) */}
                <div className="segmented-stack mesh-ghost-blue relative">
                    <MeshBackground variant="ghost" />
                    <div className="stack-cap border-white/5 relative z-10">
                        <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em]">Spending Power Trend</h3>
                    </div>
                    <div className="stack-body px-0 pb-0 h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
                                    </linearGradient>
                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <XAxis dataKey="month" hide />
                                <YAxis hide />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#0A84FF"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTrend)"
                                    animationDuration={1500}
                                    filter="url(#glow)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Income vs Spending (Bar) */}
                <div className="segmented-stack mesh-ghost-blue relative">
                    <MeshBackground variant="ghost" />
                    <div className="stack-cap flex justify-between items-center border-white/5 relative z-10">
                        <h3 className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">Flow Efficiency</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#30D158]" />
                                <span className="text-[8px] font-bold text-slate-500">FUEL</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#1C1C1E] border border-white/10" />
                                <span className="text-[8px] font-bold text-slate-500">BURN</span>
                            </div>
                        </div>
                    </div>
                    <div className="stack-body px-0 pb-0 h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={flowData} barGap={8} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#64748B', fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    content={<CustomTooltip />}
                                />
                                <Bar dataKey="Fuel" fill="#30D158" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="Burn" fill="#2C2C2E" radius={[4, 4, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. The Risk Meter (DTI) */}
                <div className="segmented-stack col-span-full mesh-ghost-blue relative min-h-[180px]">
                    <MeshBackground variant="ghost" />
                    {dtiRatio > 0 ? (
                        <>
                            <div className="stack-cap flex justify-between items-start border-white/5 relative z-10">
                                <div>
                                    <h3 className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">The Risk Meter (DTI)</h3>
                                    <div className="text-4xl font-black text-white">{(dtiRatio * 100).toFixed(1)}%<span className="text-sm text-slate-500 font-normal ml-2">Debt-to-Income</span></div>
                                </div>
                                <div className={`text-[9px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest ${dtiRatio < 0.20 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : dtiRatio < 0.40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                    {dtiRatio < 0.20 ? 'Safe' : dtiRatio < 0.40 ? 'Caution' : 'Danger'}
                                </div>
                            </div>

                            <div className="stack-body px-8 py-10">
                                <div className="space-y-6">
                                    <div className="relative h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                        {/* Color Gradient Track */}
                                        <div className="absolute inset-0 flex">
                                            <div className="h-full flex-1 bg-emerald-500/20" />
                                            <div className="h-full flex-1 bg-amber-500/20" />
                                            <div className="h-full flex-1 bg-rose-500/20" />
                                        </div>
                                        {/* Progress Fill */}
                                        <motion.div
                                            className={`absolute inset-y-0 left-0 ${dtiRatio < 0.20 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : dtiRatio < 0.40 ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (dtiRatio / 0.50) * 100)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <span className="text-[8px] text-slate-500 uppercase font-black block mb-1">Risk Score</span>
                                            <span className={`text-xl font-bold ${scoreDebt > 70 ? 'text-emerald-400' : scoreDebt > 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                {Math.round(scoreDebt)}/100
                                            </span>
                                        </div>
                                        <div className="text-center border-x border-white/5">
                                            <span className="text-[8px] text-slate-500 uppercase font-black block mb-1">Threshold</span>
                                            <span className="text-xl font-bold text-slate-200">50%</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[8px] text-slate-500 uppercase font-black block mb-1">Status</span>
                                            <span className={`text-xl font-bold ${dtiRatio < 0.36 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {dtiRatio < 0.36 ? 'Healthy' : 'Aggressive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="stack-footer">
                                <p className="text-[10px] text-slate-500 text-center italic">
                                    Protocol: A DTI below 36% is considered healthy for asset growth management.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
                            <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mb-3 border border-white/5">
                                <span className="text-xl">🛡️</span>
                            </div>
                            <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">System Scanning...</h3>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest max-w-[240px]">No Risk Detected</p>
                        </div>
                    )}
                </div>

                {/* 6. The Leakage Tracker (Outflow) */}
                <div className="segmented-stack col-span-full mesh-ghost-blue relative min-h-[180px]">
                    <MeshBackground variant="ghost" />
                    {(totalIncome > 1 || totalSpent > 0) ? (
                        <>
                            <div className="stack-cap flex justify-between items-start border-white/5 relative z-10">
                                <div>
                                    <h3 className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Leakage Tracker</h3>
                                    <div className="text-4xl font-black text-white">{(outflowRatio * 100).toFixed(1)}%<span className="text-sm text-slate-500 font-normal ml-2">Total Outflow</span></div>
                                </div>
                                <div className={`text-[9px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest ${outflowRatio <= 0.7 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : outflowRatio < 0.9 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                    {outflowRatio <= 0.70 ? 'Tight' : outflowRatio < 0.9 ? 'Loose' : 'Leakage'}
                                </div>
                            </div>

                            <div className="stack-body py-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-900 border border-white/5 rounded-xl">
                                                <span className="text-[8px] text-slate-500 uppercase font-black block mb-1">Monthly Inflow</span>
                                                <span className="text-sm font-bold text-emerald-400">{formatFinancialValue(totalIncome, currency)}</span>
                                            </div>
                                            <div className="p-4 bg-slate-900 border border-white/5 rounded-xl">
                                                <span className="text-[8px] text-slate-500 uppercase font-black block mb-1">Total Outflow</span>
                                                <span className="text-sm font-bold text-rose-400">{formatFinancialValue(totalSpent, currency)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[8px] text-slate-500 uppercase font-black">
                                                <span>Efficiency Status</span>
                                                <span className={scoreLeakage > 70 ? 'text-emerald-400' : 'text-amber-400'}>{scoreLeakage.toFixed(0)}/100</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                                <motion.div
                                                    className={`h-full ${scoreLeakage > 70 ? 'bg-emerald-500' : scoreLeakage > 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${scoreLeakage}%` }}
                                                    transition={{ duration: 1.5 }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Protocol Interpretation</h4>
                                        <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                            {outflowRatio <= 0.7
                                                ? "Perfect circulation. Your liquid accumulation (30%+) is optimal for future high-power asset allocation."
                                                : outflowRatio >= 1.0
                                                    ? "Critical Leakage. System is in absolute burn state. No liquid accumulation is occurring. Immediate consolidation needed."
                                                    : "Standard Circulation. System is functional, but efficiency can be increased by reducing non-essential burn categories."}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-1 bg-blue-500 rounded-full" />
                                            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Efficiency Benchmark: 70.0%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
                            <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mb-3 border border-white/5">
                                <span className="text-xl">💧</span>
                            </div>
                            <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">System Scanning...</h3>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest max-w-[240px]">No Risk Detected</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
