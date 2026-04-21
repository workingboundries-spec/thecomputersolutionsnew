import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate, waLink } from "@/crm/lib/format";
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, ArrowRight, Download, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_BADGE: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-300",
  follow_up: "bg-yellow-500/15 text-yellow-300",
  converted: "bg-green-500/15 text-green-300",
  lost: "bg-red-500/15 text-red-300",
};

const empty = {
  customer_name: "", phone: "", whatsapp: "", address: "",
  product_category: "laptop", item_name: "", budget: "", description: "",
  status: "new", source: "walkin", notes: "",
};

export default function CrmEnquiries() {
  const [rows, setRows] = useState<any[]>([]);
  const [linkedSaleIds, setLinkedSaleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [showConverted, setShowConverted] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("crm_enquiries").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data || []);
    // Fetch all sales with enquiry_id to know which enquiries are actually linked to a sale
    const { data: salesData } = await supabase.from("crm_sales").select("enquiry_id").not("enquiry_id", "is", null);
    setLinkedSaleIds(new Set((salesData || []).map((s: any) => s.enquiry_id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    const isConvertedDerived = r.is_converted || r.status === "converted" || linkedSaleIds.has(r.id);
    if (!showConverted && isConvertedDerived) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterCat && r.product_category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.customer_name?.toLowerCase().includes(q) && !r.phone?.includes(q)) return false;
    }
    return true;
  });

  const sendWA = (r: any) => {
    const msg = `Hi ${r.customer_name}, regarding your enquiry for ${r.item_name || r.product_category} at The Computer Solutions.${r.notes ? " " + r.notes : ""}`;
    window.open(waLink(r.whatsapp || r.phone, msg), "_blank");
  };

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (r: any) => {
    setEditing(r);
    setForm({ ...empty, ...r, budget: r.budget ?? "" });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // Guard: prevent manually marking as "converted" — must go through Convert flow which creates the sale row
    const prevStatus = editing?.status;
    if (form.status === "converted" && prevStatus !== "converted") {
      toast.error("Use the green Convert arrow to create a sale. Status will auto-update after the sale is saved.");
      return;
    }
    const payload = {
      ...form,
      budget: form.budget === "" ? null : Number(form.budget),
      whatsapp: form.whatsapp || form.phone,
    };
    if (editing) {
      const { error } = await supabase.from("crm_enquiries").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Enquiry updated");
    } else {
      const { error } = await supabase.from("crm_enquiries").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Enquiry added");
    }
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    const { error } = await supabase.from("crm_enquiries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const convertToSale = (r: any) => {
    const params = new URLSearchParams({
      enquiry_id: r.id,
      customer_name: r.customer_name || "",
      phone: r.phone || "",
      whatsapp: r.whatsapp || r.phone || "",
      address: r.address || "",
      item_name: r.item_name || "",
      sale_price: String(r.budget || ""),
    });
    navigate(`/crm/sales?new=1&${params.toString()}`);
  };

  const exportCsv = () => {
    const headers = ["created_at","customer_name","phone","whatsapp","product_category","item_name","budget","status","source","notes"];
    const csv = [headers.join(","), ...filtered.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `enquiries-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Enquiries</h1>
          <p className="text-sm text-slate-400">{filtered.length} of {rows.length} enquiries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm flex items-center gap-1.5"><Download size={14} />Export</button>
          <button onClick={openNew} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Plus size={14} />Add Enquiry</button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone…" className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white">
          <option value="">All status</option>
          <option value="new">New</option><option value="follow_up">Follow-up</option>
          <option value="converted">Converted</option><option value="lost">Lost</option>
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white">
          <option value="">All categories</option>
          <option value="laptop">Laptop</option><option value="cctv">CCTV</option>
          <option value="accessory">Accessory</option><option value="other">Other</option>
        </select>
        <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" checked={showConverted} onChange={(e) => setShowConverted(e.target.checked)} />
          Show Converted
        </label>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="text-left px-3 py-2">Date</th>
              <th className="text-left px-3 py-2">Customer</th>
              <th className="text-left px-3 py-2">Phone</th>
              <th className="text-left px-3 py-2">Item</th>
              <th className="text-left px-3 py-2">Budget</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6 text-slate-500">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-500">
                <div>No enquiries found</div>
                <button onClick={openNew} className="mt-2 text-blue-400 hover:underline text-xs">+ Add the first one</button>
              </td></tr>
            ) : filtered.map((r) => {
              const isConv = r.is_converted || r.status === "converted";
              return (
              <tr key={r.id} className={`border-t border-slate-800 hover:bg-slate-800/30 ${isConv ? "opacity-60" : ""}`}>
                <td className="px-3 py-2 text-slate-400 text-xs">{formatDate(r.created_at)}</td>
                <td className={`px-3 py-2 text-white ${isConv ? "line-through decoration-green-500" : ""}`}>{r.customer_name}{isConv && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 no-underline">Converted</span>}</td>
                <td className="px-3 py-2 text-slate-300">{r.phone}</td>
                <td className="px-3 py-2 text-slate-300">{r.item_name || "—"}</td>
                <td className="px-3 py-2 text-slate-300">{r.budget ? formatINR(r.budget) : "—"}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                  {r.status === "converted" && !linkedSaleIds.has(r.id) && (
                    <button onClick={() => convertToSale(r)} className="ml-2 text-xs text-amber-400 hover:underline" title="This enquiry is marked converted but has no sale record">
                      ⚠ No sale linked — Create sale
                    </button>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1 items-center">
                    <button onClick={() => sendWA(r)} title="WhatsApp" className="p-1.5 text-green-400 hover:bg-green-600/20 rounded"><MessageCircle size={14} /></button>
                    {!isConv && (
                      <button onClick={() => convertToSale(r)} title="Convert to Sale (creates sale entry)" className="px-2 py-1 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded flex items-center gap-1">
                        Convert <ArrowRight size={12} />
                      </button>
                    )}
                    <button onClick={() => openEdit(r)} title="Edit" className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded"><Edit2 size={14} /></button>
                    <button onClick={() => remove(r.id)} title="Delete" className="p-1.5 text-red-400 hover:bg-red-600/20 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-2xl my-8 space-y-3">
            <h3 className="text-lg font-semibold text-white">{editing ? "Edit" : "New"} Enquiry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Customer Name *"><input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className={fInput} /></Field>
              <Field label="Phone *"><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value, whatsapp: form.whatsapp || e.target.value })} className={fInput} /></Field>
              <Field label="WhatsApp"><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={fInput} /></Field>
              <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={fInput} /></Field>
              <Field label="Product Category">
                <select value={form.product_category} onChange={(e) => setForm({ ...form, product_category: e.target.value })} className={fInput}>
                  <option value="laptop">Laptop</option><option value="cctv">CCTV</option>
                  <option value="accessory">Accessory</option><option value="other">Other</option>
                </select>
              </Field>
              <Field label="Item Name"><input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className={fInput} /></Field>
              <Field label="Budget (₹)"><input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className={fInput} /></Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={fInput}>
                  <option value="new">New</option><option value="follow_up">Follow-up</option>
                  <option value="converted" disabled>Converted (use Convert button)</option>
                  <option value="lost">Lost</option>
                </select>
              </Field>
              <Field label="Source">
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={fInput}>
                  <option value="walkin">Walk-in</option><option value="website">Website</option><option value="call">Call</option>
                </select>
              </Field>
            </div>
            <Field label="Description"><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={fInput} /></Field>
            <Field label="Notes"><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={fInput} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const fInput = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500";
function Field({ label, children }: any) {
  return <label className="block"><span className="text-xs text-slate-400 mb-1 block">{label}</span>{children}</label>;
}
