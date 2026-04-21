
Fix the enquiry leak at its source so deleted/converted customers stop appearing in the Quotation “Link to Enquiry” dropdown.

1. Confirm and correct the data model mismatch
- The dropdown in `src/crm/pages/CrmQuotations.tsx` currently loads enquiries with `is_converted = false`.
- The leaked rows for SHIVAY/vijay still exist in `crm_enquiries`, and their rows are inconsistent: `status = 'converted'` but `is_converted = false`.
- `src/crm/pages/CrmSales.tsx` currently marks an enquiry as converted by updating only `status`, not `is_converted`.
- `src/crm/pages/CrmCustomers.tsx` currently deletes customers, sales, reminders, logs, and campaign rows, but does not clean related enquiries by phone.

2. Apply a one-time backend cleanup migration
- Backfill enquiry rows so `is_converted` matches the real state:
  - set `is_converted = true` where `status = 'converted'`
  - optionally also set `status = 'converted'` where a linked `crm_sales.enquiry_id` exists
- Remove orphan enquiries that belong to deleted customers/sales and should no longer be selectable:
  - delete or mark closed/lost converted enquiries whose customer no longer exists and whose linked sale is soft-deleted/deleted
- Add a safety SQL update so future historical inconsistencies can be repaired in one pass.

3. Make sale creation keep enquiry state consistent
- In `src/crm/pages/CrmSales.tsx`, when creating a sale from an enquiry, update both:
  - `status = 'converted'`
  - `is_converted = true`
- On sale delete/reversal, decide the enquiry state based on whether any non-deleted sale still references it:
  - if no active linked sale remains, reset enquiry to a non-converted state (`status` back to `quoted` or `follow_up`, and `is_converted = false`)
- Keep this logic in the existing save/delete flow rather than introducing new UI.

4. Extend customer deletion cleanup to enquiries
- In `src/crm/pages/CrmCustomers.tsx`, after locating the customer’s sales, also locate related enquiries by:
  - matching `crm_sales.enquiry_id`
  - fallback phone match where needed
- Delete or close those enquiries during cascade delete so deleted customers cannot continue appearing in CRM selectors.

5. Harden the Quotation dropdown query
- In `src/crm/pages/CrmQuotations.tsx`, stop relying on only `is_converted = false`.
- Load only enquiries that are genuinely open/selectable, e.g. exclude:
  - `status IN ('converted', 'lost')`
  - rows linked to deleted sales
- Prefer a combined filter so one stale flag cannot leak records into the dropdown again.

6. Keep Enquiries page behavior consistent
- In `src/crm/pages/CrmEnquiries.tsx`, preserve the existing “Show Converted” behavior, but make the derived converted state consistent with the repaired data.
- Ensure rows with active linked sales always behave as converted, even if a stale flag slips in.

7. Verify the exact failing case after implementation
- SHIVAY and vijay should no longer appear in the Quotation “Link to Enquiry” dropdown.
- Deleted customers should not leave selectable enquiries behind.
- New sale-from-enquiry flows should mark enquiries converted immediately.
- Deleting a sale should only reopen its enquiry if no other active sale still uses it.

Technical details
- Files to update:
  - `src/crm/pages/CrmSales.tsx`
  - `src/crm/pages/CrmCustomers.tsx`
  - `src/crm/pages/CrmQuotations.tsx`
  - `src/crm/pages/CrmEnquiries.tsx`
  - new SQL migration in `supabase/migrations/`
- No new tables are needed.
- No page outside the affected enquiry/sales/customer/quotation flow needs to be touched.
- This is primarily a data consistency fix plus tighter query filtering, not a UI redesign.
