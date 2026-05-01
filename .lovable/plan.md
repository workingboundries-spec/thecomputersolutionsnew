# Fix: New CRM Admin catalogue categories not appearing in Catalogue dropdown

## Root cause

In CRM Admin, two separate dropdown lists exist:
- **Enquiry Categories** → saved under key `enquiry_categories`
- **Catalogue Categories** → saved under key `catalogue_categories`

But the Catalogue page and Add Item drawer mistakenly read `enquiry_categories` for their Category dropdowns. So when you add "refurbished laptop" under **Catalogue Categories** in Admin, it gets saved correctly to the database — but the Catalogue form never looks at that key, so the option never appears.

`catalogue_categories` is currently written by Admin but read by nothing in the codebase.

## What to change

Two files, one-line change in each — point them at the right setting key.

### 1. `src/crm/pages/CrmCatalogue.tsx` (line 53)
Change:
```ts
const adminCategories = useAdminSetting<string[]>("enquiry_categories", []);
```
to:
```ts
const adminCategories = useAdminSetting<string[]>("catalogue_categories", []);
```

### 2. `src/crm/components/CatalogueDrawer.tsx` (the `useAdminSetting` call near the top of the component)
Same change: `"enquiry_categories"` → `"catalogue_categories"`.

## Behavior after fix

- The Category dropdown in **Add/Edit Catalogue Item** and the **filter dropdown** at the top of the Catalogue page will list whatever you've configured under **Admin → Catalogue Categories** (e.g. `laptop`, `cctv`, `refurbished laptop`, …).
- If `catalogue_categories` is empty, it falls back to the built-in defaults (`laptop, cctv, accessory, networking, printer, other`) — same as today.
- The Enquiries page continues to use `enquiry_categories` independently (unchanged).

## Notes

- No database migration needed — both settings already exist in `crm_admin_settings`.
- Existing items with categories like `"laptop"` keep working; new categories added in Admin will appear immediately after the dropdown reloads (Admin settings are cached, so a page refresh may be needed the first time).
