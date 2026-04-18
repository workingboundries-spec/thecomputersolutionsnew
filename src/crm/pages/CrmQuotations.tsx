import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate, todayISO, addDays, waLink } from "@/crm/lib/format";
import { useAdminSettings } from "@/crm/hooks/useAdminSettings";
import { toast } from "sonner";
import { Plus, Search, Eye, Edit2, Trash2, Send, Printer, X, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  subtotal: 0, discount: 0, gst_percent: 18, gst_amount: 0, total_amount: 0,
  validity_days: 7, validity_date: addDays(todayISO(), 7),
  notes: "", terms: "", status: "draft",
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
  const settings = useAdminSettings(["default_gst_percent", "default_validity_days", "quotation_terms", "quote_prefix", "shop_name", "shop_address", "shop_phone", "shop_email", "shop_gst", "shop_website"]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const navigate = useNavigate();

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
    f.gst_percent = Number(settings.default_gst_percent || 18);
    f.validity_days = Number(settings.default_validity_days || 7);
    f.validity_date = addDays(todayISO(), f.validity_days);
    f.terms = settings.quotation_terms || "";
    f.quote_no = await nextQuoteNo(settings.quote_prefix || "QT");
    setForm(f);
    setShowForm(true);
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
      status: asStatus || form.status,
    };
    let savedId = form.id;
    if (form.id) {
      const { error } = await supabase.from("crm_quotations").update(payload).eq("id", form.id);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("crm_quotations").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      savedId = data.id;
    }
    if (form.enquiry_id) {
      await supabase.from("crm_enquiries").update({ status: "quoted" }).eq("id", form.enquiry_id);
    }
    toast.success("Quotation saved");
    setShowForm(false);
    load();
    if (asStatus === "preview") setPreviewId(savedId);
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
          <p className="text-sm text-slate-400">{filtered.length} of {rows.length} quotes</p>
        </div>
        <button onClick={openNew} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Plus size={14} />New Quote</button>
      </div>

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
                      <button onClick={() => setPreviewId(r.id)} title="Preview" className="p-1.5 text-slate-300 hover:bg-slate-700 rounded"><Eye size={14} /></button>
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

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-4xl my-8 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{form.id ? "Edit" : "New"} Quotation <span className="ml-2 text-sm font-mono text-blue-300">{form.quote_no}</span></h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            {/* Customer */}
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

            {/* Items */}
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

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
              <div className="space-y-2">
                <Field label="Validity (days)"><input type="number" value={form.validity_days} onChange={(e) => { const d = Number(e.target.value || 0); setForm({ ...form, validity_days: d, validity_date: addDays(todayISO(), d) }); }} className={inp} /></Field>
                <Field label="Validity Date"><input type="date" value={form.validity_date} onChange={(e) => setForm({ ...form, validity_date: e.target.value })} className={inp} /></Field>
                <Field label="GST %"><input type="number" value={form.gst_percent} onChange={(e) => setForm({ ...form, gst_percent: Number(e.target.value) })} className={inp} /></Field>
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
                <Row label={`GST ${form.gst_percent}%`} value={formatINR(totals.gst_amount)} />
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

      {previewId && <QuotePreview id={previewId} settings={settings} onClose={() => setPreviewId(null)} />}
    </div>
  );
}

