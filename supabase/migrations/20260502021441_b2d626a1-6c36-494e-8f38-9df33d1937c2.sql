CREATE TABLE public.crm_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value numeric,
  new_value numeric NOT NULL,
  source text NOT NULL,
  reference_id uuid,
  supplier_name text,
  notes text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_price_history_item ON public.crm_price_history(item_id, changed_at DESC);

ALTER TABLE public.crm_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users view price history"
ON public.crm_price_history FOR SELECT
TO authenticated
USING (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM users insert price history"
ON public.crm_price_history FOR INSERT
TO authenticated
WITH CHECK (public.is_crm_user(auth.uid()));

CREATE POLICY "CRM admins delete price history"
ON public.crm_price_history FOR DELETE
TO authenticated
USING (public.has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));