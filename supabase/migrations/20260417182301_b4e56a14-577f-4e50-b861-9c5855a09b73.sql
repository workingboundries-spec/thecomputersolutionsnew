
-- ============================================================
-- CRM Role infrastructure
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.crm_app_role AS ENUM ('crm_user', 'crm_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.crm_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.crm_app_role NOT NULL DEFAULT 'crm_user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.crm_user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_crm_role(_user_id uuid, _role public.crm_app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_crm_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crm_user_roles
    WHERE user_id = _user_id AND role IN ('crm_user', 'crm_admin')
  )
$$;

DROP POLICY IF EXISTS "Users can view own roles" ON public.crm_user_roles;
CREATE POLICY "Users can view own roles" ON public.crm_user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 1. crm_enquiries
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  address text,
  product_category text NOT NULL DEFAULT 'laptop',
  item_name text,
  budget numeric,
  description text,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'walkin',
  assigned_to text,
  notes text
);
ALTER TABLE public.crm_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users can view enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can view enquiries" ON public.crm_enquiries
  FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users can insert enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can insert enquiries" ON public.crm_enquiries
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users can update enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can update enquiries" ON public.crm_enquiries
  FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users can delete enquiries" ON public.crm_enquiries;
CREATE POLICY "CRM users can delete enquiries" ON public.crm_enquiries
  FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

CREATE TRIGGER crm_enquiries_updated_at BEFORE UPDATE ON public.crm_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. crm_catalogue (must come before sales)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  brand text NOT NULL,
  model text NOT NULL,
  category text NOT NULL DEFAULT 'laptop',
  specs text,
  stock_qty integer NOT NULL DEFAULT 0,
  nlc_price numeric NOT NULL DEFAULT 0,
  billing_price numeric NOT NULL DEFAULT 0,
  sale_price numeric NOT NULL DEFAULT 0,
  online_price numeric NOT NULL DEFAULT 0,
  mrp numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text
);
ALTER TABLE public.crm_catalogue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active catalogue" ON public.crm_catalogue;
CREATE POLICY "Anyone can view active catalogue" ON public.crm_catalogue
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users manage catalogue insert" ON public.crm_catalogue;
CREATE POLICY "CRM users manage catalogue insert" ON public.crm_catalogue
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users manage catalogue update" ON public.crm_catalogue;
CREATE POLICY "CRM users manage catalogue update" ON public.crm_catalogue
  FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users manage catalogue delete" ON public.crm_catalogue;
CREATE POLICY "CRM users manage catalogue delete" ON public.crm_catalogue
  FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

CREATE TRIGGER crm_catalogue_updated_at BEFORE UPDATE ON public.crm_catalogue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. crm_sales
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  enquiry_id uuid REFERENCES public.crm_enquiries(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  address text,
  customer_dob date,
  item_name text NOT NULL,
  item_id uuid REFERENCES public.crm_catalogue(id) ON DELETE SET NULL,
  qty integer NOT NULL DEFAULT 1,
  sale_price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT 'cash',
  payment_status text NOT NULL DEFAULT 'paid',
  invoice_no text NOT NULL UNIQUE,
  warranty_months integer NOT NULL DEFAULT 12,
  warranty_expiry date,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text
);
ALTER TABLE public.crm_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users view sales" ON public.crm_sales;
CREATE POLICY "CRM users view sales" ON public.crm_sales
  FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert sales" ON public.crm_sales;
CREATE POLICY "CRM users insert sales" ON public.crm_sales
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update sales" ON public.crm_sales;
CREATE POLICY "CRM users update sales" ON public.crm_sales
  FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete sales" ON public.crm_sales;
CREATE POLICY "CRM users delete sales" ON public.crm_sales
  FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

CREATE TRIGGER crm_sales_updated_at BEFORE UPDATE ON public.crm_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. crm_customers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  whatsapp text,
  email text,
  address text,
  dob date,
  total_purchases integer NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  last_purchase_date date,
  notes text
);
ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users view customers" ON public.crm_customers;
CREATE POLICY "CRM users view customers" ON public.crm_customers
  FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert customers" ON public.crm_customers;
CREATE POLICY "CRM users insert customers" ON public.crm_customers
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update customers" ON public.crm_customers;
CREATE POLICY "CRM users update customers" ON public.crm_customers
  FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete customers" ON public.crm_customers;
CREATE POLICY "CRM users delete customers" ON public.crm_customers
  FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

