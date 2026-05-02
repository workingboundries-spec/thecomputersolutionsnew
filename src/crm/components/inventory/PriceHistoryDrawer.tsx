import { useEffect, useState } from "react";
import { X, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/crm/lib/format";

type Row = {
  id: string;
  item_id: string;
  field_name: string;
  old_value: number | null;
  new_value: number;
  source: string;
  supplier_name: string | null;
  notes: string | null;
  changed_at: string;
};

const FIELD_LABELS: Record<string, string> = {
  billing_price: "Billing Price",
  nlc_price: "NLC Price",
  sale_price: "Sale Price",
  online_price: "Online Price",
  mrp: "MRP",
};

const SOURCE_LABELS: Record<string, { label: string; cls: string }> = {
  add_stock: { label: "Add Stock", cls: "bg-green-500/20 text-green-300" },
  manual_edit: { label: "Manual Edit", cls: "bg-blue-500/20 text-blue-300" },
};

export default function PriceHistoryDrawer({
  itemId, itemLabel, onClose,
}: { itemId: string; itemLabel: string; onClose: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("crm_price_history" as any)
        .select("*")
        .eq("item_id", itemId)
        .order("changed_at", { ascending: false });
      setRows((data || []) as any);
      setLoading(false);
    })();
  }, [itemId]);

  return (
    <div className="fixed inset-0 z-[75] bg-black/70 flex justify-end" onClick={onClose}>
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <History size={18} className="text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Price History</h2>
              <p className="text-xs text-slate-400">{itemLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No price changes recorded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="text-left p-2">When</th>
                  <th className="text-left p-2">Field</th>
                  <th className="text-right p-2">Old</th>
                  <th className="text-right p-2">New</th>
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((r) => {
                  const src = SOURCE_LABELS[r.source] || { label: r.source, cls: "bg-slate-800 text-slate-300" };
                  const diff = (Number(r.new_value) || 0) - (Number(r.old_value) || 0);
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="p-2 text-slate-400 text-xs whitespace-nowrap">{new Date(r.changed_at).toLocaleString()}</td>
                      <td className="p-2 text-slate-200">{FIELD_LABELS[r.field_name] || r.field_name}</td>
                      <td className="p-2 text-right text-slate-400">{r.old_value != null ? formatINR(r.old_value) : "—"}</td>
                      <td className="p-2 text-right text-white font-medium">
                        {formatINR(r.new_value)}
                        {r.old_value != null && diff !== 0 && (
                          <div className={`text-[10px] ${diff > 0 ? "text-green-400" : "text-red-400"}`}>
                            {diff > 0 ? "+" : ""}{formatINR(diff)}
                          </div>
                        )}
                      </td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded text-[10px] ${src.cls}`}>{src.label}</span>
                        {r.supplier_name && <div className="text-[10px] text-slate-500 mt-1">via {r.supplier_name}</div>}
                      </td>
                      <td className="p-2 text-slate-400 text-xs">{r.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
