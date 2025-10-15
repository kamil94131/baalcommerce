export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      Couriers: {
        Row: {
          camp: Database["public"]["Enums"]["camp"]
          id: number
          name: string
        }
        Insert: {
          camp: Database["public"]["Enums"]["camp"]
          id?: number
          name: string
        }
        Update: {
          camp?: Database["public"]["Enums"]["camp"]
          id?: number
          name?: string
        }
        Relationships: []
      }
      Offers: {
        Row: {
          createdAt: string
          description: string | null
          id: number
          price: number
          quantity: number
          sellerCamp: Database["public"]["Enums"]["camp"]
          sellerId: string
          sellerName: string
          status: string
          title: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: number
          price: number
          quantity: number
          sellerCamp: Database["public"]["Enums"]["camp"]
          sellerId: string
          sellerName: string
          status?: string
          title: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: number
          price?: number
          quantity?: number
          sellerCamp?: Database["public"]["Enums"]["camp"]
          sellerId?: string
          sellerName?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      Orders: {
        Row: {
          buyerCamp: Database["public"]["Enums"]["camp"]
          buyerId: string
          buyerName: string
          courierId: number
          deliveredAt: string
          id: number
          offerId: number
          price: number
          quantity: number
          sellerCamp: Database["public"]["Enums"]["camp"]
          sellerId: string
          sellerName: string
          title: string
        }
        Insert: {
          buyerCamp: Database["public"]["Enums"]["camp"]
          buyerId: string
          buyerName: string
          courierId: number
          deliveredAt?: string
          id?: number
          offerId: number
          price: number
          quantity: number
          sellerCamp: Database["public"]["Enums"]["camp"]
          sellerId: string
          sellerName: string
          title: string
        }
        Update: {
          buyerCamp?: Database["public"]["Enums"]["camp"]
          buyerId?: string
          buyerName?: string
          courierId?: number
          deliveredAt?: string
          id?: number
          offerId?: number
          price?: number
          quantity?: number
          sellerCamp?: Database["public"]["Enums"]["camp"]
          sellerId?: string
          sellerName?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "Orders_courierId_fkey"
            columns: ["courierId"]
            isOneToOne: false
            referencedRelation: "Couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Orders_offerId_fkey"
            columns: ["offerId"]
            isOneToOne: false
            referencedRelation: "Offers"
            referencedColumns: ["id"]
          },
        ]
      }
      Profiles: {
        Row: {
          camp: Database["public"]["Enums"]["camp"]
          defaultCourierId: number | null
          id: number
          name: string
          userId: string
        }
        Insert: {
          camp?: Database["public"]["Enums"]["camp"]
          defaultCourierId?: number | null
          id?: number
          name: string
          userId: string
        }
        Update: {
          camp?: Database["public"]["Enums"]["camp"]
          defaultCourierId?: number | null
          id?: number
          name?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Profiles_defaultCourierId_fkey"
            columns: ["defaultCourierId"]
            isOneToOne: false
            referencedRelation: "Couriers"
            referencedColumns: ["id"]
          },
        ]
      }
      Roles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      UserRoles: {
        Row: {
          roleId: number
          userId: string
        }
        Insert: {
          roleId: number
          userId: string
        }
        Update: {
          roleId?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserRoles_roleId_fkey"
            columns: ["roleId"]
            isOneToOne: false
            referencedRelation: "Roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { role_name: string }
        Returns: boolean
      }
    }
    Enums: {
      camp: "OLD_CAMP" | "NEW_CAMP" | "SWAMP_CAMP"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      camp: ["OLD_CAMP", "NEW_CAMP", "SWAMP_CAMP"],
    },
  },
} as const

