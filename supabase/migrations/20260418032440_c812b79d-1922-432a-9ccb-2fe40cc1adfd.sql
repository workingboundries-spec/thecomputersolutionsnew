-- 1. Add photo_url column to customers
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS photo_url text;

-- 2. Create public storage bucket for customer photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-photos', 'customer-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies
DROP POLICY IF EXISTS "Public can view customer photos" ON storage.objects;
CREATE POLICY "Public can view customer photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-photos');

DROP POLICY IF EXISTS "CRM users can upload customer photos" ON storage.objects;
CREATE POLICY "CRM users can upload customer photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'customer-photos' AND public.is_crm_user(auth.uid()));

DROP POLICY IF EXISTS "CRM users can update customer photos" ON storage.objects;
CREATE POLICY "CRM users can update customer photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'customer-photos' AND public.is_crm_user(auth.uid()));

DROP POLICY IF EXISTS "CRM users can delete customer photos" ON storage.objects;
CREATE POLICY "CRM users can delete customer photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'customer-photos' AND public.is_crm_user(auth.uid()));