import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invalidateAdminSettings } from "@/crm/hooks/useAdminSettings";
import { brandingFromMap } from "@/crm/lib/quotationBranding";
import { QuotationHeaderPreview, QuotationPreview } from "@/crm/components/QuotationPreview";
import { toast } from "sonner";
import { Save, X, Plus, Download, Upload, Eye } from "lucide-react";

const TABS = ["Shop Info", "Branding & Quotation Style", "Dropdowns", "WhatsApp Templates", "Quotation", "Stock", "Data Export"] as const;

const TEMPLATE_KEYS = [
  { key: "whatsapp_week_template", label: "After 1 Week" },
  { key: "whatsapp_month_template", label: "After 1 Month" },
  { key: "whatsapp_3month_template", label: "After 3 Months" },
  { key: "whatsapp_6month_template", label: "After 6 Months" },
  { key: "whatsapp_11month_template", label: "After 11 Months" },
  { key: "whatsapp_birthday_template", label: "Birthday Wish" },
];

const DROPDOWN_KEYS = [
  { key: "enquiry_categories", label: "Enquiry Categories" },
  { key: "enquiry_statuses", label: "Enquiry Statuses" },
  { key: "sale_payment_modes", label: "Payment Modes" },
  { key: "service_statuses", label: "Service Job Statuses" },
  { key: "catalogue_categories", label: "Catalogue Categories" },
];

const SHOP_KEYS = ["shop_name", "shop_address", "shop_phone", "shop_whatsapp", "shop_gst", "shop_email", "shop_website"];
const SHOP_LABELS: Record<string, string> = {
  shop_name: "Shop Name", shop_address: "Address", shop_phone: "Phone", shop_whatsapp: "WhatsApp",
  shop_gst: "GST Number", shop_email: "Email", shop_website: "Website",
};

