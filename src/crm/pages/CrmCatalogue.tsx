import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Share2, Grid3x3, List, Search, X, Copy, History } from "lucide-react";
import { formatINR, todayISO, addDays, waLink } from "@/crm/lib/format";
import { useAdminSetting } from "@/crm/hooks/useAdminSettings";
import { useCrmAuth } from "@/crm/hooks/useCrmAuth";
import { applyMovement } from "@/crm/lib/inventory";
import PriceHistoryDrawer from "@/crm/components/inventory/PriceHistoryDrawer";
import { logPriceChanges, type PriceField } from "@/crm/lib/priceHistory";

type Item = {
  id: string;
  item_code: string;
  brand: string;
  model: string;
  category: string;
  specs: string | null;
  stock_qty: number;
  nlc_price: number;
  billing_price: number;
  sale_price: number;
  online_price: number;
  mrp: number;
  is_active: boolean;
  image_url: string | null;
};

const CATEGORIES = ["laptop", "cctv", "accessory", "networking", "printer", "other"];

const empty: Partial<Item> = {
  brand: "", model: "", category: "laptop", specs: "",
  stock_qty: 0, nlc_price: 0, billing_price: 0, sale_price: 0, online_price: 0, mrp: 0,
  is_active: true, image_url: "",
};

function stockColor(q: number) {
  if (q === 0) return "bg-red-500/20 text-red-300 border-red-500/40";
  if (q < 3) return "bg-orange-500/20 text-orange-300 border-orange-500/40";
  return "bg-green-500/20 text-green-300 border-green-500/40";
}

function margin(sale: number, nlc: number) {
  if (!sale) return 0;
  return ((sale - nlc) / sale) * 100;
}

