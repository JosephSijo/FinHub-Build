import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Investment } from '../../types';

import { formatCurrency } from '../../utils/numberFormat';
import { Haptics } from '../../utils/haptics';
import React from 'react';

interface PortfolioAllocationChartProps {
    investments: Investment[];
    currency: string;
}

const COLORS = ['#0A84FF', '#64D2FF', '#007AFF', '#5E5CE6', '#BF5AF2', '#00B0FF', '#003366'];

export function PortfolioAllocationChart({ investments, currency }: PortfolioAllocationChartProps) {
    const allocationData = investments.map(inv => ({
        name: inv.symbol,
        value: (inv.currentPrice || 0) * inv.quantity
    }));

    // - [x] **Growth/Investment**: Implement "Cyber Electric" theme.
    // - [/] **Goals**: Implement "Emerald Victory" theme.
    const CustomTooltip = ({ active, payload }: any) => {
        React.useEffect(() => {
            if (active) Haptics.light();
        }, [active]);

        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1C1C1E] border border-white/5 p-3 squircle-12 shadow-2xl backdrop-blur-xl">
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">{payload[0].name}</p>
                    <p className="text-sm font-black text-white tabular-nums">
                        {formatCurrency(payload[0].value, currency)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-container-solid rounded-3xl p-6 relative overflow-hidden">
            <div className="chart-atmosphere bg-[#0A84FF]" />
            <div className="relative z-10">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6 px-2">Allocation Matrix</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={allocationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={75}
                                outerRadius={100}
                                paddingAngle={3}
                                cornerRadius={6}
                                stroke="none"
                                dataKey="value"
                            >
                                {allocationData.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        style={{ filter: `drop-shadow(0 0 6px ${COLORS[index % COLORS.length]}88)` }}
                                        className="transition-all duration-500 hover:opacity-80"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
