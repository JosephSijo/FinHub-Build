import { AlertCircle } from 'lucide-react';
import { RecurringTransaction } from '../types';

interface BillLateFlagProps {
    recurring: RecurringTransaction;
}

export function BillLateFlag({ recurring }: BillLateFlagProps) {
    if (recurring.kind !== 'bill' || !recurring.dueDay) return null;

    const today = new Date();
    const currentDay = today.getDate();

    // A bill is "late" if:
    // 1. Its kind is 'bill'
    // 2. The day of the month is past the due day
    // 3. (Optional improvement) We could check if a transaction for this month has already been generated
    // For now, let's stick to the day-based logic as requested.

    const isLate = currentDay > recurring.dueDay;

    if (!isLate) return null;

    return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertCircle className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-tighter">Late</span>
        </div>
    );
}
