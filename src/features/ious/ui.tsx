import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { IOUReminder } from './types';

interface IOUReminderCardProps {
    reminder: IOUReminder;
    currency: string;
    onViewDetails?: () => void;
}

export const IOUReminderCard: React.FC<IOUReminderCardProps> = ({
    reminder,
    onViewDetails
}) => {
    const { iou, priority, message } = reminder;

    const getPriorityColor = () => {
        switch (priority) {
            case 'OVERDUE':
                return 'border-red-500/30 bg-red-500/5';
            case 'DUE_TODAY':
                return 'border-orange-500/30 bg-orange-500/5';
            case 'DUE_SOON':
                return 'border-yellow-500/30 bg-yellow-500/5';
            default:
                return 'border-white/10 bg-white/5';
        }
    };

    const getPriorityIcon = () => {
        if (priority === 'OVERDUE') {
            return <AlertCircle className="w-4 h-4 text-red-400" />;
        }
        return <Clock className="w-4 h-4 text-yellow-400" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-4 transition-all hover:bg-white/10 cursor-pointer ${getPriorityColor()}`}
            onClick={onViewDetails}
        >
            <div className="flex items-center gap-3">
                {getPriorityIcon()}
                <div className="flex-1">
                    <p className="text-sm font-medium text-white">{message}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                        {iou.direction === 'LENT' ? 'Money Lent' : 'Money Borrowed'}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
