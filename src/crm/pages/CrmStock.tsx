import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, AlertTriangle, XCircle, IndianRupee, Download } from "lucide-react";
import { formatINR } from "@/crm/lib/format";

type Item = {
  id: string; brand: string; model: string; category: string;
  stock_qty: number; nlc_price: number; sale_price: number;
};

const LOW_STOCK = 3;

export default function CrmStock() {
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

  const totals = useMemo(() => {
    const totalSkus = filtered.length;
    const totalValueNlc = filtered.reduce((s, i) => s + (i.stock_qty * i.nlc_price), 0);
    const totalValueSale = filtered.reduce((s, i) => s + (i.stock_qty * i.sale_price), 0);
    const lowStock = filtered.filter((i) => i.stock_qty > 0 && i.stock_qty < LOW_STOCK).length;
    const outOfStock = filtered.filter((i) => i.stock_qty === 0).length;
    return { totalSkus, totalValueNlc, totalValueSale, lowStock, outOfStock };
  }, [filtered]);

  const exportCsv = () => {
    const rows = [
      ["Brand", "Model", "Category", "Stock", "NLC", "Sale", "Stock Value (NLC)", "Margin %"],
      ...filtered.map((i) => [
        i.brand, i.model, i.category, i.stock_qty, i.nlc_price, i.sale_price,
        i.stock_qty * i.nlc_price,
        i.sale_price ? (((i.sale_price - i.nlc_price) / i.sale_price) * 100).toFixed(1) : "0",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `stock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Stock Report</h1>
        <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat icon={<Package />} label="Total SKUs" value={totals.totalSkus} color="blue" />
        <Stat icon={<IndianRupee />} label="Stock Value (NLC)" value={formatINR(totals.totalValueNlc)} color="green" />
        <Stat icon={<IndianRupee />} label="Stock Value (Sale)" value={formatINR(totals.totalValueSale)} color="purple" />
        <Stat icon={<AlertTriangle />} label="Low Stock" value={totals.lowStock} color="orange" />
        <Stat icon={<XCircle />} label="Out of Stock" value={totals.outOfStock} color="red" />
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white">
          <option value="">All categories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-white">
          <option value="">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded text-slate-400">No items in catalogue</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
              <tr>
                <th className="text-left p-3">Brand</th>
                <th className="text-left p-3">Model</th>
                <th className="text-left p-3">Category</th>
                <th className="text-right p-3">Stock</th>
                <th className="text-right p-3">NLC</th>
                <th className="text-right p-3">Sale</th>
                <th className="text-right p-3">Stock Value</th>
                <th className="text-right p-3">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((i) => {
                const out = i.stock_qty === 0;
                const low = i.stock_qty > 0 && i.stock_qty < LOW_STOCK;
                const m = i.sale_price ? ((i.sale_price - i.nlc_price) / i.sale_price) * 100 : 0;
                return (
                  <tr key={i.id} className={`${out ? "bg-red-900/20" : low ? "bg-yellow-900/15" : ""} hover:bg-slate-800/30`}>
                    <td className="p-3 text-white font-medium">{i.brand}</td>
                    <td className="p-3 text-slate-300">{i.model}</td>
                    <td className="p-3 text-slate-400 capitalize">{i.category}</td>
                    <td className="p-3 text-right">
                      <span className={out ? "text-red-300" : low ? "text-orange-300" : "text-green-300"}>{i.stock_qty}</span>
                      {low && <span className="ml-2 text-xs text-orange-400">⚠ Reorder</span>}
                    </td>
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
      )}
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-green-400 bg-green-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    red: "text-red-400 bg-red-500/10",
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
      <div className={`inline-flex p-2 rounded ${colors[color]}`}>{icon}</div>
      <div className="text-xs text-slate-400 mt-2">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
