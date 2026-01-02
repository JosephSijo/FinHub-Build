import { Card } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Investment } from '../../types';

import { formatCurrency } from '../../utils/numberFormat';
import { Haptics } from '../../utils/haptics';
import React from 'react';

interface PortfolioAllocationChartProps {
    investments: Investment[];
    currency: string;
}

const COLORS = ['#0A84FF', '#30D158', '#FF9F0A', '#FF453A', '#BF5AF2', '#64D2FF', '#FF375F'];

export function PortfolioAllocationChart({ investments, currency }: PortfolioAllocationChartProps) {
    const allocationData = investments.map(inv => ({
        name: inv.symbol,
        value: (inv.currentPrice || 0) * inv.quantity
    }));

    if (investments.length === 0) return null;

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
        <Card className="p-6 card-elite shadow-xl">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 px-2">Portfolio Allocation</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            stroke="none"
                            dataKey="value"
                        >
                            {allocationData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        </Card>
    );
}
