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
      branches: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          region: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
          region?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          region?: string | null
        }
        Relationships: []
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
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          assigned_user_id: string | null
          assigned_vendor_id: string | null
          branch_id: string
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_at: string | null
          estimated_cost: number | null
          id: string
          priority: Database["public"]["Enums"]["priority_enum"]
          sla_hours: number | null
          status: Database["public"]["Enums"]["status_enum"]
          title: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_user_id?: string | null
          assigned_vendor_id?: string | null
          branch_id: string
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_at?: string | null
          estimated_cost?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_enum"]
          sla_hours?: number | null
          status?: Database["public"]["Enums"]["status_enum"]
          title: string
        }
        Update: {
          actual_cost?: number | null
          assigned_user_id?: string | null
          assigned_vendor_id?: string | null
          branch_id?: string
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_at?: string | null
          estimated_cost?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_enum"]
          sla_hours?: number | null
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
        ]
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["role_enum"]
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
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
      get_user_branch_id: { Args: Record<PropertyKey, never>; Returns: string }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["role_enum"]
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: {
      attachment_type_enum: "image" | "receipt" | "worksheet"
      priority_enum: "low" | "medium" | "high" | "critical"
      role_enum: "branch" | "admin" | "technician" | "vendor"
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

export type RoleEnum = Enums<"role_enum">
export type PriorityEnum = Enums<"priority_enum">
export type StatusEnum = Enums<"status_enum">
export type AttachmentTypeEnum = Enums<"attachment_type_enum">
