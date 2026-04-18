-- ============= NEW TABLES =============

-- Quotations
CREATE TABLE IF NOT EXISTS public.crm_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  quote_no text UNIQUE NOT NULL,
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
  notes text,
  terms text,
  status text NOT NULL DEFAULT 'draft'
);

ALTER TABLE public.crm_quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users view quotations" ON public.crm_quotations FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
CREATE POLICY "Public can view quotations by link" ON public.crm_quotations FOR SELECT TO anon USING (true);
CREATE POLICY "CRM users insert quotations" ON public.crm_quotations FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM users update quotations" ON public.crm_quotations FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM admins delete quotations" ON public.crm_quotations FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

CREATE TRIGGER trg_crm_quotations_updated BEFORE UPDATE ON public.crm_quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stock audit log
CREATE TABLE IF NOT EXISTS public.crm_stock_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  audit_month text NOT NULL,
  audit_date date NOT NULL DEFAULT CURRENT_DATE,
  catalogue_id uuid REFERENCES public.crm_catalogue(id) ON DELETE SET NULL,
  item_name text,
  brand text,
  model text,
  opening_stock integer NOT NULL DEFAULT 0,
  sold_qty integer NOT NULL DEFAULT 0,
  physical_count integer NOT NULL DEFAULT 0,
  variance integer NOT NULL DEFAULT 0,
  notes text,
  entered_by text DEFAULT 'admin'
);
CREATE INDEX IF NOT EXISTS idx_crm_stock_audit_month ON public.crm_stock_audit_log(audit_month);

ALTER TABLE public.crm_stock_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view audit" ON public.crm_stock_audit_log FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert audit" ON public.crm_stock_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM admins update audit" ON public.crm_stock_audit_log FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));
CREATE POLICY "CRM admins delete audit" ON public.crm_stock_audit_log FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- Admin settings
CREATE TABLE IF NOT EXISTS public.crm_admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL DEFAULT '',
  setting_type text NOT NULL DEFAULT 'text'
);

ALTER TABLE public.crm_admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view admin settings" ON public.crm_admin_settings FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM admins insert admin settings" ON public.crm_admin_settings FOR INSERT TO authenticated WITH CHECK (public.has_crm_role(auth.uid(), 'crm_admin'));
CREATE POLICY "CRM admins update admin settings" ON public.crm_admin_settings FOR UPDATE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));
CREATE POLICY "CRM admins delete admin settings" ON public.crm_admin_settings FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

CREATE TRIGGER trg_crm_admin_settings_updated BEFORE UPDATE ON public.crm_admin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WhatsApp log
CREATE TABLE IF NOT EXISTS public.crm_whatsapp_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sale_id uuid REFERENCES public.crm_sales(id) ON DELETE SET NULL,
  customer_name text,
  phone text,
  message_type text,
  message_text text,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_whatsapp_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view wa log" ON public.crm_whatsapp_log FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert wa log" ON public.crm_whatsapp_log FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM admins delete wa log" ON public.crm_whatsapp_log FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- ============= COLUMN ADDITIONS =============
ALTER TABLE public.crm_warranty_reminders
  ADD COLUMN IF NOT EXISTS message_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_sent_at timestamptz;

ALTER TABLE public.crm_sales
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE public.crm_enquiries
  ADD COLUMN IF NOT EXISTS is_converted boolean NOT NULL DEFAULT false;

-- Backfill is_converted from existing status
UPDATE public.crm_enquiries SET is_converted = true WHERE status = 'converted' AND is_converted = false;

-- ============= SEED ADMIN SETTINGS =============
INSERT INTO public.crm_admin_settings (setting_key, setting_value, setting_type) VALUES
('shop_name', 'The Computer Solutions', 'text'),
('shop_address', 'Your Address Here', 'text'),
('shop_phone', '9800000000', 'text'),
('shop_whatsapp', '9800000000', 'text'),
('shop_gst', 'GST123456', 'text'),
('shop_email', 'info@thecomputersolutions.in', 'text'),
('shop_website', 'thecomputersolutions.in', 'text'),
('whatsapp_week_template', 'Hi {name}! Thank you for purchasing {item} from The Computer Solutions. Hope you are enjoying it! For any support call {shop_phone}.', 'text'),
('whatsapp_month_template', 'Hi {name}! It has been a month since you purchased {item}. Everything going well? We are here for any support. - The Computer Solutions', 'text'),
('whatsapp_3month_template', 'Hi {name}! Quick check-in on your {item} purchased on {purchase_date}. Warranty valid till {expiry}. Any issues? Call us at {shop_phone}.', 'text'),
('whatsapp_6month_template', 'Hi {name}! Your {item} has 6 months of warranty remaining (expires {expiry}). Consider our AMC plan for extended coverage! - The Computer Solutions', 'text'),
('whatsapp_11month_template', 'IMPORTANT: Hi {name}, your {item} warranty expires on {expiry} - just 1 month away! Get it checked FREE before expiry. Call {shop_phone} now.', 'text'),
('whatsapp_birthday_template', 'Happy Birthday {name}! Wishing you a wonderful year ahead! Enjoy a special discount on your next purchase. - The Computer Solutions Team', 'text'),
('enquiry_categories', '["Laptop","Desktop","CCTV","Networking","Accessories","Printer","Mobile","Other"]', 'json'),
('enquiry_statuses', '["new","follow_up","quoted","converted","lost"]', 'json'),
('sale_payment_modes', '["cash","upi","card","emi","credit","neft"]', 'json'),
('service_statuses', '["received","diagnosing","repairing","ready","delivered","cancelled"]', 'json'),
('catalogue_categories', '["laptop","desktop","cctv","networking","accessory","printer","mobile","other"]', 'json'),
('quotation_terms', 'Prices valid for 7 days. GST extra as applicable. Subject to availability.', 'text'),
('quote_prefix', 'QT', 'text'),
('invoice_prefix', 'INV', 'text'),
('default_gst_percent', '18', 'number'),
('default_validity_days', '7', 'number'),
('low_stock_threshold', '3', 'number'),
('show_out_of_stock', 'true', 'boolean')
ON CONFLICT (setting_key) DO NOTHING;