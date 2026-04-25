-- Full database bootstrap export (idempotent)
-- Generated: 2026-04-25T09:14:50.860856Z
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
-- admin_reminder_settings
INSERT INTO public.admin_reminder_settings VALUES
-- campaign_templates
INSERT INTO public.campaign_templates VALUES
-- crm_admin_settings
INSERT INTO public.crm_admin_settings VALUES
-- crm_settings
INSERT INTO public.crm_settings VALUES
-- crm_whatsapp_templates
INSERT INTO public.crm_whatsapp_templates VALUES
-- intro_section
INSERT INTO public.intro_section VALUES
-- nav_items
INSERT INTO public.nav_items VALUES
-- quotation_templates
INSERT INTO public.quotation_templates VALUES
-- section_headings
INSERT INTO public.section_headings VALUES
-- site_settings
INSERT INTO public.site_settings VALUES
-- site_whatsapp_templates
INSERT INTO public.site_whatsapp_templates VALUES

COMMIT;
