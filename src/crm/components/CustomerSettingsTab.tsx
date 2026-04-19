import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invalidateCustomerSettings, useAllCustomerSettings, type CustomerSettingRow } from "@/crm/hooks/useCustomerSettings";
import { toast } from "sonner";
import { Plus, Save, Trash2, X } from "lucide-react";

const inp = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500";

const REMINDER_KEYS = [
  { key: "reminder_lead_days", label: "Reminder Lead Days", default: "1", type: "number" as const, hint: "Days before event to flag (e.g. 1 = remind 1 day before)" },
  { key: "birthday_enabled", label: "Birthday Reminders Enabled", default: "true", type: "boolean" as const, hint: "" },
  { key: "anniversary_enabled", label: "Anniversary Reminders Enabled", default: "true", type: "boolean" as const, hint: "" },
  { key: "min_days_between_messages", label: "Min Days Between Messages", default: "7", type: "number" as const, hint: "Show warning if customer messaged in this period" },
];

const PLACEHOLDERS = ["{{customer_name}}", "{{rank}}", "{{business_name}}", "{{years_count}}", "{{phone}}"];

export default function CustomerSettingsTab() {
  return (
    <div className="space-y-6">
      <ManagerSection
        title="Rank Manager"
        type="rank"
        helper="Customer rank tiers shown as coloured badges throughout the CRM."
        showColour
      />
      <ManagerSection
        title="Source Mode Manager"
        type="source_mode"
        helper="How a customer found you (Walk-in, Referral, Social Media, etc.)."
      />
      <ManagerSection
        title="Occupation Manager"
        type="occupation"
        helper="Customer occupation categories used for segmentation."
      />
      <ManagerSection
        title="Campaign Type Manager"
        type="campaign_type"
        helper="Categories for bulk WhatsApp campaigns."
      />
      <ReminderSettings />
      <TemplateEditors />
    </div>
  );
}

