# Financial Hub v3.2 - Database Structure

**Project ID:** `kizvioibwffopuxqggxx`  
**Region:** us-east-1  
**Database Version:** PostgreSQL 17.6.1.014  
**Status:** ACTIVE_HEALTHY  
**Generated:** 2026-01-23

---

## Table of Contents

1. [currencies](#currencies)
2. [user_profile](#user_profile)
3. [fx_rates](#fx_rates)
4. [accounts](#accounts)
5. [credit_cards](#credit_cards)
6. [loans](#loans)
7. [subscriptions](#subscriptions)
8. [transactions](#transactions)
9. [ledger_entries](#ledger_entries)
10. [investments](#investments)
11. [goals](#goals)
12. [ious](#ious)
13. [iou_payments](#iou_payments)
14. [iou_installments](#iou_installments)
15. [categories](#categories)
16. [category_limits](#category_limits)
17. [smart_suggestions](#smart_suggestions)
18. [fee_rules](#fee_rules)
19. [kv_store](#kv_store)
20. [achievements](#achievements)
21. [user_achievements](#user_achievements)
22. [catalog_entities](#catalog_entities)
23. [user_catalog_links](#user_catalog_links)
24. [categorization_rules](#categorization_rules)
25. [recurring_transactions (VIEW)](#recurring_transactions-view)

---

## currencies

**Schema:** public  
**RLS Enabled:** No  
**Current Rows:** 6  
**Primary Key:** `code`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `code` | text | text | updatable | - | PRIMARY KEY |
| `name` | text | text | updatable | - | - |
| `symbol` | text | text | updatable | - | - |
| `minor_units` | integer | int4 | updatable | 2 | - |

### Foreign Key References (Referenced By)

- `user_profile.base_currency_code` → `currencies.code`
- `fx_rates.base_currency_code` → `currencies.code`
- `fx_rates.quote_currency_code` → `currencies.code`
- `accounts.currency_code` → `currencies.code`
- `credit_cards.currency_code` → `currencies.code`
- `loans.currency_code` → `currencies.code`
- `subscriptions.currency_code` → `currencies.code`
- `transactions.base_currency_code` → `currencies.code`
- `transactions.currency_code` → `currencies.code`

---

## user_profile

**Schema:** public  
**RLS Enabled:** No  
**Current Rows:** 3  
**Primary Key:** `user_id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `user_id` | text | text | updatable | - | PRIMARY KEY |
| `base_currency_code` | text | text | updatable | - | FOREIGN KEY → currencies.code |
| `display_mode` | text | text | updatable | 'HISTORICAL'::text | CHECK: display_mode IN ('HISTORICAL', 'TODAY') |
| `region_code` | text | text | nullable, updatable | - | - |
| `settings` | jsonb | jsonb | nullable, updatable | '{}'::jsonb | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Foreign Key Constraints

- `base_currency_code` → `currencies.code`

---

## fx_rates

**Schema:** public  
**RLS Enabled:** No  
**Current Rows:** 30  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `base_currency_code` | text | text | updatable | - | FOREIGN KEY → currencies.code |
| `quote_currency_code` | text | text | updatable | - | FOREIGN KEY → currencies.code |
| `rate` | numeric | numeric | updatable | - | - |
| `effective_date` | date | date | updatable | CURRENT_DATE | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Foreign Key Constraints

- `base_currency_code` → `currencies.code`
- `quote_currency_code` → `currencies.code`

---

## accounts

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** 11  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `name` | text | text | updatable | - | - |
| `type` | text | text | updatable | - | CHECK: type IN ('cash', 'bank', 'wallet', 'credit_card', 'investment', 'loan', 'other') |
| `currency_code` | text | text | updatable | 'INR'::text | FOREIGN KEY → currencies.code |
| `opening_balance` | numeric | numeric | updatable | 0 | - |
| `min_buffer` | numeric | numeric | updatable | 0 | - |
| `cached_balance` | numeric | numeric | updatable | 0 | Derived cache (truth is ledger_entries) |
| `is_active` | boolean | bool | updatable | true | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |
| `updated_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |
| `currency` | text | text | nullable, updatable | - | - |

### Foreign Key Constraints

- `currency_code` → `currencies.code`

### Foreign Key References (Referenced By)

- `credit_cards.account_id` → `accounts.id`
- `loans.account_id` → `accounts.id`
- `subscriptions.account_id` → `accounts.id`
- `transactions.account_id` → `accounts.id`
- `ledger_entries.account_id` → `accounts.id`
- `investments.account_id` → `accounts.id`

---

## credit_cards

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** 2  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `account_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → accounts.id |
| `card_name` | text | text | updatable | - | - |
| `last_four_digits` | text | text | nullable, updatable | - | - |
| `credit_limit` | numeric | numeric | updatable | 0 | - |
| `current_balance` | numeric | numeric | updatable | 0 | - |
| `currency_code` | text | text | updatable | 'INR'::text | FOREIGN KEY → currencies.code |
| `billing_cycle_day` | integer | int4 | nullable, updatable | 1 | CHECK: billing_cycle_day BETWEEN 1 AND 31 |
| `payment_due_day` | integer | int4 | nullable, updatable | 1 | CHECK: payment_due_day BETWEEN 1 AND 31 |
| `interest_rate` | numeric | numeric | nullable, updatable | 0 | - |
| `is_active` | boolean | bool | updatable | true | - |
| `catalog_entity_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → catalog_entities.id |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |
| `updated_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Foreign Key Constraints

- `account_id` → `accounts.id`
- `currency_code` → `currencies.code`

---

## loans

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** 0  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `account_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → accounts.id |
| `loan_name` | text | text | updatable | - | - |
| `loan_type` | text | text | updatable | - | CHECK: loan_type IN ('PERSONAL', 'HOME', 'AUTO', 'EDUCATION', 'BUSINESS', 'OTHER') |
| `principal` | numeric | numeric | updatable | 0 | - |
| `currency_code` | text | text | updatable | 'INR'::text | FOREIGN KEY → currencies.code |
| `interest_rate` | numeric | numeric | nullable, updatable | 0 | - |
| `emi_amount` | numeric | numeric | nullable, updatable | 0 | - |
| `emi_day` | integer | int4 | nullable, updatable | 1 | CHECK: emi_day BETWEEN 1 AND 31 |
| `catalog_entity_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → catalog_entities.id (SSOT for name/logo) |
| `description` | text | text | nullable, updatable | - | - |
| `loan_status` | text | text | updatable | 'active'::text | CHECK: loan_status IN ('active', 'paid_off', 'defaulted', 'refinanced') |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |
| `updated_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Foreign Key Constraints

- `account_id` → `accounts.id`
- `currency_code` → `currencies.code`

---

## subscriptions

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** 0  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `name` | text | text | updatable | - | - |
| `amount` | numeric | numeric | updatable | - | - |
| `currency_code` | text | text | updatable | - | FOREIGN KEY → currencies.code |
| `account_id` | uuid | uuid | updatable | - | FOREIGN KEY → accounts.id |
| `due_day` | smallint | int2 | updatable | - | - |
| `frequency` | text | text | updatable | - | - |
| `interval` | smallint | int2 | updatable | 1 | - |
| `start_date` | date | date | updatable | - | - |
| `end_date` | date | date | nullable, updatable | - | - |
| `status` | text | text | updatable | 'active'::text | - |
| `created_at` | timestamp with time zone | timestamptz | updatable | now() | - |
| `catalog_entity_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → catalog_entities.id |
| `logo_url` | text | text | nullable, updatable | - | - |
| `description` | text | text | nullable, updatable | - | - |
| `subscription_status` | text | text | updatable | 'active'::text | CHECK: status IN ('active', 'paused', 'cancelled', 'expired') |
| `cancellation_date` | date | date | nullable, updatable | - | - |
| `cancellation_reason` | text | text | nullable, updatable | - | - |
| `renewal_reminder_days` | integer | int4 | updatable | 7 | - |
| `auto_renew` | boolean | bool | updatable | true | - |
| `next_billing_date` | date | date | nullable, updatable | - | - |

### Foreign Key Constraints

- `account_id` → `accounts.id`
- `currency_code` → `currencies.code`
- `category_id` → `categories.id`

### Notes

- **Frequency values:** daily, weekly, monthly, quarterly, yearly (lowercase)
- **Type values:** expense, income
- **Kind values:** subscription, income
- Supports recurring transactions with flexible intervals and schedules

---

## transactions

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** 35  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `account_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → accounts.id |
| `type` | text | text | updatable | - | CHECK: type IN ('income', 'expense', 'transfer') |
| `amount` | numeric | numeric | updatable | 0 | - |
| `currency_code` | text | text | updatable | 'INR'::text | FOREIGN KEY → currencies.code |
| `base_currency_code` | text | text | updatable | - | FOREIGN KEY → currencies.code (NOT NULL) |
| `base_amount` | numeric | numeric | updatable | - | NOT NULL |
| `exchange_rate` | numeric | numeric | updatable | - | NOT NULL |
| `description` | text | text | nullable, updatable | - | - |
| `transaction_date` | date | date | updatable | CURRENT_DATE | NOT NULL |
| `fx_date` | date | date | updatable | - | NOT NULL |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | NOT NULL |
| `updated_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | NOT NULL |
| `tags` | ARRAY | _text | nullable, updatable | - | - |
| `catalog_entity_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → catalog_entities.id |
| `auto_categorized` | boolean | bool | updatable | false | - |
| `confidence_score` | numeric | numeric | nullable, updatable | - | - |

### Foreign Key Constraints

- `account_id` → `accounts.id`
- `currency_code` → `currencies.code`
- `base_currency_code` → `currencies.code`

### Foreign Key References (Referenced By)

- `ledger_entries.transaction_id` → `transactions.id`

---

## ledger_entries

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** 35  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `transaction_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → transactions.id |
| `account_id` | uuid | uuid | updatable | - | FOREIGN KEY → accounts.id |
| `direction` | text | text | nullable, updatable | - | - |
| `amount` | numeric | numeric | updatable | - | - |
| `transaction_date` | date | date | updatable | CURRENT_DATE | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |
| `currency_code` | text | text | nullable, updatable | 'INR'::text | - |
| `base_amount` | numeric | numeric | nullable, updatable | - | - |
| `note` | text | text | nullable, updatable | - | - |
| `metadata` | jsonb | jsonb | nullable, updatable | - | - |

### Constraints & Triggers

- **Check Constraint**: `direction IN ('IN', 'OUT')`
- **Balance Trigger**: `validate_ledger_balance` (AFTER INSERT/UPDATE) - Enforces `SUM(IN) = SUM(OUT)` per `transaction_id`.
- **System Balancing**: All Income/Expense transactions are balanced against a `System: Balancing` account.

### Foreign Key Constraints

- `transaction_id` → `transactions.id`
- `account_id` → `accounts.id`

### Notes

- **Direction values:** 'IN' (credit/money in), 'OUT' (debit/money out)
- Implements double-entry bookkeeping
- Each transaction creates corresponding ledger entries
- Account balances calculated from ledger entries

---

## investments

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** 0  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `name` | text | text | updatable | - | - |
| `type` | text | text | updatable | - | - |
| `symbol` | text | text | nullable, updatable | - | - |
| `quantity` | numeric | numeric | nullable, updatable | 0 | - |
| `current_value` | numeric | numeric | nullable, updatable | 0 | - |
| `currency_code` | text | text | nullable, updatable | 'INR'::text | - |
| `start_date` | date | date | nullable, updatable | CURRENT_DATE | - |
| `status` | text | text | nullable, updatable | 'active'::text | - |
| `note` | text | text | nullable, updatable | - | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |
| `account_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → accounts.id |

### Foreign Key Constraints

- `account_id` → `accounts.id`

---

## goals

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** 0  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `name` | text | text | updatable | - | - |
| `target_amount` | numeric | numeric | updatable | - | - |
| `current_amount` | numeric | numeric | nullable, updatable | 0 | - |
| `currency_code` | text | text | nullable, updatable | 'INR'::text | - |
| `deadline` | date | date | nullable, updatable | - | - |
| `category_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → categories.id |
| `status` | text | text | nullable, updatable | 'active'::text | CHECK: status IN ('active', 'completed', 'cancelled') |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Notes

- **Created:** 2026-01-23 (Migration: create_goals_table)
- **Purpose:** Track user financial goals with target amounts and deadlines
- **Status Values:** 
  - `active` - Goal is in progress
  - `completed` - Goal has been achieved
  - `cancelled` - Goal was abandoned
- User-specific goals for savings targets, debt payoff, or other financial objectives

---

## ious

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** Variable  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `direction` | text | text | updatable | - | CHECK: direction IN ('IN', 'OUT') |
| `person_name` | text | text | updatable | - | - |
| `principal_amount` | numeric | numeric | updatable | 0 | - |
| `outstanding_amount` | numeric | numeric | updatable | 0 | - |
| `due_date` | date | date | nullable, updatable | - | - |
| `account_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → accounts.id |
| `status` | text | text | updatable | 'OPEN'::text | CHECK: status IN ('OPEN', 'PAID', 'CLOSED', 'CANCELLED') |
| `notes` | text | text | nullable, updatable | - | - |
| `contact_phone` | text | text | nullable, updatable | - | - |
| `contact_tag` | text | text | nullable, updatable | - | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Foreign Key Constraints

- `account_id` → `accounts.id`

### Foreign Key References (Referenced By)

- `iou_payments.iou_id` → `ious.id`
- `iou_installments.iou_id` → `ious.id`

### Notes

- **Direction:** 'IN' = money owed to user (lent), 'OUT' = money user owes (borrowed)
- **Outstanding Amount:** Automatically calculated based on payments
- Used for tracking personal debts and loans between individuals

---

## iou_payments

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** Variable  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `iou_id` | uuid | uuid | updatable | - | FOREIGN KEY → ious.id |
| `amount` | numeric | numeric | updatable | 0 | - |
| `paid_on` | date | date | updatable | CURRENT_DATE | - |
| `account_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → accounts.id |
| `note` | text | text | nullable, updatable | - | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Foreign Key Constraints

- `iou_id` → `ious.id`
- `account_id` → `accounts.id`

### Notes

- Tracks individual payments made against an IOU
- Each payment reduces the `outstanding_amount` in the parent `ious` table

---

## iou_installments

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** Variable  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `iou_id` | uuid | uuid | updatable | - | FOREIGN KEY → ious.id |
| `installment_number` | integer | int4 | updatable | - | - |
| `amount` | numeric | numeric | updatable | 0 | - |
| `due_date` | date | date | updatable | - | - |
| `status` | text | text | updatable | 'PENDING'::text | CHECK: status IN ('PENDING', 'PAID', 'OVERDUE') |
| `paid_on` | date | date | nullable, updatable | - | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Foreign Key Constraints

- `iou_id` → `ious.id`

### Notes

- Supports installment-based repayment plans for IOUs
- Tracks scheduled payments with due dates and status

---

## categories

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** Variable  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | nullable, updatable | - | - |
| `name` | text | text | updatable | - | UNIQUE(user_id, lower(trim(name)), type) |
| `type` | text | text | updatable | - | CHECK: type IN ('expense', 'income') |
| `catalog_entity_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → catalog_entities.id |
| `is_system` | boolean | bool | updatable | false | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Foreign Key References (Referenced By)

- `transactions.category_id` → `categories.id`
- `category_limits.category_id` → `categories.id`

### Notes

- Auto-created when users enter new category names in transactions
- User-specific categories for organizing income and expenses

---

## category_limits

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** Variable  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `category_id` | uuid | uuid | updatable | - | FOREIGN KEY → categories.id |
| `period` | text (enum) | budget_period | updatable | 'monthly'::budget_period | - |
| `limit_amount` | numeric | numeric | updatable | - | - |
| `warn_at_percent` | integer | int4 | updatable | 80 | - |
| `critical_at_percent` | integer | int4 | updatable | 100 | - |
| `auto_calculated` | boolean | bool | updatable | true | - |
| `calculation_version` | text | text | updatable | 'v1.1'::text | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |
| `updated_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Foreign Key Constraints

- `category_id` → `categories.id`

### Notes

- Implements budget limits for spending categories
- Supports auto-calculated limits based on spending patterns
- Warning thresholds trigger notifications when approaching limits

---

## smart_suggestions

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** Variable  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | nullable, updatable | - | - |
| `type` | text | text | updatable | - | - |
| `title` | text | text | updatable | - | - |
| `message` | text | text | updatable | - | - |
| `severity` | text | text | updatable | 'low'::text | CHECK: severity IN ('low', 'medium', 'high') |
| `action` | jsonb | jsonb | updatable | '{}'::jsonb | - |
| `source` | text | text | updatable | 'rule'::text | - |
| `status` | text | text | updatable | 'new'::text | CHECK: status IN ('new', 'viewed', 'accepted', 'dismissed') |
| `catalog_entity_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → catalog_entities.id |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |
| `expires_at` | timestamp with time zone | timestamptz | nullable, updatable | - | - |

### Notes

- AI-powered financial suggestions and insights
- Supports actionable recommendations with JSON-encoded actions
- Time-limited suggestions with expiration dates

---

## fee_rules

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** Variable  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `rule_name` | text | text | updatable | - | - |
| `pattern` | text | text | updatable | - | - |
| `pattern_type` | text | text | updatable | 'keyword'::text | CHECK: pattern_type IN ('keyword', 'regex') |
| `fee_category` | text | text | nullable, updatable | - | - |
| `is_active` | boolean | bool | updatable | true | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |
| `updated_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Notes

- Detects and categorizes fees in transactions
- Supports keyword and regex pattern matching
- User-customizable rules for fee identification

---

---

## achievements

**Schema:** public  
**RLS Enabled:** Yes  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `name` | text | text | updatable | - | UNIQUE |
| `description` | text | text | updatable | - | - |
| `logo_url` | text | text | nullable, updatable | - | - |
| `achievement_type` | text | text | updatable | - | CHECK: achievement_type IN ('streak', 'count', 'milestone', 'financial_health') |
| `criteria` | jsonb | jsonb | updatable | - | - |
| `points` | integer | int4 | updatable | 0 | - |
| `tier` | text | text | updatable | 'bronze'::text | CHECK: tier IN ('bronze', 'silver', 'gold', 'platinum') |
| `is_active` | boolean | bool | updatable | true | - |
| `created_at` | timestamp with time zone | timestamptz | updatable | now() | - |

---

## user_achievements

**Schema:** public  
**RLS Enabled:** Yes  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `achievement_id` | uuid | uuid | updatable | - | FOREIGN KEY → achievements.id |
| `unlocked_at` | timestamp with time zone | timestamptz | updatable | now() | - |
| `progress` | jsonb | jsonb | nullable, updatable | '{}'::jsonb | - |
| `notified` | boolean | bool | updatable | false | - |
| `shared_at` | timestamp with time zone | timestamptz | nullable, updatable | - | - |
| `share_count` | integer | int4 | updatable | 0 | - |

---

## catalog_entities

**Schema:** public  
**RLS Enabled:** Yes (Read-only for users)  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `kind` | text | text | updatable | - | CHECK: kind IN ('bank', 'subscription', 'credit_card', 'merchant', 'category', 'service', 'loan') |
| `name` | text | text | updatable | - | - |
| `normalized_name` | text | text | nullable, updatable | - | - |
| `icon_key` | text | text | nullable, updatable | - | - |
| `logo_url` | text | text | nullable, updatable | - | - |
| `country_code` | text | text | updatable | - | - |
| `region_code` | text | text | nullable, updatable | - | - |
| `is_global` | boolean | bool | updatable | false | - |
| `status` | text | text | nullable, updatable | 'active'::text | - |
| `metadata` | jsonb | jsonb | nullable, updatable | '{}'::jsonb | - |

---

## user_catalog_links

**Schema:** public  
**RLS Enabled:** Yes  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | updatable | - | - |
| `catalog_id` | uuid | uuid | updatable | - | FOREIGN KEY → catalog_entities.id |
| `entity_type` | text | text | updatable | - | - |
| `entity_id` | uuid | uuid | updatable | - | - |
| `confidence` | numeric | numeric | nullable, updatable | - | - |
| `created_at` | timestamp with time zone | timestamptz | updatable | now() | - |

---

## categorization_rules

**Schema:** public  
**RLS Enabled:** Yes  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `user_id` | text | text | nullable, updatable | - | - |
| `pattern` | text | text | updatable | - | - |
| `pattern_type` | text | text | updatable | - | CHECK: pattern_type IN ('keyword', 'regex', 'exact') |
| `category_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → categories.id |
| `catalog_entity_id` | uuid | uuid | nullable, updatable | - | FOREIGN KEY → catalog_entities.id |
| `tags` | ARRAY | _text | nullable, updatable | '{}'::text[] | - |
| `priority` | integer | int4 | updatable | 0 | - |
| `is_active` | boolean | bool | updatable | true | - |

---

## recurring_transactions (VIEW)

**Description:** Unified view of active subscriptions and loans.

### Columns (Dynamic)
- `recurring_type` ('subscription', 'loan')
- `name`
- `amount`
- `currency_code`
- `frequency`
- `next_date`
- `logo_url`
- `status`
- `status`
- `account_id`

---

## kv_store

**Schema:** public  
**RLS Enabled:** Yes  
**Current Rows:** Variable  
**Primary Key:** `id`

### Columns

| Column Name | Data Type | Format | Options | Default Value | Constraints |
|------------|-----------|--------|---------|---------------|-------------|
| `id` | uuid | uuid | updatable | gen_random_uuid() | PRIMARY KEY |
| `key` | text | text | updatable | - | UNIQUE |
| `value` | jsonb | jsonb | updatable | - | - |
| `user_id` | text | text | nullable, updatable | - | - |
| `created_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |
| `updated_at` | timestamp with time zone | timestamptz | nullable, updatable | now() | - |

### Notes

- General-purpose key-value storage for application state
- Supports both user-specific and global key-value pairs
- JSON values allow flexible data structures

---



## Database Relationships Overview

### Core Reference Data
- **currencies** - Central reference table for all currency codes (ISO 4217)

### User & Configuration
- **user_profile** - User preferences and base currency settings

### Financial Instruments
- **accounts** - Core account management (cash, bank, credit card, investment, loan)
- **credit_cards** - Credit card specific details
- **loans** - Loan tracking and EMI management
- **investments** - Investment portfolio tracking
- **subscriptions** - Recurring subscription management

### Transactions & Ledger
- **transactions** - All financial transactions (income, expense, transfer)
- **ledger_entries** - Double-entry bookkeeping ledger (debits/credits)
- **categories** - User-defined transaction categories

### IOUs & Debt Tracking
- **ious** - Personal debts and loans between individuals
- **iou_payments** - Payment history for IOUs
- **iou_installments** - Scheduled installment plans for IOUs

### Budgeting & Limits
- **category_limits** - Budget limits per spending category

### AI & Intelligence
- **smart_suggestions** - AI-powered financial insights and recommendations
- **fee_rules** - Pattern-based fee detection rules

### System & Storage
- **kv_store** - General-purpose key-value storage for application state

### Exchange Rates
- **fx_rates** - Foreign exchange rates for multi-currency support

---

## Key Design Patterns

### Multi-Currency Support
- All monetary tables reference `currencies.code`
- Transactions store both original currency and base currency amounts
- Exchange rates tracked in `fx_rates` table

### Double-Entry Bookkeeping
- `ledger_entries` implements double-entry accounting
- Each transaction creates corresponding debit/credit entries
- Ensures account balances remain accurate

### Row-Level Security (RLS)
- Enabled on: `accounts`, `credit_cards`, `loans`, `subscriptions`, `transactions`, `ledger_entries`, `investments`
- Ensures users can only access their own data

### Audit Trail
- Most tables include `created_at` and `updated_at` timestamps
- All records tied to `user_id` for ownership tracking

### Data Types
- **UUIDs** for primary keys (secure, distributed-friendly)
- **NUMERIC** for monetary values (precision-safe)
- **TEXT** for enums with CHECK constraints (readable, flexible)
- **TIMESTAMPTZ** for timezone-aware timestamps

---

## Statistics Summary

| currencies | 6 | No | text |
| user_profile | 3 | No | text |
| fx_rates | 30 | No | uuid |
| accounts | 11 | Yes | uuid |
| credit_cards | 2 | Yes | uuid |
| loans | 0 | Yes | uuid |
| subscriptions | 0 | Yes | uuid |
| transactions | 35 | Yes | uuid |
| ledger_entries | 35 | Yes | uuid |
| investments | 0 | Yes | uuid |
| goals | 0 | Yes | uuid |
| ious | Variable | Yes | uuid |
| iou_payments | Variable | Yes | uuid |
| iou_installments | Variable | Yes | uuid |
| categories | Variable | Yes | uuid |
| category_limits | Variable | Yes | uuid |
| smart_suggestions | Variable | Yes | uuid |
| fee_rules | Variable | Yes | uuid |
| kv_store | Variable | Yes | uuid |
| achievements | 32 | Yes | uuid |
| user_achievements | Variable | Yes | uuid |
| catalog_entities | 69 | Yes | uuid |
| user_catalog_links | Variable | Yes | uuid |
| categorization_rules | Variable | Yes | uuid |

**Total Tables:** 24  
**Tables with RLS:** 21  
**Enhancements (2026-01-23):** Achievements system, Smart Catalog, Auto-Categorization, Financial Health Tracking, Full RLS Coverage.


