export type IOUDirection = 'LENT' | 'BORROWED';
export type IOUStatus = 'OPEN' | 'PARTIAL' | 'CLOSED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK' | 'CARD' | 'OTHER';

export interface IOU {
    id: string;
    user_id: string;
    direction: IOUDirection;
    person_name: string;
    contact_phone?: string;
    contact_tag?: string;
    principal_amount: number;
    outstanding_amount: number;
    due_date: string; // ISO date string
    status: IOUStatus;
    notes?: string;
    created_at: string;
}

export interface IOUPayment {
    id: string;
    iou_id: string;
    user_id: string;
    amount: number;
    paid_on: string; // ISO date string
    method: PaymentMethod;
    note?: string;
    created_at: string;
}

export interface IOUReminder {
    iou: IOU;
    daysUntilDue: number;
    priority: 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON';
    message: string;
}
