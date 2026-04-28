## Goal
Produce a single, safe, idempotent SQL file you can paste into your own Supabase project's **SQL Editor** to bring its schema up to date with the latest Lovable migration, without touching any of your data.

## What changed since your last applied migration

You confirmed your DB is at `20260425083750_...sql` (Apr 25, 08:37).
The only later migration is `20260425091605_full_export.sql` (same day, ~40 min later).

After diffing the two, the **actual schema delta** is small:

- **Tables**: none new (all 30+ tables already existed in your DB).
- **Columns**: none new (all `ADD COLUMN` items in the older file are present as inline columns in the newer file — nothing to add).
- **Enums / sequences / functions**: unchanged.
- **New RLS policies** (~10): mostly fill-in policies for `services`, `site_settings`, `youtube_videos`, `seo_meta_tags`, `site_whatsapp_templates`, `quotation_templates`, `reminders_queue`. Every one will be wrapped to drop-if-exists then create, so re-running is safe.
- **New triggers** (~20 unique `updated_at` auto-update triggers + the catalogue item-code trigger). All will use `DROP TRIGGER IF EXISTS` then `CREATE TRIGGER`.
- **New indexes** (11): `crm_catalogue_item_code_unique`, `idx_camp_recip_campaign`, `idx_camp_recip_customer`, `idx_crm_stock_audit_month`, `idx_event_logs_customer`, `idx_inv_audit_item`, `idx_inv_audit_period`, `idx_inv_tx_item_date`, `idx_inv_tx_type`, `idx_wa_log_campaign`, `idx_wa_log_customer`. All will use `CREATE INDEX IF NOT EXISTS`.

Net: the delta is **policies + triggers + indexes only**. No table or column creation, so there is zero risk to existing rows.

## Deliverable

A single file written to `/mnt/documents/incremental_schema_delta.sql` that:

1. Wraps everything in a single `BEGIN; ... COMMIT;` so it's all-or-nothing.
2. Uses **only** non-destructive, idempotent statements:
   - `DROP POLICY IF EXISTS ... ; CREATE POLICY ...` (so re-running won't fail if a policy was added in your DB previously)
   - `DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER ...`
   - `CREATE INDEX IF NOT EXISTS ...`
   - `CREATE OR REPLACE FUNCTION ...` only for the helper `update_updated_at_column()` and `assign_crm_catalogue_item_code()` (in case yours are slightly older — replacing a function does not touch any row).
3. Does **NOT** contain any `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN TYPE`, or sequence resets — your data stays exactly as-is.
4. Begins with a comment block listing each section and what it does, so you can review before running.

## How you'll apply it

1. I generate the file and attach it to my next message.
2. You open your own Supabase project's SQL Editor → New Query → paste the file → Run.
3. If anything errors, the `BEGIN/COMMIT` rolls everything back; nothing partial gets applied.
4. After it succeeds, your schema will exactly match the current Lovable project's schema, and your existing data is untouched.

## What this plan does NOT do

- It does **not** repoint the Lovable app code to your Supabase project — that still requires the Connectors UI step from the earlier plan (disable Lovable Cloud → connect your own Supabase project). This delta is purely a schema-sync utility for your DB.
- It does **not** redeploy edge functions to your project.
- It does **not** modify any data in either database.

## Confirm to proceed

Approve this plan and I'll switch to default mode, generate `incremental_schema_delta.sql`, and present it as a downloadable artifact.
