// Daily cron: scans crm_customers DOB + anniversary_date and inserts pending
// reminders into reminders_queue when the event falls within the configured
// lead window. Skips duplicates (same customer + event_type + event_year).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Read lead-day settings
    const { data: settings } = await supabase
      .from("admin_reminder_settings")
      .select("setting_key, setting_value");
    const settingMap: Record<string, string> = {};
    (settings || []).forEach((r: any) => { settingMap[r.setting_key] = r.setting_value; });
    const bdayLead = parseInt(settingMap.birthday_lead_days || "0", 10);
    const annivLead = parseInt(settingMap.anniversary_lead_days || "0", 10);

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const { data: customers, error: custErr } = await supabase
      .from("crm_customers")
      .select("id, name, dob, anniversary_date");
    if (custErr) throw custErr;

    const { data: existingQueue } = await supabase
      .from("reminders_queue")
      .select("customer_id, event_type, event_year");
    const existingSet = new Set(
      (existingQueue || []).map((r: any) => `${r.customer_id}|${r.event_type}|${r.event_year}`),
    );

    const toInsert: any[] = [];

    const evalEvent = (customerId: string, dateStr: string | null, type: "birthday" | "anniversary", lead: number) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      // Next occurrence of mm-dd
      let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
      const daysAway = Math.round((next.getTime() - today.getTime()) / 86400000);
      if (daysAway > lead) return;
      const key = `${customerId}|${type}|${next.getFullYear()}`;
      if (existingSet.has(key)) return;
      existingSet.add(key);
      toInsert.push({
        customer_id: customerId,
        event_type: type,
        event_date: next.toISOString().slice(0, 10),
        event_year: next.getFullYear(),
        days_before: daysAway,
        status: "pending",
      });
    };

    (customers || []).forEach((c: any) => {
      evalEvent(c.id, c.dob, "birthday", bdayLead);
      evalEvent(c.id, c.anniversary_date, "anniversary", annivLead);
    });

    let inserted = 0;
    if (toInsert.length > 0) {
      const { error: insErr } = await supabase.from("reminders_queue").insert(toInsert);
      if (insErr) throw insErr;
      inserted = toInsert.length;
    }

    return new Response(
      JSON.stringify({ ok: true, scanned: customers?.length || 0, inserted, skipped_existing: existingSet.size - inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("check_daily_reminders error:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
