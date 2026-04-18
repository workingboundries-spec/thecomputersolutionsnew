import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate, todayISO, addDays, waLink } from "@/crm/lib/format";
import { Link } from "react-router-dom";
import {
  ShoppingCart, MessageSquare, Wrench, Bell, AlertTriangle, IndianRupee,
  MessageCircle, Cake, Package, ClipboardList, FileClock,
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-300",
  follow_up: "bg-yellow-500/15 text-yellow-300",
  converted: "bg-green-500/15 text-green-300",
  lost: "bg-red-500/15 text-red-300",
  quoted: "bg-purple-500/15 text-purple-300",
};

function StatCard({ icon: Icon, label, value, color = "blue", to, sub }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/15 text-blue-300",
    green: "bg-green-500/15 text-green-300",
    red: "bg-red-500/15 text-red-300",
    yellow: "bg-yellow-500/15 text-yellow-300",
    orange: "bg-orange-500/15 text-orange-300",
    purple: "bg-purple-500/15 text-purple-300",
    pink: "bg-pink-500/15 text-pink-300",
  };
  const inner = (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-4 transition-colors h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-white mt-1 truncate">{value}</div>
          {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
        </div>
        <div className={`p-2 rounded ${colorMap[color]} shrink-0`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : inner;
}

function AlertCard({ icon: Icon, label, count, color, to }: any) {
  const colorMap: Record<string, string> = {
    red: "border-red-500/40 bg-red-500/5 text-red-300",
    orange: "border-orange-500/40 bg-orange-500/5 text-orange-300",
    yellow: "border-yellow-500/40 bg-yellow-500/5 text-yellow-300",
    blue: "border-blue-500/40 bg-blue-500/5 text-blue-300",
  };
  return (
    <Link to={to} className={`block border rounded-lg p-4 transition hover:scale-[1.01] ${colorMap[color]}`}>
      <div className="flex items-center gap-3">
        <Icon size={22} />
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
          <div className="text-2xl font-bold mt-0.5">{count}</div>
        </div>
      </div>
    </Link>
  );
}

export default function CrmDashboard() {
  const [s, setS] = useState({
    todaySales: 0, todayEnq: 0, todayServices: 0, todayReminders: 0,
    monthRevenue: 0, monthSalesCount: 0, monthConverted: 0, monthWarranties: 0,
    alertReminderToday: 0, alertBirthdayWeek: 0, alertLowStock: 0, alertPending: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentEnq, setRecentEnq] = useState<any[]>([]);
  const [todayReminderList, setTodayReminderList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = todayISO();
      const monthStart = today.slice(0, 7) + "-01";
      const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1); nextMonth.setDate(1);
      const monthEndISO = nextMonth.toISOString().slice(0, 10);
      const weekAhead = addDays(today, 7);

      const [
        todaySalesRes, todayEnqRes, todaySvcRes, todayReminderRes,
        monthSalesRes, monthConvRes, monthWarrRes,
        lowStockRes, pendingFormRes, customersBdayRes, todayReminderListRes,
        recentSalesRes, recentEnqRes,
      ] = await Promise.all([
        supabase.from("crm_sales").select("total_amount").eq("is_deleted", false).eq("sale_date", today),
        supabase.from("crm_enquiries").select("id", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("crm_services").select("id", { count: "exact", head: true }).eq("received_date", today),
        supabase.from("crm_warranty_reminders").select("id", { count: "exact", head: true }).eq("scheduled_date", today).eq("message_sent", false),
        supabase.from("crm_sales").select("total_amount").eq("is_deleted", false).gte("sale_date", monthStart),
        supabase.from("crm_enquiries").select("id", { count: "exact", head: true }).eq("is_converted", true).gte("created_at", monthStart),
        supabase.from("crm_warranty_reminders").select("id", { count: "exact", head: true }).gte("scheduled_date", monthStart).lt("scheduled_date", monthEndISO),
        supabase.from("crm_catalogue").select("id", { count: "exact", head: true }).lt("stock_qty", 3).eq("is_active", true),
        supabase.from("crm_sales").select("id", { count: "exact", head: true }).eq("payment_status", "pending_review").eq("is_deleted", false),
        supabase.from("crm_customers").select("id, name, dob").not("dob", "is", null),
        supabase.from("crm_warranty_reminders").select("*").eq("scheduled_date", today).eq("message_sent", false).order("created_at", { ascending: false }),
        supabase.from("crm_sales").select("id, customer_name, item_name, total_amount, sale_date").eq("is_deleted", false).order("created_at", { ascending: false }).limit(5),
        supabase.from("crm_enquiries").select("id, customer_name, item_name, product_category, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const todaySales = (todaySalesRes.data || []).reduce((a: number, r: any) => a + Number(r.total_amount || 0), 0);
      const monthRevenue = (monthSalesRes.data || []).reduce((a: number, r: any) => a + Number(r.total_amount || 0), 0);

      // Birthdays this week (next 7 days, year-agnostic)
      const t = new Date(today);
      const bdayWeek = (customersBdayRes.data || []).filter((c: any) => {
        if (!c.dob) return false;
        const dob = new Date(c.dob);
        const next = new Date(t.getFullYear(), dob.getMonth(), dob.getDate());
        if (next < t) next.setFullYear(t.getFullYear() + 1);
        const days = Math.round((next.getTime() - t.getTime()) / 86400000);
        return days >= 0 && days <= 7;
      }).length;

      setS({
        todaySales, todayEnq: todayEnqRes.count || 0, todayServices: todaySvcRes.count || 0,
        todayReminders: todayReminderRes.count || 0,
        monthRevenue, monthSalesCount: monthSalesRes.data?.length || 0,
        monthConverted: monthConvRes.count || 0, monthWarranties: monthWarrRes.count || 0,
        alertReminderToday: todayReminderRes.count || 0,
        alertBirthdayWeek: bdayWeek,
        alertLowStock: lowStockRes.count || 0,
        alertPending: pendingFormRes.count || 0,
      });
      setRecentSales(recentSalesRes.data || []);
      setRecentEnq(recentEnqRes.data || []);
      setTodayReminderList(todayReminderListRes.data || []);
      setLoading(false);
    })();
  }, []);

  const sendReminderWA = (r: any) => {
    const msg = r.whatsapp_message || `Hi ${r.customer_name}, this is a friendly reminder regarding your ${r.item_name || "purchase"}. — The Computer Solutions`;
    window.open(waLink(r.whatsapp || r.phone, msg), "_blank");
  };

  if (loading) return <div className="text-slate-400">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">Owner snapshot — today and this month</p>
      </div>

      {/* ROW 1 — Today's Snapshot */}
      <section>
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Today</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={IndianRupee} label="Today's Sales" value={formatINR(s.todaySales)} color="green" to="/crm/sales" />
          <StatCard icon={MessageSquare} label="Today's Enquiries" value={s.todayEnq} color="blue" to="/crm/enquiries" />
          <StatCard icon={Wrench} label="Today's Service Jobs" value={s.todayServices} color="orange" to="/crm/services" />
          <StatCard icon={Bell} label="Pending Reminders Today" value={s.todayReminders} color="purple" to="/crm/warranty" />
        </div>
      </section>

      {/* ROW 2 — Monthly Summary */}
      <section>
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">This Month</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={IndianRupee} label="Monthly Revenue" value={formatINR(s.monthRevenue)} color="green" to="/crm/sales" />
          <StatCard icon={ShoppingCart} label="Sales Count" value={s.monthSalesCount} color="blue" to="/crm/sales" />
          <StatCard icon={MessageSquare} label="Converted Enquiries" value={s.monthConverted} color="purple" to="/crm/enquiries" />
          <StatCard icon={Bell} label="Warranties Expiring" value={s.monthWarranties} color="orange" to="/crm/warranty" />
        </div>
      </section>

      {/* ROW 3 — Alerts */}
      <section>
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Alerts (action needed)</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AlertCard icon={Bell} label="Reminders Due Today" count={s.alertReminderToday} color="red" to="/crm/warranty" />
          <AlertCard icon={Cake} label="Birthdays This Week" count={s.alertBirthdayWeek} color="orange" to="/crm/warranty" />
          <AlertCard icon={AlertTriangle} label="Low Stock Items" count={s.alertLowStock} color="yellow" to="/crm/stock" />
          <AlertCard icon={ClipboardList} label="Pending Form Submissions" count={s.alertPending} color="blue" to="/crm/sales" />
        </div>
      </section>

      {/* ROW 4 — Last 5 Sales / Last 5 Enquiries */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Last 5 Sales</h3>
            <Link to="/crm/sales" className="text-xs text-blue-400 hover:underline">View all →</Link>
          </div>
          {recentSales.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-6 flex flex-col items-center gap-2">
              <ShoppingCart size={24} className="opacity-40" /> No sales yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentSales.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 last:border-0">
                    <td className="py-2 text-white truncate max-w-[120px]">{r.customer_name}</td>
                    <td className="py-2 text-slate-400 text-xs truncate max-w-[140px]">{r.item_name}</td>
                    <td className="py-2 text-slate-500 text-xs">{formatDate(r.sale_date)}</td>
                    <td className="py-2 text-right text-green-400 font-medium">{formatINR(r.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Last 5 Enquiries</h3>
            <Link to="/crm/enquiries" className="text-xs text-blue-400 hover:underline">View all →</Link>
          </div>
          {recentEnq.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-6 flex flex-col items-center gap-2">
              <Package size={24} className="opacity-40" /> No enquiries yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentEnq.map((e) => (
                  <tr key={e.id} className="border-b border-slate-800 last:border-0">
                    <td className="py-2 text-white truncate max-w-[120px]">{e.customer_name}</td>
                    <td className="py-2 text-slate-400 text-xs truncate max-w-[140px]">{e.item_name || e.product_category}</td>
                    <td className="py-2 text-slate-500 text-xs">{formatDate(e.created_at)}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[e.status] || "bg-slate-700 text-slate-300"}`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ROW 5 — Today's Reminders Quick View */}
      <section className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <FileClock size={16} className="text-yellow-400" /> Today's Reminders
          </h3>
          <Link to="/crm/warranty" className="text-xs text-blue-400 hover:underline">Open Reminders →</Link>
        </div>
        {todayReminderList.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-6">Nothing due today 🎉</div>
        ) : (
          <div className="space-y-1.5">
            {todayReminderList.map((r) => (
              <div key={r.id} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-slate-800/40">
                <span className="text-white flex-1 truncate">{r.customer_name}</span>
                <span className="text-slate-400 text-xs hidden sm:inline truncate max-w-[160px]">{r.item_name || "—"}</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{r.reminder_type}</span>
                <button onClick={() => sendReminderWA(r)} title="WhatsApp" className="p-1.5 rounded bg-green-600/20 hover:bg-green-600/30 text-green-300">
                  <MessageCircle size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
