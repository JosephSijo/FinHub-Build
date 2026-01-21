/**
 * Single source of truth for all database table names.
 * Use these constants instead of hardcoded strings.
 */
export const DB_TABLES = {
    // Core tables
    ACCOUNTS: 'accounts',
    TRANSACTIONS: 'transactions',
    CATEGORIES: 'categories',

    // Budget & Limits
    CATEGORY_LIMITS: 'category_limits',

    // Credit & Debt
    CREDIT_CARDS: 'credit_cards',

    // IOUs
    IOUS: 'ious',
    IOU_PAYMENTS: 'iou_payments',
    IOU_INSTALLMENTS: 'iou_installments',

    // Features
    KV_STORE: 'kv_store',
    SMART_SUGGESTIONS: 'smart_suggestions',
    FEE_RULES: 'fee_rules',
} as const;

export type TableName = typeof DB_TABLES[keyof typeof DB_TABLES];
