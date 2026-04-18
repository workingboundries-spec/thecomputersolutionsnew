import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, todayISO, waLink, addDays } from "@/crm/lib/format";
import { toast } from "sonner";
import { Bell, MessageCircle, Check, Search, ChevronDown, ChevronRight, CalendarRange, Cake } from "lucide-react";

type Section = {
  id: string;
  title: string;
  color: string;
  filter: (r: any, today: string) => boolean;
};

function endOfMonth(today: string) {
  const d = new Date(today);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}
function addMonths(today: string, m: number) {
  const d = new Date(today);
  d.setMonth(d.getMonth() + m);
  return d.toISOString().slice(0, 10);
}

const SECTIONS: Section[] = [
  { id: "overdue", title: "Overdue", color: "red", filter: (r, t) => r.scheduled_date < t },
  { id: "week", title: "This Week", color: "orange", filter: (r, t) => r.scheduled_date >= t && r.scheduled_date <= addDays(t, 7) },
  { id: "month", title: "This Month", color: "blue", filter: (r, t) => r.scheduled_date > addDays(t, 7) && r.scheduled_date <= endOfMonth(t) },
  { id: "quarterly", title: "Quarterly", color: "purple", filter: (r, t) => r.scheduled_date > endOfMonth(t) && r.scheduled_date <= addMonths(t, 3) },
  { id: "halfyear", title: "Half Yearly", color: "teal", filter: (r, t) => r.scheduled_date > addMonths(t, 3) && r.scheduled_date <= addMonths(t, 6) },
  { id: "annual", title: "Annually", color: "gray", filter: (r, t) => r.scheduled_date > addMonths(t, 6) },
];

const COLOR_STYLES: Record<string, { header: string; badge: string }> = {
  red: { header: "bg-red-500/15 border-red-500/30 text-red-300", badge: "bg-red-500/20 text-red-300" },
  orange: { header: "bg-orange-500/15 border-orange-500/30 text-orange-300", badge: "bg-orange-500/20 text-orange-300" },
  blue: { header: "bg-blue-500/15 border-blue-500/30 text-blue-300", badge: "bg-blue-500/20 text-blue-300" },
  purple: { header: "bg-purple-500/15 border-purple-500/30 text-purple-300", badge: "bg-purple-500/20 text-purple-300" },
  teal: { header: "bg-teal-500/15 border-teal-500/30 text-teal-300", badge: "bg-teal-500/20 text-teal-300" },
  gray: { header: "bg-slate-700/30 border-slate-600/40 text-slate-300", badge: "bg-slate-700 text-slate-300" },
};

