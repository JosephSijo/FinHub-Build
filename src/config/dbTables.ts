/**
 * Single source of truth for all database table names.
 * Use these constants instead of hardcoded strings.
 */
export const DB_TABLES = {
    // Core tables
    ACCOUNTS: 'accounts',
    TRANSACTIONS: 'transactions',
    CATEGORIES: 'categories',
    USER_PROFILE: 'user_profile',

    // Budget & Limits
    CATEGORY_LIMITS: 'category_limits',

    // Credit & Debt
    CREDIT_CARDS: 'credit_cards',
    LOANS: 'loans',

    // IOUs
    IOUS: 'ious',
    IOU_PAYMENTS: 'iou_payments',
    IOU_INSTALLMENTS: 'iou_installments',

    // Subscriptions
    SUBSCRIPTIONS: 'subscriptions',

    // Ledger & Investments
    LEDGER_ENTRIES: 'ledger_entries',
    INVESTMENTS: 'investments',
    FX_RATES: 'fx_rates',
    CURRENCIES: 'currencies',

    // Features
    KV_STORE: 'kv_store',
    SMART_SUGGESTIONS: 'smart_suggestions',
    FEE_RULES: 'fee_rules',
} as const;

export type TableName = typeof DB_TABLES[keyof typeof DB_TABLES];
