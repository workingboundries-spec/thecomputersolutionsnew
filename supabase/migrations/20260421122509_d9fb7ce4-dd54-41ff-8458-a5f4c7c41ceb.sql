-- 1. Deduplicate existing audit rows: keep only the latest per (year, month, item)
DELETE FROM public.inventory_audits a
USING public.inventory_audits b
WHERE a.audit_year = b.audit_year
  AND a.audit_month = b.audit_month
  AND a.item_id = b.item_id
  AND a.created_at < b.created_at;

-- 2. Add unique constraint to prevent future duplicates
ALTER TABLE public.inventory_audits
  ADD CONSTRAINT inventory_audits_year_month_item_unique
  UNIQUE (audit_year, audit_month, item_id);