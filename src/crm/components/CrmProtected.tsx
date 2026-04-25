import { Navigate } from "react-router-dom";
import { useCrmAuth } from "@/crm/hooks/useCrmAuth";

export default function CrmProtected({ children }: { children: React.ReactNode }) {
  const { loading, user } = useCrmAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">Loading…</div>;
  if (!user) return <Navigate to="/crm/login" replace />;
  return <>{children}</>;
}
