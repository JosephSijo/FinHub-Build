# Supabase Migrations

This directory contains database migrations for the FinHub application.

## Files

- **`20260115_production_schema.sql`** - Main production schema migration
- **`20260115_production_schema_rollback.sql`** - Rollback script (use with caution!)
- **`validation_queries.sql`** - Queries to validate the migration

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended for first-time)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `20260115_production_schema.sql`
4. Paste and run the SQL
5. Verify with queries from `validation_queries.sql`

### Option 2: Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migration
supabase db push

# Or run the migration file directly
supabase db execute -f supabase/migrations/20260115_production_schema.sql
```

## Schema Overview

### Tables Created

1. **currencies** - Supported currencies (INR, USD, EUR, GBP, AED, SAR)
2. **user_profile** - User preferences (base currency, display mode)
3. **fx_rates** - Historical exchange rates
4. **accounts** - User accounts (cash, bank, wallet)
5. **categories** - Income/expense categories
6. **credit_cards** - Credit card management
7. **subscriptions** - Recurring subscriptions
8. **loans** - Personal loans (lent/borrowed)
9. **transactions** - Unified transaction ledger

### Key Features

- ✅ Multi-currency support with FX conversion
- ✅ Row-Level Security (RLS) policies
- ✅ Proper foreign key constraints
- ✅ Check constraints for data validation
- ✅ Indexes for query performance
- ✅ Helper function for latest FX rates

## Validation

After applying the migration, run the queries in `validation_queries.sql` to verify:

- All tables created
- Currencies seeded
- RLS policies active
- Indexes created
- Foreign keys established

## Rollback

⚠️ **WARNING**: Rollback will delete all data!

```bash
# Only if you need to rollback
supabase db execute -f supabase/migrations/20260115_production_schema_rollback.sql
```

## Next Steps

1. Apply the migration to your Supabase project
2. Run validation queries
3. Update your application code to use the new schema
4. Test with sample data