export default function CrmAdmin() {
  const [tab, setTab] = useState<typeof TABS[number]>("Shop Info");
  const [settings, setSettings] = useState<Record<string, { value: string; type: string }>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("crm_admin_settings").select("setting_key, setting_value, setting_type");
    const m: Record<string, { value: string; type: string }> = {};
    (data || []).forEach((r: any) => { m[r.setting_key] = { value: r.setting_value || "", type: r.setting_type || "text" }; });
    setSettings(m);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveOne = async (key: string, value: string, type = "text") => {
    const exists = !!settings[key];
    const { error } = exists
      ? await supabase.from("crm_admin_settings").update({ setting_value: value, setting_type: type }).eq("setting_key", key)
      : await supabase.from("crm_admin_settings").insert({ setting_key: key, setting_value: value, setting_type: type });
    if (error) { toast.error(error.message); return false; }
    return true;
  };

  const saveMany = async (entries: { key: string; value: string; type?: string }[]) => {
    let ok = true;
    for (const e of entries) {
      if (!(await saveOne(e.key, e.value, e.type || "text"))) ok = false;
    }
    if (ok) {
      toast.success("Saved");
      invalidateAdminSettings();
      load();
    }
  };

  const get = (k: string, fallback = "") => settings[k]?.value || fallback;
  const getJson = (k: string): string[] => { try { return JSON.parse(settings[k]?.value || "[]"); } catch { return []; } };

  if (loading) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-sm text-slate-400">Manage shop info, dropdowns, templates, and exports</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-800">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-medium transition-colors ${tab === t ? "bg-slate-800 text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-white"}`}>{t}</button>
          ))}
        </div>

        <div className="p-5">
          {tab === "Shop Info" && <ShopInfo get={get} onSave={saveMany} />}
          {tab === "Dropdowns" && <Dropdowns getJson={getJson} onSave={saveMany} />}
          {tab === "WhatsApp Templates" && <Templates get={get} onSave={saveMany} />}
          {tab === "Quotation" && <QuotationSettings get={get} onSave={saveMany} />}
          {tab === "Stock" && <StockSettings get={get} onSave={saveMany} />}
          {tab === "Data Export" && <DataExport />}
        </div>
      </div>
    </div>
  );
}

function ShopInfo({ get, onSave }: any) {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(SHOP_KEYS.map((k) => [k, get(k)])));
  return (
    <div className="space-y-3 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SHOP_KEYS.map((k) => (
          <Field key={k} label={SHOP_LABELS[k]}><input value={vals[k] || ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} className={inp} /></Field>
        ))}
      </div>
      <button onClick={() => onSave(SHOP_KEYS.map((k) => ({ key: k, value: vals[k] || "" })))} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save Shop Info</button>
    </div>
  );
}

function Dropdowns({ getJson, onSave }: any) {
  return (
    <div className="space-y-6">
      {DROPDOWN_KEYS.map((d) => <ChipEditor key={d.key} settingKey={d.key} label={d.label} initial={getJson(d.key)} onSave={onSave} />)}
    </div>
  );
}

function ChipEditor({ settingKey, label, initial, onSave }: any) {
  const [chips, setChips] = useState<string[]>(initial || []);
  const [newChip, setNewChip] = useState("");
  const add = () => { if (newChip.trim() && !chips.includes(newChip.trim())) { setChips([...chips, newChip.trim()]); setNewChip(""); } };
  return (
    <div className="border border-slate-800 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-white text-sm">{label}</h4>
        <button onClick={() => onSave([{ key: settingKey, value: JSON.stringify(chips), type: "json" }])} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1"><Save size={12} />Save</button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {chips.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200">
            {c}
            <button onClick={() => setChips(chips.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300"><X size={12} /></button>
          </span>
        ))}
        {chips.length === 0 && <span className="text-xs text-slate-500">No items</span>}
      </div>
      <div className="flex gap-1.5">
        <input value={newChip} onChange={(e) => setNewChip(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="Add new…" className={inp + " flex-1"} />
        <button onClick={add} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs flex items-center gap-1"><Plus size={12} />Add</button>
      </div>
    </div>
  );
}

function Templates({ get, onSave }: any) {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(TEMPLATE_KEYS.map((t) => [t.key, get(t.key)])));
  const sample = { name: "Ramesh", phone: "9876543210", item: "HP Laptop 15s", purchase_date: "10 Jan 2026", expiry: "10 Jan 2027", shop_phone: get("shop_phone"), shop_name: get("shop_name") };
  const render = (tpl: string) => tpl.replace(/\{(\w+)\}/g, (_: any, k: string) => (sample as any)[k] ?? `{${k}}`);
  return (
    <div className="space-y-4 max-w-3xl">
      {TEMPLATE_KEYS.map((t) => (
        <div key={t.key} className="border border-slate-800 rounded p-3">
          <label className="text-sm font-semibold text-white mb-1 block">{t.label}</label>
          <textarea rows={3} value={vals[t.key] || ""} onChange={(e) => setVals({ ...vals, [t.key]: e.target.value })} className={inp} />
          <div className="text-xs text-slate-500 mt-1">Available: {"{name} {phone} {item} {purchase_date} {expiry} {shop_phone} {shop_name}"}</div>
          <div className="text-xs text-slate-300 mt-2 p-2 bg-slate-950 border border-slate-800 rounded"><span className="text-slate-500">Preview:</span> {render(vals[t.key] || "")}</div>
        </div>
      ))}
      <button onClick={() => onSave(TEMPLATE_KEYS.map((t) => ({ key: t.key, value: vals[t.key] || "" })))} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save All Templates</button>
    </div>
  );
}

function QuotationSettings({ get, onSave }: any) {
  const [vals, setVals] = useState({
    default_gst_percent: get("default_gst_percent", "18"),
    default_validity_days: get("default_validity_days", "7"),
    quotation_terms: get("quotation_terms"),
    quote_prefix: get("quote_prefix", "QT"),
    invoice_prefix: get("invoice_prefix", "INV"),
  });
  return (
    <div className="space-y-3 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Default GST %"><input type="number" value={vals.default_gst_percent} onChange={(e) => setVals({ ...vals, default_gst_percent: e.target.value })} className={inp} /></Field>
        <Field label="Default Validity Days"><input type="number" value={vals.default_validity_days} onChange={(e) => setVals({ ...vals, default_validity_days: e.target.value })} className={inp} /></Field>
        <Field label="Quote Number Prefix"><input value={vals.quote_prefix} onChange={(e) => setVals({ ...vals, quote_prefix: e.target.value })} className={inp} /></Field>
        <Field label="Invoice Number Prefix"><input value={vals.invoice_prefix} onChange={(e) => setVals({ ...vals, invoice_prefix: e.target.value })} className={inp} /></Field>
      </div>
      <Field label="Default Terms & Conditions"><textarea rows={3} value={vals.quotation_terms} onChange={(e) => setVals({ ...vals, quotation_terms: e.target.value })} className={inp} /></Field>
      <button onClick={() => onSave([
        { key: "default_gst_percent", value: vals.default_gst_percent, type: "number" },
        { key: "default_validity_days", value: vals.default_validity_days, type: "number" },
        { key: "quotation_terms", value: vals.quotation_terms },
        { key: "quote_prefix", value: vals.quote_prefix },
        { key: "invoice_prefix", value: vals.invoice_prefix },
      ])} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save</button>
    </div>
  );
}

function StockSettings({ get, onSave }: any) {
  const [vals, setVals] = useState({
    low_stock_threshold: get("low_stock_threshold", "3"),
    show_out_of_stock: get("show_out_of_stock", "true"),
  });
  return (
    <div className="space-y-3 max-w-md">
      <Field label="Low Stock Alert Threshold"><input type="number" value={vals.low_stock_threshold} onChange={(e) => setVals({ ...vals, low_stock_threshold: e.target.value })} className={inp} /></Field>
      <Field label="Show Out-of-Stock Items in Catalogue">
        <select value={vals.show_out_of_stock} onChange={(e) => setVals({ ...vals, show_out_of_stock: e.target.value })} className={inp}>
          <option value="true">Show</option><option value="false">Hide</option>
        </select>
      </Field>
      <button onClick={() => onSave([
        { key: "low_stock_threshold", value: vals.low_stock_threshold, type: "number" },
        { key: "show_out_of_stock", value: vals.show_out_of_stock, type: "boolean" },
      ])} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save</button>
    </div>
  );
}

const EXPORTS: { label: string; table: string; cols: string[] }[] = [
  { label: "All Enquiries", table: "crm_enquiries", cols: ["created_at", "customer_name", "phone", "whatsapp", "product_category", "item_name", "budget", "status", "source", "is_converted"] },
  { label: "All Sales", table: "crm_sales", cols: ["sale_date", "invoice_no", "customer_name", "phone", "item_name", "qty", "sale_price", "total_amount", "payment_status", "payment_mode", "is_deleted"] },
  { label: "All Customers", table: "crm_customers", cols: ["created_at", "name", "phone", "whatsapp", "email", "address", "dob", "total_purchases", "total_value"] },
  { label: "All Service Jobs", table: "crm_services", cols: ["received_date", "job_card_no", "customer_name", "phone", "device_type", "brand", "model", "status", "estimated_cost", "final_cost"] },
  { label: "Current Stock", table: "crm_catalogue", cols: ["brand", "model", "category", "stock_qty", "nlc_price", "sale_price", "mrp", "is_active"] },
  { label: "All Reminders", table: "crm_warranty_reminders", cols: ["scheduled_date", "customer_name", "phone", "item_name", "reminder_type", "status", "message_sent"] },
];

function DataExport() {
  const exportTable = async (e: typeof EXPORTS[number]) => {
    const { data, error } = await supabase.from(e.table as any).select(e.cols.join(","));
    if (error) return toast.error(error.message);
    const rows = data || [];
    const csv = [e.cols.join(","), ...rows.map((r: any) => e.cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${e.table}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success(`Exported ${rows.length} rows`);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
      {EXPORTS.map((e) => (
        <button key={e.table} onClick={() => exportTable(e)} className="flex items-center justify-between gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-sm text-white">
          <span>{e.label}</span>
          <Download size={14} />
        </button>
      ))}
    </div>
  );
}

const inp = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500";
const Field = ({ label, children }: any) => <label className="block"><span className="text-xs text-slate-400 mb-1 block">{label}</span>{children}</label>;
