import React from 'react';
import { cn } from './utils';
import { LucideIcon } from 'lucide-react';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: LucideIcon;
    variant?: 'blue' | 'green' | 'purple' | 'rose';
    glow?: boolean;
}

export const CyberButton: React.FC<CyberButtonProps> = ({
    children,
    icon: Icon,
    variant = 'blue',
    glow = true,
    className,
    ...props
}) => {
    const variantStyles = {
        blue: 'border-blue-500/50 text-blue-400 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] shadow-[0_0_10px_rgba(59,130,246,0.2)]',
        green: 'border-emerald-500/50 text-emerald-400 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] shadow-[0_0_10px_rgba(16,185,129,0.2)]',
        purple: 'border-purple-500/50 text-purple-400 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] shadow-[0_0_10px_rgba(168,85,247,0.2)]',
        rose: 'border-rose-500/50 text-rose-400 hover:border-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    };

    return (
        <button
            className={cn(
                "relative group flex items-center justify-center gap-2 px-6 h-11",
                "bg-[#0A141E]/80 backdrop-blur-md border-2 rounded-2xl transition-all duration-300",
                "font-mono font-bold uppercase tracking-widest text-[10px]",
                "hover:scale-[1.02] active:scale-[0.98]",
                variantStyles[variant],
                className
            )}
            {...props}
        >
            {Icon && <Icon className="w-4 h-4 transition-all duration-700 ease-[cubic-bezier(0.2,1,0.3,1)] group-hover:rotate-[720deg] active:-rotate-12" />}
            <span>{children}</span>
        </button>
    );
};
