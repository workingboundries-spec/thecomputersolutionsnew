import { supabase } from "@/integrations/supabase/client";

// CRM uses the same shop owner account
export const CRM_EMAIL = "admin@thecomputersolutions.in";

export async function crmSignIn(username: string, password: string) {
  // Fixed username "crm" maps to a real Supabase auth user
  if (username.trim().toLowerCase() !== "crm") {
    return { error: "Invalid username" };
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: CRM_EMAIL,
    password,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function crmSignOut() {
  await supabase.auth.signOut();
}
