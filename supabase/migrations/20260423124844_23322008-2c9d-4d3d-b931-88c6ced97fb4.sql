-- Sister concerns (Our Family) cards
CREATE TABLE public.sister_concerns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  thumbnail_url TEXT,
  website_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sister_concerns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sister concerns"
  ON public.sister_concerns FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage sister concerns"
  ON public.sister_concerns FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_sister_concerns_updated_at
  BEFORE UPDATE ON public.sister_concerns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Intro / About section (single-row config)
CREATE TABLE public.intro_section (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  heading TEXT NOT NULL DEFAULT 'About Computer Solutions',
  subheading TEXT,
  body_text TEXT,
  youtube_url TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intro_section ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view intro section"
  ON public.intro_section FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage intro section"
  ON public.intro_section FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_intro_section_updated_at
  BEFORE UPDATE ON public.intro_section
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults
INSERT INTO public.sister_concerns (name, tagline, description, sort_order) VALUES
  ('ATEC', 'Avenue To Excellent Careers', 'Empowering the next generation with industry-ready tech education and certified training programs.', 1),
  ('Abroad Avenues', 'Your Gateway to Global Education', 'Trusted overseas education consultants helping students unlock world-class universities and careers abroad.', 2),
  ('Tally Institute of Learning', 'Master Accounting. Master Business.', 'Authorized Tally training institute offering certified courses in accounting, GST, and financial management.', 3);

INSERT INTO public.intro_section (heading, subheading, body_text, youtube_url) VALUES
  ('About Computer Solutions',
   'Your Trusted Tech Partner Since Day One',
   'From premium laptops and CCTV solutions to expert service and EMI options — Computer Solutions delivers the latest technology with unmatched trust, quality, and after-sales support across the region.',
   'https://www.youtube.com/embed/dQw4w9WgXcQ');