import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate } from "@/crm/lib/format";
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, X } from "lucide-react";

const empty = { name: "", phone: "", whatsapp: "", email: "", address: "", dob: "", notes: "" };

export default function CrmCustomers() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [detail, setDetail] = useState<any>(null);
  const [detailData, setDetailData] = useState<{ sales: any[]; services: any[]; enquiries: any[] }>({ sales: [], services: [], enquiries: [] });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("crm_customers").select("*").order("last_purchase_date", { ascending: false, nullsFirst: false });
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (c: any) => {
    setDetail(c);
    const [sales, services, enq] = await Promise.all([
      supabase.from("crm_sales").select("*").eq("phone", c.phone).order("sale_date", { ascending: false }),
      supabase.from("crm_services").select("*").eq("phone", c.phone).order("received_date", { ascending: false }),
      supabase.from("crm_enquiries").select("*").eq("phone", c.phone).order("created_at", { ascending: false }),
    ]);
    setDetailData({ sales: sales.data || [], services: services.data || [], enquiries: enq.data || [] });
  };

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name?.toLowerCase().includes(q) || r.phone?.includes(q);
  });

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...empty, ...r, dob: r.dob || "" }); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, dob: form.dob || null, whatsapp: form.whatsapp || form.phone };
    if (editing) {
      const { error } = await supabase.from("crm_customers").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Customer updated");
    } else {
      const { error } = await supabase.from("crm_customers").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Customer added");
    }
    setShowForm(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    const { error } = await supabase.from("crm_customers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-sm text-slate-400">{filtered.length} of {rows.length} customers</p>
        </div>
        <button onClick={openNew} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Plus size={14} />Add Customer</button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone…" className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Phone</th>
              <th className="text-right px-3 py-2">Purchases</th>
              <th className="text-right px-3 py-2">Total Value</th>
              <th className="text-left px-3 py-2">Last</th>
              <th className="text-left px-3 py-2">DOB</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-6 text-slate-500">Loading…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-slate-500">No customers yet</td></tr> :
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-800/30 cursor-pointer" onClick={() => openDetail(r)}>
                  <td className="px-3 py-2 text-white">{r.name}</td>
                  <td className="px-3 py-2 text-slate-300">{r.phone}</td>
                  <td className="px-3 py-2 text-right text-slate-300">{r.total_purchases || 0}</td>
                  <td className="px-3 py-2 text-right text-green-400 font-medium">{formatINR(r.total_value)}</td>
                  <td className="px-3 py-2 text-slate-400 text-xs">{formatDate(r.last_purchase_date)}</td>
                  <td className="px-3 py-2 text-slate-400 text-xs">{r.dob ? formatDate(r.dob) : "—"}</td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded"><Edit2 size={14} /></button>
                      <button onClick={() => remove(r.id)} className="p-1.5 text-red-400 hover:bg-red-600/20 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-xl my-8 space-y-3">
            <h3 className="text-lg font-semibold text-white">{editing ? "Edit" : "New"} Customer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Name *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fInput} /></Field>
              <Field label="Phone *"><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fInput} /></Field>
              <Field label="WhatsApp"><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={fInput} /></Field>
              <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fInput} /></Field>
              <Field label="Date of Birth"><input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className={fInput} /></Field>
              <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={fInput} /></Field>
            </div>
            <Field label="Notes"><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={fInput} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium">Save</button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-3xl my-8 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white">{detail.name}</h3>
                <div className="text-sm text-slate-400">{detail.phone} · {detail.email}</div>
                <div className="text-xs text-slate-500 mt-0.5">{detail.address}</div>
              </div>
              <button onClick={() => setDetail(null)} className="p-1 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat2 label="Purchases" value={detail.total_purchases || 0} />
              <Stat2 label="Total Value" value={formatINR(detail.total_value)} />
              <Stat2 label="DOB" value={detail.dob ? formatDate(detail.dob) : "—"} />
            </div>
            <Section title={`Sales (${detailData.sales.length})`}>
              {detailData.sales.length === 0 ? <Empty /> : detailData.sales.map((s) => (
                <Row key={s.id}>
                  <span className="text-white">{s.item_name}</span>
                  <span className="text-slate-500 text-xs">{s.invoice_no} · {formatDate(s.sale_date)}</span>
                  <span className="text-green-400 font-medium ml-auto">{formatINR(s.total_amount)}</span>
                </Row>
              ))}
            </Section>
            <Section title={`Services (${detailData.services.length})`}>
              {detailData.services.length === 0 ? <Empty /> : detailData.services.map((s) => (
                <Row key={s.id}>
                  <span className="text-white">{s.device_type} {s.brand} {s.model}</span>
                  <span className="text-slate-500 text-xs">{s.job_card_no} · {s.status}</span>
                </Row>
              ))}
            </Section>
            <Section title={`Enquiries (${detailData.enquiries.length})`}>
              {detailData.enquiries.length === 0 ? <Empty /> : detailData.enquiries.map((e) => (
                <Row key={e.id}>
                  <span className="text-white">{e.item_name || e.product_category}</span>
                  <span className="text-slate-500 text-xs">{formatDate(e.created_at)} · {e.status}</span>
                </Row>
              ))}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat2({ label, value }: any) {
  return <div className="bg-slate-800/50 rounded p-2"><div className="text-xs text-slate-500">{label}</div><div className="font-bold text-white">{value}</div></div>;
}
function Section({ title, children }: any) {
  return <div><h4 className="text-sm font-semibold text-slate-300 mb-1.5 border-b border-slate-800 pb-1">{title}</h4><div className="space-y-1">{children}</div></div>;
}
function Row({ children }: any) { return <div className="flex items-center gap-3 text-sm py-1.5">{children}</div>; }
function Empty() { return <div className="text-xs text-slate-500 italic py-1">None</div>; }
const fInput = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500";
function Field({ label, children }: any) { return <label className="block"><span className="text-xs text-slate-400 mb-1 block">{label}</span>{children}</label>; }
