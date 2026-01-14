import React, { useState, useRef, useEffect } from 'react';
import { cn } from './utils';
import { formatCurrency, toShortScale } from '../../utils/numberFormat';
import { Haptics } from '../../utils/haptics';

interface InteractiveFinancialValueProps {
    value: number;
    currency: string;
    className?: string;
}

export const InteractiveFinancialValue: React.FC<InteractiveFinancialValueProps> = ({
    value,
    currency,
    className
}) => {
    const [isPressed, setIsPressed] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [anchoring, setAnchoring] = useState<'left' | 'right'>('right');
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const startLongPress = () => {
        setIsPressed(true);
        timerRef.current = setTimeout(() => {
            Haptics.medium();
            setShowTooltip(true);

            // Anchoring logic
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const screenWidth = window.innerWidth;
                // If element is in the right 40% of the screen, anchor tooltip to the left
                if (rect.left > screenWidth * 0.6) {
                    setAnchoring('left');
                } else {
                    setAnchoring('right');
                }
            }
        }, 500); // 500ms for long press
    };

    const endLongPress = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsPressed(false);
        setShowTooltip(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <span
            ref={containerRef}
            className="relative inline-block"
            onMouseDown={startLongPress}
            onMouseUp={endLongPress}
            onMouseLeave={endLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={endLongPress}
        >
            <span
                className={cn(
                    "cursor-pointer transition-all duration-200 select-none",
                    "border-b border-dotted border-[#38383A] font-mono tabular-nums leading-none inline-block font-extrabold",
                    "reset-text-fill",
                    isPressed && "scale-105",
                    className
                )}
            >
                {toShortScale(value, currency) || '0'}
            </span>

            {showTooltip && (
                <div
                    className={cn(
                        "absolute bottom-full mb-2 z-[300] whitespace-nowrap",
                        "px-4 py-2 rounded-xl text-xs font-black font-mono",
                        "bg-white/10 backdrop-blur-md border border-white/20",
                        "shadow-[0_8px_32px_rgba(0,0,0,0.8)]",
                        "animate-in fade-in zoom-in-95 duration-200",
                        anchoring === 'right' ? "left-0" : "right-0"
                    )}
                >
                    {formatCurrency(value, currency)}
                </div>
            )}
        </span>
    );
};