function Avatar({ name, photo, size = 32 }: { name: string; photo?: string | null; size?: number }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const colors = ["bg-blue-600", "bg-green-600", "bg-purple-600", "bg-pink-600", "bg-orange-600", "bg-teal-600"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  if (photo) return <img src={photo} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover border border-slate-700" />;
  return <div style={{ width: size, height: size, fontSize: size * 0.45 }} className={`${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>{initial}</div>;
}

function daysBetween(fromISO: string, toISO: string) {
  return Math.round((new Date(toISO).getTime() - new Date(fromISO).getTime()) / 86400000);
}

export default function CrmWarranty() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Date Range Checker state
  const [fromDate, setFromDate] = useState<string>(todayISO());
  const [toDate, setToDate] = useState<string>(addDays(todayISO(), 30));
  const [rangeBirthdays, setRangeBirthdays] = useState<any[] | null>(null);
  const [rangeWarranties, setRangeWarranties] = useState<any[] | null>(null);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_warranty_reminders")
      .select("*")
      .eq("status", "pending")
      .order("scheduled_date", { ascending: true });
    setReminders(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const today = todayISO();

  const filteredReminders = useMemo(() => {
    if (!search) return reminders;
    const s = search.toLowerCase();
    return reminders.filter(r => [r.customer_name, r.phone, r.item_name].filter(Boolean).some((x: string) => x.toLowerCase().includes(s)));
  }, [reminders, search]);

  const sectionData = useMemo(() => {
    return SECTIONS.map(s => ({ ...s, items: filteredReminders.filter(r => s.filter(r, today)) }));
  }, [filteredReminders, today]);

  const sendReminder = async (r: any) => {
    const msg = r.whatsapp_message || `Hi ${r.customer_name}, this is a friendly reminder regarding your ${r.item_name || "purchase"}. — The Computer Solutions`;
    window.open(waLink(r.whatsapp || r.phone, msg), "_blank");
  };

  const markSent = async (r: any) => {
    const { error } = await supabase
      .from("crm_warranty_reminders")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("Marked as sent"); load(); }
  };

  const setPreset = (days: number) => {
    setFromDate(todayISO());
    setToDate(addDays(todayISO(), days));
  };

  const runCheck = async () => {
    if (!fromDate || !toDate || fromDate > toDate) {
      toast.error("Pick a valid date range");
      return;
    }
    setChecking(true);
    const [{ data: customers }, { data: sales }] = await Promise.all([
      supabase.from("crm_customers").select("id, name, phone, whatsapp, dob, photo_url").not("dob", "is", null),
      supabase.from("crm_sales").select("id, customer_name, phone, whatsapp, item_name, sale_date, warranty_expiry").not("warranty_expiry", "is", null).gte("warranty_expiry", fromDate).lte("warranty_expiry", toDate),
    ]);

    // Birthdays — match month+day within range (handles year wrap)
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const bdays: any[] = [];
    (customers || []).forEach((c: any) => {
      const dob = new Date(c.dob);
      // walk forward through years from fromDate.year - 1 to toDate.year + 1 to be safe
      for (let y = from.getFullYear(); y <= to.getFullYear() + 1; y++) {
        const candidate = new Date(y, dob.getMonth(), dob.getDate());
        if (candidate >= from && candidate <= to) {
          const candidateISO = candidate.toISOString().slice(0, 10);
          bdays.push({
            ...c,
            nextBirthday: candidateISO,
            days: daysBetween(todayISO(), candidateISO),
          });
          break;
        }
      }
    });
    bdays.sort((a, b) => a.nextBirthday.localeCompare(b.nextBirthday));

    const warranties = (sales || []).map((s: any) => ({
      ...s,
      daysRemaining: daysBetween(todayISO(), s.warranty_expiry),
    })).sort((a: any, b: any) => a.warranty_expiry.localeCompare(b.warranty_expiry));

    setRangeBirthdays(bdays);
    setRangeWarranties(warranties);
    setChecking(false);
  };

  const sendBirthday = (c: any) => {
    const msg = `Happy Birthday ${c.name}! 🎂 Wishing you a wonderful year ahead! - The Computer Solutions Team`;
    window.open(waLink(c.whatsapp || c.phone, msg), "_blank");
  };
  const sendWarrantyAlert = (s: any) => {
    const msg = `Hi ${s.customer_name}, your warranty for ${s.item_name} expires on ${formatDate(s.warranty_expiry)}. Visit us if you need any service before then. — The Computer Solutions`;
    window.open(waLink(s.whatsapp || s.phone, msg), "_blank");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Warranty & Reminders</h1>
        <p className="text-sm text-slate-400">Time-based reminder sections plus a date range checker</p>
      </div>

      {/* Date Range Checker */}
      <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarRange size={18} className="text-blue-300" />
          <h3 className="font-semibold text-white">Date Range Checker</h3>
        </div>
        <div className="flex flex-wrap items-end gap-2 mb-3">
          <label className="block">
            <span className="text-xs text-slate-400 mb-1 block">From Date</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400 mb-1 block">To Date</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white" />
          </label>
          <button onClick={runCheck} disabled={checking} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm font-medium">
            {checking ? "Checking…" : "Check Now"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ l: "Next 7 Days", d: 7 }, { l: "Next 1 Month", d: 30 }, { l: "Next 2 Months", d: 60 }, { l: "Next 3 Months", d: 90 }].map(p => (
            <button key={p.d} onClick={() => setPreset(p.d)} className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded">
              {p.l}
            </button>
          ))}
        </div>

        {rangeBirthdays !== null && (
          <div className="mt-4 space-y-4">
            {/* Birthdays */}
            <div className="bg-slate-900/60 border border-slate-800 rounded">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-white"><Cake size={14} className="text-pink-300" /> Birthdays</div>
                <span className="text-xs px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">{rangeBirthdays.length} found</span>
              </div>
              {rangeBirthdays.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">No birthdays in this period 🎉</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950/60 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="text-left px-3 py-2">Customer</th>
                        <th className="text-left px-3 py-2">Phone</th>
                        <th className="text-left px-3 py-2">Birthday</th>
                        <th className="text-left px-3 py-2">Days Away</th>
                        <th className="text-right px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rangeBirthdays.map((c: any) => (
                        <tr key={c.id} className="border-t border-slate-800">
                          <td className="px-3 py-2 text-white"><div className="flex items-center gap-2"><Avatar name={c.name} photo={c.photo_url} size={28} />{c.name}</div></td>
                          <td className="px-3 py-2 text-slate-400">{c.phone}</td>
                          <td className="px-3 py-2 text-slate-300">{formatDate(c.nextBirthday)}</td>
                          <td className="px-3 py-2 text-slate-400">{c.days <= 0 ? "Today" : `In ${c.days}d`}</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => sendBirthday(c)} className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-300 text-xs rounded"><MessageCircle size={12} /> Wish</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Warranties */}
            <div className="bg-slate-900/60 border border-slate-800 rounded">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-white"><Bell size={14} className="text-orange-300" /> Warranties Expiring</div>
                <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">{rangeWarranties?.length || 0} found</span>
              </div>
              {(rangeWarranties || []).length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">No warranties expiring in this period</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950/60 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="text-left px-3 py-2">Customer</th>
                        <th className="text-left px-3 py-2">Phone</th>
                        <th className="text-left px-3 py-2">Item</th>
                        <th className="text-left px-3 py-2">Purchase</th>
                        <th className="text-left px-3 py-2">Expiry</th>
                        <th className="text-left px-3 py-2">Days Left</th>
                        <th className="text-right px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rangeWarranties || []).map((s: any) => (
                        <tr key={s.id} className="border-t border-slate-800">
                          <td className="px-3 py-2 text-white">{s.customer_name}</td>
                          <td className="px-3 py-2 text-slate-400">{s.phone}</td>
                          <td className="px-3 py-2 text-slate-300">{s.item_name}</td>
                          <td className="px-3 py-2 text-slate-400 text-xs">{formatDate(s.sale_date)}</td>
                          <td className="px-3 py-2 text-slate-300 text-xs">{formatDate(s.warranty_expiry)}</td>
                          <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded ${s.daysRemaining <= 7 ? "bg-red-500/20 text-red-300" : s.daysRemaining <= 30 ? "bg-yellow-500/20 text-yellow-300" : "bg-slate-800 text-slate-300"}`}>{s.daysRemaining}d</span></td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => sendWarrantyAlert(s)} className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-300 text-xs rounded"><MessageCircle size={12} /> Remind</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer, phone, item..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white placeholder:text-slate-500"
        />
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-3">
          {sectionData.map(s => {
            const styles = COLOR_STYLES[s.color];
            const isCollapsed = collapsed[s.id] !== undefined ? collapsed[s.id] : s.items.length === 0;
            return (
              <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setCollapsed({ ...collapsed, [s.id]: !isCollapsed })}
                  className={`w-full flex items-center justify-between px-4 py-3 border-b ${styles.header} ${s.items.length === 0 ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    {s.title}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${styles.badge}`}>{s.items.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    {s.items.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">No reminders in this period</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-950/40 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="text-left px-4 py-2">Customer</th>
                            <th className="text-left px-4 py-2">Item</th>
                            <th className="text-left px-4 py-2">Type</th>
                            <th className="text-left px-4 py-2">Date</th>
                            <th className="text-right px-4 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.items.map(r => (
                            <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-950/40">
                              <td className="px-4 py-2"><div className="text-white">{r.customer_name}</div><div className="text-xs text-slate-500">{r.phone}</div></td>
                              <td className="px-4 py-2 text-slate-300">{r.item_name || "—"}</td>
                              <td className="px-4 py-2"><span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{r.reminder_type}</span></td>
                              <td className="px-4 py-2 text-slate-400 text-xs">{formatDate(r.scheduled_date)}</td>
                              <td className="px-4 py-2 text-right">
                                <div className="inline-flex gap-1">
                                  <button onClick={() => sendReminder(r)} className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-300 text-xs rounded"><MessageCircle size={12} /> WA</button>
                                  <button onClick={() => markSent(r)} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded"><Check size={12} /> Mark Sent</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {sectionData.every(s => s.items.length === 0) && (
            <div className="text-center py-10 text-slate-500"><Bell className="mx-auto mb-2 opacity-40" /> No pending reminders</div>
          )}
        </div>
      )}
    </div>
  );
}
