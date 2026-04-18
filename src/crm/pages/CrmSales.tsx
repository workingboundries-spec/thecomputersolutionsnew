import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate, todayISO, addMonths, addDays } from "@/crm/lib/format";
import { toast } from "sonner";
import { Plus, Search, Eye, Edit2, MessageCircle, Printer, X, Trash2 } from "lucide-react";
import { useAdminSetting } from "@/crm/hooks/useAdminSettings";

const PAY_BADGE: Record<string, string> = {
  paid: "bg-green-500/15 text-green-300",
  partial: "bg-yellow-500/15 text-yellow-300",
  pending: "bg-red-500/15 text-red-300",
  pending_review: "bg-yellow-500/20 text-yellow-200 border border-yellow-500/40",
};

function shareSalesForm() {
  const link = `${window.location.origin}/sales-form`;
  const msg = `Hello! Please fill in your purchase details using the link below — it only takes a minute:\n\n${link}\n\nThank you!`;
  navigator.clipboard?.writeText(link).catch(() => {});
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

const empty = {
  enquiry_id: null as string | null,
  customer_name: "", phone: "", whatsapp: "", address: "", customer_dob: "",
  item_name: "", item_id: null as string | null,
  qty: 1, sale_price: 0, discount: 0, total_amount: 0,
  payment_mode: "cash", payment_status: "paid",
  invoice_no: "", warranty_months: 12, warranty_expiry: "",
  sale_date: todayISO(), notes: "",
};

async function nextInvoiceNo() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const prefix = `INV-${y}${m}${d}`;
  const { data } = await supabase
    .from("crm_sales")
    .select("invoice_no")
    .like("invoice_no", `${prefix}-%`)
    .order("invoice_no", { ascending: false })
    .limit(1);
  let n = 1;
  if (data && data[0]) {
    const last = data[0].invoice_no.split("-").pop();
    n = (parseInt(last || "0", 10) || 0) + 1;
  }
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

async function loadTemplates() {
  // Load message templates from crm_admin_settings (keys like whatsapp_week_template, whatsapp_month_template, etc.)
  const { data } = await supabase
    .from("crm_admin_settings")
    .select("setting_key, setting_value")
    .like("setting_key", "whatsapp_%_template");
  const map: Record<string, string> = {};
  (data || []).forEach((t: any) => { map[t.setting_key] = t.setting_value; });
  return map;
}

function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

async function createWarrantyReminders(sale: any, templates: Record<string, string>) {
  const reminders: any[] = [];
  const baseVars = {
    name: sale.customer_name,
    item: sale.item_name,
    purchase_date: formatDate(sale.sale_date),
    date: formatDate(sale.sale_date),
    expiry: formatDate(sale.warranty_expiry),
    phone: sale.phone,
    shop_phone: "",
    shop_name: "The Computer Solutions",
  };
  // 5 standard reminder types per spec: 1 week, 1 month, 3 month, 6 month, 11 month
  const types: { type: string; days: number; tpl: string }[] = [
    { type: "1week", days: 7, tpl: "whatsapp_week_template" },
    { type: "1month", days: 30, tpl: "whatsapp_month_template" },
    { type: "3month", days: 90, tpl: "whatsapp_3month_template" },
    { type: "6month", days: 180, tpl: "whatsapp_6month_template" },
  ];
  // 11-month reminder only if warranty >= 12 months
  if (Number(sale.warranty_months || 0) >= 12) {
    types.push({ type: "11month", days: 330, tpl: "whatsapp_11month_template" });
  }
  for (const t of types) {
    reminders.push({
      sale_id: sale.id,
      customer_name: sale.customer_name,
      phone: sale.phone,
      whatsapp: sale.whatsapp || sale.phone,
      item_name: sale.item_name,
      purchase_date: sale.sale_date,
      warranty_expiry: sale.warranty_expiry,
      reminder_type: t.type,
      scheduled_date: addDays(sale.sale_date, t.days),
      whatsapp_message: fillTemplate(templates[t.tpl] || "", baseVars),
      status: "pending",
      message_sent: false,
    });
  }
  if (reminders.length) await supabase.from("crm_warranty_reminders").insert(reminders);
}

async function upsertCustomer(sale: any) {
  const { data: existing } = await supabase.from("crm_customers").select("*").eq("phone", sale.phone).maybeSingle();
  if (existing) {
    await supabase.from("crm_customers").update({
      name: sale.customer_name,
      whatsapp: sale.whatsapp || sale.phone,
      address: sale.address || existing.address,
      dob: sale.customer_dob || existing.dob,
      total_purchases: (existing.total_purchases || 0) + 1,
      total_value: Number(existing.total_value || 0) + Number(sale.total_amount || 0),
      last_purchase_date: sale.sale_date,
    }).eq("id", existing.id);
  } else {
    await supabase.from("crm_customers").insert({
      name: sale.customer_name,
      phone: sale.phone,
      whatsapp: sale.whatsapp || sale.phone,
      address: sale.address,
      dob: sale.customer_dob || null,
      total_purchases: 1,
      total_value: Number(sale.total_amount || 0),
      last_purchase_date: sale.sale_date,
    });
  }
}

async function decrementStock(item_id: string | null, qty: number) {
  if (!item_id) return;
  const { data } = await supabase.from("crm_catalogue").select("stock_qty").eq("id", item_id).maybeSingle();
  if (data) {
    await supabase.from("crm_catalogue").update({ stock_qty: Math.max(0, (data.stock_qty || 0) - qty) }).eq("id", item_id);
  }
}

export default function CrmSales() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [filterPay, setFilterPay] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [viewing, setViewing] = useState<any>(null);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [shopInfo, setShopInfo] = useState<Record<string, string>>({});
  const paymentModes = useAdminSetting<string[]>("sale_payment_modes", ["Cash", "UPI", "Card", "EMI", "Credit", "NEFT"]);

  const load = async () => {
    setLoading(true);
    const [salesRes, catRes, settRes] = await Promise.all([
      supabase.from("crm_sales").select("*").eq("is_deleted", false).order("created_at", { ascending: false }),
      supabase.from("crm_catalogue").select("id, brand, model, sale_price, stock_qty"),
      supabase.from("crm_settings").select("key, value"),
    ]);
    if (salesRes.error) toast.error(salesRes.error.message);
    setRows(salesRes.data || []);
    setCatalogue(catRes.data || []);
    const info: Record<string, string> = {};
    (settRes.data || []).forEach((r: any) => { info[r.key] = r.value; });
    setShopInfo(info);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Handle ?new=1 from enquiry conversion
  useEffect(() => {
    if (params.get("new") === "1") {
      const prefill: any = { ...empty };
      params.forEach((v, k) => { if (k !== "new" && k in prefill) prefill[k] = v; });
      if (params.get("enquiry_id")) prefill.enquiry_id = params.get("enquiry_id");
      const sp = Number(prefill.sale_price || 0);
      prefill.sale_price = sp;
      prefill.total_amount = sp;
      openNew(prefill);
      params.delete("new");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = rows.filter((r) => {
    if (filterPay && r.payment_status !== filterPay) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.customer_name?.toLowerCase().includes(q) && !r.phone?.includes(q) && !r.invoice_no?.toLowerCase().includes(q)) return false;
    }
    if (itemSearch) {
      const q = itemSearch.toLowerCase();
      if (!r.item_name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalsByDate = (() => {
    const today = todayISO();
    const weekAgo = addDays(today, -7);
    const monthStart = today.slice(0, 7) + "-01";
    let t = 0, w = 0, m = 0;
    rows.forEach((r) => {
      const amt = Number(r.total_amount || 0);
      if (r.sale_date === today) t += amt;
      if (r.sale_date >= weekAgo) w += amt;
      if (r.sale_date >= monthStart) m += amt;
    });
    return { t, w, m };
  })();

  const openNew = async (prefill?: any) => {
    setEditing(null);
    const inv = await nextInvoiceNo();
    const base = { ...empty, ...(prefill || {}), invoice_no: inv };
    base.warranty_expiry = addMonths(base.sale_date, base.warranty_months);
    setForm(base);
    setShowForm(true);
  };

  const openEdit = (r: any) => { setEditing(r); setForm({ ...empty, ...r }); setShowForm(true); };

  const recalc = (f: any) => {
    const t = Math.max(0, Number(f.qty || 0) * Number(f.sale_price || 0) - Number(f.discount || 0));
    return { ...f, total_amount: t };
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation: payment_mode, item_name, sale_price required
    if (!form.payment_mode) return toast.error("Select a payment mode");
    if (!form.item_name?.trim()) return toast.error("Item name is required");
    if (!form.sale_price || Number(form.sale_price) <= 0) return toast.error("Sale price must be greater than 0");

    const payload = {
      ...form,
      qty: Number(form.qty || 1),
      sale_price: Number(form.sale_price || 0),
      discount: Number(form.discount || 0),
      total_amount: Number(form.total_amount || 0),
      warranty_months: Number(form.warranty_months || 0),
      warranty_expiry: form.warranty_expiry || addMonths(form.sale_date, Number(form.warranty_months || 0)),
      whatsapp: form.whatsapp || form.phone,
      customer_dob: form.customer_dob || null,
      enquiry_id: form.enquiry_id || null,
      item_id: form.item_id || null,
    };

    if (editing) {
      const { error } = await supabase.from("crm_sales").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Sale updated");
    } else {
      const { data, error } = await supabase.from("crm_sales").insert(payload).select().single();
      if (error) return toast.error(error.message);
      const templates = await loadTemplates();
      await Promise.all([
        createWarrantyReminders(data, templates),
        upsertCustomer(data),
        decrementStock(data.item_id, data.qty),
        payload.enquiry_id ? supabase.from("crm_enquiries").update({ status: "converted" }).eq("id", payload.enquiry_id) : Promise.resolve(),
      ]);
      toast.success(payload.enquiry_id ? "Sale created & enquiry marked as converted" : "Sale saved + reminders scheduled");
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (s: any) => {
    if (!confirm(`Delete sale ${s.invoice_no}? Stock will be restored.`)) return;
    const { error } = await supabase.from("crm_sales").update({ is_deleted: true }).eq("id", s.id);
    if (error) return toast.error(error.message);
    // Restore stock if linked to catalogue
    if (s.item_id) {
      const { data } = await supabase.from("crm_catalogue").select("stock_qty, brand, model").eq("id", s.item_id).maybeSingle();
      if (data) {
        const newQty = (data.stock_qty || 0) + Number(s.qty || 0);
        await supabase.from("crm_catalogue").update({ stock_qty: newQty }).eq("id", s.item_id);
        toast.success(`Sale deleted. Stock restored: ${data.brand} ${data.model} now has ${newQty} units`);
      } else {
        toast.success("Sale deleted");
      }
    } else {
      toast.success("Sale deleted (no catalogue link, stock unchanged)");
    }
    load();
  };

  const sendReceipt = (s: any) => {
    const msg = `Hi ${s.customer_name}, thank you for your purchase!\nInvoice: ${s.invoice_no}\nItem: ${s.item_name}\nAmount: ${formatINR(s.total_amount)}\nWarranty till: ${formatDate(s.warranty_expiry)}\n— ${shopInfo.shop_name || "The Computer Solutions"}`;
    const phone = (s.whatsapp || s.phone || "").replace(/\D/g, "");
    const cc = phone.startsWith("91") ? phone : "91" + phone;
    window.open(`https://wa.me/${cc}?text=${encodeURIComponent(msg)}`, "_blank");
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales</h1>
          <p className="text-sm text-slate-400">{filtered.length} of {rows.length} sales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={shareSalesForm} title="Share customer form on WhatsApp" className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm flex items-center gap-1.5"><MessageCircle size={14} />Share Sale Form</button>
          <button onClick={() => openNew()} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Plus size={14} />Add Sale</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Today" value={formatINR(totalsByDate.t)} />
        <Stat label="This Week" value={formatINR(totalsByDate.w)} />
        <Stat label="This Month" value={formatINR(totalsByDate.m)} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer / phone / invoice…" className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} placeholder="Search by Item — Laptop, CCTV, etc." className="w-full pl-8 pr-8 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
          {itemSearch && (
            <button type="button" onClick={() => setItemSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" aria-label="Clear">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={filterPay} onChange={(e) => setFilterPay(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white">
          <option value="">All payments</option>
          <option value="paid">Paid</option><option value="partial">Partial</option><option value="pending">Pending</option>
          <option value="pending_review">Pending Review</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="text-left px-3 py-2">Date</th>
              <th className="text-left px-3 py-2">Invoice</th>
              <th className="text-left px-3 py-2">Customer</th>
              <th className="text-left px-3 py-2">Item</th>
              <th className="text-right px-3 py-2">Amount</th>
              <th className="text-left px-3 py-2">Payment</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-6 text-slate-500">Loading…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-slate-500">No sales yet — <button onClick={() => openNew()} className="text-blue-400 hover:underline">add the first</button></td></tr> :
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-slate-400 text-xs">{formatDate(r.sale_date)}</td>
                  <td className="px-3 py-2 text-slate-300 font-mono text-xs">{r.invoice_no}</td>
                  <td className="px-3 py-2 text-white">{r.customer_name}<div className="text-xs text-slate-500">{r.phone}</div></td>
                  <td className="px-3 py-2 text-slate-300">
                    {r.item_name} <span className="text-xs text-slate-500">×{r.qty}</span>
                    {r.enquiry_id && <span className="ml-2 inline-block text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">From Enquiry</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-green-400 font-medium">{formatINR(r.total_amount)}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${PAY_BADGE[r.payment_status] || "bg-slate-700 text-slate-200"}`}>{r.payment_status === "pending_review" ? "Pending Review" : r.payment_status}</span></td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewing(r)} title="View invoice" className="p-1.5 text-slate-300 hover:bg-slate-700 rounded"><Eye size={14} /></button>
                      <button onClick={() => sendReceipt(r)} title="WhatsApp receipt" className="p-1.5 text-green-400 hover:bg-green-600/20 rounded"><MessageCircle size={14} /></button>
                      <button onClick={() => openEdit(r)} title="Edit" className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded"><Edit2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-3xl my-8 space-y-3">
            <h3 className="text-lg font-semibold text-white">{editing ? "Edit" : "New"} Sale</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Invoice No"><input value={form.invoice_no} onChange={(e) => setForm({ ...form, invoice_no: e.target.value })} className={fInput} /></Field>
              <Field label="Sale Date"><input type="date" value={form.sale_date} onChange={(e) => setForm(recalc({ ...form, sale_date: e.target.value, warranty_expiry: addMonths(e.target.value, Number(form.warranty_months || 0)) }))} className={fInput} /></Field>
              <Field label="Payment Mode">
                <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })} className={fInput}>
                  <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="credit">Credit</option><option value="emi">EMI</option>
                </select>
              </Field>
              <Field label="Customer Name *"><input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className={fInput} /></Field>
              <Field label="Phone *"><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fInput} /></Field>
              <Field label="WhatsApp"><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={fInput} /></Field>
              <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={fInput} /></Field>
              <Field label="Customer DOB (for birthday)"><input type="date" value={form.customer_dob || ""} onChange={(e) => setForm({ ...form, customer_dob: e.target.value })} className={fInput} /></Field>
              <Field label="Pick from Catalogue (optional)">
                <select value={form.item_id || ""} onChange={(e) => {
                  const c = catalogue.find((x) => x.id === e.target.value);
                  if (c) setForm(recalc({ ...form, item_id: c.id, item_name: `${c.brand} ${c.model}`, sale_price: c.sale_price }));
                  else setForm({ ...form, item_id: null });
                }} className={fInput}>
                  <option value="">— Manual entry —</option>
                  {catalogue.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model} (stock {c.stock_qty})</option>)}
                </select>
              </Field>
              <Field label="Item Name *"><input required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className={fInput} /></Field>
              <Field label="Qty"><input type="number" min={1} value={form.qty} onChange={(e) => setForm(recalc({ ...form, qty: Number(e.target.value || 1) }))} className={fInput} /></Field>
              <Field label="Sale Price (each)"><input type="number" value={form.sale_price} onChange={(e) => setForm(recalc({ ...form, sale_price: Number(e.target.value || 0) }))} className={fInput} /></Field>
              <Field label="Discount"><input type="number" value={form.discount} onChange={(e) => setForm(recalc({ ...form, discount: Number(e.target.value || 0) }))} className={fInput} /></Field>
              <Field label="Total Amount"><input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: Number(e.target.value || 0) })} className={`${fInput} font-bold text-green-400`} /></Field>
              <Field label="Payment Status">
                <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })} className={fInput}>
                  <option value="paid">Paid</option><option value="partial">Partial</option><option value="pending">Pending</option>
                </select>
              </Field>
              <Field label="Warranty (months)"><input type="number" value={form.warranty_months} onChange={(e) => setForm({ ...form, warranty_months: Number(e.target.value || 0), warranty_expiry: addMonths(form.sale_date, Number(e.target.value || 0)) })} className={fInput} /></Field>
              <Field label="Warranty Expiry"><input type="date" value={form.warranty_expiry || ""} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} className={fInput} /></Field>
            </div>
            <Field label="Notes"><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={fInput} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium">Save Sale</button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice modal */}
      {viewing && <InvoiceModal sale={viewing} shop={shopInfo} onClose={() => setViewing(null)} />}
    </div>
  );
}