CREATE TRIGGER crm_customers_updated_at BEFORE UPDATE ON public.crm_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. crm_quote_shares (publicly viewable)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_quote_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  catalogue_id uuid REFERENCES public.crm_catalogue(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  shared_config text,
  shared_price numeric NOT NULL DEFAULT 0,
  valid_until date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  share_link uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.crm_quote_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active quotes" ON public.crm_quote_shares;
CREATE POLICY "Anyone can view active quotes" ON public.crm_quote_shares
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert quotes" ON public.crm_quote_shares;
CREATE POLICY "CRM users insert quotes" ON public.crm_quote_shares
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update quotes" ON public.crm_quote_shares;
CREATE POLICY "CRM users update quotes" ON public.crm_quote_shares
  FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete quotes" ON public.crm_quote_shares;
CREATE POLICY "CRM users delete quotes" ON public.crm_quote_shares
  FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

CREATE TRIGGER crm_quote_shares_updated_at BEFORE UPDATE ON public.crm_quote_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 6. crm_services
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  job_card_no text NOT NULL UNIQUE,
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
  delivery_date date
);
ALTER TABLE public.crm_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users view services" ON public.crm_services;
CREATE POLICY "CRM users view services" ON public.crm_services
  FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert services" ON public.crm_services;
CREATE POLICY "CRM users insert services" ON public.crm_services
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update services" ON public.crm_services;
CREATE POLICY "CRM users update services" ON public.crm_services
  FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete services" ON public.crm_services;
CREATE POLICY "CRM users delete services" ON public.crm_services
  FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

CREATE TRIGGER crm_services_updated_at BEFORE UPDATE ON public.crm_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. crm_warranty_reminders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_warranty_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
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
  sent_at timestamptz
);
ALTER TABLE public.crm_warranty_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users view reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users view reminders" ON public.crm_warranty_reminders
  FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users insert reminders" ON public.crm_warranty_reminders
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users update reminders" ON public.crm_warranty_reminders
  FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete reminders" ON public.crm_warranty_reminders;
CREATE POLICY "CRM users delete reminders" ON public.crm_warranty_reminders
  FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

CREATE TRIGGER crm_warranty_reminders_updated_at BEFORE UPDATE ON public.crm_warranty_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. crm_whatsapp_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  template_name text NOT NULL UNIQUE,
  message_body text NOT NULL,
  template_type text NOT NULL DEFAULT 'warranty'
);
ALTER TABLE public.crm_whatsapp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users view templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users view templates" ON public.crm_whatsapp_templates
  FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users insert templates" ON public.crm_whatsapp_templates
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users update templates" ON public.crm_whatsapp_templates
  FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users delete templates" ON public.crm_whatsapp_templates;
CREATE POLICY "CRM users delete templates" ON public.crm_whatsapp_templates
  FOR DELETE TO authenticated USING (public.is_crm_user(auth.uid()));

CREATE TRIGGER crm_whatsapp_templates_updated_at BEFORE UPDATE ON public.crm_whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 9. crm_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT ''
);
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users view settings" ON public.crm_settings;
CREATE POLICY "CRM users view settings" ON public.crm_settings
  FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users insert settings" ON public.crm_settings;
CREATE POLICY "CRM users insert settings" ON public.crm_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
DROP POLICY IF EXISTS "CRM users update settings" ON public.crm_settings;
CREATE POLICY "CRM users update settings" ON public.crm_settings
  FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));

CREATE TRIGGER crm_settings_updated_at BEFORE UPDATE ON public.crm_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Seed default WhatsApp templates and settings
-- ============================================================
INSERT INTO public.crm_whatsapp_templates (template_name, message_body, template_type) VALUES
  ('warranty_1month', 'Hi {name}! Your {item} purchased on {date} is doing great! Hope you''re enjoying it. For any help call us: {phone}', 'warranty'),
  ('warranty_3month', 'Hi {name}! Quick check-in on your {item}. Warranty valid till {expiry}. Any issues? We''re here!', 'warranty'),
  ('warranty_6month', 'Hi {name}! Your {item} has 6 months of warranty remaining. Consider our AMC plan for extended coverage!', 'warranty'),
  ('warranty_pre_expiry', 'IMPORTANT: {name}, warranty on your {item} expires on {expiry}. Extend now or get it checked FREE before expiry!', 'warranty'),
  ('birthday', 'Happy Birthday {name}! Wishing you a great year! Enjoy 5% OFF on your next purchase at The Computer Solutions!', 'birthday'),
  ('service_update', 'Dear {name}, your {device} job #{jobno} is now {status}. Contact: {phone}', 'service'),
  ('quote', 'Hi {name}! Here is your quote: {item} for ₹{price}. Valid until {expiry}. View: {link}', 'quote')
ON CONFLICT (template_name) DO NOTHING;

INSERT INTO public.crm_settings (key, value) VALUES
  ('shop_name', 'The Computer Solutions'),
  ('shop_address', ''),
  ('shop_phone', ''),
  ('shop_gst', ''),
  ('shop_logo_url', ''),
  ('low_stock_threshold', '3'),
  ('invoice_prefix', 'INV'),
  ('service_prefix', 'SRV')
ON CONFLICT (key) DO NOTHING;
