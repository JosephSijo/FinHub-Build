export type InstallmentStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface IOUInstallment {
    id: string;
    iou_id: string;
    user_id: string;
    sequence_no: number;
    due_date: string; // ISO date string
    amount: number;
    status: InstallmentStatus;
    paid_on?: string; // ISO date string
    created_at: string;
}

export interface EMIPlanInput {
    person_name: string;
    contact_phone?: string;
    contact_tag?: string;
    total_amount: number;
    number_of_installments: number;
    first_due_date: string; // ISO date string
    notes?: string;
}

export interface InstallmentReminder {
    installment: IOUInstallment;
    iou_person_name: string;
    daysUntilDue: number;
    priority: 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON';
    message: string;
}
