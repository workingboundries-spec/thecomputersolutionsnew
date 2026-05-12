import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, AlertTriangle, XCircle, IndianRupee, Plus, Minus, ClipboardCheck, FileText, History } from "lucide-react";
import { formatINR } from "@/crm/lib/format";
import AddStockModal from "@/crm/components/inventory/AddStockModal";
import DamageModal from "@/crm/components/inventory/DamageModal";
import MonthEndAuditWizard from "@/crm/components/inventory/MonthEndAuditWizard";
import InventoryReports from "@/crm/components/inventory/InventoryReports";
import PriceHistoryDrawer from "@/crm/components/inventory/PriceHistoryDrawer";

type Item = {
  id: string;
  brand: string;
  model: string;
  category: string;
  opening_stock: number;
  current_stock: number;
  stock_qty: number;
  reorder_level: number;
  nlc_price: number;
  sale_price: number;
};

const TABS = ["Live Stock", "Reports", "Audit History"] as const;
type Tab = typeof TABS[number];

export default function CrmStock() {
  const [tab, setTab] = useState<Tab>("Live Stock");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock</h1>
          <p className="text-sm text-slate-400">Perpetual inventory with movements, audits, and reports</p>
        </div>
      </div>
      <div className="flex border-b border-slate-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-white"}`}>{t}</button>
        ))}
      </div>
      {tab === "Live Stock" && <LiveStock />}
      {tab === "Reports" && <InventoryReports />}
      {tab === "Audit History" && <AuditHistory />}
    </div>
  );
}

function LiveStock() {
  const [items, setItems] = useState<Item[]>([]);
  const [movementsByItem, setMovementsByItem] = useState<Record<string, { received: number; sold: number; damaged: number }>>({});
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [search, setSearch] = useState("");
  const [addItem, setAddItem] = useState<Item | null>(null);
  const [damageItem, setDamageItem] = useState<Item | null>(null);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  const load = async () => {
    setLoading(true);
    // Load ALL transactions so the math reconciles with opening_stock,
    // which is an all-time reset baseline (not a monthly value).
    const [c, t] = await Promise.all([
      supabase.from("crm_catalogue").select("id,brand,model,category,opening_stock,current_stock,stock_qty,reorder_level,nlc_price,sale_price").order("brand"),
      supabase.from("inventory_transactions" as any).select("item_id, movement_type, qty"),
    ]);
    if (c.error) toast.error(c.error.message);
    setItems((c.data || []) as Item[]);
    const map: Record<string, { received: number; sold: number; damaged: number }> = {};
    ((t.data || []) as any[]).forEach((tx) => {
      const k = tx.item_id;
      if (!map[k]) map[k] = { received: 0, sold: 0, damaged: 0 };
      // Received = Add Stock entries only. Exclude `opening_stock` movements
      // because the opening baseline is already counted via i.opening_stock.
      if (tx.movement_type === "manual_entry") map[k].received += Math.abs(tx.qty);
      else if (tx.movement_type === "sale") map[k].sold += Math.abs(tx.qty);
      else if (tx.movement_type === "sale_reversal") map[k].sold -= Math.abs(tx.qty);
      else if (tx.movement_type === "damage" || tx.movement_type === "write_off") map[k].damaged += Math.abs(tx.qty);
    });
    setMovementsByItem(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const brands = useMemo(() => Array.from(new Set(items.map((i) => i.brand))).sort(), [items]);
  const cats = useMemo(() => Array.from(new Set(items.map((i) => i.category))).sort(), [items]);
  const filtered = items.filter((i) =>
    (!filterCat || i.category === filterCat) &&
    (!filterBrand || i.brand === filterBrand) &&
    (!search || `${i.brand} ${i.model}`.toLowerCase().includes(search.toLowerCase()))
  );
  const computedById = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => {
      const m = movementsByItem[i.id] || { received: 0, sold: 0, damaged: 0 };
      map[i.id] = Number(i.opening_stock || 0) + m.received - m.sold - m.damaged;
    });
    return map;
  }, [items, movementsByItem]);
  const totals = useMemo(() => {
    return {
      totalSkus: filtered.length,
      totalValueNlc: filtered.reduce((s, i) => s + ((computedById[i.id] ?? i.current_stock) * i.nlc_price), 0),
      lowStock: filtered.filter((i) => { const cur = computedById[i.id] ?? i.current_stock; return cur > 0 && i.reorder_level > 0 && cur <= i.reorder_level; }).length,
      outOfStock: filtered.filter((i) => (computedById[i.id] ?? i.current_stock) <= 0).length,
      totalUnits: filtered.reduce((s, i) => s + (computedById[i.id] ?? i.current_stock ?? 0), 0),
    };
  }, [filtered, computedById]);

  const itemForModal = (i: Item) => ({ id: i.id, brand: i.brand, model: i.model, current_stock: i.current_stock });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Package />} label="Total SKUs" value={totals.totalSkus} color="blue" />
        <Stat icon={<IndianRupee />} label="Stock Value (NLC)" value={formatINR(totals.totalValueNlc)} color="green" />
        <Stat icon={<AlertTriangle />} label="Low Stock" value={totals.lowStock} color="orange" />
        <Stat icon={<XCircle />} label="Out of Stock" value={totals.outOfStock} color="red" />
      </div>

     <div className="flex flex-wrap gap-2 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white">
          <option value="">All categories</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white">
          <option value="">All brands</option>{brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <span className="text-xs text-slate-400">Total Units</span>
          <span className="text-sm font-bold text-purple-400">{totals.totalUnits}</span>
          {filterCat && <span className="text-xs text-slate-500">in {filterCat}</span>}
          {filterBrand && <span className="text-xs text-slate-500">{filterCat ? "·" : "in"} {filterBrand}</span>}
        </div>
        <button onClick={() => setShowAudit(true)} className="ml-auto flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white text-sm">
          <ClipboardCheck size={14} />Run Month-end Audit
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-slate-400">Loading...</div> :
        filtered.length === 0 ? <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded text-slate-400">No items in catalogue</div> :
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
              <tr>
                <th className="text-left p-3">Item</th>
                <th className="text-left p-3">SKU</th>
                <th className="text-left p-3">Category</th>
                <th className="text-right p-3">Opening</th>
                <th className="text-right p-3">Received</th>
                <th className="text-right p-3">Sold</th>
                <th className="text-right p-3">Damaged</th>
                <th className="text-right p-3">Current</th>
                <th className="text-right p-3">Reorder</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((i) => {
                const m = movementsByItem[i.id] || { received: 0, sold: 0, damaged: 0 };
                const computed = computedById[i.id] ?? i.current_stock;
                const drift = computed !== Number(i.current_stock || 0);
                const out = computed <= 0;
                const low = computed > 0 && i.reorder_level > 0 && computed <= i.reorder_level;
                return (
                  <tr key={i.id} className={`${out ? "bg-red-900/20" : low ? "bg-yellow-900/15" : ""} hover:bg-slate-800/30`}>
                    <td className="p-3 text-white font-medium">{i.brand} {i.model}</td>
                    <td className="p-3 text-slate-400 font-mono text-xs">{i.id.slice(0, 8)}</td>
                    <td className="p-3 text-slate-400 capitalize">{i.category}</td>
                    <td className="p-3 text-right text-slate-300">{i.opening_stock}</td>
                    <td className="p-3 text-right text-green-300">{m.received}</td>
                    <td className="p-3 text-right text-blue-300">{m.sold}</td>
                    <td className="p-3 text-right text-orange-300">{m.damaged}</td>
                    <td className="p-3 text-right">
                      <span className={out ? "text-red-300 font-bold" : low ? "text-orange-300 font-bold" : "text-white font-medium"}>{computed}</span>
                      {drift && <span className="ml-1.5 text-[10px] text-amber-300" title={`Stored DB value: ${i.current_stock}. Ledger says ${computed}.`}>⚠ DB:{i.current_stock}</span>}
                    </td>
                    <td className="p-3 text-right text-slate-400">{i.reorder_level}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setAddItem(i)} title="Add Stock" className="p-1.5 text-green-400 hover:bg-green-600/20 rounded"><Plus size={14} /></button>
                        <button onClick={() => setDamageItem(i)} title="Damage / Write-off" className="p-1.5 text-red-400 hover:bg-red-600/20 rounded"><Minus size={14} /></button>
                        <button onClick={() => setHistoryItem(i)} title="Price History" className="p-1.5 text-purple-400 hover:bg-purple-600/20 rounded"><History size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }

      {addItem && <AddStockModal item={itemForModal(addItem)} onClose={() => setAddItem(null)} onSaved={load} />}
      {damageItem && <DamageModal item={itemForModal(damageItem)} onClose={() => setDamageItem(null)} onSaved={load} />}
      {historyItem && <PriceHistoryDrawer itemId={historyItem.id} itemLabel={`${historyItem.brand} ${historyItem.model}`} onClose={() => setHistoryItem(null)} />}
      {showAudit && <MonthEndAuditWizard onClose={() => setShowAudit(false)} onSaved={load} />}
    </div>
  );
}

function AuditHistory() {
  const [audits, setAudits] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, { brand: string; model: string }>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const [a, c] = await Promise.all([
        supabase.from("inventory_audits" as any).select("*").order("audit_year", { ascending: false }).order("audit_month", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("crm_catalogue").select("id, brand, model"),
      ]);
      setAudits((a.data || []) as any);
      const map: Record<string, { brand: string; model: string }> = {};
      ((c.data || []) as any[]).forEach((it) => { map[it.id] = { brand: it.brand, model: it.model }; });
      setItems(map);
      setLoading(false);
    })();
  }, []);

  const grouped = useMemo(() => {
    const m: Record<string, any[]> = {};
    audits.forEach((r: any) => {
      const k = `${r.audit_year}-${String(r.audit_month).padStart(2, "0")}`;
      (m[k] = m[k] || []).push(r);
    });
    return m;
  }, [audits]);

  if (loading) return <div className="text-center py-8 text-slate-400">Loading…</div>;
  const months = Object.keys(grouped).sort().reverse();
  if (months.length === 0) return <div className="text-slate-500 text-center py-8 bg-slate-900 border border-slate-800 rounded"><FileText size={28} className="mx-auto mb-2 opacity-40" />No audits saved yet</div>;

  return (
    <div className="space-y-3">
      {months.map((mo) => {
        const rows = grouped[mo];
        const totalVar = rows.reduce((s: number, r: any) => s + (r.variance || 0), 0);
        const action = rows[0]?.action_taken || "—";
        return (
          <div key={mo} className="bg-slate-900 border border-slate-800 rounded">
            <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center gap-3">
              <div className="text-white font-semibold">{mo}</div>
              <span className="text-xs text-slate-400">{rows.length} items</span>
              <span className={`text-xs px-2 py-0.5 rounded ${totalVar < 0 ? "bg-red-500/20 text-red-300" : totalVar > 0 ? "bg-green-500/20 text-green-300" : "bg-slate-800 text-slate-300"}`}>Net var: {totalVar > 0 ? "+" : ""}{totalVar}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">{action === "reset" ? "Reset to Physical" : action === "carry_forward" ? "Carried Forward" : action}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/30 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="text-left p-2">Item</th>
                    <th className="text-right p-2">Opening</th>
                    <th className="text-right p-2">Received</th>
                    <th className="text-right p-2">Sold</th>
                    <th className="text-right p-2">Damaged</th>
                    <th className="text-right p-2">System</th>
                    <th className="text-right p-2">Physical</th>
                    <th className="text-right p-2">Variance</th>
                    <th className="text-left p-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rows.map((r: any) => {
                    const it = items[r.item_id];
                    return (
                      <tr key={r.id} className={r.variance < 0 ? "bg-red-900/15" : r.variance > 0 ? "bg-green-900/10" : ""}>
                        <td className="p-2 text-white">{it ? `${it.brand} ${it.model}` : "(deleted)"}</td>
                        <td className="p-2 text-right text-slate-300">{r.opening_stock}</td>
                        <td className="p-2 text-right text-green-300">{r.received_qty}</td>
                        <td className="p-2 text-right text-blue-300">{r.sold_qty}</td>
                        <td className="p-2 text-right text-orange-300">{r.damaged_qty}</td>
                        <td className="p-2 text-right text-slate-300">{r.closing_system_stock}</td>
                        <td className="p-2 text-right text-slate-300">{r.physical_count}</td>
                        <td className={`p-2 text-right font-medium ${r.variance < 0 ? "text-red-400" : r.variance > 0 ? "text-green-400" : "text-slate-400"}`}>{r.variance > 0 ? "+" : ""}{r.variance}</td>
                        <td className="p-2 text-slate-400 text-xs">{r.notes || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10", green: "text-green-400 bg-green-500/10",
    purple: "text-purple-400 bg-purple-500/10", orange: "text-orange-400 bg-orange-500/10", red: "text-red-400 bg-red-500/10",
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
      <div className={`inline-flex p-2 rounded ${colors[color]}`}>{icon}</div>
      <div className="text-xs text-slate-400 mt-2">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
