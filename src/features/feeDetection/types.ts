export type PaymentMethod = 'UPI' | 'CARD' | 'CASH' | 'BANK' | 'OTHER';
export type FeeSeverity = 'INFO' | 'WARN' | 'CRITICAL';

export interface FeeRule {
    id: string;
    user_id?: string;
    name: string;
    applies_payment_method: PaymentMethod;
    category_id?: string;
    merchant_keywords?: string[];
    note_keywords?: string[];
    estimated_fee_percent: number;
    severity: FeeSeverity;
    is_active: boolean;
    created_at: string;
}

export interface TransactionInput {
    amount: number;
    category_id?: string;
    payment_method?: PaymentMethod;
    merchant_name?: string;
    description?: string;
    external_service?: string;
}

export interface FeeAlert {
    severity: FeeSeverity;
    message: string;
    estimated_fee: number;
    rule_name: string;
}
