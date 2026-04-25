-- Safe incremental migration | No destructive ops | Idempotent
BEGIN;

-- =========================================================
-- 1. EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 2. ENUMS / CUSTOM TYPES
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.crm_app_role AS ENUM ('crm_user', 'crm_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 3. SEQUENCES
-- =========================================================
CREATE SEQUENCE IF NOT EXISTS public.crm_catalogue_code_seq START 1;

-- =========================================================
-- 4. TABLES (CREATE IF NOT EXISTS) + ADD COLUMN IF NOT EXISTS
-- =========================================================

-- admin_customer_settings
CREATE TABLE IF NOT EXISTS public.admin_customer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_type text NOT NULL,
  value text NOT NULL,
  colour text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- admin_reminder_settings
CREATE TABLE IF NOT EXISTS public.admin_reminder_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  setting_value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- banner_slides
CREATE TABLE IF NOT EXISTS public.banner_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  heading text,
  subheading text,
  button_text text,
  button_link text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message_body text NOT NULL,
  type text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  total_targeted integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  filters_snapshot jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_customers
CREATE TABLE IF NOT EXISTS public.crm_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  email text,
  address text,
  city text,
  dob date,
  anniversary_date date,
  occupation text,
  rank text,
  source_mode text,
  notes text,
  photo_url text,
  total_purchases integer NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  last_purchase_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- campaign_recipients
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.crm_customers(id) ON DELETE SET NULL,
  personalised_message text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- campaign_templates
CREATE TABLE IF NOT EXISTS public.campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message_body text NOT NULL,
  type text,
  placeholders_used text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- cctv_products
CREATE TABLE IF NOT EXISTS public.cctv_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price text NOT NULL,
  image text NOT NULL DEFAULT '',
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Dome',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_admin_settings
CREATE TABLE IF NOT EXISTS public.crm_admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  setting_value text NOT NULL DEFAULT '',
  setting_type text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_catalogue
CREATE TABLE IF NOT EXISTS public.crm_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text NOT NULL DEFAULT '',
  brand text NOT NULL,
  model text NOT NULL,
  category text NOT NULL DEFAULT 'laptop',
  specs text,
  image_url text,
  mrp numeric NOT NULL DEFAULT 0,
  nlc_price numeric NOT NULL DEFAULT 0,
  sale_price numeric NOT NULL DEFAULT 0,
  online_price numeric NOT NULL DEFAULT 0,
  billing_price numeric NOT NULL DEFAULT 0,
  stock_qty integer NOT NULL DEFAULT 0,
  current_stock integer NOT NULL DEFAULT 0,
  opening_stock integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_enquiries
CREATE TABLE IF NOT EXISTS public.crm_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  address text,
  product_category text NOT NULL DEFAULT 'laptop',
  item_name text,
  budget numeric,
  description text,
  source text NOT NULL DEFAULT 'walkin',
  status text NOT NULL DEFAULT 'new',
  assigned_to text,
  notes text,
  is_converted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_quotations
CREATE TABLE IF NOT EXISTS public.crm_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_no text NOT NULL,
  enquiry_id uuid REFERENCES public.crm_enquiries(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  phone text,
  whatsapp text,
  email text,
  address text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  gst_percent numeric NOT NULL DEFAULT 18,
  gst_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  validity_days integer NOT NULL DEFAULT 7,
  validity_date date,
  terms text,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_quote_shares
CREATE TABLE IF NOT EXISTS public.crm_quote_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogue_id uuid REFERENCES public.crm_catalogue(id) ON DELETE SET NULL,
  share_link uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_name text,
  customer_phone text,
  shared_config text,
  shared_price numeric NOT NULL DEFAULT 0,
  valid_until date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_sales
CREATE TABLE IF NOT EXISTS public.crm_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text NOT NULL,
  enquiry_id uuid REFERENCES public.crm_enquiries(id) ON DELETE SET NULL,
  item_id uuid REFERENCES public.crm_catalogue(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_dob date,
  phone text NOT NULL,
  whatsapp text,
  address text,
  item_name text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  sale_price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT 'cash',
  payment_status text NOT NULL DEFAULT 'paid',
  warranty_months integer NOT NULL DEFAULT 12,
  warranty_expiry date,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_services
CREATE TABLE IF NOT EXISTS public.crm_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_no text NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  device_type text NOT NULL,
  brand text,
  model text,
  issue_description text,
  status text NOT NULL DEFAULT 'received',
  estimated_cost numeric DEFAULT 0,
  final_cost numeric DEFAULT 0,
  technician_notes text,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_settings
CREATE TABLE IF NOT EXISTS public.crm_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_stock_audit_log
CREATE TABLE IF NOT EXISTS public.crm_stock_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogue_id uuid REFERENCES public.crm_catalogue(id) ON DELETE SET NULL,
  audit_date date NOT NULL DEFAULT CURRENT_DATE,
  audit_month text NOT NULL,
  brand text,
  model text,
  item_name text,
  opening_stock integer NOT NULL DEFAULT 0,
  sold_qty integer NOT NULL DEFAULT 0,
  physical_count integer NOT NULL DEFAULT 0,
  variance integer NOT NULL DEFAULT 0,
  entered_by text DEFAULT 'admin',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- crm_user_roles
CREATE TABLE IF NOT EXISTS public.crm_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.crm_app_role NOT NULL DEFAULT 'crm_user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- crm_warranty_reminders
CREATE TABLE IF NOT EXISTS public.crm_warranty_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.crm_sales(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  item_name text,
  purchase_date date,
  warranty_expiry date,
  reminder_type text NOT NULL,
  scheduled_date date NOT NULL,
  whatsapp_message text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  message_sent boolean NOT NULL DEFAULT false,
  message_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_whatsapp_log
CREATE TABLE IF NOT EXISTS public.crm_whatsapp_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.crm_sales(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.crm_customers(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  customer_name text,
  phone text,
  message_text text,
  message_type text,
  message_hint text,
  sent_from_section text,
  sent_by uuid,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- crm_whatsapp_templates
CREATE TABLE IF NOT EXISTS public.crm_whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_type text NOT NULL DEFAULT 'warranty',
  message_body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- customer_event_logs
CREATE TABLE IF NOT EXISTS public.customer_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL,
  years_completed integer,
  message_sent text,
  sent_at timestamptz DEFAULT now(),
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- daily_deals
CREATE TABLE IF NOT EXISTS public.daily_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  description text,
  image text NOT NULL DEFAULT '',
  original_price text NOT NULL,
  deal_price text NOT NULL,
  mrp numeric,
  regular_price_num numeric,
  sale_price_num numeric,
  discount_percent numeric,
  whatsapp_msg text,
  valid_until date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- dealer_brands
CREATE TABLE IF NOT EXISTS public.dealer_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  logo_url text,
  website_url text,
  brand_type text DEFAULT 'dealer',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- enquiries
CREATE TABLE IF NOT EXISTS public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  message text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- gallery_images
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- instagram_reels
CREATE TABLE IF NOT EXISTS public.instagram_reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thumbnail_url text NOT NULL,
  reel_url text,
  title text,
  caption text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- intro_section
CREATE TABLE IF NOT EXISTS public.intro_section (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  heading text NOT NULL DEFAULT 'About Computer Solutions',
  subheading text,
  body_text text,
  youtube_url text,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- inventory_audits
CREATE TABLE IF NOT EXISTS public.inventory_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.crm_catalogue(id) ON DELETE CASCADE,
  audit_month integer NOT NULL,
  audit_year integer NOT NULL,
  audit_date timestamptz NOT NULL DEFAULT now(),
  opening_stock integer NOT NULL DEFAULT 0,
  received_qty integer NOT NULL DEFAULT 0,
  sold_qty integer NOT NULL DEFAULT 0,
  damaged_qty integer NOT NULL DEFAULT 0,
  closing_system_stock integer NOT NULL DEFAULT 0,
  physical_count integer NOT NULL DEFAULT 0,
  variance integer NOT NULL DEFAULT 0,
  action_taken text,
  notes text,
  audited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- inventory_transactions
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.crm_catalogue(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  qty integer NOT NULL,
  balance_after integer,
  reference_id uuid,
  reference_type text,
  supplier_name text,
  purchase_price numeric,
  reason text,
  notes text,
  created_by uuid,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- nav_items
CREATE TABLE IF NOT EXISTS public.nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  sort_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Business',
  price text NOT NULL,
  mrp numeric,
  sale_price numeric,
  regular_price numeric,
  image text NOT NULL DEFAULT '',
  badge text,
  specs text DEFAULT '',
  whatsapp_enquiry_msg text,
  is_new boolean NOT NULL DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- quotation_send_log
CREATE TABLE IF NOT EXISTS public.quotation_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES public.crm_quotations(id) ON DELETE CASCADE,
  customer_name text,
  phone text,
  whatsapp text,
  email text,
  send_method text,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- quotation_templates
CREATE TABLE IF NOT EXISTS public.quotation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  description text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  gst_percent numeric NOT NULL DEFAULT 18,
  terms text,
  notes text,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- reminders_queue
CREATE TABLE IF NOT EXISTS public.reminders_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL,
  event_year integer NOT NULL,
  days_before integer,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- section_headings
CREATE TABLE IF NOT EXISTS public.section_headings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL,
  heading text NOT NULL,
  subheading text,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- seo_meta_tags
CREATE TABLE IF NOT EXISTS public.seo_meta_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  page_label text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  keywords text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text,
  og_url text,
  twitter_card text,
  structured_data jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon_name text NOT NULL DEFAULT '',
  thumbnail_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- sister_concerns
CREATE TABLE IF NOT EXISTS public.sister_concerns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  description text,
  thumbnail_url text,
  website_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- site_whatsapp_templates
CREATE TABLE IF NOT EXISTS public.site_whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL,
  label text NOT NULL,
  description text,
  message_body text NOT NULL DEFAULT '',
  placeholders text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- testimonial_videos
CREATE TABLE IF NOT EXISTS public.testimonial_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  location text,
  product_purchased text,
  rating numeric,
  review_text text,
  video_url text,
  thumbnail_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- youtube_videos
CREATE TABLE IF NOT EXISTS public.youtube_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embed_url text NOT NULL,
  youtube_url text,
  title text,
  description text,
  thumbnail_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- 5. ADD COLUMN IF NOT EXISTS (safety net for older DBs)
-- =========================================================
ALTER TABLE public.crm_customers      ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.crm_customers      ADD COLUMN IF NOT EXISTS anniversary_date date;
ALTER TABLE public.crm_customers      ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE public.crm_customers      ADD COLUMN IF NOT EXISTS rank text;
ALTER TABLE public.crm_customers      ADD COLUMN IF NOT EXISTS source_mode text;
ALTER TABLE public.crm_customers      ADD COLUMN IF NOT EXISTS photo_url text;

ALTER TABLE public.crm_catalogue      ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.crm_catalogue      ADD COLUMN IF NOT EXISTS online_price numeric NOT NULL DEFAULT 0;
ALTER TABLE public.crm_catalogue      ADD COLUMN IF NOT EXISTS billing_price numeric NOT NULL DEFAULT 0;
ALTER TABLE public.crm_catalogue      ADD COLUMN IF NOT EXISTS opening_stock integer NOT NULL DEFAULT 0;
ALTER TABLE public.crm_catalogue      ADD COLUMN IF NOT EXISTS current_stock integer NOT NULL DEFAULT 0;
ALTER TABLE public.crm_catalogue      ADD COLUMN IF NOT EXISTS reorder_level integer NOT NULL DEFAULT 0;
ALTER TABLE public.crm_catalogue      ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.crm_catalogue      ADD COLUMN IF NOT EXISTS mrp numeric NOT NULL DEFAULT 0;

ALTER TABLE public.crm_sales          ADD COLUMN IF NOT EXISTS customer_dob date;
ALTER TABLE public.crm_sales          ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE public.products           ADD COLUMN IF NOT EXISTS mrp numeric;
ALTER TABLE public.products           ADD COLUMN IF NOT EXISTS sale_price numeric;
ALTER TABLE public.products           ADD COLUMN IF NOT EXISTS regular_price numeric;
ALTER TABLE public.products           ADD COLUMN IF NOT EXISTS whatsapp_enquiry_msg text;

ALTER TABLE public.daily_deals        ADD COLUMN IF NOT EXISTS mrp numeric;
ALTER TABLE public.daily_deals        ADD COLUMN IF NOT EXISTS regular_price_num numeric;
ALTER TABLE public.daily_deals        ADD COLUMN IF NOT EXISTS sale_price_num numeric;
ALTER TABLE public.daily_deals        ADD COLUMN IF NOT EXISTS whatsapp_msg text;

ALTER TABLE public.crm_whatsapp_log   ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.crm_whatsapp_log   ADD COLUMN IF NOT EXISTS campaign_id uuid;
ALTER TABLE public.crm_whatsapp_log   ADD COLUMN IF NOT EXISTS sent_from_section text;
ALTER TABLE public.crm_whatsapp_log   ADD COLUMN IF NOT EXISTS message_hint text;

-- =========================================================
-- 6. INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_crm_customers_phone     ON public.crm_customers(phone);
CREATE INDEX IF NOT EXISTS idx_crm_sales_phone         ON public.crm_sales(phone);
CREATE INDEX IF NOT EXISTS idx_crm_sales_sale_date     ON public.crm_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_crm_enquiries_status    ON public.crm_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_crm_quotations_status   ON public.crm_quotations(status);
CREATE INDEX IF NOT EXISTS idx_crm_user_roles_user     ON public.crm_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_warranty_rem_status     ON public.crm_warranty_reminders(status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_inv_tx_item             ON public.inventory_transactions(item_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_reminders_queue_status  ON public.reminders_queue(status, event_date);

-- =========================================================
-- 7. FUNCTIONS
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_crm_role(_user_id uuid, _role public.crm_app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_crm_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_user_roles
    WHERE user_id = _user_id AND role IN ('crm_user', 'crm_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.assign_crm_catalogue_item_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.item_code IS NULL OR NEW.item_code = '' THEN
    NEW.item_code := 'ITM-' || LPAD(nextval('public.crm_catalogue_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- =========================================================
-- 8. TRIGGERS (drop+create pattern)
-- =========================================================
DROP TRIGGER IF EXISTS trg_crm_catalogue_item_code ON public.crm_catalogue;
CREATE TRIGGER trg_crm_catalogue_item_code
  BEFORE INSERT ON public.crm_catalogue
  FOR EACH ROW EXECUTE FUNCTION public.assign_crm_catalogue_item_code();

-- updated_at triggers for tables that have updated_at
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'admin_customer_settings','admin_reminder_settings','banner_slides','campaigns',
      'campaign_templates','cctv_products','crm_admin_settings','crm_catalogue',
      'crm_customers','crm_enquiries','crm_quotations','crm_quote_shares','crm_sales',
      'crm_services','crm_settings','crm_warranty_reminders','crm_whatsapp_templates',
      'daily_deals','dealer_brands','gallery_images','instagram_reels','intro_section',
      'nav_items','products','quotation_templates','section_headings','seo_meta_tags',
      'services','sister_concerns','site_settings','site_whatsapp_templates',
      'testimonial_videos','youtube_videos'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;

-- =========================================================
-- 9. ENABLE RLS
-- =========================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'admin_customer_settings','admin_reminder_settings','banner_slides',
      'campaign_recipients','campaign_templates','campaigns','cctv_products',
      'crm_admin_settings','crm_catalogue','crm_customers','crm_enquiries',
      'crm_quotations','crm_quote_shares','crm_sales','crm_services','crm_settings',
      'crm_stock_audit_log','crm_user_roles','crm_warranty_reminders',
      'crm_whatsapp_log','crm_whatsapp_templates','customer_event_logs','daily_deals',
      'dealer_brands','enquiries','gallery_images','instagram_reels','intro_section',
      'inventory_audits','inventory_transactions','nav_items','products',
      'quotation_send_log','quotation_templates','reminders_queue','section_headings',
      'seo_meta_tags','services','sister_concerns','site_settings',
      'site_whatsapp_templates','testimonial_videos','youtube_videos'
    ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- =========================================================
-- 10. RLS POLICIES (drop+create)
-- =========================================================

-- admin_customer_settings
DROP POLICY IF EXISTS "Anon view cust settings" ON public.admin_customer_settings;
CREATE POLICY "Anon view cust settings" ON public.admin_customer_settings FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "CRM users view cust settings" ON public.admin_customer_settings;
CREATE POLICY "CRM users view cust settings" ON public.admin_customer_settings FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins insert cust settings" ON public.admin_customer_settings;
CREATE POLICY "CRM admins insert cust settings" ON public.admin_customer_settings FOR INSERT TO authenticated WITH CHECK (public.has_crm_role(auth.uid(), 'crm_admin'));
DROP POLICY IF EXISTS "CRM admins update cust settings" ON public.admin_customer_settings;
CREATE POLICY "CRM admins update cust settings" ON public.admin_customer_settings FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));
DROP POLICY IF EXISTS "CRM admins delete cust settings" ON public.admin_customer_settings;
CREATE POLICY "CRM admins delete cust settings" ON public.admin_customer_settings FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- admin_reminder_settings
DROP POLICY IF EXISTS "Anon view rem settings" ON public.admin_reminder_settings;
CREATE POLICY "Anon view rem settings" ON public.admin_reminder_settings FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "CRM users view rem settings" ON public.admin_reminder_settings;
CREATE POLICY "CRM users view rem settings" ON public.admin_reminder_settings FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins insert rem settings" ON public.admin_reminder_settings;
CREATE POLICY "CRM admins insert rem settings" ON public.admin_reminder_settings FOR INSERT TO authenticated WITH CHECK (public.has_crm_role(auth.uid(), 'crm_admin'));
DROP POLICY IF EXISTS "CRM admins update rem settings" ON public.admin_reminder_settings;
CREATE POLICY "CRM admins update rem settings" ON public.admin_reminder_settings FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));
DROP POLICY IF EXISTS "CRM admins delete rem settings" ON public.admin_reminder_settings;
CREATE POLICY "CRM admins delete rem settings" ON public.admin_reminder_settings FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));
DROP POLICY IF EXISTS "Service role full access rem settings" ON public.admin_reminder_settings;
CREATE POLICY "Service role full access rem settings" ON public.admin_reminder_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- banner_slides
DROP POLICY IF EXISTS "Anyone can view banner slides" ON public.banner_slides;
CREATE POLICY "Anyone can view banner slides" ON public.banner_slides FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage banner slides" ON public.banner_slides;
CREATE POLICY "Authenticated can manage banner slides" ON public.banner_slides FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- campaign_recipients
DROP POLICY IF EXISTS "CRM users view recipients" ON public.campaign_recipients;
CREATE POLICY "CRM users view recipients" ON public.campaign_recipients FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert recipients" ON public.campaign_recipients;
CREATE POLICY "CRM users insert recipients" ON public.campaign_recipients FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update recipients" ON public.campaign_recipients;
CREATE POLICY "CRM users update recipients" ON public.campaign_recipients FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins delete recipients" ON public.campaign_recipients;
CREATE POLICY "CRM admins delete recipients" ON public.campaign_recipients FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- campaign_templates
DROP POLICY IF EXISTS "CRM users view camp templates" ON public.campaign_templates;
CREATE POLICY "CRM users view camp templates" ON public.campaign_templates FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert camp templates" ON public.campaign_templates;
CREATE POLICY "CRM users insert camp templates" ON public.campaign_templates FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update camp templates" ON public.campaign_templates;
CREATE POLICY "CRM users update camp templates" ON public.campaign_templates FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins delete camp templates" ON public.campaign_templates;
CREATE POLICY "CRM admins delete camp templates" ON public.campaign_templates FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- campaigns
DROP POLICY IF EXISTS "CRM users view campaigns" ON public.campaigns;
CREATE POLICY "CRM users view campaigns" ON public.campaigns FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert campaigns" ON public.campaigns;
CREATE POLICY "CRM users insert campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update campaigns" ON public.campaigns;
CREATE POLICY "CRM users update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins delete campaigns" ON public.campaigns;
CREATE POLICY "CRM admins delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- cctv_products
DROP POLICY IF EXISTS "Anyone can view cctv products" ON public.cctv_products;
CREATE POLICY "Anyone can view cctv products" ON public.cctv_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert cctv products" ON public.cctv_products;
CREATE POLICY "Authenticated users can insert cctv products" ON public.cctv_products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update cctv products" ON public.cctv_products;
CREATE POLICY "Authenticated users can update cctv products" ON public.cctv_products FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete cctv products" ON public.cctv_products;
CREATE POLICY "Authenticated users can delete cctv products" ON public.cctv_products FOR DELETE TO authenticated USING (true);

-- crm_admin_settings
DROP POLICY IF EXISTS "CRM users view admin settings" ON public.crm_admin_settings;
CREATE POLICY "CRM users view admin settings" ON public.crm_admin_settings FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins insert admin settings" ON public.crm_admin_settings;
CREATE POLICY "CRM admins insert admin settings" ON public.crm_admin_settings FOR INSERT TO authenticated WITH CHECK (public.has_crm_role(auth.uid(), 'crm_admin'));
DROP POLICY IF EXISTS "CRM admins update admin settings" ON public.crm_admin_settings;
CREATE POLICY "CRM admins update admin settings" ON public.crm_admin_settings FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));
DROP POLICY IF EXISTS "CRM admins delete admin settings" ON public.crm_admin_settings;
CREATE POLICY "CRM admins delete admin settings" ON public.crm_admin_settings FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- crm_catalogue
DROP POLICY IF EXISTS "Anyone can view active catalogue" ON public.crm_catalogue;
CREATE POLICY "Anyone can view active catalogue" ON public.crm_catalogue FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users manage catalogue insert" ON public.crm_catalogue;
CREATE POLICY "CRM users manage catalogue insert" ON public.crm_catalogue FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users manage catalogue update" ON public.crm_catalogue;
CREATE POLICY "CRM users manage catalogue update" ON public.crm_catalogue FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users manage catalogue delete" ON public.crm_catalogue;
CREATE POLICY "CRM users manage catalogue delete" ON public.crm_catalogue FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

-- crm_customers
DROP POLICY IF EXISTS "CRM users view customers" ON public.crm_customers;
CREATE POLICY "CRM users view customers" ON public.crm_customers FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert customers" ON public.crm_customers;
CREATE POLICY "CRM users insert customers" ON public.crm_customers FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update customers" ON public.crm_customers;
CREATE POLICY "CRM users update customers" ON public.crm_customers FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete customers" ON public.crm_customers;
CREATE POLICY "CRM users delete customers" ON public.crm_customers FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

-- crm_enquiries
DROP POLICY IF EXISTS "CRM users can view enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can view enquiries" ON public.crm_enquiries FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users can insert enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can insert enquiries" ON public.crm_enquiries FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users can update enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can update enquiries" ON public.crm_enquiries FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users can delete enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can delete enquiries" ON public.crm_enquiries FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

-- crm_quotations
DROP POLICY IF EXISTS "Public can view quotations by link" ON public.crm_quotations;
CREATE POLICY "Public can view quotations by link" ON public.crm_quotations FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "CRM users view quotations" ON public.crm_quotations;
CREATE POLICY "CRM users view quotations" ON public.crm_quotations FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert quotations" ON public.crm_quotations;
CREATE POLICY "CRM users insert quotations" ON public.crm_quotations FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update quotations" ON public.crm_quotations;
CREATE POLICY "CRM users update quotations" ON public.crm_quotations FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins delete quotations" ON public.crm_quotations;
CREATE POLICY "CRM admins delete quotations" ON public.crm_quotations FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- crm_quote_shares
DROP POLICY IF EXISTS "Anyone can view active quotes" ON public.crm_quote_shares;
CREATE POLICY "Anyone can view active quotes" ON public.crm_quote_shares FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert quotes" ON public.crm_quote_shares;
CREATE POLICY "CRM users insert quotes" ON public.crm_quote_shares FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update quotes" ON public.crm_quote_shares;
CREATE POLICY "CRM users update quotes" ON public.crm_quote_shares FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete quotes" ON public.crm_quote_shares;
CREATE POLICY "CRM users delete quotes" ON public.crm_quote_shares FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

-- crm_sales
DROP POLICY IF EXISTS "Anonymous can submit pending sales" ON public.crm_sales;
CREATE POLICY "Anonymous can submit pending sales" ON public.crm_sales FOR INSERT TO anon WITH CHECK (payment_status = 'pending_review');
DROP POLICY IF EXISTS "CRM users view sales" ON public.crm_sales;
CREATE POLICY "CRM users view sales" ON public.crm_sales FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert sales" ON public.crm_sales;
CREATE POLICY "CRM users insert sales" ON public.crm_sales FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update sales" ON public.crm_sales;
CREATE POLICY "CRM users update sales" ON public.crm_sales FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete sales" ON public.crm_sales;
CREATE POLICY "CRM users delete sales" ON public.crm_sales FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

-- crm_services
DROP POLICY IF EXISTS "CRM users view services" ON public.crm_services;
CREATE POLICY "CRM users view services" ON public.crm_services FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert services" ON public.crm_services;
CREATE POLICY "CRM users insert services" ON public.crm_services FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update services" ON public.crm_services;
CREATE POLICY "CRM users update services" ON public.crm_services FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete services" ON public.crm_services;
CREATE POLICY "CRM users delete services" ON public.crm_services FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

-- crm_settings
DROP POLICY IF EXISTS "CRM users view settings" ON public.crm_settings;
CREATE POLICY "CRM users view settings" ON public.crm_settings FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert settings" ON public.crm_settings;
CREATE POLICY "CRM users insert settings" ON public.crm_settings FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update settings" ON public.crm_settings;
CREATE POLICY "CRM users update settings" ON public.crm_settings FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));

-- crm_stock_audit_log
DROP POLICY IF EXISTS "CRM users view audit" ON public.crm_stock_audit_log;
CREATE POLICY "CRM users view audit" ON public.crm_stock_audit_log FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert audit" ON public.crm_stock_audit_log;
CREATE POLICY "CRM users insert audit" ON public.crm_stock_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins update audit" ON public.crm_stock_audit_log;
CREATE POLICY "CRM admins update audit" ON public.crm_stock_audit_log FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));
DROP POLICY IF EXISTS "CRM admins delete audit" ON public.crm_stock_audit_log;
CREATE POLICY "CRM admins delete audit" ON public.crm_stock_audit_log FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- crm_user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.crm_user_roles;
CREATE POLICY "Users can view own roles" ON public.crm_user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- crm_warranty_reminders
DROP POLICY IF EXISTS "CRM users view reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users view reminders" ON public.crm_warranty_reminders FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users insert reminders" ON public.crm_warranty_reminders FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users update reminders" ON public.crm_warranty_reminders FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users delete reminders" ON public.crm_warranty_reminders FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

-- crm_whatsapp_log
DROP POLICY IF EXISTS "CRM users view wa log" ON public.crm_whatsapp_log;
CREATE POLICY "CRM users view wa log" ON public.crm_whatsapp_log FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert wa log" ON public.crm_whatsapp_log;
CREATE POLICY "CRM users insert wa log" ON public.crm_whatsapp_log FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins delete wa log" ON public.crm_whatsapp_log;
CREATE POLICY "CRM admins delete wa log" ON public.crm_whatsapp_log FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- crm_whatsapp_templates
DROP POLICY IF EXISTS "CRM users view templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users view templates" ON public.crm_whatsapp_templates FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users insert templates" ON public.crm_whatsapp_templates FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users update templates" ON public.crm_whatsapp_templates FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users delete templates" ON public.crm_whatsapp_templates FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

-- customer_event_logs
DROP POLICY IF EXISTS "CRM users view event logs" ON public.customer_event_logs;
CREATE POLICY "CRM users view event logs" ON public.customer_event_logs FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert event logs" ON public.customer_event_logs;
CREATE POLICY "CRM users insert event logs" ON public.customer_event_logs FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update event logs" ON public.customer_event_logs;
CREATE POLICY "CRM users update event logs" ON public.customer_event_logs FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete event logs" ON public.customer_event_logs;
CREATE POLICY "CRM users delete event logs" ON public.customer_event_logs FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

-- daily_deals
DROP POLICY IF EXISTS "Anyone can view daily deals" ON public.daily_deals;
CREATE POLICY "Anyone can view daily deals" ON public.daily_deals FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert daily deals" ON public.daily_deals;
CREATE POLICY "Authenticated users can insert daily deals" ON public.daily_deals FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update daily deals" ON public.daily_deals;
CREATE POLICY "Authenticated users can update daily deals" ON public.daily_deals FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete daily deals" ON public.daily_deals;
CREATE POLICY "Authenticated users can delete daily deals" ON public.daily_deals FOR DELETE TO authenticated USING (true);

-- dealer_brands
DROP POLICY IF EXISTS "Anyone can view dealer brands" ON public.dealer_brands;
CREATE POLICY "Anyone can view dealer brands" ON public.dealer_brands FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage dealer brands" ON public.dealer_brands;
CREATE POLICY "Authenticated can manage dealer brands" ON public.dealer_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- enquiries
DROP POLICY IF EXISTS "Anyone can submit enquiries" ON public.enquiries;
CREATE POLICY "Anyone can submit enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can view enquiries" ON public.enquiries;
CREATE POLICY "Authenticated can view enquiries" ON public.enquiries FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can manage enquiries" ON public.enquiries;
CREATE POLICY "Authenticated can manage enquiries" ON public.enquiries FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can delete enquiries" ON public.enquiries;
CREATE POLICY "Authenticated can delete enquiries" ON public.enquiries FOR DELETE TO authenticated USING (true);

-- gallery_images
DROP POLICY IF EXISTS "Anyone can view gallery images" ON public.gallery_images;
CREATE POLICY "Anyone can view gallery images" ON public.gallery_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert gallery images" ON public.gallery_images;
CREATE POLICY "Authenticated users can insert gallery images" ON public.gallery_images FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update gallery images" ON public.gallery_images;
CREATE POLICY "Authenticated users can update gallery images" ON public.gallery_images FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete gallery images" ON public.gallery_images;
CREATE POLICY "Authenticated users can delete gallery images" ON public.gallery_images FOR DELETE TO authenticated USING (true);

-- instagram_reels
DROP POLICY IF EXISTS "Anyone can view instagram reels" ON public.instagram_reels;
CREATE POLICY "Anyone can view instagram reels" ON public.instagram_reels FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage instagram reels" ON public.instagram_reels;
CREATE POLICY "Authenticated can manage instagram reels" ON public.instagram_reels FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- intro_section
DROP POLICY IF EXISTS "Anyone can view intro section" ON public.intro_section;
CREATE POLICY "Anyone can view intro section" ON public.intro_section FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage intro section" ON public.intro_section;
CREATE POLICY "Authenticated can manage intro section" ON public.intro_section FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- inventory_audits
DROP POLICY IF EXISTS "CRM users view inv audits" ON public.inventory_audits;
CREATE POLICY "CRM users view inv audits" ON public.inventory_audits FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert inv audits" ON public.inventory_audits;
CREATE POLICY "CRM users insert inv audits" ON public.inventory_audits FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins update inv audits" ON public.inventory_audits;
CREATE POLICY "CRM admins update inv audits" ON public.inventory_audits FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));
DROP POLICY IF EXISTS "CRM admins delete inv audits" ON public.inventory_audits;
CREATE POLICY "CRM admins delete inv audits" ON public.inventory_audits FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- inventory_transactions
DROP POLICY IF EXISTS "CRM users view inv tx" ON public.inventory_transactions;
CREATE POLICY "CRM users view inv tx" ON public.inventory_transactions FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert inv tx" ON public.inventory_transactions;
CREATE POLICY "CRM users insert inv tx" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins update inv tx" ON public.inventory_transactions;
CREATE POLICY "CRM admins update inv tx" ON public.inventory_transactions FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));
DROP POLICY IF EXISTS "CRM admins delete inv tx" ON public.inventory_transactions;
CREATE POLICY "CRM admins delete inv tx" ON public.inventory_transactions FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- nav_items
DROP POLICY IF EXISTS "Anyone can view nav items" ON public.nav_items;
CREATE POLICY "Anyone can view nav items" ON public.nav_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage nav items" ON public.nav_items;
CREATE POLICY "Authenticated can manage nav items" ON public.nav_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE TO authenticated USING (true);

