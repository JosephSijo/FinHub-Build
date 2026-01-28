import React from 'react';
import { Gauge } from 'lucide-react';
import { MeshBackground } from '@/components/ui/MeshBackground';

export interface SpendingEfficiencyProps {
    income: number;
    spending: number;
}

export const SpendingEfficiency: React.FC<SpendingEfficiencyProps> = ({ income, spending }) => {

    const ratio = income > 0 ? (spending / income) : 0;
    const percent = Math.round(ratio * 100);

    let status = 'Optimal';
    let color = 'text-emerald-400';
    let mesh = 'safe';

    if (percent > 90) {
        status = 'Critical Leak';
        color = 'text-rose-400';
        mesh = 'debt';
    } else if (percent > 70) {
        status = 'High Usage';
        color = 'text-amber-400';
        mesh = 'spending';
    }

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-full group">
            <MeshBackground variant={mesh as any} className="opacity-[0.05] group-hover:opacity-[0.1] transition-opacity" />

            <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="p-2 bg-slate-800/50 rounded-xl">
                    <Gauge className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Efficiency</h3>
            </div>

            <div className="relative z-10">
                <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-3xl font-black ${color}`}>{percent}%</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">of Income Spent</span>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${color} opacity-80`}>
                    {status}
                </div>
            </div>

            {/* Gauge Visual */}
            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden relative z-10">
                <div
                    className={`h-full rounded-full ${percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                />
            </div>
        </div>
    );
};
