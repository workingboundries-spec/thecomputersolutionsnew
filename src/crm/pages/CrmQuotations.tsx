import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate, todayISO, addDays } from "@/crm/lib/format";
import { useAdminSettings } from "@/crm/hooks/useAdminSettings";
import { useQuotationBranding } from "@/crm/lib/quotationBranding";
import { QuotationPreview } from "@/crm/components/QuotationPreview";
import QuotationTemplatesTab from "@/crm/components/QuotationTemplatesTab";
import SendQuotationPanel from "@/crm/components/SendQuotationPanel";
import { toast } from "sonner";
import { Plus, Search, Eye, Edit2, Trash2, Printer, X, FileText, Download, FileStack, ListOrdered, Send } from "lucide-react";
import html2canvas from "html2canvas";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-slate-500/15 text-slate-300",
  sent: "bg-blue-500/15 text-blue-300",
  accepted: "bg-green-500/15 text-green-300",
  rejected: "bg-red-500/15 text-red-300",
};

type QItem = { name: string; qty: number; price: number; discount_pct: number };

const emptyForm = () => ({
  id: null as string | null,
  quote_no: "",
  enquiry_id: null as string | null,
  customer_name: "", phone: "", whatsapp: "", email: "", address: "",
  items: [] as QItem[],
  subtotal: 0, discount: 0, gst_percent: 0, gst_amount: 0, total_amount: 0,
  validity_days: 7, validity_date: addDays(todayISO(), 7),
  notes: "", terms: "", status: "draft",
  _from_template_id: null as string | null,
});

function calcTotals(items: QItem[], gstPct: number) {
  const subtotal = items.reduce((s, it) => s + (Number(it.qty || 0) * Number(it.price || 0)), 0);
  const discount = items.reduce((s, it) => s + (Number(it.qty || 0) * Number(it.price || 0) * Number(it.discount_pct || 0) / 100), 0);
  const taxable = subtotal - discount;
  const gst_amount = taxable * Number(gstPct || 0) / 100;
  const total_amount = taxable + gst_amount;
  return { subtotal, discount, gst_amount, total_amount };
}

async function nextQuoteNo(prefix: string) {
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const stem = `${prefix}-${ymd}`;
  const { data } = await supabase.from("crm_quotations").select("quote_no").like("quote_no", `${stem}-%`).order("quote_no", { ascending: false }).limit(1);
  let n = 1;
  if (data && data[0]) {
    const last = data[0].quote_no.split("-").pop();
    n = (parseInt(last || "0", 10) || 0) + 1;
  }
  return `${stem}-${String(n).padStart(3, "0")}`;
}

