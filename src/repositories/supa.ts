import { supabase } from '../lib/supabase';
import { DB_TABLES, TableName } from '../config/dbTables';

/**
 * Wrapper for supabase.from() that enforces use of table constants.
 * Prevents hardcoded table names and dynamic table name generation.
 * 
 * @example
 * // Instead of: supabase.from("accounts")
 * // Use: fromTable(DB_TABLES.ACCOUNTS)
 */
export function fromTable(tableName: TableName) {
    return supabase.from(tableName);
}

// Re-export for convenience
export { DB_TABLES };
export type { TableName };
