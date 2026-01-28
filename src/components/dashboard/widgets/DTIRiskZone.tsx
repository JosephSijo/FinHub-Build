import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { formatCurrency } from '@/utils/numberFormat';

export interface DTIRiskZoneProps {
    dtiRatio: number; // 0.0 to 1.0+
    totalDebt: number;
    currency: string;
}

export const DTIRiskZone: React.FC<DTIRiskZoneProps> = ({ dtiRatio, totalDebt, currency }) => {

    // Only show if DTI > 35% (0.35)
    if (dtiRatio <= 0.35) return null;

    const isCritical = dtiRatio > 0.50;

    return (
        <div className={`col-span-full p-4 rounded-2xl border flex items-center gap-4 ${isCritical ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            <div className={`p-3 rounded-xl ${isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                <AlertOctagon className="w-6 h-6" />
            </div>

            <div className="flex-1">
                <h4 className={`text-xs font-black uppercase tracking-widest ${isCritical ? 'text-rose-300' : 'text-amber-300'}`}>
                    High Debt Stress Detected
                </h4>
                <p className="text-xs text-slate-300 font-medium mt-1">
                    Your Debt-to-Income ratio is <span className="font-bold font-mono">{(dtiRatio * 100).toFixed(1)}%</span>.
                    Recommended limit is 35%.
                </p>
            </div>

            <div className="text-right hidden sm:block">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Exposure</p>
                <p className={`text-lg font-black font-mono ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
                    {formatCurrency(totalDebt, currency)}
                </p>
            </div>
        </div>
    );
};
