import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate } from "@/crm/lib/format";
import { Link } from "react-router-dom";
import { ShoppingCart, MessageSquare, Wrench, Bell, AlertTriangle, TrendingUp, IndianRupee, Package } from "lucide-react";

function Card({ icon: Icon, label, value, color, to }: any) {
  const inner = (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-${color}-600 transition-colors`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-white mt-1">{value}</div>
        </div>
        <div className={`p-2 rounded bg-${color}-600/15 text-${color}-400`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

const STATUS_BADGE: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-300",
  follow_up: "bg-yellow-500/15 text-yellow-300",
  converted: "bg-green-500/15 text-green-300",
  lost: "bg-red-500/15 text-red-300",
};

export default function CrmDashboard() {
  const [stats, setStats] = useState({
    todayEnq: 0, totalPending: 0, convertedMonth: 0,
    todaySales: 0, monthRevenue: 0, outstanding: 0,
    servicesPending: 0, warrantiesMonth: 0, lowStock: 0,
  });
  const [recentEnq, setRecentEnq] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = new Date(); monthStart.setDate(1);
      const monthStartISO = monthStart.toISOString().slice(0, 10);
      const monthEnd = new Date(monthStart); monthEnd.setMonth(monthEnd.getMonth() + 1);
      const monthEndISO = monthEnd.toISOString().slice(0, 10);

      const [
        todayEnqRes, pendingRes, convRes,
        todaySalesRes, monthSalesRes, outstandingRes,
        svcRes, warrRes, lowRes,
        recentEnqRes, recentSalesRes,
      ] = await Promise.all([
        supabase.from("crm_enquiries").select("id", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("crm_enquiries").select("id", { count: "exact", head: true }).in("status", ["new", "follow_up"]),
        supabase.from("crm_enquiries").select("id", { count: "exact", head: true }).eq("status", "converted").gte("created_at", monthStartISO),
        supabase.from("crm_sales").select("total_amount").gte("sale_date", today),
        supabase.from("crm_sales").select("total_amount").gte("sale_date", monthStartISO),
        supabase.from("crm_sales").select("total_amount").in("payment_status", ["partial", "pending"]),
        supabase.from("crm_services").select("id", { count: "exact", head: true }).in("status", ["received", "diagnosing", "repairing", "ready"]),
        supabase.from("crm_warranty_reminders").select("id", { count: "exact", head: true }).gte("scheduled_date", monthStartISO).lt("scheduled_date", monthEndISO),
        supabase.from("crm_catalogue").select("id", { count: "exact", head: true }).lt("stock_qty", 3).eq("is_active", true),
        supabase.from("crm_enquiries").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("crm_sales").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      setStats({
        todayEnq: todayEnqRes.count || 0,
        totalPending: pendingRes.count || 0,
        convertedMonth: convRes.count || 0,
        todaySales: (todaySalesRes.data || []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0),
        monthRevenue: (monthSalesRes.data || []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0),
        outstanding: (outstandingRes.data || []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0),
        servicesPending: svcRes.count || 0,
        warrantiesMonth: warrRes.count || 0,
        lowStock: lowRes.count || 0,
      });
      setRecentEnq(recentEnqRes.data || []);
      setRecentSales(recentSalesRes.data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-slate-400">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">Overview of today and this month</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
        <Card icon={MessageSquare} label="Today's Enquiries" value={stats.todayEnq} color="blue" to="/crm/enquiries" />
        <Card icon={TrendingUp} label="Pending Enquiries" value={stats.totalPending} color="yellow" to="/crm/enquiries" />
        <Card icon={MessageSquare} label="Converted (Month)" value={stats.convertedMonth} color="green" to="/crm/enquiries" />
        <Card icon={IndianRupee} label="Today's Sales" value={formatINR(stats.todaySales)} color="green" to="/crm/sales" />
        <Card icon={ShoppingCart} label="Monthly Revenue" value={formatINR(stats.monthRevenue)} color="blue" to="/crm/sales" />
        <Card icon={IndianRupee} label="Outstanding" value={formatINR(stats.outstanding)} color="red" to="/crm/sales" />
        <Card icon={Wrench} label="Services Pending" value={stats.servicesPending} color="orange" to="/crm/services" />
        <Card icon={Bell} label="Warranties (Month)" value={stats.warrantiesMonth} color="purple" to="/crm/warranty" />
        <Card icon={AlertTriangle} label="Low Stock Items" value={stats.lowStock} color="red" to="/crm/stock" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Recent Enquiries</h3>
            <Link to="/crm/enquiries" className="text-xs text-blue-400 hover:underline">View all</Link>
          </div>
          {recentEnq.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-6 flex flex-col items-center gap-2">
              <Package size={24} className="opacity-50" />
              No enquiries yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentEnq.map((e) => (
                  <tr key={e.id} className="border-b border-slate-800 last:border-0">
                    <td className="py-2 text-white">{e.customer_name}</td>
                    <td className="py-2 text-slate-400 text-xs">{e.item_name || e.product_category}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[e.status] || "bg-slate-700 text-slate-300"}`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Recent Sales</h3>
            <Link to="/crm/sales" className="text-xs text-blue-400 hover:underline">View all</Link>
          </div>
          {recentSales.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-6 flex flex-col items-center gap-2">
              <ShoppingCart size={24} className="opacity-50" />
              No sales yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800 last:border-0">
                    <td className="py-2 text-white">{s.customer_name}</td>
                    <td className="py-2 text-slate-400 text-xs">{formatDate(s.sale_date)}</td>
                    <td className="py-2 text-right text-green-400 font-medium">{formatINR(s.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
