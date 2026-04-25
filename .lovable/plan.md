I’ll create a new `full_export_v3.sql` that exports the complete database schema plus all currently stored data, not just selected config rows.

Current finding: `full_export_v2.sql` does include all 43 public tables by schema, including the “last” tables:

```text
reminders_queue
section_headings
seo_meta_tags
services
sister_concerns
site_settings
site_whatsapp_templates
testimonial_videos
youtube_videos
```

The issue is likely that v2 only seeded 14 config/template tables. It did not include row data for many visible admin tables such as `products`, `daily_deals`, `dealer_brands`, `cctv_products`, `instagram_reels`, `testimonial_videos`, `youtube_videos`, etc. So after applying it to a new/old database, tables may exist but appear empty in admin.

## Plan

### 1. Generate a full data-inclusive export
Create a new file:

```text
supabase/migrations/<timestamp>_full_export_v3_all_data.sql
/mnt/documents/full_export_v3_all_data.sql
```

It will include:
- All extensions
- All enums
- All sequences
- All 43 public tables
- All columns/defaults/nullability as safely as possible
- Primary keys, unique constraints, foreign keys if present
- Indexes
- Functions
- Triggers
- RLS policies
- Storage buckets and storage object policies
- Realtime publication setup
- Data inserts for every public table that currently has rows

### 2. Include every table’s rows, not only settings
The data section will include rows from all tables with data, including:

```text
admin_customer_settings
admin_reminder_settings
campaign_templates
cctv_products
crm_admin_settings
crm_catalogue
crm_enquiries
crm_quotations
crm_quote_shares
crm_settings
crm_user_roles
crm_whatsapp_templates
daily_deals
dealer_brands
instagram_reels
intro_section
nav_items
products
quotation_templates
section_headings
seo_meta_tags
services
sister_concerns
site_settings
site_whatsapp_templates
testimonial_videos
youtube_videos
```

And if any currently-empty tables later contain rows during generation, they will be included too.

### 3. Use safe/idempotent data restore rules
For each row:
- Use `INSERT ... ON CONFLICT (id) DO UPDATE SET ...` where the table has an `id` primary key.
- For key-based tables like `site_settings`, `crm_settings`, `seo_meta_tags`, etc., keep the `id` but also rely on existing unique constraints where needed.
- Avoid destructive statements: no `DROP TABLE`, no `TRUNCATE`, no `DELETE`.

Important note: `ON CONFLICT DO UPDATE` means if you run v3 on an existing database, matching rows will be refreshed to the export’s values. This is better for fixing missing/blank admin content. It will not delete extra rows you already have.

### 4. Verify before delivery
I’ll verify:
- The live database table count equals the export’s `CREATE TABLE IF NOT EXISTS` count.
- Every table is represented in the schema section.
- Every table with row count > 0 has a data section.
- Specific checks for the last/admin tables: `seo_meta_tags`, `section_headings`, `services`, `sister_concerns`, `site_whatsapp_templates`, `testimonial_videos`, `youtube_videos`.
- Safety check confirms no `DROP TABLE`, `TRUNCATE`, or `DELETE FROM`.

### 5. Deliver with download button
I’ll provide the new file as a downloadable artifact:

```text
full_export_v3_all_data.sql
```

## Technical notes

- Auth users are still not exportable through this SQL file. If rebuilding a brand-new backend, users must be recreated and `crm_user_roles` may need user IDs adjusted to the new auth user IDs.
- Storage bucket definitions will be included, but the actual uploaded image files are not inside SQL. The rows may contain image URLs from the old storage project; if you create a brand-new backend, images must be re-uploaded or URLs updated.
- This will be designed for both existing databases and fresh databases.