-- Site-wide WhatsApp message templates editable from admin panel
CREATE TABLE public.site_whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  message_body text NOT NULL DEFAULT '',
  placeholders text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site whatsapp templates"
  ON public.site_whatsapp_templates FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can manage site whatsapp templates"
  ON public.site_whatsapp_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER trg_site_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.site_whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the templates currently used across the public site
INSERT INTO public.site_whatsapp_templates (template_key, label, description, message_body, placeholders, sort_order) VALUES
  ('floating_button', 'Floating WhatsApp Button', 'Default message when visitor clicks the floating WhatsApp icon.',
   'Hi! I am interested in your products.', '', 10),
  ('hero_whatsapp', 'Hero "WhatsApp Us" Button', 'Sent when visitor clicks the WhatsApp Us button in the hero banner.',
   'Hi! I would like to know more about your products and services.', '', 20),
  ('contact_form', 'Contact Form Submission', 'Pre-filled message after submitting the Contact Us form. Use {name}, {phone}, {message}.',
   'Name: {name}%0APhone: {phone}%0AMessage: {message}', '{name}, {phone}, {message}', 30),
  ('contact_chat_button', 'Contact Section Chat Button', 'Sent when visitor clicks "Chat on WhatsApp" in the contact section.',
   'Hi! I would like to chat about your products and services.', '', 40),
  ('product_enquiry', 'Product Enquiry (default)', 'Default enquiry for products that do not have a custom message. Use {product}.',
   'Hi! I am interested in {product}. Please share details and price.', '{product}', 50),
  ('new_arrival_enquiry', 'New Arrival Enquiry (default)', 'Default enquiry for new arrivals without a custom message. Use {product}.',
   'Hi! I am interested in {product}. Please share details and price.', '{product}', 60),
  ('cctv_enquiry', 'CCTV Product Enquiry', 'Sent from CCTV product cards. Use {product}, {price}.',
   'Hi! I am interested in {product} (Price: {price}). Please share more details.', '{product}, {price}', 70),
  ('daily_deal', 'Daily Deal Enquiry (default)', 'Default deal message when a deal has no custom whatsapp message. Use {deal}, {price}.',
   'Hi! I want to grab the deal on {deal} at {price}.', '{deal}, {price}', 80);
