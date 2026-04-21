import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useCrmAuth } from "@/crm/hooks/useCrmAuth";
import { setStockExact } from "@/crm/lib/inventory";

type Item = {
  id: string; brand: string; model: string;
  opening_stock: number; current_stock: number;
};

type AggRow = {
  item: Item;
  received: number;
  sold: number;
  damaged: number;
  systemClosing: number;
  physical: number;
  variance: number;
  notes: string;
};

const inputCls = "w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-white";

/**
 * 3-step physical-count audit wizard.
 * Step 1: enter physical count for every active item
 * Step 2: review summary
 * Step 3: choose action (Reset to Physical Count | Carry Forward) and save
 */
export default function MonthEndAuditWizard({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useCrmAuth();
  const now = new Date();
  const [auditMonth] = useState(now.getMonth() + 1);
  const [auditYear] = useState(now.getFullYear());
  const monthLabel = `${now.toLocaleString("default", { month: "long" })} ${auditYear}`;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AggRow[]>([]);
  const [action, setAction] = useState<"reset" | "carry_forward">("reset");
  const [saving, setSaving] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  useEffect(() => {
    (async () => {
      // Pull all active items + sum movements for this month + check existing audit
      const monthStart = new Date(auditYear, auditMonth - 1, 1).toISOString();
      const monthEnd = new Date(auditYear, auditMonth, 1).toISOString();
      const existingRes = await supabase
        .from("inventory_audits" as any)
        .select("id", { count: "exact", head: true })
        .eq("audit_year", auditYear)
        .eq("audit_month", auditMonth);
      setExistingCount(existingRes.count || 0);
      const [catRes, txRes] = await Promise.all([
        supabase.from("crm_catalogue")
          .select("id, brand, model, opening_stock, current_stock, stock_qty")
          .eq("is_active", true).order("brand"),
        supabase.from("inventory_transactions" as any)
          .select("item_id, movement_type, qty")
          .gte("transaction_date", monthStart)
          .lt("transaction_date", monthEnd),
      ]);
      const items = (catRes.data || []) as any[];
      const tx = (txRes.data || []) as any[];

      const sumByItem: Record<string, { received: number; sold: number; damaged: number }> = {};
      tx.forEach((t) => {
        const k = t.item_id;
        if (!sumByItem[k]) sumByItem[k] = { received: 0, sold: 0, damaged: 0 };
        if (t.movement_type === "manual_entry" || t.movement_type === "opening_stock") sumByItem[k].received += Math.abs(t.qty);
        else if (t.movement_type === "sale") sumByItem[k].sold += Math.abs(t.qty);
        else if (t.movement_type === "sale_reversal") sumByItem[k].sold -= Math.abs(t.qty);
        else if (t.movement_type === "damage" || t.movement_type === "write_off") sumByItem[k].damaged += Math.abs(t.qty);
      });

      setRows(items.map((it) => {
        const cs = Number(it.current_stock ?? it.stock_qty ?? 0);
        const agg = sumByItem[it.id] || { received: 0, sold: 0, damaged: 0 };
        return {
          item: {
            id: it.id, brand: it.brand, model: it.model,
            opening_stock: Number(it.opening_stock || 0),
            current_stock: cs,
          },
          received: agg.received,
          sold: agg.sold,
          damaged: agg.damaged,
          systemClosing: cs,
          physical: cs,
          variance: 0,
          notes: "",
        };
      }));
      setLoading(false);
    })();
  }, [auditMonth, auditYear]);

  const setPhysical = (idx: number, val: number) => {
    setRows((rs) => rs.map((r, i) => i === idx ? { ...r, physical: val, variance: val - r.systemClosing } : r));
  };
  const setNotes = (idx: number, val: string) => {
    setRows((rs) => rs.map((r, i) => i === idx ? { ...r, notes: val } : r));
  };

  const summary = useMemo(() => {
    const matched = rows.filter((r) => r.variance === 0).length;
    const withVariance = rows.length - matched;
    const totalNeg = rows.filter((r) => r.variance < 0).reduce((s, r) => s + r.variance, 0);
    const totalPos = rows.filter((r) => r.variance > 0).reduce((s, r) => s + r.variance, 0);
    return { matched, withVariance, totalNeg, totalPos };
  }, [rows]);

  const finish = async () => {
    if (existingCount > 0 && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    setSaving(true);

    // 1. Upsert one inventory_audits row per item (one per year/month/item)
    const auditRows = rows.map((r) => ({
      audit_month: auditMonth,
      audit_year: auditYear,
      item_id: r.item.id,
      opening_stock: r.item.opening_stock,
      received_qty: r.received,
      sold_qty: r.sold,
      damaged_qty: r.damaged,
      closing_system_stock: r.systemClosing,
      physical_count: r.physical,
      variance: r.variance,
      action_taken: action,
      notes: r.notes || null,
      audited_by: user?.id ?? null,
      audit_date: new Date().toISOString(),
    }));
    const { error: auditErr } = await supabase
      .from("inventory_audits" as any)
      .upsert(auditRows, { onConflict: "audit_year,audit_month,item_id" });
    if (auditErr) {
      setSaving(false);
      setConfirmOverwrite(false);
      return toast.error(auditErr.message);
    }

    // 2. Per row, apply chosen action
    if (action === "reset") {
      // Set current_stock to physical count + set new opening_stock = physical
      for (const r of rows) {
        if (r.variance !== 0) {
          await setStockExact(r.item.id, r.physical, {
            reason: `Month-end reset (${monthLabel})`,
            notes: r.notes || null,
            createdBy: user?.id ?? null,
          });
        }
        await supabase.from("crm_catalogue").update({ opening_stock: r.physical }).eq("id", r.item.id);
      }
    } else {
      // Carry forward: opening_stock for new month = system closing
      for (const r of rows) {
        await supabase.from("crm_catalogue").update({ opening_stock: r.systemClosing }).eq("id", r.item.id);
      }
    }

    setSaving(false);
    toast.success(`Audit for ${monthLabel} saved (${rows.length} items, ${action === "reset" ? "reset" : "carried forward"})`);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-5xl my-6">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Month-end Audit — {monthLabel}</h2>
            <div className="text-xs text-slate-400 mt-0.5">Step {step} of 3 · {step === 1 ? "Physical Count" : step === 2 ? "Review" : "Choose Action"}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pt-3">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1.5 rounded ${s <= step ? "bg-blue-500" : "bg-slate-800"}`} />
            ))}
          </div>
        </div>

        <div className="p-4 max-h-[65vh] overflow-y-auto">
          {loading ? <div className="text-center py-8 text-slate-400">Loading items…</div> :

            step === 1 ? (
              rows.length === 0 ? <div className="text-center py-8 text-slate-500">No active items in catalogue</div> :
              <div className="border border-slate-800 rounded overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="text-left p-2">Item</th>
                      <th className="text-right p-2">System Stock</th>
                      <th className="text-right p-2 w-32">Physical Count</th>
                      <th className="text-right p-2">Variance</th>
                      <th className="text-left p-2 w-40">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rows.map((r, idx) => (
                      <tr key={r.item.id}>
                        <td className="p-2 text-white">{r.item.brand} {r.item.model}</td>
                        <td className="p-2 text-right text-slate-300">{r.systemClosing}</td>
                        <td className="p-2 text-right">
                          <input type="number" value={r.physical} onChange={(e) => setPhysical(idx, +e.target.value)} className={inputCls + " text-right"} />
                        </td>
                        <td className={`p-2 text-right font-medium ${r.variance < 0 ? "text-red-400" : r.variance > 0 ? "text-green-400" : "text-slate-400"}`}>
                          {r.variance > 0 ? "+" : ""}{r.variance}
                        </td>
                        <td className="p-2">
                          <input value={r.notes} onChange={(e) => setNotes(idx, e.target.value)} placeholder="—" className={inputCls + " text-xs"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) :

            step === 2 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Total items" value={rows.length} />
                  <Stat label="Matched (variance 0)" value={summary.matched} tone="green" />
                  <Stat label="With variance" value={summary.withVariance} tone={summary.withVariance > 0 ? "amber" : undefined} />
                  <Stat label="Net variance" value={`${summary.totalPos + summary.totalNeg > 0 ? "+" : ""}${summary.totalPos + summary.totalNeg}`} tone={(summary.totalPos + summary.totalNeg) < 0 ? "red" : undefined} />
                </div>
                {summary.withVariance > 0 && (
                  <div className="border border-slate-800 rounded overflow-x-auto">
                    <div className="px-3 py-2 text-xs text-slate-400 bg-slate-800/30">Items with variance</div>
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase text-slate-400">
                        <tr><th className="text-left p-2">Item</th><th className="text-right p-2">System</th><th className="text-right p-2">Physical</th><th className="text-right p-2">Variance</th><th className="text-left p-2">Notes</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {rows.filter((r) => r.variance !== 0).map((r) => (
                          <tr key={r.item.id}>
                            <td className="p-2 text-white">{r.item.brand} {r.item.model}</td>
                            <td className="p-2 text-right text-slate-300">{r.systemClosing}</td>
                            <td className="p-2 text-right text-slate-300">{r.physical}</td>
                            <td className={`p-2 text-right font-medium ${r.variance < 0 ? "text-red-400" : "text-green-400"}`}>{r.variance > 0 ? "+" : ""}{r.variance}</td>
                            <td className="p-2 text-slate-400 text-xs">{r.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) :

            // step 3
            (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">Choose how to close out {monthLabel}:</p>
                <button onClick={() => setAction("reset")} className={`w-full text-left p-4 rounded border ${action === "reset" ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-800/30 hover:border-slate-700"}`}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 ${action === "reset" ? "border-blue-400 bg-blue-500" : "border-slate-600"}`} />
                    <div>
                      <div className="font-semibold text-white">Reset to Physical Count</div>
                      <div className="text-xs text-slate-400 mt-1">Current stock will be overwritten with physical count for items with variance. Next month opens with the physical count as opening stock.</div>
                    </div>
                  </div>
                </button>
                <button onClick={() => setAction("carry_forward")} className={`w-full text-left p-4 rounded border ${action === "carry_forward" ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-800/30 hover:border-slate-700"}`}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 ${action === "carry_forward" ? "border-blue-400 bg-blue-500" : "border-slate-600"}`} />
                    <div>
                      <div className="font-semibold text-white">Carry Forward (no reset)</div>
                      <div className="text-xs text-slate-400 mt-1">Current stock stays unchanged. Next month opens with system closing as opening stock. Variance is recorded in the audit log only.</div>
                    </div>
                  </div>
                </button>
              </div>
            )
          }
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-800">
          <button onClick={onClose} disabled={saving} className="text-sm text-slate-400 hover:text-white">Cancel</button>
          <div className="flex gap-2">
            {step > 1 && (
              <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} disabled={saving} className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1"><ChevronLeft size={14} />Back</button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)} disabled={loading || rows.length === 0} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded flex items-center gap-1">Next<ChevronRight size={14} /></button>
            ) : (
              <button onClick={finish} disabled={saving} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded font-medium flex items-center gap-1.5"><CheckCircle2 size={14} />{saving ? "Saving…" : "Save Audit"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: any; tone?: "green" | "red" | "amber" }) {
  const colors = tone === "green" ? "text-green-300" : tone === "red" ? "text-red-300" : tone === "amber" ? "text-orange-300" : "text-white";
  return (
    <div className="bg-slate-800/40 border border-slate-800 rounded p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-2xl font-bold ${colors}`}>{value}</div>
    </div>
  );
}
