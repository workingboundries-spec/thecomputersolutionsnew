import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, AlertTriangle, XCircle, IndianRupee, Download, Save, ChevronDown, ChevronRight } from "lucide-react";
import { formatINR } from "@/crm/lib/format";
import { useAdminSetting } from "@/crm/hooks/useAdminSettings";

type Item = {
  id: string; brand: string; model: string; category: string;
  stock_qty: number; nlc_price: number; sale_price: number;
};

const TABS = ["Live Stock", "Monthly Audit", "Audit History"] as const;
type Tab = typeof TABS[number];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function CrmStock() {
  const [tab, setTab] = useState<Tab>("Live Stock");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Stock</h1>
        <p className="text-sm text-slate-400">Live stock, monthly physical audits, and audit history</p>
      </div>
      <div className="flex border-b border-slate-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-white"}`}>{t}</button>
        ))}
      </div>
      {tab === "Live Stock" && <LiveStock />}
      {tab === "Monthly Audit" && <MonthlyAudit />}
      {tab === "Audit History" && <AuditHistory />}
    </div>
  );
}

function LiveStock() {
  const lowThreshold = useAdminSetting<number>("low_stock_threshold", 3);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");
  const [filterBrand, setFilterBrand] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("crm_catalogue").select("id,brand,model,category,stock_qty,nlc_price,sale_price").order("brand");
      if (error) toast.error(error.message); else setItems((data || []) as Item[]);
      setLoading(false);
    })();
  }, []);

  const brands = useMemo(() => Array.from(new Set(items.map((i) => i.brand))).sort(), [items]);
  const cats = useMemo(() => Array.from(new Set(items.map((i) => i.category))).sort(), [items]);
  const filtered = items.filter((i) => (!filterCat || i.category === filterCat) && (!filterBrand || i.brand === filterBrand));
  const totals = useMemo(() => ({
    totalSkus: filtered.length,
    totalValueNlc: filtered.reduce((s, i) => s + (i.stock_qty * i.nlc_price), 0),
    totalValueSale: filtered.reduce((s, i) => s + (i.stock_qty * i.sale_price), 0),
    lowStock: filtered.filter((i) => i.stock_qty > 0 && i.stock_qty < lowThreshold).length,
    outOfStock: filtered.filter((i) => i.stock_qty === 0).length,
  }), [filtered, lowThreshold]);

  const exportCsv = () => {
    const rows = [
      ["Brand", "Model", "Category", "Stock", "NLC", "Sale", "Stock Value (NLC)", "Margin %"],
      ...filtered.map((i) => [i.brand, i.model, i.category, i.stock_qty, i.nlc_price, i.sale_price, i.stock_qty * i.nlc_price, i.sale_price ? (((i.sale_price - i.nlc_price) / i.sale_price) * 100).toFixed(1) : "0"]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `stock-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat icon={<Package />} label="Total SKUs" value={totals.totalSkus} color="blue" />
        <Stat icon={<IndianRupee />} label="Stock Value (NLC)" value={formatINR(totals.totalValueNlc)} color="green" />
        <Stat icon={<IndianRupee />} label="Stock Value (Sale)" value={formatINR(totals.totalValueSale)} color="purple" />
        <Stat icon={<AlertTriangle />} label="Low Stock" value={totals.lowStock} color="orange" />
        <Stat icon={<XCircle />} label="Out of Stock" value={totals.outOfStock} color="red" />
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white">
          <option value="">All categories</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white">
          <option value="">All brands</option>{brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <button onClick={exportCsv} className="ml-auto flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm"><Download size={14} />Export CSV</button>
      </div>
      {loading ? <div className="text-center py-12 text-slate-400">Loading...</div> :
        filtered.length === 0 ? <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded text-slate-400">No items in catalogue</div> :
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
              <tr><th className="text-left p-3">Brand</th><th className="text-left p-3">Model</th><th className="text-left p-3">Category</th><th className="text-right p-3">Stock</th><th className="text-right p-3">NLC</th><th className="text-right p-3">Sale</th><th className="text-right p-3">Stock Value</th><th className="text-right p-3">Margin %</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((i) => {
                const out = i.stock_qty === 0; const low = i.stock_qty > 0 && i.stock_qty < lowThreshold;
                const m = i.sale_price ? ((i.sale_price - i.nlc_price) / i.sale_price) * 100 : 0;
                return (
                  <tr key={i.id} className={`${out ? "bg-red-900/20" : low ? "bg-yellow-900/15" : ""} hover:bg-slate-800/30`}>
                    <td className="p-3 text-white font-medium">{i.brand}</td>
                    <td className="p-3 text-slate-300">{i.model}</td>
                    <td className="p-3 text-slate-400 capitalize">{i.category}</td>
                    <td className="p-3 text-right"><span className={out ? "text-red-300" : low ? "text-orange-300" : "text-green-300"}>{i.stock_qty}</span></td>
                    <td className="p-3 text-right text-slate-300">{formatINR(i.nlc_price)}</td>
                    <td className="p-3 text-right text-white">{formatINR(i.sale_price)}</td>
                    <td className="p-3 text-right text-slate-300">{formatINR(i.stock_qty * i.nlc_price)}</td>
                    <td className="p-3 text-right text-green-400">{m.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}

function MonthlyAudit() {
  const [items, setItems] = useState<any[]>([]);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savedThisMonth, setSavedThisMonth] = useState(false);
  const [viewMonth, setViewMonth] = useState(currentMonth());
  const [pastAudit, setPastAudit] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const month = currentMonth();

  const load = async () => {
    setLoading(true);
    const [catRes, auditRes] = await Promise.all([
      supabase.from("crm_catalogue").select("id, brand, model, category, stock_qty, nlc_price").eq("is_active", true).order("brand"),
      supabase.from("crm_stock_audit_log").select("id").eq("audit_month", month).limit(1),
    ]);
    setItems(catRes.data || []);
    setSavedThisMonth(((auditRes.data || []).length > 0));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (viewMonth === month) { setPastAudit(null); return; }
    supabase.from("crm_stock_audit_log").select("*").eq("audit_month", viewMonth).order("brand").then(({ data }) => setPastAudit(data || []));
  }, [viewMonth, month]);

  const save = async () => {
    if (savedThisMonth) return toast.error("Audit for this month already saved");
    const rows = items.map((i) => {
      const physical = Number(physicalCounts[i.id] ?? i.stock_qty);
      return {
        audit_month: month, audit_date: new Date().toISOString().slice(0, 10),
        catalogue_id: i.id, item_name: `${i.brand} ${i.model}`, brand: i.brand, model: i.model,
        opening_stock: i.stock_qty, sold_qty: 0, physical_count: physical,
        variance: physical - i.stock_qty, notes: notes[i.id] || null,
      };
    });
    const { error } = await supabase.from("crm_stock_audit_log").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Audit for ${month} saved (${rows.length} items)`);
    setSavedThisMonth(true);
  };

  const exportCurrent = () => {
    const rows = [["Item", "Brand", "Model", "System Stock", "Physical Count", "Variance", "Notes"]];
    items.forEach((i) => {
      const physical = Number(physicalCounts[i.id] ?? i.stock_qty);
      rows.push([`${i.brand} ${i.model}`, i.brand, i.model, String(i.stock_qty), String(physical), String(physical - i.stock_qty), notes[i.id] || ""]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `audit-${month}.csv`; a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-white font-semibold">Physical Stock Audit</h3>
        <select value={viewMonth} onChange={(e) => setViewMonth(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white">
          <option value={month}>{month} (current)</option>
          {Array.from({ length: 11 }).map((_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - (i + 1));
            const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            return <option key={v} value={v}>{v}</option>;
          })}
        </select>
        {viewMonth === month && (
          <>
            <button onClick={exportCurrent} className="ml-auto px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm flex items-center gap-1.5"><Download size={14} />Export CSV</button>
            <button onClick={save} disabled={savedThisMonth} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm flex items-center gap-1.5"><Save size={14} />{savedThisMonth ? "Already Saved" : `Save Audit for ${month}`}</button>
          </>
        )}
      </div>

      {loading ? <div className="text-slate-400">Loading…</div> :
        viewMonth !== month ? (
          pastAudit === null ? <div className="text-slate-400">Loading…</div> :
          pastAudit.length === 0 ? <div className="text-slate-500 text-center py-8 bg-slate-900 border border-slate-800 rounded">No audit recorded for {viewMonth}</div> :
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400"><tr><th className="text-left p-3">Item</th><th className="text-right p-3">System</th><th className="text-right p-3">Physical</th><th className="text-right p-3">Variance</th><th className="text-left p-3">Notes</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {pastAudit.map((r: any) => (
                  <tr key={r.id}><td className="p-3 text-white">{r.item_name}</td><td className="p-3 text-right text-slate-300">{r.opening_stock}</td><td className="p-3 text-right text-slate-300">{r.physical_count}</td><td className={`p-3 text-right font-medium ${r.variance < 0 ? "text-red-400" : r.variance > 0 ? "text-green-400" : "text-slate-400"}`}>{r.variance > 0 ? "+" : ""}{r.variance}</td><td className="p-3 text-slate-400 text-xs">{r.notes || "—"}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 text-xs text-slate-500 bg-slate-800/30">Read-only snapshot — past audits cannot be edited.</div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
            {savedThisMonth && <div className="px-3 py-2 text-xs bg-yellow-500/10 text-yellow-300 border-b border-yellow-500/20">⚠ Audit for {month} already saved. Form is read-only.</div>}
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400"><tr><th className="text-left p-3">Item</th><th className="text-right p-3">System Stock</th><th className="text-right p-3 w-32">Physical Count</th><th className="text-right p-3">Variance</th><th className="text-left p-3 w-40">Notes</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((i) => {
                  const physical = physicalCounts[i.id] ?? i.stock_qty;
                  const v = Number(physical) - i.stock_qty;
                  return (
                    <tr key={i.id}>
                      <td className="p-3 text-white">{i.brand} {i.model}</td>
                      <td className="p-3 text-right text-slate-300">{i.stock_qty}</td>
                      <td className="p-3 text-right"><input disabled={savedThisMonth} type="number" value={physical} onChange={(e) => setPhysicalCounts({ ...physicalCounts, [i.id]: Number(e.target.value) })} className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right text-white text-sm" /></td>
                      <td className={`p-3 text-right font-medium ${v < 0 ? "text-red-400" : v > 0 ? "text-green-400" : "text-slate-400"}`}>{v > 0 ? "+" : ""}{v}</td>
                      <td className="p-3"><input disabled={savedThisMonth} value={notes[i.id] || ""} onChange={(e) => setNotes({ ...notes, [i.id]: e.target.value })} placeholder="—" className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

function AuditHistory() {
  const [byMonth, setByMonth] = useState<Record<string, any[]>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    supabase.from("crm_stock_audit_log").select("*").order("audit_month", { ascending: false }).then(({ data }) => {
      const m: Record<string, any[]> = {};
      (data || []).forEach((r: any) => { (m[r.audit_month] = m[r.audit_month] || []).push(r); });
      setByMonth(m);
    });
  }, []);
  const exportMonth = (mo: string, rows: any[]) => {
    const lines = [["Item", "System", "Physical", "Variance", "Notes"], ...rows.map((r) => [r.item_name, r.opening_stock, r.physical_count, r.variance, r.notes || ""])];
    const csv = lines.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `audit-${mo}.csv`; a.click();
  };
  const months = Object.keys(byMonth);
  if (months.length === 0) return <div className="text-slate-500 text-center py-8 bg-slate-900 border border-slate-800 rounded">No audits saved yet</div>;
  return (
    <div className="space-y-2">
      {months.map((mo) => {
        const rows = byMonth[mo];
        const isOpen = !!open[mo];
        const negCount = rows.filter((r: any) => r.variance < 0).length;
        const totalVar = rows.reduce((s: number, r: any) => s + r.variance, 0);
        return (
          <div key={mo} className="bg-slate-900 border border-slate-800 rounded">
            <button onClick={() => setOpen({ ...open, [mo]: !isOpen })} className="w-full flex items-center justify-between px-4 py-3 text-left">
              <div className="flex items-center gap-2 text-white font-semibold">{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />} {mo}</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">{rows.length} items</span>
                <span className={`px-2 py-0.5 rounded ${totalVar < 0 ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-slate-300"}`}>Var: {totalVar > 0 ? "+" : ""}{totalVar}</span>
                {negCount > 0 && <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300">{negCount} negative</span>}
                <button onClick={(e) => { e.stopPropagation(); exportMonth(mo, rows); }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded flex items-center gap-1"><Download size={12} />CSV</button>
              </div>
            </button>
            {isOpen && (
              <div className="overflow-x-auto border-t border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/40 text-xs uppercase text-slate-400"><tr><th className="text-left p-2">Item</th><th className="text-right p-2">System</th><th className="text-right p-2">Physical</th><th className="text-right p-2">Variance</th><th className="text-left p-2">Notes</th></tr></thead>
                  <tbody className="divide-y divide-slate-800">
                    {rows.map((r: any) => (
                      <tr key={r.id} className={r.variance < 0 ? "bg-red-900/20" : ""}>
                        <td className="p-2 text-white">{r.item_name}</td><td className="p-2 text-right text-slate-300">{r.opening_stock}</td><td className="p-2 text-right text-slate-300">{r.physical_count}</td>
                        <td className={`p-2 text-right font-medium ${r.variance < 0 ? "text-red-400" : r.variance > 0 ? "text-green-400" : "text-slate-400"}`}>{r.variance > 0 ? "+" : ""}{r.variance}</td>
                        <td className="p-2 text-slate-400 text-xs">{r.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
