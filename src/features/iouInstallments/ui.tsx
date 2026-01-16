import React from 'react';
import { Calendar, IndianRupee } from 'lucide-react';
import { IOUInstallment, InstallmentReminder } from './types';

interface InstallmentScheduleListProps {
    installments: IOUInstallment[];
    currency: string;
    onMarkPaid?: (installmentId: string) => void;
}

export const InstallmentScheduleList: React.FC<InstallmentScheduleListProps> = ({
    installments,
    currency,
    onMarkPaid
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID':
                return 'text-emerald-400 bg-emerald-500/10';
            case 'PENDING':
                return 'text-yellow-400 bg-yellow-500/10';
            case 'CANCELLED':
                return 'text-slate-400 bg-slate-500/10';
            default:
                return 'text-white bg-white/10';
        }
    };

    return (
        <div className="space-y-3">
            {installments.map((installment) => (
                <div
                    key={installment.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">
                                #{installment.sequence_no}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${getStatusColor(installment.status)}`}>
                                {installment.status}
                            </span>
                        </div>
                        <span className="text-sm font-black text-white">
                            {formatCurrency(installment.amount)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {formatDate(installment.due_date)}</span>
                        {installment.paid_on && (
                            <span className="text-emerald-400">
                                • Paid: {formatDate(installment.paid_on)}
                            </span>
                        )}
                    </div>

                    {installment.status === 'PENDING' && onMarkPaid && (
                        <button
                            onClick={() => onMarkPaid(installment.id)}
                            className="mt-3 w-full rounded-xl bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500/30"
                        >
                            Mark as Paid
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

interface InstallmentReminderCardProps {
    reminder: InstallmentReminder;
    onViewDetails?: () => void;
}

export const InstallmentReminderCard: React.FC<InstallmentReminderCardProps> = ({
    reminder,
    onViewDetails
}) => {
    const getPriorityColor = () => {
        switch (reminder.priority) {
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

    return (
        <div
            className={`rounded-2xl border p-4 transition-all hover:bg-white/10 cursor-pointer ${getPriorityColor()}`}
            onClick={onViewDetails}
        >
            <div className="flex items-center gap-3">
                <IndianRupee className="w-4 h-4 text-yellow-400" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-white">{reminder.message}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                        Installment {reminder.installment.sequence_no}
                    </p>
                </div>
            </div>
        </div>
    );
};