-- quotation_send_log
DROP POLICY IF EXISTS "CRM users view send log" ON public.quotation_send_log;
CREATE POLICY "CRM users view send log" ON public.quotation_send_log FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert send log" ON public.quotation_send_log;
CREATE POLICY "CRM users insert send log" ON public.quotation_send_log FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins delete send log" ON public.quotation_send_log;
CREATE POLICY "CRM admins delete send log" ON public.quotation_send_log FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- quotation_templates
DROP POLICY IF EXISTS "CRM users view quot templates" ON public.quotation_templates;
CREATE POLICY "CRM users view quot templates" ON public.quotation_templates FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert quot templates" ON public.quotation_templates;
CREATE POLICY "CRM users insert quot templates" ON public.quotation_templates FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update quot templates" ON public.quotation_templates;
CREATE POLICY "CRM users update quot templates" ON public.quotation_templates FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins delete quot templates" ON public.quotation_templates;
CREATE POLICY "CRM admins delete quot templates" ON public.quotation_templates FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- reminders_queue
DROP POLICY IF EXISTS "CRM users view reminders queue" ON public.reminders_queue;
CREATE POLICY "CRM users view reminders queue" ON public.reminders_queue FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert reminders queue" ON public.reminders_queue;
CREATE POLICY "CRM users insert reminders queue" ON public.reminders_queue FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update reminders queue" ON public.reminders_queue;
CREATE POLICY "CRM users update reminders queue" ON public.reminders_queue FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM admins delete reminders queue" ON public.reminders_queue;
CREATE POLICY "CRM admins delete reminders queue" ON public.reminders_queue FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- section_headings
DROP POLICY IF EXISTS "Anyone can view section headings" ON public.section_headings;
CREATE POLICY "Anyone can view section headings" ON public.section_headings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage section headings" ON public.section_headings;
CREATE POLICY "Authenticated can manage section headings" ON public.section_headings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- seo_meta_tags
DROP POLICY IF EXISTS "Anyone can view seo meta" ON public.seo_meta_tags;
CREATE POLICY "Anyone can view seo meta" ON public.seo_meta_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage seo meta" ON public.seo_meta_tags;
CREATE POLICY "Authenticated can manage seo meta" ON public.seo_meta_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- services
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage services" ON public.services;
CREATE POLICY "Authenticated can manage services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- sister_concerns
DROP POLICY IF EXISTS "Anyone can view sister concerns" ON public.sister_concerns;
CREATE POLICY "Anyone can view sister concerns" ON public.sister_concerns FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage sister concerns" ON public.sister_concerns;
CREATE POLICY "Authenticated can manage sister concerns" ON public.sister_concerns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- site_settings
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage site settings" ON public.site_settings;
CREATE POLICY "Authenticated can manage site settings" ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- site_whatsapp_templates
DROP POLICY IF EXISTS "Anyone can view site wa templates" ON public.site_whatsapp_templates;
CREATE POLICY "Anyone can view site wa templates" ON public.site_whatsapp_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage site wa templates" ON public.site_whatsapp_templates;
CREATE POLICY "Authenticated can manage site wa templates" ON public.site_whatsapp_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- testimonial_videos
DROP POLICY IF EXISTS "Anyone can view testimonial videos" ON public.testimonial_videos;
CREATE POLICY "Anyone can view testimonial videos" ON public.testimonial_videos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage testimonial videos" ON public.testimonial_videos;
CREATE POLICY "Authenticated can manage testimonial videos" ON public.testimonial_videos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- youtube_videos
DROP POLICY IF EXISTS "Anyone can view youtube videos" ON public.youtube_videos;
CREATE POLICY "Anyone can view youtube videos" ON public.youtube_videos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can manage youtube videos" ON public.youtube_videos;
CREATE POLICY "Authenticated can manage youtube videos" ON public.youtube_videos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- 11. STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-photos', 'customer-photos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;

INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-assets', 'shop-assets', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;

DROP POLICY IF EXISTS "Public read customer photos" ON storage.objects;
CREATE POLICY "Public read customer photos" ON storage.objects FOR SELECT USING (bucket_id = 'customer-photos');
DROP POLICY IF EXISTS "Auth upload customer photos" ON storage.objects;
CREATE POLICY "Auth upload customer photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'customer-photos');
DROP POLICY IF EXISTS "Auth update customer photos" ON storage.objects;
CREATE POLICY "Auth update customer photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'customer-photos');
DROP POLICY IF EXISTS "Auth delete customer photos" ON storage.objects;
CREATE POLICY "Auth delete customer photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'customer-photos');

DROP POLICY IF EXISTS "Public read shop assets" ON storage.objects;
CREATE POLICY "Public read shop assets" ON storage.objects FOR SELECT USING (bucket_id = 'shop-assets');
DROP POLICY IF EXISTS "Auth upload shop assets" ON storage.objects;
CREATE POLICY "Auth upload shop assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-assets');
DROP POLICY IF EXISTS "Auth update shop assets" ON storage.objects;
CREATE POLICY "Auth update shop assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shop-assets');
DROP POLICY IF EXISTS "Auth delete shop assets" ON storage.objects;
CREATE POLICY "Auth delete shop assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shop-assets');

-- =========================================================
-- 12. REALTIME PUBLICATION
-- =========================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_warranty_reminders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders_queue;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;