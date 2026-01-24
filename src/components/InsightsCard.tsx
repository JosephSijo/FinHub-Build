
import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/numberFormat';
import { Haptics } from '../utils/haptics';

interface InsightsCardProps {
    monthlyData: {
        month: string;
        income: number;
        expenses: number;
        portfolioValue?: number;
    }[];
    spendingPercentage: number;
    totalIncome: number;
    totalExpenses: number;
    goals: any[];
    currency: string;
}

type TabType = 'flow' | 'budget' | 'growth';

export const InsightsCard: React.FC<InsightsCardProps> = ({
    monthlyData,
    spendingPercentage,
    totalIncome,
    totalExpenses,
    goals,
    currency
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('flow');

    const tabs: { id: TabType; label: string; hasAlert?: boolean }[] = [
        { id: 'flow', label: 'Flow' },
        { id: 'budget', label: 'Budget', hasAlert: spendingPercentage >= 90 },
        { id: 'growth', label: 'Growth' },
        { id: 'architect' as any, label: 'Architect' }
    ];

    // Colors
    const ACTIVE_COLOR = '#0A84FF'; // iOS Blue
    const ALERT_COLOR = '#FF453A';  // iOS Red
    const PRIMARY_LINE_COLOR = '#0A84FF';
    const SECONDARY_LINE_COLOR = '#30D158'; // iOS Green
    const TERTIARY_LINE_COLOR = '#FF453A';  // iOS Red
    const TEXT_ACTIVE = '#FFFFFF';
    const TEXT_INACTIVE = '#8E8E93'; // System Gray

    // Transform Data for Charts
    const flowChartData = monthlyData.map(d => ({
        name: d.month.split(' ')[0], // Condensed label (Jan, Feb)
        Income: d.income,
        Expenses: d.expenses
    }));

    // Mock Budget Trend (Projecting spending ratio over months)
    const budgetChartData = monthlyData.map(d => ({
        name: d.month.split(' ')[0],
        Actual: d.expenses,
        Budget: d.income * 0.8 // Assuming 80% budget rule for visualization
    }));

    // Growth Data (Real)
    const growthChartData = monthlyData.map(d => ({
        name: d.month.split(' ')[0],
        Value: d.portfolioValue || 0
    }));

    // Custom Tooltip
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
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">{entry.name}</span>
                                <span className={`text-xs font-black tabular-nums ${entry.color === '#0A84FF' ? 'text-[#0A84FF]' :
                                    entry.color === '#30D158' ? 'text-[#30D158]' :
                                        entry.color === '#FF9F0A' ? 'text-[#FF9F0A]' :
                                            'text-white'
                                    }`}>
                                    {formatCurrency(entry.value, currency)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="col-span-1 lg:col-span-2 h-[450px]">
            {/* Sub-Component A (The Cap) */}
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Intelligence
                    </h2>
                </div>

                {/* Segmented Control */}
                <div className="flex p-1 bg-white/5 rounded-xl self-start sm:self-auto border border-white/5">
                    {tabs.map((tab) => {
                        const tabProps = {
                            style: {
                                '--tab-bg': activeTab === tab.id ? ACTIVE_COLOR : 'transparent',
                                '--tab-text': activeTab === tab.id ? TEXT_ACTIVE : TEXT_INACTIVE
                            } as React.CSSProperties
                        };
                        const alertProps = {
                            style: { '--alert-color': ALERT_COLOR } as React.CSSProperties
                        };
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                    relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ease-out flex items-center gap-2
                    ${activeTab === tab.id ? 'shadow-sm' : 'hover:bg-white/5'}
                    bg-[var(--tab-bg)] text-[var(--tab-text)]
                  `}
                                {...tabProps}
                            >
                                {tab.label}
                                {tab.hasAlert && (
                                    <span className="w-1.5 h-1.5 rounded-full absolute top-1.5 right-1.5 bg-[var(--alert-color)]" {...alertProps} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </CardHeader>

            {/* Sub-Component B (The Body) */}
            <CardContent className="px-0 relative flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="h-full w-full"
                    >
                        {/* Dynamic Summary Text */}
                        <div className="px-6 mb-6">
                            {activeTab === 'flow' && (
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Net Flow Efficiency</p>
                                        <p className={`text-4xl font-black tabular-nums ${totalIncome - totalExpenses >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
                                            {formatCurrency(totalIncome - totalExpenses, currency)}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'budget' && (
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Budget Utilization</p>
                                        <p className={`text-4xl font-black tabular-nums ${spendingPercentage > 90 ? 'text-[#FF453A]' : 'text-white'}`}>
                                            {spendingPercentage.toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'growth' && (
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Valuation</p>
                                        <p className="text-4xl font-black tabular-nums text-blue-400">
                                            {formatCurrency(goals.reduce((acc, g) => acc + g.currentAmount, 0), currency)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Unified Line Chart */}
                        <div className="h-[240px] min-h-[240px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                                <LineChart
                                    data={
                                        activeTab === 'flow' ? flowChartData :
                                            activeTab === 'budget' ? budgetChartData :
                                                growthChartData
                                    }
                                    margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <filter id="glow-insights">
                                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#8E8E93', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />

                                    {activeTab === 'flow' && (
                                        <>
                                            <Line type="monotone" dataKey="Income" stroke={SECONDARY_LINE_COLOR} strokeWidth={3} dot={false} activeDot={{ r: 6 }} filter="url(#glow-insights)" />
                                            <Line type="monotone" dataKey="Expenses" stroke={TERTIARY_LINE_COLOR} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                        </>
                                    )}

                                    {activeTab === 'budget' && (
                                        <>
                                            <Line type="monotone" dataKey="Budget" stroke={SECONDARY_LINE_COLOR} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                            <Line type="monotone" dataKey="Actual" stroke={TERTIARY_LINE_COLOR} strokeWidth={3} dot={false} activeDot={{ r: 6 }} filter="url(#glow-insights)" />
                                        </>
                                    )}

                                    {activeTab === 'growth' && (
                                        <Line type="monotone" dataKey="Value" stroke={PRIMARY_LINE_COLOR} strokeWidth={3} dot={false} activeDot={{ r: 6 }} filter="url(#glow-insights)" />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};
