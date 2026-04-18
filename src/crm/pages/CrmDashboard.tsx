import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate, todayISO, addDays, waLink } from "@/crm/lib/format";
import { Link } from "react-router-dom";
import { ShoppingCart, MessageSquare, Wrench, Bell, AlertTriangle, TrendingUp, IndianRupee, Package, MessageCircle, Cake } from "lucide-react";

function StatCard({ icon: Icon, label, value, color, to }: any) {
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

function Avatar({ name, photo, size = 32 }: { name: string; photo?: string | null; size?: number }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const colors = ["bg-blue-600", "bg-green-600", "bg-purple-600", "bg-pink-600", "bg-orange-600", "bg-teal-600"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  if (photo) {
    return <img src={photo} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover border border-slate-700" />;
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.45 }} className={`${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {initial}
    </div>
  );
}

export default function CrmDashboard() {
  const [stats, setStats] = useState({
    todayEnq: 0, totalPending: 0, convertedMonth: 0,
    todaySales: 0, monthRevenue: 0, outstanding: 0,
    servicesPending: 0, warrantiesMonth: 0, lowStock: 0,
  });
  const [recentEnq, setRecentEnq] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = todayISO();
      const monthStart = new Date(); monthStart.setDate(1);
      const monthStartISO = monthStart.toISOString().slice(0, 10);
      const monthEnd = new Date(monthStart); monthEnd.setMonth(monthEnd.getMonth() + 1);
      const monthEndISO = monthEnd.toISOString().slice(0, 10);
      const weekAhead = addDays(today, 7);

      const [
        todayEnqRes, pendingRes, convRes,
        todaySalesRes, monthSalesRes, outstandingRes,
        svcRes, warrRes, lowRes,
        recentEnqRes, recentSalesRes,
        remindersRes, customersRes,
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
        supabase.from("crm_warranty_reminders").select("*").eq("status", "pending").lte("scheduled_date", weekAhead).order("scheduled_date", { ascending: true }),
        supabase.from("crm_customers").select("id, name, phone, whatsapp, dob, photo_url").not("dob", "is", null),
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
      setReminders(remindersRes.data || []);
      setCustomers(customersRes.data || []);
      setLoading(false);
    })();
  }, []);

  const today = todayISO();

  const groupedReminders = useMemo(() => {
    const overdue: any[] = [], todayList: any[] = [], week: any[] = [];
    reminders.forEach(r => {
      if (r.scheduled_date < today) overdue.push(r);
      else if (r.scheduled_date === today) todayList.push(r);
      else week.push(r);
    });
    return { overdue, today: todayList, week };
  }, [reminders, today]);

  const upcomingBirthdays = useMemo(() => {
    const t = new Date(today);
    return customers
      .map((c: any) => {
        if (!c.dob) return null;
        const dob = new Date(c.dob);
        const next = new Date(t.getFullYear(), dob.getMonth(), dob.getDate());
        if (next < t) next.setFullYear(t.getFullYear() + 1);
        const days = Math.round((next.getTime() - t.getTime()) / 86400000);
        return { ...c, nextBirthday: next.toISOString().slice(0, 10), days };
      })
      .filter((c: any) => c && c.days <= 30)
      .sort((a: any, b: any) => a.days - b.days);
  }, [customers, today]);

  if (loading) return <div className="text-slate-400">Loading dashboard…</div>;

  const sendReminderWA = (r: any) => {
    const msg = r.whatsapp_message || `Hi ${r.customer_name}, this is a friendly reminder regarding your ${r.item_name || "purchase"}. — The Computer Solutions`;
    window.open(waLink(r.whatsapp || r.phone, msg), "_blank");
  };
  const sendBirthdayWA = (c: any) => {
    const msg = `Happy Birthday ${c.name}! 🎂 Wishing you a wonderful year ahead! - The Computer Solutions Team`;
    window.open(waLink(c.whatsapp || c.phone, msg), "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">Overview of today and this month</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
        <StatCard icon={MessageSquare} label="Today's Enquiries" value={stats.todayEnq} color="blue" to="/crm/enquiries" />
        <StatCard icon={TrendingUp} label="Pending Enquiries" value={stats.totalPending} color="yellow" to="/crm/enquiries" />
        <StatCard icon={MessageSquare} label="Converted (Month)" value={stats.convertedMonth} color="green" to="/crm/enquiries" />
        <StatCard icon={IndianRupee} label="Today's Sales" value={formatINR(stats.todaySales)} color="green" to="/crm/sales" />
        <StatCard icon={ShoppingCart} label="Monthly Revenue" value={formatINR(stats.monthRevenue)} color="blue" to="/crm/sales" />
        <StatCard icon={IndianRupee} label="Outstanding" value={formatINR(stats.outstanding)} color="red" to="/crm/sales" />
        <StatCard icon={Wrench} label="Services Pending" value={stats.servicesPending} color="orange" to="/crm/services" />
        <StatCard icon={Bell} label="Warranties (Month)" value={stats.warrantiesMonth} color="purple" to="/crm/warranty" />
        <StatCard icon={AlertTriangle} label="Low Stock Items" value={stats.lowStock} color="red" to="/crm/stock" />
      </div>

      {/* SECTION A: Today's Reminders & Due This Week */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2"><Bell size={16} className="text-yellow-400" /> Today's Reminders & Due This Week</h3>
          <Link to="/crm/warranty" className="text-xs text-blue-400 hover:underline">Open Reminders →</Link>
        </div>

        {reminders.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-6">Nothing due 🎉</div>
        ) : (
          <div className="space-y-4">
            <ReminderGroup title="Overdue" color="red" items={groupedReminders.overdue} onSend={sendReminderWA} />
            <ReminderGroup title="Today" color="orange" items={groupedReminders.today} onSend={sendReminderWA} />
            <ReminderGroup title="This Week" color="blue" items={groupedReminders.week} onSend={sendReminderWA} />
          </div>
        )}
      </div>

      {/* SECTION B: Upcoming Birthdays */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2"><Cake size={16} className="text-pink-400" /> Upcoming Birthdays (next 30 days)</h3>
          <Link to="/crm/customers" className="text-xs text-blue-400 hover:underline">All Customers →</Link>
        </div>
        {upcomingBirthdays.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-6">Nothing due 🎉</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingBirthdays.map((c: any) => (
              <div key={c.id} className="bg-slate-950/60 border border-slate-800 rounded p-3 flex items-center gap-3">
                <Avatar name={c.name} photo={c.photo_url} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{c.name}</div>
                  <div className="text-xs text-slate-400">{formatDate(c.dob)} · <span className={c.days === 0 ? "text-pink-300" : "text-slate-400"}>{c.days === 0 ? "Today!" : `In ${c.days}d`}</span></div>
                </div>
                <button onClick={() => sendBirthdayWA(c)} title="WhatsApp wish" className="p-2 rounded bg-green-600/20 hover:bg-green-600/30 text-green-300">
                  <MessageCircle size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
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

function ReminderGroup({ title, color, items, onSend }: any) {
  if (items.length === 0) return null;
  const colorMap: Record<string, string> = {
    red: "text-red-300 bg-red-500/15 border-red-500/30",
    orange: "text-orange-300 bg-orange-500/15 border-orange-500/30",
    blue: "text-blue-300 bg-blue-500/15 border-blue-500/30",
  };
  return (
    <div>
      <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${colorMap[color]} mb-2`}>{title} ({items.length})</div>
      <div className="space-y-1">
        {items.map((r: any) => (
          <div key={r.id} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-slate-800/40">
            <span className="text-white flex-1 truncate">{r.customer_name}</span>
            <span className="text-slate-400 text-xs hidden sm:inline truncate max-w-[120px]">{r.item_name || "—"}</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{r.reminder_type}</span>
            <span className="text-xs text-slate-500">{formatDate(r.scheduled_date)}</span>
            <button onClick={() => onSend(r)} title="WhatsApp" className="p-1.5 rounded bg-green-600/20 hover:bg-green-600/30 text-green-300">
              <MessageCircle size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