function InvoiceModal({ sale, shop, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white text-slate-900 rounded-lg w-full max-w-2xl my-8 print:my-0 print:shadow-none">
        <div className="p-6 print:p-0">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold">{shop.shop_name || "The Computer Solutions"}</h2>
              <div className="text-sm text-slate-600">{shop.shop_address}</div>
              <div className="text-sm text-slate-600">{shop.shop_phone}</div>
              {shop.shop_gst && <div className="text-xs text-slate-500">GST: {shop.shop_gst}</div>}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-500">Invoice</div>
              <div className="font-mono font-bold">{sale.invoice_no}</div>
              <div className="text-sm text-slate-600 mt-1">{formatDate(sale.sale_date)}</div>
            </div>
          </div>
          <div className="py-4 grid grid-cols-2 gap-4 text-sm border-b">
            <div>
              <div className="text-xs uppercase text-slate-500">Bill to</div>
              <div className="font-semibold">{sale.customer_name}</div>
              <div className="text-slate-600">{sale.phone}</div>
              <div className="text-slate-600">{sale.address}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-slate-500">Payment</div>
              <div className="font-semibold capitalize">{sale.payment_mode} — {sale.payment_status}</div>
            </div>
          </div>
          <table className="w-full text-sm my-4">
            <thead className="border-b">
              <tr><th className="text-left py-2">Item</th><th className="text-right">Qty</th><th className="text-right">Rate</th><th className="text-right">Amount</th></tr>
            </thead>
            <tbody>
              <tr className="border-b"><td className="py-2">{sale.item_name}</td><td className="text-right">{sale.qty}</td><td className="text-right">{formatINR(sale.sale_price)}</td><td className="text-right">{formatINR(Number(sale.qty) * Number(sale.sale_price))}</td></tr>
              {Number(sale.discount) > 0 && <tr><td colSpan={3} className="py-1 text-right text-slate-600">Discount</td><td className="text-right text-red-600">- {formatINR(sale.discount)}</td></tr>}
              <tr className="font-bold border-t"><td colSpan={3} className="py-2 text-right">Total</td><td className="text-right">{formatINR(sale.total_amount)}</td></tr>
            </tbody>
          </table>
          <div className="text-xs text-slate-600 border-t pt-3">
            <div><strong>Warranty:</strong> {sale.warranty_months} months — valid till {formatDate(sale.warranty_expiry)}</div>
            {sale.notes && <div className="mt-2"><strong>Notes:</strong> {sale.notes}</div>}
            <div className="mt-3 text-center text-slate-500">Thank you for your business!</div>
          </div>
        </div>
        <div className="border-t bg-slate-50 p-3 flex justify-end gap-2 print:hidden">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200 rounded">Close</button>
          <button onClick={() => window.print()} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1.5"><Printer size={14} />Print</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-xl font-bold text-white mt-0.5">{value}</div>
    </div>
  );
}
const fInput = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500";
function Field({ label, children }: any) {
  return <label className="block"><span className="text-xs text-slate-400 mb-1 block">{label}</span>{children}</label>;
}
