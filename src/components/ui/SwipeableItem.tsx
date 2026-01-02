import React, { useRef, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Trash2, Pencil } from 'lucide-react';
import { Haptics } from '../../utils/haptics';
import { cn } from './utils';

interface SwipeableItemProps {
    children: React.ReactNode;
    onDelete: () => void;
    onEdit?: () => void;
    className?: string;
    isPendingDelete?: boolean;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
    children,
    onDelete,
    onEdit,
    className = "",
    isPendingDelete = false
}) => {
    const controls = useAnimation();
    const threshold = 100; // Drag threshold to trigger action
    const isActionTriggered = useRef(false);

    // Reset position when not in pending delete state (important for Undo)
    useEffect(() => {
        if (!isPendingDelete) {
            controls.set({ x: 0, opacity: 1 });
            isActionTriggered.current = false;
        }
    }, [isPendingDelete, controls]);

    const handleDragEnd = async (_: any, info: PanInfo) => {
        const x = info.offset.x;
        const springConfig = { type: "spring", stiffness: 600, damping: 40, mass: 0.8 } as const;

        if (x < -threshold) {
            // Swipe Left -> Delete
            isActionTriggered.current = true;
            Haptics.warning(); // Heavy haptic for delete
            // Slide away completely
            await controls.start({ x: -window.innerWidth, opacity: 0, transition: { duration: 0.3, ease: "easeOut" } });
            onDelete();
        } else if (x > threshold && onEdit) {
            // Swipe Right -> Edit
            isActionTriggered.current = true;
            Haptics.light(); // Light haptic for edit
            // Visual feedback: snap back after triggering
            await controls.start({ x: 0, transition: springConfig });
            onEdit();
            isActionTriggered.current = false;
        } else {
            // Reset position with rubber-band snap
            await controls.start({ x: 0, transition: springConfig });
        }
    };

    return (
        <motion.div
            initial={false}
            animate={{
                height: isPendingDelete ? 0 : 'auto',
                opacity: isPendingDelete ? 0 : 1,
                marginBottom: isPendingDelete ? 0 : 12,
                visibility: isPendingDelete ? 'hidden' : 'visible'
            }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className={cn("relative overflow-hidden squircle-22", className)}
        >
            {/* Background Action Layer */}
            {!isPendingDelete && (
                <div className="absolute inset-0 flex">
                    {/* Left Action (Reveal by Swipe Right) - Edit */}
                    <div
                        className={cn(
                            "flex-1 bg-[#FFB000] flex items-center justify-start pl-8",
                            !onEdit && "opacity-0"
                        )}
                    >
                        <Pencil className="text-white w-6 h-6" />
                    </div>

                    {/* Right Action (Reveal by Swipe Left) - Delete */}
                    <div className="flex-1 bg-[#FF4B4B] flex items-center justify-end pr-8">
                        <Trash2 className="text-white w-6 h-6" />
                    </div>
                </div>
            )}

            {/* Slide Layer */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -window.innerWidth, right: onEdit ? window.innerWidth : 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                animate={controls}
                initial={{ x: 0 }}
                className="relative z-10 bg-[#1C1C1E]"
                transition={{ type: "spring", stiffness: 600, damping: 40, mass: 0.8 }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
};
