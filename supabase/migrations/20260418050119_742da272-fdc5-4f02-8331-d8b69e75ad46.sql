-- Allow anonymous customers to submit their own sale entries for review.
-- They can ONLY insert rows marked as 'pending_review'. CRM staff later confirm and update status.
CREATE POLICY "Anonymous can submit pending sales"
ON public.crm_sales
FOR INSERT
TO anon
WITH CHECK (payment_status = 'pending_review');