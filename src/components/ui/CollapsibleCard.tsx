import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Card } from './card';

interface CollapsibleCardProps {
    title: string;
    headerContent?: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
    title,
    headerContent,
    children,
    defaultExpanded = false,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <Card className={`overflow-hidden transition-all duration-300 bg-surface-card border-none shadow-sm ${className}`}>
            {/* Header Section - Always Visible */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer active:bg-surface-elevated/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col">
                    <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
                    {headerContent && (
                        <div className="mt-1">
                            {headerContent}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-elevated text-text-secondary">
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="px-4 pb-4 pt-0 border-t border-surface-elevated/50 mt-2">
                            <div className="pt-4">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};
