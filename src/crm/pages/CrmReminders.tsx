import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Cake, Heart, MessageCircle, RefreshCw, Search, Check, History } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { renderTemplate, whatsappLink, messageHint, yearsCompleted } from "@/crm/lib/customerHelpers";

type Customer = {
  id: string; name: string; phone: string; whatsapp: string | null;
  dob: string | null; anniversary_date: string | null; rank: string | null;
};

type QueueRow = {
  id: string; customer_id: string | null; event_type: string;
  event_date: string; event_year: number; status: string;
  sent_at: string | null; days_before: number | null;
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
};

function nextOccurrenceISO(dateStr: string): string {
  const d = new Date(dateStr);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  let next = new Date(t.getFullYear(), d.getMonth(), d.getDate());
  if (next < t) next = new Date(t.getFullYear() + 1, d.getMonth(), d.getDate());
  return next.toISOString().slice(0, 10);
}

export default function CrmReminders() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [tplBday, setTplBday] = useState("Dear {{customer_name}}, wishing you a very happy birthday from The Computer Solutions! 🎉");
  const [tplAnniv, setTplAnniv] = useState("Dear {{customer_name}}, congratulations on completing {{years_count}} year(s) with us! — The Computer Solutions");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("today");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [custRes, queueRes, tplRes] = await Promise.all([
      supabase.from("crm_customers").select("id, name, phone, whatsapp, dob, anniversary_date, rank"),
      supabase.from("reminders_queue" as any).select("*").order("event_date", { ascending: true }),
      supabase.from("admin_reminder_settings" as any).select("*"),
    ]);
    setCustomers((custRes.data || []) as any);
    setQueue((queueRes.data || []) as any);
    const tplMap: Record<string, string> = {};
    (tplRes.data || []).forEach((r: any) => { tplMap[r.setting_key] = r.setting_value; });
    if (tplMap.birthday_template) setTplBday(tplMap.birthday_template);
    if (tplMap.anniversary_template) setTplAnniv(tplMap.anniversary_template);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const customerById = useMemo(() => {
    const m: Record<string, Customer> = {};
    customers.forEach((c) => { m[c.id] = c; });
    return m;
  }, [customers]);

  // Compute upcoming events from customers (live, not just queue)
  const allEvents = useMemo(() => {
    const evs: { customer: Customer; type: "birthday" | "anniversary"; date: string; daysAway: number }[] = [];
    const t = new Date(); t.setHours(0, 0, 0, 0);
    customers.forEach((c) => {
      if (c.dob) {
        const next = nextOccurrenceISO(c.dob);
        const days = Math.round((new Date(next).getTime() - t.getTime()) / 86400000);
        evs.push({ customer: c, type: "birthday", date: next, daysAway: days });
      }
      if (c.anniversary_date) {
        const next = nextOccurrenceISO(c.anniversary_date);
        const days = Math.round((new Date(next).getTime() - t.getTime()) / 86400000);
        evs.push({ customer: c, type: "anniversary", date: next, daysAway: days });
      }
    });
    return evs.sort((a, b) => a.daysAway - b.daysAway);
  }, [customers]);

  const filteredEvents = useMemo(() => {
    const s = search.toLowerCase();
    return allEvents.filter((e) => !s || e.customer.name.toLowerCase().includes(s) || e.customer.phone.includes(s));
  }, [allEvents, search]);

  const today = filteredEvents.filter((e) => e.daysAway === 0);
  const tomorrow = filteredEvents.filter((e) => e.daysAway === 1);
  const upcoming = filteredEvents.filter((e) => e.daysAway >= 2 && e.daysAway <= 14);

  const wasSent = (customerId: string, type: string, dateISO: string): boolean => {
    const yr = new Date(dateISO).getFullYear();
    return queue.some((q) =>
      q.customer_id === customerId && q.event_type === type && q.event_year === yr && q.status === "sent"
    );
  };

  const handleSend = async (ev: typeof allEvents[number]) => {
    const c = ev.customer;
    const years = ev.type === "anniversary"
      ? yearsCompleted(c.anniversary_date) || 0
      : yearsCompleted(c.dob) || 0;
    const tpl = ev.type === "birthday" ? tplBday : tplAnniv;
    const message = renderTemplate(tpl, {
      customer_name: c.name, years_count: years, date: new Date(ev.date).toDateString(),
    });
    const phone = c.whatsapp || c.phone;
    window.open(whatsappLink(phone, message), "_blank");

    const { data: { user } } = await supabase.auth.getUser();
    const yr = new Date(ev.date).getFullYear();

    // Upsert into reminders_queue
    const existing = queue.find((q) => q.customer_id === c.id && q.event_type === ev.type && q.event_year === yr);
    if (existing) {
      await supabase.from("reminders_queue" as any).update({
        status: "sent", sent_at: new Date().toISOString(), sent_by: user?.id,
      }).eq("id", existing.id);
    } else {
      await supabase.from("reminders_queue" as any).insert({
        customer_id: c.id, event_type: ev.type, event_date: ev.date, event_year: yr,
        status: "sent", sent_at: new Date().toISOString(), sent_by: user?.id, days_before: 0,
      });
    }
    // Log to event logs and WA log
    await Promise.all([
      supabase.from("customer_event_logs" as any).insert({
        customer_id: c.id, event_type: ev.type, event_date: ev.date,
        message_sent: message, years_completed: years, sent_by: user?.id,
      }),
      supabase.from("crm_whatsapp_log").insert({
        customer_id: c.id, customer_name: c.name, phone,
        message_text: message, message_hint: messageHint(message),
        message_type: ev.type, sent_from_section: "reminders", sent_by: user?.id,
      }),
    ]);
    toast.success(`${ev.type === "birthday" ? "Birthday" : "Anniversary"} wish sent to ${c.name}`);
    load();
  };

  const triggerCron = async () => {
    toast.loading("Running daily check...", { id: "cron" });
    const { error } = await supabase.functions.invoke("check_daily_reminders");
    if (error) toast.error("Failed: " + error.message, { id: "cron" });
    else { toast.success("Daily reminders refreshed", { id: "cron" }); load(); }
  };

  const renderRow = (ev: typeof allEvents[number]) => {
    const sent = wasSent(ev.customer.id, ev.type, ev.date);
    const Icon = ev.type === "birthday" ? Cake : Heart;
    const color = ev.type === "birthday" ? "text-pink-300 bg-pink-500/15" : "text-purple-300 bg-purple-500/15";
    return (
      <div key={`${ev.customer.id}-${ev.type}-${ev.date}`} className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded">
        <div className={`p-2 rounded ${color}`}><Icon size={16} /></div>
        <div className="flex-1 min-w-0">
          <div className="text-white truncate">{ev.customer.name}</div>
          <div className="text-xs text-slate-400">
            {ev.type === "birthday" ? "Birthday" : "Anniversary"} • {new Date(ev.date).toLocaleDateString()}
            {ev.daysAway === 0 ? " • Today" : ev.daysAway === 1 ? " • Tomorrow" : ` • in ${ev.daysAway} days`}
          </div>
        </div>
        {sent ? (
          <span className="text-xs text-green-400 flex items-center gap-1"><Check size={12} /> Sent</span>
        ) : (
          <button onClick={() => handleSend(ev)} className="px-3 py-1.5 rounded bg-green-600/20 hover:bg-green-600/30 text-green-300 text-xs flex items-center gap-1">
            <MessageCircle size={12} /> Send
          </button>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-slate-400">Loading reminders…</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Reminders</h1>
          <p className="text-sm text-slate-400">Birthdays & anniversaries — send wishes via WhatsApp</p>
        </div>
        <button onClick={triggerCron} className="px-3 py-2 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-sm flex items-center gap-2">
          <RefreshCw size={14} /> Run Daily Check
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="Search by name or phone"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="today">Today ({today.length})</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow ({tomorrow.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming 14d ({upcoming.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-2 mt-4">
          {today.length === 0 ? <div className="text-slate-500 text-sm py-6 text-center">No events today 🎉</div> : today.map(renderRow)}
        </TabsContent>
        <TabsContent value="tomorrow" className="space-y-2 mt-4">
          {tomorrow.length === 0 ? <div className="text-slate-500 text-sm py-6 text-center">Nothing tomorrow</div> : tomorrow.map(renderRow)}
        </TabsContent>
        <TabsContent value="upcoming" className="space-y-2 mt-4">
          {upcoming.length === 0 ? <div className="text-slate-500 text-sm py-6 text-center">No upcoming events in next 14 days</div> : upcoming.map(renderRow)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
