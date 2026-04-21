

## Why same items appear twice in Audit History

### Root cause
The Month-End Audit wizard was run **twice for April 2026** (once at 07:47, once at 12:11). Each run inserts a fresh row per item into `inventory_audits` — there is no uniqueness constraint on `(audit_year, audit_month, item_id)`, and the Audit History page renders every row. Your catalogue itself is fine: only 4 unique items (`ITM-0001`…`ITM-0004`).

So this is duplicate **audit entries**, not duplicate items.

### Fix (3 parts)

**1. One-time cleanup**
Keep only the latest audit row per `(year, month, item)` and delete the older duplicates. For April 2026 this removes the 07:47 set and keeps the 12:11 set (the most recent values you actually entered).

**2. Prevent it at the database level**
Add a unique constraint:
```
UNIQUE (audit_year, audit_month, item_id) on inventory_audits
```
Future audit runs will then **upsert** instead of insert-duplicate.

**3. Update the Month-End Audit wizard (`MonthEndAuditWizard.tsx`)**
- Switch the insert to an `upsert` on `(audit_year, audit_month, item_id)`.
- Before starting, detect if an audit already exists for the chosen month and show: *"An audit for April 2026 already exists. Continuing will overwrite it."* with Cancel / Overwrite buttons.
- This way re-running an audit corrects values instead of duplicating rows.

### Files touched
- New SQL migration: dedupe existing rows + add unique constraint.
- `src/crm/components/inventory/MonthEndAuditWizard.tsx` — upsert + overwrite confirmation.

### Result
- Audit History will show each item exactly **once per month**.
- Re-running a month-end audit safely overwrites the previous entry instead of stacking duplicates.
- Catalogue items remain untouched (they were never duplicated).

