import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Copy, X, FileStack } from "lucide-react";
import { useAdminSettings } from "@/crm/hooks/useAdminSettings";

type TItem = { name: string; qty: number; price: number; discount_pct: number };
type Template = {
  id: string;
  template_name: string;
  description: string | null;
  items: TItem[];
  notes: string | null;
  terms: string | null;
  gst_percent: number;
  is_active: boolean;
  used_count: number;
};

const empty = (): Omit<Template, "id" | "used_count"> => ({
  template_name: "",
  description: "",
  items: [],
  notes: "",
  terms: "",
  gst_percent: 18,
  is_active: true,
});

export default function QuotationTemplatesTab({ onUseTemplate }: { onUseTemplate: (t: Template) => void }) {
  const settings = useAdminSettings(["default_gst_percent", "quotation_terms"]);
  const [list, setList] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);
  const [form, setForm] = useState(empty());

  const load = async () => {
    setLoading(true);
    const [tRes, cRes] = await Promise.all([
      supabase.from("quotation_templates" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("crm_catalogue").select("id, brand, model, sale_price").eq("is_active", true),
    ]);
    if ((tRes as any).error) toast.error((tRes as any).error.message);
    setList(((tRes as any).data || []).map((r: any) => ({ ...r, items: Array.isArray(r.items) ? r.items : [] })));
    setCatalogue(cRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    const f = empty();
    f.gst_percent = Number(settings.default_gst_percent || 18);
    f.terms = settings.quotation_terms || "";
    setForm(f);
    setShowForm(true);
  };
  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({
      template_name: t.template_name, description: t.description || "", items: t.items || [],
      notes: t.notes || "", terms: t.terms || "", gst_percent: Number(t.gst_percent || 18), is_active: t.is_active,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.template_name.trim()) return toast.error("Template name required");
    if (form.items.length === 0) return toast.error("Add at least one item");
    const payload = { ...form, gst_percent: Number(form.gst_percent || 0) };
    const res = editing
      ? await supabase.from("quotation_templates" as any).update(payload).eq("id", editing.id)
      : await supabase.from("quotation_templates" as any).insert(payload);
    if ((res as any).error) return toast.error((res as any).error.message);
    toast.success("Template saved");
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const { error } = await supabase.from("quotation_templates" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const updateItem = (i: number, patch: Partial<TItem>) => {
    setForm({ ...form, items: form.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
  };
  const addRow = () => setForm({ ...form, items: [...form.items, { name: "", qty: 1, price: 0, discount_pct: 0 }] });
  const removeRow = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const filtered = list.filter((t) => !activeOnly || t.is_active);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
          Show active only
        </label>
        <button onClick={openNew} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Plus size={14} />Create New Template</button>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm py-8 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded">
          <FileStack size={32} className="mx-auto mb-2 opacity-40" />
          No templates yet. <button onClick={openNew} className="text-blue-400 hover:underline">Create one</button>.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((t) => (
            <div key={t.id} className="border border-slate-800 bg-slate-900 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-white">{t.template_name}</div>
                  <div className="text-xs text-slate-500">{t.items.length} items · used {t.used_count}× {!t.is_active && <span className="text-red-400 ml-1">(inactive)</span>}</div>
                </div>
              </div>
              {t.description && <div className="text-xs text-slate-400">{t.description}</div>}
              <div className="flex flex-wrap gap-1">
                {t.items.slice(0, 3).map((it, i) => (
                  <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">{it.name || "—"}</span>
                ))}
                {t.items.length > 3 && <span className="text-xs text-slate-500">+{t.items.length - 3} more</span>}
              </div>
              {t.notes && <div className="text-xs text-slate-500 line-clamp-2">{t.notes.slice(0, 60)}{t.notes.length > 60 ? "…" : ""}</div>}
              <div className="flex gap-1.5 pt-2 mt-auto border-t border-slate-800">
                <button onClick={() => openEdit(t)} className="flex-1 px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center gap-1"><Edit2 size={12} />Edit</button>
                <button onClick={() => onUseTemplate(t)} className="flex-1 px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center justify-center gap-1"><Copy size={12} />Use Template</button>
                <button onClick={() => remove(t.id)} className="px-2 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-3xl my-8 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold text-white">{editing ? "Edit" : "New"} Template</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Template Name *"><input value={form.template_name} onChange={(e) => setForm({ ...form, template_name: e.target.value })} className={inp} placeholder="e.g. Basic Laptop Setup" /></Field>
              <Field label="Description"><input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp} /></Field>
              <Field label="Default GST %"><input type="number" value={form.gst_percent} onChange={(e) => setForm({ ...form, gst_percent: Number(e.target.value) })} className={inp} /></Field>
              <Field label="Active">
                <select value={form.is_active ? "1" : "0"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "1" })} className={inp}>
                  <option value="1">Active</option><option value="0">Inactive</option>
                </select>
              </Field>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">Items</h4>
                <button onClick={addRow} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded">+ Add Row</button>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                  <tr><th className="text-left px-2 py-1.5">Item</th><th className="px-2 py-1.5 w-16">Qty</th><th className="px-2 py-1.5 w-24">Price</th><th className="px-2 py-1.5 w-20">Disc%</th><th className="px-2 py-1.5 w-8"></th><th className="w-8"></th></tr>
                </thead>
                <tbody>
                  {form.items.length === 0 ? <tr><td colSpan={6} className="text-center py-3 text-xs text-slate-500">No items yet</td></tr> :
                    form.items.map((it, i) => (
                      <tr key={i} className="border-t border-slate-800">
                        <td className="px-2 py-1"><input value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} className={inp} /></td>
                        <td className="px-2 py-1"><input type="number" value={it.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) })} className={inp + " text-right"} /></td>
                        <td className="px-2 py-1"><input type="number" value={it.price} onChange={(e) => updateItem(i, { price: Number(e.target.value) })} className={inp + " text-right"} /></td>
                        <td className="px-2 py-1"><input type="number" value={it.discount_pct} onChange={(e) => updateItem(i, { discount_pct: Number(e.target.value) })} className={inp + " text-right"} /></td>
                        <td className="px-1"><button onClick={() => setPickerIdx(i)} title="From catalogue" className="text-xs text-blue-400 hover:underline">Cat</button></td>
                        <td className="px-1"><button onClick={() => removeRow(i)} className="text-red-400 p-1"><X size={14} /></button></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            <Field label="Default Notes"><textarea rows={2} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp} /></Field>
            <Field label="Default Terms"><textarea rows={2} value={form.terms || ""} onChange={(e) => setForm({ ...form, terms: e.target.value })} className={inp} /></Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Cancel</button>
              <button onClick={save} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium">Save Template</button>
            </div>

            {pickerIdx !== null && (
              <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={() => setPickerIdx(null)}>
                <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="px-4 py-3 border-b border-slate-800 flex justify-between"><span className="font-semibold text-white text-sm">Pick from Catalogue</span><button onClick={() => setPickerIdx(null)}><X size={16} className="text-slate-400" /></button></div>
                  <div className="divide-y divide-slate-800">
                    {catalogue.map((it) => (
                      <button key={it.id} onClick={() => { updateItem(pickerIdx, { name: `${it.brand} ${it.model}`, price: Number(it.sale_price || 0) }); setPickerIdx(null); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-800 flex justify-between">
                        <span className="text-sm text-white">{it.brand} {it.model}</span>
                        <span className="text-sm text-green-400">₹{it.sale_price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500";
const Field = ({ label, children }: any) => <label className="block"><span className="text-xs text-slate-400 mb-1 block">{label}</span>{children}</label>;
