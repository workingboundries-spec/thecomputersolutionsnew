import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, ShoppingCart, MessageSquare, Package, BarChart3, Wrench, Bell, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { crmSignOut } from "@/crm/lib/auth";
import { toast } from "sonner";

const links = [
  { to: "/crm/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/crm/enquiries", label: "Enquiries", icon: MessageSquare },
  { to: "/crm/sales", label: "Sales", icon: ShoppingCart },
  { to: "/crm/catalogue", label: "Catalogue", icon: Package },
  { to: "/crm/stock", label: "Stock Report", icon: BarChart3 },
  { to: "/crm/services", label: "Service Center", icon: Wrench },
  { to: "/crm/warranty", label: "Warranty", icon: Bell },
  { to: "/crm/customers", label: "Customers", icon: Users },
  { to: "/crm/settings", label: "Settings", icon: Settings },
];

export default function CrmLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await crmSignOut();
    toast.success("Logged out");
    navigate("/crm");
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-slate-800 rounded"
        aria-label="Toggle sidebar"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform`}
      >
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-500">The Computer Solutions</div>
          <div className="text-lg font-bold text-white mt-0.5">CRM</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-blue-600/20 text-blue-300 border-l-2 border-blue-400" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`
              }
            >
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="m-3 flex items-center gap-2 justify-center px-3 py-2 rounded bg-slate-800 hover:bg-red-600/20 hover:text-red-300 text-sm text-slate-300 transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-0 p-4 lg:p-8 overflow-x-hidden pt-14 lg:pt-8">
        <Outlet />
      </main>
    </div>
  );
}
