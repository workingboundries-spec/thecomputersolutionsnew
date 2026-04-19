
-- ============ A. EXTEND crm_customers ============
ALTER TABLE public.crm_customers
  ADD COLUMN IF NOT EXISTS rank TEXT,
  ADD COLUMN IF NOT EXISTS source_mode TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS anniversary_date DATE,
  ADD COLUMN IF NOT EXISTS occupation TEXT;

-- ============ B. EXTEND crm_whatsapp_log ============
ALTER TABLE public.crm_whatsapp_log
  ADD COLUMN IF NOT EXISTS customer_id UUID,
  ADD COLUMN IF NOT EXISTS message_hint TEXT,
  ADD COLUMN IF NOT EXISTS sent_from_section TEXT,
  ADD COLUMN IF NOT EXISTS campaign_id UUID,
  ADD COLUMN IF NOT EXISTS sent_by UUID;

CREATE INDEX IF NOT EXISTS idx_wa_log_customer ON public.crm_whatsapp_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_wa_log_campaign ON public.crm_whatsapp_log(campaign_id);

-- ============ C. customer_event_logs ============
CREATE TABLE IF NOT EXISTS public.customer_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('birthday','anniversary')),
  event_date DATE NOT NULL,
  years_completed INT,
  message_sent TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.customer_event_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view event logs" ON public.customer_event_logs FOR SELECT TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert event logs" ON public.customer_event_logs FOR INSERT TO authenticated WITH CHECK (is_crm_user(auth.uid()));
CREATE POLICY "CRM users update event logs" ON public.customer_event_logs FOR UPDATE TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users delete event logs" ON public.customer_event_logs FOR DELETE TO authenticated USING (is_crm_user(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_event_logs_customer ON public.customer_event_logs(customer_id);

-- ============ D. reminders_queue ============
CREATE TABLE IF NOT EXISTS public.reminders_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('birthday','anniversary')),
  event_date DATE NOT NULL,
  event_year INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','missed','skipped','today')),
  days_before INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  sent_by UUID,
  UNIQUE(customer_id, event_type, event_year)
);
ALTER TABLE public.reminders_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view reminders" ON public.reminders_queue FOR SELECT TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert reminders" ON public.reminders_queue FOR INSERT TO authenticated WITH CHECK (is_crm_user(auth.uid()));
CREATE POLICY "CRM users update reminders" ON public.reminders_queue FOR UPDATE TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users delete reminders" ON public.reminders_queue FOR DELETE TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "Service role full access reminders" ON public.reminders_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ E. campaigns ============
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','partial','completed')),
  created_by UUID,
  total_targeted INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  filters_snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view campaigns" ON public.campaigns FOR SELECT TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (is_crm_user(auth.uid()));
CREATE POLICY "CRM users update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM admins delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ F. campaign_recipients ============
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  personalised_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','skipped')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view recipients" ON public.campaign_recipients FOR SELECT TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert recipients" ON public.campaign_recipients FOR INSERT TO authenticated WITH CHECK (is_crm_user(auth.uid()));
CREATE POLICY "CRM users update recipients" ON public.campaign_recipients FOR UPDATE TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM admins delete recipients" ON public.campaign_recipients FOR DELETE TO authenticated USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE INDEX IF NOT EXISTS idx_camp_recip_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_recip_customer ON public.campaign_recipients(customer_id);

-- ============ G. campaign_templates ============
CREATE TABLE IF NOT EXISTS public.campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  message_body TEXT NOT NULL,
  placeholders_used TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view camp templates" ON public.campaign_templates FOR SELECT TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert camp templates" ON public.campaign_templates FOR INSERT TO authenticated WITH CHECK (is_crm_user(auth.uid()));
