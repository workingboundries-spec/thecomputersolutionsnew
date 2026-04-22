-- Add new tables and extend existing ones for the website redesign
-- Keep all existing data intact

-- 1. NEW TABLE: nav_items
CREATE TABLE IF NOT EXISTS public.nav_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  href text NOT NULL,
  sort_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view nav items" ON public.nav_items FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage nav items" ON public.nav_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. NEW TABLE: banner_slides
CREATE TABLE IF NOT EXISTS public.banner_slides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
ALTER TABLE public.banner_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view banner slides" ON public.banner_slides FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage banner slides" ON public.banner_slides FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. NEW TABLE: dealer_brands
CREATE TABLE IF NOT EXISTS public.dealer_brands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name text NOT NULL,
  logo_url text,
  website_url text,
  brand_type text DEFAULT 'dealer',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.dealer_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view dealer brands" ON public.dealer_brands FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage dealer brands" ON public.dealer_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. NEW TABLE: instagram_reels
CREATE TABLE IF NOT EXISTS public.instagram_reels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  reel_url text,
  thumbnail_url text NOT NULL,
  caption text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.instagram_reels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view instagram reels" ON public.instagram_reels FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage instagram reels" ON public.instagram_reels FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. NEW TABLE: testimonial_videos
CREATE TABLE IF NOT EXISTS public.testimonial_videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text NOT NULL,
  location text,
  product_purchased text,
  video_url text,
  thumbnail_url text,
  review_text text,
  rating integer DEFAULT 5,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.testimonial_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view testimonial videos" ON public.testimonial_videos FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage testimonial videos" ON public.testimonial_videos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. NEW TABLE: section_headings
CREATE TABLE IF NOT EXISTS public.section_headings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text UNIQUE NOT NULL,
  heading text NOT NULL,
  subheading text,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.section_headings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view section headings" ON public.section_headings FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage section headings" ON public.section_headings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. NEW TABLE: enquiries
CREATE TABLE IF NOT EXISTS public.enquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  message text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can view enquiries" ON public.enquiries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage enquiries" ON public.enquiries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete enquiries" ON public.enquiries FOR DELETE TO authenticated USING (true);

-- 8. EXTEND existing products table with new columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS regular_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mrp numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS whatsapp_enquiry_msg text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 9. EXTEND existing services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 10. EXTEND existing daily_deals table
ALTER TABLE public.daily_deals ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.daily_deals ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.daily_deals ADD COLUMN IF NOT EXISTS mrp numeric;
ALTER TABLE public.daily_deals ADD COLUMN IF NOT EXISTS regular_price_num numeric;
ALTER TABLE public.daily_deals ADD COLUMN IF NOT EXISTS sale_price_num numeric;
ALTER TABLE public.daily_deals ADD COLUMN IF NOT EXISTS discount_percent numeric;
ALTER TABLE public.daily_deals ADD COLUMN IF NOT EXISTS whatsapp_msg text;
ALTER TABLE public.daily_deals ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 11. EXTEND existing youtube_videos table
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 12. Triggers for updated_at on new tables
CREATE TRIGGER set_updated_at_nav_items BEFORE UPDATE ON public.nav_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_banner_slides BEFORE UPDATE ON public.banner_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_dealer_brands BEFORE UPDATE ON public.dealer_brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_instagram_reels BEFORE UPDATE ON public.instagram_reels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_testimonial_videos BEFORE UPDATE ON public.testimonial_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_section_headings BEFORE UPDATE ON public.section_headings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Seed nav items
INSERT INTO public.nav_items (label, href, sort_order, is_visible) VALUES
  ('Home', '#home', 1, true),
  ('Services', '#services', 2, true),
  ('Products', '#products', 3, true),
  ('Deals', '#deals', 4, true),
  ('Sister Concerns', '#sister-concerns', 5, true),
  ('Customer Voices', '#testimonials', 6, true),
  ('Updates', '#updates', 7, true),
  ('Gallery', '#gallery', 8, true),
  ('Contact', '#contact', 9, true)
ON CONFLICT DO NOTHING;

-- 14. Seed section headings
INSERT INTO public.section_headings (section_key, heading, subheading) VALUES
  ('authorized_dealers', 'Our Authorized Brands', 'Trusted by leading technology brands'),
  ('services', 'Our Services', 'Professional tech solutions for every need'),
  ('new_arrivals', 'New Arrivals', 'Latest products just landed'),
  ('cctv', 'CCTV & Surveillance', 'Secure your home and business'),
  ('deals', 'Daily Deals', 'Best prices updated every day'),
  ('youtube', 'Watch & Learn', 'Tutorials and product reviews on YouTube'),
  ('instagram', 'Latest Reels', 'Follow us for daily tech updates'),
  ('testimonials', 'Customer Voices', 'Real stories from our customers'),
  ('follow_us', 'Follow Us', 'Stay connected on social media'),
  ('why_us', 'Why Choose Us', 'Trusted by thousands across the region'),
  ('sister_concerns', 'Our Sister Concerns', 'A trusted family of brands')
ON CONFLICT (section_key) DO NOTHING;

-- 15. Seed default site_settings (using existing key/value schema)
INSERT INTO public.site_settings (key, value) VALUES
  ('shop_name', 'Computer Solutions'),
  ('shop_tagline', 'Your Complete Technology Partner'),
  ('shop_phone', '9800000000'),
  ('shop_whatsapp', '9800000000'),
  ('shop_email', 'info@thecomputersolutions.in'),
  ('shop_address', 'Your Address Here'),
  ('facebook_url', 'https://facebook.com/'),
  ('instagram_url', 'https://instagram.com/'),
  ('youtube_url', 'https://youtube.com/'),
  ('whatsapp_default_msg', 'Hi! I am interested in your products.'),
  ('emi_banner_text', 'Easy EMI Available | 0% Interest | All Major Banks'),
  ('maps_embed_url', ''),
  ('youtube_subscribers', '1K+'),
  ('instagram_followers', '2K+'),
  ('facebook_likes', '500+'),
  ('why_us_1_title', 'Expert Team'),
  ('why_us_1_desc', 'Certified tech professionals at your service'),
  ('why_us_2_title', 'Best Prices'),
  ('why_us_2_desc', 'We match any authorized dealer price'),
  ('why_us_3_title', 'After Sales Service'),
  ('why_us_3_desc', 'Dedicated support post-purchase'),
  ('why_us_4_title', 'Genuine Products'),
  ('why_us_4_desc', '100% original with brand warranty')
ON CONFLICT (key) DO NOTHING;

-- 16. Seed dealer brands (the old hardcoded list)
INSERT INTO public.dealer_brands (brand_name, sort_order, brand_type, is_active) VALUES
  ('HP', 1, 'dealer', true),
  ('Dell', 2, 'dealer', true),
  ('Lenovo', 3, 'dealer', true),
  ('ASUS', 4, 'dealer', true),
  ('Acer', 5, 'dealer', true),
  ('Apple', 6, 'dealer', true),
  ('MSI', 7, 'dealer', true),
  ('Samsung', 8, 'dealer', true),
  ('Microsoft', 9, 'dealer', true),
  ('LG', 10, 'dealer', true)
ON CONFLICT DO NOTHING;