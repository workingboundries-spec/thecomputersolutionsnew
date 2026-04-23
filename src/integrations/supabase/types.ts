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
      admin_customer_settings: {
        Row: {
          colour: string | null
          created_at: string
          id: string
          is_active: boolean
          setting_type: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          colour?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          setting_type: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          colour?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          setting_type?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      admin_reminder_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      banner_slides: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string | null
          heading: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          sort_order: number | null
          subheading: string | null
          updated_at: string | null
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          heading?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          subheading?: string | null
          updated_at?: string | null
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          heading?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          subheading?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      campaign_recipients: {
        Row: {
          campaign_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          personalised_message: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          personalised_message?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          personalised_message?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message_body: string
          name: string
          placeholders_used: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message_body: string
          name: string
          placeholders_used?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message_body?: string
          name?: string
          placeholders_used?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          filters_snapshot: Json | null
          id: string
          message_body: string
          name: string
          sent_count: number
          skipped_count: number
          status: string
          total_targeted: number
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filters_snapshot?: Json | null
          id?: string
          message_body: string
          name: string
          sent_count?: number
          skipped_count?: number
          status?: string
          total_targeted?: number
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filters_snapshot?: Json | null
          id?: string
          message_body?: string
          name?: string
          sent_count?: number
          skipped_count?: number
          status?: string
          total_targeted?: number
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      crm_admin_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_type?: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
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
          current_stock: number
          id: string
          image_url: string | null
          is_active: boolean
          item_code: string
          model: string
          mrp: number
          nlc_price: number
          online_price: number
          opening_stock: number
          reorder_level: number
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
          current_stock?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_code?: string
          model: string
          mrp?: number
          nlc_price?: number
          online_price?: number
          opening_stock?: number
          reorder_level?: number
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
          current_stock?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_code?: string
          model?: string
          mrp?: number
          nlc_price?: number
          online_price?: number
          opening_stock?: number
          reorder_level?: number
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
          anniversary_date: string | null
          city: string | null
          created_at: string
          dob: string | null
          email: string | null
          id: string
          last_purchase_date: string | null
          name: string
          notes: string | null
          occupation: string | null
          phone: string
          photo_url: string | null
          rank: string | null
          source_mode: string | null
          total_purchases: number
          total_value: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          anniversary_date?: string | null
          city?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          id?: string
          last_purchase_date?: string | null
          name: string
          notes?: string | null
          occupation?: string | null
          phone: string
          photo_url?: string | null
          rank?: string | null
          source_mode?: string | null
          total_purchases?: number
          total_value?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          anniversary_date?: string | null
          city?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          id?: string
          last_purchase_date?: string | null
          name?: string
          notes?: string | null
          occupation?: string | null
          phone?: string
          photo_url?: string | null
          rank?: string | null
          source_mode?: string | null
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
          is_converted: boolean
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
          is_converted?: boolean
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
          is_converted?: boolean
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
      crm_quotations: {
        Row: {
          address: string | null
          created_at: string
          customer_name: string
          discount: number
          email: string | null
          enquiry_id: string | null
          gst_amount: number
          gst_percent: number
          id: string
          items: Json
          notes: string | null
          phone: string | null
          quote_no: string
          status: string
          subtotal: number
          terms: string | null
          total_amount: number
          updated_at: string
          validity_date: string | null
          validity_days: number
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_name: string
          discount?: number
          email?: string | null
          enquiry_id?: string | null
          gst_amount?: number
          gst_percent?: number
          id?: string
          items?: Json
          notes?: string | null
          phone?: string | null
          quote_no: string
          status?: string
          subtotal?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string
          validity_date?: string | null
          validity_days?: number
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_name?: string
          discount?: number
          email?: string | null
          enquiry_id?: string | null
          gst_amount?: number
          gst_percent?: number
          id?: string
          items?: Json
          notes?: string | null
          phone?: string | null
          quote_no?: string
          status?: string
          subtotal?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string
          validity_date?: string | null
          validity_days?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_quotations_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "crm_enquiries"
            referencedColumns: ["id"]
          },
        ]
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
          is_deleted: boolean
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
          is_deleted?: boolean
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
          is_deleted?: boolean
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
      crm_stock_audit_log: {
        Row: {
          audit_date: string
          audit_month: string
          brand: string | null
          catalogue_id: string | null
          created_at: string
          entered_by: string | null
          id: string
          item_name: string | null
          model: string | null
          notes: string | null
          opening_stock: number
          physical_count: number
          sold_qty: number
          variance: number
        }
        Insert: {
          audit_date?: string
          audit_month: string
          brand?: string | null
          catalogue_id?: string | null
          created_at?: string
          entered_by?: string | null
          id?: string
          item_name?: string | null
          model?: string | null
          notes?: string | null
          opening_stock?: number
          physical_count?: number
          sold_qty?: number
          variance?: number
        }
        Update: {
          audit_date?: string
          audit_month?: string
          brand?: string | null
          catalogue_id?: string | null
          created_at?: string
          entered_by?: string | null
          id?: string
          item_name?: string | null
          model?: string | null
          notes?: string | null
          opening_stock?: number
          physical_count?: number
          sold_qty?: number
          variance?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_stock_audit_log_catalogue_id_fkey"
            columns: ["catalogue_id"]
            isOneToOne: false
            referencedRelation: "crm_catalogue"
            referencedColumns: ["id"]
          },
        ]
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
          message_sent: boolean
          message_sent_at: string | null
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
          message_sent?: boolean
          message_sent_at?: string | null
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
          message_sent?: boolean
          message_sent_at?: string | null
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
      crm_whatsapp_log: {
        Row: {
          campaign_id: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          id: string
          message_hint: string | null
          message_text: string | null
          message_type: string | null
          phone: string | null
          sale_id: string | null
          sent_at: string
          sent_by: string | null
          sent_from_section: string | null
          status: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          message_hint?: string | null
          message_text?: string | null
          message_type?: string | null
          phone?: string | null
          sale_id?: string | null
          sent_at?: string
          sent_by?: string | null
          sent_from_section?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          message_hint?: string | null
          message_text?: string | null
          message_type?: string | null
          phone?: string | null
          sale_id?: string | null
          sent_at?: string
          sent_by?: string | null
          sent_from_section?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_whatsapp_log_sale_id_fkey"
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
      customer_event_logs: {
        Row: {
          created_at: string
          customer_id: string | null
          event_date: string
          event_type: string
          id: string
          message_sent: string | null
          sent_at: string | null
          sent_by: string | null
          years_completed: number | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          event_date: string
          event_type: string
          id?: string
          message_sent?: string | null
          sent_at?: string | null
          sent_by?: string | null
          years_completed?: number | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          event_date?: string
          event_type?: string
          id?: string
          message_sent?: string | null
          sent_at?: string | null
          sent_by?: string | null
          years_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_event_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_deals: {
        Row: {
          created_at: string
          deal_price: string
          description: string | null
          discount_percent: number | null
          display_order: number
          id: string
          image: string
          is_active: boolean | null
          mrp: number | null
          name: string
          original_price: string
          regular_price_num: number | null
          sale_price_num: number | null
          title: string | null
          updated_at: string
          valid_until: string
          whatsapp_msg: string | null
        }
        Insert: {
          created_at?: string
          deal_price: string
          description?: string | null
          discount_percent?: number | null
          display_order?: number
          id?: string
          image?: string
          is_active?: boolean | null
          mrp?: number | null
          name: string
          original_price: string
          regular_price_num?: number | null
          sale_price_num?: number | null
          title?: string | null
          updated_at?: string
          valid_until?: string
          whatsapp_msg?: string | null
        }
        Update: {
          created_at?: string
          deal_price?: string
          description?: string | null
          discount_percent?: number | null
          display_order?: number
          id?: string
          image?: string
          is_active?: boolean | null
          mrp?: number | null
          name?: string
          original_price?: string
          regular_price_num?: number | null
          sale_price_num?: number | null
          title?: string | null
          updated_at?: string
          valid_until?: string
          whatsapp_msg?: string | null
        }
        Relationships: []
      }
      dealer_brands: {
        Row: {
          brand_name: string
          brand_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          sort_order: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          brand_name: string
          brand_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          brand_name?: string
          brand_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          name: string
          phone: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          name: string
          phone: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          status?: string | null
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
      instagram_reels: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          reel_url: string | null
          sort_order: number | null
          thumbnail_url: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reel_url?: string | null
          sort_order?: number | null
          thumbnail_url: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reel_url?: string | null
          sort_order?: number | null
          thumbnail_url?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      intro_section: {
        Row: {
          body_text: string | null
          created_at: string
          heading: string
          id: string
          is_visible: boolean
          subheading: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          body_text?: string | null
          created_at?: string
          heading?: string
          id?: string
          is_visible?: boolean
          subheading?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          body_text?: string | null
          created_at?: string
          heading?: string
          id?: string
          is_visible?: boolean
          subheading?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      inventory_audits: {
        Row: {
          action_taken: string | null
          audit_date: string
          audit_month: number
          audit_year: number
          audited_by: string | null
          closing_system_stock: number
          created_at: string
          damaged_qty: number
          id: string
          item_id: string
          notes: string | null
          opening_stock: number
          physical_count: number
          received_qty: number
          sold_qty: number
          variance: number
        }
        Insert: {
          action_taken?: string | null
          audit_date?: string
          audit_month: number
          audit_year: number
          audited_by?: string | null
          closing_system_stock?: number
          created_at?: string
          damaged_qty?: number
          id?: string
          item_id: string
          notes?: string | null
          opening_stock?: number
          physical_count?: number
          received_qty?: number
          sold_qty?: number
          variance?: number
        }
        Update: {
          action_taken?: string | null
          audit_date?: string
          audit_month?: number
          audit_year?: number
          audited_by?: string | null
          closing_system_stock?: number
          created_at?: string
          damaged_qty?: number
          id?: string
          item_id?: string
          notes?: string | null
          opening_stock?: number
          physical_count?: number
          received_qty?: number
          sold_qty?: number
          variance?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_audits_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "crm_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          balance_after: number | null
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          movement_type: string
          notes: string | null
          purchase_price: number | null
          qty: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          supplier_name: string | null
          transaction_date: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          movement_type: string
          notes?: string | null
          purchase_price?: number | null
          qty: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          supplier_name?: string | null
          transaction_date?: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          notes?: string | null
          purchase_price?: number | null
          qty?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          supplier_name?: string | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "crm_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      nav_items: {
        Row: {
          created_at: string | null
          href: string
          id: string
          is_visible: boolean | null
          label: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          href: string
          id?: string
          is_visible?: boolean | null
          label: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          href?: string
          id?: string
          is_visible?: boolean | null
          label?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          badge: string | null
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image: string
          is_active: boolean | null
          is_new: boolean
          mrp: number | null
          name: string
          price: string
          regular_price: number | null
          sale_price: number | null
          specs: string | null
          updated_at: string
          whatsapp_enquiry_msg: string | null
        }
        Insert: {
          badge?: string | null
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image?: string
          is_active?: boolean | null
          is_new?: boolean
          mrp?: number | null
          name: string
          price: string
          regular_price?: number | null
          sale_price?: number | null
          specs?: string | null
          updated_at?: string
          whatsapp_enquiry_msg?: string | null
        }
        Update: {
          badge?: string | null
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image?: string
          is_active?: boolean | null
          is_new?: boolean
          mrp?: number | null
          name?: string
          price?: string
          regular_price?: number | null
          sale_price?: number | null
          specs?: string | null
          updated_at?: string
          whatsapp_enquiry_msg?: string | null
        }
        Relationships: []
      }
      quotation_send_log: {
        Row: {
          customer_name: string | null
          email: string | null
          id: string
          phone: string | null
          quotation_id: string | null
          send_method: string | null
          sent_at: string
          status: string
          whatsapp: string | null
        }
        Insert: {
          customer_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          quotation_id?: string | null
          send_method?: string | null
          sent_at?: string
          status?: string
          whatsapp?: string | null
        }
        Update: {
          customer_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          quotation_id?: string | null
          send_method?: string | null
          sent_at?: string
          status?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_send_log_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "crm_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_templates: {
        Row: {
          created_at: string
          description: string | null
          gst_percent: number
          id: string
          is_active: boolean
          items: Json
          notes: string | null
          template_name: string
          terms: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          gst_percent?: number
          id?: string
          is_active?: boolean
          items?: Json
          notes?: string | null
          template_name: string
          terms?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          gst_percent?: number
          id?: string
          is_active?: boolean
          items?: Json
          notes?: string | null
          template_name?: string
          terms?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      reminders_queue: {
        Row: {
          created_at: string
          customer_id: string | null
          days_before: number | null
          event_date: string
          event_type: string
          event_year: number
          id: string
          sent_at: string | null
          sent_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          days_before?: number | null
          event_date: string
          event_type: string
          event_year: number
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          days_before?: number | null
          event_date?: string
          event_type?: string
          event_year?: number
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_queue_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      section_headings: {
        Row: {
          created_at: string | null
          heading: string
          id: string
          is_visible: boolean | null
          section_key: string
          subheading: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          heading: string
          id?: string
          is_visible?: boolean | null
          section_key: string
          subheading?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          heading?: string
          id?: string
          is_visible?: boolean | null
          section_key?: string
          subheading?: string | null
          updated_at?: string | null
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
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sister_concerns: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          tagline: string | null
          thumbnail_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          tagline?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          tagline?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          website_url?: string | null
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
      site_whatsapp_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          message_body: string
          placeholders: string | null
          sort_order: number
          template_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          message_body?: string
          placeholders?: string | null
          sort_order?: number
          template_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          message_body?: string
          placeholders?: string | null
          sort_order?: number
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonial_videos: {
        Row: {
          created_at: string | null
          customer_name: string
          id: string
          is_active: boolean | null
          location: string | null
          product_purchased: string | null
          rating: number | null
          review_text: string | null
          sort_order: number | null
          thumbnail_url: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          product_purchased?: string | null
          rating?: number | null
          review_text?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          product_purchased?: string | null
          rating?: number | null
          review_text?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      youtube_videos: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          embed_url: string
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          embed_url: string
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          embed_url?: string
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          youtube_url?: string | null
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
