

import { CardPattern } from './CardPattern';

interface MeshBackgroundProps {
    variant?: 'spending' | 'savings' | 'debt' | 'invest' | 'ghost';
    className?: string;
}

export const MeshBackground = ({ variant, className = '' }: MeshBackgroundProps) => {
    const variantClass = variant === 'ghost' ? 'mesh-ghost-blue' : variant ? `mesh-${variant}` : '';

    return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden ${variantClass} ${className}`}>
            <CardPattern />

            {/* Readability Lock Overlay */}
            <div className="mesh-readability-lock" />

            {/* Shared Navy Base Highlights */}
            <div className="mesh-blob mesh-blob-base" />

            {/* Category Blobs */}
            <div className="mesh-blob mesh-blob-1" />
            <div className="mesh-blob mesh-blob-2" />
        </div>
    );
};
