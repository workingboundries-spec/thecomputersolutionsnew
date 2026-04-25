-- Full database bootstrap export (idempotent)
-- Generated: 2026-04-25T09:16:05.083078Z
-- Safe to run on a fresh Supabase project OR re-run on existing.

BEGIN;

-- ============================================================
-- EXTENSIONS
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
CREATE TYPE public.crm_app_role AS ENUM (
    'crm_user',
    'crm_admin'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- SEQUENCES
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.crm_catalogue_code_seq
    START WITH 5
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ============================================================
-- TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_customer_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_type text NOT NULL,
    value text NOT NULL,
    colour text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.admin_reminder_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.banner_slides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text,
    heading text,
    subheading text,
    button_text text,
    button_link text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid,
    customer_id uuid,
    personalised_message text,
    status text DEFAULT 'pending'::text NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT campaign_recipients_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'skipped'::text])))
);
CREATE TABLE IF NOT EXISTS public.campaign_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text,
    message_body text NOT NULL,
    placeholders_used text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text,
    message_body text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by uuid,
    total_targeted integer DEFAULT 0 NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    skipped_count integer DEFAULT 0 NOT NULL,
    filters_snapshot jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'partial'::text, 'completed'::text])))
);
CREATE TABLE IF NOT EXISTS public.cctv_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    price text NOT NULL,
    image text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text,
    category text DEFAULT 'Dome'::text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.crm_admin_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    setting_key text NOT NULL,
    setting_value text DEFAULT ''::text NOT NULL,
    setting_type text DEFAULT 'text'::text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.crm_catalogue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    category text DEFAULT 'laptop'::text NOT NULL,
    specs text,
    stock_qty integer DEFAULT 0 NOT NULL,
    nlc_price numeric DEFAULT 0 NOT NULL,
    billing_price numeric DEFAULT 0 NOT NULL,
    sale_price numeric DEFAULT 0 NOT NULL,
    online_price numeric DEFAULT 0 NOT NULL,
    mrp numeric DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    image_url text,
    opening_stock integer DEFAULT 0 NOT NULL,
    current_stock integer DEFAULT 0 NOT NULL,
    reorder_level integer DEFAULT 0 NOT NULL,
    item_code text DEFAULT ''::text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.crm_customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    whatsapp text,
    email text,
    address text,
    dob date,
    total_purchases integer DEFAULT 0 NOT NULL,
    total_value numeric DEFAULT 0 NOT NULL,
    last_purchase_date date,
    notes text,
    photo_url text,
    rank text,
    source_mode text,
    city text,
    anniversary_date date,
    occupation text
);
CREATE TABLE IF NOT EXISTS public.crm_enquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_name text NOT NULL,
    phone text NOT NULL,
    whatsapp text,
    address text,
    product_category text DEFAULT 'laptop'::text NOT NULL,
    item_name text,
    budget numeric,
    description text,
    status text DEFAULT 'new'::text NOT NULL,
    source text DEFAULT 'walkin'::text NOT NULL,
    assigned_to text,
    notes text,
    is_converted boolean DEFAULT false NOT NULL
);
CREATE TABLE IF NOT EXISTS public.crm_quotations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    quote_no text NOT NULL,
    enquiry_id uuid,
    customer_name text NOT NULL,
    phone text,
    whatsapp text,
    email text,
    address text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal numeric DEFAULT 0 NOT NULL,
    discount numeric DEFAULT 0 NOT NULL,
    gst_percent numeric DEFAULT 18 NOT NULL,
    gst_amount numeric DEFAULT 0 NOT NULL,
    total_amount numeric DEFAULT 0 NOT NULL,
    validity_days integer DEFAULT 7 NOT NULL,
    validity_date date,
    notes text,
    terms text,
    status text DEFAULT 'draft'::text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.crm_quote_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    catalogue_id uuid,
    customer_name text,
    customer_phone text,
    shared_config text,
    shared_price numeric DEFAULT 0 NOT NULL,
    valid_until date DEFAULT (CURRENT_DATE + '7 days'::interval) NOT NULL,
    share_link uuid DEFAULT gen_random_uuid() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);
CREATE TABLE IF NOT EXISTS public.crm_sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enquiry_id uuid,
    customer_name text NOT NULL,
    phone text NOT NULL,
    whatsapp text,
    address text,
    customer_dob date,
    item_name text NOT NULL,
    item_id uuid,
    qty integer DEFAULT 1 NOT NULL,
    sale_price numeric DEFAULT 0 NOT NULL,
    discount numeric DEFAULT 0 NOT NULL,
    total_amount numeric DEFAULT 0 NOT NULL,
    payment_mode text DEFAULT 'cash'::text NOT NULL,
    payment_status text DEFAULT 'paid'::text NOT NULL,
    invoice_no text NOT NULL,
    warranty_months integer DEFAULT 12 NOT NULL,
    warranty_expiry date,
    sale_date date DEFAULT CURRENT_DATE NOT NULL,
    notes text,
    is_deleted boolean DEFAULT false NOT NULL
);
CREATE TABLE IF NOT EXISTS public.crm_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    job_card_no text NOT NULL,
    customer_name text NOT NULL,
    phone text NOT NULL,
    whatsapp text,
    device_type text NOT NULL,
    brand text,
    model text,
    issue_description text,
    status text DEFAULT 'received'::text NOT NULL,
    estimated_cost numeric DEFAULT 0,
    final_cost numeric DEFAULT 0,
    technician_notes text,
    received_date date DEFAULT CURRENT_DATE NOT NULL,
    delivery_date date
);
CREATE TABLE IF NOT EXISTS public.crm_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.crm_stock_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    audit_month text NOT NULL,
    audit_date date DEFAULT CURRENT_DATE NOT NULL,
    catalogue_id uuid,
    item_name text,
    brand text,
    model text,
    opening_stock integer DEFAULT 0 NOT NULL,
    sold_qty integer DEFAULT 0 NOT NULL,
    physical_count integer DEFAULT 0 NOT NULL,
    variance integer DEFAULT 0 NOT NULL,
    notes text,
    entered_by text DEFAULT 'admin'::text
);
CREATE TABLE IF NOT EXISTS public.crm_user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.crm_app_role DEFAULT 'crm_user'::public.crm_app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.crm_warranty_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sale_id uuid,
    customer_name text NOT NULL,
    phone text NOT NULL,
    whatsapp text,
    item_name text,
    purchase_date date,
    warranty_expiry date,
    reminder_type text NOT NULL,
    scheduled_date date NOT NULL,
    whatsapp_message text,
    status text DEFAULT 'pending'::text NOT NULL,
    sent_at timestamp with time zone,
    message_sent boolean DEFAULT false NOT NULL,
    message_sent_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.crm_whatsapp_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sale_id uuid,
    customer_name text,
    phone text,
    message_type text,
    message_text text,
    status text DEFAULT 'sent'::text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_id uuid,
    message_hint text,
    sent_from_section text,
    campaign_id uuid,
    sent_by uuid
);
CREATE TABLE IF NOT EXISTS public.crm_whatsapp_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    template_name text NOT NULL,
    message_body text NOT NULL,
    template_type text DEFAULT 'warranty'::text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.customer_event_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    event_type text NOT NULL,
    event_date date NOT NULL,
    years_completed integer,
    message_sent text,
    sent_at timestamp with time zone DEFAULT now(),
    sent_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customer_event_logs_event_type_check CHECK ((event_type = ANY (ARRAY['birthday'::text, 'anniversary'::text])))
);
CREATE TABLE IF NOT EXISTS public.daily_deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    image text DEFAULT ''::text NOT NULL,
    original_price text NOT NULL,
    deal_price text NOT NULL,
    valid_until date DEFAULT (CURRENT_DATE + '7 days'::interval) NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text,
    description text,
    mrp numeric,
    regular_price_num numeric,
    sale_price_num numeric,
    discount_percent numeric,
    whatsapp_msg text,
    is_active boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.dealer_brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name text NOT NULL,
    logo_url text,
    website_url text,
    brand_type text DEFAULT 'dealer'::text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.enquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    message text,
    status text DEFAULT 'new'::text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    alt_text text DEFAULT ''::text,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.instagram_reels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text,
    reel_url text,
    thumbnail_url text NOT NULL,
    caption text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.intro_section (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    heading text DEFAULT 'About Computer Solutions'::text NOT NULL,
    subheading text,
    body_text text,
    youtube_url text,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.inventory_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_month integer NOT NULL,
    audit_year integer NOT NULL,
    audit_date timestamp with time zone DEFAULT now() NOT NULL,
    item_id uuid NOT NULL,
    opening_stock integer DEFAULT 0 NOT NULL,
    received_qty integer DEFAULT 0 NOT NULL,
    sold_qty integer DEFAULT 0 NOT NULL,
    damaged_qty integer DEFAULT 0 NOT NULL,
    closing_system_stock integer DEFAULT 0 NOT NULL,
    physical_count integer DEFAULT 0 NOT NULL,
    variance integer DEFAULT 0 NOT NULL,
    action_taken text,
    notes text,
    audited_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventory_audits_action_taken_check CHECK ((action_taken = ANY (ARRAY['reset'::text, 'carry_forward'::text])))
);
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    transaction_date timestamp with time zone DEFAULT now() NOT NULL,
    movement_type text NOT NULL,
    qty integer NOT NULL,
    balance_after integer,
    reference_id uuid,
    reference_type text,
    supplier_name text,
    purchase_price numeric(12,2),
    reason text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventory_transactions_movement_type_check CHECK ((movement_type = ANY (ARRAY['manual_entry'::text, 'sale'::text, 'sale_reversal'::text, 'damage'::text, 'write_off'::text, 'return_to_supplier'::text, 'audit_adjustment'::text, 'opening_stock'::text])))
);
CREATE TABLE IF NOT EXISTS public.nav_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    href text NOT NULL,
    sort_order integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    price text NOT NULL,
    image text DEFAULT ''::text NOT NULL,
    category text DEFAULT 'Business'::text NOT NULL,
    specs text DEFAULT ''::text,
    is_new boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    regular_price numeric,
    sale_price numeric,
    mrp numeric,
    whatsapp_enquiry_msg text,
    badge text,
    is_active boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.quotation_send_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    quotation_id uuid,
    customer_name text,
    phone text,
    whatsapp text,
    email text,
    send_method text,
    status text DEFAULT 'sent'::text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.quotation_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    template_name text NOT NULL,
    description text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    notes text,
    terms text,
    gst_percent numeric DEFAULT 18 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    used_count integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS public.reminders_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    event_type text NOT NULL,
    event_date date NOT NULL,
    event_year integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    days_before integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone,
    sent_by uuid,
    CONSTRAINT reminders_queue_event_type_check CHECK ((event_type = ANY (ARRAY['birthday'::text, 'anniversary'::text]))),
    CONSTRAINT reminders_queue_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'missed'::text, 'skipped'::text, 'today'::text])))
);
CREATE TABLE IF NOT EXISTS public.section_headings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_key text NOT NULL,
    heading text NOT NULL,
    subheading text,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.seo_meta_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_key text NOT NULL,
    page_label text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    keywords text DEFAULT ''::text,
    og_title text DEFAULT ''::text,
    og_description text DEFAULT ''::text,
    og_image text DEFAULT ''::text,
    og_url text DEFAULT ''::text,
    twitter_card text DEFAULT 'summary_large_image'::text,
    canonical_url text DEFAULT ''::text,
    structured_data jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    icon_name text DEFAULT 'Monitor'::text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    thumbnail_url text,
    is_active boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.sister_concerns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    tagline text,
    description text,
    thumbnail_url text,
    website_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.site_whatsapp_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_key text NOT NULL,
    label text NOT NULL,
    description text,
    message_body text DEFAULT ''::text NOT NULL,
    placeholders text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.testimonial_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_name text NOT NULL,
    location text,
    product_purchased text,
    video_url text,
    thumbnail_url text,
    review_text text,
    rating integer DEFAULT 5,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.youtube_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    embed_url text NOT NULL,
    title text DEFAULT ''::text,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    youtube_url text,
    thumbnail_url text,
    is_active boolean DEFAULT true
);

