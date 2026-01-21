import { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    ReferenceLine,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency as globalFormatCurrency } from '../utils/numberFormat';
import { Haptics } from '../utils/haptics';
import React from 'react';

const WealthTooltip = ({ active, payload, label, currency }: any) => {
    const [lastLabel, setLastLabel] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (active && label !== lastLabel) {
            Haptics.light();
            setLastLabel(label);
        }
    }, [active, label, lastLabel]);

    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1C1C1E] border border-white/5 p-4 rounded-xl shadow-2xl backdrop-blur-xl min-w-[160px]">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-3 tracking-widest">Year {label}</p>
                <div className="space-y-3">
                    {payload.map((p: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">{p.name}</span>
                            <span className={`text-sm font-black tabular-nums ${p.name === 'Total Wealth' ? 'text-[#0A84FF]' : 'text-slate-200'}`}>
                                {globalFormatCurrency(p.value, currency)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export function WealthBuilderSimulator() {
    const { settings, liabilities } = useFinance();

    const avgDebtRate = useMemo(() => {
        const outstanding = liabilities.reduce((sum, l) => sum + (l.outstanding || 0), 0);
        const weightedInterestSum = liabilities.reduce((sum, l) => sum + ((l.interestRate || 0) * (l.outstanding || 0)), 0);
        return outstanding > 0 ? weightedInterestSum / outstanding : 0;
    }, [liabilities]);

    const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
    const [expectedReturn, setExpectedReturn] = useState(12); // 12% is typical for SIPs
    const [timePeriod, setTimePeriod] = useState(10); // Years

    const [chartData, setChartData] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        invested: 0,
        wealth: 0,
        returns: 0
    });

    const calculateWealth = React.useCallback(() => {
        const data = [];
        let currentWealth = 0;
        let totalInvested = 0;

        // Safety: Clamp inputs during calculation
        const safeInvestment = Math.max(0, monthlyInvestment);
        const safeReturn = Math.max(-0.9, expectedReturn / 100);
        const monthlyRate = safeReturn / 12;
        const safeYears = Math.min(100, timePeriod); // Cap at 100 years for math safety
        const months = safeYears * 12;

        for (let i = 1; i <= months; i++) {
            currentWealth = (currentWealth + safeInvestment) * (1 + monthlyRate);
            totalInvested += safeInvestment;

            // Safety: Break early if numbers become too large (e.g. Quadrillions)
            if (!Number.isFinite(currentWealth) || currentWealth > 1e18) {
                currentWealth = 1e18;
                break;
            }

            if (i % 12 === 0) { // Record yearly data points
                data.push({
                    year: i / 12,
                    invested: Math.round(totalInvested),
                    wealth: Math.round(currentWealth),
                    returns: Math.round(Math.max(0, currentWealth - totalInvested))
                });
            }
        }

        setChartData(data);
        setSummary({
            invested: totalInvested,
            wealth: currentWealth,
            returns: Math.max(0, currentWealth - totalInvested)
        });
    }, [monthlyInvestment, expectedReturn, timePeriod]);

    useEffect(() => {
        queueMicrotask(() => {
            calculateWealth();
        });
    }, [calculateWealth]);

    const formatValue = (value: number) => {
        return globalFormatCurrency(value, settings.currency, true);
    };

    return (
        <Card className="p-6 bg-black border border-white/5 shadow-xl rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-[#0A84FF]/10 rounded-xl flex items-center justify-center border border-[#0A84FF]/20">
                    <Sparkles className="w-7 h-7 text-[#0A84FF]" />
                </div>
                <div>
                    <h3 className="text-balance text-xl text-white">
                        Wealth Builder
                    </h3>
                    <p className="text-label text-[10px] opacity-60">
                        See how small investments grow into massive wealth
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Controls */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <Label htmlFor="monthly-investment" className="text-label text-[10px] opacity-60">Monthly Investment</Label>
                            <span className="text-balance text-xl text-[#0A84FF]">
                                {globalFormatCurrency(monthlyInvestment, settings.currency)}
                            </span>
                        </div>
                        <Slider
                            id="monthly-investment"
                            value={[monthlyInvestment]}
                            min={500}
                            max={100000}
                            step={500}
                            onValueChange={(val: number[]) => setMonthlyInvestment(val[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{globalFormatCurrency(500, settings.currency, true)}</span>
                            <span>{globalFormatCurrency(100000, settings.currency, true)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <Label htmlFor="expected-return" className="text-label text-[10px] opacity-60">Expected Return (Annually)</Label>
                            <span className="text-balance text-xl text-[#30D158]">
                                {expectedReturn}%
                            </span>
                        </div>
                        <Slider
                            id="expected-return"
                            value={[expectedReturn]}
                            min={4}
                            max={30}
                            step={0.5}
                            onValueChange={(val: number[]) => setExpectedReturn(val[0])}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>FD (6%)</span>
                            <span>Index (12%)</span>
                            <span>Small Cap (20%)</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <Label htmlFor="time-period" className="text-label text-[10px] opacity-60">Time Period</Label>
                            <span className="text-balance text-xl text-white">
                                {timePeriod} Years
                            </span>
                        </div>
                        <Slider
                            id="time-period"
                            value={[timePeriod]}
                            min={1}
                            max={50}
                            step={1}
                            onValueChange={(val: number[]) => setTimePeriod(val[0])}
                            className="py-2"
                        />
                    </div>

                    <Card className="p-6 bg-[#1C1C1E] border border-white/5 rounded-xl shadow-lg">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-label text-[10px] opacity-60 uppercase">Total Invested</span>
                                <span className="text-sm font-bold text-white">{formatValue(summary.invested)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#30D158] text-[10px] font-black uppercase flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3" /> Wealth Generated
                                </span>
                                <span className="text-lg font-black text-[#30D158]">
                                    {formatValue(summary.returns)}
                                </span>
                            </div>
                            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-label text-[10px] opacity-60 uppercase">Final Wealth</span>
                                <span className="text-2xl font-black text-[#0A84FF]">
                                    {formatValue(summary.wealth)}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Chart */}
                <div className="lg:col-span-8 min-h-[350px]">
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8E8E93" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#8E8E93" stopOpacity={0} />
                                </linearGradient>
                                <filter id="glow-wealth">
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <XAxis
                                dataKey="year"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#8E8E93', fontWeight: 700 }}
                            />
                            <YAxis hide />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                            <Tooltip
                                cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                content={(props) => <WealthTooltip {...props} currency={settings.currency} />}
                            />
                            <Area
                                type="monotone"
                                dataKey="wealth"
                                stroke="#0A84FF"
                                fillOpacity={1}
                                fill="url(#colorWealth)"
                                name="Total Wealth"
                                strokeWidth={4}
                                animationDuration={1500}
                                filter="url(#glow-wealth)"
                            />
                            <Area
                                type="monotone"
                                dataKey="invested"
                                stroke="#8E8E93"
                                fillOpacity={1}
                                fill="url(#colorInvested)"
                                name="Invested Amount"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>

                    <div className="mt-6 p-4 bg-[#30D158]/5 rounded-xl border border-[#30D158]/10 text-center space-y-3">
                        <p className="text-xs text-slate-300 leading-relaxed">
                            By investing <span className="text-white font-black">{globalFormatCurrency(monthlyInvestment, settings.currency)}</span> monthly for <span className="text-white font-black">{timePeriod} years</span> at <span className="text-[#30D158] font-black">{expectedReturn}%</span>,
                            you earn <span className="font-black text-[#30D158] text-lg">{formatValue(summary.returns)}</span> in pure profit! 🚀
                        </p>
                        {avgDebtRate > expectedReturn && (
                            <div className="pt-3 border-t border-rose-500/20">
                                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    <AlertTriangle className="w-3" /> Priority Alert: High Interest Cost
                                </p>
                                <p className="text-[9px] text-slate-500 mt-1">
                                    Your current debt (Avg. ~{avgDebtRate.toFixed(1)}%) is costing you more than you're earning here. Consider paying off debts first.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
