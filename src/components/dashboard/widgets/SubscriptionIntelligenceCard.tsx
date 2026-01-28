import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';

export interface SubscriptionIntelligenceProps {
    renewals: {
        id: string;
        name: string;
        amount: number;
        date: string;
        daysUntil: number;
    }[];
    totalMonthly: number;
}

export const SubscriptionIntelligenceCard: React.FC<SubscriptionIntelligenceProps> = ({ renewals, totalMonthly }) => {

    // Sort by soonest
    const upcoming = [...renewals].sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 2);

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <RotateCcw className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Upcoming Renewals</h3>
            </div>

            <div className="space-y-3">
                {upcoming.length === 0 ? (
                    <p className="text-xs text-slate-500 font-medium italic">No renewals in next 7 days.</p>
                ) : (
                    upcoming.map((sub) => (
                        <div key={sub.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <div>
                                <p className="text-xs font-bold text-slate-200">{sub.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                                    in {sub.daysUntil} days
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-mono font-bold text-slate-300">{sub.amount}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {upcoming.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Next Cancel Window: Jan 25
                    </p>
                </div>
            )}
        </div>
    );
};
