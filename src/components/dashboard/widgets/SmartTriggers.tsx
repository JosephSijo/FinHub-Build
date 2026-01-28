import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Zap,
    TrendingDown,
    TrendingUp,
    ChevronDown,
    Bell,
    CheckCircle2
} from 'lucide-react';

export interface Trigger {
    id: string;
    title: string;
    message: string;
    type: 'critical' | 'optimization' | 'info';
    actionLabel?: string;
    onAction?: () => void;
}

export interface SmartTriggersProps {
    triggers: Trigger[];
}

export const SmartTriggers: React.FC<SmartTriggersProps> = ({ triggers }) => {
    const [showAll, setShowAll] = useState(false);

    // Group triggers
    const critical = triggers.filter(t => t.type === 'critical');
    const others = triggers.filter(t => t.type !== 'critical');

    // Decide what to show
    const displayTriggers = showAll ? [...critical, ...others] : critical;
    const hiddenCount = others.length;

    if (triggers.length === 0) return null;

    return (
        <div className="col-span-full space-y-4">

            {/* Header / Toggle */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${critical.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'}`} />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                        {critical.length > 0 ? 'Action Required' : 'System Status'}
                    </h3>
                </div>

                {hiddenCount > 0 && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                        {showAll ? 'Show Critical Only' : `View ${hiddenCount} More Signals`}
                        <ChevronDown className={`w-3 h-3 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            {/* Triggers List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {displayTriggers.map((trigger) => (
                        <motion.div
                            key={trigger.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${trigger.type === 'critical'
                                    ? 'bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10'
                                    : trigger.type === 'optimization'
                                        ? 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10'
                                        : 'bg-slate-800/50 border-white/5 hover:bg-slate-800/80'
                                }`}
                        >
                            <div className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${trigger.type === 'critical' ? 'bg-rose-500/10 text-rose-400' :
                                    trigger.type === 'optimization' ? 'bg-amber-500/10 text-amber-400' :
                                        'bg-blue-500/10 text-blue-400'
                                }`}>
                                {trigger.type === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
                                    trigger.type === 'optimization' ? <Zap className="w-4 h-4" /> :
                                        <Bell className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className={`text-xs font-black uppercase tracking-wide mb-1 ${trigger.type === 'critical' ? 'text-rose-200' :
                                            'text-slate-200'
                                        }`}>
                                        {trigger.title}
                                    </h4>
                                    {trigger.actionLabel && (
                                        <button
                                            onClick={trigger.onAction}
                                            className="text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                                        >
                                            {trigger.actionLabel}
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                    {trigger.message}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {displayTriggers.length === 0 && (
                    <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">All Systems Nominal</p>
                    </div>
                )}
            </div>
        </div>
    );
};
