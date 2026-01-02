import React, { useMemo } from 'react';
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
    Bar,
    CartesianGrid
} from 'recharts';
import { CircleDot } from 'lucide-react';
import { formatCurrency, formatFinancialValue } from '@/utils/numberFormat';
import { motion } from 'framer-motion';
import { Haptics } from '@/utils/haptics';

import { Expense, Income, Account } from '@/types';

interface AdvancedInsightsProps {
    currency: string;
    expenses: Expense[];
    incomes: Income[];
    accounts: Account[];
    savingsRate: number;
    dtiRatio: number;
    outflowRatio: number;
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
    savingsRate,
    dtiRatio,
    outflowRatio
}) => {

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
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">Intelligence Center</span>
                <div className="h-px bg-white/5 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* 1. Health Score (Radar) */}
                <div className="segmented-stack secondary-stealth">
                    <div className="stack-cap flex justify-between items-start border-white/5">
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
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 800 }} />
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
                <div className="segmented-stack secondary-stealth">
                    <div className="stack-cap flex justify-between items-center border-white/5">
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
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {spendingData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <div className="segmented-stack secondary-stealth">
                    <div className="stack-cap border-white/5">
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
                <div className="segmented-stack secondary-stealth">
                    <div className="stack-cap flex justify-between items-center border-white/5">
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
                <div className="segmented-stack col-span-full secondary-stealth">
                    <div className="stack-cap flex justify-between items-start border-white/5">
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
                </div>

                {/* 6. The Leakage Tracker (Outflow) */}
                <div className="segmented-stack col-span-full secondary-stealth">
                    <div className="stack-cap flex justify-between items-start border-white/5">
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
                </div>

            </div>
        </div>
    );
};
