import { IOUInstallment, InstallmentReminder, EMIPlanInput } from './types';

/**
 * Generate installment schedule from EMI plan
 */
export function generateInstallmentSchedule(
    iouId: string,
    userId: string,
    plan: EMIPlanInput
): Omit<IOUInstallment, 'id' | 'created_at'>[] {
    const installmentAmount = Math.round(plan.total_amount / plan.number_of_installments);
    const installments: Omit<IOUInstallment, 'id' | 'created_at'>[] = [];

    const firstDueDate = new Date(plan.first_due_date);

    for (let i = 0; i < plan.number_of_installments; i++) {
        const dueDate = new Date(firstDueDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        // Last installment gets any remainder
        const amount = i === plan.number_of_installments - 1
            ? plan.total_amount - (installmentAmount * (plan.number_of_installments - 1))
            : installmentAmount;

        installments.push({
            iou_id: iouId,
            user_id: userId,
            sequence_no: i + 1,
            due_date: dueDate.toISOString().split('T')[0],
            amount,
            status: 'PENDING'
        });
    }

    return installments;
}

/**
 * Get next unpaid installment for an IOU
 */
export function getNextDueInstallment(installments: IOUInstallment[]): IOUInstallment | null {
    const pending = installments
        .filter(i => i.status === 'PENDING')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    return pending.length > 0 ? pending[0] : null;
}

/**
 * Calculate days until due date
 */
function calculateDaysUntilDue(dueDate: string): number {
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
function getReminderPriority(daysUntilDue: number): 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | null {
    if (daysUntilDue < 0) return 'OVERDUE';
    if (daysUntilDue === 0) return 'DUE_TODAY';
    if (daysUntilDue <= 3) return 'DUE_SOON';
    return null;
}

/**
 * Format installment reminder message
 */
function formatInstallmentMessage(
    installment: IOUInstallment,
    personName: string,
    daysUntilDue: number,
    currency: string = '₹'
): string {
    const amount = `${currency}${Math.round(installment.amount)}`;

    if (daysUntilDue < 0) {
        const overdueDays = Math.abs(daysUntilDue);
        return `Collect installment ${installment.sequence_no} of ${amount} from ${personName} (${overdueDays} days overdue)`;
    }

    if (daysUntilDue === 0) {
        return `Collect installment ${installment.sequence_no} of ${amount} from ${personName} today`;
    }

    return `Collect installment ${installment.sequence_no} of ${amount} from ${personName} in ${daysUntilDue} days`;
}

/**
 * Calculate installment reminder with priority
 */
export function calculateInstallmentReminder(
    installment: IOUInstallment,
    personName: string,
    currency: string = '₹'
): InstallmentReminder | null {
    const daysUntilDue = calculateDaysUntilDue(installment.due_date);
    const priority = getReminderPriority(daysUntilDue);

    if (!priority) return null;

    return {
        installment,
        iou_person_name: personName,
        daysUntilDue,
        priority,
        message: formatInstallmentMessage(installment, personName, daysUntilDue, currency)
    };
}

/**
 * Get top installment reminder from all pending installments
 */
export function getTopInstallmentReminder(
    installments: IOUInstallment[],
    iouPersonNames: Map<string, string>,
    currency: string = '₹'
): InstallmentReminder | null {
    const pendingInstallments = installments.filter(i => i.status === 'PENDING');

    if (pendingInstallments.length === 0) return null;

    const reminders: InstallmentReminder[] = pendingInstallments
        .map(installment => {
            const personName = iouPersonNames.get(installment.iou_id) || 'Unknown';
            return calculateInstallmentReminder(installment, personName, currency);
        })
        .filter((r): r is InstallmentReminder => r !== null);

    if (reminders.length === 0) return null;

    // Sort by priority, then by amount
    const priorityOrder = { 'OVERDUE': 0, 'DUE_TODAY': 1, 'DUE_SOON': 2 };

    reminders.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        return b.installment.amount - a.installment.amount;
    });

    return reminders[0];
}

export const iouInstallmentsLogic = {
    generateInstallmentSchedule,
    getNextDueInstallment,
    calculateInstallmentReminder,
    getTopInstallmentReminder
};
