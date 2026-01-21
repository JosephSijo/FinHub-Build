import { IOU, IOUPayment, IOUReminder, IOUStatus } from './types';

/**
 * Calculate outstanding amount for an IOU based on payments
 */
export function calculateOutstanding(principal: number, payments: IOUPayment[]): number {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, principal - totalPaid);
}

/**
 * Derive IOU status based on outstanding amount
 */
export function deriveStatus(principal: number, outstanding: number, hasPayments: boolean): IOUStatus {
    if (outstanding <= 0) return 'CLOSED';
    if (hasPayments && outstanding > 0) return 'PARTIAL';
    return 'OPEN';
}

/**
 * Calculate days until due date
 */
export function calculateDaysUntilDue(dueDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Get reminder priority based on days until due
 */
export function getReminderPriority(daysUntilDue: number): 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | null {
    if (daysUntilDue < 0) return 'OVERDUE';
    if (daysUntilDue === 0) return 'DUE_TODAY';
    if (daysUntilDue <= 3) return 'DUE_SOON';
    return null;
}

/**
 * Format reminder message based on IOU direction and days
 */
export function formatReminderMessage(iou: IOU, daysUntilDue: number, currency: string = '₹'): string {
    const amount = `${currency}${Math.round(iou.outstanding_amount)}`;
    const person = iou.person_name;

    if (daysUntilDue < 0) {
        const overdueDays = Math.abs(daysUntilDue);
        return iou.direction === 'LENT'
            ? `Collect ${amount} from ${person} (${overdueDays} days overdue)`
            : `Pay ${amount} to ${person} (${overdueDays} days overdue)`;
    }

    if (daysUntilDue === 0) {
        return iou.direction === 'LENT'
            ? `Collect ${amount} from ${person} today`
            : `Pay ${amount} to ${person} today`;
    }

    return iou.direction === 'LENT'
        ? `Collect ${amount} from ${person} in ${daysUntilDue} days`
        : `Pay ${amount} to ${person} in ${daysUntilDue} days`;
}

/**
 * Get the top reminder from a list of IOUs
 * Priority: Overdue > DueToday > DueSoon, then highest outstanding
 */
export function getTopReminder(ious: IOU[], currency: string = '₹'): IOUReminder | null {
    // Filter only active IOUs
    const activeIOUs = ious.filter(iou =>
        iou.status !== 'CLOSED' &&
        iou.status !== 'CANCELLED' &&
        iou.outstanding_amount > 0
    );

    if (activeIOUs.length === 0) return null;

    // Calculate reminders for all active IOUs
    const reminders: IOUReminder[] = activeIOUs
        .map(iou => {
            const daysUntilDue = calculateDaysUntilDue(iou.due_date);
            const priority = getReminderPriority(daysUntilDue);

            if (!priority) return null;

            return {
                iou,
                daysUntilDue,
                priority,
                message: formatReminderMessage(iou, daysUntilDue, currency)
            };
        })
        .filter((r): r is IOUReminder => r !== null);

    if (reminders.length === 0) return null;

    // Sort by priority, then by outstanding amount
    const priorityOrder = { 'OVERDUE': 0, 'DUE_TODAY': 1, 'DUE_SOON': 2 };

    reminders.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // If same priority, sort by outstanding amount (descending)
        return b.iou.outstanding_amount - a.iou.outstanding_amount;
    });

    return reminders[0];
}

export const iousLogic = {
    calculateOutstanding,
    deriveStatus,
    calculateDaysUntilDue,
    getReminderPriority,
    formatReminderMessage,
    getTopReminder
};
