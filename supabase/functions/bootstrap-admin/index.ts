// One-time admin bootstrap. Creates the admin user + grants crm_admin role.
// Safe to call repeatedly: idempotent (skips if user already exists).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "admin@thecomputersolutions.in";
const ADMIN_PASSWORD = "Admin@2026!ChangeMe";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1) Check if user already exists; if yes, RESET password to known value
  const { data: list } = await admin.auth.admin.listUsers();
  let user = list?.users.find((u) => u.email === ADMIN_EMAIL);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    user = data.user!;
  } else {
    // Reset password + ensure email confirmed
    await admin.auth.admin.updateUserById(user.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
  }

  // 2) Grant crm_admin role (idempotent)
  await admin.from("crm_user_roles").upsert(
    { user_id: user.id, role: "crm_admin" },
    { onConflict: "user_id,role", ignoreDuplicates: true },
  );

  return new Response(
    JSON.stringify({
      ok: true,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      user_id: user.id,
      note: "Login at /admin/login or /crm/login then change your password.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
