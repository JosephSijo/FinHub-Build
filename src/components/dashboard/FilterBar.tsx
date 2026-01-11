import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface FilterBarProps {
    activeFilter?: string;
    onFilterChange?: (filter: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    activeFilter = 'This Month',
    onFilterChange
}) => {
    const filters = ['This Month', 'Last Month', 'All Time'];

    return (
        <div className="col-span-full flex flex-wrap gap-3 pb-4 no-scrollbar">
            {filters.map((filter) => (
                <button
                    key={filter}
                    onClick={() => onFilterChange?.(filter)}
                    className={cn(
                        "px-5 py-2.5 sq-md text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300",
                        activeFilter === filter
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                            : "bg-black border border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    )}
                >
                    {filter}
                </button>
            ))}

            <div className="relative">
                <input
                    id="filter-date-input"
                    name="date"
                    type="date"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    onChange={(e) => onFilterChange?.(`Date: ${e.target.value}`)}
                    aria-label="Choose date"
                />
                <button className="px-5 py-2.5 sq-md text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 bg-black border border-dashed border-white/20 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Query date
                </button>
            </div>
        </div>
    );
};
