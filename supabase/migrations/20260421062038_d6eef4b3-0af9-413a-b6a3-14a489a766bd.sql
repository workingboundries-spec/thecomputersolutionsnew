-- ============================================================
-- CHANGE 1: Customer cascade delete (FK ON DELETE CASCADE)
-- Only tables that actually have a customer_id column.
-- crm_whatsapp_log + crm_warranty_reminders cleanup is done in app code.
-- ============================================================

-- reminders_queue.customer_id -> crm_customers
ALTER TABLE public.reminders_queue
  DROP CONSTRAINT IF EXISTS reminders_queue_customer_id_fkey;
ALTER TABLE public.reminders_queue
  ADD CONSTRAINT reminders_queue_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.crm_customers(id)
  ON DELETE CASCADE;

-- customer_event_logs.customer_id -> crm_customers
ALTER TABLE public.customer_event_logs
  DROP CONSTRAINT IF EXISTS customer_event_logs_customer_id_fkey;
ALTER TABLE public.customer_event_logs
  ADD CONSTRAINT customer_event_logs_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.crm_customers(id)
  ON DELETE CASCADE;

-- campaign_recipients.customer_id -> crm_customers
ALTER TABLE public.campaign_recipients
  DROP CONSTRAINT IF EXISTS campaign_recipients_customer_id_fkey;
ALTER TABLE public.campaign_recipients
  ADD CONSTRAINT campaign_recipients_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.crm_customers(id)
  ON DELETE CASCADE;

-- ============================================================
-- CHANGE 2: Inventory audit system
-- ============================================================

-- 2a. Add new perpetual-inventory columns to crm_catalogue (only if missing)
ALTER TABLE public.crm_catalogue
  ADD COLUMN IF NOT EXISTS opening_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_level integer NOT NULL DEFAULT 0;

-- One-time backfill: bring current_stock in line with the existing stock_qty
UPDATE public.crm_catalogue
SET current_stock = stock_qty
WHERE current_stock = 0 AND stock_qty <> 0;

-- 2b. inventory_transactions (every stock movement)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.crm_catalogue(id) ON DELETE CASCADE,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  movement_type text NOT NULL CHECK (movement_type IN (
    'manual_entry','sale','sale_reversal',
    'damage','write_off','return_to_supplier',
    'audit_adjustment','opening_stock'
  )),
  qty integer NOT NULL,
  balance_after integer,
  reference_id uuid,
  reference_type text,
  supplier_name text,
  purchase_price numeric(12,2),
  reason text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_item_date
  ON public.inventory_transactions (item_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_tx_type
  ON public.inventory_transactions (movement_type);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users view inv tx"
  ON public.inventory_transactions FOR SELECT TO authenticated
  USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert inv tx"
  ON public.inventory_transactions FOR INSERT TO authenticated
  WITH CHECK (is_crm_user(auth.uid()));
CREATE POLICY "CRM admins update inv tx"
  ON public.inventory_transactions FOR UPDATE TO authenticated
  USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE POLICY "CRM admins delete inv tx"
  ON public.inventory_transactions FOR DELETE TO authenticated
  USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));

-- 2c. inventory_audits (snapshot of each month-end audit)
CREATE TABLE IF NOT EXISTS public.inventory_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_month integer NOT NULL,
  audit_year integer NOT NULL,
  audit_date timestamptz NOT NULL DEFAULT now(),
  item_id uuid NOT NULL REFERENCES public.crm_catalogue(id) ON DELETE CASCADE,
  opening_stock integer NOT NULL DEFAULT 0,
  received_qty integer NOT NULL DEFAULT 0,
  sold_qty integer NOT NULL DEFAULT 0,
  damaged_qty integer NOT NULL DEFAULT 0,
  closing_system_stock integer NOT NULL DEFAULT 0,
  physical_count integer NOT NULL DEFAULT 0,
  variance integer NOT NULL DEFAULT 0,
  action_taken text CHECK (action_taken IN ('reset','carry_forward')),
  notes text,
  audited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_audit_period
  ON public.inventory_audits (audit_year DESC, audit_month DESC);
CREATE INDEX IF NOT EXISTS idx_inv_audit_item
  ON public.inventory_audits (item_id);

ALTER TABLE public.inventory_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users view inv audits"
  ON public.inventory_audits FOR SELECT TO authenticated
  USING (is_crm_user(auth.uid()));
CREATE POLICY "CRM users insert inv audits"
  ON public.inventory_audits FOR INSERT TO authenticated
  WITH CHECK (is_crm_user(auth.uid()));
CREATE POLICY "CRM admins update inv audits"
  ON public.inventory_audits FOR UPDATE TO authenticated
  USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));
CREATE POLICY "CRM admins delete inv audits"
  ON public.inventory_audits FOR DELETE TO authenticated
  USING (has_crm_role(auth.uid(), 'crm_admin'::crm_app_role));