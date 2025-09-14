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
      clientes: {
        Row: {
          ativo: boolean
          cep: string | null
          cidade: string | null
          created_at: string
          data_cadastro: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          created_at?: string
          data_cadastro?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          created_at?: string
          data_cadastro?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      ordem_itens: {
        Row: {
          id: string
          ordem_id: string
          tipo_item: 'PRODUTO' | 'SERVICO'
          descricao: string
          quantidade: number
          valor_unitario: number
          desconto: number
          valor_total: number
          produto_id: string | null
          servico_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ordem_id: string
          tipo_item: 'PRODUTO' | 'SERVICO'
          descricao: string
          quantidade?: number
          valor_unitario: number
          desconto?: number
          valor_total?: number
          produto_id?: string | null
          servico_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ordem_id?: string
          tipo_item?: 'PRODUTO' | 'SERVICO'
          descricao?: string
          quantidade?: number
          valor_unitario?: number
          desconto?: number
          valor_total?: number
          produto_id?: string | null
          servico_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordem_itens_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordem_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordem_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          }
        ]
      }
      marcas: {
        Row: {
          created_at: string
          id: string
          marca: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          marca: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          marca?: string
          updated_at?: string
        }
        Relationships: []
      }
      ordens_servico: {
        Row: {
          created_at: string
          data_entrega: string | null
          data_os: string
          defeito: string | null
          equipamento: string
          forma_pagamento: string | null
          id: string
          marca: string | null
          modelo: string | null
          nome_cliente: string
          observacoes: string | null
          produtos: string | null
          servico: string | null
          status_os: string
          telefone: string
          updated_at: string
          valor_pago: number
          valor_restante: number
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_entrega?: string | null
          data_os?: string
          defeito?: string | null
          equipamento: string
          forma_pagamento?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome_cliente: string
          observacoes?: string | null
          produtos?: string | null
          servico?: string | null
          status_os?: string
          telefone: string
          updated_at?: string
          valor_pago?: number
          valor_restante?: number
          valor_total?: number
        }
        Update: {
          created_at?: string
          data_entrega?: string | null
          data_os?: string
          defeito?: string | null
          equipamento?: string
          forma_pagamento?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome_cliente?: string
          observacoes?: string | null
          produtos?: string | null
          servico?: string | null
          status_os?: string
          telefone?: string
          updated_at?: string
          valor_pago?: number
          valor_restante?: number
          valor_total?: number
        }
        Relationships: []
      }
      produtos: {
        Row: {
          created_at: string
          id: string
          novo: boolean
          produto: string
          updated_at: string
          usado: boolean
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          novo?: boolean
          produto: string
          updated_at?: string
          usado?: boolean
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          novo?: boolean
          produto?: string
          updated_at?: string
          usado?: boolean
          valor?: number
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          servico: string
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          servico: string
          updated_at?: string
          valor: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          servico?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      status_sistema: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_equipamentos: {
        Row: {
          created_at: string
          id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_relatorio_clientes: {
        Args: Record<PropertyKey, never>
        Returns: {
          cliente_id: string
          nome_cliente: string
          telefone: string
          total_ordens: number
          valor_total_gasto: number
          valor_total_pago: number
          valor_total_restante: number
          ultima_ordem: string
        }[]
      }
      salvar_os_com_itens: {
        Args: {
          p_ordem: {
            nome_cliente: string
            telefone: string
            equipamento: string
            marca?: string
            modelo?: string
            defeito?: string
            observacoes?: string
            status_os?: string
            forma_pagamento?: string
            data_entrega?: string
          }
          p_itens: {
            tipo_item: 'PRODUTO' | 'SERVICO'
            descricao: string
            quantidade: number
            valor_unitario: number
            desconto?: number
            produto_id?: string
            servico_id?: string
          }[]
        }
        Returns: {
          id: string
          valor_total: number
        }
      }
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
