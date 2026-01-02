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
                className="flex items-center justify-between cursor-pointer group/collapsible"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isOpen ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-500'}`}>
                        {icon}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover/collapsible:text-slate-200">
                            {title}
                        </span>
                        {subtitle && (
                            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">{subtitle}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {value && (
                        <span className={`text-sm font-bold tabular-nums ${valueColor}`}>
                            {value}
                        </span>
                    )}
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
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
