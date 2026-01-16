import React from 'react';
import { AlertTriangle, Info, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Notification } from './types';

interface NotificationCardProps {
    notification: Notification;
    onAction?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onAction }) => {
    const getPriorityStyles = () => {
        switch (notification.priority) {
            case 'CRITICAL':
                return 'border-red-500/30 bg-red-500/10';
            case 'HIGH':
                return 'border-orange-500/30 bg-orange-500/10';
            case 'MEDIUM':
                return 'border-yellow-500/30 bg-yellow-500/10';
            case 'LOW':
                return 'border-blue-500/30 bg-blue-500/10';
            default:
                return 'border-white/10 bg-white/5';
        }
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'PAYMENT_RISK':
            case 'EMI_MISSED':
                return <AlertTriangle className="w-5 h-5 text-red-400" />;
            case 'BUDGET_OVERRUN':
                return <TrendingUp className="w-5 h-5 text-orange-400" />;
            case 'IOU_OVERDUE':
                return <Clock className="w-5 h-5 text-yellow-400" />;
            case 'FEE_LEAKAGE':
                return <DollarSign className="w-5 h-5 text-yellow-400" />;
            default:
                return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <div className={`rounded-2xl border p-4 ${getPriorityStyles()}`}>
            <div className="flex items-start gap-3">
                {getIcon()}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-relaxed mb-3">
                        {notification.message}
                    </p>
                    <button
                        onClick={onAction}
                        className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/20"
                    >
                        {notification.action.label}
                    </button>
                </div>
            </div>
        </div>
    );
};