export default function CrmCatalogue() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "table">("table");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [shareItem, setShareItem] = useState<Item | null>(null);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const adminCategories = useAdminSetting<string[]>("catalogue_categories", []);
  const dynamicCats = (adminCategories && adminCategories.length ? adminCategories.map((c: string) => c.toLowerCase()) : CATEGORIES);
  const { user } = useCrmAuth();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("crm_catalogue").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setItems((data || []) as Item[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.brand || !editing?.model) return toast.error("Brand and model required");
    const qty = Number(editing.stock_qty || 0);
    const isNew = !editing.id;
    const original = isNew ? null : items.find((x) => x.id === editing.id) || null;
    const originalQty = Number(original?.stock_qty || 0);

    const payload: any = {
      brand: editing.brand, model: editing.model, category: editing.category || "laptop",
      specs: editing.specs || null, stock_qty: qty,
      nlc_price: Number(editing.nlc_price || 0), billing_price: Number(editing.billing_price || 0),
      sale_price: Number(editing.sale_price || 0), online_price: Number(editing.online_price || 0),
      mrp: Number(editing.mrp || 0), is_active: editing.is_active ?? true,
      image_url: editing.image_url || null,
      current_stock: qty,
      // Catalogue qty edit acts as a "reset" — opening stock follows the new qty
      // so the Stock Report's Opening column always matches what's in the catalogue.
      opening_stock: qty,
    };

    if (isNew) {
      const { data: created, error } = await supabase.from("crm_catalogue").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      // Write opening-stock ledger row so Stock Report's math is consistent.
      if (qty > 0 && created?.id) {
        await supabase.from("inventory_transactions" as any).insert({
          item_id: created.id,
          movement_type: "opening_stock",
          qty: qty,
          balance_after: qty,
          notes: "Initial stock on item creation",
          created_by: user?.id ?? null,
        });
      }
      toast.success("Added");
    } else {
      const { error } = await supabase.from("crm_catalogue").update(payload).eq("id", editing.id!);
      if (error) return toast.error(error.message);

      // Log a ledger row when the qty is reset via catalogue (informational; not counted as Received).
      const delta = qty - originalQty;
      if (delta !== 0) {
        await supabase.from("inventory_transactions" as any).insert({
          item_id: editing.id,
          movement_type: "audit_adjustment",
          qty: delta,
          balance_after: qty,
          reason: "Catalogue qty reset — opening stock updated",
          created_by: user?.id ?? null,
        });
      }

      // Log price-field changes to history
      if (original) {
        const fields: PriceField[] = ["nlc_price", "billing_price", "sale_price", "online_price", "mrp"];
        const changes = fields
          .map((f) => ({ field: f, oldValue: Number((original as any)[f] || 0), newValue: Number((editing as any)[f] || 0) }))
          .filter((c) => c.oldValue !== c.newValue);
        if (changes.length > 0) {
          await logPriceChanges({
            itemId: editing.id!,
            changes,
            source: "manual_edit",
            notes: "Edited from Catalogue",
            changedBy: user?.id ?? null,
          });
        }
      }
      toast.success("Updated");
    }
    setShowForm(false); setEditing(null); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("crm_catalogue").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => toast.success(`Copied ${code}`)).catch(() => {});
  };

  const duplicate = (i: Item) => {
    const { id, item_code, ...rest } = i;
    setEditing({ ...rest, model: `${i.model} (Copy)` });
    setShowForm(true);
    toast.success("Item data copied — edit & save as new");
  };

  const filtered = items.filter((i) => {
    const s = search.toLowerCase();
    const matchSearch = !s
      || i.brand.toLowerCase().includes(s)
      || i.model.toLowerCase().includes(s)
      || (i.item_code || "").toLowerCase().includes(s);
    const matchCat = !filterCat || i.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Catalogue</h1>
        <div className="flex gap-2">
          <div className="flex bg-slate-900 border border-slate-800 rounded">
            <button onClick={() => setView("table")} className={`p-2 ${view === "table" ? "bg-blue-600 text-white" : "text-slate-400"}`}><List size={16} /></button>
            <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-blue-600 text-white" : "text-slate-400"}`}><Grid3x3 size={16} /></button>
          </div>
          <button onClick={() => { setEditing(empty); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brand, model or code (ITM-0001)..." className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white">
          <option value="">All categories</option>
          {dynamicCats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded">
          <p className="text-slate-400 mb-3">No items yet</p>
          <button onClick={() => { setEditing(empty); setShowForm(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm">Add first item</button>
        </div>
      ) : view === "table" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
              <tr>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Brand / Model</th>
                <th className="text-left p-3">Category</th>
                <th className="text-right p-3">Stock</th>
                <th className="text-right p-3">NLC</th>
                <th className="text-right p-3">Sale</th>
                <th className="text-right p-3">Margin</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-slate-800/30">
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => copyCode(i.item_code)}
                      title="Click to copy code"
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded font-mono text-xs text-blue-300"
                    >
                      {i.item_code}
                      <Copy size={11} className="opacity-60" />
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-white">{i.brand}</div>
                    <div className="text-xs text-slate-400">{i.model}</div>
                  </td>
                  <td className="p-3 text-slate-300 capitalize">{i.category}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-xs border ${stockColor(i.stock_qty)}`}>{i.stock_qty}</span>
                  </td>
                  <td className="p-3 text-right text-slate-300">{formatINR(i.nlc_price)}</td>
                  <td className="p-3 text-right text-white font-medium">{formatINR(i.sale_price)}</td>
                  <td className="p-3 text-right text-green-400">{margin(i.sale_price, i.nlc_price).toFixed(1)}%</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setShareItem(i)} title="Share quote" className="p-1.5 hover:bg-slate-700 rounded text-blue-400"><Share2 size={14} /></button>
                      <button onClick={() => setHistoryItem(i)} title="Price history" className="p-1.5 hover:bg-slate-700 rounded text-purple-400"><History size={14} /></button>
                      <button onClick={() => duplicate(i)} title="Duplicate item" className="p-1.5 hover:bg-slate-700 rounded text-amber-400"><Copy size={14} /></button>
                      <button onClick={() => { setEditing(i); setShowForm(true); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-300"><Pencil size={14} /></button>
                      <button onClick={() => del(i.id)} className="p-1.5 hover:bg-red-600/20 rounded text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((i) => (
            <div key={i.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative">
              <button
                type="button"
                onClick={() => copyCode(i.item_code)}
                title="Click to copy code"
                className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded font-mono text-[10px] text-blue-300"
              >
                {i.item_code}<Copy size={10} className="opacity-60" />
              </button>
              <div className="aspect-video bg-slate-800 flex items-center justify-center">
                {i.image_url ? <img src={i.image_url} alt={i.model} className="w-full h-full object-cover" /> : <span className="text-slate-600 text-xs">No image</span>}
              </div>
              <div className="p-3 space-y-2">
                <div>
                  <div className="font-semibold text-white">{i.brand}</div>
                  <div className="text-xs text-slate-400 truncate">{i.model}</div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded border ${stockColor(i.stock_qty)}`}>Stock: {i.stock_qty}</span>
                  <span className="text-green-400">{margin(i.sale_price, i.nlc_price).toFixed(0)}%</span>
                </div>
                <div className="text-white font-bold">{formatINR(i.sale_price)}</div>
                <div className="flex gap-1 pt-1">
                  <button onClick={() => setShareItem(i)} className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded text-xs flex items-center justify-center gap-1"><Share2 size={12} /> Share</button>
                  <button onClick={() => duplicate(i)} title="Duplicate item" className="p-1.5 bg-slate-800 hover:bg-amber-600/20 rounded text-amber-400"><Copy size={12} /></button>
                  <button onClick={() => { setEditing(i); setShowForm(true); }} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"><Pencil size={12} /></button>
                  <button onClick={() => del(i.id)} className="p-1.5 bg-slate-800 hover:bg-red-600/20 rounded text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">{editing.id ? "Edit Item" : "Add Item"}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="px-4 pt-3 text-xs text-slate-400">
              Item Code: <span className="font-mono text-blue-300">{(editing as Item).item_code || "Will be auto-assigned on save"}</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Brand *"><input value={editing.brand || ""} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} className={inputCls} /></Field>
              <Field label="Model *"><input value={editing.model || ""} onChange={(e) => setEditing({ ...editing, model: e.target.value })} className={inputCls} /></Field>
              <Field label="Category">
                <select value={editing.category || "laptop"} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputCls}>
                  {dynamicCats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Stock Qty"><input type="number" value={editing.stock_qty ?? 0} onChange={(e) => setEditing({ ...editing, stock_qty: +e.target.value })} className={inputCls} /></Field>
              <Field label="MRP"><input type="number" value={editing.mrp ?? 0} onChange={(e) => setEditing({ ...editing, mrp: +e.target.value })} className={inputCls} /></Field>
              <Field label="NLC (Cost)"><input type="number" value={editing.nlc_price ?? 0} onChange={(e) => setEditing({ ...editing, nlc_price: +e.target.value })} className={inputCls} /></Field>
              <Field label="Billing Price"><input type="number" value={editing.billing_price ?? 0} onChange={(e) => setEditing({ ...editing, billing_price: +e.target.value })} className={inputCls} /></Field>
              <Field label="Sale Price"><input type="number" value={editing.sale_price ?? 0} onChange={(e) => setEditing({ ...editing, sale_price: +e.target.value })} className={inputCls} /></Field>
              <Field label="Online Price"><input type="number" value={editing.online_price ?? 0} onChange={(e) => setEditing({ ...editing, online_price: +e.target.value })} className={inputCls} /></Field>
              <Field label="Image URL"><input value={editing.image_url || ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} className={inputCls} placeholder="https://..." /></Field>
              <div className="sm:col-span-2">
                <Field label="Specifications"><textarea value={editing.specs || ""} onChange={(e) => setEditing({ ...editing, specs: e.target.value })} rows={3} className={inputCls} /></Field>
              </div>
              <div className="sm:col-span-2 flex items-center justify-between bg-slate-800/50 p-3 rounded">
                <span className="text-sm text-slate-300">Margin: <span className="text-green-400 font-bold">{margin(Number(editing.sale_price || 0), Number(editing.nlc_price || 0)).toFixed(2)}%</span></span>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm">Cancel</button>
              <button onClick={save} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {shareItem && <QuoteShareModal item={shareItem} onClose={() => { setShareItem(null); }} />}
      {historyItem && <PriceHistoryDrawer itemId={historyItem.id} itemLabel={`${historyItem.brand} ${historyItem.model}`} onClose={() => setHistoryItem(null)} />}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="text-xs text-slate-400 block mb-1">{label}</label>{children}</div>
);

function QuoteShareModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [config, setConfig] = useState(item.specs || "");
  const [price, setPrice] = useState<number>(item.sale_price);
  const [validUntil, setValidUntil] = useState(addDays(todayISO(), 7));
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [waMsg, setWaMsg] = useState<string>("");
  const [savedQuote, setSavedQuote] = useState<{ no: string; id: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Build the WhatsApp message from the editable template once we have a share link.
  useEffect(() => {
    if (!shareUrl) { setWaMsg(""); return; }
    (async () => {
      const { getTemplate, fillTemplate, buildCatalogueQuoteVars } = await import("@/crm/lib/whatsapp");
      const { getAdminSetting } = await import("@/crm/hooks/useAdminSettings");
      const [shop_name, shop_phone, shop_email, shop_address] = await Promise.all([
        getAdminSetting("shop_name"), getAdminSetting("shop_phone"),
        getAdminSetting("shop_email"), getAdminSetting("shop_address"),
      ]);
      const tpl = await getTemplate(
        "catalogue_quote_share",
        "Hi {name}, here's your quote for {item} — {price}.\nView details: {link}\nValid until {valid_until}.\n— {shop_name}"
      );
      setWaMsg(fillTemplate(tpl, buildCatalogueQuoteVars({
        name, phone, item, price,
        specs: config,
        link: shareUrl,
        validUntil: validUntil,
        shop: { shop_name, shop_phone, shop_email, shop_address },
      })));
    })();
  }, [shareUrl, name, price, validUntil, item.brand, item.model, config, phone]);

  // Try to find an open enquiry for this phone+item; otherwise create one.
  const ensureEnquiry = async (): Promise<string | null> => {
    if (!phone) return null;
    const itemName = `${item.brand} ${item.model}`;
    const { data: existing } = await supabase
      .from("crm_enquiries")
      .select("id")
      .eq("phone", phone)
      .eq("item_name", itemName)
      .eq("is_converted", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (existing && existing[0]) return existing[0].id;
    const { data: created, error } = await supabase
      .from("crm_enquiries")
      .insert({
        customer_name: name || "Walk-in",
        phone,
        whatsapp: phone,
        product_category: item.category || "laptop",
        item_name: itemName,
        budget: price || null,
        source: "catalogue",
        status: "quoted",
        notes: config || null,
      })
      .select("id")
      .single();
    if (error) { console.warn("Enquiry create failed:", error.message); return null; }
    return created?.id || null;
  };

  const nextQuoteNo = async (): Promise<string> => {
    const today = new Date();
    const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const stem = `QT-${ymd}`;
    const { data } = await supabase
      .from("crm_quotations")
      .select("quote_no")
      .like("quote_no", `${stem}-%`)
      .order("quote_no", { ascending: false })
      .limit(1);
    let n = 1;
    if (data && data[0]) {
      const last = (data[0] as any).quote_no.split("-").pop();
      n = (parseInt(last || "0", 10) || 0) + 1;
    }
    return `${stem}-${String(n).padStart(3, "0")}`;
  };

  const generate = async () => {
    if (!name || !phone) {
      toast.error("Customer name and phone are required");
      return;
    }
    setSaving(true);

    // 1) Public share record (existing flow)
    const { data: share, error: shareErr } = await supabase.from("crm_quote_shares").insert({
      catalogue_id: item.id, customer_name: name || null, customer_phone: phone || null,
      shared_config: config, shared_price: price, valid_until: validUntil, is_active: true,
    }).select("share_link").single();
    if (shareErr) { setSaving(false); return toast.error(shareErr.message); }

    // 2) Auto-link/create enquiry
    const enquiryId = await ensureEnquiry();

    // 3) Auto-save a real quotation in CRM
    try {
      const quote_no = await nextQuoteNo();
      const itemName = `${item.brand} ${item.model}`;
      const items = [{ name: itemName, qty: 1, price: Number(price || 0), discount_pct: 0 }];
      const subtotal = Number(price || 0);
      const total_amount = subtotal;
      const { data: q, error: qErr } = await supabase.from("crm_quotations").insert({
        quote_no,
        enquiry_id: enquiryId,
        customer_name: name,
        phone,
        whatsapp: phone,
        items,
        subtotal,
        discount: 0,
        gst_percent: 0,
        gst_amount: 0,
        total_amount,
        validity_date: validUntil,
        validity_days: 7,
        notes: config || null,
        status: "sent",
      }).select("id, quote_no").single();
      if (qErr) console.warn("Quotation save failed:", qErr.message);
      if (q) setSavedQuote({ no: q.quote_no, id: q.id });
    } catch (e) {
      console.warn(e);
    }

    setSaving(false);
    const url = `${window.location.origin}/q/${share.share_link}`;
    setShareUrl(url);
    toast.success(enquiryId ? "Quote saved & linked to Enquiry" : "Quote link generated");
  };

  // waMsg is built reactively in a useEffect above (uses editable template).

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Share Quote — {item.brand} {item.model}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-3">
          <Field label="Customer Name *"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
          <Field label="Customer Phone *"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></Field>
          <Field label="Custom Config / Notes"><textarea value={config} onChange={(e) => setConfig(e.target.value)} rows={3} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quoted Price"><input type="number" value={price} onChange={(e) => setPrice(+e.target.value)} className={inputCls} /></Field>
            <Field label="Valid Until"><input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} /></Field>
          </div>
          {savedQuote && (
            <div className="text-xs px-2 py-1.5 bg-green-600/20 border border-green-600/40 text-green-200 rounded">
              ✓ Saved as Quotation <strong>{savedQuote.no}</strong> in Quotations module
            </div>
          )}
          {shareUrl && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="bg-slate-800 rounded p-2 flex items-center gap-2">
                <code className="flex-1 text-xs text-blue-300 break-all">{shareUrl}</code>
                <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied"); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-300"><Copy size={14} /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(waMsg); toast.success("Message copied"); }} className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-300">Copy Message</button>
                {phone && <a href={waLink(phone, waMsg)} target="_blank" rel="noreferrer" className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 rounded text-sm text-white text-center">Send WhatsApp</a>}
              </div>
              {savedQuote && (
                <a href={`/crm/quotations`} className="block text-center text-xs text-blue-300 hover:underline pt-1">Open in Quotations →</a>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm">Close</button>
          {!shareUrl && <button onClick={generate} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm disabled:opacity-50">{saving ? "Saving..." : "Generate & Save Quote"}</button>}
        </div>
      </div>
    </div>
  );
}
