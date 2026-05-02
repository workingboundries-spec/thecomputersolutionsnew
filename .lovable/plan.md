## Discrepancy

In your screenshot of `/crm/stock` → **Live Stock** tab, HP 1040 shows:
`Opening=2, Received=1, Sold=0, Damaged=0` → expected **Current = 3**, but it shows **Current = 2**.

The formula `Current = Opening + Received − Sold − Damaged` is not being enforced on the **Live Stock** tab. The earlier fix only touched the **Reports → Current Stock** tab (`InventoryReports.tsx`). The Live Stock table lives in a different file (`src/crm/pages/CrmStock.tsx`) and still has the same three bugs:

1. **Loads only the current month's transactions** but uses an all-time `opening_stock` → numbers don't reconcile.
2. **Counts `opening_stock` movement type as Received** → double-counts the baseline.
3. **Renders `i.current_stock`** raw from the DB instead of the computed value → if the stored value drifts from the ledger, the row contradicts itself (which is what your screenshot shows).

## Fix

Edit only `src/crm/pages/CrmStock.tsx` → `LiveStock` component:

1. **Load all `inventory_transactions`** for each item (drop the `gte(monthStart)` filter), so Received/Sold/Damaged are measured from the same baseline as Opening.
2. **Stop counting `opening_stock` movements as Received** — only `manual_entry` (Add Stock) counts as Received.
3. **Compute `Current = Opening + Received − Sold − Damaged`** per row and display that value in the Current column (instead of `i.current_stock`).
4. **Recompute Out / Low status** from the computed value so row colouring matches the displayed number.
5. **Use computed value for the Stat tiles** (Stock Value NLC, Low Stock, Out of Stock) so the summary cards agree with the rows.
6. **Drift indicator**: if the stored `current_stock` differs from the computed value, show a small `⚠ DB:n` chip next to the number so you can spot ledger/catalogue desync without auto-overwriting data.

## Files

- `src/crm/pages/CrmStock.tsx` — only the `LiveStock` function (lines ~50–180).
- No DB changes. No other tabs/pages affected.
