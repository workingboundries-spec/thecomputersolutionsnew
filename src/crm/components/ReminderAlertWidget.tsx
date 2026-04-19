import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cake, Heart, X, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Ev = { id: string; name: string; phone: string; type: "birthday" | "anniversary" };

const STORAGE_KEY = "crm_reminder_widget_dismissed";

function isDismissedToday(): boolean {
  return localStorage.getItem(STORAGE_KEY) === new Date().toISOString().slice(0, 10);
}

export default function ReminderAlertWidget() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [dismissed, setDismissed] = useState(isDismissedToday());

  useEffect(() => {
    if (dismissed) return;
    (async () => {
      const { data } = await supabase
        .from("crm_customers")
        .select("id, name, phone, whatsapp, dob, anniversary_date")
        .or("dob.not.is.null,anniversary_date.not.is.null");
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const m = today.getMonth(), d = today.getDate();
      const evs: Ev[] = [];
      (data || []).forEach((c: any) => {
        if (c.dob) {
          const dob = new Date(c.dob);
          if (dob.getMonth() === m && dob.getDate() === d) evs.push({ id: c.id, name: c.name, phone: c.whatsapp || c.phone, type: "birthday" });
        }
        if (c.anniversary_date) {
          const a = new Date(c.anniversary_date);
          if (a.getMonth() === m && a.getDate() === d) evs.push({ id: c.id, name: c.name, phone: c.whatsapp || c.phone, type: "anniversary" });
        }
      });
      setEvents(evs);
    })();
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString().slice(0, 10));
    setDismissed(true);
  };

  if (dismissed || events.length === 0) return null;

  const bdays = events.filter((e) => e.type === "birthday");
  const annivs = events.filter((e) => e.type === "anniversary");

  return (
    <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-lg p-4 relative">
      <button onClick={dismiss} className="absolute top-2 right-2 text-slate-400 hover:text-white" aria-label="Dismiss">
        <X size={16} />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🎉</span>
        <h3 className="font-semibold text-white">Today's Celebrations ({events.length})</h3>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {bdays.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-pink-300">
            <Cake size={14} /> {bdays.length} birthday{bdays.length > 1 ? "s" : ""}
          </div>
        )}
        {annivs.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-purple-300">
            <Heart size={14} /> {annivs.length} anniversary{annivs.length > 1 ? "s" : "ies"}
          </div>
        )}
      </div>
      <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
        {events.slice(0, 5).map((e) => (
          <div key={e.id + e.type} className="text-sm text-slate-300 flex items-center gap-2">
            {e.type === "birthday" ? <Cake size={12} className="text-pink-400" /> : <Heart size={12} className="text-purple-400" />}
            <span className="truncate">{e.name}</span>
          </div>
        ))}
        {events.length > 5 && <div className="text-xs text-slate-500">+ {events.length - 5} more</div>}
      </div>
      <Link to="/crm/reminders" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-600/30 hover:bg-pink-600/40 text-pink-200 rounded text-sm">
        <MessageCircle size={12} /> Send Wishes
      </Link>
    </div>
  );
}