function QuotePreview({ id, settings, onClose }: { id: string; settings: any; onClose: () => void }) {
  const [q, setQ] = useState<any>(null);
  useEffect(() => { supabase.from("crm_quotations").select("*").eq("id", id).single().then(({ data }) => setQ(data)); }, [id]);
  if (!q) return null;

  const sendWA = () => {
    const url = `${window.location.origin}/q/quote/${q.id}`;
    const msg = `Dear ${q.customer_name}, please find your quotation ${q.quote_no} from ${settings.shop_name || "The Computer Solutions"}. Total: ${formatINR(q.total_amount)}. Valid till: ${formatDate(q.validity_date)}.\n\nView: ${url}`;
    window.open(waLink(q.whatsapp || q.phone, msg), "_blank");
  };
  const sendEmail = () => {
    const subject = encodeURIComponent(`Quotation ${q.quote_no} from ${settings.shop_name || "The Computer Solutions"}`);
    const body = encodeURIComponent(`Dear ${q.customer_name},\n\nPlease find your quotation ${q.quote_no}.\nTotal: ${formatINR(q.total_amount)}\nValid till: ${formatDate(q.validity_date)}\n\n${settings.shop_name || ""}`);
    window.open(`mailto:${q.email || ""}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto print:bg-white print:p-0" onClick={onClose}>
      <div className="bg-white text-slate-900 rounded-lg w-full max-w-3xl my-8 print:my-0 print:max-w-none print:rounded-none" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 print:p-8">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold">{settings.shop_name || "The Computer Solutions"}</h1>
              <div className="text-sm text-slate-600 mt-1">{settings.shop_address}</div>
              <div className="text-sm text-slate-600">📞 {settings.shop_phone} · ✉ {settings.shop_email}</div>
              {settings.shop_gst && <div className="text-xs text-slate-500">GST: {settings.shop_gst}</div>}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-700">QUOTATION</div>
              <div className="font-mono text-sm mt-1">{q.quote_no}</div>
              <div className="text-xs text-slate-500 mt-1">Date: {formatDate(q.created_at)}</div>
              <div className="text-xs text-slate-500">Valid till: {formatDate(q.validity_date)}</div>
            </div>
          </div>

          <div className="mt-4 bg-slate-50 p-3 rounded">
            <div className="text-xs uppercase text-slate-500">Bill To</div>
            <div className="font-semibold">{q.customer_name}</div>
            <div className="text-sm text-slate-600">{q.phone}{q.email ? ` · ${q.email}` : ""}</div>
            {q.address && <div className="text-sm text-slate-600">{q.address}</div>}
          </div>

          <table className="w-full mt-4 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Item</th>
                <th className="text-right p-2">Qty</th>
                <th className="text-right p-2">Price</th>
                <th className="text-right p-2">Disc%</th>
                <th className="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(q.items || []).map((it: QItem, idx: number) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{it.name}</td>
                  <td className="p-2 text-right">{it.qty}</td>
                  <td className="p-2 text-right">{formatINR(it.price)}</td>
                  <td className="p-2 text-right">{it.discount_pct || 0}%</td>
                  <td className="p-2 text-right font-medium">{formatINR(Number(it.qty) * Number(it.price) * (1 - Number(it.discount_pct || 0) / 100))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <div className="w-64 text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span><span>{formatINR(q.subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount:</span><span>- {formatINR(q.discount)}</span></div>
              <div className="flex justify-between"><span>GST {q.gst_percent}%:</span><span>{formatINR(q.gst_amount)}</span></div>
              <div className="flex justify-between border-t pt-1 font-bold text-base"><span>Grand Total:</span><span>{formatINR(q.total_amount)}</span></div>
            </div>
          </div>

          {q.terms && <div className="mt-6 text-xs text-slate-600"><div className="font-semibold mb-1">Terms & Conditions:</div>{q.terms}</div>}
          {q.notes && <div className="mt-3 text-xs text-slate-600"><div className="font-semibold mb-1">Notes:</div>{q.notes}</div>}
          <div className="text-center text-sm text-slate-500 mt-6 pt-4 border-t">Thank you for your business!</div>
        </div>

        <div className="px-6 py-3 border-t bg-slate-50 flex flex-wrap justify-end gap-2 rounded-b print:hidden">
          <button onClick={onClose} className="px-3 py-2 text-sm bg-slate-200 hover:bg-slate-300 rounded">Close</button>
          <button onClick={sendEmail} className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded">Email</button>
          <button onClick={sendWA} className="px-3 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-1"><Send size={14} />WhatsApp</button>
          <button onClick={() => window.print()} className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1"><Printer size={14} />Print / PDF</button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500";
const Field = ({ label, children }: any) => <label className="block"><span className="text-xs text-slate-400 mb-1 block">{label}</span>{children}</label>;
const Row = ({ label, value }: any) => <div className="flex justify-between text-slate-200"><span className="text-slate-400">{label}</span><span>{value}</span></div>;