-- ============================================================
-- COLUMN DEFAULTS / SEQUENCE OWNERSHIP
-- ============================================================

-- ============================================================
-- CONSTRAINTS (PK, UNIQUE, FK)
-- ============================================================
DO $$ BEGIN
ALTER TABLE ONLY public.admin_customer_settings
    ADD CONSTRAINT admin_customer_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.admin_customer_settings
    ADD CONSTRAINT admin_customer_settings_setting_type_value_key UNIQUE (setting_type, value);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.admin_reminder_settings
    ADD CONSTRAINT admin_reminder_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.admin_reminder_settings
    ADD CONSTRAINT admin_reminder_settings_setting_key_key UNIQUE (setting_key);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.banner_slides
    ADD CONSTRAINT banner_slides_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.campaign_templates
    ADD CONSTRAINT campaign_templates_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.cctv_products
    ADD CONSTRAINT cctv_products_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_admin_settings
    ADD CONSTRAINT crm_admin_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_admin_settings
    ADD CONSTRAINT crm_admin_settings_setting_key_key UNIQUE (setting_key);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_catalogue
    ADD CONSTRAINT crm_catalogue_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_customers
    ADD CONSTRAINT crm_customers_phone_key UNIQUE (phone);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_customers
    ADD CONSTRAINT crm_customers_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_enquiries
    ADD CONSTRAINT crm_enquiries_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_quotations
    ADD CONSTRAINT crm_quotations_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_quotations
    ADD CONSTRAINT crm_quotations_quote_no_key UNIQUE (quote_no);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_quote_shares
    ADD CONSTRAINT crm_quote_shares_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_quote_shares
    ADD CONSTRAINT crm_quote_shares_share_link_key UNIQUE (share_link);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_sales
    ADD CONSTRAINT crm_sales_invoice_no_key UNIQUE (invoice_no);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_sales
    ADD CONSTRAINT crm_sales_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_services
    ADD CONSTRAINT crm_services_job_card_no_key UNIQUE (job_card_no);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_services
    ADD CONSTRAINT crm_services_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_settings
    ADD CONSTRAINT crm_settings_key_key UNIQUE (key);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_settings
    ADD CONSTRAINT crm_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_stock_audit_log
    ADD CONSTRAINT crm_stock_audit_log_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_user_roles
    ADD CONSTRAINT crm_user_roles_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_user_roles
    ADD CONSTRAINT crm_user_roles_user_id_role_key UNIQUE (user_id, role);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_warranty_reminders
    ADD CONSTRAINT crm_warranty_reminders_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_whatsapp_log
    ADD CONSTRAINT crm_whatsapp_log_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_whatsapp_templates
    ADD CONSTRAINT crm_whatsapp_templates_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_whatsapp_templates
    ADD CONSTRAINT crm_whatsapp_templates_template_name_key UNIQUE (template_name);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.customer_event_logs
    ADD CONSTRAINT customer_event_logs_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.daily_deals
    ADD CONSTRAINT daily_deals_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.dealer_brands
    ADD CONSTRAINT dealer_brands_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.instagram_reels
    ADD CONSTRAINT instagram_reels_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.intro_section
    ADD CONSTRAINT intro_section_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.inventory_audits
    ADD CONSTRAINT inventory_audits_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.inventory_audits
    ADD CONSTRAINT inventory_audits_year_month_item_unique UNIQUE (audit_year, audit_month, item_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.nav_items
    ADD CONSTRAINT nav_items_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.quotation_send_log
    ADD CONSTRAINT quotation_send_log_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT quotation_templates_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.reminders_queue
    ADD CONSTRAINT reminders_queue_customer_id_event_type_event_year_key UNIQUE (customer_id, event_type, event_year);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.reminders_queue
    ADD CONSTRAINT reminders_queue_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.section_headings
    ADD CONSTRAINT section_headings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.section_headings
    ADD CONSTRAINT section_headings_section_key_key UNIQUE (section_key);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.seo_meta_tags
    ADD CONSTRAINT seo_meta_tags_page_key_key UNIQUE (page_key);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.seo_meta_tags
    ADD CONSTRAINT seo_meta_tags_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.sister_concerns
    ADD CONSTRAINT sister_concerns_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_key UNIQUE (key);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.site_whatsapp_templates
    ADD CONSTRAINT site_whatsapp_templates_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.site_whatsapp_templates
    ADD CONSTRAINT site_whatsapp_templates_template_key_key UNIQUE (template_key);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.testimonial_videos
    ADD CONSTRAINT testimonial_videos_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.youtube_videos
    ADD CONSTRAINT youtube_videos_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.crm_customers(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_quotations
    ADD CONSTRAINT crm_quotations_enquiry_id_fkey FOREIGN KEY (enquiry_id) REFERENCES public.crm_enquiries(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_quote_shares
    ADD CONSTRAINT crm_quote_shares_catalogue_id_fkey FOREIGN KEY (catalogue_id) REFERENCES public.crm_catalogue(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_sales
    ADD CONSTRAINT crm_sales_enquiry_id_fkey FOREIGN KEY (enquiry_id) REFERENCES public.crm_enquiries(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_sales
    ADD CONSTRAINT crm_sales_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.crm_catalogue(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_stock_audit_log
    ADD CONSTRAINT crm_stock_audit_log_catalogue_id_fkey FOREIGN KEY (catalogue_id) REFERENCES public.crm_catalogue(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_user_roles
    ADD CONSTRAINT crm_user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_warranty_reminders
    ADD CONSTRAINT crm_warranty_reminders_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.crm_sales(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.crm_whatsapp_log
    ADD CONSTRAINT crm_whatsapp_log_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.crm_sales(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.customer_event_logs
    ADD CONSTRAINT customer_event_logs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.crm_customers(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.inventory_audits
    ADD CONSTRAINT inventory_audits_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.crm_catalogue(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.crm_catalogue(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.quotation_send_log
    ADD CONSTRAINT quotation_send_log_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.crm_quotations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
ALTER TABLE ONLY public.reminders_queue
    ADD CONSTRAINT reminders_queue_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.crm_customers(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS crm_catalogue_item_code_unique ON public.crm_catalogue USING btree (item_code);
CREATE INDEX IF NOT EXISTS idx_camp_recip_campaign ON public.campaign_recipients USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_recip_customer ON public.campaign_recipients USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_phone ON public.crm_customers USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_crm_enquiries_status ON public.crm_enquiries USING btree (status);
CREATE INDEX IF NOT EXISTS idx_crm_quotations_status ON public.crm_quotations USING btree (status);
CREATE INDEX IF NOT EXISTS idx_crm_sales_phone ON public.crm_sales USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_crm_sales_sale_date ON public.crm_sales USING btree (sale_date);
CREATE INDEX IF NOT EXISTS idx_crm_stock_audit_month ON public.crm_stock_audit_log USING btree (audit_month);
CREATE INDEX IF NOT EXISTS idx_crm_user_roles_user ON public.crm_user_roles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_customer ON public.customer_event_logs USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_inv_audit_item ON public.inventory_audits USING btree (item_id);
CREATE INDEX IF NOT EXISTS idx_inv_audit_period ON public.inventory_audits USING btree (audit_year DESC, audit_month DESC);
CREATE INDEX IF NOT EXISTS idx_inv_tx_item ON public.inventory_transactions USING btree (item_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_inv_tx_item_date ON public.inventory_transactions USING btree (item_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_tx_type ON public.inventory_transactions USING btree (movement_type);
CREATE INDEX IF NOT EXISTS idx_reminders_queue_status ON public.reminders_queue USING btree (status, event_date);
CREATE INDEX IF NOT EXISTS idx_wa_log_campaign ON public.crm_whatsapp_log USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_wa_log_customer ON public.crm_whatsapp_log USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_rem_status ON public.crm_warranty_reminders USING btree (status, scheduled_date);

-- ============================================================
-- FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.assign_crm_catalogue_item_code() RETURNS trigger
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
CREATE OR REPLACE FUNCTION public.has_crm_role(_user_id uuid, _role public.crm_app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
CREATE OR REPLACE FUNCTION public.is_crm_user(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_user_roles
    WHERE user_id = _user_id AND role IN ('crm_user', 'crm_admin')
  )
$$;
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS crm_catalogue_updated_at ON public.crm_catalogue;
CREATE TRIGGER crm_catalogue_updated_at BEFORE UPDATE ON public.crm_catalogue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS crm_customers_updated_at ON public.crm_customers;
CREATE TRIGGER crm_customers_updated_at BEFORE UPDATE ON public.crm_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS crm_enquiries_updated_at ON public.crm_enquiries;
CREATE TRIGGER crm_enquiries_updated_at BEFORE UPDATE ON public.crm_enquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS crm_quote_shares_updated_at ON public.crm_quote_shares;
CREATE TRIGGER crm_quote_shares_updated_at BEFORE UPDATE ON public.crm_quote_shares FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS crm_sales_updated_at ON public.crm_sales;
CREATE TRIGGER crm_sales_updated_at BEFORE UPDATE ON public.crm_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS crm_services_updated_at ON public.crm_services;
CREATE TRIGGER crm_services_updated_at BEFORE UPDATE ON public.crm_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS crm_settings_updated_at ON public.crm_settings;
CREATE TRIGGER crm_settings_updated_at BEFORE UPDATE ON public.crm_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS crm_warranty_reminders_updated_at ON public.crm_warranty_reminders;
CREATE TRIGGER crm_warranty_reminders_updated_at BEFORE UPDATE ON public.crm_warranty_reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS crm_whatsapp_templates_updated_at ON public.crm_whatsapp_templates;
CREATE TRIGGER crm_whatsapp_templates_updated_at BEFORE UPDATE ON public.crm_whatsapp_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_banner_slides ON public.banner_slides;
CREATE TRIGGER set_updated_at_banner_slides BEFORE UPDATE ON public.banner_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_dealer_brands ON public.dealer_brands;
CREATE TRIGGER set_updated_at_dealer_brands BEFORE UPDATE ON public.dealer_brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_instagram_reels ON public.instagram_reels;
CREATE TRIGGER set_updated_at_instagram_reels BEFORE UPDATE ON public.instagram_reels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_nav_items ON public.nav_items;
CREATE TRIGGER set_updated_at_nav_items BEFORE UPDATE ON public.nav_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_section_headings ON public.section_headings;
CREATE TRIGGER set_updated_at_section_headings BEFORE UPDATE ON public.section_headings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at_testimonial_videos ON public.testimonial_videos;
CREATE TRIGGER set_updated_at_testimonial_videos BEFORE UPDATE ON public.testimonial_videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_admin_customer_settings_updated_at ON public.admin_customer_settings;
CREATE TRIGGER trg_admin_customer_settings_updated_at BEFORE UPDATE ON public.admin_customer_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_admin_reminder_settings_updated_at ON public.admin_reminder_settings;
CREATE TRIGGER trg_admin_reminder_settings_updated_at BEFORE UPDATE ON public.admin_reminder_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_assign_crm_catalogue_item_code ON public.crm_catalogue;
CREATE TRIGGER trg_assign_crm_catalogue_item_code BEFORE INSERT ON public.crm_catalogue FOR EACH ROW EXECUTE FUNCTION public.assign_crm_catalogue_item_code();
DROP TRIGGER IF EXISTS trg_banner_slides_updated_at ON public.banner_slides;
CREATE TRIGGER trg_banner_slides_updated_at BEFORE UPDATE ON public.banner_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_camp_templates_updated ON public.campaign_templates;
CREATE TRIGGER trg_camp_templates_updated BEFORE UPDATE ON public.campaign_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_campaign_templates_updated_at ON public.campaign_templates;
CREATE TRIGGER trg_campaign_templates_updated_at BEFORE UPDATE ON public.campaign_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_campaigns_updated ON public.campaigns;
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_cctv_products_updated_at ON public.cctv_products;
CREATE TRIGGER trg_cctv_products_updated_at BEFORE UPDATE ON public.cctv_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_admin_settings_updated ON public.crm_admin_settings;
CREATE TRIGGER trg_crm_admin_settings_updated BEFORE UPDATE ON public.crm_admin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_admin_settings_updated_at ON public.crm_admin_settings;
CREATE TRIGGER trg_crm_admin_settings_updated_at BEFORE UPDATE ON public.crm_admin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_catalogue_item_code ON public.crm_catalogue;
CREATE TRIGGER trg_crm_catalogue_item_code BEFORE INSERT ON public.crm_catalogue FOR EACH ROW EXECUTE FUNCTION public.assign_crm_catalogue_item_code();
DROP TRIGGER IF EXISTS trg_crm_catalogue_updated_at ON public.crm_catalogue;
CREATE TRIGGER trg_crm_catalogue_updated_at BEFORE UPDATE ON public.crm_catalogue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_customers_updated_at ON public.crm_customers;
CREATE TRIGGER trg_crm_customers_updated_at BEFORE UPDATE ON public.crm_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_enquiries_updated_at ON public.crm_enquiries;
CREATE TRIGGER trg_crm_enquiries_updated_at BEFORE UPDATE ON public.crm_enquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_quotations_updated ON public.crm_quotations;
CREATE TRIGGER trg_crm_quotations_updated BEFORE UPDATE ON public.crm_quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_quotations_updated_at ON public.crm_quotations;
CREATE TRIGGER trg_crm_quotations_updated_at BEFORE UPDATE ON public.crm_quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_quote_shares_updated_at ON public.crm_quote_shares;
CREATE TRIGGER trg_crm_quote_shares_updated_at BEFORE UPDATE ON public.crm_quote_shares FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_sales_updated_at ON public.crm_sales;
CREATE TRIGGER trg_crm_sales_updated_at BEFORE UPDATE ON public.crm_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_services_updated_at ON public.crm_services;
CREATE TRIGGER trg_crm_services_updated_at BEFORE UPDATE ON public.crm_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_settings_updated_at ON public.crm_settings;
CREATE TRIGGER trg_crm_settings_updated_at BEFORE UPDATE ON public.crm_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_warranty_reminders_updated_at ON public.crm_warranty_reminders;
CREATE TRIGGER trg_crm_warranty_reminders_updated_at BEFORE UPDATE ON public.crm_warranty_reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_whatsapp_templates_updated_at ON public.crm_whatsapp_templates;
CREATE TRIGGER trg_crm_whatsapp_templates_updated_at BEFORE UPDATE ON public.crm_whatsapp_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_cust_settings_updated ON public.admin_customer_settings;
CREATE TRIGGER trg_cust_settings_updated BEFORE UPDATE ON public.admin_customer_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_daily_deals_updated_at ON public.daily_deals;
CREATE TRIGGER trg_daily_deals_updated_at BEFORE UPDATE ON public.daily_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_dealer_brands_updated_at ON public.dealer_brands;
CREATE TRIGGER trg_dealer_brands_updated_at BEFORE UPDATE ON public.dealer_brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_gallery_images_updated_at ON public.gallery_images;
CREATE TRIGGER trg_gallery_images_updated_at BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_instagram_reels_updated_at ON public.instagram_reels;
CREATE TRIGGER trg_instagram_reels_updated_at BEFORE UPDATE ON public.instagram_reels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_intro_section_updated_at ON public.intro_section;
CREATE TRIGGER trg_intro_section_updated_at BEFORE UPDATE ON public.intro_section FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_nav_items_updated_at ON public.nav_items;
CREATE TRIGGER trg_nav_items_updated_at BEFORE UPDATE ON public.nav_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_quotation_templates_updated_at ON public.quotation_templates;
CREATE TRIGGER trg_quotation_templates_updated_at BEFORE UPDATE ON public.quotation_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_rem_settings_updated ON public.admin_reminder_settings;
CREATE TRIGGER trg_rem_settings_updated BEFORE UPDATE ON public.admin_reminder_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_section_headings_updated_at ON public.section_headings;
CREATE TRIGGER trg_section_headings_updated_at BEFORE UPDATE ON public.section_headings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_seo_meta_tags_updated_at ON public.seo_meta_tags;
CREATE TRIGGER trg_seo_meta_tags_updated_at BEFORE UPDATE ON public.seo_meta_tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_sister_concerns_updated_at ON public.sister_concerns;
CREATE TRIGGER trg_sister_concerns_updated_at BEFORE UPDATE ON public.sister_concerns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_site_whatsapp_templates_updated_at ON public.site_whatsapp_templates;
CREATE TRIGGER trg_site_whatsapp_templates_updated_at BEFORE UPDATE ON public.site_whatsapp_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_testimonial_videos_updated_at ON public.testimonial_videos;
CREATE TRIGGER trg_testimonial_videos_updated_at BEFORE UPDATE ON public.testimonial_videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_youtube_videos_updated_at ON public.youtube_videos;
CREATE TRIGGER trg_youtube_videos_updated_at BEFORE UPDATE ON public.youtube_videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_cctv_products_updated_at ON public.cctv_products;
CREATE TRIGGER update_cctv_products_updated_at BEFORE UPDATE ON public.cctv_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_daily_deals_updated_at ON public.daily_deals;
CREATE TRIGGER update_daily_deals_updated_at BEFORE UPDATE ON public.daily_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_gallery_images_updated_at ON public.gallery_images;
CREATE TRIGGER update_gallery_images_updated_at BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_intro_section_updated_at ON public.intro_section;
CREATE TRIGGER update_intro_section_updated_at BEFORE UPDATE ON public.intro_section FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_quotation_templates_updated_at ON public.quotation_templates;
CREATE TRIGGER update_quotation_templates_updated_at BEFORE UPDATE ON public.quotation_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_sister_concerns_updated_at ON public.sister_concerns;
CREATE TRIGGER update_sister_concerns_updated_at BEFORE UPDATE ON public.sister_concerns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_youtube_videos_updated_at ON public.youtube_videos;
CREATE TRIGGER update_youtube_videos_updated_at BEFORE UPDATE ON public.youtube_videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS ENABLE
-- ============================================================
ALTER TABLE public.admin_customer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cctv_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_quote_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stock_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_warranty_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_whatsapp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intro_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_headings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_meta_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sister_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Anon view cust settings" ON public.admin_customer_settings;
CREATE POLICY "Anon view cust settings" ON public.admin_customer_settings FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Anon view rem settings" ON public.admin_reminder_settings;
CREATE POLICY "Anon view rem settings" ON public.admin_reminder_settings FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Anonymous can submit pending sales" ON public.crm_sales;
CREATE POLICY "Anonymous can submit pending sales" ON public.crm_sales FOR INSERT TO anon WITH CHECK ((payment_status = 'pending_review'::text));
DROP POLICY IF EXISTS "Anyone can submit enquiries" ON public.enquiries;
CREATE POLICY "Anyone can submit enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view active catalogue" ON public.crm_catalogue;
CREATE POLICY "Anyone can view active catalogue" ON public.crm_catalogue FOR SELECT TO authenticated, anon USING (((is_active = true) OR public.is_crm_user(auth.uid())));
DROP POLICY IF EXISTS "Anyone can view active quotes" ON public.crm_quote_shares;
CREATE POLICY "Anyone can view active quotes" ON public.crm_quote_shares FOR SELECT TO authenticated, anon USING (((is_active = true) OR public.is_crm_user(auth.uid())));
DROP POLICY IF EXISTS "Anyone can view banner slides" ON public.banner_slides;
CREATE POLICY "Anyone can view banner slides" ON public.banner_slides FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view cctv products" ON public.cctv_products;
CREATE POLICY "Anyone can view cctv products" ON public.cctv_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view daily deals" ON public.daily_deals;
CREATE POLICY "Anyone can view daily deals" ON public.daily_deals FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view dealer brands" ON public.dealer_brands;
CREATE POLICY "Anyone can view dealer brands" ON public.dealer_brands FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view gallery images" ON public.gallery_images;
CREATE POLICY "Anyone can view gallery images" ON public.gallery_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view instagram reels" ON public.instagram_reels;
CREATE POLICY "Anyone can view instagram reels" ON public.instagram_reels FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view intro section" ON public.intro_section;
CREATE POLICY "Anyone can view intro section" ON public.intro_section FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view nav items" ON public.nav_items;
CREATE POLICY "Anyone can view nav items" ON public.nav_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view section headings" ON public.section_headings;
CREATE POLICY "Anyone can view section headings" ON public.section_headings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view seo meta" ON public.seo_meta_tags;
CREATE POLICY "Anyone can view seo meta" ON public.seo_meta_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view seo meta tags" ON public.seo_meta_tags;
CREATE POLICY "Anyone can view seo meta tags" ON public.seo_meta_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view sister concerns" ON public.sister_concerns;
CREATE POLICY "Anyone can view sister concerns" ON public.sister_concerns FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view site wa templates" ON public.site_whatsapp_templates;
CREATE POLICY "Anyone can view site wa templates" ON public.site_whatsapp_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view site whatsapp templates" ON public.site_whatsapp_templates;
CREATE POLICY "Anyone can view site whatsapp templates" ON public.site_whatsapp_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view testimonial videos" ON public.testimonial_videos;
CREATE POLICY "Anyone can view testimonial videos" ON public.testimonial_videos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view youtube videos" ON public.youtube_videos;
CREATE POLICY "Anyone can view youtube videos" ON public.youtube_videos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can delete enquiries" ON public.enquiries;
CREATE POLICY "Authenticated can delete enquiries" ON public.enquiries FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can manage banner slides" ON public.banner_slides;
CREATE POLICY "Authenticated can manage banner slides" ON public.banner_slides TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage dealer brands" ON public.dealer_brands;
CREATE POLICY "Authenticated can manage dealer brands" ON public.dealer_brands TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage enquiries" ON public.enquiries;
CREATE POLICY "Authenticated can manage enquiries" ON public.enquiries FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can manage instagram reels" ON public.instagram_reels;
CREATE POLICY "Authenticated can manage instagram reels" ON public.instagram_reels TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage intro section" ON public.intro_section;
CREATE POLICY "Authenticated can manage intro section" ON public.intro_section TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage nav items" ON public.nav_items;
CREATE POLICY "Authenticated can manage nav items" ON public.nav_items TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage section headings" ON public.section_headings;
CREATE POLICY "Authenticated can manage section headings" ON public.section_headings TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage seo meta" ON public.seo_meta_tags;
CREATE POLICY "Authenticated can manage seo meta" ON public.seo_meta_tags TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage seo meta tags" ON public.seo_meta_tags;
CREATE POLICY "Authenticated can manage seo meta tags" ON public.seo_meta_tags TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage services" ON public.services;
CREATE POLICY "Authenticated can manage services" ON public.services TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage sister concerns" ON public.sister_concerns;
CREATE POLICY "Authenticated can manage sister concerns" ON public.sister_concerns TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage site settings" ON public.site_settings;
CREATE POLICY "Authenticated can manage site settings" ON public.site_settings TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage site wa templates" ON public.site_whatsapp_templates;
CREATE POLICY "Authenticated can manage site wa templates" ON public.site_whatsapp_templates TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage site whatsapp templates" ON public.site_whatsapp_templates;
CREATE POLICY "Authenticated can manage site whatsapp templates" ON public.site_whatsapp_templates TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage testimonial videos" ON public.testimonial_videos;
CREATE POLICY "Authenticated can manage testimonial videos" ON public.testimonial_videos TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can manage youtube videos" ON public.youtube_videos;
CREATE POLICY "Authenticated can manage youtube videos" ON public.youtube_videos TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated can view enquiries" ON public.enquiries;
CREATE POLICY "Authenticated can view enquiries" ON public.enquiries FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete cctv products" ON public.cctv_products;
CREATE POLICY "Authenticated users can delete cctv products" ON public.cctv_products FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete daily deals" ON public.daily_deals;
CREATE POLICY "Authenticated users can delete daily deals" ON public.daily_deals FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete gallery images" ON public.gallery_images;
CREATE POLICY "Authenticated users can delete gallery images" ON public.gallery_images FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete services" ON public.services;
CREATE POLICY "Authenticated users can delete services" ON public.services FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete site settings" ON public.site_settings;
CREATE POLICY "Authenticated users can delete site settings" ON public.site_settings FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete youtube videos" ON public.youtube_videos;
CREATE POLICY "Authenticated users can delete youtube videos" ON public.youtube_videos FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert cctv products" ON public.cctv_products;
CREATE POLICY "Authenticated users can insert cctv products" ON public.cctv_products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can insert daily deals" ON public.daily_deals;
CREATE POLICY "Authenticated users can insert daily deals" ON public.daily_deals FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can insert gallery images" ON public.gallery_images;
CREATE POLICY "Authenticated users can insert gallery images" ON public.gallery_images FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can insert services" ON public.services;
CREATE POLICY "Authenticated users can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can insert site settings" ON public.site_settings;
CREATE POLICY "Authenticated users can insert site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can insert youtube videos" ON public.youtube_videos;
CREATE POLICY "Authenticated users can insert youtube videos" ON public.youtube_videos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update cctv products" ON public.cctv_products;
CREATE POLICY "Authenticated users can update cctv products" ON public.cctv_products FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can update daily deals" ON public.daily_deals;
CREATE POLICY "Authenticated users can update daily deals" ON public.daily_deals FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can update gallery images" ON public.gallery_images;
CREATE POLICY "Authenticated users can update gallery images" ON public.gallery_images FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can update services" ON public.services;
CREATE POLICY "Authenticated users can update services" ON public.services FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON public.site_settings;
CREATE POLICY "Authenticated users can update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can update youtube videos" ON public.youtube_videos;
CREATE POLICY "Authenticated users can update youtube videos" ON public.youtube_videos FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "CRM admins delete admin settings" ON public.crm_admin_settings;
CREATE POLICY "CRM admins delete admin settings" ON public.crm_admin_settings FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete audit" ON public.crm_stock_audit_log;
CREATE POLICY "CRM admins delete audit" ON public.crm_stock_audit_log FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete camp templates" ON public.campaign_templates;
CREATE POLICY "CRM admins delete camp templates" ON public.campaign_templates FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete campaigns" ON public.campaigns;
CREATE POLICY "CRM admins delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete cust settings" ON public.admin_customer_settings;
CREATE POLICY "CRM admins delete cust settings" ON public.admin_customer_settings FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete inv audits" ON public.inventory_audits;
CREATE POLICY "CRM admins delete inv audits" ON public.inventory_audits FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete inv tx" ON public.inventory_transactions;
CREATE POLICY "CRM admins delete inv tx" ON public.inventory_transactions FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete quot templates" ON public.quotation_templates;
CREATE POLICY "CRM admins delete quot templates" ON public.quotation_templates FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete quotations" ON public.crm_quotations;
CREATE POLICY "CRM admins delete quotations" ON public.crm_quotations FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete recipients" ON public.campaign_recipients;
CREATE POLICY "CRM admins delete recipients" ON public.campaign_recipients FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete rem settings" ON public.admin_reminder_settings;
CREATE POLICY "CRM admins delete rem settings" ON public.admin_reminder_settings FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete reminders queue" ON public.reminders_queue;
CREATE POLICY "CRM admins delete reminders queue" ON public.reminders_queue FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete send log" ON public.quotation_send_log;
CREATE POLICY "CRM admins delete send log" ON public.quotation_send_log FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete templates_q" ON public.quotation_templates;
CREATE POLICY "CRM admins delete templates_q" ON public.quotation_templates FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins delete wa log" ON public.crm_whatsapp_log;
CREATE POLICY "CRM admins delete wa log" ON public.crm_whatsapp_log FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins insert admin settings" ON public.crm_admin_settings;
CREATE POLICY "CRM admins insert admin settings" ON public.crm_admin_settings FOR INSERT TO authenticated WITH CHECK (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins insert cust settings" ON public.admin_customer_settings;
CREATE POLICY "CRM admins insert cust settings" ON public.admin_customer_settings FOR INSERT TO authenticated WITH CHECK (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins insert rem settings" ON public.admin_reminder_settings;
CREATE POLICY "CRM admins insert rem settings" ON public.admin_reminder_settings FOR INSERT TO authenticated WITH CHECK (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins update admin settings" ON public.crm_admin_settings;
CREATE POLICY "CRM admins update admin settings" ON public.crm_admin_settings FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins update audit" ON public.crm_stock_audit_log;
CREATE POLICY "CRM admins update audit" ON public.crm_stock_audit_log FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins update cust settings" ON public.admin_customer_settings;
CREATE POLICY "CRM admins update cust settings" ON public.admin_customer_settings FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins update inv audits" ON public.inventory_audits;
CREATE POLICY "CRM admins update inv audits" ON public.inventory_audits FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins update inv tx" ON public.inventory_transactions;
CREATE POLICY "CRM admins update inv tx" ON public.inventory_transactions FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM admins update rem settings" ON public.admin_reminder_settings;
CREATE POLICY "CRM admins update rem settings" ON public.admin_reminder_settings FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'::public.crm_app_role));
DROP POLICY IF EXISTS "CRM users can delete enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can delete enquiries" ON public.crm_enquiries FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users can insert enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can insert enquiries" ON public.crm_enquiries FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users can update enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can update enquiries" ON public.crm_enquiries FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users can view enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can view enquiries" ON public.crm_enquiries FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete customers" ON public.crm_customers;
CREATE POLICY "CRM users delete customers" ON public.crm_customers FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete event logs" ON public.customer_event_logs;
CREATE POLICY "CRM users delete event logs" ON public.customer_event_logs FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete quotes" ON public.crm_quote_shares;
CREATE POLICY "CRM users delete quotes" ON public.crm_quote_shares FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users delete reminders" ON public.crm_warranty_reminders FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete reminders" ON public.reminders_queue;
CREATE POLICY "CRM users delete reminders" ON public.reminders_queue FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete sales" ON public.crm_sales;
CREATE POLICY "CRM users delete sales" ON public.crm_sales FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete services" ON public.crm_services;
CREATE POLICY "CRM users delete services" ON public.crm_services FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users delete templates" ON public.crm_whatsapp_templates FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert audit" ON public.crm_stock_audit_log;
CREATE POLICY "CRM users insert audit" ON public.crm_stock_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert camp templates" ON public.campaign_templates;
CREATE POLICY "CRM users insert camp templates" ON public.campaign_templates FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert campaigns" ON public.campaigns;
CREATE POLICY "CRM users insert campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert customers" ON public.crm_customers;
CREATE POLICY "CRM users insert customers" ON public.crm_customers FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert event logs" ON public.customer_event_logs;
CREATE POLICY "CRM users insert event logs" ON public.customer_event_logs FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert inv audits" ON public.inventory_audits;
CREATE POLICY "CRM users insert inv audits" ON public.inventory_audits FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert inv tx" ON public.inventory_transactions;
CREATE POLICY "CRM users insert inv tx" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert quot templates" ON public.quotation_templates;
CREATE POLICY "CRM users insert quot templates" ON public.quotation_templates FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert quotations" ON public.crm_quotations;
CREATE POLICY "CRM users insert quotations" ON public.crm_quotations FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert quotes" ON public.crm_quote_shares;
CREATE POLICY "CRM users insert quotes" ON public.crm_quote_shares FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert recipients" ON public.campaign_recipients;
CREATE POLICY "CRM users insert recipients" ON public.campaign_recipients FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users insert reminders" ON public.crm_warranty_reminders FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert reminders" ON public.reminders_queue;
CREATE POLICY "CRM users insert reminders" ON public.reminders_queue FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert reminders queue" ON public.reminders_queue;
CREATE POLICY "CRM users insert reminders queue" ON public.reminders_queue FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert sales" ON public.crm_sales;
CREATE POLICY "CRM users insert sales" ON public.crm_sales FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert send log" ON public.quotation_send_log;
CREATE POLICY "CRM users insert send log" ON public.quotation_send_log FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert services" ON public.crm_services;
CREATE POLICY "CRM users insert services" ON public.crm_services FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert settings" ON public.crm_settings;
CREATE POLICY "CRM users insert settings" ON public.crm_settings FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users insert templates" ON public.crm_whatsapp_templates FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert templates_q" ON public.quotation_templates;
CREATE POLICY "CRM users insert templates_q" ON public.quotation_templates FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert wa log" ON public.crm_whatsapp_log;
CREATE POLICY "CRM users insert wa log" ON public.crm_whatsapp_log FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users manage catalogue delete" ON public.crm_catalogue;
CREATE POLICY "CRM users manage catalogue delete" ON public.crm_catalogue FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users manage catalogue insert" ON public.crm_catalogue;
CREATE POLICY "CRM users manage catalogue insert" ON public.crm_catalogue FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users manage catalogue update" ON public.crm_catalogue;
CREATE POLICY "CRM users manage catalogue update" ON public.crm_catalogue FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update camp templates" ON public.campaign_templates;
CREATE POLICY "CRM users update camp templates" ON public.campaign_templates FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update campaigns" ON public.campaigns;
CREATE POLICY "CRM users update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update customers" ON public.crm_customers;
CREATE POLICY "CRM users update customers" ON public.crm_customers FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update event logs" ON public.customer_event_logs;
CREATE POLICY "CRM users update event logs" ON public.customer_event_logs FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update quot templates" ON public.quotation_templates;
CREATE POLICY "CRM users update quot templates" ON public.quotation_templates FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update quotations" ON public.crm_quotations;
CREATE POLICY "CRM users update quotations" ON public.crm_quotations FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update quotes" ON public.crm_quote_shares;
CREATE POLICY "CRM users update quotes" ON public.crm_quote_shares FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update recipients" ON public.campaign_recipients;
CREATE POLICY "CRM users update recipients" ON public.campaign_recipients FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users update reminders" ON public.crm_warranty_reminders FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update reminders" ON public.reminders_queue;
CREATE POLICY "CRM users update reminders" ON public.reminders_queue FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update reminders queue" ON public.reminders_queue;
CREATE POLICY "CRM users update reminders queue" ON public.reminders_queue FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update sales" ON public.crm_sales;
CREATE POLICY "CRM users update sales" ON public.crm_sales FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update services" ON public.crm_services;
CREATE POLICY "CRM users update services" ON public.crm_services FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update settings" ON public.crm_settings;
CREATE POLICY "CRM users update settings" ON public.crm_settings FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users update templates" ON public.crm_whatsapp_templates FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update templates_q" ON public.quotation_templates;
CREATE POLICY "CRM users update templates_q" ON public.quotation_templates FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view admin settings" ON public.crm_admin_settings;
CREATE POLICY "CRM users view admin settings" ON public.crm_admin_settings FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view audit" ON public.crm_stock_audit_log;
CREATE POLICY "CRM users view audit" ON public.crm_stock_audit_log FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view camp templates" ON public.campaign_templates;
CREATE POLICY "CRM users view camp templates" ON public.campaign_templates FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view campaigns" ON public.campaigns;
CREATE POLICY "CRM users view campaigns" ON public.campaigns FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view cust settings" ON public.admin_customer_settings;
CREATE POLICY "CRM users view cust settings" ON public.admin_customer_settings FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view customers" ON public.crm_customers;
CREATE POLICY "CRM users view customers" ON public.crm_customers FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view event logs" ON public.customer_event_logs;
CREATE POLICY "CRM users view event logs" ON public.customer_event_logs FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view inv audits" ON public.inventory_audits;
CREATE POLICY "CRM users view inv audits" ON public.inventory_audits FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view inv tx" ON public.inventory_transactions;
CREATE POLICY "CRM users view inv tx" ON public.inventory_transactions FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view quot templates" ON public.quotation_templates;
CREATE POLICY "CRM users view quot templates" ON public.quotation_templates FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view quotations" ON public.crm_quotations;
CREATE POLICY "CRM users view quotations" ON public.crm_quotations FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view recipients" ON public.campaign_recipients;
CREATE POLICY "CRM users view recipients" ON public.campaign_recipients FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view rem settings" ON public.admin_reminder_settings;
CREATE POLICY "CRM users view rem settings" ON public.admin_reminder_settings FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users view reminders" ON public.crm_warranty_reminders FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view reminders" ON public.reminders_queue;
CREATE POLICY "CRM users view reminders" ON public.reminders_queue FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view reminders queue" ON public.reminders_queue;
CREATE POLICY "CRM users view reminders queue" ON public.reminders_queue FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view sales" ON public.crm_sales;
CREATE POLICY "CRM users view sales" ON public.crm_sales FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view send log" ON public.quotation_send_log;
CREATE POLICY "CRM users view send log" ON public.quotation_send_log FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view services" ON public.crm_services;
CREATE POLICY "CRM users view services" ON public.crm_services FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view settings" ON public.crm_settings;
CREATE POLICY "CRM users view settings" ON public.crm_settings FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users view templates" ON public.crm_whatsapp_templates FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view templates_q" ON public.quotation_templates;
CREATE POLICY "CRM users view templates_q" ON public.quotation_templates FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users view wa log" ON public.crm_whatsapp_log;
CREATE POLICY "CRM users view wa log" ON public.crm_whatsapp_log FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "Public can view quotations by link" ON public.crm_quotations;
CREATE POLICY "Public can view quotations by link" ON public.crm_quotations FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Service role full access rem settings" ON public.admin_reminder_settings;
CREATE POLICY "Service role full access rem settings" ON public.admin_reminder_settings TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access reminders" ON public.reminders_queue;
CREATE POLICY "Service role full access reminders" ON public.reminders_queue TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view own roles" ON public.crm_user_roles;
CREATE POLICY "Users can view own roles" ON public.crm_user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));

-- ============================================================
-- STORAGE
-- ============================================================
-- Buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('customer-photos','customer-photos',true),
  ('shop-assets','shop-assets',true)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, public=EXCLUDED.public;

-- Storage object policies
DROP POLICY IF EXISTS "Public read customer photos" ON storage.objects;
CREATE POLICY "Public read customer photos" ON storage.objects FOR SELECT TO public USING (bucket_id='customer-photos');

DROP POLICY IF EXISTS "Public can view customer photos" ON storage.objects;
CREATE POLICY "Public can view customer photos" ON storage.objects FOR SELECT TO public USING (bucket_id='customer-photos');

DROP POLICY IF EXISTS "Public read shop assets" ON storage.objects;
CREATE POLICY "Public read shop assets" ON storage.objects FOR SELECT TO public USING (bucket_id='shop-assets');

DROP POLICY IF EXISTS "Public read shop-assets" ON storage.objects;
CREATE POLICY "Public read shop-assets" ON storage.objects FOR SELECT TO public USING (bucket_id='shop-assets');

DROP POLICY IF EXISTS "Auth upload customer photos" ON storage.objects;
CREATE POLICY "Auth upload customer photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='customer-photos');

DROP POLICY IF EXISTS "Auth update customer photos" ON storage.objects;
CREATE POLICY "Auth update customer photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='customer-photos');

DROP POLICY IF EXISTS "Auth delete customer photos" ON storage.objects;
CREATE POLICY "Auth delete customer photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='customer-photos');

DROP POLICY IF EXISTS "Auth upload shop assets" ON storage.objects;
CREATE POLICY "Auth upload shop assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='shop-assets');

DROP POLICY IF EXISTS "Auth update shop assets" ON storage.objects;
CREATE POLICY "Auth update shop assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='shop-assets');

DROP POLICY IF EXISTS "Auth delete shop assets" ON storage.objects;
CREATE POLICY "Auth delete shop assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='shop-assets');

DROP POLICY IF EXISTS "CRM users can upload customer photos" ON storage.objects;
CREATE POLICY "CRM users can upload customer photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='customer-photos' AND public.is_crm_user(auth.uid()));

DROP POLICY IF EXISTS "CRM users can update customer photos" ON storage.objects;
CREATE POLICY "CRM users can update customer photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='customer-photos' AND public.is_crm_user(auth.uid()));

DROP POLICY IF EXISTS "CRM users can delete customer photos" ON storage.objects;
CREATE POLICY "CRM users can delete customer photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='customer-photos' AND public.is_crm_user(auth.uid()));

DROP POLICY IF EXISTS "CRM users upload shop-assets" ON storage.objects;
CREATE POLICY "CRM users upload shop-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='shop-assets' AND public.is_crm_user(auth.uid()));

DROP POLICY IF EXISTS "CRM users update shop-assets" ON storage.objects;
CREATE POLICY "CRM users update shop-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='shop-assets' AND public.is_crm_user(auth.uid()));

DROP POLICY IF EXISTS "CRM users delete shop-assets" ON storage.objects;
CREATE POLICY "CRM users delete shop-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='shop-assets' AND public.is_crm_user(auth.uid()));


-- ============================================================
-- REALTIME
-- ============================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_warranty_reminders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders_queue;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- SEED DATA (config / templates only — no PII)
-- ============================================================
-- admin_customer_settings
INSERT INTO public.admin_customer_settings VALUES
	('65e6bfb1-3e49-4d4e-8152-e65efdd646e2', 'rank', 'Bronze', '#CD7F32', 1, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('0c0e86e2-9bd9-4fa6-a2e6-42da2aa60fd1', 'rank', 'Silver', '#C0C0C0', 2, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('44ae6334-9d25-42a5-85e6-8bdd4efcdcea', 'rank', 'Gold', '#FFD700', 3, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('31d0c783-472b-4d5d-9747-6b071e8021ea', 'rank', 'Platinum', '#E5E4E2', 4, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('5d2f18c0-f47e-4b35-ac8f-fa803fe5032f', 'source_mode', 'Walk-in', NULL, 1, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('25cc8e94-3d7d-4c63-bcc3-080a081000a5', 'source_mode', 'Social Media', NULL, 2, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('d5b579af-5dc7-467e-b1f8-d8000173e34d', 'source_mode', 'Telephonic', NULL, 3, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('0bd16d4b-d412-43c4-9b96-8bf0e26cbd90', 'source_mode', 'Referral', NULL, 4, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('fcd60983-3e6c-454d-81f4-28db9d6f926e', 'source_mode', 'Online', NULL, 5, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('6a62d164-d251-4410-ad92-60cb313bb1d2', 'source_mode', 'Exhibition', NULL, 6, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('4f4b024f-e4b4-4da7-b88c-5f7e11ea6ff1', 'source_mode', 'Other', NULL, 7, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('9d6b47a8-331a-4420-b7e7-565832d9fc01', 'occupation', 'Student', NULL, 1, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('8ecdbbec-77a2-401a-b814-0d63e31c15f1', 'occupation', 'Businessman', NULL, 2, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('03342f53-139d-441b-aa46-17f81fdfc5a1', 'occupation', 'Service', NULL, 3, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('ba4d3061-b9fc-4c1c-b78d-95ad075cf205', 'occupation', 'Professional', NULL, 4, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('ec9077c2-0332-4229-ac3e-b2421db84715', 'occupation', 'Homemaker', NULL, 5, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('dc3a048f-ee20-44df-bb41-8b481f62a7ce', 'occupation', 'Retired', NULL, 6, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('72d2af4a-d84a-49aa-bb37-cc00b2ee9b83', 'occupation', 'Other', NULL, 7, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('c738d7c8-228e-4b28-92be-76ebd4dfb7d0', 'campaign_type', 'Festival', NULL, 1, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('2f3589bf-90fe-44ff-b908-7286991e4462', 'campaign_type', 'Offer', NULL, 2, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('6bf2e3ea-55e2-4793-adca-6132ff289e55', 'campaign_type', 'Win-Back', NULL, 3, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('110b3c0c-4d3a-43ac-984a-d3c83b3fbbe0', 'campaign_type', 'New Arrival', NULL, 4, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('a3659210-5484-409d-bc1a-7c44e72251f3', 'campaign_type', 'General', NULL, 5, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('1077d98c-0fab-4a3e-a66b-52727af77933', 'campaign_type', 'Thank You', NULL, 6, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('140e2b6a-1ef5-4ccf-ae0d-d74021a927ea', 'campaign_type', 'Other', NULL, 7, true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00')
ON CONFLICT DO NOTHING;
-- admin_reminder_settings
INSERT INTO public.admin_reminder_settings VALUES
	('6a234648-2b74-4278-8f77-bdceda6e4dc1', 'reminder_lead_days', '1', '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('06145b60-d0e4-4137-a3a7-2c6f6358c103', 'birthday_enabled', 'true', '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('b7743c97-8490-4e16-bcf9-729511ddb73c', 'anniversary_enabled', 'true', '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('058ef403-794a-4551-85af-f15da20b7920', 'min_days_between_messages', '7', '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('1a03fb66-057c-4d4e-8335-532b7fdb2a7f', 'birthday_template', 'Dear {{customer_name}}, Wishing you a very Happy Birthday! May this day bring you joy and success.  Team {{business_name}}', '2026-04-19 10:22:11.064897+00', '2026-04-22 07:59:46.593879+00'),
	('4be14a86-1e8f-41f5-8a6d-38ee0feb8261', 'anniversary_template', 'Dear {{customer_name}}, Wishing you a very Happy Anniversary! May your bond grow stronger every year.  Team {{business_name}}', '2026-04-19 10:22:11.064897+00', '2026-04-22 07:59:47.106067+00')
ON CONFLICT DO NOTHING;
-- campaign_templates
INSERT INTO public.campaign_templates VALUES
	('15010feb-8754-493b-b2b4-2ce4ad442bc2', 'Diwali Wishes', 'Festival', 'Dear {{customer_name}}, Wishing you & your family a very Happy Diwali! May this festival bring light, prosperity & joy. - Team {{business_name}}', 'customer_name,business_name', true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('dcced173-672a-451c-b9c8-1e610918ed76', 'New Year Wishes', 'Festival', 'Dear {{customer_name}}, Wishing you a very Happy New Year! Thank you for being a valued customer. - Team {{business_name}}', 'customer_name,business_name', true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('dbce5710-1b49-424e-9517-944dda2cdb29', 'Eid Mubarak', 'Festival', 'Dear {{customer_name}}, Eid Mubarak! Wishing you & your family peace and happiness. - Team {{business_name}}', 'customer_name,business_name', true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('8f8cc1a6-0de9-4099-b61a-7daebb7ce061', 'Sale Announcement', 'Offer', 'Hi {{customer_name}}, Big Sale is LIVE at {{business_name}}! Visit us today for the best deals on laptops, CCTV & more. Reply for details.', 'customer_name,business_name', true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('8eb886ef-8069-4bdd-a503-47bb0e2abebe', 'New Arrival Alert', 'New Arrival', 'Hi {{customer_name}}, New stock just arrived at {{business_name}}! Latest laptops & accessories now available. Visit us or reply to know more.', 'customer_name,business_name', true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('8b906b82-08c4-43ad-9534-4b37210c9a9b', 'Win-Back Offer', 'Win-Back', 'Hi {{customer_name}}, We miss you! Your last visit was on {{last_purchase_date}}. Drop by {{business_name}} this week for a special returning-customer discount.', 'customer_name,business_name,last_purchase_date', true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00'),
	('2f9ba025-622a-4dc2-b84e-498ca9171d33', 'Thank You (post purchase)', 'Thank You', 'Dear {{customer_name}}, Thank you for shopping with {{business_name}}! We truly appreciate your trust. For any support, just reply to this message.', 'customer_name,business_name', true, '2026-04-19 10:22:11.064897+00', '2026-04-19 10:22:11.064897+00')
ON CONFLICT DO NOTHING;
-- crm_admin_settings
INSERT INTO public.crm_admin_settings VALUES
	('6a0f7e93-a29c-4079-87e2-2915ae18ed48', '2026-04-18 09:12:51.383029+00', '2026-04-18 09:12:51.383029+00', 'enquiry_categories', '["Laptop","Desktop","CCTV","Networking","Accessories","Printer","Mobile","Other"]', 'json'),
	('f5320d4a-f090-4502-9a47-2d3b3d1070fb', '2026-04-18 09:12:51.383029+00', '2026-04-18 09:12:51.383029+00', 'enquiry_statuses', '["new","follow_up","quoted","converted","lost"]', 'json'),
	('3b7afc95-c3c5-4bc8-8a9f-dc49dabfd43b', '2026-04-18 09:12:51.383029+00', '2026-04-18 09:12:51.383029+00', 'sale_payment_modes', '["cash","upi","card","emi","credit","neft"]', 'json'),
	('1525fbcf-e1f6-4191-afb5-98c51ff894b5', '2026-04-18 09:12:51.383029+00', '2026-04-18 09:12:51.383029+00', 'service_statuses', '["received","diagnosing","repairing","ready","delivered","cancelled"]', 'json'),
	('57351211-6683-4f38-8da4-82577af17d5c', '2026-04-18 09:12:51.383029+00', '2026-04-18 09:12:51.383029+00', 'catalogue_categories', '["laptop","desktop","cctv","networking","accessory","printer","mobile","other"]', 'json'),
	('7a205313-5a59-42f3-9e49-94c8a21561ba', '2026-04-18 09:12:51.383029+00', '2026-04-22 07:59:13.71714+00', 'default_gst_percent', '0', 'number'),
	('c3d4cbce-c54d-4f15-b743-5c543cbe671e', '2026-04-18 09:12:51.383029+00', '2026-04-22 07:59:13.899084+00', 'default_validity_days', '2', 'number'),
	('b16b0460-7d5a-4f66-90ae-a2ea8b094db0', '2026-04-18 09:12:51.383029+00', '2026-04-22 07:59:14.088078+00', 'quotation_terms', 'Prices valid for 2 days. . Subject to availability.', 'text'),
	('be490999-26d4-49a1-92fc-fc0133113d2a', '2026-04-18 09:12:51.383029+00', '2026-04-22 07:59:14.285667+00', 'quote_prefix', 'QT', 'text'),
	('c1561b95-414a-4ba2-a3e9-2e59bb18555b', '2026-04-18 09:12:51.383029+00', '2026-04-22 07:59:14.467523+00', 'invoice_prefix', 'INV', 'text'),
	('607e474f-c58f-4601-8942-c7afd7bd1c21', '2026-04-18 19:57:46.46316+00', '2026-04-22 07:59:14.659844+00', 'quotation_message_template', 'Dear {{client_name}} ji,
Your Quotation
{{items_table}}
Final Total: | {{grand_total}}
*{{company_name}}* | Quotation: *{{quote_no}}* | Date: {{date}} | Valid till: {{validity_date}}
For Calls & Consultations : {{shop_phone}}
', 'text'),
	('b6970b74-9a46-4ad1-9caf-77afdd6e612b', '2026-04-18 09:12:51.383029+00', '2026-04-18 14:15:44.84311+00', 'low_stock_threshold', '1', 'number'),
	('2910fe61-9c48-4e25-b157-c28d6a5ab2fa', '2026-04-18 09:12:51.383029+00', '2026-04-18 14:15:45.116875+00', 'show_out_of_stock', 'false', 'boolean'),
	('fbe19529-5d44-435f-90b1-a12605492e65', '2026-04-18 09:12:51.383029+00', '2026-04-21 17:45:24.936214+00', 'whatsapp_week_template', 'Hi {name}! Thank you for purchasing {item} from The Computer Solutions. Hope you are enjoying it! For any support call {shop_phone}.', 'text'),
	('0ddb2d70-bfaf-4b54-b096-049eefc3ab51', '2026-04-18 11:20:03.251076+00', '2026-04-18 11:20:03.251076+00', 'quotation_primary_color', '#1a1a2e', 'text'),
	('896e7ffe-64cc-4121-a7f3-9901382718a9', '2026-04-18 11:20:03.251076+00', '2026-04-18 11:20:03.251076+00', 'quotation_accent_color', '#e94560', 'text'),
	('b4ffeffe-5183-4f76-b8eb-866a4af5c471', '2026-04-18 11:20:03.251076+00', '2026-04-18 11:20:03.251076+00', 'quotation_font_color', '#1a1a2e', 'text'),
	('45fb2931-f0a5-44a3-9a4b-4b91044cbe69', '2026-04-18 11:20:03.251076+00', '2026-04-18 11:20:03.251076+00', 'quotation_bg_color', '#ffffff', 'text'),
	('cd67f60c-f308-4129-99b3-3d61137aad31', '2026-04-18 11:20:03.251076+00', '2026-04-18 11:20:03.251076+00', 'quotation_header_style', 'modern', 'text'),
	('026a033a-319b-4b81-9cd8-b7bc8b2d59a3', '2026-04-18 11:20:03.251076+00', '2026-04-18 11:20:03.251076+00', 'quotation_footer_text', 'Thank you for your business!', 'text'),
	('c526e2d5-20ac-46b5-b6b0-1d2775525751', '2026-04-18 11:20:03.251076+00', '2026-04-18 11:20:03.251076+00', 'quotation_watermark', 'QUOTATION', 'text'),
	('30243e84-8bb0-4405-93c6-be31456152a0', '2026-04-18 09:12:51.383029+00', '2026-04-21 17:45:25.166208+00', 'whatsapp_month_template', 'Hi {name}! It has been a month since you purchased {item}. Everything going well? We are here for any support. - The Computer Solutions', 'text'),
	('07fc1640-94df-4d1d-aafe-46aa6f395a57', '2026-04-18 09:12:51.383029+00', '2026-04-21 17:45:25.377549+00', 'whatsapp_3month_template', 'Hi {name}! Quick check-in on your {item} purchased on {purchase_date}. Warranty valid till {expiry}. Any issues? Call us at {shop_phone}.', 'text'),
	('7fd83416-4135-4347-9c1b-d06730252a38', '2026-04-18 09:12:51.383029+00', '2026-04-21 17:45:25.593586+00', 'whatsapp_6month_template', 'Hi {name}! Your {item} has 6 months of warranty remaining (expires {expiry}). Consider our AMC plan for extended coverage! - The Computer Solutions', 'text'),
	('8e0951f5-0d85-4117-a229-e84ee6ba0a2c', '2026-04-18 09:12:51.383029+00', '2026-04-21 17:45:25.789338+00', 'whatsapp_11month_template', 'IMPORTANT: Hi {name}, your {item} warranty expires on {expiry} - just 1 month away! Get it checked FREE before expiry. Call {shop_phone} now.', 'text'),
	('b2db26ad-eb57-414d-acad-38761aa579dd', '2026-04-18 09:12:51.383029+00', '2026-04-21 17:45:25.996843+00', 'whatsapp_birthday_template', 'Happy Birthday {name}! Wishing you a wonderful year ahead! Enjoy a special discount on your next purchase. - The Computer Solutions Team', 'text'),
	('bb1aeebe-7fbd-486f-98b5-ee89a7c9bb07', '2026-04-18 09:12:51.383029+00', '2026-04-18 14:01:37.562934+00', 'shop_name', 'Computer Solutions', 'text'),
	('83328ab2-6285-47ad-ad3f-945e999c6d17', '2026-04-18 09:12:51.383029+00', '2026-04-18 14:01:37.805414+00', 'shop_address', 'Atec Avenue. Hardochhanni Road Gurdaspur  143521', 'text'),
	('060dbf4d-91b9-4c1d-be56-15706b7fc1d0', '2026-04-18 09:12:51.383029+00', '2026-04-18 14:01:38.047299+00', 'shop_phone', '9877868206', 'text'),
	('8e9e3490-8937-4f52-8c42-3a28287a9fc0', '2026-04-18 09:12:51.383029+00', '2026-04-18 14:01:38.295801+00', 'shop_whatsapp', '9877868206', 'text'),
	('a0c95ebb-c30c-4149-9fb0-1708095bfc08', '2026-04-18 09:12:51.383029+00', '2026-04-18 14:01:38.543785+00', 'shop_gst', '', 'text'),
	('1c9ad12f-8a4c-4b70-9c81-31b76fb38484', '2026-04-18 09:12:51.383029+00', '2026-04-18 14:01:38.820523+00', 'shop_email', 'compsolsgsp@gmail.com', 'text'),
	('11cfb6ef-9368-4a26-8157-8825a4ed1864', '2026-04-18 09:12:51.383029+00', '2026-04-18 14:01:39.074873+00', 'shop_website', 'thecomputersolutions.in', 'text'),
	('d686da91-5058-47c6-a93d-c647c88d021e', '2026-04-18 11:20:03.251076+00', '2026-04-18 14:02:22.525762+00', 'shop_logo_url', 'https://mtravmbfuqrmujfbcfzy.supabase.co/storage/v1/object/public/shop-assets/logo-1776520934186.png', 'text')
ON CONFLICT DO NOTHING;
-- crm_settings
INSERT INTO public.crm_settings VALUES
	('34786e36-33ac-4ce5-a36b-b39401c26ba0', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'shop_gst', ''),
	('75cf1a26-5449-415c-bd17-24cc900f2b9b', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'shop_logo_url', ''),
	('369adfcc-1fd1-4609-8429-74173c1076cc', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'low_stock_threshold', '3'),
	('dc1e01e5-ecd5-476c-9bc7-e78c65dbc5ff', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'invoice_prefix', 'INV'),
	('a59b0895-13e8-41e1-affa-1be89aa01fd0', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'service_prefix', 'SRV'),
	('00783e31-afea-42ba-862c-fc9cca675dd1', '2026-04-17 18:22:57.318995+00', '2026-04-18 07:19:32.537315+00', 'shop_name', 'The Computer Solutions'),
	('81af6834-cd72-46ec-823f-ebab2012ab3a', '2026-04-17 18:22:57.318995+00', '2026-04-18 07:19:32.926318+00', 'shop_phone', '9877868206'),
	('d9929b4f-6e43-4fe3-bedf-c6f2f16f2084', '2026-04-18 07:19:30.688232+00', '2026-04-18 07:19:33.374803+00', 'shop_whatsapp', '9877868206'),
	('83fcfc78-b703-47e7-a84a-5278534f1121', '2026-04-18 07:19:31.139254+00', '2026-04-18 07:19:33.763617+00', 'shop_email', 'compsolsgsp@gmail.com'),
	('597be95b-778b-4a36-9ece-9f5ddcf311fd', '2026-04-17 18:22:57.318995+00', '2026-04-18 07:19:34.152635+00', 'shop_address', 'ground floor, atec avenue hardochhanni road gurdaspur'),
	('b674b8ea-d6b3-4b5d-abad-8fa9d0831c83', '2026-04-18 07:19:32.051758+00', '2026-04-18 07:19:34.574873+00', 'shop_gstin', ''),
	('646c2c85-e061-4e22-a993-4d267b965e5a', '2026-04-18 07:19:32.461328+00', '2026-04-18 07:19:35.007166+00', 'invoice_footer', 'thank you for business')
ON CONFLICT DO NOTHING;
-- crm_whatsapp_templates
INSERT INTO public.crm_whatsapp_templates VALUES
	('f33a1255-c390-44c3-b7ce-7b3424700319', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'warranty_1month', 'Hi {name}! Your {item} purchased on {date} is doing great! Hope you''re enjoying it. For any help call us: {phone}', 'warranty'),
	('9b0d19a4-e7ab-425e-82e9-79c92b386c2b', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'warranty_3month', 'Hi {name}! Quick check-in on your {item}. Warranty valid till {expiry}. Any issues? We''re here!', 'warranty'),
	('75bcdf57-1cf7-4d2c-9f7d-03f07c1cbf16', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'warranty_6month', 'Hi {name}! Your {item} has 6 months of warranty remaining. Consider our AMC plan for extended coverage!', 'warranty'),
	('186366e2-7675-4cec-9e9c-af07aa5cac6d', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'warranty_pre_expiry', 'IMPORTANT: {name}, warranty on your {item} expires on {expiry}. Extend now or get it checked FREE before expiry!', 'warranty'),
	('0f9513e6-aad4-4d65-875a-fe1bdddba557', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'birthday', 'Happy Birthday {name}! Wishing you a great year! Enjoy 5% OFF on your next purchase at The Computer Solutions!', 'birthday'),
	('10ea8393-8a02-48b7-ace6-ed2bdd69fd6a', '2026-04-17 18:22:57.318995+00', '2026-04-17 18:22:57.318995+00', 'service_update', 'Dear {name}, your {device} job #{jobno} is now {status}. Contact: {phone}', 'service'),
	('b3392cb4-121e-4948-a647-898e94bff1b9', '2026-04-21 13:55:06.792103+00', '2026-04-21 13:55:06.792103+00', 'service_status_update', 'Hi {name}, update on your {device} (Job {job_no}): Status is now *{status}*.{cost_line}
— {shop_name}', 'service'),
	('d1ea3de0-7fe4-415b-bd07-8123a2b8918a', '2026-04-21 13:55:06.792103+00', '2026-04-21 13:55:06.792103+00', 'sales_form_request', 'Hello! Please fill in your purchase details using the link below — it only takes a minute:
{link}
Thank you!
— {shop_name}', 'sales'),
	('a9fedc66-f511-48cd-9278-0c3e4c008185', '2026-04-21 13:55:06.792103+00', '2026-04-21 13:55:06.792103+00', 'warranty_1week', 'Hi {name}, just a quick reminder — your {item} purchased on {purchase_date} has been with you for a week. Hope everything is going great! Reach us at {shop_phone} if you need anything.
— {shop_name}', 'warranty'),
	('e1f1ad97-7973-4570-b7c3-ee18b58ec77e', '2026-04-21 13:55:06.792103+00', '2026-04-21 13:55:06.792103+00', 'warranty_11month', 'Hi {name}, your {item} warranty expires on {expiry} (in about a month). Consider an extended service plan or a check-up. Call {shop_phone}.
— {shop_name}', 'warranty'),
	('78839592-5707-4192-8dd0-81899f06fa58', '2026-04-21 13:55:06.792103+00', '2026-04-21 17:55:07.498596+00', 'enquiry_followup', 'Hi {name},
 Regarding your Enquiry for {item} at {shop_name}.{specs_block} = {price}
Please let us know if you have any questions.
Team — {shop_name}', 'enquiry'),
	('a575d391-4ddc-474e-8cf7-586cfac7709c', '2026-04-21 13:55:06.792103+00', '2026-04-21 17:59:38.181259+00', 'quotation_send', 'Hi {name}
Please Find your Quotation {quote_no} below.
Total: {total}
Valid until: {valid_until}
Team — {shop_name}', 'quote'),
	('0a56d227-4358-4fce-849c-aea6d6ba8eda', '2026-04-17 18:22:57.318995+00', '2026-04-21 18:00:08.834493+00', 'quote', 'Hi {name}! 
Here is your Quote: {item} with  {specs_block}  for = ₹{price}. Valid until {expiry}. ', 'quote'),
	('6554614f-a19d-46b0-b856-075dc2b79776', '2026-04-21 13:55:06.792103+00', '2026-04-21 14:30:54.626673+00', 'dashboard_reminder', 'Hi {name}, this is a friendly reminder regarding your {item}.
— {shop_name}', 'general'),
	('e43eea42-6c82-4193-bc7a-722c815343a5', '2026-04-21 13:55:06.792103+00', '2026-04-21 18:01:09.19513+00', 'sales_receipt', 'Hi {name}
Thank You for your Purchase!
Invoice: {invoice_no}
Item: {item}
Amount: {amount}
Warranty till: {warranty_expiry}
Team — {shop_name}', 'sales'),
	('1a5713bd-ea62-40f9-aacd-8b20582da655', '2026-04-21 13:55:06.792103+00', '2026-04-21 17:44:19.48356+00', 'catalogue_quote_share', 'Hi {name}, Here''s your Quote for {item} :{specs_block}={price}.
Valid until {valid_until}.
Team— {shop_name}', 'quote')
ON CONFLICT DO NOTHING;
-- intro_section
INSERT INTO public.intro_section VALUES
	('e68cd5b1-68b8-4423-8c83-8de1643ea37b', 'About Computer Solutions', 'Your Trusted Tech Partner Since Day One', 'From premium laptops and CCTV solutions to expert service and EMI options — Computer Solutions delivers the latest technology with unmatched trust, quality, and after-sales support across the region.', 'https://www.youtube.com/watch?v=tvuHvijJoBQ&t=53s', true, '2026-04-23 12:48:40.931863+00', '2026-04-24 14:06:14.041021+00')
ON CONFLICT DO NOTHING;
-- nav_items
INSERT INTO public.nav_items VALUES
	('bcb1ebe6-5500-4f87-ac6f-1634c56ab6e4', 'Contact', '#contact', 9, true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:19.217388+00'),
	('ca9f7698-da76-4c5b-84fe-ff17d28c66fc', 'Home', '#home', 1, true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:17.747691+00'),
	('4de430ac-8da1-482e-904c-0661a7c9b7ca', 'Services', '#services', 2, true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:17.927041+00'),
	('94cb98fd-c640-4c75-94a0-9a04e2911190', 'Products', '#products', 3, true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.109701+00'),
	('52525067-b8e3-4e64-b02f-4be93e084731', 'Deals', '#deals', 4, true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.292246+00'),
	('2455082e-2eb1-4b13-a75a-453a10829214', 'Our Ventures', '#sister-concerns', 5, true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.467463+00'),
	('a7a2e577-8651-41b8-9b8d-df8747cfaa95', 'Customer Voices', '#testimonials', 6, true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.639663+00'),
	('2e080c3f-a43b-4a6a-bdd1-b828e21bf9f9', 'Updates', '#updates', 7, true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.831935+00'),
	('5260fec4-8b3e-42c2-ba7c-af58c7c04cad', 'Gallery', '#gallery', 8, true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:19.014649+00')
ON CONFLICT DO NOTHING;
-- quotation_templates
INSERT INTO public.quotation_templates VALUES
	('04d055b0-cde3-408c-87d5-787a4390afaa', '2026-04-18 11:35:48.536523+00', '2026-04-19 08:49:19.947452+00', 'CCTV 4 HD CAMERAS - SEG', '', '[{"qty": 1, "name": "DVR 4CH ", "price": 2500, "discount_pct": 0}, {"qty": 1, "name": "500GB HDD", "price": 2500, "discount_pct": 0}, {"qty": 4, "name": "HD CAMERA", "price": 1200, "discount_pct": 0}, {"qty": 1, "name": "WIRE  90 MTRS", "price": 1500, "discount_pct": 0}, {"qty": 1, "name": "ACCESSORIES ( PVC BOX +CONNECTORS+ HDMI CABLE 1.5MTR)", "price": 400, "discount_pct": 0}, {"qty": 1, "name": "SMPS 10 AMP", "price": 650, "discount_pct": 0}]', '', 'Prices valid for 4 days. ', 0, true, 5),
	('89aa6a61-974e-4ebf-a823-66db44dd8233', '2026-04-18 14:57:11.815298+00', '2026-04-19 08:51:23.492919+00', 'HD CCTV  4 CAMERAS - CON', 'A SET OF 4 HD CAMERAS', '[{"qty": 1, "name": "4CH DVR + 4 HD COLORED CAMERAS |  500GB HDD  | 90 MTR WIRE BUNDLE  | 2U RACK | 10 AMP SMPS | 1.5 HDMO CABLE| ", "price": 12000, "discount_pct": 0}]', 'CPLUS DVR , MILEFOCUS CAMERAS , HDD GEONIX,  SMPS FYBER', 'Prices valid for 7 days. . Subject to availability.', 0, true, 1)
ON CONFLICT DO NOTHING;
-- section_headings
INSERT INTO public.section_headings VALUES
	('6b16cb51-be26-4b66-8e78-04bd4091dd5a', 'authorized_dealers', 'Our Partner Brands', 'Trusted by leading technology brands', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:17.753594+00'),
	('c25b2f81-13bf-4400-ae8c-894c0931aa1b', 'cctv', 'CCTV & Surveillance', 'Secure your home and business', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:17.928538+00'),
	('35f98810-c719-422a-aa23-8dba2c1f5fb7', 'deals', 'Today Deals', 'Best prices updated every day | Offers for Today only', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.111479+00'),
	('ed916e8b-d820-4724-beca-b4c5ccac067b', 'follow_us', 'Follow Us', 'Stay connected on social media', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.28796+00'),
	('eb6931e0-5e56-4968-8645-da1607e20296', 'instagram', 'Instagram Updates', 'Follow us for daily tech updates', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.458659+00'),
	('a77c8144-5fba-4ef7-a55c-e6f3be1540e8', 'new_arrivals', 'New Arrivals', 'Latest products just landed', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.632516+00'),
	('5a9c2bf1-6fd3-4882-99e3-c8db6ecfe0c5', 'services', 'Our Services', 'Professional Tech solutions for every need', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.811336+00'),
	('c09d51f0-e1d7-4116-a3b9-43c9388d6481', 'sister_concerns', 'Extended Ventures', 'A trusted family of brands', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.984947+00'),
	('6a31d3ae-1b70-44eb-96a0-2becfddf5e1d', 'testimonials', 'Customer Voices', 'Real stories from our customers', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:19.155013+00'),
	('2b4cf3e9-1bbf-440a-8618-437db185affc', 'why_us', 'Why Choose Us', 'Price . Quality . Service . You can Pick only Two', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:19.330793+00'),
	('23bd3672-60cc-4512-ab8e-567cd306dd63', 'youtube', 'Watch & Learn', 'Tutorials and product reviews on YouTube', true, '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:19.510186+00')
ON CONFLICT DO NOTHING;
-- site_settings
INSERT INTO public.site_settings VALUES
	('82f2e182-3db7-4c00-91c2-b2053e83268e', 'product_categories', 'Business,Gaming,Student,Budget,Premium,Refurbished', '2026-04-13 02:48:20.297942+00', '2026-04-24 14:06:21.089122+00'),
	('d736d103-e0c3-442a-b3ba-59338d9ebe3b', 'brands_tagline', 'Authorized Dealer for All Major Brands', '2026-04-13 02:48:20.297942+00', '2026-04-24 14:06:19.304747+00'),
	('0cd6b117-7848-422a-9c9f-ebb23c808542', 'shop_email', 'info@thecomputersolutions.in', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.405436+00'),
	('7536d00a-074a-431a-819b-652778af73a2', 'youtube_url', 'https://youtube.com/', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:17.456912+00'),
	('c5937619-ec8a-4e77-9da5-bbaecb667a7d', 'shop_tagline', 'Your Complete Technology Partner', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:22.525268+00'),
	('ba892151-740f-49c9-918a-1f48eb543c24', 'google_business_url', 'https://share.google/NFCSAXJmOMrOvfk3g', '2026-04-23 18:19:54.599413+00', '2026-04-24 14:06:20.186522+00'),
	('fb0f2c31-ae95-46f2-912b-0887ddebfd15', 'shop_whatsapp', '9877868206', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:19.484143+00'),
	('a3391930-f114-4ab9-b550-ecb47806ea5b', 'facebook_likes', '500+', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:17.648427+00'),
	('4ec0a69f-f751-40ec-bbb9-8fee4eee4126', 'why_us_4_desc', '100% original with brand warranty', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:21.279053+00'),
	('41f1d3d7-e38a-4298-8257-c21266c2fafb', 'facebook_thumbnail', '', '2026-04-11 18:08:06.706132+00', '2026-04-24 14:06:22.705259+00'),
	('971bcda6-9c4b-4738-ae0e-928467c27f54', 'why_us_3_desc', 'Dedicated support post-purchase', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.587949+00'),
	('1cba24b6-a8b5-4f70-8d53-90915854a8bc', 'contact_email', 'compsolsgsp@gmail.com', '2026-04-08 21:01:40.536494+00', '2026-04-24 14:06:17.841138+00'),
	('164da9b4-7750-403d-9931-bc634fbf3784', 'why_us_2_desc', 'We match any authorized dealer price', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:22.999332+00'),
	('ed5d4bdc-67ca-4d3a-bb08-877e83a25eaa', 'why_us_1_desc', 'Certified tech professionals at your service', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:20.358582+00'),
	('232133ce-32df-49e1-b43e-06d356aa94c8', 'shop_logo_url', 'https://mtravmbfuqrmujfbcfzy.supabase.co/storage/v1/object/public/shop-assets/logo/logo-1776885121318.png', '2026-04-22 19:12:16.54364+00', '2026-04-24 14:06:19.663169+00'),
	('fb43a61a-876a-4041-b7e1-d6d077256626', 'why_us_2_title', 'Best Prices', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:21.457308+00'),
	('e72ffba1-1fc3-46f3-871a-8fa9cb87ffc7', 'navbar_logo_size', '132', '2026-04-22 19:13:09.465532+00', '2026-04-24 14:06:18.766012+00'),
	('650983c5-653d-4b8f-82d5-075e9a2289be', 'site_name', 'ComputerSolutions', '2026-04-08 21:01:40.536494+00', '2026-04-24 14:06:23.198221+00'),
	('08c0a0d8-0824-4ab5-9058-0fa3a2fd1ece', 'maps_embed_url', '', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:23.371425+00'),
	('984a47c1-8c37-4b96-a05d-5de45813c762', 'banner_title', 'Premium Laptops & CCTVs ', '2026-04-08 21:01:40.536494+00', '2026-04-24 14:06:21.631835+00'),
	('2181741b-0769-4837-b2f8-c8d97b0d8456', 'contact_address', 'Ground Floor ,Atec Avenue, Hardochhanni Road, Gurdaspur 143521', '2026-04-08 21:01:40.536494+00', '2026-04-24 14:06:18.957395+00'),
	('4fdbd908-d7d9-4dcf-beb4-3c0ae93d4c43', 'why_us_4_title', 'Genuine Products', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:19.835742+00'),
	('96def605-7aa1-4694-9752-f8c9e4cc442b', 'youtube_subscribers', '1K+', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:18.032252+00'),
	('36362205-38b9-4174-bc77-0107f9d60930', 'shop_name', '', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:20.547368+00'),
	('33512bec-16f9-460d-90cc-d122290e7598', 'banner_image', 'https://images.unsplash.com/photo-1758612215020-842383aadb9e?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', '2026-04-08 21:01:40.536494+00', '2026-04-24 14:06:23.547655+00'),
	('ebbf2bc7-9d2e-4721-a1bc-ed300366cd2f', 'why_us_3_title', 'After Sales Service', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:23.722252+00'),
	('22941ac1-61b7-41e6-b231-41176a33a4ba', 'instagram_thumbnail', '', '2026-04-11 18:08:06.706132+00', '2026-04-24 14:06:20.012518+00'),
	('871e822d-47e8-4c8a-9aba-1fdf8e8d4fa4', 'banner_subtitle', 'Your trusted destination for branded laptops, desktops & accessories — new, refurbished & custom builds', '2026-04-08 21:01:40.536494+00', '2026-04-24 14:06:21.815803+00'),
	('aead9ebf-f24c-4b03-b6d5-c03b31c68437', 'shop_phone', '9877868206', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:20.725292+00'),
	('2a6b6f9f-2c57-4cab-89ff-e60f1dd36c57', 'contact_phone', '+919877868206', '2026-04-08 21:01:40.536494+00', '2026-04-24 14:06:23.899779+00'),
	('101e9846-717f-4743-9847-c453d3933254', 'instagram_url', 'https://instagram.com/csdailydeals', '2026-04-11 18:08:06.706132+00', '2026-04-24 14:06:20.907611+00'),
	('611cccbc-bdde-4bff-8749-53abce2827cf', 'emi_banner_text', 'Easy EMI Available | 0% Interest | All Major Banks | Conditions Apply', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:21.988857+00'),
	('5bb8f756-93b6-42c2-b7fd-2104f2eccbb4', 'instagram_followers', '2K+', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:24.09061+00'),
	('fa864bb9-35c4-498e-bc46-c9cf0d9f6f54', 'why_us_1_title', 'Expert Team', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:19.135234+00'),
	('1740348d-b14d-4843-8dc7-ec5bf2ba2f68', 'google_maps_embed', 'https://www.google.com/maps?q=Computer+Solutions+Atec+Avenue+Hardochhanni+Road+Gurdaspur+143521&output=embed', '2026-04-08 21:01:40.536494+00', '2026-04-24 14:06:18.224763+00'),
	('3a1d34a1-f504-45e8-80cf-8fa09eefbc38', 'whatsapp_default_msg', 'Hi! I am interested in your products.', '2026-04-22 17:06:34.576496+00', '2026-04-24 14:06:22.16684+00'),
	('82604f41-c05a-4e85-9e16-bb4f9c220e80', 'whatsapp', '+919877868206', '2026-04-08 21:01:40.536494+00', '2026-04-24 14:06:24.266509+00'),
	('1e4f4ade-55a7-4a79-beb2-baebc0312384', 'facebook_url', 'https://facebook.com/thecomputersolutions', '2026-04-11 18:08:06.706132+00', '2026-04-24 14:06:24.447092+00'),
	('3aac5bde-3d77-4c9a-869e-d5625fa7e5c8', 'shop_address', 'Ground Floor, ATEC Avenue, Hardochhanni Road Gurdaspur', '2026-04-22 17:06:34.576496+00', '2026-04-25 09:04:53.145504+00')
ON CONFLICT DO NOTHING;
-- site_whatsapp_templates
INSERT INTO public.site_whatsapp_templates VALUES
	('1fa89612-aacd-480d-87b6-1cf65c13c7f9', 'product_enquiry', 'Product Enquiry (default)', 'Default enquiry for products that do not have a custom message. Use {product}.', 'Hi! I am interested in {product}. Please share details and price.', '{product}', 50, true, '2026-04-23 12:55:00.099223+00', '2026-04-24 14:06:15.582319+00'),
	('acb68a2c-3dfd-4047-8fc8-063c25651ff6', 'new_arrival_enquiry', 'New Arrival Enquiry (default)', 'Default enquiry for new arrivals without a custom message. Use {product}.', 'Hi! I am interested in {product}. Please share details and price.', '{product}', 60, true, '2026-04-23 12:55:00.099223+00', '2026-04-24 14:06:15.805502+00'),
	('c13d0245-7237-4c1a-a21c-1a1ddcc42ab6', 'cctv_enquiry', 'CCTV Product Enquiry', 'Sent from CCTV product cards. Use {product}, {price}.', 'Hi! I am interested in {product} (Price: {price}). Please share more details.', '{product}, {price}', 70, true, '2026-04-23 12:55:00.099223+00', '2026-04-24 14:06:15.987644+00'),
	('7d6550bd-d29a-4634-b216-01ca62e99b4d', 'daily_deal', 'Daily Deal Enquiry (default)', 'Default deal message when a deal has no custom whatsapp message. Use {deal}, {price}.', 'Hi! I want to grab the deal on {deal} at {price}.', '{deal}, {price}', 80, true, '2026-04-23 12:55:00.099223+00', '2026-04-24 14:06:16.169432+00'),
	('a6707c1f-a267-4dad-b75b-bd1de3dbeb04', 'floating_button', 'Floating WhatsApp Button', 'Default message when visitor clicks the floating WhatsApp icon.', 'Hi! I am interested in your products.', '', 10, true, '2026-04-23 12:55:00.099223+00', '2026-04-24 14:06:14.230953+00'),
	('0806b933-6e86-4a1b-87e7-15b0cc10045e', 'hero_whatsapp', 'Hero "WhatsApp Us" Button', 'Sent when visitor clicks the WhatsApp Us button in the hero banner.', 'Hi! I would like to know more about your products and services.', '', 20, true, '2026-04-23 12:55:00.099223+00', '2026-04-24 14:06:14.402083+00'),
	('ed6408d8-d17a-46e4-90bb-332c1652996d', 'contact_form', 'Contact Form Submission', 'Pre-filled message after submitting the Contact Us form. Use {name}, {phone}, {message}.', 'Name: {name}%0APhone: {phone}%0AMessage: {message}', '{name}, {phone}, {message}', 30, true, '2026-04-23 12:55:00.099223+00', '2026-04-24 14:06:15.162881+00'),
	('e8758267-5619-4204-b5c6-28c9b5d56c7f', 'contact_chat_button', 'Contact Section Chat Button', 'Sent when visitor clicks "Chat on WhatsApp" in the contact section.', 'Hi! I would like to chat about your products and services.', '', 40, true, '2026-04-23 12:55:00.099223+00', '2026-04-24 14:06:15.351047+00')
ON CONFLICT DO NOTHING;

COMMIT;
