
User says: added "Megha" as a customer, marked an enquiry as "converted" (likely via the status dropdown in the enquiry edit form), but it didn't appear in Sales.

Root cause: The "converted" status is just a text field. Setting status='converted' manually does NOT create a sale row. A sale is only created when the user clicks the green arrow "Convert to Sale" button (which opens the Sales form pre-filled, then saving inserts into `crm_sales`).

So this is a UX/expectation mismatch + a missing safeguard.

Fix plan:

1. **In `CrmEnquiries.tsx`** — when the user manually changes status to "converted" in the edit form (without going through the Convert button), block the save and show a toast: "Use the green Convert arrow to create a sale. Status will auto-update after the sale is saved." Then keep status as previous value.

2. **Make the Convert flow more discoverable**: rename the green arrow tooltip from "Convert to Sale" to "Convert to Sale (creates sale entry)" and add a small label/button "Convert →" instead of just an icon arrow on each row.

3. **Add a one-time backfill helper** for already-marked-converted enquiries that have no linked sale: show an inline "⚠ No sale linked — Create sale" link on rows where `status='converted'` but no matching `crm_sales.enquiry_id` exists. Clicking it runs the same convertToSale flow.

4. Verify nothing else regresses.

Files to edit:
- `src/crm/pages/CrmEnquiries.tsx` only

No DB changes needed.
