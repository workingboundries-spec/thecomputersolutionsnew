

## Show catalogue Specifications inside Enquiry messages and Quotation items

### Goal
Whenever an item is added from the catalogue (or matched by item code), pull the **Specifications** text from `crm_catalogue.specs` along with it, store it on the line, and show it:
- In the **Enquiry WhatsApp message** sent to the customer.
- Under the item in the **Quotation** (form table, PDF/JPEG preview, and WhatsApp message).

No DB schema changes needed — `crm_catalogue.specs` already exists and `crm_quotations.items` is JSONB so we can add a `specs` field to each line item without a migration.

---

### 1. Quotations — carry `specs` per line item

**`src/crm/pages/CrmQuotations.tsx`**
- Extend `QItem` type with `specs?: string`.
- Catalogue load query: include `specs`:
  `select("id, item_code, brand, model, sale_price, stock_qty, specs")`
- `addFromCatalogue(it)` → store `specs: it.specs || ""` on the new line.
- `lookupLineCode(idx, code)` → also write `specs: c.specs || ""` to the line.
- Items table in the form: render the spec text as a small grey sub-line under the Item input (read-only, auto-filled, but editable via a tiny "edit" textarea/expand if user wants to override — keep simple: show as muted text and allow inline edit).
- On save: include `specs` in each item object written to `crm_quotations.items`.
- When loading an existing quote into the form for editing, preserve `specs` from the stored JSON.

**`src/crm/components/QuotationPreview.tsx`**
- The items table column "Item Description" should render:
  - Bold line: `it.name`
  - Below it (smaller, grey): `it.specs` (only if present), with line breaks preserved (`whiteSpace: "pre-wrap"`).
- Apply the same to the small WhatsApp-card preview block at the bottom of the file.

**`src/crm/lib/quotationMessage.ts`**
- `buildItemsTable(items)`: when an item has `specs`, append indented spec lines under the existing `Qty / Unit / Total` line, e.g.:
  ```
  1. Lenovo ThinkPad E14
     Specs: i5-1235U / 16GB / 512GB SSD / 14" FHD
     Qty: 1   Unit: ₹62,000   Total: ₹62,000
  ```
- Update the `items` array type signature to include optional `specs?: string`.

### 2. Enquiries — link to catalogue and pass specs into WhatsApp message

**`src/crm/pages/CrmEnquiries.tsx`**
- Load active catalogue once (`brand, model, item_code, specs`) on mount.
- In the enquiry form, replace the plain "Item Name" input with a **searchable picker / typeable field**:
  - User can type freely (preserves existing data) **or** pick from catalogue.
  - When picked, store both `item_name` (= `brand + model`) and (locally on the form) the matched `specs` so the user sees them.
- We do **not** add a new column — instead, on `sendWA`, look up the catalogue row whose `brand + model` matches `r.item_name` and inject its `specs` into the message:
  ```
  Hi {name}, regarding your enquiry for {item_name}.
  Specifications:
  {specs}
  — The Computer Solutions
  ```
  If no match / no specs, fall back to the current message (no Specifications line).
- Show the matched specs as a small grey line under the "Item Name" field in the form (preview), and under the Item column in the enquiries table (so the owner sees what will be sent).

### 3. Files touched
- `src/crm/pages/CrmQuotations.tsx` — type, catalogue select, add/lookup helpers, form row UI, save payload.
- `src/crm/components/QuotationPreview.tsx` — item description rendering (full preview + WA card).
- `src/crm/lib/quotationMessage.ts` — `buildItemsTable` adds Specs line.
- `src/crm/pages/CrmEnquiries.tsx` — load catalogue, picker on item name, specs preview, enriched WhatsApp message.

### 4. Result
- Adding `ITM-0007` (or picking it) into a quotation auto-fills the spec text under the item — visible in the form, preview, JPEG/PDF, and outgoing WhatsApp message.
- Sending an enquiry follow-up via WhatsApp now includes the catalogue specs of the enquired item, so the customer immediately sees what configuration is being discussed.
- Items not in catalogue (free-text) continue to work exactly as before — specs simply omitted.

