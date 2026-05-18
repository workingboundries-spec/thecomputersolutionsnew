import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate, waLink } from "@/crm/lib/format";
import { getTemplate, fillTemplate, buildEnquiryVars } from "@/crm/lib/whatsapp";
import { useAdminSettings } from "@/crm/hooks/useAdminSettings";
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, ArrowRight, Download, MessageCircle, X } from "lucide-react";
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

// ── Quick Add to Catalogue modal ──────────────────────────────────────────────
function QuickAddCatalogueModal({
  prefillName, onClose, onCreated,
}: {
  prefillName: string;
  onClose: () => void;
  onCreated: (item: any) => void;
}) {
  const parts = prefillName.trim().split(" ");
  const [brand, setBrand] = useState(parts[0] || "");
  const [model, setModel] = useState(parts.slice(1).join(" ") || "");
  const [category, setCategory] = useState("laptop");
  const [salePrice, setSalePrice] = useState("");
  const [specs, setSpecs] = useState("");
  const [saving, setSaving] = useState(false);

  // Block Escape so it doesn't close the parent form behind this modal
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); } };
    document.addEventListener("keydown", h, true);
    return () => document.removeEventListener("keydown", h, true);
  }, []);

  const save = async () => {
    if (!brand.trim() || !model.trim()) return toast.error("Brand and model are required");
    setSaving(true);
    const { data, error } = await supabase.from("crm_catalogue").insert({
      brand: brand.trim(), model: model.trim(), category,
      sale_price: Number(salePrice || 0),
      nlc_price: 0, billing_price: 0, online_price: 0, mrp: 0,
      stock_qty: 0, current_stock: 0, opening_stock: 0,
      specs: specs.trim() || null, is_active: true,
    }).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`"${brand} ${model}" added to catalogue`);
    onCreated(data);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Quick Add to Catalogue</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-xs text-slate-400">Brand &amp; model required. Fill pricing and stock in Catalogue later.</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-slate-400 block mb-1">Brand *</label><input value={brand} onChange={(e) => setBrand(e.target.value)} className={fInput} /></div>
          <div><label className="text-xs text-slate-400 block mb-1">Model *</label><input value={model} onChange={(e) => setModel(e.target.value)} className={fInput} /></div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={fInput}>
              <option value="laptop">Laptop</option>
              <option value="cctv">CCTV</option>
              <option value="accessory">Accessory</option>
              <option value="networking">Networking</option>
              <option value="printer">Printer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div><label className="text-xs text-slate-400 block mb-1">Sale Price (₹)</label><input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className={fInput} /></div>
        </div>
        <div><label className="text-xs text-slate-400 block mb-1">Specifications</label>
          <textarea value={specs} onChange={(e) => setSpecs(e.target.value)} rows={2} className={fInput} placeholder="e.g. i5 13th / 8GB / 512GB SSD" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50">
            {saving ? "Adding…" : "Add to Catalogue"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

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
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  // ── Quick Add to Catalogue state ──────────────────────────────────────────
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  // ─────────────────────────────────────────────────────────────────────────
  const navigate = useNavigate();

  const findCatalogueSpecs = (itemName?: string): string => {
    const n = (itemName || "").trim().toLowerCase();
    if (!n) return "";
    const c = catalogue.find((x) => `${x.brand} ${x.model}`.toLowerCase() === n);
    return (c?.specs || "").trim();
  };

  // True when typed item name doesn't match any catalogue entry
  const itemNotInCatalogue = form.item_name?.trim()
    && !catalogue.some((c) => `${c.brand} ${c.model}`.toLowerCase() === form.item_name.trim().toLowerCase());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("crm_enquiries").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data || []);
    const { data: salesData } = await supabase.from("crm_sales").select("enquiry_id").not("enquiry_id", "is", null);
    setLinkedSaleIds(new Set((salesData || []).map((s: any) => s.enquiry_id)));
    const { data: catData } = await supabase.from("crm_catalogue").select("id, item_code, brand, model, specs").eq("is_active", true);
    setCatalogue(catData || []);
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

  const shop = useAdminSettings(["shop_name", "shop_phone", "shop_email", "shop_address"]);

  const sendWA = async (r: any) => {
    const specs = findCatalogueSpecs(r.item_name);
    const tpl = await getTemplate("enquiry_followup", "Hi {name}, regarding your enquiry for {item} at {shop_name}.{specs_block}{notes_block}\n— {shop_name}");
    const msg = fillTemplate(tpl, buildEnquiryVars(r, { shop, specs }));
    window.open(waLink(r.whatsapp || r.phone, msg), "_blank");
  };

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...empty, ...r, budget: r.budget ?? "" }); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const prevStatus = editing?.status;
    if (form.status === "converted" && prevStatus !== "converted") {
      toast.error("Use the green Convert arrow to create a sale. Status will auto-update after the sale is saved.");
      return;
    }
    const payload = { ...form, budget: form.budget === "" ? null : Number(form.budget), whatsapp: form.whatsapp || form.phone };
    if (editing) {
      const { error } = await supabase.from("crm_enquiries").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Enquiry updated");
    } else {
      const { error } = await supabase.from("crm_enquiries").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Enquiry added");
    }
    setShowForm(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    const { error } = await supabase.from("crm_enquiries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const convertToSale = (r: any) => {
    const params = new URLSearchParams({
      enquiry_id: r.id, customer_name: r.customer_name || "",
      phone: r.phone || "", whatsapp: r.whatsapp || r.phone || "",
      address: r.address || "", item_name: r.item_name || "",
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
                  <td className={`px-3 py-2 text-white ${isConv ? "line-through decoration-green-500" : ""}`}>
                    {r.customer_name}
                    {isConv && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 no-underline">Converted</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-300">{r.phone}</td>
                  <td className="px-3 py-2 text-slate-300">
                    {r.item_name || "—"}
                    {(() => { const sp = findCatalogueSpecs(r.item_name); return sp ? <div className="text-[11px] text-slate-500 mt-0.5 whitespace-pre-wrap">{sp}</div> : null; })()}
                  </td>
                  <td className="px-3 py-2 text-slate-300">{r.budget ? formatINR(r.budget) : "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                    {r.status === "converted" && !linkedSaleIds.has(r.id) && (
                      <button onClick={() => convertToSale(r)} className="ml-2 text-xs text-amber-400 hover:underline" title="No sale record linked">
                        ⚠ No sale linked — Create sale
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1 items-center">
                      <button onClick={() => sendWA(r)} title="WhatsApp" className="p-1.5 text-green-400 hover:bg-green-600/20 rounded"><MessageCircle size={14} /></button>
                      {!isConv && (
                        <button onClick={() => convertToSale(r)} title="Convert to Sale" className="px-2 py-1 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded flex items-center gap-1">
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

      {/* ── Enquiry Form — backdrop does NOT close the dialog ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={save}
            className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-2xl my-8 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editing ? "Edit" : "New"} Enquiry</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
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
              <Field label="Item Name">
                <div className="relative">
                  <input
                    value={form.item_name}
                    onChange={(e) => { setForm({ ...form, item_name: e.target.value }); setItemPickerOpen(true); }}
                    onFocus={() => setItemPickerOpen(true)}
                    onBlur={() => setTimeout(() => setItemPickerOpen(false), 200)}
                    placeholder="Type or pick from catalogue"
                    className={fInput}
                  />
                  {itemPickerOpen && (() => {
                    const q = (form.item_name || "").trim().toLowerCase();
                    // ── FIX: item picker now also searches specs ──────────────
                    const list = catalogue
                      .filter((c) => {
                        if (!q) return true;
                        return `${c.brand} ${c.model}`.toLowerCase().includes(q)
                          || (c.item_code || "").toLowerCase().includes(q)
                          || (c.specs || "").toLowerCase().includes(q);
                      })
                      .slice(0, 8);
                    // ─────────────────────────────────────────────────────────
                    if (list.length === 0) return null;
                    return (
                      <div className="absolute z-10 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded shadow-lg max-h-64 overflow-y-auto">
                        {list.map((c) => (
                          <button
                            type="button" key={c.id}
                            onMouseDown={(ev) => { ev.preventDefault(); setForm({ ...form, item_name: `${c.brand} ${c.model}` }); setItemPickerOpen(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm text-white"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-blue-300 px-1.5 py-0.5 bg-slate-900 rounded">{c.item_code}</span>
                              <span>{c.brand} {c.model}</span>
                            </div>
                            {c.specs && <div className="text-[11px] text-slate-400 mt-0.5 whitespace-pre-wrap">{c.specs}</div>}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {/* Show matched specs below the input */}
                {(() => { const sp = findCatalogueSpecs(form.item_name); return sp ? <div className="mt-1 text-[11px] text-slate-400 whitespace-pre-wrap"><span className="text-slate-500">Specs: </span>{sp}</div> : null; })()}
                {/* ── Quick Add to Catalogue prompt ── */}
                {itemNotInCatalogue && (
                  <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                    <span>"{form.item_name}" not in catalogue.</span>
                    <button
                      type="button"
                      onClick={() => setShowQuickAdd(true)}
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      + Add to Catalogue
                    </button>
                  </div>
                )}
              </Field>
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
                  <option value="social_media">Social Media</option><option value="referral">Referral</option>
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

      {/* Quick Add to Catalogue modal */}
      {showQuickAdd && (
        <QuickAddCatalogueModal
          prefillName={form.item_name || ""}
          onClose={() => setShowQuickAdd(false)}
          onCreated={(newItem) => {
            setShowQuickAdd(false);
            // Auto-fill item name from new catalogue entry
            setForm({ ...form, item_name: `${newItem.brand} ${newItem.model}` });
            // Refresh catalogue so new item appears in picker and specs lookup
            supabase.from("crm_catalogue").select("id, item_code, brand, model, specs").eq("is_active", true)
              .then(({ data }) => { if (data) setCatalogue(data); });
          }}
        />
      )}
    </div>
  );
}

const fInput = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500";
function Field({ label, children }: any) {
  return <label className="block"><span className="text-xs text-slate-400 mb-1 block">{label}</span>{children}</label>;
}
