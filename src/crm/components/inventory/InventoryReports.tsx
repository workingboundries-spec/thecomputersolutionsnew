import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";
import { formatINR } from "@/crm/lib/format";

type Cat = {
  id: string; brand: string; model: string; category: string;
  opening_stock: number; current_stock: number; reorder_level: number;
  nlc_price: number; sale_price: number;
};
type Tx = {
  id: string; item_id: string; transaction_date: string;
  movement_type: string; qty: number; balance_after: number | null;
  reference_type: string | null; supplier_name: string | null;
  reason: string | null; notes: string | null;
};
type Audit = {
  id: string; audit_month: number; audit_year: number; item_id: string;
  opening_stock: number; received_qty: number; sold_qty: number; damaged_qty: number;
  closing_system_stock: number; physical_count: number; variance: number;
  action_taken: string | null; notes: string | null;
};

const REPORTS = ["Current Stock", "Monthly Audit Comparison", "Stock Movement", "Low Stock"] as const;
type Report = typeof REPORTS[number];

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = name; a.click();
}

function downloadPdf(name: string, title: string, rows: (string | number)[][]) {
  // Lightweight HTML -> print-to-PDF (no extra deps; user can "Save as PDF" from print dialog)
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:system-ui,Arial,sans-serif;padding:24px;color:#0f172a}h1{font-size:18px;margin:0 0 12px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}thead{background:#f1f5f9}tr:nth-child(even){background:#f8fafc}</style>
  </head><body><h1>${title}</h1><div style="font-size:11px;color:#64748b;margin-bottom:8px">Generated ${new Date().toLocaleString()}</div>
  <table><thead><tr>${rows[0].map((h) => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <script>window.onload=()=>setTimeout(()=>window.print(),200);</script></body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export default function InventoryReports() {
  const [tab, setTab] = useState<Report>("Current Stock");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <button key={r} onClick={() => setTab(r)} className={`px-3 py-1.5 text-xs rounded ${tab === r ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>{r}</button>
        ))}
      </div>
      {tab === "Current Stock" && <CurrentStock />}
      {tab === "Monthly Audit Comparison" && <AuditComparison />}
      {tab === "Stock Movement" && <StockMovement />}
      {tab === "Low Stock" && <LowStock />}
    </div>
  );
}

function CurrentStock() {
  const [items, setItems] = useState<Cat[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  useEffect(() => {
    (async () => {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const [c, t] = await Promise.all([
        supabase.from("crm_catalogue").select("id, brand, model, category, opening_stock, current_stock, reorder_level, nlc_price, sale_price").eq("is_active", true).order("brand"),
        supabase.from("inventory_transactions" as any).select("*").gte("transaction_date", monthStart.toISOString()),
      ]);
      setItems((c.data || []) as any); setTx((t.data || []) as any);
    })();
  }, []);
  const aug = useMemo(() => items.map((i) => {
    const list = tx.filter((t) => t.item_id === i.id);
    const received = list.filter((t) => t.movement_type === "manual_entry" || t.movement_type === "opening_stock").reduce((s, t) => s + Math.abs(t.qty), 0);
    const sold = list.filter((t) => t.movement_type === "sale").reduce((s, t) => s + Math.abs(t.qty), 0)
              - list.filter((t) => t.movement_type === "sale_reversal").reduce((s, t) => s + Math.abs(t.qty), 0);
    const damaged = list.filter((t) => t.movement_type === "damage" || t.movement_type === "write_off").reduce((s, t) => s + Math.abs(t.qty), 0);
    const status = i.current_stock === 0 ? "Out" : i.current_stock <= i.reorder_level ? "Low" : "OK";
    return { ...i, received, sold, damaged, status };
  }), [items, tx]);

  const headers = ["Item", "Category", "Opening", "Received", "Sold", "Damaged", "Current", "Reorder", "Status"];
  const rows = aug.map((r) => [`${r.brand} ${r.model}`, r.category, r.opening_stock, r.received, r.sold, r.damaged, r.current_stock, r.reorder_level, r.status]);

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2">
        <button onClick={() => downloadCsv(`current-stock-${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows])} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1.5 text-white"><Download size={12} />CSV</button>
        <button onClick={() => downloadPdf(`current-stock-${new Date().toISOString().slice(0, 10)}.pdf`, "Current Stock Report", [headers, ...rows])} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1.5 text-white"><Download size={12} />PDF</button>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
            <tr>{headers.map((h) => <th key={h} className="text-left p-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {aug.map((r) => (
              <tr key={r.id}>
                <td className="p-2 text-white">{r.brand} {r.model}</td>
                <td className="p-2 text-slate-400 capitalize">{r.category}</td>
                <td className="p-2 text-slate-300">{r.opening_stock}</td>
                <td className="p-2 text-green-300">{r.received}</td>
                <td className="p-2 text-blue-300">{r.sold}</td>
                <td className="p-2 text-orange-300">{r.damaged}</td>
                <td className="p-2 text-white font-medium">{r.current_stock}</td>
                <td className="p-2 text-slate-400">{r.reorder_level}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${r.status === "OK" ? "bg-green-500/20 text-green-300" : r.status === "Low" ? "bg-orange-500/20 text-orange-300" : "bg-red-500/20 text-red-300"}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditComparison() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [items, setItems] = useState<Record<string, Cat>>({});
  const [periodA, setPeriodA] = useState("");
  const [periodB, setPeriodB] = useState("");

  useEffect(() => {
    (async () => {
      const [a, c] = await Promise.all([
        supabase.from("inventory_audits" as any).select("*").order("audit_year", { ascending: false }).order("audit_month", { ascending: false }),
        supabase.from("crm_catalogue").select("id, brand, model, category, opening_stock, current_stock, reorder_level, nlc_price, sale_price"),
      ]);
      setAudits((a.data || []) as any);
      const map: Record<string, Cat> = {};
      (c.data || []).forEach((it: any) => { map[it.id] = it; });
      setItems(map);
    })();
  }, []);

  const periods = useMemo(() => {
    const set = new Set<string>();
    audits.forEach((a) => set.add(`${a.audit_year}-${String(a.audit_month).padStart(2, "0")}`));
    return Array.from(set).sort().reverse();
  }, [audits]);

  useEffect(() => {
    if (!periodA && periods[1]) setPeriodA(periods[1]);
    if (!periodB && periods[0]) setPeriodB(periods[0]);
  }, [periods, periodA, periodB]);

  const filtered = useMemo(() => {
    return audits.filter((a) => {
      const k = `${a.audit_year}-${String(a.audit_month).padStart(2, "0")}`;
      return k === periodA || k === periodB;
    });
  }, [audits, periodA, periodB]);

  const headers = ["Item", "Period", "Opening", "System Closing", "Physical", "Variance", "Variance %"];
  const rows = filtered.map((a) => {
    const it = items[a.item_id];
    const pct = a.closing_system_stock ? (a.variance / a.closing_system_stock) * 100 : 0;
    return [it ? `${it.brand} ${it.model}` : "(deleted)", `${a.audit_year}-${String(a.audit_month).padStart(2, "0")}`,
      a.opening_stock, a.closing_system_stock, a.physical_count, a.variance, `${pct.toFixed(1)}%`];
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-400">Compare:</label>
        <select value={periodA} onChange={(e) => setPeriodA(e.target.value)} className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white">
          <option value="">— Period A —</option>
          {periods.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-slate-500 text-xs">vs</span>
        <select value={periodB} onChange={(e) => setPeriodB(e.target.value)} className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white">
          <option value="">— Period B —</option>
          {periods.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={() => downloadCsv(`audit-comparison.csv`, [headers, ...rows])} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1.5 text-white"><Download size={12} />CSV</button>
          <button onClick={() => downloadPdf(`audit-comparison.pdf`, "Audit Comparison", [headers, ...rows])} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1.5 text-white"><Download size={12} />PDF</button>
        </div>
      </div>
      {filtered.length === 0 ? <div className="text-center py-6 bg-slate-900 border border-slate-800 rounded text-slate-500 text-sm">No audit data for selected periods</div> :
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400"><tr>{headers.map((h) => <th key={h} className="text-left p-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} className={`p-2 ${j === 5 ? (Number(c) < 0 ? "text-red-300" : Number(c) > 0 ? "text-green-300" : "text-slate-400") : "text-slate-300"} ${j === 0 ? "text-white" : ""}`}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}

function StockMovement() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
  const [from, setFrom] = useState(monthAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(today);
  const [tx, setTx] = useState<Tx[]>([]);
  const [items, setItems] = useState<Record<string, Cat>>({});

  useEffect(() => {
    (async () => {
      const c = await supabase.from("crm_catalogue").select("id, brand, model, category, opening_stock, current_stock, reorder_level, nlc_price, sale_price");
      const map: Record<string, Cat> = {};
      (c.data || []).forEach((it: any) => { map[it.id] = it; });
      setItems(map);
    })();
  }, []);
  useEffect(() => {
    (async () => {
      const t = await supabase.from("inventory_transactions" as any).select("*")
        .gte("transaction_date", from + "T00:00:00")
        .lte("transaction_date", to + "T23:59:59")
        .order("transaction_date", { ascending: false });
      setTx((t.data || []) as any);
    })();
  }, [from, to]);

  const headers = ["Date", "Item", "Movement", "Qty", "Balance", "Reference", "Notes"];
  const rows = tx.map((t) => {
    const it = items[t.item_id];
    return [
      new Date(t.transaction_date).toLocaleString(),
      it ? `${it.brand} ${it.model}` : "(deleted)",
      t.movement_type,
      t.qty,
      t.balance_after ?? "",
      t.reference_type || "—",
      t.notes || t.reason || "",
    ];
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-400">From</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white" />
        <label className="text-xs text-slate-400">To</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white" />
        <div className="ml-auto flex gap-2">
          <button onClick={() => downloadCsv(`movements-${from}-to-${to}.csv`, [headers, ...rows])} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1.5 text-white"><Download size={12} />CSV</button>
          <button onClick={() => downloadPdf(`movements-${from}-to-${to}.pdf`, `Stock Movement ${from} to ${to}`, [headers, ...rows])} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1.5 text-white"><Download size={12} />PDF</button>
        </div>
      </div>
      {rows.length === 0 ? <div className="text-center py-6 bg-slate-900 border border-slate-800 rounded text-slate-500 text-sm">No movements in this date range</div> :
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400"><tr>{headers.map((h) => <th key={h} className="text-left p-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="p-2 text-slate-400 text-xs">{r[0]}</td>
                  <td className="p-2 text-white">{r[1]}</td>
                  <td className="p-2 text-slate-300 text-xs">{r[2]}</td>
                  <td className={`p-2 font-medium ${Number(r[3]) < 0 ? "text-red-300" : "text-green-300"}`}>{Number(r[3]) > 0 ? "+" : ""}{r[3]}</td>
                  <td className="p-2 text-slate-300">{r[4]}</td>
                  <td className="p-2 text-slate-400 text-xs">{r[5]}</td>
                  <td className="p-2 text-slate-400 text-xs">{r[6]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}

function LowStock() {
  const [items, setItems] = useState<Cat[]>([]);
  useEffect(() => {
    (async () => {
      const c = await supabase.from("crm_catalogue").select("id, brand, model, category, opening_stock, current_stock, reorder_level, nlc_price, sale_price").eq("is_active", true);
      const list = (c.data || []) as any[];
      setItems(list.filter((i) => Number(i.current_stock || 0) <= Number(i.reorder_level || 0) && Number(i.reorder_level || 0) > 0));
    })();
  }, []);
  const headers = ["Item", "Current Stock", "Reorder Level", "Suggested Reorder Qty"];
  const rows = items.map((i) => [`${i.brand} ${i.model}`, i.current_stock, i.reorder_level, Math.max(0, (i.reorder_level * 2) - i.current_stock)]);
  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2">
        <button onClick={() => downloadCsv(`low-stock-${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows])} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1.5 text-white"><Download size={12} />CSV</button>
        <button onClick={() => downloadPdf(`low-stock-${new Date().toISOString().slice(0, 10)}.pdf`, "Low Stock / Reorder Alert", [headers, ...rows])} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1.5 text-white"><Download size={12} />PDF</button>
      </div>
      {items.length === 0 ? <div className="text-center py-6 bg-slate-900 border border-slate-800 rounded text-slate-500 text-sm">No items below reorder level</div> :
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400"><tr>{headers.map((h) => <th key={h} className="text-left p-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((r, i) => (
                <tr key={i}><td className="p-2 text-white">{r[0]}</td><td className="p-2 text-orange-300 font-medium">{r[1]}</td><td className="p-2 text-slate-300">{r[2]}</td><td className="p-2 text-blue-300">{r[3]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
