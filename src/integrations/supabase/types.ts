export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          active: boolean
          created_at: string
          id: string
          key: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          key?: string
          last_used_at?: string | null
          name?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          key?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          cpf_cnpj: string
          created_at: string
          data_inicio: string
          data_prevista_conclusao: string
          email: string
          endereco_obra: string
          id: string
          nome_cliente: string
          nome_empreitada: string
          observacoes: string
          status: string
          telefone: string
          updated_at: string
        }
        Insert: {
          cpf_cnpj?: string
          created_at?: string
          data_inicio?: string
          data_prevista_conclusao?: string
          email?: string
          endereco_obra?: string
          id?: string
          nome_cliente: string
          nome_empreitada: string
          observacoes?: string
          status?: string
          telefone?: string
          updated_at?: string
        }
        Update: {
          cpf_cnpj?: string
          created_at?: string
          data_inicio?: string
          data_prevista_conclusao?: string
          email?: string
          endereco_obra?: string
          id?: string
          nome_cliente?: string
          nome_empreitada?: string
          observacoes?: string
          status?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      demandas: {
        Row: {
          created_at: string
          data_notificacao: string
          descricao: string
          id: string
          intervalo_dias: number | null
          prioridade: string
          sazonal: boolean
          status: string
          titulo: string
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          data_notificacao: string
          descricao?: string
          id?: string
          intervalo_dias?: number | null
          prioridade?: string
          sazonal?: boolean
          status?: string
          titulo: string
          updated_at?: string
          webhook_url?: string
        }
        Update: {
          created_at?: string
          data_notificacao?: string
          descricao?: string
          id?: string
          intervalo_dias?: number | null
          prioridade?: string
          sazonal?: boolean
          status?: string
          titulo?: string
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      export_jobs: {
        Row: {
          client_id: string | null
          created_at: string | null
          error: string | null
          file_path: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          error?: string | null
          file_path?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          error?: string | null
          file_path?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "export_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          status?: string
        }
        Relationships: []
      }
      print_tokens: {
        Row: {
          client_id: string | null
          created_at: string | null
          date_from: string | null
          date_to: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "print_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      report_entries: {
        Row: {
          atividades_dia: string
          condicoes_climaticas: string
          created_at: string
          data_relato: string
          equipe: string
          ferramentas_ids: string[]
          id: string
          observacoes: string
          report_id: string
        }
        Insert: {
          atividades_dia?: string
          condicoes_climaticas?: string
          created_at?: string
          data_relato: string
          equipe?: string
          ferramentas_ids?: string[]
          id?: string
          observacoes?: string
          report_id: string
        }
        Update: {
          atividades_dia?: string
          condicoes_climaticas?: string
          created_at?: string
          data_relato?: string
          equipe?: string
          ferramentas_ids?: string[]
          id?: string
          observacoes?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_entries_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_images: {
        Row: {
          created_at: string
          entry_id: string | null
          filename: string
          id: string
          report_id: string
          url: string
        }
        Insert: {
          created_at?: string
          entry_id?: string | null
          filename?: string
          id?: string
          report_id: string
          url: string
        }
        Update: {
          created_at?: string
          entry_id?: string | null
          filename?: string
          id?: string
          report_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_images_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "report_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_images_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          client_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          categoria: string
          client_id: string | null
          codigo_patrimonio: string
          created_at: string
          descricao: string
          id: string
          nome: string
          status: string
        }
        Insert: {
          categoria?: string
          client_id?: string | null
          codigo_patrimonio?: string
          created_at?: string
          descricao?: string
          id?: string
          nome: string
          status?: string
        }
        Update: {
          categoria?: string
          client_id?: string | null
          codigo_patrimonio?: string
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          status?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          permission_key: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          permission_key: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          permission_key?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: string
          status_code: number
          webhook_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: string
          status_code?: number
          webhook_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: string
          status_code?: number
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          active: boolean
          created_at: string
          event_type: string
          id: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event_type: string
          id?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event_type?: string
          id?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
