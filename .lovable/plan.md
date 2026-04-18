
The user wants a public-facing customer form that, when filled out, auto-creates a row in the Sales section (`crm_sales`). The form link will be shared via WhatsApp.

**Plan:**

1. **New public route `/sales-form`** (no auth required) — a clean form for the customer to fill:
   - Name, Phone, WhatsApp, Address, DOB (optional)
   - Item purchased (text), Sale price, Payment mode (dropdown), Notes
   - Submit button

2. **Database/RLS:**
   - `crm_sales` currently requires `is_crm_user(auth.uid())` for INSERT. A public customer is anonymous, so we need a way to allow anonymous inserts safely.
   - Add a new RLS policy: allow `anon` to INSERT into `crm_sales` ONLY when `payment_status = 'pending_review'` (a flag that means "submitted by customer, needs CRM review").
   - Add `payment_status='pending_review'` so CRM staff can filter and confirm these.
   - Generate `invoice_no` server-side as `CUST-{timestamp}` placeholder so customer doesn't need to fill it.

3. **CRM Sales page:**
   - Add a "Share Sale Form" button at top → copies link `https://<site>/sales-form` and opens WhatsApp with prefilled message: "Please fill your purchase details: <link>"
   - Customer-submitted rows show a yellow "Pending Review" badge so staff can edit/confirm them.

4. **Files to edit/create:**
   - NEW: `src/pages/PublicSalesForm.tsx` — the public form
   - EDIT: `src/App.tsx` — add `/sales-form` route (public)
   - EDIT: `src/crm/pages/CrmSales.tsx` — add Share button + Pending badge
   - MIGRATION: add anon INSERT policy on `crm_sales` restricted to `payment_status='pending_review'`

No changes to other modules. Minimal and focused.
