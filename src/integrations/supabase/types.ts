export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      account_balances: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          calculated_at: string
          closing_balance: number
          cost_center_id: string | null
          credit_movements: number
          currency: string
          debit_movements: number
          id: string
          opening_balance: number
          period_month: number
          period_year: number
          project_id: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          calculated_at?: string
          closing_balance?: number
          cost_center_id?: string | null
          credit_movements?: number
          currency?: string
          debit_movements?: number
          id?: string
          opening_balance?: number
          period_month: number
          period_year: number
          project_id?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          calculated_at?: string
          closing_balance?: number
          cost_center_id?: string | null
          credit_movements?: number
          currency?: string
          debit_movements?: number
          id?: string
          opening_balance?: number
          period_month?: number
          period_year?: number
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_balances_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_balances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_chart: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_synthetic: boolean
          level: number
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_synthetic?: boolean
          level?: number
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_synthetic?: boolean
          level?: number
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_chart_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounting_chart"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_entries: {
        Row: {
          account_code: string
          account_name: string
          client_id: string | null
          cost_center_id: string | null
          created_at: string
          credit_amount: number | null
          currency: string
          debit_amount: number | null
          description: string
          document_number: string
          document_type: string
          entry_date: string
          id: string
          is_reconciled: boolean
          period_month: number
          period_year: number
          project_id: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_status: string
          source_id: string
          source_module: string
          supplier_id: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          client_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          credit_amount?: number | null
          currency?: string
          debit_amount?: number | null
          description: string
          document_number: string
          document_type: string
          entry_date: string
          id?: string
          is_reconciled?: boolean
          period_month: number
          period_year: number
          project_id?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          source_id: string
          source_module: string
          supplier_id?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          client_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          credit_amount?: number | null
          currency?: string
          debit_amount?: number | null
          description?: string
          document_number?: string
          document_type?: string
          entry_date?: string
          id?: string
          is_reconciled?: boolean
          period_month?: number
          period_year?: number
          project_id?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          source_id?: string
          source_module?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_mappings: {
        Row: {
          accounting_account_code: string
          accounting_account_name: string
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          debit_credit: string
          id: string
          is_mandatory: boolean
          managerial_category: string
          managerial_subcategory: string | null
          notes: string | null
          project_id: string | null
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          accounting_account_code: string
          accounting_account_name: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          debit_credit: string
          id?: string
          is_mandatory?: boolean
          managerial_category: string
          managerial_subcategory?: string | null
          notes?: string | null
          project_id?: string | null
          updated_at?: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          accounting_account_code?: string
          accounting_account_name?: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          debit_credit?: string
          id?: string
          is_mandatory?: boolean
          managerial_category?: string
          managerial_subcategory?: string | null
          notes?: string | null
          project_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_mappings_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_mappings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_date: string
          created_at: string
          id: string
          lock_reason: string | null
          opening_date: string
          period_month: number
          period_name: string
          period_year: number
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_date: string
          created_at?: string
          id?: string
          lock_reason?: string | null
          opening_date: string
          period_month: number
          period_name: string
          period_year: number
          status?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_date?: string
          created_at?: string
          id?: string
          lock_reason?: string | null
          opening_date?: string
          period_month?: number
          period_name?: string
          period_year?: number
          status?: string
        }
        Relationships: []
      }
      actuals: {
        Row: {
          actual_date: string
          amount: number
          category: string
          cost_center_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          project_id: string | null
          source_id: string
          source_type: string
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          actual_date: string
          amount: number
          category: string
          cost_center_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          project_id?: string | null
          source_id: string
          source_type: string
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          actual_date?: string
          amount?: number
          category?: string
          cost_center_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          project_id?: string | null
          source_id?: string
          source_type?: string
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actuals_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actuals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      aging_snapshots: {
        Row: {
          aging_bucket: string
          client_id: string
          created_at: string
          days_overdue: number
          id: string
          invoice_id: string
          overdue_amount: number
          snapshot_date: string
        }
        Insert: {
          aging_bucket: string
          client_id: string
          created_at?: string
          days_overdue: number
          id?: string
          invoice_id: string
          overdue_amount: number
          snapshot_date: string
        }
        Update: {
          aging_bucket?: string
          client_id?: string
          created_at?: string
          days_overdue?: number
          id?: string
          invoice_id?: string
          overdue_amount?: number
          snapshot_date?: string
        }
        Relationships: []
      }
      analytics_configurations: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      analytics_dashboards: {
        Row: {
          created_at: string
          created_by: string | null
          dashboard_type: string
          description: string | null
          filters: Json | null
          id: string
          is_default: boolean | null
          is_public: boolean | null
          layout_config: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dashboard_type?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          layout_config?: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dashboard_type?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          layout_config?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_kpi_snapshots: {
        Row: {
          created_at: string
          currency: string | null
          filters: Json | null
          id: string
          kpi_name: string
          kpi_unit: string | null
          kpi_value: number
          metadata: Json | null
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          filters?: Json | null
          id?: string
          kpi_name: string
          kpi_unit?: string | null
          kpi_value: number
          metadata?: Json | null
          snapshot_date?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          filters?: Json | null
          id?: string
          kpi_name?: string
          kpi_unit?: string | null
          kpi_value?: number
          metadata?: Json | null
          snapshot_date?: string
        }
        Relationships: []
      }
      analytics_reports: {
        Row: {
          chart_config: Json | null
          columns_config: Json
          created_at: string
          created_by: string | null
          data_source: string
          description: string | null
          filters: Json | null
          id: string
          is_template: boolean | null
          name: string
          report_type: string
          updated_at: string
        }
        Insert: {
          chart_config?: Json | null
          columns_config?: Json
          created_at?: string
          created_by?: string | null
          data_source: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_template?: boolean | null
          name: string
          report_type: string
          updated_at?: string
        }
        Update: {
          chart_config?: Json | null
          columns_config?: Json
          created_at?: string
          created_by?: string | null
          data_source?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_template?: boolean | null
          name?: string
          report_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_workflows: {
        Row: {
          approver_id: string
          comments: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          approver_id: string
          comments?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          approver_id?: string
          comments?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_holder: string
          account_number: string
          account_type: string
          agency_branch: string
          available_balance: number
          bank_code: string | null
          bank_name: string
          created_at: string
          created_by: string | null
          currency: string
          current_balance: number
          id: string
          notes: string | null
          overdraft_limit: number | null
          status: string
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number: string
          account_type?: string
          agency_branch: string
          available_balance?: number
          bank_code?: string | null
          bank_name: string
          created_at?: string
          created_by?: string | null
          currency?: string
          current_balance?: number
          id?: string
          notes?: string | null
          overdraft_limit?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          account_type?: string
          agency_branch?: string
          available_balance?: number
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          current_balance?: number
          id?: string
          notes?: string | null
          overdraft_limit?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_statements: {
        Row: {
          bank_account_id: string
          file_name: string | null
          file_path: string | null
          id: string
          import_notes: string | null
          imported_at: string
          imported_by: string | null
          reconciled_entries: number | null
          statement_date: string
          status: string
          total_entries: number | null
        }
        Insert: {
          bank_account_id: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          import_notes?: string | null
          imported_at?: string
          imported_by?: string | null
          reconciled_entries?: number | null
          statement_date: string
          status?: string
          total_entries?: number | null
        }
        Update: {
          bank_account_id?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          import_notes?: string | null
          imported_at?: string
          imported_by?: string | null
          reconciled_entries?: number | null
          statement_date?: string
          status?: string
          total_entries?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_statements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          category: string | null
          counterpart_account: string | null
          counterpart_name: string | null
          created_at: string
          description: string
          document_number: string | null
          id: string
          reconciled_at: string | null
          reconciled_by: string | null
          reconciled_with_id: string | null
          reconciled_with_type: string | null
          reconciliation_notes: string | null
          reconciliation_status: string
          statement_id: string | null
          transaction_date: string
          transaction_type: string
          value_date: string | null
        }
        Insert: {
          amount: number
          bank_account_id: string
          category?: string | null
          counterpart_account?: string | null
          counterpart_name?: string | null
          created_at?: string
          description: string
          document_number?: string | null
          id?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciled_with_id?: string | null
          reconciled_with_type?: string | null
          reconciliation_notes?: string | null
          reconciliation_status?: string
          statement_id?: string | null
          transaction_date: string
          transaction_type: string
          value_date?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string
          category?: string | null
          counterpart_account?: string | null
          counterpart_name?: string | null
          created_at?: string
          description?: string
          document_number?: string | null
          id?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciled_with_id?: string | null
          reconciled_with_type?: string | null
          reconciliation_notes?: string | null
          reconciliation_status?: string
          statement_id?: string | null
          transaction_date?: string
          transaction_type?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "bank_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_schedules: {
        Row: {
          amount: number
          billing_type: string
          created_at: string
          id: string
          invoice_id: string | null
          milestone_description: string | null
          order_id: string
          percentage: number | null
          project_id: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          billing_type: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          milestone_description?: string | null
          order_id: string
          percentage?: number | null
          project_id?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_type?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          milestone_description?: string | null
          order_id?: string
          percentage?: number | null
          project_id?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      budget_revisions: {
        Row: {
          budget_id: string
          created_at: string
          created_by: string | null
          id: string
          new_amount: number
          previous_amount: number
          revision_date: string
          revision_reason: string
        }
        Insert: {
          budget_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_amount: number
          previous_amount: number
          revision_date?: string
          revision_reason: string
        }
        Update: {
          budget_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_amount?: number
          previous_amount?: number
          revision_date?: string
          revision_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_revisions_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          budget_type: string
          category: string
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          fiscal_year: number
          id: string
          notes: string | null
          project_id: string | null
          status: string
          subcategory: string | null
          updated_at: string
          valid_from: string
          valid_to: string | null
          version: number
        }
        Insert: {
          amount: number
          budget_type?: string
          category: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          fiscal_year: number
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          valid_from: string
          valid_to?: string | null
          version?: number
        }
        Update: {
          amount?: number
          budget_type?: string
          category?: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          fiscal_year?: number
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_projections: {
        Row: {
          amount: number
          bank_account_id: string | null
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          flow_type: string
          id: string
          probability: number | null
          projection_date: string
          scenario_type: string
          source_id: string | null
          source_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          flow_type: string
          id?: string
          probability?: number | null
          projection_date: string
          scenario_type?: string
          source_id?: string | null
          source_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          flow_type?: string
          id?: string
          probability?: number | null
          projection_date?: string
          scenario_type?: string
          source_id?: string | null
          source_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_projections_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_position_snapshots: {
        Row: {
          bank_account_id: string | null
          calculated_by: string | null
          closing_balance: number
          created_at: string
          currency: string
          id: string
          inflows: number
          opening_balance: number
          outflows: number
          projected_balance_30d: number | null
          projected_balance_7d: number | null
          projected_balance_90d: number | null
          scenario_type: string
          snapshot_date: string
        }
        Insert: {
          bank_account_id?: string | null
          calculated_by?: string | null
          closing_balance?: number
          created_at?: string
          currency?: string
          id?: string
          inflows?: number
          opening_balance?: number
          outflows?: number
          projected_balance_30d?: number | null
          projected_balance_7d?: number | null
          projected_balance_90d?: number | null
          scenario_type?: string
          snapshot_date: string
        }
        Update: {
          bank_account_id?: string | null
          calculated_by?: string | null
          closing_balance?: number
          created_at?: string
          currency?: string
          id?: string
          inflows?: number
          opening_balance?: number
          outflows?: number
          projected_balance_30d?: number | null
          projected_balance_7d?: number | null
          projected_balance_90d?: number | null
          scenario_type?: string
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_position_snapshots_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      commitment_attachments: {
        Row: {
          commitment_id: string
          content_type: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          commitment_id: string
          content_type?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          commitment_id?: string
          content_type?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      commitments: {
        Row: {
          amount: number
          commitment_number: string
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string
          expected_payment_date: string
          id: string
          issue_date: string
          notes: string | null
          project_id: string | null
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          commitment_number: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          expected_payment_date: string
          id?: string
          issue_date: string
          notes?: string | null
          project_id?: string | null
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          commitment_number?: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          expected_payment_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      cost_categories: {
        Row: {
          category_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_fixed: boolean
          name: string
          parent_category: string | null
        }
        Insert: {
          category_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_fixed?: boolean
          name: string
          parent_category?: string | null
        }
        Update: {
          category_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_fixed?: boolean
          name?: string
          parent_category?: string | null
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          code: string
          created_at: string
          description: string | null
          geographic_area: string | null
          id: string
          name: string
          parent_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          geographic_area?: string | null
          id?: string
          name: string
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          geographic_area?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          created_at: string
          created_by: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
          tax_number: string | null
          type: string
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          tax_number?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          tax_number?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      entity_addresses: {
        Row: {
          address_type: string
          city: string
          country: string
          created_at: string
          entity_id: string
          id: string
          is_primary: boolean | null
          postal_code: string | null
          state: string
          street: string
        }
        Insert: {
          address_type: string
          city: string
          country?: string
          created_at?: string
          entity_id: string
          id?: string
          is_primary?: boolean | null
          postal_code?: string | null
          state: string
          street: string
        }
        Update: {
          address_type?: string
          city?: string
          country?: string
          created_at?: string
          entity_id?: string
          id?: string
          is_primary?: boolean | null
          postal_code?: string | null
          state?: string
          street?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_addresses_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_entity_addresses_entity_id"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_contacts: {
        Row: {
          created_at: string
          email: string | null
          entity_id: string
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          entity_id: string
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          entity_id?: string
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_contacts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_entity_contacts_entity_id"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          rate: number
          rate_date: string
          source: string | null
          target_currency: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          rate: number
          rate_date?: string
          source?: string | null
          target_currency: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          rate?: number
          rate_date?: string
          source?: string | null
          target_currency?: string
        }
        Relationships: []
      }
      expense_attachments: {
        Row: {
          content_type: string | null
          expense_id: string
          file_path: string
          file_size: number | null
          filename: string
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          content_type?: string | null
          expense_id: string
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          content_type?: string | null
          expense_id?: string
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      export_configurations: {
        Row: {
          columns_config: Json
          config_name: string
          config_type: string
          created_at: string
          created_by: string | null
          date_format: string | null
          encoding: string | null
          file_format: string
          id: string
          is_default: boolean
          number_format: string | null
          separator: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          columns_config: Json
          config_name: string
          config_type: string
          created_at?: string
          created_by?: string | null
          date_format?: string | null
          encoding?: string | null
          file_format?: string
          id?: string
          is_default?: boolean
          number_format?: string | null
          separator?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          columns_config?: Json
          config_name?: string
          config_type?: string
          created_at?: string
          created_by?: string | null
          date_format?: string | null
          encoding?: string | null
          file_format?: string
          id?: string
          is_default?: boolean
          number_format?: string | null
          separator?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      export_history: {
        Row: {
          config_id: string | null
          error_message: string | null
          export_filters: Json | null
          export_type: string
          exported_at: string
          exported_by: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          id: string
          period_end: string | null
          period_start: string | null
          status: string
          total_records: number | null
        }
        Insert: {
          config_id?: string | null
          error_message?: string | null
          export_filters?: Json | null
          export_type: string
          exported_at?: string
          exported_by?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          total_records?: number | null
        }
        Update: {
          config_id?: string | null
          error_message?: string | null
          export_filters?: Json | null
          export_type?: string
          exported_at?: string
          exported_by?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          total_records?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "export_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "export_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      hourly_rates: {
        Row: {
          billing_policy: string | null
          created_at: string
          currency: string | null
          id: string
          position: string
          project_id: string | null
          rate_value: number
          reimbursement_policy: string | null
          team: string | null
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          billing_policy?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          position: string
          project_id?: string | null
          rate_value: number
          reimbursement_policy?: string | null
          team?: string | null
          updated_at?: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          billing_policy?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          position?: string
          project_id?: string | null
          rate_value?: number
          reimbursement_policy?: string | null
          team?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_hourly_rates_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hourly_rates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          integration_id: string
          operation: string
          processing_time_ms: number | null
          request_data: Json | null
          response_data: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id: string
          operation: string
          processing_time_ms?: number | null
          request_data?: Json | null
          response_data?: Json | null
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id?: string
          operation?: string
          processing_time_ms?: number | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          authentication_type: string | null
          configuration: Json | null
          created_at: string
          created_by: string | null
          endpoint_url: string | null
          id: string
          integration_type: string
          last_error: string | null
          last_sync_at: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          authentication_type?: string | null
          configuration?: Json | null
          created_at?: string
          created_by?: string | null
          endpoint_url?: string | null
          id?: string
          integration_type: string
          last_error?: string | null
          last_sync_at?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          authentication_type?: string | null
          configuration?: Json | null
          created_at?: string
          created_by?: string | null
          endpoint_url?: string | null
          id?: string
          integration_type?: string
          last_error?: string | null
          last_sync_at?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total_amount?: number
          unit_price?: number
        }
        Relationships: []
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          reference_number: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date: string
          payment_method: string
          reference_number?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          status?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          document_path: string | null
          due_date: string
          gross_amount: number
          id: string
          invoice_number: string
          invoice_status: string
          issue_date: string
          net_amount: number
          notes: string | null
          order_id: string | null
          payment_method: string | null
          payment_status: string
          project_id: string | null
          tax_amount: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          document_path?: string | null
          due_date: string
          gross_amount: number
          id?: string
          invoice_number: string
          invoice_status?: string
          issue_date: string
          net_amount: number
          notes?: string | null
          order_id?: string | null
          payment_method?: string | null
          payment_status?: string
          project_id?: string | null
          tax_amount?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          document_path?: string | null
          due_date?: string
          gross_amount?: number
          id?: string
          invoice_number?: string
          invoice_status?: string
          issue_date?: string
          net_amount?: number
          notes?: string | null
          order_id?: string | null
          payment_method?: string | null
          payment_status?: string
          project_id?: string | null
          tax_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          name: string
          subject: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_template: string
          channel: string
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean
          name: string
          subject?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          event_type: string
          id: string
          message: string
          metadata: Json | null
          read_at: string | null
          related_object_id: string | null
          related_object_type: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          event_type: string
          id?: string
          message: string
          metadata?: Json | null
          read_at?: string | null
          related_object_id?: string | null
          related_object_type?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          event_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          read_at?: string | null
          related_object_id?: string | null
          related_object_type?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_attachments: {
        Row: {
          content_type: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          order_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          order_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          order_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      order_margin_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_margin_percentage: number | null
          new_margin_value: number | null
          order_id: string
          previous_margin_percentage: number | null
          previous_margin_value: number | null
          revision_reason: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_margin_percentage?: number | null
          new_margin_value?: number | null
          order_id: string
          previous_margin_percentage?: number | null
          previous_margin_value?: number | null
          revision_reason: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_margin_percentage?: number | null
          new_margin_value?: number | null
          order_id?: string
          previous_margin_percentage?: number | null
          previous_margin_value?: number | null
          revision_reason?: string
        }
        Relationships: []
      }
      order_projects: {
        Row: {
          allocated_value: number | null
          created_at: string
          id: string
          order_id: string
          project_id: string
        }
        Insert: {
          allocated_value?: number | null
          created_at?: string
          id?: string
          order_id: string
          project_id: string
        }
        Update: {
          allocated_value?: number | null
          created_at?: string
          id?: string
          order_id?: string
          project_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string
          end_date: string | null
          estimated_costs: number | null
          id: string
          margin_percentage: number | null
          margin_value: number | null
          order_number: string
          start_date: string | null
          status: string
          total_value: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          end_date?: string | null
          estimated_costs?: number | null
          id?: string
          margin_percentage?: number | null
          margin_value?: number | null
          order_number: string
          start_date?: string | null
          status?: string
          total_value: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          end_date?: string | null
          estimated_costs?: number | null
          id?: string
          margin_percentage?: number | null
          margin_value?: number | null
          order_number?: string
          start_date?: string | null
          status?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      payables: {
        Row: {
          amount: number
          commitment_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          document_number: string
          due_date: string
          id: string
          notes: string | null
          paid_amount: number | null
          payment_date: string | null
          payment_method: string
          priority: string | null
          remaining_amount: number | null
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          commitment_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          document_number: string
          due_date: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method: string
          priority?: string | null
          remaining_amount?: number | null
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          commitment_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          document_number?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string
          priority?: string | null
          remaining_amount?: number | null
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_approvals: {
        Row: {
          approval_level: number
          approved_at: string | null
          approver_id: string
          comments: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          status: string
        }
        Insert: {
          approval_level: number
          approved_at?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          status?: string
        }
        Update: {
          approval_level?: number
          approved_at?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      payment_batches: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_file_path: string | null
          batch_date: string
          batch_number: string
          created_at: string
          created_by: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          payment_method: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_file_path?: string | null
          batch_date: string
          batch_number: string
          created_at?: string
          created_by?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          payment_method: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_file_path?: string | null
          batch_date?: string
          batch_number?: string
          created_at?: string
          created_by?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          payment_method?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_executions: {
        Row: {
          amount: number
          bank_account_id: string
          bank_transaction_id: string | null
          beneficiary_account: string | null
          beneficiary_bank: string | null
          beneficiary_name: string | null
          created_at: string
          currency: string
          document_number: string | null
          error_message: string | null
          executed_at: string | null
          executed_by: string | null
          execution_date: string
          execution_reference: string | null
          id: string
          payable_id: string | null
          payment_batch_id: string | null
          payment_method: string
          status: string
          value_date: string | null
        }
        Insert: {
          amount: number
          bank_account_id: string
          bank_transaction_id?: string | null
          beneficiary_account?: string | null
          beneficiary_bank?: string | null
          beneficiary_name?: string | null
          created_at?: string
          currency?: string
          document_number?: string | null
          error_message?: string | null
          executed_at?: string | null
          executed_by?: string | null
          execution_date: string
          execution_reference?: string | null
          id?: string
          payable_id?: string | null
          payment_batch_id?: string | null
          payment_method: string
          status?: string
          value_date?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string
          bank_transaction_id?: string | null
          beneficiary_account?: string | null
          beneficiary_bank?: string | null
          beneficiary_name?: string | null
          created_at?: string
          currency?: string
          document_number?: string | null
          error_message?: string | null
          executed_at?: string | null
          executed_by?: string | null
          execution_date?: string
          execution_reference?: string | null
          id?: string
          payable_id?: string | null
          payment_batch_id?: string | null
          payment_method?: string
          status?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_executions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_executions_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_executions_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "payables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_executions_payment_batch_id_fkey"
            columns: ["payment_batch_id"]
            isOneToOne: false
            referencedRelation: "payment_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          amount: number
          approval_level: number | null
          approved_at: string | null
          approved_by: string | null
          batch_id: string | null
          created_at: string
          executed_at: string | null
          id: string
          notes: string | null
          payable_id: string
          priority: string | null
          scheduled_date: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approval_level?: number | null
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          notes?: string | null
          payable_id: string
          priority?: string | null
          scheduled_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approval_level?: number | null
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          notes?: string | null
          payable_id?: string
          priority?: string | null
          scheduled_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          conditions: Json | null
          created_at: string
          id: string
          is_allowed: boolean
          module: string
          resource: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          action: string
          conditions?: Json | null
          created_at?: string
          id?: string
          is_allowed?: boolean
          module: string
          resource?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          action?: string
          conditions?: Json | null
          created_at?: string
          id?: string
          is_allowed?: boolean
          module?: string
          resource?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      poc_calculations: {
        Row: {
          calculated_by: string | null
          calculation_date: string
          cost_based_poc: number | null
          created_at: string
          hours_based_poc: number | null
          id: string
          overall_poc: number | null
          physical_poc: number | null
          project_id: string
          total_budgeted_cost: number | null
          total_budgeted_hours: number | null
          total_incurred_cost: number | null
          total_worked_hours: number | null
        }
        Insert: {
          calculated_by?: string | null
          calculation_date: string
          cost_based_poc?: number | null
          created_at?: string
          hours_based_poc?: number | null
          id?: string
          overall_poc?: number | null
          physical_poc?: number | null
          project_id: string
          total_budgeted_cost?: number | null
          total_budgeted_hours?: number | null
          total_incurred_cost?: number | null
          total_worked_hours?: number | null
        }
        Update: {
          calculated_by?: string | null
          calculation_date?: string
          cost_based_poc?: number | null
          created_at?: string
          hours_based_poc?: number | null
          id?: string
          overall_poc?: number | null
          physical_poc?: number | null
          project_id?: string
          total_budgeted_cost?: number | null
          total_budgeted_hours?: number | null
          total_incurred_cost?: number | null
          total_worked_hours?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_unit: string | null
          created_at: string
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          language: string | null
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          status: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_unit?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          language?: string | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_unit?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          cost_center_id: string | null
          created_at: string
          currency: string
          description: string
          expense_date: string
          expense_type: string
          id: string
          location: string | null
          project_id: string
          rejection_reason: string | null
          status: string
          supplier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          cost_center_id?: string | null
          created_at?: string
          currency?: string
          description: string
          expense_date: string
          expense_type: string
          id?: string
          location?: string | null
          project_id: string
          rejection_reason?: string | null
          status?: string
          supplier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          cost_center_id?: string | null
          created_at?: string
          currency?: string
          description?: string
          expense_date?: string
          expense_type?: string
          id?: string
          location?: string | null
          project_id?: string
          rejection_reason?: string | null
          status?: string
          supplier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_team_members: {
        Row: {
          allocated_hours: number | null
          created_at: string
          hourly_rate: number | null
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          allocated_hours?: number | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          allocated_hours?: number | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          cost_center_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          manager_id: string | null
          name: string
          scope: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          cost_center_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name: string
          scope?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          cost_center_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          scope?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_cost_center_id"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_rules: {
        Row: {
          amount_tolerance: number | null
          auto_reconcile: boolean
          bank_account_id: string | null
          created_at: string
          created_by: string | null
          date_tolerance: number | null
          description_pattern: string | null
          id: string
          is_active: boolean
          match_type: string
          name: string
          priority: number
          target_category: string | null
          updated_at: string
        }
        Insert: {
          amount_tolerance?: number | null
          auto_reconcile?: boolean
          bank_account_id?: string | null
          created_at?: string
          created_by?: string | null
          date_tolerance?: number | null
          description_pattern?: string | null
          id?: string
          is_active?: boolean
          match_type: string
          name: string
          priority?: number
          target_category?: string | null
          updated_at?: string
        }
        Update: {
          amount_tolerance?: number | null
          auto_reconcile?: boolean
          bank_account_id?: string | null
          created_at?: string
          created_by?: string | null
          date_tolerance?: number | null
          description_pattern?: string | null
          id?: string
          is_active?: boolean
          match_type?: string
          name?: string
          priority?: number
          target_category?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_rules_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      system_parameters: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          parameter_key: string
          parameter_value: Json
          scope_id: string | null
          scope_type: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          parameter_key: string
          parameter_value: Json
          scope_id?: string | null
          scope_type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          parameter_key?: string
          parameter_value?: Json
          scope_id?: string | null
          scope_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          activity: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          hours_worked: number
          id: string
          observations: string | null
          project_id: string
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          activity: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          hours_worked: number
          id?: string
          observations?: string | null
          project_id: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          work_date: string
        }
        Update: {
          activity?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          hours_worked?: number
          id?: string
          observations?: string | null
          project_id?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: []
      }
      undercoverage_calculations: {
        Row: {
          billable_amount: number
          calculated_by: string | null
          calculation_date: string
          cost_center_id: string | null
          coverage_percentage: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          productive_hours: number
          project_id: string | null
          total_fixed_costs: number
          undercovered_amount: number
        }
        Insert: {
          billable_amount?: number
          calculated_by?: string | null
          calculation_date?: string
          cost_center_id?: string | null
          coverage_percentage?: number
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          productive_hours?: number
          project_id?: string | null
          total_fixed_costs?: number
          undercovered_amount?: number
        }
        Update: {
          billable_amount?: number
          calculated_by?: string | null
          calculation_date?: string
          cost_center_id?: string | null
          coverage_percentage?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          productive_hours?: number
          project_id?: string | null
          total_fixed_costs?: number
          undercovered_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "undercoverage_calculations_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "undercoverage_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          channel: string
          created_at: string
          event_type: string
          id: string
          is_enabled: boolean
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          event_type: string
          id?: string
          is_enabled?: boolean
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          event_type?: string
          id?: string
          is_enabled?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          scope_id: string | null
          scope_type: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          scope_id?: string | null
          scope_type?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          scope_id?: string | null
          scope_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workflow_definitions: {
        Row: {
          approval_rules: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          escalation_rules: Json | null
          id: string
          is_active: boolean
          name: string
          object_type: string
          sla_hours: number | null
          states: Json
          transitions: Json
          updated_at: string
        }
        Insert: {
          approval_rules?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean
          name: string
          object_type: string
          sla_hours?: number | null
          states?: Json
          transitions?: Json
          updated_at?: string
        }
        Update: {
          approval_rules?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          object_type?: string
          sla_hours?: number | null
          states?: Json
          transitions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      workflow_instances: {
        Row: {
          completed_at: string | null
          current_state: string
          id: string
          metadata: Json | null
          object_id: string
          object_type: string
          started_at: string
          started_by: string | null
          status: string
          workflow_definition_id: string
        }
        Insert: {
          completed_at?: string | null
          current_state: string
          id?: string
          metadata?: Json | null
          object_id: string
          object_type: string
          started_at?: string
          started_by?: string | null
          status?: string
          workflow_definition_id: string
        }
        Update: {
          completed_at?: string | null
          current_state?: string
          id?: string
          metadata?: Json | null
          object_id?: string
          object_type?: string
          started_at?: string
          started_by?: string | null
          status?: string
          workflow_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          action: string | null
          assigned_at: string
          assignee_id: string | null
          attachments: Json | null
          comments: string | null
          completed_at: string | null
          due_date: string | null
          escalated_to: string | null
          id: string
          status: string
          step_name: string
          workflow_instance_id: string
        }
        Insert: {
          action?: string | null
          assigned_at?: string
          assignee_id?: string | null
          attachments?: Json | null
          comments?: string | null
          completed_at?: string | null
          due_date?: string | null
          escalated_to?: string | null
          id?: string
          status?: string
          step_name: string
          workflow_instance_id: string
        }
        Update: {
          action?: string | null
          assigned_at?: string
          assignee_id?: string | null
          attachments?: Json | null
          comments?: string | null
          completed_at?: string | null
          due_date?: string | null
          escalated_to?: string | null
          id?: string
          status?: string
          step_name?: string
          workflow_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_account_balances: {
        Args: { p_period_year: number; p_period_month: number }
        Returns: number
      }
      calculate_aging_for_invoice: {
        Args: { invoice_date: string; snapshot_date?: string }
        Returns: {
          days_overdue: number
          aging_bucket: string
        }[]
      }
      calculate_cash_position: {
        Args: { p_calculation_date?: string; p_scenario_type?: string }
        Returns: undefined
      }
      calculate_main_kpis: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_project_id?: string
          p_client_id?: string
          p_cost_center_id?: string
        }
        Returns: Json
      }
      calculate_undercoverage: {
        Args: {
          p_project_id?: string
          p_cost_center_id?: string
          p_period_start?: string
          p_period_end?: string
        }
        Returns: string
      }
      close_accounting_period: {
        Args: {
          p_period_year: number
          p_period_month: number
          p_user_id?: string
        }
        Returns: boolean
      }
      consolidate_accounting_entries: {
        Args: { p_period_year: number; p_period_month: number }
        Returns: number
      }
      create_kpi_snapshot: {
        Args: { p_snapshot_date?: string; p_filters?: Json }
        Returns: number
      }
      generate_aging_snapshot: {
        Args: { snapshot_date?: string }
        Returns: undefined
      }
      generate_cash_flow_from_payables: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_cash_flow_from_receivables: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_dashboard_data: {
        Args: { p_dashboard_type?: string; p_filters?: Json }
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: { p_module: string; p_action: string; p_resource?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "finance"
        | "projects"
        | "auditor"
        | "manager"
        | "collaborator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "finance",
        "projects",
        "auditor",
        "manager",
        "collaborator",
      ],
    },
  },
} as const
