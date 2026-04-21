import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useAdminSetting } from "@/crm/hooks/useAdminSettings";

/**
 * Slide-over drawer for adding a new catalogue item.
 *
 * IMPORTANT: This MUST mirror the existing Catalogue Add/Edit form
 * (src/crm/pages/CrmCatalogue.tsx, lines 197–237) field-for-field.
 * Do not introduce new inputs that don't exist there.
 */

const CATEGORIES = ["laptop", "cctv", "accessory", "networking", "printer", "other"];

type Editing = {
  brand: string; model: string; category: string; specs: string;
  stock_qty: number; mrp: number; nlc_price: number; billing_price: number;
  sale_price: number; online_price: number; image_url: string; is_active: boolean;
};

const empty = (prefillBrand: string): Editing => ({
  brand: prefillBrand, model: "", category: "laptop", specs: "",
  stock_qty: 0, mrp: 0, nlc_price: 0, billing_price: 0,
  sale_price: 0, online_price: 0, image_url: "", is_active: true,
});

function margin(sale: number, nlc: number) {
  if (!sale) return 0;
  return ((sale - nlc) / sale) * 100;
}

const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="text-xs text-slate-400 block mb-1">{label}</label>{children}</div>
);

type Props = {
  open: boolean;
  prefillName: string;
  onClose: () => void;
  /** Called once the new item is saved, with the created row. */
  onCreated?: (item: { id: string; brand: string; model: string; sale_price: number }) => void;
};

/**
 * Heuristic: split "Lenovo ThinkPad E14" -> brand "Lenovo", model "ThinkPad E14".
 * If only one word, treat it as the model and leave brand blank.
 */
function splitName(name: string): { brand: string; model: string } {
  const trimmed = name.trim();
  if (!trimmed) return { brand: "", model: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { brand: "", model: parts[0] };
  return { brand: parts[0], model: parts.slice(1).join(" ") };
}

export default function CatalogueDrawer({ open, prefillName, onClose, onCreated }: Props) {
  const adminCategories = useAdminSetting<string[]>("enquiry_categories", []);
  const dynamicCats = (adminCategories && adminCategories.length
    ? adminCategories.map((c) => c.toLowerCase())
    : CATEGORIES);

  const initial = (() => {
    const { brand, model } = splitName(prefillName);
    const e = empty(brand);
    e.model = model;
    return e;
  })();
  const [editing, setEditing] = useState<Editing>(initial);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const save = async () => {
    if (!editing.brand || !editing.model) {
      return toast.error("Brand and model required");
    }
    setSaving(true);
    const payload = {
      brand: editing.brand,
      model: editing.model,
      category: editing.category || "laptop",
      specs: editing.specs || null,
      stock_qty: Number(editing.stock_qty || 0),
      nlc_price: Number(editing.nlc_price || 0),
      billing_price: Number(editing.billing_price || 0),
      sale_price: Number(editing.sale_price || 0),
      online_price: Number(editing.online_price || 0),
      mrp: Number(editing.mrp || 0),
      is_active: editing.is_active,
      image_url: editing.image_url || null,
    };
    const { data, error } = await supabase
      .from("crm_catalogue")
      .insert(payload)
      .select("id, brand, model, sale_price")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Added ${data.brand} ${data.model} to catalogue`);
    onCreated?.(data as any);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60"
      onClick={() => { if (!saving) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      {/* Slide-over from right */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-lg font-bold text-white">Add New Catalogue Item</h2>
          <button onClick={onClose} disabled={saving} className="text-slate-400 hover:text-white disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Brand *">
            <input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Model *">
            <input value={editing.model} onChange={(e) => setEditing({ ...editing, model: e.target.value })} className={inputCls} autoFocus />
          </Field>
          <Field label="Category">
            <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputCls}>
              {dynamicCats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Stock Qty">
            <input type="number" value={editing.stock_qty} onChange={(e) => setEditing({ ...editing, stock_qty: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="MRP">
            <input type="number" value={editing.mrp} onChange={(e) => setEditing({ ...editing, mrp: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="NLC (Cost)">
            <input type="number" value={editing.nlc_price} onChange={(e) => setEditing({ ...editing, nlc_price: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Billing Price">
            <input type="number" value={editing.billing_price} onChange={(e) => setEditing({ ...editing, billing_price: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Sale Price">
            <input type="number" value={editing.sale_price} onChange={(e) => setEditing({ ...editing, sale_price: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Online Price">
            <input type="number" value={editing.online_price} onChange={(e) => setEditing({ ...editing, online_price: +e.target.value })} className={inputCls} />
          </Field>
          <Field label="Image URL">
            <input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} className={inputCls} placeholder="https://..." />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Specifications">
              <textarea value={editing.specs} onChange={(e) => setEditing({ ...editing, specs: e.target.value })} rows={3} className={inputCls} />
            </Field>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between bg-slate-800/50 p-3 rounded">
            <span className="text-sm text-slate-300">
              Margin: <span className="text-green-400 font-bold">{margin(Number(editing.sale_price || 0), Number(editing.nlc_price || 0)).toFixed(2)}%</span>
            </span>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              Active
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm disabled:opacity-50">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
