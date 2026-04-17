import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Download, Plus, Trash2, MessageSquare, Store, Database } from "lucide-react";

type Tab = "shop" | "templates" | "export";

const SHOP_KEYS = [
  { key: "shop_name", label: "Shop Name", placeholder: "The Computer Solutions" },
  { key: "shop_phone", label: "Shop Phone", placeholder: "+91 XXXXXXXXXX" },
  { key: "shop_whatsapp", label: "Shop WhatsApp", placeholder: "+91 XXXXXXXXXX" },
  { key: "shop_email", label: "Shop Email", placeholder: "you@example.com" },
  { key: "shop_address", label: "Shop Address", placeholder: "Full address", textarea: true },
  { key: "shop_gstin", label: "GSTIN", placeholder: "" },
  { key: "invoice_footer", label: "Invoice Footer Note", placeholder: "Thank you for your business", textarea: true },
];

const EXPORT_TABLES = [
  "crm_sales", "crm_enquiries", "crm_customers", "crm_catalogue",
  "crm_services", "crm_warranty_reminders", "crm_quote_shares", "crm_whatsapp_templates",
];

function downloadCSV(filename: string, rows: any[]) {
  if (!rows.length) { toast.error("No data to export"); return; }
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function CrmSettings() {
  const [tab, setTab] = useState<Tab>("shop");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from("crm_settings").select("*"),
      supabase.from("crm_whatsapp_templates").select("*").order("template_name"),
    ]);
    const map: Record<string, string> = {};
    (s || []).forEach((row: any) => { map[row.key] = row.value; });
    setSettings(map);
    setTemplates(t || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("crm_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("crm_settings").update({ value }).eq("id", existing.id);
      if (error) { toast.error(error.message); return false; }
    } else {
      const { error } = await supabase.from("crm_settings").insert([{ key, value }]);
      if (error) { toast.error(error.message); return false; }
    }
    return true;
  };

  const saveAllShop = async () => {
    let ok = true;
    for (const f of SHOP_KEYS) {
      if (!(await saveSetting(f.key, settings[f.key] || ""))) ok = false;
    }
    if (ok) toast.success("Settings saved");
  };

  const saveTemplate = async (t: any) => {
    if (!t.template_name || !t.message_body) { toast.error("Name and message required"); return; }
    if (t.id) {
      const { error } = await supabase.from("crm_whatsapp_templates")
        .update({ template_name: t.template_name, template_type: t.template_type, message_body: t.message_body })
        .eq("id", t.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("crm_whatsapp_templates").insert([{
        template_name: t.template_name, template_type: t.template_type || "warranty", message_body: t.message_body,
      }]);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Template saved");
    load();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const { error } = await supabase.from("crm_whatsapp_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  const addTemplate = () => {
    setTemplates([...templates, { template_name: "", template_type: "warranty", message_body: "", _new: true }]);
  };

  const updateTemplateField = (idx: number, field: string, value: string) => {
    const copy = [...templates];
    copy[idx] = { ...copy[idx], [field]: value };
    setTemplates(copy);
  };

  const exportTable = async (table: string) => {
    setExporting(table);
    const { data, error } = await supabase.from(table as any).select("*");
    setExporting(null);
    if (error) { toast.error(error.message); return; }
    downloadCSV(`${table}_${new Date().toISOString().slice(0, 10)}.csv`, data || []);
    toast.success(`Exported ${data?.length || 0} rows`);
  };

  const exportAll = async () => {
    for (const t of EXPORT_TABLES) await exportTable(t);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400">Shop info, WhatsApp templates, and data exports</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800">
        {[
          { id: "shop" as Tab, label: "Shop Info", icon: Store },
          { id: "templates" as Tab, label: "WhatsApp Templates", icon: MessageSquare },
          { id: "export" as Tab, label: "Data Export", icon: Database },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 -mb-px ${tab === t.id ? "border-blue-500 text-blue-300" : "border-transparent text-slate-400 hover:text-white"}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : tab === "shop" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 max-w-2xl space-y-4">
          {SHOP_KEYS.map(f => (
            <label key={f.key} className="block">
              <span className="text-sm text-slate-300 mb-1 block">{f.label}</span>
              {f.textarea ? (
                <textarea
                  value={settings[f.key] || ""}
                  onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-500"
                />
              ) : (
                <input
                  value={settings[f.key] || ""}
                  onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-500"
                />
              )}
            </label>
          ))}
          <button onClick={saveAllShop} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded">
            <Save size={16} /> Save All
          </button>
        </div>
      ) : tab === "templates" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Use placeholders: <code className="bg-slate-800 px-1 rounded">{"{name}"}</code> <code className="bg-slate-800 px-1 rounded">{"{item}"}</code> <code className="bg-slate-800 px-1 rounded">{"{date}"}</code> <code className="bg-slate-800 px-1 rounded">{"{expiry}"}</code> <code className="bg-slate-800 px-1 rounded">{"{phone}"}</code></p>
            <button onClick={addTemplate} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded">
              <Plus size={14} /> Add Template
            </button>
          </div>
          {templates.map((t, idx) => (
            <div key={t.id || idx} className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={t.template_name || ""}
                  onChange={e => updateTemplateField(idx, "template_name", e.target.value)}
                  placeholder="Template name (e.g. warranty_1month)"
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-500"
                />
                <select
                  value={t.template_type || "warranty"}
                  onChange={e => updateTemplateField(idx, "template_type", e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-white"
                >
                  {["warranty", "service", "birthday", "promo", "general"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <textarea
                value={t.message_body || ""}
                onChange={e => updateTemplateField(idx, "message_body", e.target.value)}
                placeholder="Message body..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-500"
              />
              <div className="flex justify-end gap-2">
                {t.id && <button onClick={() => deleteTemplate(t.id)} className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:bg-red-500/10 text-sm rounded"><Trash2 size={14} /> Delete</button>}
                <button onClick={() => saveTemplate(t)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"><Save size={14} /> Save</button>
              </div>
            </div>
          ))}
          {templates.length === 0 && <div className="text-slate-500 text-sm text-center py-8">No templates yet</div>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-medium">Export all CRM data</h3>
                <p className="text-xs text-slate-400 mt-1">Downloads a CSV file for each table</p>
              </div>
              <button onClick={exportAll} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded">
                <Download size={16} /> Export All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {EXPORT_TABLES.map(t => (
                <button
                  key={t}
                  onClick={() => exportTable(t)}
                  disabled={exporting === t}
                  className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-slate-300 hover:border-blue-500/50 disabled:opacity-50"
                >
                  <span className="font-mono text-xs">{t}</span>
                  <Download size={14} className={exporting === t ? "animate-pulse" : ""} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
