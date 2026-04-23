CREATE TABLE public.seo_meta_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,
  page_label text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  keywords text DEFAULT '',
  og_title text DEFAULT '',
  og_description text DEFAULT '',
  og_image text DEFAULT '',
  og_url text DEFAULT '',
  twitter_card text DEFAULT 'summary_large_image',
  canonical_url text DEFAULT '',
  structured_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_meta_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seo meta tags"
  ON public.seo_meta_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can manage seo meta tags"
  ON public.seo_meta_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER trg_seo_meta_tags_updated_at
  BEFORE UPDATE ON public.seo_meta_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed SEO entries with keyword-rich content
INSERT INTO public.seo_meta_tags (page_key, page_label, title, description, keywords, og_title, og_description, og_image, twitter_card, structured_data, sort_order) VALUES
  ('home', 'Homepage',
   'Computer Solutions — Best Laptops, Desktops, CCTV & Computer Store Near You',
   'Computer Solutions is your trusted local computer store for branded laptops, desktops, CCTV cameras, printers, accessories, repair & AMC services. Best prices, easy EMI, authorized dealer for HP, Dell, Lenovo, Acer, Asus & more.',
   'computer solutions, computer store near me, best laptop shop, buy laptop online, dell laptop dealer, hp laptop dealer, lenovo dealer, cctv camera installation, computer repair shop, laptop on emi, gaming laptop, business laptop, desktop computer, printer dealer, computer accessories, AMC services, authorized computer dealer',
   'Computer Solutions — Premium Laptops, Desktops & CCTV',
   'Trusted destination for branded laptops, desktops, CCTV & accessories. Authorized dealer with best prices, easy EMI & expert support.',
   '',
   'summary_large_image',
   '{"@context":"https://schema.org","@type":"LocalBusiness","name":"Computer Solutions","description":"Authorized dealer for laptops, desktops, CCTV cameras and computer accessories with repair and AMC services.","priceRange":"$$","image":"","telephone":"","address":{"@type":"PostalAddress"},"openingHours":"Mo-Sa 10:00-20:00"}'::jsonb,
   10),
  ('products', 'Products / Laptops',
   'Buy Laptops & Desktops Online — HP, Dell, Lenovo, Acer, Asus | Computer Solutions',
   'Shop the latest laptops and desktops from HP, Dell, Lenovo, Acer, Asus & MSI at best prices. Gaming laptops, business laptops, student laptops with warranty, easy EMI & free delivery.',
   'buy laptop online, hp laptop price, dell laptop price, lenovo laptop, gaming laptop, business laptop, student laptop, laptop emi, laptop dealer near me, desktop pc, all-in-one pc',
   'Premium Laptops & Desktops at Best Prices',
   'Shop branded laptops & desktops with warranty, easy EMI and expert advice from Computer Solutions.',
   '', 'summary_large_image', '{}'::jsonb, 20),
  ('cctv', 'CCTV / Security',
   'CCTV Camera Installation & Dealer — Hikvision, CP Plus, Dahua | Computer Solutions',
   'Authorized CCTV dealer & installer. Buy Hikvision, CP Plus, Dahua bullet, dome, IP and wireless cameras with installation, NVR, DVR setup. Home & office security solutions.',
   'cctv camera dealer, cctv installation near me, hikvision dealer, cp plus dealer, dahua cctv, ip camera, wireless cctv, home security camera, office cctv, dvr nvr installation',
   'CCTV Cameras & Security Solutions',
   'Authorized CCTV dealer with installation and AMC services for home & office security.',
   '', 'summary_large_image', '{}'::jsonb, 30),
  ('services', 'Services / Repair',
   'Laptop & Computer Repair Service, AMC & Data Recovery | Computer Solutions',
   'Expert laptop and computer repair services — screen replacement, motherboard repair, virus removal, data recovery and annual maintenance contracts (AMC) for home & business.',
   'laptop repair near me, computer repair shop, screen replacement, motherboard repair, data recovery, virus removal, amc services, computer maintenance, laptop service center',
   'Computer & Laptop Repair Services',
   'Expert repair, AMC and data recovery services for all major laptop and computer brands.',
   '', 'summary_large_image', '{}'::jsonb, 40),
  ('contact', 'Contact Us',
   'Contact Computer Solutions — Visit Our Store, Call or WhatsApp Us',
   'Get in touch with Computer Solutions for laptops, CCTV, repair services & quotes. Visit our store, call us or chat on WhatsApp for instant assistance.',
   'contact computer solutions, computer store address, computer dealer phone number, whatsapp computer shop',
   'Contact Computer Solutions',
   'Reach us by phone, WhatsApp or visit our store for laptops, CCTV and computer services.',
   '', 'summary_large_image', '{}'::jsonb, 50),
  ('deals', 'Daily Deals',
   'Today''s Best Deals on Laptops, Desktops & Accessories | Computer Solutions',
   'Grab today''s hottest deals on branded laptops, desktops, printers and accessories. Limited-time offers with huge discounts, easy EMI and free delivery.',
   'laptop deals today, best laptop offers, computer discount, daily deals, laptop sale, desktop offers, computer accessory deals',
   'Today''s Hottest Computer Deals',
   'Limited-time discounts on top laptops, desktops and accessories from Computer Solutions.',
   '', 'summary_large_image', '{}'::jsonb, 60);