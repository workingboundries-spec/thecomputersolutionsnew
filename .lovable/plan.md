## Goal
Populate this remix's empty database with content from the original project ([thecomputersolutions.in](/projects/b85a8f8b-0269-4c96-8bd7-c787c8985760)) so the homepage sections (banners, products, services, gallery, YouTube, deals, etc.) render exactly the same. Re-establish login users on the new backend.

## Important constraints (please read)

1. **Cross-project DB read isn't available to me.** I can't directly `SELECT` from the original project's Supabase from this project. You'll need to run **one export script** I provide on the original project, which will produce a single SQL/JSON dump. You paste/upload it here and I bulk-insert.
2. **Passwords cannot be migrated.** Supabase password hashes are tied to each project's signing keys and the `auth` schema is not writable via migrations. We must either (a) recreate users with new passwords you choose, or (b) trigger password-reset emails so each user sets their own.

---

## Phase 1 — Export data from the original project

I'll give you a single SQL command to run via the original project's Lovable chat ("run this query and give me the JSON"). It will dump every public content table to one JSON blob:

Tables to export:
- `banner_slides`, `nav_items`, `site_settings`, `section_headings`
- `products`, `daily_deals`, `cctv_products`
- `services`, `gallery_images`, `youtube_videos`
- `dealer_brands`, `instagram_reels`, `testimonial_videos`
- `sister_concerns`, `intro_section`
- (Optional CRM data — ask separately if you also want customers/sales/quotations/catalogue copied)

You paste the resulting JSON back to me (or save as `dump.json` and upload).

## Phase 2 — Import into this remix

I will:
1. Validate the JSON against this remix's table schemas (already confirmed identical above).
2. Run bulk `INSERT` statements (via the data-insert tool) into each table, preserving `id`, `sort_order`, `display_order`, and `is_active` flags so order/visibility match exactly.
3. Verify counts after each insert.
4. Reload the homepage and confirm Banners, Products, Services, Gallery, YouTube, Daily Deals, Brands, Reels, Testimonials, Sister Concerns, Intro section all render.

Storage assets (images uploaded to the `shop-assets` / `customer-photos` buckets in the old project) — if image URLs in the dump point to the old project's storage URL, they'll continue to work as long as those buckets remain public on the old project. If you want images physically copied into this remix's storage too, I'll add a Phase 2b that downloads each URL and re-uploads under the same path here, then rewrites the URLs.

## Phase 3 — Recreate users (no password transfer possible)

The auth-logs show `admin@thecomputersolutions.in` is failing login on this remix because that user **doesn't exist yet** in this project. You'll need to choose one:

- **Option A (fastest):** Tell me which user emails to create and a temporary password for each. I'll create them via an edge function that uses the service role key, then assign the proper `crm_user_roles` (`crm_admin` / `crm_user`).
- **Option B (most secure):** I scaffold a "Forgot password" page; you visit it for each email and set a new password via the reset link sent to that inbox.

Default if you don't specify: **Option A** for `admin@thecomputersolutions.in` with a password you provide privately, plus the `crm_admin` role.

## Phase 4 — Sanity checks

- Run security linter on the new tables (no schema changes, but confirms RLS still healthy).
- Browser-check the live preview to confirm sections are populated.
- If anything is still empty, re-export just that table and re-insert.

## What I will NOT do
- Modify the `auth` schema (forbidden).
- Copy password hashes (technically impossible across projects).
- Touch your original project's data — exports are read-only.

## What I need from you to start (after approval)
1. Confirm you want the export-then-import flow (I'll send the export SQL for you to run on the original project).
2. Pick **Option A or B** for users, and give me the email list (+ temp passwords if A).
3. Confirm whether to also copy CRM operational data (customers, sales, quotations, catalogue, reminders) — not just public website content.
