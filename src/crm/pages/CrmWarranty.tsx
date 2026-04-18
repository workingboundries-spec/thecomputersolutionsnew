import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, todayISO, addDays, waLink } from "@/crm/lib/format";
import { useAdminSettings } from "@/crm/hooks/useAdminSettings";
import { fillTemplate, logWhatsApp } from "@/crm/lib/whatsapp";
import { toast } from "sonner";
import { MessageCircle, Check, ChevronDown, ChevronRight, Cake, Bell, Calendar, Search } from "lucide-react";

const TABS = ["Warranty Reminders", "Birthdays"] as const;

const QUICK_FILTERS = [
  { id: "today", label: "Today", days: 0 },
  { id: "week", label: "This Week", days: 7 },
  { id: "month", label: "This Month", days: 30 },
  { id: "quarter", label: "Quarterly", days: 90 },
  { id: "halfyear", label: "Half Yearly", days: 180 },
  { id: "11month", label: "11 Month", days: 330 },
];

function endOfMonthISO(today: string) {
  const d = new Date(today);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

function rangeFor(filterId: string) {
  const today = todayISO();
  if (filterId === "today") return { from: today, to: today };
  if (filterId === "week") return { from: today, to: addDays(today, 7) };
  if (filterId === "month") return { from: today, to: endOfMonthISO(today) };
  return { from: today, to: addDays(today, QUICK_FILTERS.find((f) => f.id === filterId)?.days || 30) };
}

export default function CrmWarranty() {
  const [tab, setTab] = useState<typeof TABS[number]>("Warranty Reminders");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Warranty & Reminders</h1>
        <p className="text-sm text-slate-400">Send WhatsApp reminders and birthday wishes</p>
      </div>
      <div className="flex border-b border-slate-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-white"}`}>{t}</button>
        ))}
      </div>
      {tab === "Warranty Reminders" && <Reminders />}
      {tab === "Birthdays" && <Birthdays />}
    </div>
  );
}

function Reminders() {
  const settings = useAdminSettings(["shop_phone", "shop_name", "whatsapp_week_template", "whatsapp_month_template", "whatsapp_3month_template", "whatsapp_6month_template", "whatsapp_11month_template"]);
  const [filter, setFilter] = useState("week");
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentOpen, setSentOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { from, to } = rangeFor(filter);
    const { data } = await supabase.from("crm_warranty_reminders").select("*").gte("scheduled_date", from).lte("scheduled_date", to).order("scheduled_date", { ascending: true });
    setReminders(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const pending = reminders.filter((r) => !r.message_sent && r.status !== "sent");
  const sent = reminders.filter((r) => r.message_sent || r.status === "sent");

  const tplKey = (type: string) => {
    if (type === "1week") return "whatsapp_week_template";
    if (type === "1month") return "whatsapp_month_template";
    if (type === "3month") return "whatsapp_3month_template";
    if (type === "6month") return "whatsapp_6month_template";
    if (type === "11month") return "whatsapp_11month_template";
    return "whatsapp_month_template";
  };

  const sendWA = async (r: any) => {
    const tpl = settings[tplKey(r.reminder_type)] || r.whatsapp_message || `Hi ${r.customer_name}, reminder regarding your purchase.`;
    const msg = fillTemplate(tpl, {
      name: r.customer_name, item: r.item_name || "your purchase",
      purchase_date: formatDate(r.purchase_date), expiry: formatDate(r.warranty_expiry),
      shop_phone: settings.shop_phone, shop_name: settings.shop_name, phone: r.phone,
    });
    window.open(waLink(r.whatsapp || r.phone, msg), "_blank");
    if (confirm("Mark this reminder as sent?")) {
      await supabase.from("crm_warranty_reminders").update({ message_sent: true, message_sent_at: new Date().toISOString(), status: "sent", sent_at: new Date().toISOString() }).eq("id", r.id);
      await logWhatsApp({ sale_id: r.sale_id, customer_name: r.customer_name, phone: r.phone, message_type: r.reminder_type, message_text: msg });
      toast.success("Marked as sent");
      load();
    }
  };

  const markSent = async (r: any) => {
    await supabase.from("crm_warranty_reminders").update({ message_sent: true, message_sent_at: new Date().toISOString(), status: "sent", sent_at: new Date().toISOString() }).eq("id", r.id);
    toast.success("Marked as sent");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === f.id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>{f.label}</button>
        ))}
      </div>

      {loading ? <div className="text-slate-400">Loading…</div> : (
        <>
          <Section title="🔴 Not Yet Sent" count={pending.length} color="red">
            {pending.length === 0 ? <Empty msg="Nothing pending in this period 🎉" /> :
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pending.map((r) => <ReminderCard key={r.id} r={r} onSend={() => sendWA(r)} onMark={() => markSent(r)} pending />)}
              </div>
            }
          </Section>

          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <button onClick={() => setSentOpen(!sentOpen)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">{sentOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />} ✅ Already Sent</div>
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-300">{sent.length}</span>
            </button>
            {sentOpen && (
              <div className="border-t border-slate-800 p-3">
                {sent.length === 0 ? <Empty msg="None sent in this period yet" /> :
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sent.map((r) => <ReminderCard key={r.id} r={r} onSend={() => sendWA(r)} onMark={() => {}} pending={false} />)}
                  </div>
                }
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, count, color, children }: any) {
  const c: Record<string, string> = { red: "bg-red-500/15 text-red-300", green: "bg-green-500/15 text-green-300" };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2"><span className="text-white font-semibold text-sm">{title}</span><span className={`text-xs px-2 py-0.5 rounded ${c[color]}`}>{count}</span></div>
      {children}
    </div>
  );
}

function ReminderCard({ r, onSend, onMark, pending }: any) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${pending ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}>{pending ? "PENDING" : "SENT"}</span>
        <span className="text-xs text-slate-500">{formatDate(r.scheduled_date)}</span>
      </div>
      <div className="text-white font-medium text-sm">{r.customer_name} <span className="text-slate-500 text-xs">📞 {r.phone}</span></div>
      <div className="text-xs text-slate-400">Item: <span className="text-slate-300">{r.item_name || "—"}</span></div>
      <div className="text-xs text-slate-400">Type: <span className="text-blue-300">{r.reminder_type}</span></div>
      {pending && (
        <div className="flex gap-1.5 pt-1">
          <button onClick={onSend} className="flex-1 px-2 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded text-xs flex items-center justify-center gap-1"><MessageCircle size={12} />Send WhatsApp</button>
          <button onClick={onMark} className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1"><Check size={12} />Mark</button>
        </div>
      )}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="text-center py-6 text-sm text-slate-500">{msg}</div>;
}

function Birthdays() {
  const settings = useAdminSettings(["whatsapp_birthday_template", "shop_phone", "shop_name"]);
  const [filter, setFilter] = useState("month");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(addDays(todayISO(), 30));
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    let f = from, t = to;
    if (filter !== "custom") {
      const r = rangeFor(filter); f = r.from; t = r.to;
    }
    const [custRes, svcRes] = await Promise.all([
      supabase.from("crm_customers").select("id, name, phone, whatsapp, dob, photo_url").not("dob", "is", null),
      supabase.from("crm_services").select("customer_name, phone, whatsapp"),
    ]);
    const customers = custRes.data || [];
    const services = svcRes.data || [];

    const fromD = new Date(f), toD = new Date(t);
    const matchesRange = (dob: string) => {
      const d = new Date(dob);
      // walk years from fromD.year to toD.year+1
      for (let y = fromD.getFullYear(); y <= toD.getFullYear() + 1; y++) {
        const cand = new Date(y, d.getMonth(), d.getDate());
        if (cand >= fromD && cand <= toD) {
          const todayD = new Date(todayISO());
          const days = Math.round((cand.getTime() - todayD.getTime()) / 86400000);
          const age = y - d.getFullYear();
          return { thisYear: cand.toISOString().slice(0, 10), days, age };
        }
      }
      return null;
    };

    const seen = new Set<string>();
    const out: any[] = [];
    customers.forEach((c) => {
      const m = matchesRange(c.dob);
      if (m) { seen.add(c.phone); out.push({ ...c, ...m, source: "customers" }); }
    });
    // services don't have dob; only included if matched by phone to customers (handled above)
    setResults(out.sort((a, b) => a.thisYear.localeCompare(b.thisYear)));
    setLoading(false);
  };

  useEffect(() => { run(); }, [filter]);

  const wish = async (c: any) => {
    const tpl = settings.whatsapp_birthday_template || `Happy Birthday {name}! - The Computer Solutions`;
    const msg = fillTemplate(tpl, { name: c.name, phone: c.phone, shop_phone: settings.shop_phone, shop_name: settings.shop_name });
    window.open(waLink(c.whatsapp || c.phone, msg), "_blank");
    if (confirm("Mark as Wished?")) {
      await logWhatsApp({ customer_name: c.name, phone: c.phone, message_type: "birthday", message_text: msg });
      toast.success("Logged");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }, { id: "custom", label: "Custom Range" }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === f.id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>{f.label}</button>
        ))}
      </div>
      {filter === "custom" && (
        <div className="flex flex-wrap gap-2 items-end bg-slate-900 border border-slate-800 rounded p-3">
          <label className="block"><span className="text-xs text-slate-400 mb-1 block">From</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" /></label>
          <label className="block"><span className="text-xs text-slate-400 mb-1 block">To</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" /></label>
          <button onClick={run} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Search size={14} />Search</button>
        </div>
      )}

      {loading ? <div className="text-slate-400">Loading…</div> :
        results.length === 0 ? <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded text-slate-500">No birthdays in this period 🎉</div> :
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
              <tr><th className="text-left p-3">Customer</th><th className="text-left p-3">Phone</th><th className="text-left p-3">Birthday</th><th className="text-left p-3">Days Away</th><th className="text-left p-3">Age</th><th className="text-right p-3">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {results.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30">
                  <td className="p-3 text-white flex items-center gap-2">
                    {c.photo_url ? <img src={c.photo_url} alt={c.name} className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-pink-600 flex items-center justify-center text-xs">{c.name?.[0]}</div>}
                    {c.name}
                  </td>
                  <td className="p-3 text-slate-300">{c.phone}</td>
                  <td className="p-3 text-slate-300">{formatDate(c.dob)}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${c.days <= 0 ? "bg-pink-500/20 text-pink-300" : c.days <= 7 ? "bg-orange-500/20 text-orange-300" : "bg-slate-800 text-slate-300"}`}>{c.days <= 0 ? "Today!" : `In ${c.days}d`}</span></td>
                  <td className="p-3 text-slate-400">{c.age}</td>
                  <td className="p-3 text-right"><button onClick={() => wish(c)} className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded text-xs flex items-center gap-1 ml-auto"><MessageCircle size={12} />WA Wish</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
