# Admin Guide: User Data Reset Procedure

Use this guide to reset a user's account data (transactions, accounts, cards) while preserving their categories and smart suggestions by converting them to global system values.

> [!WARNING]
> This operation is irreversible. Ensure you have a backup before executing.
> Replace `<TARGET_USER_ID>` with the specific UUID of the user.

---

## 🕒 Step 1: Conserve & Globalize Metadata

Start by promoting user-specific categories and suggestions to Global status (`user_id = NULL`). This ensures they survive the wipe and become available to all users (or just the system).

```sql
-- Execute the reset function for a specific user
SELECT admin_reset_user_and_globalize('<TARGET_USER_ID>');
```

---

## 🧹 Step 2: Verification

Run these queries to ensure no data remains for the user.

```sql
SELECT 'transactions' as table, count(*) FROM transactions WHERE user_id = '<TARGET_USER_ID>'
UNION ALL
SELECT 'accounts', count(*) FROM accounts WHERE user_id = '<TARGET_USER_ID>'
UNION ALL
SELECT 'user_achievements', count(*) FROM user_achievements WHERE user_id = '<TARGET_USER_ID>';
-- Should all return 0
```