function ManagerSection({ title, type, helper, showColour }: { title: string; type: string; helper: string; showColour?: boolean }) {
  const all = useAllCustomerSettings();
  const items = all.filter((r) => r.setting_type === type).sort((a, b) => a.sort_order - b.sort_order);
  const [draft, setDraft] = useState({ value: "", colour: showColour ? "#64748b" : "" });
  const [editing, setEditing] = useState<CustomerSettingRow | null>(null);

  const add = async () => {
    if (!draft.value.trim()) return;
    const { error } = await supabase.from("admin_customer_settings" as any).insert({
      setting_type: type,
      value: draft.value.trim(),
      colour: showColour ? draft.colour : null,
      sort_order: items.length + 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Added");
    setDraft({ value: "", colour: showColour ? "#64748b" : "" });
    invalidateCustomerSettings();
  };

  const update = async (row: CustomerSettingRow, patch: Partial<CustomerSettingRow>) => {
    const { error } = await supabase.from("admin_customer_settings" as any).update(patch).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditing(null);
    invalidateCustomerSettings();
  };

  const remove = async (row: CustomerSettingRow) => {
    if (!confirm(`Delete "${row.value}"?`)) return;
    const { error } = await supabase.from("admin_customer_settings" as any).delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    invalidateCustomerSettings();
  };

  return (
    <div className="border border-slate-800 rounded-lg p-4">
      <div className="mb-3">
        <h4 className="font-semibold text-white text-sm">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{helper}</p>
      </div>
      <div className="space-y-2 mb-3">
        {items.length === 0 && <div className="text-xs text-slate-500 italic">No items yet</div>}
        {items.map((r) => (
          <div key={r.id} className="flex items-center gap-2 bg-slate-950/40 border border-slate-800 rounded px-2 py-1.5">
            {showColour && (
              editing?.id === r.id ? (
                <input type="color" value={editing.colour || "#64748b"} onChange={(e) => setEditing({ ...editing, colour: e.target.value })} className="w-8 h-8 bg-transparent border border-slate-700 rounded cursor-pointer" />
              ) : (
                <span className="w-5 h-5 rounded border border-slate-600 shrink-0" style={{ background: r.colour || "#64748b" }} />
              )
            )}
            {editing?.id === r.id ? (
              <input value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} className={inp + " flex-1 py-1"} />
            ) : (
              <span className="flex-1 text-sm text-slate-200">{r.value}</span>
            )}
            <input type="number" value={editing?.id === r.id ? editing.sort_order : r.sort_order} onChange={(e) => editing?.id === r.id && setEditing({ ...editing, sort_order: Number(e.target.value) })} disabled={editing?.id !== r.id} className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white disabled:opacity-50" title="Sort order" />
            {editing?.id === r.id ? (
              <>
                <button onClick={() => update(r, { value: editing.value, colour: editing.colour, sort_order: editing.sort_order })} className="p-1.5 text-green-400 hover:bg-green-600/20 rounded" title="Save"><Save size={14} /></button>
                <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded" title="Cancel"><X size={14} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(r)} className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded" title="Edit">Edit</button>
                <button onClick={() => remove(r)} className="p-1.5 text-red-400 hover:bg-red-600/20 rounded" title="Delete"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        {showColour && (
          <input type="color" value={draft.colour} onChange={(e) => setDraft({ ...draft, colour: e.target.value })} className="w-10 h-10 bg-transparent border border-slate-700 rounded cursor-pointer" />
        )}
        <input value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder={`Add new ${title.replace(" Manager", "").toLowerCase()}…`} className={inp + " flex-1"} />
        <button onClick={add} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5 shrink-0"><Plus size={14} />Add</button>
      </div>
    </div>
  );
}

function ReminderSettings() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_reminder_settings" as any).select("setting_key, setting_value");
    const m: Record<string, string> = {};
    (data || []).forEach((r: any) => { m[r.setting_key] = r.setting_value; });
    REMINDER_KEYS.forEach((k) => { if (m[k.key] === undefined) m[k.key] = k.default; });
    setVals(m);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveAll = async () => {
    for (const k of REMINDER_KEYS) {
      const value = vals[k.key] ?? k.default;
      const { data: existing } = await supabase.from("admin_reminder_settings" as any).select("id").eq("setting_key", k.key).maybeSingle();
      if (existing) {
        await supabase.from("admin_reminder_settings" as any).update({ setting_value: value }).eq("setting_key", k.key);
      } else {
        await supabase.from("admin_reminder_settings" as any).insert({ setting_key: k.key, setting_value: value });
      }
    }
    toast.success("Reminder settings saved");
  };

  if (loading) return <div className="text-slate-400 text-sm">Loading reminder settings…</div>;

  return (
    <div className="border border-slate-800 rounded-lg p-4">
      <div className="mb-3">
        <h4 className="font-semibold text-white text-sm">Reminder Configuration</h4>
        <p className="text-xs text-slate-500 mt-0.5">Daily birthday & anniversary reminder behaviour.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {REMINDER_KEYS.map((k) => (
          <label key={k.key} className="block">
            <span className="text-xs text-slate-400 mb-1 block">{k.label}</span>
            {k.type === "boolean" ? (
              <select value={vals[k.key] || "true"} onChange={(e) => setVals({ ...vals, [k.key]: e.target.value })} className={inp}>
                <option value="true">Enabled</option><option value="false">Disabled</option>
              </select>
            ) : (
              <input type="number" value={vals[k.key] ?? k.default} onChange={(e) => setVals({ ...vals, [k.key]: e.target.value })} className={inp} />
            )}
            {k.hint && <span className="text-[11px] text-slate-500 mt-1 block">{k.hint}</span>}
          </label>
        ))}
      </div>
      <button onClick={saveAll} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save Configuration</button>
    </div>
  );
}

function TemplateEditors() {
  const [birthday, setBirthday] = useState("");
  const [anniv, setAnniv] = useState("");
  const [loading, setLoading] = useState(true);
  const sample = { customer_name: "Ramesh Kumar", rank: "Gold", business_name: "Computer Solutions", years_count: "5", phone: "9876543210" };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_reminder_settings" as any).select("setting_key, setting_value").in("setting_key", ["birthday_template", "anniversary_template"]);
    (data || []).forEach((r: any) => {
      if (r.setting_key === "birthday_template") setBirthday(r.setting_value);
      if (r.setting_key === "anniversary_template") setAnniv(r.setting_value);
    });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const render = (tpl: string) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (sample as any)[k] || `{{${k}}}`);

  const saveOne = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("admin_reminder_settings" as any).select("id").eq("setting_key", key).maybeSingle();
    if (existing) {
      await supabase.from("admin_reminder_settings" as any).update({ setting_value: value }).eq("setting_key", key);
    } else {
      await supabase.from("admin_reminder_settings" as any).insert({ setting_key: key, setting_value: value });
    }
  };

  const saveAll = async () => {
    await saveOne("birthday_template", birthday);
    await saveOne("anniversary_template", anniv);
    toast.success("Templates saved");
  };

  if (loading) return null;

  return (
    <div className="border border-slate-800 rounded-lg p-4">
      <div className="mb-3">
        <h4 className="font-semibold text-white text-sm">Birthday & Anniversary Templates</h4>
        <p className="text-xs text-slate-500 mt-0.5">Used when sending wishes via WhatsApp.</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Birthday Message Template</label>
          <textarea rows={3} value={birthday} onChange={(e) => setBirthday(e.target.value)} className={inp + " font-mono text-xs"} />
          <div className="text-xs text-slate-300 mt-1.5 p-2 bg-slate-950 border border-slate-800 rounded"><span className="text-slate-500">Preview:</span> {render(birthday)}</div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Anniversary Message Template</label>
          <textarea rows={3} value={anniv} onChange={(e) => setAnniv(e.target.value)} className={inp + " font-mono text-xs"} />
          <div className="text-xs text-slate-300 mt-1.5 p-2 bg-slate-950 border border-slate-800 rounded"><span className="text-slate-500">Preview:</span> {render(anniv)}</div>
        </div>
        <div className="text-xs text-slate-500">
          Placeholders: {PLACEHOLDERS.map((p) => <code key={p} className="inline-block bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded mr-1 mb-1">{p}</code>)}
        </div>
        <button onClick={saveAll} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save Templates</button>
      </div>
    </div>
  );
}
