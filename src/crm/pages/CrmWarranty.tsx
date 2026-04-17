import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, todayISO, waLink } from "@/crm/lib/format";
import { toast } from "sonner";
import { Bell, MessageCircle, Check, Cake, Search } from "lucide-react";

type Tab = "today" | "week" | "upcoming" | "sent" | "birthday";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Due Today" },
  { id: "week", label: "This Week" },
  { id: "upcoming", label: "Upcoming" },
  { id: "sent", label: "Sent" },
  { id: "birthday", label: "Birthdays" },
];

function daysFromNow(dateISO: string) {
  const d = new Date(dateISO).getTime();
  const t = new Date(todayISO()).getTime();
  return Math.round((d - t) / 86400000);
}

export default function CrmWarranty() {
  const [tab, setTab] = useState<Tab>("today");
  const [reminders, setReminders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: rem }, { data: cus }] = await Promise.all([
      supabase.from("crm_warranty_reminders").select("*").order("scheduled_date", { ascending: true }),
      supabase.from("crm_customers").select("id, name, phone, whatsapp, dob").not("dob", "is", null),
    ]);
    setReminders(rem || []);
    setCustomers(cus || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const today = todayISO();

  const filtered = useMemo(() => {
    if (tab === "birthday") return [];
    let list = reminders;
    if (tab === "today") list = list.filter(r => r.status === "pending" && r.scheduled_date === today);
    else if (tab === "week") list = list.filter(r => r.status === "pending" && daysFromNow(r.scheduled_date) >= 0 && daysFromNow(r.scheduled_date) <= 7);
    else if (tab === "upcoming") list = list.filter(r => r.status === "pending" && daysFromNow(r.scheduled_date) > 7);
    else if (tab === "sent") list = list.filter(r => r.status === "sent");
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(r => [r.customer_name, r.phone, r.item_name].filter(Boolean).some((x: string) => x.toLowerCase().includes(s)));
    }
    return list;
  }, [reminders, tab, search, today]);

  const birthdays = useMemo(() => {
    if (tab !== "birthday") return [];
    const t = new Date(today);
    return customers
      .map(c => {
        if (!c.dob) return null;
        const dob = new Date(c.dob);
        const next = new Date(t.getFullYear(), dob.getMonth(), dob.getDate());
        if (next < t) next.setFullYear(t.getFullYear() + 1);
        const diff = Math.round((next.getTime() - t.getTime()) / 86400000);
        return { ...c, nextBirthday: next.toISOString().slice(0, 10), days: diff };
      })
      .filter((c: any) => c && c.days <= 30)
      .sort((a: any, b: any) => a.days - b.days)
      .filter((c: any) => !search || [c.name, c.phone].some((x: string) => x?.toLowerCase().includes(search.toLowerCase())));
  }, [customers, tab, today, search]);

  const sendReminder = async (r: any) => {
    const msg = r.whatsapp_message || `Hi ${r.customer_name}, this is a friendly reminder regarding your ${r.item_name || "purchase"}. — The Computer Solutions`;
    window.open(waLink(r.whatsapp || r.phone, msg), "_blank");
    const { error } = await supabase
      .from("crm_warranty_reminders")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("Marked as sent"); load(); }
  };

  const sendBirthday = (c: any) => {
    const msg = `🎉 Happy Birthday ${c.name}! Wishing you a wonderful year ahead. — The Computer Solutions`;
    window.open(waLink(c.whatsapp || c.phone, msg), "_blank");
  };

  const counts = useMemo(() => ({
    today: reminders.filter(r => r.status === "pending" && r.scheduled_date === today).length,
    week: reminders.filter(r => r.status === "pending" && daysFromNow(r.scheduled_date) >= 0 && daysFromNow(r.scheduled_date) <= 7).length,
    upcoming: reminders.filter(r => r.status === "pending" && daysFromNow(r.scheduled_date) > 7).length,
    sent: reminders.filter(r => r.status === "sent").length,
  }), [reminders, today]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Warranty & Reminders</h1>
        <p className="text-sm text-slate-400">WhatsApp follow-ups for warranty milestones and customer birthdays</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800">
        {TABS.map(t => {
          const count = t.id === "birthday" ? null : counts[t.id as keyof typeof counts];
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === t.id ? "border-blue-500 text-blue-300" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              {t.label}
              {count !== null && count > 0 && <span className="ml-2 text-xs bg-slate-800 px-1.5 py-0.5 rounded">{count}</span>}
            </button>
          );
        })}
      </div>

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
      ) : tab === "birthday" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">DOB</th>
                <th className="px-4 py-3 text-left">Next Birthday</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {birthdays.map((c: any) => (
                <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-950/50">
                  <td className="px-4 py-3 text-white">{c.name}</td>
                  <td className="px-4 py-3 text-slate-400">{c.phone}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(c.dob)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${c.days === 0 ? "bg-pink-500/20 text-pink-300" : c.days <= 7 ? "bg-yellow-500/15 text-yellow-300" : "bg-slate-800 text-slate-400"}`}>
                      {c.days === 0 ? "Today!" : `In ${c.days} days`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => sendBirthday(c)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-300 text-xs rounded">
                      <MessageCircle size={12} /> Wish
                    </button>
                  </td>
                </tr>
              ))}
              {birthdays.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500"><Cake className="mx-auto mb-2 opacity-40" /> No birthdays in next 30 days</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Scheduled</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-950/50">
                  <td className="px-4 py-3">
                    <div className="text-white">{r.customer_name}</div>
                    <div className="text-xs text-slate-500">{r.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.item_name || "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{r.reminder_type}</span></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(r.scheduled_date)}</td>
                  <td className="px-4 py-3">
                    {r.status === "sent" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-300"><Check size={12} /> Sent {r.sent_at ? formatDate(r.sent_at) : ""}</span>
                    ) : (
                      <span className="text-xs text-yellow-300">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== "sent" && (
                      <button onClick={() => sendReminder(r)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-300 text-xs rounded">
                        <MessageCircle size={12} /> Send
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500"><Bell className="mx-auto mb-2 opacity-40" /> No reminders in this view</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
