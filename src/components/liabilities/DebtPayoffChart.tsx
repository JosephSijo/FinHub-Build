
import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts';
import { formatCurrency } from '../../utils/numberFormat';
import { Haptics } from '../../utils/haptics';

interface ChartDataPoint {
    month: number;
    monthName: string;
    currentBalance: number;
    optimizedBalance: number;
}

interface DebtPayoffChartProps {
    data: ChartDataPoint[];
    currency: string;
}

export const DebtPayoffChart: React.FC<DebtPayoffChartProps> = React.memo(({ data, currency }) => {
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
                                <span className="text-xs font-black tabular-nums text-white">
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
        <div className="h-[300px] min-h-[300px] w-full mt-4 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8E8E93" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#8E8E93" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#30D158" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#30D158" stopOpacity={0} />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <XAxis
                        dataKey="monthName"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#64748B', fontWeight: 700 }}
                        interval="preserveStartEnd"
                        minTickGap={30}
                    />
                    <YAxis hide />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Legend
                        verticalAlign="top"
                        height={40}
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{value}</span>}
                    />
                    <Area
                        type="monotone"
                        dataKey="currentBalance"
                        name="Current Plan"
                        stroke="#8E8E93"
                        fillOpacity={1}
                        fill="url(#colorCurrent)"
                        strokeWidth={2}
                        animationDuration={1500}
                    />
                    <Area
                        type="monotone"
                        dataKey="optimizedBalance"
                        name="Optimized Plan"
                        stroke="#30D158"
                        fillOpacity={1}
                        fill="url(#colorOptimized)"
                        strokeWidth={3}
                        filter="url(#glow)"
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
});
