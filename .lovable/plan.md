## Plan

1. Normalize the CRM login route
- Add `/crm/login` as an explicit route alongside `/crm` so the CRM entry path matches what users expect.
- Keep protected CRM pages redirecting to the same login route consistently.

2. Fix the CRM sign-in form behavior
- Update the CRM login screen so it accepts the same working admin account credentials instead of forcing a special frontend-only username gate.
- Either remove the hardcoded `username === "crm"` check or support both `crm` and the real email cleanly, with clearer form labels.
- Show precise error messages so it is obvious whether the issue is the route, the identifier, or the password.

3. Keep CRM access controlled by backend roles
- Preserve the existing `crm_user_roles` check for CRM authorization after login.
- Ensure the login step authenticates successfully first, then let `CrmProtected` and `CrmAdminProtected` decide what the signed-in user can access.

4. Align the UI copy
- Update the CRM login page text so it no longer implies a separate username/password system if the same admin email account is being used.
- Make the credentials guidance consistent across admin and CRM.

5. Verify the full flow
- Test these cases after the change:
  - `/admin/login` with the admin email/password
  - `/crm/login` with the same credentials
  - `/crm` direct access
  - redirect behavior for signed-out and signed-in users
  - CRM admin page access when the user has `crm_admin`

## What I found
- The code currently defines the CRM login page at `/crm`, not `/crm/login`.
- The CRM login form only accepts the literal username `crm`, then silently maps that to `admin@thecomputersolutions.in`.
- Your admin login uses a normal email/password form, which explains why the same credentials can work there but fail in the CRM flow depending on what you typed and which route you used.
- The backend auth logs already show a successful password login for `admin@thecomputersolutions.in`, so this looks like a frontend CRM login mismatch rather than a broken account.

## Technical details
- Files likely to update:
  - `src/App.tsx`
  - `src/crm/pages/CrmLogin.tsx`
  - `src/crm/lib/auth.ts`
  - possibly `src/crm/components/CrmProtected.tsx` for redirect consistency
- No database schema changes should be needed for this fix.
- Existing role-based access using `crm_user_roles` can remain in place.