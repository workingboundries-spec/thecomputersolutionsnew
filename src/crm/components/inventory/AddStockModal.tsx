import { useEffect, useState } from "react";
import { X, History } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { applyMovement } from "@/crm/lib/inventory";
import { useCrmAuth } from "@/crm/hooks/useCrmAuth";
import PriceUpdateConfirmDialog, { type PriceUpdateChoice } from "./PriceUpdateConfirmDialog";
import PriceHistoryDrawer from "./PriceHistoryDrawer";
import { logPriceChanges } from "@/crm/lib/priceHistory";

type Item = { id: string; brand: string; model: string; current_stock: number };

const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white";

export default function AddStockModal({ item, onClose, onSaved }: { item: Item; onClose: () => void; onSaved: () => void }) {
  const { user } = useCrmAuth();
  const [qty, setQty] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplier, setSupplier] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Catalogue prices needed for prefill + comparison
  const [prices, setPrices] = useState<{ billing_price: number; nlc_price: number; sale_price: number } | null>(null);
  const [pendingChoice, setPendingChoice] = useState<null | { resolve: (c: PriceUpdateChoice | null) => void }>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("crm_catalogue")
        .select("billing_price, nlc_price, sale_price")
        .eq("id", item.id)
        .maybeSingle();
      if (data) {
        const p = data as any;
        setPrices({
          billing_price: Number(p.billing_price || 0),
          nlc_price: Number(p.nlc_price || 0),
          sale_price: Number(p.sale_price || 0),
        });
        // Prefill purchase price with current billing price (fallback to NLC)
        const prefill = Number(p.billing_price || 0) || Number(p.nlc_price || 0) || 0;
        setPurchasePrice(prefill);
      }
    })();
  }, [item.id]);

  const askPriceChoice = () =>
    new Promise<PriceUpdateChoice | null>((resolve) => setPendingChoice({ resolve }));

  const save = async () => {
    if (!qty || qty <= 0) return toast.error("Quantity must be greater than 0");
    if (!prices) return toast.error("Loading prices…");

    // Step 1: if price differs from current billing, ask user what to update
    let choice: PriceUpdateChoice | null = null;
    const differs = Number(purchasePrice || 0) > 0 && Number(purchasePrice) !== Number(prices.billing_price);
    if (differs) {
      choice = await askPriceChoice();
      // null = user cancelled the dialog → abort save
      if (choice === null) return;
    }

    setSaving(true);

    // Step 2: write the stock movement
    const res = await applyMovement({
      itemId: item.id,
      movementType: "manual_entry",
      qty: qty,
      supplierName: supplier || null,
      purchasePrice: purchasePrice || null,
      notes: notes ? `${notes} (received ${date})` : `Received ${date}`,
      createdBy: user?.id ?? null,
    });

    if (!res.ok) {
      setSaving(false);
      return toast.error(res.error || "Failed");
    }

    // Step 3: apply selected price updates + log history
    if (choice && (choice.updateBilling || choice.updateNlc || choice.updateSale)) {
      const updates: Record<string, number> = {};
      const changes: { field: "billing_price" | "nlc_price" | "sale_price"; oldValue: number; newValue: number }[] = [];
      if (choice.updateBilling) {
        updates.billing_price = purchasePrice;
        changes.push({ field: "billing_price", oldValue: prices.billing_price, newValue: purchasePrice });
      }
      if (choice.updateNlc) {
        updates.nlc_price = purchasePrice;
        changes.push({ field: "nlc_price", oldValue: prices.nlc_price, newValue: purchasePrice });
      }
      if (choice.updateSale) {
        updates.sale_price = purchasePrice;
        changes.push({ field: "sale_price", oldValue: prices.sale_price, newValue: purchasePrice });
      }
      if (Object.keys(updates).length) {
        const { error: upErr } = await supabase.from("crm_catalogue").update(updates).eq("id", item.id);
        if (upErr) toast.error(`Price update failed: ${upErr.message}`);
        else {
          await logPriceChanges({
            itemId: item.id,
            changes,
            source: "add_stock",
            supplierName: supplier || null,
            notes: notes || `Stock received on ${date}`,
            changedBy: user?.id ?? null,
          });
        }
      }
    }

    setSaving(false);
    toast.success(`Added ${qty} units. New balance: ${res.balanceAfter}`);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Add Stock</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory(true)} title="Price History" className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded"><History size={16} /></button>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-sm text-slate-300">Item: <span className="text-white font-medium">{item.brand} {item.model}</span></div>
          <div className="text-xs text-slate-500">Current stock: {item.current_stock}</div>
          <Field label="Quantity *"><input type="number" min={1} value={qty || ""} onChange={(e) => setQty(+e.target.value)} className={inputCls} /></Field>
          <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
          <Field label="Supplier"><input value={supplier} onChange={(e) => setSupplier(e.target.value)} className={inputCls} /></Field>
          <Field label="Purchase Price (per unit)">
            <input type="number" value={purchasePrice || ""} onChange={(e) => setPurchasePrice(+e.target.value)} className={inputCls} />
            {prices && (
              <div className="text-[10px] text-slate-500 mt-1">
                Prefilled from current Billing Price. If you change it, you'll be asked which catalogue prices to update.
              </div>
            )}
          </Field>
          <Field label="Notes"><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} /></Field>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : "Add Stock"}
          </button>
        </div>
      </div>

      {pendingChoice && prices && (
        <PriceUpdateConfirmDialog
          itemLabel={`${item.brand} ${item.model}`}
          newPurchasePrice={purchasePrice}
          currentBilling={prices.billing_price}
          currentNlc={prices.nlc_price}
          currentSale={prices.sale_price}
          onCancel={() => { pendingChoice.resolve(null); setPendingChoice(null); }}
          onConfirm={(c) => { pendingChoice.resolve(c); setPendingChoice(null); }}
        />
      )}

      {showHistory && (
        <PriceHistoryDrawer
          itemId={item.id}
          itemLabel={`${item.brand} ${item.model}`}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="text-xs text-slate-400 block mb-1">{label}</label>{children}</div>
);
