import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { applyMovement } from "@/crm/lib/inventory";
import { useCrmAuth } from "@/crm/hooks/useCrmAuth";

type Item = { id: string; brand: string; model: string; current_stock: number };

const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white";

const REASONS = ["Damaged", "Expired", "Lost", "Other"];

export default function DamageModal({ item, onClose, onSaved }: { item: Item; onClose: () => void; onSaved: () => void }) {
  const { user } = useCrmAuth();
  const [qty, setQty] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!qty || qty <= 0) return toast.error("Quantity must be greater than 0");
    if (qty > item.current_stock) return toast.error(`Cannot write off more than current stock (${item.current_stock})`);
    setSaving(true);
    const res = await applyMovement({
      itemId: item.id,
      movementType: reason === "Damaged" ? "damage" : "write_off",
      qty: -qty, // negative
      reason: `${reason} on ${date}`,
      notes: notes || null,
      createdBy: user?.id ?? null,
    });
    setSaving(false);
    if (!res.ok) return toast.error(res.error || "Failed");
    toast.success(`Wrote off ${qty} units. New balance: ${res.balanceAfter}`);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Damage / Write-off</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-sm text-slate-300">Item: <span className="text-white font-medium">{item.brand} {item.model}</span></div>
          <div className="text-xs text-slate-500">Current stock: {item.current_stock}</div>
          <Field label="Quantity *"><input type="number" min={1} value={qty || ""} onChange={(e) => setQty(+e.target.value)} className={inputCls} /></Field>
          <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
          <Field label="Reason *">
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} /></Field>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : "Write Off"}
          </button>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="text-xs text-slate-400 block mb-1">{label}</label>{children}</div>
);