CREATE POLICY "CRM users update camp templates" ON public.campaign_templates FOR UPDATE TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM admins delete camp templates" ON public.campaign_templates FOR DELETE TO authenticated USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE TRIGGER trg_camp_templates_updated BEFORE UPDATE ON public.campaign_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ H. admin_customer_settings ============
CREATE TABLE IF NOT EXISTS public.admin_customer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_type TEXT NOT NULL,
  value TEXT NOT NULL,
  colour TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(setting_type, value)
);
ALTER TABLE public.admin_customer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view cust settings" ON public.admin_customer_settings FOR SELECT TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "Anon view cust settings" ON public.admin_customer_settings FOR SELECT TO anon USING (true);
CREATE POLICY "CRM admins insert cust settings" ON public.admin_customer_settings FOR INSERT TO authenticated WITH CHECK (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE POLICY "CRM admins update cust settings" ON public.admin_customer_settings FOR UPDATE TO authenticated USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE POLICY "CRM admins delete cust settings" ON public.admin_customer_settings FOR DELETE TO authenticated USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE TRIGGER trg_cust_settings_updated BEFORE UPDATE ON public.admin_customer_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ I. admin_reminder_settings ============
CREATE TABLE IF NOT EXISTS public.admin_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.admin_reminder_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users view rem settings" ON public.admin_reminder_settings FOR SELECT TO authenticated USING (is_crm_user(auth.uid()));
CREATE POLICY "Anon view rem settings" ON public.admin_reminder_settings FOR SELECT TO anon USING (true);
CREATE POLICY "CRM admins insert rem settings" ON public.admin_reminder_settings FOR INSERT TO authenticated WITH CHECK (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE POLICY "CRM admins update rem settings" ON public.admin_reminder_settings FOR UPDATE TO authenticated USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE POLICY "CRM admins delete rem settings" ON public.admin_reminder_settings FOR DELETE TO authenticated USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE POLICY "Service role full access rem settings" ON public.admin_reminder_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER trg_rem_settings_updated BEFORE UPDATE ON public.admin_reminder_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ J. SEED DEFAULTS ============
-- Ranks
INSERT INTO public.admin_customer_settings (setting_type, value, colour, sort_order) VALUES
  ('rank', 'Bronze',   '#CD7F32', 1),
  ('rank', 'Silver',   '#C0C0C0', 2),
  ('rank', 'Gold',     '#FFD700', 3),
  ('rank', 'Platinum', '#E5E4E2', 4)
ON CONFLICT (setting_type, value) DO NOTHING;

-- Sources
INSERT INTO public.admin_customer_settings (setting_type, value, sort_order) VALUES
  ('source_mode', 'Walk-in', 1),
  ('source_mode', 'Social Media', 2),
  ('source_mode', 'Telephonic', 3),
  ('source_mode', 'Referral', 4),
  ('source_mode', 'Online', 5),
  ('source_mode', 'Exhibition', 6),
  ('source_mode', 'Other', 7)
ON CONFLICT (setting_type, value) DO NOTHING;

-- Occupations
INSERT INTO public.admin_customer_settings (setting_type, value, sort_order) VALUES
  ('occupation', 'Student', 1),
  ('occupation', 'Businessman', 2),
  ('occupation', 'Service', 3),
  ('occupation', 'Professional', 4),
  ('occupation', 'Homemaker', 5),
  ('occupation', 'Retired', 6),
  ('occupation', 'Other', 7)
ON CONFLICT (setting_type, value) DO NOTHING;

-- Campaign types
INSERT INTO public.admin_customer_settings (setting_type, value, sort_order) VALUES
  ('campaign_type', 'Festival', 1),
  ('campaign_type', 'Offer', 2),
  ('campaign_type', 'Win-Back', 3),
  ('campaign_type', 'New Arrival', 4),
  ('campaign_type', 'General', 5),
  ('campaign_type', 'Thank You', 6),
  ('campaign_type', 'Other', 7)
ON CONFLICT (setting_type, value) DO NOTHING;

-- Reminder defaults
INSERT INTO public.admin_reminder_settings (setting_key, setting_value) VALUES
  ('reminder_lead_days', '1'),
  ('birthday_enabled', 'true'),
  ('anniversary_enabled', 'true'),
  ('min_days_between_messages', '7'),
  ('birthday_template', 'Dear {{customer_name}}, Wishing you a very Happy Birthday! May this day bring you joy and success. - Team {{business_name}}'),
  ('anniversary_template', 'Dear {{customer_name}}, Wishing you a very Happy Anniversary! May your bond grow stronger every year. - Team {{business_name}}')
ON CONFLICT (setting_key) DO NOTHING;

-- Default campaign templates
INSERT INTO public.campaign_templates (name, type, message_body, placeholders_used) VALUES
  ('Diwali Wishes', 'Festival', 'Dear {{customer_name}}, Wishing you & your family a very Happy Diwali! May this festival bring light, prosperity & joy. - Team {{business_name}}', 'customer_name,business_name'),
  ('New Year Wishes', 'Festival', 'Dear {{customer_name}}, Wishing you a very Happy New Year! Thank you for being a valued customer. - Team {{business_name}}', 'customer_name,business_name'),
  ('Eid Mubarak', 'Festival', 'Dear {{customer_name}}, Eid Mubarak! Wishing you & your family peace and happiness. - Team {{business_name}}', 'customer_name,business_name'),
  ('Sale Announcement', 'Offer', 'Hi {{customer_name}}, Big Sale is LIVE at {{business_name}}! Visit us today for the best deals on laptops, CCTV & more. Reply for details.', 'customer_name,business_name'),
  ('New Arrival Alert', 'New Arrival', 'Hi {{customer_name}}, New stock just arrived at {{business_name}}! Latest laptops & accessories now available. Visit us or reply to know more.', 'customer_name,business_name'),
  ('Win-Back Offer', 'Win-Back', 'Hi {{customer_name}}, We miss you! Your last visit was on {{last_purchase_date}}. Drop by {{business_name}} this week for a special returning-customer discount.', 'customer_name,business_name,last_purchase_date'),
  ('Thank You (post purchase)', 'Thank You', 'Dear {{customer_name}}, Thank you for shopping with {{business_name}}! We truly appreciate your trust. For any support, just reply to this message.', 'customer_name,business_name')
ON CONFLICT DO NOTHING;
