

## Fix: placeholders added in Admin templates render as empty in actual WhatsApp messages

### Root cause
The Admin → WhatsApp Templates preview uses a `sample` object containing every supported placeholder (`{price}`, `{phone}`, `{link}`, `{cost_line}`, `{purchase_date}`, `{expiry}`, etc.), so the preview always shows a value. But the runtime call sites (`sendWA` in Enquiries, Services, Sales, Catalogue, Dashboard) each pass only the small subset of variables they previously used.

`fillTemplate` replaces unknown placeholders with empty string (`String(undefined ?? "")`), so any newly-added block like `{price}` silently disappears in the actual WhatsApp message — even though the Admin preview shows it filled.

### Fix
Make every call site pass the **full set** of placeholders the Admin preview advertises, populating each from the row's real data (with safe empty-string fallbacks). The user can then add any placeholder in the template and it will work everywhere.

### 1. Centralise the placeholder contract — `src/crm/lib/whatsapp.ts`
- Add a helper `buildEnquiryVars(r, opts)` that returns the canonical map for enquiry-type messages: `name, phone, item, price, budget, category, address, specs_block, notes_block, shop_name, shop_phone, shop_email, link`.
- Add similar small builders for the other domains (`buildServiceVars`, `buildSalesVars`, `buildCatalogueQuoteVars`, `buildReminderVars`) — each returns every placeholder its template type can use, with sensible empty defaults so a missing field renders as `""` (not `undefined`) and an unused placeholder simply collapses.
- Each builder also formats currency via `formatINR` so `{price}` and `{amount}` show `₹52,000` exactly like the Admin preview.

### 2. Update every WhatsApp call site to use the builder
- **`src/crm/pages/CrmEnquiries.tsx`** → `sendWA(r)` builds vars via `buildEnquiryVars(r, { shop, specs })` instead of the current 5-key inline object. Now `{price}`, `{phone}`, `{address}`, etc. all populate.
- **`src/crm/pages/CrmServices.tsx`** → service status messages get the full `buildServiceVars` set (`{job_no}`, `{device}`, `{status}`, `{cost_line}`, `{name}`, `{phone}`, `{shop_name}`).
- **`src/crm/pages/CrmSales.tsx`** → both the receipt and "share sales form" sends use `buildSalesVars` (`{name}`, `{item}`, `{amount}`, `{invoice_no}`, `{link}`, `{shop_name}`).
- **`src/crm/pages/CrmCatalogue.tsx`** → direct quote share uses `buildCatalogueQuoteVars` (`{name}`, `{item}`, `{price}`, `{specs_block}`, `{link}`, `{shop_name}`, `{shop_phone}`).
- **`src/crm/pages/CrmDashboard.tsx`** → reminder send uses `buildReminderVars` (`{name}`, `{item}`, `{purchase_date}`, `{expiry}`, `{shop_name}`, `{shop_phone}`).

### 3. Pull shop info once
- Each call site already loads admin settings via `useAdminSettings` or a direct query — pass `shop_name`, `shop_phone`, `shop_email` into the builder so they're guaranteed to fill (currently some places hardcode `"The Computer Solutions"`, others omit it).

### 4. Align the Admin preview sample with reality
- In `CrmAdmin.tsx`, keep the `sample` object but add a small note under the placeholder hint: "Placeholders not relevant to a template type render as empty." This avoids confusion when, say, `{job_no}` is shown filled in preview but the enquiry flow has no job number.

### Result
- Adding `{price}` (or any other supported placeholder) to **any** template in Admin → WhatsApp Templates and saving will now appear correctly in the WhatsApp message that actually goes out.
- Cache is already cleared on save (existing `clearTemplateCache()`), so edits take effect immediately.
- No DB schema changes; no migration needed.

### Files touched
- `src/crm/lib/whatsapp.ts` — add builder helpers.
- `src/crm/pages/CrmEnquiries.tsx`
- `src/crm/pages/CrmServices.tsx`
- `src/crm/pages/CrmSales.tsx`
- `src/crm/pages/CrmCatalogue.tsx`
- `src/crm/pages/CrmDashboard.tsx`
- `src/crm/pages/CrmAdmin.tsx` — small note under placeholders.

