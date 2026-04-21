-- Add item_code column to crm_catalogue
ALTER TABLE public.crm_catalogue ADD COLUMN IF NOT EXISTS item_code TEXT;

-- Backfill existing rows ordered by created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM public.crm_catalogue
  WHERE item_code IS NULL
)
UPDATE public.crm_catalogue c
SET item_code = 'ITM-' || LPAD(n.rn::text, 4, '0')
FROM numbered n
WHERE c.id = n.id;

-- Create sequence starting after the highest existing number
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(item_code, '^ITM-', ''), '')::int), 0)
  INTO max_num
  FROM public.crm_catalogue
  WHERE item_code ~ '^ITM-\d+$';

  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.crm_catalogue_code_seq START WITH %s', max_num + 1);
  PERFORM setval('public.crm_catalogue_code_seq', GREATEST(max_num, 1), max_num > 0);
END $$;

-- Trigger function to auto-assign item_code
CREATE OR REPLACE FUNCTION public.assign_crm_catalogue_item_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.item_code IS NULL OR NEW.item_code = '' THEN
    NEW.item_code := 'ITM-' || LPAD(nextval('public.crm_catalogue_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_crm_catalogue_item_code ON public.crm_catalogue;
CREATE TRIGGER trg_assign_crm_catalogue_item_code
BEFORE INSERT ON public.crm_catalogue
FOR EACH ROW
EXECUTE FUNCTION public.assign_crm_catalogue_item_code();

-- Mark NOT NULL and add unique index
ALTER TABLE public.crm_catalogue ALTER COLUMN item_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS crm_catalogue_item_code_unique ON public.crm_catalogue(item_code);