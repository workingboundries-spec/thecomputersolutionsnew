import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/crm/lib/format";
import { customerType, daysUntilNextOccurrence, ageFromDob, yearsCompleted } from "@/crm/lib/customerHelpers";
import { exportExcel, exportPDF, printReport, type Column } from "@/crm/lib/exportReport";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { FileSpreadsheet, FileText, Printer, TrendingUp, PieChart as PieIcon, Briefcase, MessageCircle, Cake, Heart, Trophy, Bell, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type ReportKey = "growth" | "source" | "occupation" | "engagement" | "birthday" | "anniversary" | "top" | "reminders";

const REPORTS: { key: ReportKey; label: string; icon: any; color: string }[] = [
  { key: "growth", label: "Growth Report", icon: TrendingUp, color: "text-blue-400" },
  { key: "source", label: "Source / Acquisition", icon: PieIcon, color: "text-purple-400" },
  { key: "occupation", label: "Occupation Report", icon: Briefcase, color: "text-amber-400" },
  { key: "engagement", label: "WhatsApp Engagement", icon: MessageCircle, color: "text-green-400" },
  { key: "birthday", label: "Birthday Report", icon: Cake, color: "text-pink-400" },
  { key: "anniversary", label: "Anniversary Report", icon: Heart, color: "text-rose-400" },
  { key: "top", label: "Top Customer Report", icon: Trophy, color: "text-yellow-400" },
  { key: "reminders", label: "Reminder & Wishes History", icon: Bell, color: "text-orange-400" },
];

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#84cc16", "#a855f7", "#f97316"];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysAgoISO(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

function ExportButtons({ title, columns, rows, subtitle }: { title: string; columns: Column[]; rows: any[]; subtitle?: string }) {
  return (
    <div className="flex gap-2">
      <button onClick={() => exportExcel(title, columns, rows)} className="px-3 py-1.5 text-xs rounded bg-emerald-600/20 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-600/30 inline-flex items-center gap-1.5"><FileSpreadsheet size={14} /> Excel</button>
      <button onClick={() => exportPDF(title, columns, rows, subtitle)} className="px-3 py-1.5 text-xs rounded bg-red-600/20 text-red-300 border border-red-700/40 hover:bg-red-600/30 inline-flex items-center gap-1.5"><FileText size={14} /> PDF</button>
      <button onClick={() => printReport(title, columns, rows, subtitle)} className="px-3 py-1.5 text-xs rounded bg-slate-700/60 text-slate-200 border border-slate-600 hover:bg-slate-700 inline-flex items-center gap-1.5"><Printer size={14} /> Print</button>
    </div>
  );
}

function Card({ children, className = "" }: any) {
  return <div className={`bg-slate-900 border border-slate-800 rounded-lg p-4 ${className}`}>{children}</div>;
}

function DataTable({ columns, rows, highlightFn }: { columns: Column[]; rows: any[]; highlightFn?: (r: any) => boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/50">
            {columns.map((c) => (<th key={c.key} className="text-left px-3 py-2 text-xs font-semibold text-slate-300 uppercase tracking-wide">{c.header}</th>))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-8 text-slate-500">No data</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className={`border-b border-slate-800/60 ${highlightFn?.(r) ? "bg-amber-500/10" : "hover:bg-slate-800/30"}`}>
              {columns.map((c) => (<td key={c.key} className="px-3 py-2 text-slate-200">{r[c.key] ?? "—"}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CrmCustomerReports() {
  const [active, setActive] = useState<ReportKey>("growth");
  const [from, setFrom] = useState(daysAgoISO(90));
  const [to, setTo] = useState(todayISO());
  const [typeFilter, setTypeFilter] = useState<"all" | "New" | "Repeat">("all");
  const [customers, setCustomers] = useState<any[]>([]);
  const [waLogs, setWaLogs] = useState<any[]>([]);
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [c, w, e, r] = await Promise.all([
        supabase.from("crm_customers").select("*"),
        supabase.from("crm_whatsapp_log").select("*"),
        supabase.from("customer_event_logs").select("*"),
        supabase.from("reminders_queue").select("*"),
      ]);
      if (c.error) toast.error(c.error.message);
      setCustomers(c.data || []);
      setWaLogs(w.data || []);
      setEventLogs(e.data || []);
      setReminders(r.data || []);
      setLoading(false);
    })();
  }, []);

  const enriched = useMemo(() => customers.map((c) => ({
    ...c,
    _type: customerType(c.total_purchases),
    _bdayIn: daysUntilNextOccurrence(c.dob),
    _annivIn: daysUntilNextOccurrence(c.anniversary_date),
    _waCount: waLogs.filter((w) => w.customer_id === c.id || w.phone === c.phone).length,
  })), [customers, waLogs]);

  const inDateRange = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    return dateStr >= from && dateStr <= to;
  };

  // Filter base customers by date range (created_at) and type
  const baseFiltered = useMemo(() => enriched.filter((c) => {
    const created = (c.created_at || "").slice(0, 10);
    if (created < from || created > to) return false;
    if (typeFilter !== "all" && c._type !== typeFilter) return false;
    return true;
  }), [enriched, from, to, typeFilter]);

  const subtitle = `${from} to ${to}${typeFilter !== "all" ? ` • ${typeFilter}` : ""}`;

  // ============ Report 1: Growth ============
  const growthData = useMemo(() => {
    const byMonth: Record<string, { month: string; New: number; Repeat: number }> = {};
    baseFiltered.forEach((c) => {
      const m = (c.created_at || "").slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { month: m, New: 0, Repeat: 0 };
      byMonth[m][c._type] += 1;
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [baseFiltered]);

  const growthRows = baseFiltered.map((c) => ({
    name: c.name, type: c._type, added: (c.created_at || "").slice(0, 10), source: c.source_mode || "—", city: c.city || "—",
  }));
  const growthCols: Column[] = [
    { header: "Name", key: "name" }, { header: "Type", key: "type" },
    { header: "Added", key: "added" }, { header: "Source", key: "source" }, { header: "City", key: "city" },
  ];

  // ============ Report 2: Source ============
  const sourceData = useMemo(() => {
    const m: Record<string, number> = {};
    baseFiltered.forEach((c) => { const k = c.source_mode || "Unknown"; m[k] = (m[k] || 0) + 1; });
    const total = baseFiltered.length || 1;
    return Object.entries(m).map(([name, value]) => ({ name, value, pct: ((value / total) * 100).toFixed(1) + "%" }));
  }, [baseFiltered]);
  const sourceCols: Column[] = [{ header: "Source", key: "name" }, { header: "Count", key: "value" }, { header: "Share", key: "pct" }];

  // ============ Report 3: Occupation ============
  const occData = useMemo(() => {
    const m: Record<string, number> = {};
    baseFiltered.forEach((c) => { const k = c.occupation || "Unknown"; m[k] = (m[k] || 0) + 1; });
    const total = baseFiltered.length || 1;
    return Object.entries(m).map(([name, value]) => ({ name, value, pct: ((value / total) * 100).toFixed(1) + "%" }));
  }, [baseFiltered]);
  const occCols: Column[] = [{ header: "Occupation", key: "name" }, { header: "Count", key: "value" }, { header: "Share", key: "pct" }];

  // ============ Report 4: Engagement ============
  const engagementRows = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; count: number; last: string; hint: string; type: string }>();
    waLogs.forEach((w) => {
      const ts = (w.sent_at || w.created_at || "").slice(0, 10);
      if (ts && (ts < from || ts > to)) return;
      const cust = customers.find((c) => c.id === w.customer_id || c.phone === w.phone);
      if (!cust) return;
      if (typeFilter !== "all" && customerType(cust.total_purchases) !== typeFilter) return;
      const key = cust.id;
      const existing = map.get(key);
      if (!existing || ts > existing.last) {
        map.set(key, {
          name: cust.name, phone: cust.phone,
          count: (existing?.count || 0) + 1,
          last: ts || existing?.last || "",
          hint: (w.message_hint || w.message_text || "").slice(0, 80),
          type: customerType(cust.total_purchases),
        });
      } else {
        existing.count += 1;
      }
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [waLogs, customers, from, to, typeFilter]);
  const engagementCols: Column[] = [
    { header: "Customer", key: "name" }, { header: "Phone", key: "phone" }, { header: "Type", key: "type" },
    { header: "Messages", key: "count" }, { header: "Last Sent", key: "last" }, { header: "Last Hint", key: "hint", width: 40 },
  ];

  // ============ Report 5: Birthday ============
  const birthdayRows = useMemo(() => {
    return enriched
      .filter((c) => c.dob && c._bdayIn !== null && c._bdayIn <= 365)
      .sort((a, b) => (a._bdayIn ?? 999) - (b._bdayIn ?? 999))
      .map((c) => ({
        name: c.name, dob: c.dob, age: ageFromDob(c.dob), phone: c.phone,
        rank: c.rank || "—", last_purchase: c.last_purchase_date || "—",
        days_to: c._bdayIn,
      }));
  }, [enriched]);
  const birthdayCols: Column[] = [
    { header: "Name", key: "name" }, { header: "DOB", key: "dob" }, { header: "Age", key: "age" },
    { header: "Phone", key: "phone" }, { header: "Rank", key: "rank" },
    { header: "Last Purchase", key: "last_purchase" }, { header: "Days To", key: "days_to" },
  ];

  // ============ Report 6: Anniversary ============
  const annivRows = useMemo(() => {
    return enriched
      .filter((c) => c.anniversary_date && c._annivIn !== null && c._annivIn <= 365)
      .sort((a, b) => (a._annivIn ?? 999) - (b._annivIn ?? 999))
      .map((c) => ({
        name: c.name, anniversary: c.anniversary_date, years: yearsCompleted(c.anniversary_date),
        phone: c.phone, rank: c.rank || "—", days_to: c._annivIn,
      }));
  }, [enriched]);
  const annivCols: Column[] = [
    { header: "Name", key: "name" }, { header: "Anniversary", key: "anniversary" }, { header: "Years", key: "years" },
    { header: "Phone", key: "phone" }, { header: "Rank", key: "rank" }, { header: "Days To", key: "days_to" },
  ];

  // ============ Report 7: Top Customers ============
  const topRows = useMemo(() => {
    return [...enriched]
      .filter((c) => typeFilter === "all" || c._type === typeFilter)
      .sort((a, b) => (b.total_value || 0) - (a.total_value || 0))
      .slice(0, 100)
      .map((c, i) => ({
        rank: i + 1, name: c.name, occupation: c.occupation || "—", city: c.city || "—",
        source: c.source_mode || "—", purchases: c.total_purchases || 0,
        total_value: formatINR(c.total_value || 0), last_purchase: c.last_purchase_date || "—",
        wa_count: c._waCount,
      }));
  }, [enriched, typeFilter]);
  const topCols: Column[] = [
    { header: "Rank", key: "rank" }, { header: "Name", key: "name" }, { header: "Occupation", key: "occupation" },
    { header: "City", key: "city" }, { header: "Source", key: "source" }, { header: "Purchases", key: "purchases" },
    { header: "Total Value", key: "total_value" }, { header: "Last Purchase", key: "last_purchase" }, { header: "WA Count", key: "wa_count" },
  ];

  // ============ Report 8: Reminder History ============
  const [evtFilter, setEvtFilter] = useState<"all" | "birthday" | "anniversary">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "pending" | "missed">("all");
  const reminderRows = useMemo(() => {
    return reminders
      .filter((r) => {
        const d = (r.event_date || "").slice(0, 10);
        if (d && (d < from || d > to)) return false;
        if (evtFilter !== "all" && r.event_type !== evtFilter) return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        return true;
      })
      .map((r) => {
        const cust = customers.find((c) => c.id === r.customer_id);
        const evtLog = eventLogs.find((e) => e.customer_id === r.customer_id && e.event_type === r.event_type && (e.event_date || "").slice(0, 10) === (r.event_date || "").slice(0, 10));
        return {
          customer: cust?.name || "—", event: r.event_type, date: r.event_date,
          hint: (evtLog?.message_sent || "").slice(0, 80),
          sent_on: r.sent_at ? new Date(r.sent_at).toLocaleString() : "—",
          status: r.status, sent_by: r.sent_by ? "User" : "—",
        };
      });
  }, [reminders, customers, eventLogs, from, to, evtFilter, statusFilter]);
  const reminderCols: Column[] = [
    { header: "Customer", key: "customer" }, { header: "Event", key: "event" }, { header: "Date", key: "date" },
    { header: "Hint", key: "hint", width: 40 }, { header: "Sent On", key: "sent_on" },
    { header: "Status", key: "status" }, { header: "Sent By", key: "sent_by" },
  ];
  const reminderTotals = useMemo(() => ({
    total: reminderRows.length,
    sent: reminderRows.filter((r) => r.status === "sent").length,
    pending: reminderRows.filter((r) => r.status === "pending").length,
    missed: reminderRows.filter((r) => r.status === "missed").length,
  }), [reminderRows]);

  // ============ RENDER ============
  if (loading) return <div className="text-slate-400 p-8">Loading reports…</div>;

  const reportInfo = REPORTS.find((r) => r.key === active)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/crm/customers" className="p-2 rounded bg-slate-800 hover:bg-slate-700"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Customer Reports</h1>
            <div className="text-xs text-slate-400">8 detailed reports with Excel, PDF & Print export</div>
          </div>
        </div>
      </div>

      {/* Report selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          const isActive = active === r.key;
          return (
            <button key={r.key} onClick={() => setActive(r.key)}
              className={`p-3 rounded-lg border text-left transition-all ${isActive ? "bg-blue-600/20 border-blue-500/60" : "bg-slate-900 border-slate-800 hover:border-slate-700"}`}>
              <Icon size={18} className={r.color} />
              <div className="text-xs font-semibold text-slate-200 mt-1.5">{r.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100">
              <option value="all">All</option><option value="New">New</option><option value="Repeat">Repeat</option>
            </select>
          </div>
          {active === "reminders" && (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Event</label>
                <select value={evtFilter} onChange={(e) => setEvtFilter(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100">
                  <option value="all">All</option><option value="birthday">Birthday</option><option value="anniversary">Anniversary</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100">
                  <option value="all">All</option><option value="sent">Sent</option><option value="pending">Pending</option><option value="missed">Missed</option>
                </select>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Report header + export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className={`text-xl font-semibold ${reportInfo.color}`}>{reportInfo.label}</h2>
        <ExportButtons title={reportInfo.label}
          columns={
            active === "growth" ? growthCols :
            active === "source" ? sourceCols :
            active === "occupation" ? occCols :
            active === "engagement" ? engagementCols :
            active === "birthday" ? birthdayCols :
            active === "anniversary" ? annivCols :
            active === "top" ? topCols : reminderCols
          }
          rows={
            active === "growth" ? growthRows :
            active === "source" ? sourceData :
            active === "occupation" ? occData :
            active === "engagement" ? engagementRows :
            active === "birthday" ? birthdayRows :
            active === "anniversary" ? annivRows :
            active === "top" ? topRows : reminderRows
          }
          subtitle={subtitle}
        />
      </div>

      {/* Report content */}
      {active === "growth" && (
        <>
          <Card>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><div className="text-xs text-slate-400">Total Added</div><div className="text-2xl font-bold text-white">{baseFiltered.length}</div></div>
              <div><div className="text-xs text-slate-400">New</div><div className="text-2xl font-bold text-blue-400">{baseFiltered.filter((c) => c._type === "New").length}</div></div>
              <div><div className="text-xs text-slate-400">Repeat</div><div className="text-2xl font-bold text-green-400">{baseFiltered.filter((c) => c._type === "Repeat").length}</div></div>
            </div>
            <div className="h-64">
              <ResponsiveContainer><BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="New" fill="#3b82f6" /><Bar dataKey="Repeat" fill="#10b981" />
              </BarChart></ResponsiveContainer>
            </div>
          </Card>
          <Card><DataTable columns={growthCols} rows={growthRows} /></Card>
        </>
      )}

      {(active === "source" || active === "occupation") && (
        <>
          <Card>
            <div className="h-72">
              <ResponsiveContainer><PieChart>
                <Pie data={active === "source" ? sourceData : occData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => `${e.name} (${e.pct})`}>
                  {(active === "source" ? sourceData : occData).map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6 }} />
              </PieChart></ResponsiveContainer>
            </div>
          </Card>
          <Card><DataTable columns={active === "source" ? sourceCols : occCols} rows={active === "source" ? sourceData : occData} /></Card>
        </>
      )}

      {active === "engagement" && (
        <Card>
          <div className="text-sm text-slate-400 mb-3">Total messages in range: <span className="text-white font-semibold">{engagementRows.reduce((s, r) => s + r.count, 0)}</span></div>
          <DataTable columns={engagementCols} rows={engagementRows} />
        </Card>
      )}

      {active === "birthday" && (
        <Card>
          <div className="text-sm text-slate-400 mb-3">Upcoming 7 days are highlighted. Showing next 365 days.</div>
          <DataTable columns={birthdayCols} rows={birthdayRows} highlightFn={(r) => r.days_to <= 7} />
        </Card>
      )}

      {active === "anniversary" && (
        <Card>
          <div className="text-sm text-slate-400 mb-3">Upcoming 7 days are highlighted. Showing next 365 days.</div>
          <DataTable columns={annivCols} rows={annivRows} highlightFn={(r) => r.days_to <= 7} />
        </Card>
      )}

      {active === "top" && (
        <Card>
          <div className="text-sm text-slate-400 mb-3">Top 100 customers ranked by lifetime purchase value.</div>
          <DataTable columns={topCols} rows={topRows} />
        </Card>
      )}

      {active === "reminders" && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <Card><div className="text-xs text-slate-400">Total</div><div className="text-2xl font-bold text-white">{reminderTotals.total}</div></Card>
            <Card><div className="text-xs text-slate-400">Sent</div><div className="text-2xl font-bold text-green-400">{reminderTotals.sent}</div></Card>
            <Card><div className="text-xs text-slate-400">Pending</div><div className="text-2xl font-bold text-amber-400">{reminderTotals.pending}</div></Card>
            <Card><div className="text-xs text-slate-400">Missed</div><div className="text-2xl font-bold text-red-400">{reminderTotals.missed}</div></Card>
          </div>
          <Card><DataTable columns={reminderCols} rows={reminderRows} /></Card>
        </>
      )}
    </div>
  );
}
