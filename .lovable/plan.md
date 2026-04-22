

## Add Real Thumbnails to Services Section

### Why thumbnails aren't showing
The `Services` component already supports thumbnails — it reads `s.thumbnail_url` from the `services` table and renders it as a background image. When `thumbnail_url` is empty/null, it falls back to a yellow gradient (which is what you're seeing now).

So the code is fine — the database rows simply don't have `thumbnail_url` values set yet.

### Two ways to fix this (we'll do both)

**1. Seed each existing service with a relevant high-quality image**
Update every row in the `services` table with a contextually matching photo (Unsplash CDN URLs — free, fast, no upload needed). Mapping by `icon_name` / `title`:

| Service type | Image theme |
|---|---|
| Laptop / Sales | Modern laptop on desk |
| Wrench / Repair | Technician repairing laptop motherboard |
| RefreshCw / Upgrade | RAM/SSD hardware upgrade |
| ShieldCheck / AMC | IT support shield/security |
| Truck / Delivery | Delivery box / courier |
| Headphones / Support | Customer support headset |
| Monitor / Display | Monitor/display setup |
| Cpu / Hardware | CPU/processor closeup |
| HardDrive / Data | Hard drive / data recovery |

This makes the homepage instantly visual without any admin work.

**2. Improve the Admin → Services tab so it's easy to change later**
In `src/pages/Admin.tsx`, the Services tab currently has a `thumbnail_url` text field but it's easy to miss. We'll:
- Add a clear **"Thumbnail Image"** label with helper text ("Paste image URL or upload")
- Add an **upload button** that pushes the file to the existing `shop-assets` Supabase storage bucket and auto-fills the URL
- Show a small **live preview** of the current thumbnail next to the input
- Match the same UX already used for Products/Deals

### Files to change
- `src/pages/Admin.tsx` — enhance Services tab editor (upload + preview)
- Database — `UPDATE services SET thumbnail_url = '...'` for each existing row (via insert tool, no schema change)

### What you'll see after
- Homepage Services cards each show a relevant background photo with the yellow icon badge and dark overlay (existing design preserved)
- In `/admin → Services`, you can replace any thumbnail by uploading or pasting a new URL, with an instant preview

### Out of scope
- No schema changes (column already exists)
- No changes to the Services component itself (already renders thumbnails correctly)
- CRM at `/crm` untouched

