

## Fix orphaned warranty reminders for deleted customers

### Problem
Warranty reminders (and the Warranty page) still show entries for deleted customers like SHIVAY and vijay. Root cause:

- `crm_warranty_reminders` is linked to `crm_sales.id` via `sale_id`, **not** to `crm_customers.id`.
- When a customer was deleted, the cascade I built cleaned `crm_whatsapp_log` and reminders matching the customer's `phone`, but the matching `crm_sales` were only **soft-deleted** (`is_deleted = true`), and the reminders attached to those sales were never removed.
- The Warranty page reads `crm_warranty_reminders` with no filter on sale status, so orphan rows still appear.

### Fix (3 parts)

**1. One-time cleanup of existing orphans**

Migration to delete reminders whose underlying sale is soft-deleted OR whose phone has no matching customer:
```sql
DELETE FROM crm_warranty_reminders r
USING crm_sales s
WHERE r.sale_id = s.id AND s.is_deleted = true;

DELETE FROM crm_warranty_reminders r
WHERE NOT EXISTS (
  SELECT 1 FROM crm_customers c WHERE c.phone = r.phone
);
```
Same for `crm_whatsapp_log` rows linked to deleted sales.

**2. Extend the customer cascade-delete (CrmCustomers.tsx)**

When deleting a customer, also:
- Find all `crm_sales` for that customer's `phone` (or `customer_id` if set).
- For each sale: hard-delete its `crm_warranty_reminders` (by `sale_id`), and `crm_whatsapp_log` entries (by `sale_id`).
- Hard-delete those sales (not soft-delete) so nothing orphan remains.

**3. Hook the same cleanup into Sales delete (CrmSales.tsx)**

When a sale is deleted (soft or hard), also delete its `crm_warranty_reminders` and related `crm_whatsapp_log` rows by `sale_id`. This prevents the same orphan situation in the future, regardless of the customer-delete path.

### Files touched
- New migration: cleanup orphan reminders + WA logs.
- `src/crm/pages/CrmCustomers.tsx` — extend `performCascadeDelete` with sales+warranty sweep.
- `src/crm/pages/CrmSales.tsx` — on delete/reverse, also remove tied warranty reminders + WA logs.

### Result
Warranty page will be empty of SHIVAY/vijay immediately after the migration runs, and future customer/sale deletes will not leave orphaned reminders behind.

