import React from 'react';
import { Target, AlertCircle } from 'lucide-react';

export interface GoalDriftProps {
    goals: {
        id: string;
        name: string;
        targetDate: string;
        status: 'on_track' | 'at_risk' | 'behind';
        driftMonths?: number;
    }[];
}

export const GoalDriftIndicator: React.FC<GoalDriftProps> = ({ goals }) => {

    const risks = goals.filter(g => g.status !== 'on_track');
    // If no risks, show the closest goal
    const displayGoals = risks.length > 0 ? risks : goals.slice(0, 1);

    if (displayGoals.length === 0) return null;

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-xl ${risks.length > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                    <Target className={`w-4 h-4 ${risks.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Goal Status</h3>
            </div>

            <div className="space-y-3">
                {displayGoals.map(goal => (
                    <div key={goal.id}>
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-bold text-white">{goal.name}</span>
                            {goal.status !== 'on_track' && (
                                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[9px] font-black text-rose-400 uppercase tracking-widest">
                                    {goal.driftMonths ? `${goal.driftMonths}mo Behind` : 'At Risk'}
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                            Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
