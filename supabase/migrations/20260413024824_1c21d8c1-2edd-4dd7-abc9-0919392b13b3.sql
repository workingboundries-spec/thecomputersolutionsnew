
CREATE TABLE public.cctv_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Dome',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cctv_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cctv products" ON public.cctv_products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert cctv products" ON public.cctv_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cctv products" ON public.cctv_products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cctv products" ON public.cctv_products FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_cctv_products_updated_at
BEFORE UPDATE ON public.cctv_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (key, value) VALUES
  ('brands_tagline', 'Authorized Dealer for All Major Brands'),
  ('product_categories', 'Business,Gaming,Student,Budget,Premium')
ON CONFLICT (key) DO NOTHING;
