import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate, todayISO, waLink } from "@/crm/lib/format";
import { toast } from "sonner";
import { Plus, Search, Edit2, MessageCircle, X, Wrench } from "lucide-react";
import { useAdminSetting } from "@/crm/hooks/useAdminSettings";

const STATUSES = ["received", "diagnosing", "in_repair", "ready", "delivered"] as const;
type Status = typeof STATUSES[number];

const STATUS_META: Record<Status, { label: string; color: string }> = {
  received:    { label: "Received",     color: "bg-slate-500/15 text-slate-300 border-slate-500/40" },
  diagnosing:  { label: "Diagnosing",   color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40" },
  in_repair:   { label: "In Repair",    color: "bg-blue-500/15 text-blue-300 border-blue-500/40" },
  ready:       { label: "Ready",        color: "bg-purple-500/15 text-purple-300 border-purple-500/40" },
  delivered:   { label: "Delivered",    color: "bg-green-500/15 text-green-300 border-green-500/40" },
};

const empty = {
  job_card_no: "",
  customer_name: "", phone: "", whatsapp: "",
  device_type: "Laptop", brand: "", model: "",
  issue_description: "",
  status: "received" as Status,
  estimated_cost: 0, final_cost: 0,
  technician_notes: "",
  received_date: todayISO(),
  delivery_date: "",
};

async function nextJobCardNo() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const prefix = `JOB-${y}${m}${d}`;
  const { data } = await supabase
    .from("crm_services")
    .select("job_card_no")
    .like("job_card_no", `${prefix}-%`)
    .order("job_card_no", { ascending: false })
    .limit(1);
  let n = 1;
  if (data && data[0]) {
    const last = data[0].job_card_no.split("-").pop();
    n = (parseInt(last || "0", 10) || 0) + 1;
  }
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

export default function CrmServices() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_services")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = async () => {
    const jc = await nextJobCardNo();
    setForm({ ...empty, job_card_no: jc });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (r: any) => {
    setForm({
      ...empty, ...r,
      delivery_date: r.delivery_date || "",
      estimated_cost: r.estimated_cost || 0,
      final_cost: r.final_cost || 0,
    });
    setEditId(r.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.customer_name || !form.phone || !form.device_type) {
      toast.error("Customer, phone and device type are required");
      return;
    }
    const payload = {
      ...form,
      delivery_date: form.delivery_date || null,
      estimated_cost: Number(form.estimated_cost) || 0,
      final_cost: Number(form.final_cost) || 0,
    };
    let err;
    if (editId) {
      ({ error: err } = await supabase.from("crm_services").update(payload).eq("id", editId));
    } else {
      ({ error: err } = await supabase.from("crm_services").insert([payload]));
    }
    if (err) { toast.error(err.message); return; }
    toast.success(editId ? "Updated" : "Job card created");
    setShowForm(false);
    load();
  };

  const updateStatus = async (id: string, status: Status) => {
    const patch: any = { status };
    if (status === "delivered") patch.delivery_date = todayISO();
    const { error } = await supabase.from("crm_services").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Moved to ${STATUS_META[status].label}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this job card?")) return;
    const { error } = await supabase.from("crm_services").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  const sendWA = (r: any) => {
    const msg = `Hi ${r.customer_name}, update on your ${r.device_type} (Job ${r.job_card_no}): Status is now *${STATUS_META[r.status as Status]?.label || r.status}*.${r.final_cost ? ` Final cost: ${formatINR(r.final_cost)}.` : r.estimated_cost ? ` Estimate: ${formatINR(r.estimated_cost)}.` : ""} — The Computer Solutions`;
    window.open(waLink(r.whatsapp || r.phone, msg), "_blank");
  };

  const filtered = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return [r.job_card_no, r.customer_name, r.phone, r.brand, r.model, r.device_type]
      .filter(Boolean).some((x: string) => x.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Service Center</h1>
          <p className="text-sm text-slate-400">Track repair jobs through their lifecycle</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded p-0.5 flex">
            <button onClick={() => setView("kanban")} className={`px-3 py-1.5 text-xs rounded ${view === "kanban" ? "bg-blue-600 text-white" : "text-slate-400"}`}>Kanban</button>
            <button onClick={() => setView("table")} className={`px-3 py-1.5 text-xs rounded ${view === "table" ? "bg-blue-600 text-white" : "text-slate-400"}`}>Table</button>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white">
            <Plus size={16} /> New Job Card
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by job no, customer, phone, device..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white placeholder:text-slate-500"
        />
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {STATUSES.map(st => {
            const items = filtered.filter(r => r.status === st);
            return (
              <div key={st} className="bg-slate-900 border border-slate-800 rounded-lg p-3 min-h-[200px]">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${STATUS_META[st].color}`}>{STATUS_META[st].label}</span>
                  <span className="text-xs text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(r => (
                    <div key={r.id} className="bg-slate-950 border border-slate-800 rounded p-3 hover:border-slate-700">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs text-blue-300 font-mono">{r.job_card_no}</div>
                          <div className="text-sm text-white font-medium truncate">{r.customer_name}</div>
                          <div className="text-xs text-slate-400 truncate">{r.device_type}{r.brand ? ` · ${r.brand}` : ""}{r.model ? ` ${r.model}` : ""}</div>
                        </div>
                      </div>
                      {r.issue_description && <div className="text-xs text-slate-500 mt-2 line-clamp-2">{r.issue_description}</div>}
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                        <span>{formatDate(r.received_date)}</span>
                        <span>{r.final_cost ? formatINR(r.final_cost) : r.estimated_cost ? `~${formatINR(r.estimated_cost)}` : ""}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <select
                          value={r.status}
                          onChange={(e) => updateStatus(r.id, e.target.value as Status)}
                          className="flex-1 text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                        </select>
                        <button onClick={() => sendWA(r)} className="p-1.5 text-green-400 hover:bg-slate-800 rounded" title="WhatsApp"><MessageCircle size={14} /></button>
                        <button onClick={() => openEdit(r)} className="p-1.5 text-blue-400 hover:bg-slate-800 rounded" title="Edit"><Edit2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="text-xs text-slate-600 text-center py-6">No jobs</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Job No</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Device</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-left">Received</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-950/50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-300">{r.job_card_no}</td>
                  <td className="px-4 py-3 text-white">{r.customer_name}<div className="text-xs text-slate-500">{r.phone}</div></td>
                  <td className="px-4 py-3 text-slate-300">{r.device_type}<div className="text-xs text-slate-500">{r.brand} {r.model}</div></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded border ${STATUS_META[r.status as Status]?.color || ""}`}>{STATUS_META[r.status as Status]?.label || r.status}</span></td>
                  <td className="px-4 py-3 text-right text-slate-300">{r.final_cost ? formatINR(r.final_cost) : r.estimated_cost ? `~${formatINR(r.estimated_cost)}` : "—"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(r.received_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => sendWA(r)} className="p-1.5 text-green-400 hover:bg-slate-800 rounded"><MessageCircle size={14} /></button>
                      <button onClick={() => openEdit(r)} className="p-1.5 text-blue-400 hover:bg-slate-800 rounded"><Edit2 size={14} /></button>
                      <button onClick={() => remove(r.id)} className="p-1.5 text-red-400 hover:bg-slate-800 rounded"><X size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500"><Wrench className="mx-auto mb-2 opacity-40" /> No service jobs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">{editId ? "Edit Job Card" : "New Job Card"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Job Card No"><input value={form.job_card_no} onChange={e => setForm({ ...form, job_card_no: e.target.value })} className={inp} /></Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inp}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </Field>
                <Field label="Customer Name *"><input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} className={inp} /></Field>
                <Field label="Phone *"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inp} /></Field>
                <Field label="WhatsApp"><input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className={inp} placeholder="defaults to phone" /></Field>
                <Field label="Device Type *">
                  <select value={form.device_type} onChange={e => setForm({ ...form, device_type: e.target.value })} className={inp}>
                    {["Laptop", "Desktop", "Printer", "CCTV", "Mobile", "Other"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Brand"><input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className={inp} /></Field>
                <Field label="Model"><input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className={inp} /></Field>
                <Field label="Estimated Cost"><input type="number" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} className={inp} /></Field>
                <Field label="Final Cost"><input type="number" value={form.final_cost} onChange={e => setForm({ ...form, final_cost: e.target.value })} className={inp} /></Field>
                <Field label="Received Date"><input type="date" value={form.received_date} onChange={e => setForm({ ...form, received_date: e.target.value })} className={inp} /></Field>
                <Field label="Delivery Date"><input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} className={inp} /></Field>
              </div>
              <Field label="Issue Description"><textarea value={form.issue_description} onChange={e => setForm({ ...form, issue_description: e.target.value })} className={inp} rows={2} /></Field>
              <Field label="Technician Notes"><textarea value={form.technician_notes} onChange={e => setForm({ ...form, technician_notes: e.target.value })} className={inp} rows={2} /></Field>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-800">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Cancel</button>
              <button onClick={save} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded">{editId ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-500";
const Field = ({ label, children }: { label: string; children: any }) => (
  <label className="block">
    <span className="text-xs text-slate-400 mb-1 block">{label}</span>
    {children}
  </label>
);
