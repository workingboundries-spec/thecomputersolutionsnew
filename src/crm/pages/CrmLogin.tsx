import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crmSignIn } from "@/crm/lib/auth";
import { toast } from "sonner";
import { Lock, User } from "lucide-react";

export default function CrmLogin() {
  const [username, setUsername] = useState("crm");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await crmSignIn(username, password);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome back");
    navigate("/crm/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-[0.2em] text-blue-400 mb-2">The Computer Solutions</div>
          <h1 className="text-3xl font-bold text-white">CRM Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to manage your business</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6 space-y-4 shadow-2xl">
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-400 mb-1.5 block">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-400 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-md text-white text-sm font-semibold transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
