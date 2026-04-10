CREATE TABLE public.daily_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  original_price TEXT NOT NULL,
  deal_price TEXT NOT NULL,
  valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily deals" ON public.daily_deals FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert daily deals" ON public.daily_deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update daily deals" ON public.daily_deals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete daily deals" ON public.daily_deals FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_daily_deals_updated_at
BEFORE UPDATE ON public.daily_deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();