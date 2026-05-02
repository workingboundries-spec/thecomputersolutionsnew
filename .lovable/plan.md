## Problem

In the **Current Stock** report (`src/crm/components/inventory/InventoryReports.tsx` → `CurrentStock`), the "Current" column shows `crm_catalogue.current_stock` directly from the database. It does **not** enforce the formula:

```
Current = Opening + Received − Sold − Damaged
```

So if any transaction is missed, deleted, or `current_stock` was edited manually, the row's Current value will not match Opening + Received − Sold − Damaged, and the user sees inconsistent numbers.

Additionally, the report only loads transactions from **the start of the current month**, but uses `opening_stock` from the catalogue (which represents the all-time opening or last manual reset). Mixing a month-window with an all-time opening can also produce wrong-looking math.

## Fix Plan

### 1. Make the math consistent in the Current Stock report

Change `CurrentStock()` so each row computes:

```
computedCurrent = opening_stock + received − sold − damaged
```

…using the same time window for Received / Sold / Damaged that defines "Opening". Since `opening_stock` in the catalogue is a reset baseline (not month-bound), load **all** `inventory_transactions` for each item that occurred **after the last opening reset**, not just the current month.

Simpler, robust approach:
- Load ALL transactions (no month filter) per item.
- Received = sum of `manual_entry` qty (positive deltas from Add Stock).
- Sold = sum of `sale` qty − `sale_reversal` qty.
- Damaged = sum of `damage` + `write_off` qty.
- `computedCurrent = opening_stock + received − sold − damaged`.

Display `computedCurrent` in the **Current** column (instead of `i.current_stock`).

### 2. Show a mismatch indicator

If `computedCurrent !== i.current_stock` (the value stored in the catalogue), show a small warning chip next to the number, e.g. `⚠ DB: 7` so the admin can see when stored stock has drifted from the ledger. This protects against silent corruption without auto-overwriting data.

### 3. Use computed value for Status

Recalculate the Out / Low / OK status from `computedCurrent` instead of the stored value, so the report is self-consistent.

### 4. CSV / PDF export

Update the exported rows to use `computedCurrent` so downloads match the on-screen math.

## Files to change

- `src/crm/components/inventory/InventoryReports.tsx` — only the `CurrentStock` component (≈ lines 63–122). No DB schema changes, no other report tabs affected.

## Out of scope

- No changes to Add Stock, Catalogue edit, or Price History flows — those remain as built.
- No database migration needed.
