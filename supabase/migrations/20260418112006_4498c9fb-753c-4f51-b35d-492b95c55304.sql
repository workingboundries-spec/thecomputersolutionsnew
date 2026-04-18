-- Quotation Templates
CREATE TABLE IF NOT EXISTS public.quotation_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  template_name text NOT NULL,
  description text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  terms text,
  gst_percent numeric NOT NULL DEFAULT 18,
  is_active boolean NOT NULL DEFAULT true,
  used_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.quotation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users view templates_q" ON public.quotation_templates
  FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert templates_q" ON public.quotation_templates
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM users update templates_q" ON public.quotation_templates
  FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM admins delete templates_q" ON public.quotation_templates
  FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

CREATE TRIGGER update_quotation_templates_updated_at
  BEFORE UPDATE ON public.quotation_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quotation Send Log
CREATE TABLE IF NOT EXISTS public.quotation_send_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at timestamptz NOT NULL DEFAULT now(),
  quotation_id uuid REFERENCES public.crm_quotations(id) ON DELETE CASCADE,
  customer_name text,
  phone text,
  whatsapp text,
  email text,
  send_method text,
  status text NOT NULL DEFAULT 'sent'
);

ALTER TABLE public.quotation_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users view send log" ON public.quotation_send_log
  FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert send log" ON public.quotation_send_log
  FOR INSERT TO authenticated WITH CHECK (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM admins delete send log" ON public.quotation_send_log
  FOR DELETE TO authenticated USING (public.has_crm_role(auth.uid(), 'crm_admin'));

-- Seed branding admin settings
INSERT INTO public.crm_admin_settings (setting_key, setting_value, setting_type) VALUES
  ('shop_logo_url', '', 'text'),
  ('quotation_primary_color', '#1a1a2e', 'text'),
  ('quotation_accent_color', '#e94560', 'text'),
  ('quotation_font_color', '#1a1a2e', 'text'),
  ('quotation_bg_color', '#ffffff', 'text'),
  ('quotation_header_style', 'modern', 'text'),
  ('quotation_footer_text', 'Thank you for your business!', 'text'),
  ('quotation_watermark', 'QUOTATION', 'text')
ON CONFLICT (setting_key) DO NOTHING;

-- Storage bucket for shop assets (logo)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-assets', 'shop-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read shop-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'shop-assets');
CREATE POLICY "CRM users upload shop-assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-assets' AND public.is_crm_user(auth.uid()));
CREATE POLICY "CRM users update shop-assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-assets' AND public.is_crm_user(auth.uid()));
CREATE POLICY "CRM users delete shop-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'shop-assets' AND public.is_crm_user(auth.uid()));