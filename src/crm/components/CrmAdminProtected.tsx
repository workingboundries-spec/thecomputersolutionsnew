import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useCrmAuth } from "@/crm/hooks/useCrmAuth";
import { supabase } from "@/integrations/supabase/client";

export default function CrmAdminProtected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCrmAuth();
  const [check, setCheck] = useState<"loading" | "yes" | "no">("loading");

  useEffect(() => {
    if (!user) return;
    supabase.from("crm_user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      setCheck((data || []).some((r: any) => r.role === "crm_admin") ? "yes" : "no");
    });
  }, [user]);

  if (loading || check === "loading") return <div className="text-slate-400">Loading…</div>;
  if (check === "no") return <Navigate to="/crm/dashboard" replace />;
  return <>{children}</>;
}
