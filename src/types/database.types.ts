export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          currency: string | null
          currency_code: string
          current_balance: number | null
          id: string
          is_active: boolean
          min_buffer: number
          name: string
          opening_balance: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          currency_code: string
          current_balance?: number | null
          id?: string
          is_active?: boolean
          min_buffer?: number
          name: string
          opening_balance?: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          currency_code?: string
          current_balance?: number | null
          id?: string
          is_active?: boolean
          min_buffer?: number
          name?: string
          opening_balance?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      // ... (Types generated from live schema)
    }
  }
}
