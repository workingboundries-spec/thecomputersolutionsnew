import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate } from "@/crm/lib/format";
import { Printer } from "lucide-react";

export default function PublicQuoteView() {
  const { id } = useParams();
  const [q, setQ] = useState<any>(null);
  const [shop, setShop] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [qRes, sRes] = await Promise.all([
        supabase.from("crm_quotations").select("*").eq("id", id).maybeSingle(),
        supabase.from("crm_admin_settings").select("setting_key, setting_value").in("setting_key", ["shop_name", "shop_address", "shop_phone", "shop_email", "shop_gst"]),
      ]);
      setQ(qRes.data);
      const m: Record<string, string> = {};
      (sRes.data || []).forEach((r: any) => { m[r.setting_key] = r.setting_value; });
      setShop(m);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  if (!q) return <div className="min-h-screen flex items-center justify-center text-slate-500">Quote not found</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:py-0 print:bg-white">
      <div className="max-w-3xl mx-auto bg-white rounded shadow print:shadow-none p-8">
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">{shop.shop_name || "The Computer Solutions"}</h1>
            <div className="text-sm text-slate-600 mt-1">{shop.shop_address}</div>
            <div className="text-sm text-slate-600">📞 {shop.shop_phone} · ✉ {shop.shop_email}</div>
            {shop.shop_gst && <div className="text-xs text-slate-500">GST: {shop.shop_gst}</div>}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-blue-700">QUOTATION</div>
            <div className="font-mono text-sm mt-1">{q.quote_no}</div>
            <div className="text-xs text-slate-500 mt-1">Date: {formatDate(q.created_at)}</div>
            <div className="text-xs text-slate-500">Valid till: {formatDate(q.validity_date)}</div>
          </div>
        </div>

        <div className="mt-4 bg-slate-50 p-3 rounded">
          <div className="text-xs uppercase text-slate-500">Bill To</div>
          <div className="font-semibold">{q.customer_name}</div>
          <div className="text-sm text-slate-600">{q.phone}{q.email ? ` · ${q.email}` : ""}</div>
          {q.address && <div className="text-sm text-slate-600">{q.address}</div>}
        </div>

        <table className="w-full mt-4 text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Item</th>
              <th className="text-right p-2">Qty</th>
              <th className="text-right p-2">Price</th>
              <th className="text-right p-2">Disc%</th>
              <th className="text-right p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {(q.items || []).map((it: any, idx: number) => (
              <tr key={idx} className="border-b">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">{it.name}</td>
                <td className="p-2 text-right">{it.qty}</td>
                <td className="p-2 text-right">{formatINR(it.price)}</td>
                <td className="p-2 text-right">{it.discount_pct || 0}%</td>
                <td className="p-2 text-right font-medium">{formatINR(Number(it.qty) * Number(it.price) * (1 - Number(it.discount_pct || 0) / 100))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <div className="w-64 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal:</span><span>{formatINR(q.subtotal)}</span></div>
            <div className="flex justify-between"><span>Discount:</span><span>- {formatINR(q.discount)}</span></div>
            <div className="flex justify-between"><span>GST {q.gst_percent}%:</span><span>{formatINR(q.gst_amount)}</span></div>
            <div className="flex justify-between border-t pt-1 font-bold text-base"><span>Grand Total:</span><span>{formatINR(q.total_amount)}</span></div>
          </div>
        </div>

        {q.terms && <div className="mt-6 text-xs text-slate-600"><div className="font-semibold mb-1">Terms & Conditions:</div>{q.terms}</div>}
        {q.notes && <div className="mt-3 text-xs text-slate-600"><div className="font-semibold mb-1">Notes:</div>{q.notes}</div>}
        <div className="text-center text-sm text-slate-500 mt-6 pt-4 border-t">Thank you for your business!</div>

        <div className="mt-6 flex justify-center print:hidden">
          <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-2"><Printer size={14} />Print / Save as PDF</button>
        </div>
      </div>
    </div>
  );
}
