import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { FeeAlert } from './types';

interface FeeAlertBannerProps {
    alert: FeeAlert;
    className?: string;
}

export const FeeAlertBanner: React.FC<FeeAlertBannerProps> = ({ alert, className = '' }) => {
    const getSeverityStyles = () => {
        switch (alert.severity) {
            case 'CRITICAL':
                return 'border-red-500/30 bg-red-500/10 text-red-400';
            case 'WARN':
                return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
            case 'INFO':
                return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
            default:
                return 'border-white/10 bg-white/5 text-white';
        }
    };

    const getIcon = () => {
        if (alert.severity === 'CRITICAL' || alert.severity === 'WARN') {
            return <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
        }
        return <Info className="w-4 h-4 flex-shrink-0" />;
    };

    return (
        <div className={`rounded-xl border p-3 ${getSeverityStyles()} ${className}`}>
            <div className="flex items-start gap-2">
                {getIcon()}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-relaxed">
                        {alert.message}
                    </p>
                </div>
            </div>
        </div>
    );
};
