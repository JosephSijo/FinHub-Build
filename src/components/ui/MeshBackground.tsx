import { motion, Variants } from 'framer-motion';
import { CardPattern } from './CardPattern';

interface MeshBackgroundProps {
    variant?: 'spending' | 'savings' | 'debt' | 'invest' | 'ghost' | 'safe' | 'growth' | 'action';
    className?: string;
    animate?: boolean;
}

export const MeshBackground = ({ variant, className = '', animate = false }: MeshBackgroundProps) => {
    const variantClass = variant === 'ghost' ? 'mesh-ghost-blue' : variant ? `mesh-${variant}` : '';

    const blobVariants: Variants = {
        animate1: {
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.2, 0.8, 1],
            transition: {
                duration: 30,
                repeat: Infinity,
                ease: "linear"
            }
        },
        animate2: {
            x: [0, -30, 50, 0],
            y: [0, 40, -30, 0],
            scale: [1, 0.8, 1.2, 1],
            transition: {
                duration: 25,
                repeat: Infinity,
                ease: "linear"
            }
        },
        animate3: {
            x: [0, 20, -40, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.1, 0.9, 1],
            transition: {
                duration: 35,
                repeat: Infinity,
                ease: "linear"
            }
        }
    };

    return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden ${variantClass} ${className}`}>
            <CardPattern />

            {/* Readability Lock Overlay */}
            <div className="mesh-readability-lock" />

            {/* Shared Navy Base Highlights */}
            <div className="mesh-blob mesh-blob-base" />

            {/* Category Blobs */}
            <motion.div
                variants={blobVariants}
                animate={animate ? "animate1" : undefined}
                className="mesh-blob mesh-blob-1"
            />
            <motion.div
                variants={blobVariants}
                animate={animate ? "animate2" : undefined}
                className="mesh-blob mesh-blob-2"
            />
            <motion.div
                variants={blobVariants}
                animate={animate ? "animate3" : undefined}
                className="mesh-blob mesh-blob-3"
            />
        </div>
    );
};
