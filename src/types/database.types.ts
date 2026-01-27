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
          cached_balance: number | null
          created_at: string
          currency_code: string
          id: string
          is_active: boolean
          min_buffer: number
          name: string
          opening_balance: number
          type: string
          user_id: string
        }
        Insert: {
          cached_balance?: number | null
          created_at?: string
          currency_code: string
          id?: string
          is_active?: boolean
          min_buffer?: number
          name: string
          opening_balance?: number
          type: string
          user_id: string
        }
        Update: {
          cached_balance?: number | null
          created_at?: string
          currency_code?: string
          id?: string
          is_active?: boolean
          min_buffer?: number
          name?: string
          opening_balance?: number
          type?: string
          user_id?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          transaction_date: string
          type: string
          amount: number
          currency_code: string
          base_currency_code: string | null
          exchange_rate: number | null
          base_amount: number | null
          account_id: string | null
          to_account_id: string | null
          category_id: string | null
          description: string | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_date?: string
          type: string
          amount: number
          currency_code: string
          base_currency_code?: string | null
          exchange_rate?: number | null
          base_amount?: number | null
          account_id?: string | null
          to_account_id?: string | null
          category_id?: string | null
          description?: string | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_date?: string
          type?: string
          amount?: number
          currency_code?: string
          base_currency_code?: string | null
          exchange_rate?: number | null
          base_amount?: number | null
          account_id?: string | null
          to_account_id?: string | null
          category_id?: string | null
          description?: string | null
          tags?: string[] | null
          created_at?: string
        }
      }
      ledger_entries: {
        Row: {
          id: string
          user_id: string
          transaction_id: string | null
          account_id: string
          direction: string | null
          amount: number
          transaction_date: string
          created_at: string
          currency_code: string | null
          base_amount: number | null
        }
        Insert: {
          id?: string
          user_id: string
          transaction_id?: string | null
          account_id: string
          direction?: string | null
          amount: number
          transaction_date?: string
          created_at?: string
          currency_code?: string | null
          base_amount?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          transaction_id?: string | null
          account_id?: string
          direction?: string | null
          amount?: number
          transaction_date?: string
          created_at?: string
          currency_code?: string | null
          base_amount?: number | null
        }
      }
      user_profile: {
        Row: {
          user_id: string
          base_currency_code: string
          display_mode: string
          region_code: string | null
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          base_currency_code: string
          display_mode?: string
          region_code?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          base_currency_code?: string
          display_mode?: string
          region_code?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          type: string
          catalog_entity_id: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          type: string
          catalog_entity_id?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          type?: string
          catalog_entity_id?: string | null
          is_system?: boolean
          created_at?: string
        }
      }
      smart_suggestions: {
        Row: {
          id: string
          user_id: string | null
          type: string
          title: string
          message: string
          severity: string
          action: Json
          source: string
          status: string
          catalog_entity_id: string | null
          created_at: string
          expires_at: string | null
          template_key: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: string
          title: string
          message: string
          severity?: string
          action?: Json
          source?: string
          status?: string
          catalog_entity_id?: string | null
          created_at?: string
          expires_at?: string | null
          template_key?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string
          title?: string
          message?: string
          severity?: string
          action?: Json
          source?: string
          status?: string
          catalog_entity_id?: string | null
          created_at?: string
          expires_at?: string | null
          template_key?: string | null
        }
      }
      catalog_entities: {
        Row: {
          id: string
          kind: string
          name: string
          normalized_name: string | null
          icon_key: string | null
          logo_url: string | null
          country_code: string
          region_code: string | null
          is_global: boolean
          status: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          kind: string
          name: string
          normalized_name?: string | null
          icon_key?: string | null
          logo_url?: string | null
          country_code: string
          region_code?: string | null
          is_global?: boolean
          status?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          kind?: string
          name?: string
          normalized_name?: string | null
          icon_key?: string | null
          logo_url?: string | null
          country_code?: string
          region_code?: string | null
          is_global?: boolean
          status?: string | null
          metadata?: Json | null
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          currency_code: string
          deadline: string | null
          category_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          current_amount?: number
          currency_code?: string
          deadline?: string | null
          category_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          currency_code?: string
          deadline?: string | null
          category_id?: string | null
          status?: string
          created_at?: string
        }
      }
      user_catalog_link: {
        Row: {
          id: string
          user_id: string
          catalog_entity_id: string | null
          user_input_name: string
          normalized_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          catalog_entity_id?: string | null
          user_input_name: string
          normalized_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          catalog_entity_id?: string | null
          user_input_name?: string
          normalized_name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
