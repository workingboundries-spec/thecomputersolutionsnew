import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invalidateAdminSettings } from "@/crm/hooks/useAdminSettings";
import { brandingFromMap } from "@/crm/lib/quotationBranding";
import { QuotationHeaderPreview, QuotationPreview } from "@/crm/components/QuotationPreview";
import CustomerSettingsTab from "@/crm/components/CustomerSettingsTab";
import { toast } from "sonner";
import { Save, X, Plus, Download, Upload, Eye } from "lucide-react";

const TABS = ["Shop Info", "Branding & Quotation Style", "Dropdowns", "WhatsApp Templates", "Quotation", "Customer Settings", "Reminders", "Stock", "Data Export"] as const;

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
          {tab === "Branding & Quotation Style" && <Branding get={get} settings={settings} onSave={saveMany} />}
          {tab === "Dropdowns" && <Dropdowns getJson={getJson} onSave={saveMany} />}
          {tab === "WhatsApp Templates" && <Templates get={get} onSave={saveMany} />}
          {tab === "Quotation" && <QuotationSettings get={get} onSave={saveMany} />}
          {tab === "Customer Settings" && <CustomerSettingsTab />}
          {tab === "Reminders" && <ReminderSettings />}
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
    default_gst_percent: get("default_gst_percent", "0"),
    default_validity_days: get("default_validity_days", "7"),
    quotation_terms: get("quotation_terms"),
    quote_prefix: get("quote_prefix", "QT"),
    invoice_prefix: get("invoice_prefix", "INV"),
    quotation_message_template: get("quotation_message_template"),
  });
  // Lazy import the default so the admin page doesn't pull message lib unless needed.
  const DEFAULT_TPL = `*{{company_name}}*
Quotation: *{{quote_no}}*
Date: {{date}}

Dear {{client_name}},
Thank you for your enquiry. Please find your quotation below.

{{items_table}}

Subtotal : {{subtotal}}
Discount : {{discount}}
*GRAND TOTAL : {{grand_total}}*

Valid till: {{validity_date}}

Notes:
{{notes}}

For any queries, contact us:
📞 {{shop_phone}}
✉ {{shop_email}}

🖼 Quotation image: {{image_url}}
🔗 View online: {{online_url}}

— {{company_name}}`;

  const tplValue = vals.quotation_message_template || "";
  const placeholders = [
    "{{company_name}}", "{{client_name}}", "{{quote_no}}", "{{date}}",
    "{{validity_date}}", "{{items_table}}", "{{subtotal}}", "{{discount}}",
    "{{grand_total}}", "{{notes}}", "{{shop_phone}}", "{{shop_email}}",
    "{{image_url}}", "{{online_url}}",
  ];

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Default GST %"><input type="number" min={0} placeholder="0" value={vals.default_gst_percent} onChange={(e) => setVals({ ...vals, default_gst_percent: e.target.value })} className={inp} /><span className="text-[11px] text-slate-500 mt-1 block">Leave 0 if GST not applicable</span></Field>
        <Field label="Default Validity Days"><input type="number" value={vals.default_validity_days} onChange={(e) => setVals({ ...vals, default_validity_days: e.target.value })} className={inp} /></Field>
        <Field label="Quote Number Prefix"><input value={vals.quote_prefix} onChange={(e) => setVals({ ...vals, quote_prefix: e.target.value })} className={inp} /></Field>
        <Field label="Invoice Number Prefix"><input value={vals.invoice_prefix} onChange={(e) => setVals({ ...vals, invoice_prefix: e.target.value })} className={inp} /></Field>
      </div>
      <Field label="Default Terms & Conditions"><textarea rows={3} value={vals.quotation_terms} onChange={(e) => setVals({ ...vals, quotation_terms: e.target.value })} className={inp} /></Field>

      <div className="border border-slate-800 rounded p-3 mt-2 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-white text-sm">Quotation Message Template (WhatsApp / Email)</h4>
          <button
            type="button"
            onClick={() => setVals({ ...vals, quotation_message_template: DEFAULT_TPL })}
            className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
          >Reset to default</button>
        </div>
        <textarea
          rows={14}
          value={tplValue}
          placeholder={DEFAULT_TPL}
          onChange={(e) => setVals({ ...vals, quotation_message_template: e.target.value })}
          className={inp + " font-mono text-xs"}
        />
        <div className="text-xs text-slate-500 mt-2">
          Available placeholders:&nbsp;
          {placeholders.map((p) => (
            <code key={p} className="inline-block bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded mr-1 mb-1">{p}</code>
          ))}
        </div>
      </div>

      <button onClick={() => onSave([
        { key: "default_gst_percent", value: vals.default_gst_percent, type: "number" },
        { key: "default_validity_days", value: vals.default_validity_days, type: "number" },
        { key: "quotation_terms", value: vals.quotation_terms },
        { key: "quote_prefix", value: vals.quote_prefix },
        { key: "invoice_prefix", value: vals.invoice_prefix },
        { key: "quotation_message_template", value: vals.quotation_message_template },
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

// ===================== Branding & Quotation Style =====================
const BRANDING_KEYS = [
  { key: "quotation_primary_color", label: "Header & Table Background", default: "#1a1a2e" },
  { key: "quotation_accent_color", label: "Highlight & Total Bar Color", default: "#e94560" },
  { key: "quotation_font_color", label: "Main Text Color", default: "#1a1a2e" },
  { key: "quotation_bg_color", label: "Paper Background", default: "#ffffff" },
];

function Branding({ get, settings, onSave }: any) {
  const [logoUrl, setLogoUrl] = useState(get("shop_logo_url"));
  const [colors, setColors] = useState<Record<string, string>>(() =>
    Object.fromEntries(BRANDING_KEYS.map((b) => [b.key, get(b.key, b.default) || b.default]))
  );
  const [footerText, setFooterText] = useState(get("quotation_footer_text", "Thank you for your business!"));
  const [watermark, setWatermark] = useState(get("quotation_watermark", "QUOTATION"));
  const [uploading, setUploading] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const liveBranding = brandingFromMap({
    shop_logo_url: logoUrl,
    quotation_primary_color: colors.quotation_primary_color,
    quotation_accent_color: colors.quotation_accent_color,
    quotation_font_color: colors.quotation_font_color,
    quotation_bg_color: colors.quotation_bg_color,
    quotation_footer_text: footerText,
    quotation_watermark: watermark,
    shop_name: get("shop_name", "The Computer Solutions"),
    shop_address: get("shop_address"),
    shop_phone: get("shop_phone"),
    shop_email: get("shop_email"),
    shop_gst: get("shop_gst"),
    shop_website: get("shop_website"),
  });

  const handleUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) return toast.error("Max 2MB");
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("shop-assets").upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("shop-assets").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Logo uploaded — click Save Logo to apply");
  };

  const sampleQuote = {
    quote_no: "QT-SAMPLE-001",
    customer_name: "Sample Customer",
    phone: "9876543210", whatsapp: "9876543210", email: "customer@example.com",
    address: "123 Main Street, City",
    items: [
      { name: "HP Laptop 15s-eq2143au", qty: 1, price: 49999, discount_pct: 5 },
      { name: "Laptop Carry Bag", qty: 1, price: 999, discount_pct: 0 },
    ],
    subtotal: 50998, discount: 2500, gst_percent: 18, gst_amount: 8729.64, total_amount: 57227.64,
    validity_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
    notes: "Includes 1 year manufacturer warranty.",
    terms: "Prices valid for 7 days. GST extra. Payment in advance.",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Section 1: Logo */}
      <section className="border border-slate-800 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">1. Shop Logo</h3>
        <div className="flex items-center gap-4 mb-3">
          <div className="bg-white border border-slate-700 rounded p-2 h-20 w-32 flex items-center justify-center">
            {logoUrl ? <img src={logoUrl} alt="logo" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-slate-400">No logo</span>}
          </div>
          <div className="flex-1 space-y-2">
            <label className="block">
              <span className="text-xs text-slate-400 block mb-1">Upload Logo (PNG/JPG/SVG, max 2MB)</span>
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" disabled={uploading} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} className="block w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-xs hover:file:bg-blue-500" />
              {uploading && <span className="text-xs text-blue-400">Uploading…</span>}
            </label>
            <Field label="…or paste logo URL"><input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" className={inp} /></Field>
          </div>
        </div>
        <button onClick={() => onSave([{ key: "shop_logo_url", value: logoUrl }])} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save Logo</button>
      </section>

      {/* Section 2: Colors */}
      <section className="border border-slate-800 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">2. Quotation Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {BRANDING_KEYS.map((b) => (
            <div key={b.key} className="flex items-center gap-3">
              <input type="color" value={colors[b.key]} onChange={(e) => setColors({ ...colors, [b.key]: e.target.value })} className="w-12 h-10 rounded border border-slate-700 bg-slate-800 cursor-pointer" />
              <div className="flex-1">
                <div className="text-xs text-slate-400">{b.label}</div>
                <input value={colors[b.key]} onChange={(e) => setColors({ ...colors, [b.key]: e.target.value })} className={inp + " font-mono text-xs mt-1"} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-950 rounded p-3 mb-3">
          <div className="text-xs text-slate-500 mb-2">Live Preview</div>
          <QuotationHeaderPreview b={liveBranding} />
        </div>

        <button onClick={() => onSave(BRANDING_KEYS.map((b) => ({ key: b.key, value: colors[b.key] })))} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save Colors</button>
      </section>

      {/* Section 3: Footer & Watermark */}
      <section className="border border-slate-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-white">3. Footer & Watermark</h3>
        <Field label="Footer text"><input value={footerText} onChange={(e) => setFooterText(e.target.value)} className={inp} /></Field>
        <Field label="Watermark / Document label"><input value={watermark} onChange={(e) => setWatermark(e.target.value)} className={inp} /></Field>
        <button onClick={() => onSave([{ key: "quotation_footer_text", value: footerText }, { key: "quotation_watermark", value: watermark }])} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save</button>
      </section>

      {/* Section 4: Full Preview */}
      <section className="border border-slate-800 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">4. Preview Sample Quotation</h3>
        <button onClick={() => setShowFullPreview(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm flex items-center gap-1.5"><Eye size={14} />Preview Sample Quotation</button>
      </section>

      {showFullPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowFullPreview(false)}>
          <div className="bg-white rounded-lg my-8 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setShowFullPreview(false)} className="text-slate-600 hover:bg-slate-200 rounded p-1"><X size={18} /></button>
            </div>
            <QuotationPreview q={sampleQuote as any} b={liveBranding} />
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== Reminder Settings =====================
const REMINDER_FIELDS = [
  { key: "birthday_lead_days", label: "Birthday Lead Days", default: "1", type: "number", hint: "Insert into queue this many days before birthday" },
  { key: "anniversary_lead_days", label: "Anniversary Lead Days", default: "1", type: "number", hint: "Insert into queue this many days before anniversary" },
  { key: "birthday_enabled", label: "Birthday Reminders Enabled", default: "true", type: "boolean", hint: "" },
  { key: "anniversary_enabled", label: "Anniversary Reminders Enabled", default: "true", type: "boolean", hint: "" },
];

const REMINDER_TEMPLATES = [
  { key: "birthday_template", label: "Birthday Wish Template", default: "Dear {{customer_name}}, wishing you a very Happy Birthday from The Computer Solutions! 🎂" },
  { key: "anniversary_template", label: "Anniversary Wish Template", default: "Dear {{customer_name}}, congratulations on your anniversary! Best wishes from The Computer Solutions. 💐" },
];

function ReminderSettings() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_reminder_settings").select("setting_key, setting_value");
    const m: Record<string, string> = {};
    [...REMINDER_FIELDS, ...REMINDER_TEMPLATES].forEach((f) => { m[f.key] = f.default; });
    (data || []).forEach((r: any) => { m[r.setting_key] = r.setting_value ?? ""; });
    setVals(m);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (entries: { key: string; value: string }[]) => {
    for (const e of entries) {
      const { data: existing } = await supabase.from("admin_reminder_settings").select("id").eq("setting_key", e.key).maybeSingle();
      const op = existing
        ? await supabase.from("admin_reminder_settings").update({ setting_value: e.value }).eq("setting_key", e.key)
        : await supabase.from("admin_reminder_settings").insert({ setting_key: e.key, setting_value: e.value });
      if (op.error) { toast.error(op.error.message); return; }
    }
    toast.success("Reminder settings saved");
    load();
  };

  if (loading) return <div className="text-slate-400">Loading…</div>;

  const sample = { customer_name: "Ramesh", rank: "Gold", years_count: "5", phone: "9876543210" };
  const render = (tpl: string) => (tpl || "").replace(/\{\{(\w+)\}\}/g, (_, k) => (sample as any)[k] ?? `{{${k}}}`);

  return (
    <div className="space-y-6 max-w-3xl">
      <section className="border border-slate-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-white">Schedule & Toggles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REMINDER_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === "boolean" ? (
                <select value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} className={inp}>
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <input type="number" min={0} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} className={inp} />
              )}
              {f.hint && <span className="text-[11px] text-slate-500 mt-1 block">{f.hint}</span>}
            </Field>
          ))}
        </div>
        <button onClick={() => save(REMINDER_FIELDS.map((f) => ({ key: f.key, value: vals[f.key] || f.default })))} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save Schedule</button>
      </section>

      <section className="border border-slate-800 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-white">Wish Message Templates</h3>
        {REMINDER_TEMPLATES.map((t) => (
          <div key={t.key} className="border border-slate-800 rounded p-3">
            <label className="text-sm font-semibold text-white mb-1 block">{t.label}</label>
            <textarea rows={3} value={vals[t.key] || ""} onChange={(e) => setVals({ ...vals, [t.key]: e.target.value })} className={inp} />
            <div className="text-xs text-slate-500 mt-1">Available: {"{{customer_name}} {{rank}} {{years_count}} {{phone}}"}</div>
            <div className="text-xs text-slate-300 mt-2 p-2 bg-slate-950 border border-slate-800 rounded"><span className="text-slate-500">Preview:</span> {render(vals[t.key] || "")}</div>
          </div>
        ))}
        <button onClick={() => save(REMINDER_TEMPLATES.map((t) => ({ key: t.key, value: vals[t.key] || t.default })))} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />Save Templates</button>
      </section>
    </div>
  );
}
