import React from 'react';
import { Sparkles } from 'lucide-react';
import { MeshBackground } from '../ui/MeshBackground';

interface TruthBannerProps {
    message?: string;
    loading?: boolean;
    icon?: React.ReactNode;
}

export const TruthBanner: React.FC<TruthBannerProps> = React.memo(({ message, loading, icon }) => {
    return (
        <div className="col-span-full mesh-ghost-blue p-8 mb-8 relative group overflow-hidden sq-2xl">
            <MeshBackground variant="ghost" />
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 min-w-[56px] shadow-inner group-hover:scale-105 transition-transform duration-500">
                    {icon || <Sparkles className="text-indigo-400 w-6 h-6" />}
                </div>
                <div
                    id="truth-banner-content"
                    role="status"
                    aria-live="polite"
                    className="text-sm tracking-tight text-slate-300 font-bold italic leading-relaxed"
                >
                    {loading ? (
                        <span className="animate-pulse text-indigo-400">Analyzing your financial data...</span>
                    ) : (
                        message || "Insights Active. Analyzing your cash flow and spending habits..."
                    )}
                </div>
            </div>
        </div>
    );
});
