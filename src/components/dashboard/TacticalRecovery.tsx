import React from 'react';
import { Compass, Layers, FlaskConical } from 'lucide-react';
import { Liability } from '@/types';

interface TacticalRecoveryProps {
    liabilities: Liability[];
}

export const TacticalRecovery: React.FC<TacticalRecoveryProps> = ({ liabilities }) => {
    const [strategy, setStrategy] = React.useState<'avalanche' | 'snowball'>('avalanche');

    // Logic to sort based on strategy
    const sortedLiabilities = [...liabilities].sort((a, b) => {
        if (strategy === 'avalanche') return (b.interestRate || 0) - (a.interestRate || 0);
        return (a.outstanding || 0) - (b.outstanding || 0);
    });

    const targetLoan = sortedLiabilities[0];

    // Simple rule-of-thumb for "Future Money Saved"
    // Calc: (Balance * Rate * TenureFactor) -> illustrative estimate
    const estimatedSavings = targetLoan
        ? Math.round((targetLoan.outstanding * (targetLoan.interestRate / 100)) * 2.5)
        : 32400;

    if (liabilities.length === 0) return null;

    return (
        <div className="segmented-stack">
            {/* Sub-Component A (The Cap) */}
            <div className="stack-cap flex justify-between items-center border-t-2 border-blue-600/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                        <Compass className="text-blue-500 w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-white text-xs font-black uppercase tracking-[0.4em]">Your Payoff Path</h3>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                            Node: {strategy === 'avalanche' ? 'High Interest (Avalanche)' : 'Smallest Balance (Snowball)'}
                        </p>
                    </div>
                </div>
                <div className="bg-blue-600/20 text-blue-400 text-[8px] font-black px-4 py-2 rounded-full border border-blue-500/20 uppercase tracking-widest">Active Strategy</div>
            </div>

            <div className="stack-body py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <p className="text-sm text-slate-300 leading-relaxed font-light italic">
                            "Prioritizing your <span className="text-blue-400 font-bold">{targetLoan?.name}</span> {strategy === 'avalanche' ? 'rate' : 'balance'} node first will reclaim approximately <span className="text-emerald-400 font-bold">₹{estimatedSavings.toLocaleString()}</span> in future money supply."
                        </p>

                        {targetLoan && (
                            <div className="p-6 bg-slate-800 rounded-2xl border border-blue-500/20 relative overflow-hidden">
                                <span className="text-[8px] font-black text-slate-500 uppercase block mb-3 tracking-widest">Target Node</span>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-xl font-bold block text-white">{targetLoan.name}</span>
                                        <span className="text-[10px] text-red-400 font-black uppercase mt-1">
                                            {targetLoan.interestRate}% APR • {strategy === 'avalanche' ? 'Burn Heavy' : 'Low Friction'}
                                        </span>
                                    </div>
                                    <button className="bg-blue-600 text-white text-[10px] font-black px-6 py-3 rounded-xl shadow-xl shadow-blue-900/40 uppercase tracking-widest hover:bg-blue-500 transition-colors">
                                        PAY OFF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 flex flex-col justify-center">
                        <div
                            className={`flex items-center gap-5 group cursor-pointer p-4 rounded-xl transition-all ${strategy === 'snowball' ? 'bg-slate-800 border border-blue-500/30' : 'hover:bg-slate-800'}`}
                            onClick={() => setStrategy(strategy === 'avalanche' ? 'snowball' : 'avalanche')}
                        >
                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${strategy === 'snowball' ? 'border-blue-500' : 'border-white/10 group-hover:border-blue-500'}`}>
                                <Layers className={`w-4 h-4 transition-colors ${strategy === 'snowball' ? 'text-blue-500' : 'text-slate-600 group-hover:text-blue-500'}`} />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-200 block">
                                    {strategy === 'avalanche' ? 'Switch to Snowball Node' : 'Switch to Avalanche Node'}
                                </span>
                                <span className="text-[9px] text-slate-600 uppercase font-black tracking-tighter">
                                    {strategy === 'avalanche' ? 'Prioritize small balances for morale gains' : 'Prioritize high rates to minimize interest burn'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 group cursor-pointer p-4 hover:bg-slate-800 rounded-xl transition-all opacity-50">
                            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                                <FlaskConical className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-200 block">Simulation Sub-Routine</span>
                                <span className="text-[9px] text-slate-600 uppercase font-black tracking-tighter">Automated Debt Payoff Projections (Coming Soon)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
