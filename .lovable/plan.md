
The user wants the Customers list to include people who only came in for services (not just purchases), with a label/badge showing whether they're a Purchase customer, Service customer, or Both.

Currently `crm_customers` only holds people added manually or via sales. Service customers in `crm_services` aren't auto-added.

Plan:

**1. Merge service customers into the Customers list (`CrmCustomers.tsx`)**
- After loading `crm_customers`, also fetch distinct customers from `crm_services` (group by phone).
- Merge into the displayed list, deduped by phone:
  - If phone exists in `crm_customers` → use that record, but compute a `type` flag.
  - If phone only exists in `crm_services` → create a virtual row (name, phone, whatsapp from latest service; no id from customers table).
- Compute `customerType` for each row:
  - `Purchase` → has sales (total_purchases > 0) and no service
  - `Service` → only in services table
  - `Both` → has sales AND services

**2. Add a "Type" column with colored badges**
- Purchase → blue badge
- Service → orange badge  
- Both → green badge
- Place between Name and Phone columns.

**3. Section heading / filter chips at top**
- Add filter chips: `All` | `Purchase` | `Service` | `Both` next to the search bar.
- Counts shown on each chip.

**4. Detail panel already shows Sales + Services + Enquiries, so no change needed there — it works for service-only customers too (queried by phone).**

**5. Edit/Delete behavior for service-only rows**
- Service-only rows have no `crm_customers.id`, so Edit opens the form pre-filled and saving creates a new `crm_customers` record (promoting them to a managed customer).
- Delete is hidden for service-only rows (since there's nothing to delete in `crm_customers`).

**Files to edit:** `src/crm/pages/CrmCustomers.tsx` only. No DB changes.

Keeping it minimal and non-disruptive — no changes to other modules.
