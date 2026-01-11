import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/components/ui/utils';

export type TimeRange = 'this-month' | 'last-month' | 'last-3-months' | 'all';

interface TimeRangeFilterProps {
    selectedRange: TimeRange;
    onRangeChange: (range: TimeRange) => void;
}

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
    selectedRange,
    onRangeChange
}) => {
    const ranges: { id: TimeRange; label: string }[] = [
        { id: 'this-month', label: 'This Month' },
        { id: 'last-month', label: 'Last Month' },
        { id: 'last-3-months', label: '3 Months' },
        { id: 'all', label: 'All Time' }
    ];

    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide no-scrollbar">
            {ranges.map((range) => {
                const isSelected = selectedRange === range.id;
                return (
                    <button
                        key={range.id}
                        onClick={() => onRangeChange(range.id)}
                        className={cn(
                            "relative px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                            isSelected
                                ? "text-text-inverse"
                                : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                        )}
                    >
                        {isSelected && (
                            <motion.div
                                layoutId="activeTimeRange"
                                className="absolute inset-0 bg-text-primary rounded-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{range.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
