## Problem

When you create a new catalogue item and enter a stock quantity, the Stock Report shows **Opening Stock = 0** and **Received = 0**, even though the item card shows stock correctly.

**Root cause** (verified in code):
- `CrmCatalogue.tsx` (line 64-76, `save`) and `CatalogueDrawer.tsx` (line 80-99, `save`) on INSERT only write `stock_qty`. They never set `opening_stock`, `current_stock`, or insert a row into `inventory_transactions`.
- `CrmStock.tsx`, `InventoryReports.tsx`, and `MonthEndAuditWizard.tsx` all read **`opening_stock`** directly from `crm_catalogue` and compute "Received" from `inventory_transactions` where `movement_type IN ('manual_entry','opening_stock')`.
- Result: brand-new items always show 0 / 0 / 0 in the Stock Report regardless of the entered quantity.

A second related issue: the edit form lets you change `stock_qty` directly, which also bypasses `current_stock` and the transaction ledger — so price/stock edits silently desync the inventory ledger.

## Fix

### 1. New item creation — write all three stock fields + ledger row

In **both** insert paths (`src/crm/pages/CrmCatalogue.tsx` `save()` and `src/crm/components/CatalogueDrawer.tsx` `save()`):

- When inserting (no `editing.id`), set on the payload:
  - `stock_qty = qty`
  - `opening_stock = qty`
  - `current_stock = qty`
- After successful insert, if `qty > 0`, call `applyMovement` from `src/crm/lib/inventory.ts` with:
  - `movementType: "opening_stock"`
  - `qty: +qty` (positive)
  - `notes: "Initial stock on item creation"`
  - `createdBy: user?.id` (from `useCrmAuth`)

Note: `applyMovement` itself updates `current_stock` again with delta logic. To avoid double-counting, on initial insert we should set `opening_stock = qty` and `current_stock = 0` in the INSERT, then let `applyMovement` bump it to `qty`. Cleaner alternative: set all three in the INSERT and write the `inventory_transactions` row directly (mirroring `applyMovement`'s insert) so the ledger has `balance_after = qty`. We'll go with the direct-insert approach to keep it atomic and avoid the read-modify-write race.

### 2. Edit flow — keep ledger in sync when stock_qty changes manually

In `CrmCatalogue.tsx` `save()` UPDATE branch:
- Compare `editing.stock_qty` against the original item's `stock_qty`.
- If changed, after the UPDATE call `applyMovement` with:
  - `movementType: "audit_adjustment"`
  - `qty: newQty - oldQty` (signed delta)
  - `reason: "Manual stock edit from catalogue form"`
- Also set `current_stock = newQty` in the UPDATE payload so the two columns stay in sync.

### 3. Price-management sanity check

Reviewed price fields (`nlc_price`, `billing_price`, `sale_price`, `online_price`, `mrp`) — these are pure numeric writes with no ledger dependency, so no inventory side-effects. The only guardrail to add: in the edit form, warn (toast) if `sale_price < nlc_price` (negative margin) — non-blocking, just informational. Optional; include if you want.

## Files to change

- `src/crm/pages/CrmCatalogue.tsx` — patch `save()` for INSERT (set 3 stock fields + insert ledger row) and UPDATE (delta ledger + sync `current_stock`).
- `src/crm/components/CatalogueDrawer.tsx` — patch `save()` for INSERT (same 3 fields + ledger row); import `useCrmAuth` for `created_by`.

No database schema changes. No RLS changes (existing policies already allow CRM users to insert into `crm_catalogue` and `inventory_transactions`).

## Verification after build

1. Add a new item with Stock Qty = 5 → Stock Report should show Opening = 5, Received = 0, Closing = 5.
2. Edit that item, change Stock Qty to 8 → Stock Report should show Opening = 5, an audit_adjustment of +3, Closing = 8.
3. Existing items (created before this fix) will continue to show Opening = 0 — this is expected; they can be corrected via the Month-End Audit Wizard's "Reset to Physical Count" flow.