export default function CrmQuotations() {
  const settings = useAdminSettings(["default_gst_percent", "default_validity_days", "quotation_terms", "quote_prefix"]);
  const branding = useQuotationBranding();
  const [tab, setTab] = useState<"list" | "templates">("list");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [previewQ, setPreviewQ] = useState<any>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [qRes, cRes, eRes] = await Promise.all([
      supabase.from("crm_quotations").select("*").order("created_at", { ascending: false }),
      supabase.from("crm_catalogue").select("id, brand, model, sale_price, stock_qty").eq("is_active", true),
      supabase.from("crm_enquiries").select("id, customer_name, phone, item_name").eq("is_converted", false),
    ]);
    if (qRes.error) toast.error(qRes.error.message);
    setRows(qRes.data || []);
    setCatalogue(cRes.data || []);
    setEnquiries(eRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = async () => {
    const f = emptyForm();
    f.gst_percent = Number(settings.default_gst_percent || 0);
    f.validity_days = Number(settings.default_validity_days || 7);
    f.validity_date = addDays(todayISO(), f.validity_days);
    f.terms = settings.quotation_terms || "";
    f.quote_no = await nextQuoteNo(settings.quote_prefix || "QT");
    setForm(f);
    setShowForm(true);
  };

  const openFromTemplate = async (t: any) => {
    const f = emptyForm();
    f.gst_percent = Number(t.gst_percent ?? settings.default_gst_percent ?? 0);
    f.validity_days = Number(settings.default_validity_days || 7);
    f.validity_date = addDays(todayISO(), f.validity_days);
    f.notes = t.notes || "";
    f.terms = t.terms || settings.quotation_terms || "";
    f.items = (t.items || []).map((it: any) => ({ name: it.name, qty: Number(it.qty || 1), price: Number(it.price || 0), discount_pct: Number(it.discount_pct || 0) }));
    f.quote_no = await nextQuoteNo(settings.quote_prefix || "QT");
    f._from_template_id = t.id;
    setForm(f);
    setTab("list");
    setShowForm(true);
    toast.success(`Loaded template: ${t.template_name}`);
  };

  const openEdit = (r: any) => {
    setForm({ ...emptyForm(), ...r, items: Array.isArray(r.items) ? r.items : [] });
    setShowForm(true);
  };

  const updateItem = (idx: number, patch: Partial<QItem>) => {
    const items = form.items.map((it, i) => i === idx ? { ...it, ...patch } : it);
    setForm({ ...form, items });
  };
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const addItem = () => setForm({ ...form, items: [...form.items, { name: "", qty: 1, price: 0, discount_pct: 0 }] });
  const addFromCatalogue = (it: any) => {
    setForm({ ...form, items: [...form.items, { name: `${it.brand} ${it.model}`, qty: 1, price: Number(it.sale_price || 0), discount_pct: 0 }] });
    setShowPicker(false);
  };

  const totals = useMemo(() => calcTotals(form.items, form.gst_percent), [form.items, form.gst_percent]);

  const save = async (asStatus?: string) => {
    if (!form.customer_name || !form.phone) return toast.error("Customer name and phone required");
    if (form.items.length === 0) return toast.error("Add at least one item");
    const t = calcTotals(form.items, form.gst_percent);
    const payload: any = {
      quote_no: form.quote_no,
      enquiry_id: form.enquiry_id || null,
      customer_name: form.customer_name,
      phone: form.phone,
      whatsapp: form.whatsapp || form.phone,
      email: form.email || null,
      address: form.address || null,
      items: form.items,
      subtotal: t.subtotal,
      discount: t.discount,
      gst_percent: Number(form.gst_percent || 0),
      gst_amount: t.gst_amount,
      total_amount: t.total_amount,
      validity_days: Number(form.validity_days || 7),
      validity_date: form.validity_date,
      notes: form.notes || null,
      terms: form.terms || null,
      status: asStatus === "preview" ? form.status : (asStatus || form.status),
    };
    let savedRow: any = null;
    if (form.id) {
      const { data, error } = await supabase.from("crm_quotations").update(payload).eq("id", form.id).select("*").single();
      if (error) return toast.error(error.message);
      savedRow = data;
    } else {
      const { data, error } = await supabase.from("crm_quotations").insert(payload).select("*").single();
      if (error) return toast.error(error.message);
      savedRow = data;
    }
    if (form.enquiry_id) {
      await supabase.from("crm_enquiries").update({ status: "quoted" }).eq("id", form.enquiry_id);
    }
    // Increment template usage
    if (form._from_template_id && !form.id) {
      const { data: tpl } = await supabase.from("quotation_templates" as any).select("used_count").eq("id", form._from_template_id).single();
      const cur = Number((tpl as any)?.used_count || 0);
      await supabase.from("quotation_templates" as any).update({ used_count: cur + 1 }).eq("id", form._from_template_id);
    }
    toast.success("Quotation saved");
    setShowForm(false);
    load();
    if (asStatus === "preview") setPreviewQ(savedRow);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this quotation?")) return;
    const { error } = await supabase.from("crm_quotations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const filtered = rows.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.customer_name?.toLowerCase().includes(q) && !r.quote_no?.toLowerCase().includes(q) && !r.phone?.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Quotations</h1>
          <p className="text-sm text-slate-400">{tab === "list" ? `${filtered.length} of ${rows.length} quotes` : "Manage reusable quote templates"}</p>
        </div>
        {tab === "list" && (
          <button onClick={openNew} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Plus size={14} />New Quote</button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-800">
        <button onClick={() => setTab("list")} className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 ${tab === "list" ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-white"}`}>
          <ListOrdered size={14} />Quotations
        </button>
        <button onClick={() => setTab("templates")} className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 ${tab === "templates" ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-white"}`}>
          <FileStack size={14} />Templates
        </button>
      </div>

      {tab === "templates" ? (
        <QuotationTemplatesTab onUseTemplate={openFromTemplate} />
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quote, customer, phone…" className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white">
              <option value="">All status</option>
              <option value="draft">Draft</option><option value="sent">Sent</option>
              <option value="accepted">Accepted</option><option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="text-left px-3 py-2">Quote No</th>
                  <th className="text-left px-3 py-2">Customer</th>
                  <th className="text-left px-3 py-2">Items</th>
                  <th className="text-right px-3 py-2">Total</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="text-center py-6 text-slate-500">Loading…</td></tr> :
                  filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-slate-500"><FileText size={28} className="mx-auto mb-2 opacity-40" />No quotes yet — <button onClick={openNew} className="text-blue-400 hover:underline">create one</button></td></tr> :
                  filtered.map((r) => (
                    <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                      <td className="px-3 py-2 font-mono text-xs text-blue-300">{r.quote_no}</td>
                      <td className="px-3 py-2 text-white">{r.customer_name}<div className="text-xs text-slate-500">{r.phone}</div></td>
                      <td className="px-3 py-2 text-slate-400 text-xs">{Array.isArray(r.items) ? r.items.length : 0} items</td>
                      <td className="px-3 py-2 text-right text-green-400 font-medium">{formatINR(r.total_amount)}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[r.status] || "bg-slate-700 text-slate-300"}`}>{r.status}</span></td>
                      <td className="px-3 py-2 text-slate-400 text-xs">{formatDate(r.created_at)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setPreviewQ(r)} title="Preview" className="p-1.5 text-slate-300 hover:bg-slate-700 rounded"><Eye size={14} /></button>
                          <button onClick={() => openEdit(r)} title="Edit" className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded"><Edit2 size={14} /></button>
                          <button onClick={() => remove(r.id)} title="Delete" className="p-1.5 text-red-400 hover:bg-red-600/20 rounded"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-4xl my-8 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{form.id ? "Edit" : "New"} Quotation <span className="ml-2 text-sm font-mono text-blue-300">{form.quote_no}</span>{form._from_template_id && <span className="ml-2 text-xs text-blue-400">(from template)</span>}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Customer Name *"><input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className={inp} /></Field>
              <Field label="Phone *"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} /></Field>
              <Field label="WhatsApp"><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inp} placeholder="defaults to phone" /></Field>
              <Field label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} /></Field>
              <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inp} /></Field>
              <Field label="Link to Enquiry">
                <select value={form.enquiry_id || ""} onChange={(e) => {
                  const id = e.target.value || null;
                  const enq = enquiries.find((x) => x.id === id);
                  if (enq) setForm({ ...form, enquiry_id: id, customer_name: form.customer_name || enq.customer_name, phone: form.phone || enq.phone });
                  else setForm({ ...form, enquiry_id: id });
                }} className={inp}>
                  <option value="">— None —</option>
                  {enquiries.map((e) => <option key={e.id} value={e.id}>{e.customer_name} · {e.item_name || ""}</option>)}
                </select>
              </Field>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white text-sm">Items</h4>
                <div className="flex gap-2">
                  <button onClick={() => setShowPicker(true)} className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded">+ From Catalogue</button>
                  <button onClick={addItem} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded">+ Add Row</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="text-left px-2 py-1.5">Item</th>
                      <th className="text-right px-2 py-1.5 w-16">Qty</th>
                      <th className="text-right px-2 py-1.5 w-28">Price</th>
                      <th className="text-right px-2 py-1.5 w-20">Disc%</th>
                      <th className="text-right px-2 py-1.5 w-28">Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-slate-500 text-xs">No items yet</td></tr>
                    ) : form.items.map((it, idx) => {
                      const rowTotal = Number(it.qty || 0) * Number(it.price || 0) * (1 - Number(it.discount_pct || 0) / 100);
                      return (
                        <tr key={idx} className="border-t border-slate-800">
                          <td className="px-2 py-1"><input value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} className={inp} /></td>
                          <td className="px-2 py-1"><input type="number" value={it.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })} className={inp + " text-right"} /></td>
                          <td className="px-2 py-1"><input type="number" value={it.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) })} className={inp + " text-right"} /></td>
                          <td className="px-2 py-1"><input type="number" value={it.discount_pct} onChange={(e) => updateItem(idx, { discount_pct: Number(e.target.value) })} className={inp + " text-right"} /></td>
                          <td className="px-2 py-1 text-right text-green-300 font-medium">{formatINR(rowTotal)}</td>
                          <td className="px-1"><button onClick={() => removeItem(idx)} className="text-red-400 p-1"><X size={14} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
              <div className="space-y-2">
                <Field label="Validity (days)"><input type="number" value={form.validity_days} onChange={(e) => { const d = Number(e.target.value || 0); setForm({ ...form, validity_days: d, validity_date: addDays(todayISO(), d) }); }} className={inp} /></Field>
                <Field label="Validity Date"><input type="date" value={form.validity_date} onChange={(e) => setForm({ ...form, validity_date: e.target.value })} className={inp} /></Field>
                <Field label="GST %">
                  <input type="number" min={0} placeholder="0" value={form.gst_percent} onChange={(e) => setForm({ ...form, gst_percent: e.target.value === "" ? 0 : Number(e.target.value) })} className={inp} />
                  <span className="text-[11px] text-slate-500 mt-1 block">Leave 0 if GST not applicable</span>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
                    <option value="draft">Draft</option><option value="sent">Sent</option>
                    <option value="accepted">Accepted</option><option value="rejected">Rejected</option>
                  </select>
                </Field>
              </div>
              <div className="bg-slate-800/40 rounded p-3 space-y-1.5 text-sm">
                <Row label="Subtotal" value={formatINR(totals.subtotal)} />
                <Row label="Discount" value={`- ${formatINR(totals.discount)}`} />
                {Number(form.gst_percent) > 0 && (
                  <Row label={`GST ${form.gst_percent}%`} value={formatINR(totals.gst_amount)} />
                )}
                <div className="border-t border-slate-700 pt-2 mt-2"><Row label={<span className="font-semibold">Grand Total</span>} value={<span className="text-lg text-green-400 font-bold">{formatINR(totals.total_amount)}</span>} /></div>
              </div>
            </div>

            <Field label="Notes"><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp} /></Field>
            <Field label="Terms & Conditions"><textarea rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} className={inp} /></Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Cancel</button>
              <button onClick={() => save("draft")} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded">Save as Draft</button>
              <button onClick={() => save("preview")} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium">Save & Preview</button>
            </div>

            {showPicker && (
              <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowPicker(false)}>
                <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b border-slate-800 flex justify-between"><span className="font-semibold text-white">Pick from Catalogue</span><button onClick={() => setShowPicker(false)}><X size={18} className="text-slate-400" /></button></div>
                  <div className="divide-y divide-slate-800">
                    {catalogue.length === 0 ? <div className="p-6 text-center text-slate-500 text-sm">No active catalogue items</div> :
                      catalogue.map((it) => (
                        <button key={it.id} onClick={() => addFromCatalogue(it)} className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center justify-between">
                          <div><div className="text-white text-sm">{it.brand} {it.model}</div><div className="text-xs text-slate-500">Stock: {it.stock_qty}</div></div>
                          <div className="text-green-400 font-medium">{formatINR(it.sale_price)}</div>
                        </button>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {previewQ && <QuotePreviewModal q={previewQ} branding={branding} onClose={() => setPreviewQ(null)} />}
    </div>
  );
}

export function QuotePreviewModal({ q, branding, onClose }: { q: any; branding: any; onClose: () => void }) {
  const previewRef = useRef<HTMLDivElement>(null);

  // Inline every <img> inside the preview as a base64 data URI so html2canvas
  // never has to deal with CORS / cross-origin tainting.
  const inlineImages = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(imgs.map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith("data:")) return;
      try {
        const res = await fetch(src, { mode: "cors", cache: "no-cache" });
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
        img.removeAttribute("crossorigin");
        img.src = dataUrl;
        // wait for the new src to load
        await new Promise<void>((res2) => {
          if (img.complete && img.naturalWidth > 0) return res2();
          img.addEventListener("load", () => res2(), { once: true });
          img.addEventListener("error", () => res2(), { once: true });
          setTimeout(() => res2(), 2000);
        });
      } catch {
        // can't inline — hide the image so it doesn't break the export
        img.style.visibility = "hidden";
      }
    }));
  };

  const captureCanvas = async (): Promise<HTMLCanvasElement> => {
    const original = document.getElementById("quotation-preview") as HTMLElement | null;
    if (!original) throw new Error("Preview not ready");

    // Clone the live preview into a dedicated off-screen host. We never mutate
    // the visible node (transforms + z-index hacks were causing blank captures
    // on some browsers/mobile viewports).
    const host = document.createElement("div");
    host.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "width:794px",
      "background:#ffffff",
      // Keep it visually hidden but fully laid out + painted.
      "opacity:0",
      "pointer-events:none",
      "z-index:0",
    ].join(";");

    const clone = original.cloneNode(true) as HTMLElement;
    clone.id = "quotation-preview-capture";
    clone.style.width = "794px";
    clone.style.transform = "none";
    clone.style.position = "static";
    host.appendChild(clone);
    document.body.appendChild(host);

    try {
      await inlineImages(clone);
      // Let layout/paint settle after image swaps.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      return await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794,
        windowWidth: 794,
        logging: false,
      });
    } finally {
      host.remove();
    }
  };

  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
    new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Blob conversion failed"))), "image/jpeg", 0.92));

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `Quotation-${q.quote_no}.jpg`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  // Upload to Supabase Storage so we can include a real image URL in WhatsApp
  // (recipient sees a clickable image preview instead of plain text).
  const uploadAndGetUrl = async (blob: Blob): Promise<string | null> => {
    try {
      const path = `quotations/${q.id || q.quote_no}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("shop-assets").upload(path, blob, {
        contentType: "image/jpeg", upsert: true, cacheControl: "3600",
      });
      if (error) return null;
      const { data } = supabase.storage.from("shop-assets").getPublicUrl(path);
      return data?.publicUrl || null;
    } catch { return null; }
  };

  const exportAsJpeg = async (): Promise<Blob> => {
    const canvas = await captureCanvas();
    const blob = await canvasToBlob(canvas);
    downloadBlob(blob);
    return blob;
  };

  const handleJpegOnly = async () => {
    try { await exportAsJpeg(); toast.success("JPEG downloaded"); } catch (e: any) { toast.error("Export failed: " + (e?.message || "Unknown error")); }
  };

  const shareJpegWA = async () => {
    try {
      toast.message("Generating image…");
      const canvas = await captureCanvas();
      const blob = await canvasToBlob(canvas);

      const phone = (q.whatsapp || q.phone || "").replace(/\D/g, "");
      const cc = !phone ? "" : phone.startsWith("91") || phone.length > 10 ? phone : "91" + phone;
      const file = new File([blob], `Quotation-${q.quote_no}.jpg`, { type: "image/jpeg" });

      // Mobile / supported browsers: native share sheet attaches the image
      // directly into WhatsApp (this is the ONLY way to auto-attach a file).
      const navAny = navigator as any;
      const canShareFiles = !!(navAny.canShare && navAny.canShare({ files: [file] }) && navAny.share);
      if (canShareFiles) {
        try {
          await navAny.share({
            files: [file],
            title: `Quotation ${q.quote_no}`,
            text: `Quotation ${q.quote_no} — Total ₹${Number(q.total_amount).toLocaleString("en-IN")}`,
          });
          toast.success("Pick WhatsApp from the share sheet");
          return;
        } catch (err: any) {
          // User cancelled or share failed — fall through to URL flow.
          if (err?.name !== "AbortError") console.warn("Native share failed:", err);
        }
      }

      // Desktop / fallback: ALWAYS download the JPEG so user has it ready,
      // upload to Storage so the WhatsApp message contains a clickable image
      // link that previews inline in WhatsApp.
      downloadBlob(blob);
      toast.message("Uploading image for WhatsApp preview…");
      const imgUrl = await uploadAndGetUrl(blob);
      const onlineUrl = `${window.location.origin}/q/quote/${q.id}`;
      const lines = [
        `Hello${q.customer_name ? ` ${q.customer_name}` : ""}, here is your quotation *${q.quote_no}*.`,
        `Total: ₹${Number(q.total_amount).toLocaleString("en-IN")}`,
        q.validity_date ? `Valid till: ${q.validity_date}` : "",
        "",
        imgUrl ? `🖼 View image: ${imgUrl}` : "(Image saved to your downloads — please attach it manually.)",
        `🔗 View online: ${onlineUrl}`,
      ].filter(Boolean);
      const msg = lines.join("\n");
      window.open(
        cc ? `https://wa.me/${cc}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`,
        "_blank"
      );
      if (imgUrl) {
        toast.success("WhatsApp opened. Image link is in the message + JPEG downloaded — drag it into the chat to attach.", { duration: 8000 });
      } else {
        toast.warning("WhatsApp opened. Upload failed — please attach the downloaded JPEG manually.", { duration: 8000 });
      }
    } catch (e: any) {
      toast.error("Failed: " + (e?.message || "Unknown error"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-2 sm:p-4 overflow-y-auto print:bg-white print:p-0" onClick={onClose}>
      <div className="bg-white text-slate-900 rounded-lg w-full max-w-[840px] my-4 sm:my-8 print:my-0 print:max-w-none print:rounded-none overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-2 sm:p-4 print:p-0 overflow-x-auto" ref={previewRef}>
          <div className="origin-top-left mx-auto" style={{ width: 794 }}>
            <QuotationPreview q={q} b={branding} />
          </div>
        </div>

        <SendQuotationPanel quotation={q} onJpegRequest={async () => { await exportAsJpeg(); }} />

        <div className="px-3 sm:px-6 py-3 border-t bg-slate-100 flex flex-wrap justify-end gap-2 print:hidden">
          <button onClick={onClose} className="px-3 py-2 text-sm bg-slate-200 hover:bg-slate-300 rounded">Close</button>
          <button onClick={handleJpegOnly} className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded flex items-center gap-1"><Download size={14} />Download JPEG</button>
          <button onClick={shareJpegWA} className="px-3 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-1"><Send size={14} />Share JPEG on WhatsApp</button>
          <button onClick={() => window.print()} className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1"><Printer size={14} />Print / PDF</button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500";
const Field = ({ label, children }: any) => <label className="block"><span className="text-xs text-slate-400 mb-1 block">{label}</span>{children}</label>;
const Row = ({ label, value }: any) => <div className="flex justify-between text-slate-200"><span className="text-slate-400">{label}</span><span>{value}</span></div>;
