import React from 'react';
import { Sparkles } from 'lucide-react';

interface TruthBannerProps {
    message?: string;
    loading?: boolean;
}

export const TruthBanner: React.FC<TruthBannerProps> = ({ message, loading }) => {
    return (
        <div className="col-span-full card-elite p-8 border-l-4 border-indigo-500 bg-slate-900 mb-8 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 blur-[80px] opacity-10 -mr-16 -mt-16 group-hover:opacity-20 transition-opacity" />
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 min-w-[56px] shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <Sparkles className="text-indigo-400 w-6 h-6" />
                </div>
                <div id="truth-banner-content" className="text-sm tracking-tight text-slate-300 font-bold italic leading-relaxed">
                    {loading ? (
                        <span className="animate-pulse text-indigo-400">Initializing Intelligence Nodes...</span>
                    ) : (
                        message || "Intelligence Node Active. Analyzing Cash Flow Velocity and Expenditure Entropy..."
                    )}
                </div>
            </div>
        </div>
    );
};
