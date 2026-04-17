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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cctv_products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image: string
          name: string
          price: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image?: string
          name: string
          price: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image?: string
          name?: string
          price?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_catalogue: {
        Row: {
          billing_price: number
          brand: string
          category: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          model: string
          mrp: number
          nlc_price: number
          online_price: number
          sale_price: number
          specs: string | null
          stock_qty: number
          updated_at: string
        }
        Insert: {
          billing_price?: number
          brand: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          model: string
          mrp?: number
          nlc_price?: number
          online_price?: number
          sale_price?: number
          specs?: string | null
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          billing_price?: number
          brand?: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          model?: string
          mrp?: number
          nlc_price?: number
          online_price?: number
          sale_price?: number
          specs?: string | null
          stock_qty?: number
          updated_at?: string
        }
        Relationships: []
      }
      crm_customers: {
        Row: {
          address: string | null
          created_at: string
          dob: string | null
          email: string | null
          id: string
          last_purchase_date: string | null
          name: string
          notes: string | null
          phone: string
          total_purchases: number
          total_value: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          id?: string
          last_purchase_date?: string | null
          name: string
          notes?: string | null
          phone: string
          total_purchases?: number
          total_value?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          id?: string
          last_purchase_date?: string | null
          name?: string
          notes?: string | null
          phone?: string
          total_purchases?: number
          total_value?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      crm_enquiries: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget: number | null
          created_at: string
          customer_name: string
          description: string | null
          id: string
          item_name: string | null
          notes: string | null
          phone: string
          product_category: string
          source: string
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget?: number | null
          created_at?: string
          customer_name: string
          description?: string | null
          id?: string
          item_name?: string | null
          notes?: string | null
          phone: string
          product_category?: string
          source?: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget?: number | null
          created_at?: string
          customer_name?: string
          description?: string | null
          id?: string
          item_name?: string | null
          notes?: string | null
          phone?: string
          product_category?: string
          source?: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      crm_quote_shares: {
        Row: {
          catalogue_id: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          is_active: boolean
          share_link: string
          shared_config: string | null
          shared_price: number
          updated_at: string
          valid_until: string
        }
        Insert: {
          catalogue_id?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_active?: boolean
          share_link?: string
          shared_config?: string | null
          shared_price?: number
          updated_at?: string
          valid_until?: string
        }
        Update: {
          catalogue_id?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_active?: boolean
          share_link?: string
          shared_config?: string | null
          shared_price?: number
          updated_at?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_quote_shares_catalogue_id_fkey"
            columns: ["catalogue_id"]
            isOneToOne: false
            referencedRelation: "crm_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sales: {
        Row: {
          address: string | null
          created_at: string
          customer_dob: string | null
          customer_name: string
          discount: number
          enquiry_id: string | null
          id: string
          invoice_no: string
          item_id: string | null
          item_name: string
          notes: string | null
          payment_mode: string
          payment_status: string
          phone: string
          qty: number
          sale_date: string
          sale_price: number
          total_amount: number
          updated_at: string
          warranty_expiry: string | null
          warranty_months: number
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_dob?: string | null
          customer_name: string
          discount?: number
          enquiry_id?: string | null
          id?: string
          invoice_no: string
          item_id?: string | null
          item_name: string
          notes?: string | null
          payment_mode?: string
          payment_status?: string
          phone: string
          qty?: number
          sale_date?: string
          sale_price?: number
          total_amount?: number
          updated_at?: string
          warranty_expiry?: string | null
          warranty_months?: number
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_dob?: string | null
          customer_name?: string
          discount?: number
          enquiry_id?: string | null
          id?: string
          invoice_no?: string
          item_id?: string | null
          item_name?: string
          notes?: string | null
          payment_mode?: string
          payment_status?: string
          phone?: string
          qty?: number
          sale_date?: string
          sale_price?: number
          total_amount?: number
          updated_at?: string
          warranty_expiry?: string | null
          warranty_months?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_sales_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "crm_enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sales_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "crm_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_services: {
        Row: {
          brand: string | null
          created_at: string
          customer_name: string
          delivery_date: string | null
          device_type: string
          estimated_cost: number | null
          final_cost: number | null
          id: string
          issue_description: string | null
          job_card_no: string
          model: string | null
          phone: string
          received_date: string
          status: string
          technician_notes: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          customer_name: string
          delivery_date?: string | null
          device_type: string
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          issue_description?: string | null
          job_card_no: string
          model?: string | null
          phone: string
          received_date?: string
          status?: string
          technician_notes?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          customer_name?: string
          delivery_date?: string | null
          device_type?: string
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          issue_description?: string | null
          job_card_no?: string
          model?: string | null
          phone?: string
          received_date?: string
          status?: string
          technician_notes?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      crm_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      crm_user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["crm_app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["crm_app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["crm_app_role"]
          user_id?: string
        }
        Relationships: []
      }
      crm_warranty_reminders: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          item_name: string | null
          phone: string
          purchase_date: string | null
          reminder_type: string
          sale_id: string | null
          scheduled_date: string
          sent_at: string | null
          status: string
          updated_at: string
          warranty_expiry: string | null
          whatsapp: string | null
          whatsapp_message: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          item_name?: string | null
          phone: string
          purchase_date?: string | null
          reminder_type: string
          sale_id?: string | null
          scheduled_date: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
          whatsapp?: string | null
          whatsapp_message?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          item_name?: string | null
          phone?: string
          purchase_date?: string | null
          reminder_type?: string
          sale_id?: string | null
          scheduled_date?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
          whatsapp?: string | null
          whatsapp_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_warranty_reminders_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "crm_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_whatsapp_templates: {
        Row: {
          created_at: string
          id: string
          message_body: string
          template_name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_body: string
          template_name: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_body?: string
          template_name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_deals: {
        Row: {
          created_at: string
          deal_price: string
          display_order: number
          id: string
          image: string
          name: string
          original_price: string
          updated_at: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          deal_price: string
          display_order?: number
          id?: string
          image?: string
          name: string
          original_price: string
          updated_at?: string
          valid_until?: string
        }
        Update: {
          created_at?: string
          deal_price?: string
          display_order?: number
          id?: string
          image?: string
          name?: string
          original_price?: string
          updated_at?: string
          valid_until?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          display_order: number
          id: string
          image: string
          is_new: boolean
          name: string
          price: string
          specs: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          image?: string
          is_new?: boolean
          name: string
          price: string
          specs?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          image?: string
          is_new?: boolean
          name?: string
          price?: string
          specs?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon_name: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      youtube_videos: {
        Row: {
          created_at: string
          display_order: number
          embed_url: string
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          embed_url: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          embed_url?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_crm_role: {
        Args: {
          _role: Database["public"]["Enums"]["crm_app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_crm_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      crm_app_role: "crm_user" | "crm_admin"
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
      crm_app_role: ["crm_user", "crm_admin"],
    },
  },
} as const
