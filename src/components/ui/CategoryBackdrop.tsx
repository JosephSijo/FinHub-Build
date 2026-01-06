import React from 'react';
import { motion } from 'framer-motion';

interface CategoryBackdropProps {
    variant: 'safe' | 'growth' | 'action';
    className?: string;
}

export const CategoryBackdrop: React.FC<CategoryBackdropProps> = ({ variant, className = '' }) => {
    const renderIcon = () => {
        switch (variant) {
            case 'safe':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                );
            case 'growth':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
                        <path d="M12 20V10M18 20V4M6 20v-4" />
                        <path d="M3 20h18" />
                    </svg>
                );
            case 'action':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const colors = {
        safe: 'text-blue-500/10',
        growth: 'text-purple-500/10',
        action: 'text-orange-500/10'
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute -right-8 -bottom-8 w-64 h-64 pointer-events-none ${colors[variant]} ${className}`}
        >
            {renderIcon()}
        </motion.div>
    );
};
