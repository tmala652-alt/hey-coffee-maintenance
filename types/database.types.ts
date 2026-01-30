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
      ai_analyses: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          id: string
          input_data: Json
          model_used: string | null
          organization_id: string | null
          output_data: Json
          request_id: string | null
          tokens_used: number | null
          was_helpful: boolean | null
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          input_data: Json
          model_used?: string | null
          organization_id?: string | null
          output_data: Json
          request_id?: string | null
          tokens_used?: number | null
          was_helpful?: boolean | null
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          input_data?: Json
          model_used?: string | null
          organization_id?: string | null
          output_data?: Json
          request_id?: string | null
          tokens_used?: number | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analyses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          created_at: string | null
          description: string
          estimated_impact: Json | null
          id: string
          organization_id: string | null
          priority: string | null
          recommendation_type: string
          related_requests: string[] | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          estimated_impact?: Json | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          recommendation_type: string
          related_requests?: string[] | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          estimated_impact?: Json | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          recommendation_type?: string
          related_requests?: string[] | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_rules: {
        Row: {
          assignment_strategy: string | null
          conditions: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          priority: number | null
          target_technician_id: string | null
        }
        Insert: {
          assignment_strategy?: string | null
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          priority?: number | null
          target_technician_id?: string | null
        }
        Update: {
          assignment_strategy?: string | null
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          priority?: number | null
          target_technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_rules_target_technician_id_fkey"
            columns: ["target_technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string | null
          file_url: string
          id: string
          request_id: string
          type: Database["public"]["Enums"]["attachment_type_enum"]
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_url: string
          id?: string
          request_id: string
          type?: Database["public"]["Enums"]["attachment_type_enum"]
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_url?: string
          id?: string
          request_id?: string
          type?: Database["public"]["Enums"]["attachment_type_enum"]
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_working_hours: {
        Row: {
          branch_id: string
          close_time: string
          created_at: string | null
          day_of_week: number
          id: string
          is_closed: boolean | null
          open_time: string
        }
        Insert: {
          branch_id: string
          close_time: string
          created_at?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          open_time: string
        }
        Update: {
          branch_id?: string
          close_time?: string
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_working_hours_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          brand_id: string | null
          code: string
          created_at: string | null
          id: string
          name: string
          organization_id: string | null
          region: string | null
        }
        Insert: {
          brand_id?: string | null
          code: string
          created_at?: string | null
          id?: string
          name: string
          organization_id?: string | null
          region?: string | null
        }
        Update: {
          brand_id?: string | null
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          code: string
          color_primary: string | null
          color_secondary: string | null
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
        }
        Insert: {
          code: string
          color_primary?: string | null
          color_secondary?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
        }
        Update: {
          code?: string
          color_primary?: string | null
          color_secondary?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          id: string
          message: string
          request_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          request_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          organization_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          organization_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          organization_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_logs: {
        Row: {
          added_by: string
          amount: number
          created_at: string | null
          description: string | null
          id: string
          request_id: string
        }
        Insert: {
          added_by: string
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          request_id: string
        }
        Update: {
          added_by?: string
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_logs_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          branch_id: string
          brand: string | null
          category: string
          created_at: string | null
          id: string
          location: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          status: string | null
          warranty_expiry: string | null
        }
        Insert: {
          branch_id: string
          brand?: string | null
          category: string
          created_at?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          branch_id?: string
          brand?: string | null
          category?: string
          created_at?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_rules: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notify_roles: string[] | null
          threshold_percent: number
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notify_roles?: string[] | null
          threshold_percent: number
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notify_roles?: string[] | null
          threshold_percent?: number
        }
        Relationships: []
      }
      holidays: {
        Row: {
          branch_id: string | null
          created_at: string | null
          date: string
          id: string
          is_recurring: boolean | null
          name: string
          organization_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_recurring?: boolean | null
          name: string
          organization_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_recurring?: boolean | null
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holidays_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holidays_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_requests: {
        Row: {
          id: string
          incident_id: string
          linked_at: string | null
          linked_by: string | null
          request_id: string
        }
        Insert: {
          id?: string
          incident_id: string
          linked_at?: string | null
          linked_by?: string | null
          request_id: string
        }
        Update: {
          id?: string
          incident_id?: string
          linked_at?: string | null
          linked_by?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_requests_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_requests_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_requests_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          organization_id: string | null
          resolution: string | null
          resolved_at: string | null
          root_cause: string | null
          severity: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_pauses: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          paused_at: string
          paused_by: string
          reason: string
          reason_category: string | null
          request_id: string
          resumed_at: string | null
          resumed_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          paused_at?: string
          paused_by: string
          reason: string
          reason_category?: string | null
          request_id: string
          resumed_at?: string | null
          resumed_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          paused_at?: string
          paused_by?: string
          reason?: string
          reason_category?: string | null
          request_id?: string
          resumed_at?: string | null
          resumed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_pauses_paused_by_fkey"
            columns: ["paused_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pauses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pauses_resumed_by_fkey"
            columns: ["resumed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_article_attachments: {
        Row: {
          article_id: string
          created_at: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          sort_order: number | null
        }
        Insert: {
          article_id: string
          created_at?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          sort_order?: number | null
        }
        Update: {
          article_id?: string
          created_at?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_article_attachments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          category_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          difficulty: string | null
          equipment_types: string[] | null
          estimated_time: number | null
          helpful_count: number | null
          id: string
          not_helpful_count: number | null
          organization_id: string | null
          published_at: string | null
          slug: string
          status: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          views: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          equipment_types?: string[] | null
          estimated_time?: number | null
          helpful_count?: number | null
          id?: string
          not_helpful_count?: number | null
          organization_id?: string | null
          published_at?: string | null
          slug: string
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          views?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          equipment_types?: string[] | null
          estimated_time?: number | null
          helpful_count?: number | null
          id?: string
          not_helpful_count?: number | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          assigned_at: string | null
          assigned_user_id: string | null
          assigned_vendor_id: string | null
          branch_id: string
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_at: string | null
          equipment_id: string | null
          estimated_cost: number | null
          id: string
          incident_id: string | null
          is_paused: boolean | null
          issue_signature: string | null
          pause_count: number | null
          priority: Database["public"]["Enums"]["priority_enum"]
          sla_hours: number | null
          sla_mode: string | null
          sla_paused_at: string | null
          sla_paused_duration: unknown
          sla_status: string | null
          status: Database["public"]["Enums"]["status_enum"]
          title: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_at?: string | null
          assigned_user_id?: string | null
          assigned_vendor_id?: string | null
          branch_id: string
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_at?: string | null
          equipment_id?: string | null
          estimated_cost?: number | null
          id?: string
          incident_id?: string | null
          is_paused?: boolean | null
          issue_signature?: string | null
          pause_count?: number | null
          priority?: Database["public"]["Enums"]["priority_enum"]
          sla_hours?: number | null
          sla_mode?: string | null
          sla_paused_at?: string | null
          sla_paused_duration?: unknown
          sla_status?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          title: string
        }
        Update: {
          actual_cost?: number | null
          assigned_at?: string | null
          assigned_user_id?: string | null
          assigned_vendor_id?: string | null
          branch_id?: string
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_at?: string | null
          equipment_id?: string | null
          estimated_cost?: number | null
          id?: string
          incident_id?: string | null
          is_paused?: boolean | null
          issue_signature?: string | null
          pause_count?: number | null
          priority?: Database["public"]["Enums"]["priority_enum"]
          sla_hours?: number | null
          sla_mode?: string | null
          sla_paused_at?: string | null
          sla_paused_duration?: unknown
          sla_status?: string | null
          status?: Database["public"]["Enums"]["status_enum"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          assigned_user_id: string | null
          assigned_vendor_id: string | null
          branch_id: string | null
          category: string
          created_at: string | null
          description: string | null
          equipment_id: string | null
          frequency_days: number
          id: string
          is_active: boolean | null
          last_generated_at: string | null
          name: string
          next_due_at: string
          priority: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          assigned_vendor_id?: string | null
          branch_id?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          equipment_id?: string | null
          frequency_days: number
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          name: string
          next_due_at: string
          priority?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          assigned_vendor_id?: string | null
          branch_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          equipment_id?: string | null
          frequency_days?: number
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          name?: string
          next_due_at?: string
          priority?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          request_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          request_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          request_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string | null
          current_workload: number | null
          home_branch_id: string | null
          id: string
          managed_branch_ids: string[] | null
          max_workload: number | null
          name: string
          organization_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["role_enum"]
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          current_workload?: number | null
          home_branch_id?: string | null
          id: string
          managed_branch_ids?: string[] | null
          max_workload?: number | null
          name: string
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          current_workload?: number | null
          home_branch_id?: string | null
          id?: string
          managed_branch_ids?: string[] | null
          max_workload?: number | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_home_branch_id_fkey"
            columns: ["home_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      request_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string
          id: string
          overall_rating: number | null
          rating_quality: number | null
          rating_service: number | null
          rating_speed: number | null
          request_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          overall_rating?: number | null
          rating_quality?: number | null
          rating_service?: number | null
          rating_speed?: number | null
          request_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          overall_rating?: number | null
          rating_quality?: number | null
          rating_service?: number | null
          rating_speed?: number | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_feedback_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_kb_links: {
        Row: {
          article_id: string
          id: string
          linked_at: string | null
          linked_by: string | null
          request_id: string
          was_helpful: boolean | null
        }
        Insert: {
          article_id: string
          id?: string
          linked_at?: string | null
          linked_by?: string | null
          request_id: string
          was_helpful?: boolean | null
        }
        Update: {
          article_id?: string
          id?: string
          linked_at?: string | null
          linked_by?: string | null
          request_id?: string
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "request_kb_links_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_kb_links_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_kb_links_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_logs: {
        Row: {
          breached: boolean | null
          id: string
          request_id: string
          resolved_at: string | null
          started_at: string
        }
        Insert: {
          breached?: boolean | null
          id?: string
          request_id: string
          resolved_at?: string | null
          started_at?: string
        }
        Update: {
          breached?: boolean | null
          id?: string
          request_id?: string
          resolved_at?: string | null
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      status_logs: {
        Row: {
          changed_by: string
          created_at: string | null
          id: string
          request_id: string
          status: Database["public"]["Enums"]["status_enum"]
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          id?: string
          request_id: string
          status: Database["public"]["Enums"]["status_enum"]
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "status_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_availability: {
        Row: {
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          is_available: boolean | null
          notes: string | null
          profile_id: string
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          notes?: string | null
          profile_id: string
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          notes?: string | null
          profile_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_availability_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_skills: {
        Row: {
          category: string
          certified_at: string | null
          certified_by: string | null
          created_at: string | null
          id: string
          profile_id: string
          skill_level: number | null
        }
        Insert: {
          category: string
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string | null
          id?: string
          profile_id: string
          skill_level?: number | null
        }
        Update: {
          category?: string
          certified_at?: string | null
          certified_by?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string
          skill_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_skills_certified_by_fkey"
            columns: ["certified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          company_name: string
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_branch_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["role_enum"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      attachment_type_enum: "image" | "receipt" | "worksheet" | "video"
      priority_enum: "low" | "medium" | "high" | "critical"
      role_enum: "branch" | "admin" | "technician" | "vendor" | "manager"
      status_enum:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

// Convenience type aliases
export type Branch = Tables<"branches">
export type Profile = Tables<"profiles">
export type Vendor = Tables<"vendors">
export type MaintenanceRequest = Tables<"maintenance_requests">
export type Chat = Tables<"chats">
export type Attachment = Tables<"attachments">
export type SlaLog = Tables<"sla_logs">
export type StatusLog = Tables<"status_logs">
export type CostLog = Tables<"cost_logs">
export type Equipment = Tables<"equipment">
export type Notification = Tables<"notifications">
export type MaintenanceSchedule = Tables<"maintenance_schedules">
export type RequestFeedback = Tables<"request_feedback">
export type AuditLog = Tables<"audit_logs">
export type EscalationRule = Tables<"escalation_rules">

export type RoleEnum = Enums<"role_enum">
export type PriorityEnum = Enums<"priority_enum">
export type StatusEnum = Enums<"status_enum">
export type AttachmentTypeEnum = Enums<"attachment_type_enum">

// SLA Status type
export type SLAStatus = 'on_track' | 'warning' | 'critical' | 'breached' | 'completed' | 'no_sla'

// Enterprise SaaS types (Phase 2)
export type Organization = Tables<"organizations">
export type Company = Tables<"companies">
export type Brand = Tables<"brands">
export type BranchWorkingHours = Tables<"branch_working_hours">
export type Holiday = Tables<"holidays">
export type JobPause = Tables<"job_pauses">
export type Incident = Tables<"incidents">
export type IncidentRequest = Tables<"incident_requests">
export type KBCategory = Tables<"kb_categories">
export type KnowledgeArticle = Tables<"knowledge_articles">
export type KBArticleAttachment = Tables<"kb_article_attachments">
export type RequestKBLink = Tables<"request_kb_links">
export type TechnicianSkill = Tables<"technician_skills">
export type TechnicianAvailability = Tables<"technician_availability">
export type AssignmentRule = Tables<"assignment_rules">
export type AIAnalysis = Tables<"ai_analyses">
export type AIRecommendation = Tables<"ai_recommendations">

// SLA Mode type
export type SLAMode = 'calendar' | 'working_hours'

// Pause reason categories
export type PauseReasonCategory =
  | 'waiting_parts'
  | 'waiting_approval'
  | 'waiting_vendor'
  | 'customer_unavailable'
  | 'weather'
  | 'other'

// Incident status
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed'

// Incident severity
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

// KB article status
export type KBArticleStatus = 'draft' | 'published' | 'archived'

// KB article difficulty
export type KBArticleDifficulty = 'beginner' | 'intermediate' | 'advanced'

// Assignment strategy
export type AssignmentStrategy = 'round_robin' | 'least_loaded' | 'skill_match' | 'nearest' | 'manual'

// AI analysis types
export type AIAnalysisType =
  | 'request_summary'
  | 'root_cause'
  | 'solution_suggestion'
  | 'trend_analysis'
  | 'cost_prediction'
  | 'preventive_recommendation'

// AI recommendation types
export type AIRecommendationType =
  | 'preventive_maintenance'
  | 'equipment_replacement'
  | 'technician_training'
  | 'process_improvement'

// =====================================================
// EXPENSE SYSTEM TYPES
// =====================================================

// Expense category type enum
export type ExpenseCategoryType =
  | 'parts'           // อะไหล่
  | 'labor'           // ค่าแรง
  | 'travel'          // ค่าเดินทาง
  | 'outsource'       // ค่าจ้างช่างภายนอก
  | 'material'        // วัสดุสิ้นเปลือง
  | 'equipment'       // อุปกรณ์
  | 'service_fee'     // ค่าบริการ
  | 'other'           // อื่นๆ

// Approval status enum
export type ApprovalStatus =
  | 'draft'           // ร่าง
  | 'pending'         // รอการอนุมัติ
  | 'approved'        // อนุมัติแล้ว
  | 'rejected'        // ไม่อนุมัติ
  | 'paid'            // จ่ายเงินแล้ว

// Disbursement status enum
export type DisbursementStatus =
  | 'draft'           // ร่าง
  | 'submitted'       // ส่งให้บัญชีแล้ว
  | 'processing'      // กำลังดำเนินการ
  | 'paid'            // จ่ายแล้ว
  | 'cancelled'       // ยกเลิก

// Expense category table type
export interface ExpenseCategory {
  id: string
  organization_id: string | null
  code: string
  name: string
  description: string | null
  default_type: ExpenseCategoryType | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Vendor invoice table type
export interface VendorInvoice {
  id: string
  organization_id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  vendor_id: string | null
  request_id: string | null
  branch_id: string | null
  subtotal: number
  vat_percent: number
  vat_amount: number
  total_amount: number
  status: ApprovalStatus
  notes: string | null
  attachment_url: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  vendor?: Vendor
  request?: MaintenanceRequest
  branch?: Branch
  creator?: Profile
  items?: VendorInvoiceItem[]
}

// Vendor invoice item table type
export interface VendorInvoiceItem {
  id: string
  invoice_id: string
  description: string
  category_id: string | null
  quantity: number
  unit: string
  unit_price: number
  amount: number
  request_id: string | null
  sort_order: number
  created_at: string
  // Relations
  category?: ExpenseCategory
  request?: MaintenanceRequest
}

// Expense record table type
export interface ExpenseRecord {
  id: string
  organization_id: string
  category_id: string | null
  source_type: 'invoice' | 'direct' | 'petty_cash'
  invoice_id: string | null
  invoice_item_id: string | null
  request_id: string | null
  branch_id: string | null
  description: string
  amount: number
  expense_date: string
  vendor_id: string | null
  status: ApprovalStatus
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  category?: ExpenseCategory
  invoice?: VendorInvoice
  request?: MaintenanceRequest
  branch?: Branch
  vendor?: Vendor
  creator?: Profile
}

// Approval threshold table type
export interface ApprovalThreshold {
  id: string
  organization_id: string
  min_amount: number
  max_amount: number | null
  approver_role: RoleEnum
  approver_id: string | null
  approval_level: number
  is_active: boolean
  created_at: string
  // Relations
  approver?: Profile
}

// Approval request table type
export interface ApprovalRequest {
  id: string
  organization_id: string
  record_type: 'invoice' | 'expense' | 'disbursement'
  record_id: string
  amount: number
  status: ApprovalStatus
  current_level: number
  required_levels: number
  requester_notes: string | null
  requested_by: string
  requested_at: string
  completed_at: string | null
  // Relations
  requester?: Profile
  logs?: ApprovalLog[]
}

// Approval log table type
export interface ApprovalLog {
  id: string
  approval_request_id: string
  approval_level: number
  action: 'approved' | 'rejected' | 'returned'
  approved_by: string
  approved_at: string
  comments: string | null
  // Relations
  approver?: Profile
}

// Disbursement request table type
export interface DisbursementRequest {
  id: string
  organization_id: string
  document_number: string
  document_date: string
  payee_type: 'vendor' | 'employee'
  vendor_id: string | null
  employee_id: string | null
  payee_name: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_name: string | null
  total_amount: number
  status: DisbursementStatus
  approval_status: ApprovalStatus
  paid_at: string | null
  paid_reference: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  vendor?: Vendor
  employee?: Profile
  creator?: Profile
  items?: DisbursementItem[]
}

// Disbursement item table type
export interface DisbursementItem {
  id: string
  disbursement_id: string
  expense_id: string | null
  invoice_id: string | null
  description: string
  amount: number
  sort_order: number
  created_at: string
  // Relations
  expense?: ExpenseRecord
  invoice?: VendorInvoice
}

// Extended vendor type with new fields
export interface VendorExtended extends Vendor {
  organization_id: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_name: string | null
  tax_id: string | null
}

// =====================================================
// PERMISSIONS SYSTEM TYPES
// =====================================================

// Permission category
export type PermissionCategory =
  | 'requests'
  | 'users'
  | 'admin'
  | 'reports'
  | 'finance'

// Permission table type
export interface Permission {
  id: string
  code: string
  name: string
  description: string | null
  category: PermissionCategory
  created_at: string
}

// User permission table type
export interface UserPermission {
  id: string
  user_id: string
  permission_id: string
  granted_by: string | null
  granted_at: string
}

// Permission codes for type safety
export type PermissionCode =
  | 'requests.create'
  | 'requests.view_all'
  | 'requests.assign'
  | 'requests.edit'
  | 'requests.delete'
  | 'users.view'
  | 'users.edit'
  | 'users.permissions'
  | 'branches.manage'
  | 'equipment.manage'
  | 'vendors.manage'
  | 'reports.view'
  | 'reports.export'
  | 'expenses.view'
  | 'expenses.approve'
  | 'settings.manage'
