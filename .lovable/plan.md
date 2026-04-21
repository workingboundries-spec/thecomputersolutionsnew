

## Add unique Item Code (alias) for each catalogue item

### Goal
Give every catalogue item a short, unique, human-readable **Item Code** (e.g. `ITM-0001`) shown against the item everywhere, and allow Sales / Quotations to add a line by typing this code as an alias — bypassing the dropdown.

---

### 1. Database — add `item_code` to `crm_catalogue`

Add one new column:

- `item_code TEXT UNIQUE` — auto-assigned `ITM-0001`, `ITM-0002`, ... in insertion order.

Migration steps:
1. Add column `item_code TEXT` (nullable initially), then `UNIQUE` index.
2. Backfill all existing rows with sequential codes ordered by `created_at`:  
   `ITM-0001`, `ITM-0002`, ...
3. Create a Postgres sequence + trigger so new inserts auto-fill `item_code` if blank:
   - `crm_catalogue_code_seq` starts after the highest existing number.
   - `BEFORE INSERT` trigger sets `NEW.item_code = 'ITM-' || LPAD(nextval(...)::text, 4, '0')` when null.
4. After backfill, mark column `NOT NULL`.

No other table changes — Sales / Quotations continue to link by the existing `item_id` UUID. `item_code` is just the human alias.

---

### 2. Catalogue page (`src/crm/pages/CrmCatalogue.tsx`)

- Add `item_code` to the `Item` type and to `select("*")` (already covered by `*`).
- **Table view**: add a new first column **"Code"** showing `i.item_code` in a monospace pill (e.g. `ITM-0001`). Make it copy-on-click.
- **Grid view**: show the code as a small badge in the top-right of each card.
- **Edit modal**: show the code as read-only at the top (`Item Code: ITM-0001 — auto-assigned`). Do not allow editing. New items show "Will be auto-assigned on save".
- **Search**: extend the existing search filter so typing `ITM-0001` also matches.

---

### 3. Sales page (`src/crm/pages/CrmSales.tsx`) — alias entry

Add a new field in the Add/Edit Sale form, just above the existing "Pick from Catalogue" dropdown:

- **"Item Code (quick entry)"** — single text input.
- On blur / Enter, look up the catalogue row where `item_code = <typed value>` (case-insensitive).
  - If found: auto-fill `item_id`, `item_name = "<brand> <model>"`, `sale_price`, same as picking from the dropdown today.
  - If not found: show inline red text "No item matches code XYZ" and leave manual fields untouched.
- The existing dropdown and manual entry continue to work unchanged.

---

### 4. Quotations page (`src/crm/pages/CrmQuotations.tsx`) — alias entry per line

For each quotation line item, add a small **"Code"** input next to the item name field:

- Type `ITM-0001` → on blur, fill that line's `name` with `"<brand> <model>"` and `price` with `sale_price` from catalogue.
- If the code is invalid, show the same inline "not found" hint reused from the existing "not in catalogue" suggestion.
- The existing "Add from Catalogue" picker and the "Add to Catalogue" drawer flow stay as-is.

Also extend the catalogue-picker search to match by `item_code`.

---

### 5. Catalogue drawer (`src/crm/components/CatalogueDrawer.tsx`)

Show a read-only "Item Code: will be auto-assigned" line at the top of the form, so users adding items inline from a quotation know a code will be generated.

---

### Files touched
- New SQL migration (column + sequence + trigger + backfill).
- `src/crm/pages/CrmCatalogue.tsx` — display code, search, edit modal label.
- `src/crm/pages/CrmSales.tsx` — quick-entry code field.
- `src/crm/pages/CrmQuotations.tsx` — per-line code field + picker search.
- `src/crm/components/CatalogueDrawer.tsx` — informational label only.

### Result
- Every catalogue item carries a permanent, unique, short code like `ITM-0007`.
- Visible on every catalogue listing (table + grid).
- Sales and quotations can be created either by picking from the dropdown **or** by typing the code — both routes resolve to the same `item_id` and trigger the same stock movement / linking behaviour.
- Existing data, sales history, and stock movements are untouched.

