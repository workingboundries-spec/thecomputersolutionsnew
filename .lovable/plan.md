

## Fix the migration script so it works on any Supabase (empty OR partially set up)

### Root cause
The script uses `CREATE TABLE IF NOT EXISTS`, which **skips entirely** when a table of the same name already exists — even if its columns differ. Your target Supabase already has an old `crm_catalogue` table (without `item_code`), so the new column definitions were never applied. Then line 513 tries to create a unique index on `item_code` and fails with `42703: column "item_code" does not exist`.

### Fix strategy
Make `full_database_setup.sql` fully idempotent and self-healing:

1. **After every `CREATE TABLE IF NOT EXISTS`**, emit `ALTER TABLE … ADD COLUMN IF NOT EXISTS …` for every column with the same type/default/nullable. This guarantees missing columns get added on partial DBs.
2. **Wrap risky DDL** (indexes, triggers, FKs that depend on new columns) in `DO $$ … $$` blocks that check `information_schema.columns` first, so they skip cleanly if a column is somehow still absent.
3. **Order**: extensions → enum → sequence → functions → tables → ALTER ADD COLUMN guards → indexes → triggers → RLS → policies → storage buckets → storage policies.
4. **Storage buckets / policies** stay wrapped in `ON CONFLICT DO NOTHING` and `DROP POLICY IF EXISTS` so re-runs are safe.
5. **No data loss**: script never `DROP`s tables; only adds missing columns / policies / triggers.

### Deliverable
- Rewrite `/mnt/documents/full_database_setup.sql` (single file) with the above structure, covering all 30 tables exactly as they exist in the live DB (schemas pulled from current Supabase metadata already in context).
- Add a short header comment block with the run-order steps:
  1. Run the SQL in Supabase SQL Editor.
  2. Create the admin user under Auth → Users.
  3. `INSERT INTO public.crm_user_roles (user_id, role) VALUES ('<uuid>', 'crm_admin');`
  4. Update the app's `.env` with the new `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### Result
The single SQL file will run cleanly on:
- A brand-new empty Supabase project, **and**
- Your current target project that already has partial tables — it will heal them by adding any missing columns before creating indexes/triggers/policies.

No `item_code does not exist` (or similar) errors will occur on re-run.

### Files touched
- `/mnt/documents/full_database_setup.sql` — full rewrite (idempotent version).

