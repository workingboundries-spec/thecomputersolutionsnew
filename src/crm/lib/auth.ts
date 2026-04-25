import { supabase } from "@/integrations/supabase/client";

// Default CRM/admin email — used when the user types the legacy "crm" username
export const CRM_EMAIL = "admin@thecomputersolutions.in";

export async function crmSignIn(identifier: string, password: string) {
  const id = identifier.trim();
  // Allow either the literal "crm" username (legacy), or a real email address
  let email = id;
  if (id.toLowerCase() === "crm") {
    email = CRM_EMAIL;
  } else if (!id.includes("@")) {
    return { error: "Enter your email address (or the username 'crm')" };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function crmSignOut() {
  await supabase.auth.signOut();
}
