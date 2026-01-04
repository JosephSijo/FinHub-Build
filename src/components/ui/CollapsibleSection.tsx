import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    value?: React.ReactNode;
    valueColor?: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    subtitle,
    icon,
    value,
    valueColor = "text-white",
    isOpen,
    onToggle,
    children,
    className = ""
}) => {
    return (
        <div className={`py-4 ${className}`}>
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={onToggle}
                className="flex sm:flex-row flex-col sm:items-center justify-between cursor-pointer group/collapsible gap-4"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${isOpen ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-500'}`}>
                        {icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover/collapsible:text-slate-200 truncate leading-tight font-sans">
                            {title}
                        </span>
                        {subtitle && (
                            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest truncate leading-tight font-sans">{subtitle}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 sm:ml-4 ml-11">
                    {value && (
                        <span className={`text-sm font-bold tabular-nums font-mono ${valueColor}`}>
                            {value}
                        </span>
                    )}
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                        className="sm:block hidden"
                    >
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                    </motion.div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
