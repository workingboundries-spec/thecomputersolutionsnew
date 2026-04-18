import { formatINR, formatDate } from "@/crm/lib/format";
import type { QuotationBranding } from "@/crm/lib/quotationBranding";

export type QuotePreviewData = {
  quote_no: string;
  customer_name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  items: Array<{ name: string; qty: number; price: number; discount_pct?: number }>;
  subtotal: number;
  discount: number;
  gst_percent: number;
  gst_amount: number;
  total_amount: number;
  validity_date?: string | null;
  created_at?: string | null;
  notes?: string | null;
  terms?: string | null;
};

/**
 * Pure render-from-props quotation. NO data fetching, NO server calls.
 * Container is fixed 794px wide (A4) with id="quotation-preview" for html2canvas.
 */
export function QuotationPreview({ q, b }: { q: QuotePreviewData; b: QuotationBranding }) {
  const onDarkText = "#ffffff";
  const altRowBg = "#f8f9fa";

  return (
    <div
      id="quotation-preview"
      style={{
        width: 794,
        background: b.bg,
        color: b.font,
        fontFamily: "'Inter', system-ui, sans-serif",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        overflow: "hidden",
      }}
    >
      {/* Header bar */}
      <div style={{ background: b.primary, color: onDarkText, padding: "20px 28px", display: "flex", alignItems: "center", gap: 16 }}>
        {b.logo_url ? (
          <img src={b.logo_url} alt="logo" crossOrigin="anonymous" style={{ height: 50, objectFit: "contain", background: "white", padding: 4, borderRadius: 4 }} />
        ) : (
          <div style={{ width: 50, height: 50, background: b.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, borderRadius: 6 }}>
            {(b.shop_name || "CS").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.3 }}>{b.shop_name}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
            {[b.shop_address, b.shop_phone, b.shop_email, b.shop_gst && `GST: ${b.shop_gst}`].filter(Boolean).join("  •  ")}
          </div>
        </div>
      </div>

      {/* Quote meta */}
      <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: b.accent, letterSpacing: 1 }}>{b.watermark}</div>
        <div style={{ textAlign: "right", fontSize: 12, color: b.font, lineHeight: 1.6 }}>
          <div><span style={{ opacity: 0.6 }}>Quote No: </span><strong>{q.quote_no}</strong></div>
          <div><span style={{ opacity: 0.6 }}>Date: </span>{formatDate(q.created_at || new Date().toISOString())}</div>
          {q.validity_date && <div><span style={{ opacity: 0.6 }}>Valid Till: </span>{formatDate(q.validity_date)}</div>}
        </div>
      </div>

      {/* Bill To */}
      <div style={{ padding: "16px 28px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280", marginBottom: 4 }}>Bill To</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: b.font }}>{q.customer_name}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
          {[q.phone, q.whatsapp && q.whatsapp !== q.phone ? `WA: ${q.whatsapp}` : null, q.email].filter(Boolean).join("  •  ")}
        </div>
        {q.address && <div style={{ fontSize: 12, color: "#6b7280" }}>{q.address}</div>}
      </div>

      {/* Items table */}
      <div style={{ padding: "0 28px", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: b.primary, color: onDarkText }}>
              <th style={{ ...thStyle, width: 36 }}>#</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Item Description</th>
              <th style={{ ...thStyle, width: 50, textAlign: "right" }}>Qty</th>
              <th style={{ ...thStyle, width: 90, textAlign: "right" }}>Price</th>
              <th style={{ ...thStyle, width: 60, textAlign: "right" }}>Disc</th>
              <th style={{ ...thStyle, width: 100, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((it, i) => {
              const total = Number(it.qty) * Number(it.price) * (1 - Number(it.discount_pct || 0) / 100);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : altRowBg }}>
                  <td style={{ ...tdStyle, color: b.font }}>{i + 1}</td>
                  <td style={{ ...tdStyle, color: b.font }}>{it.name}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: b.font }}>{it.qty}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: b.font }}>{formatINR(it.price)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: b.font }}>{it.discount_pct || 0}%</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: b.font }}>{formatINR(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: "16px 28px", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 300, fontSize: 13, color: b.font }}>
          <Row k="Subtotal" v={formatINR(q.subtotal)} />
          {q.discount > 0 && <Row k="Discount" v={`- ${formatINR(q.discount)}`} />}
          <Row k={`GST (${q.gst_percent}%)`} v={formatINR(q.gst_amount)} />
          <div style={{ marginTop: 8, background: b.accent, color: onDarkText, padding: "10px 14px", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>GRAND TOTAL</span>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{formatINR(q.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Notes / Terms */}
      {(q.notes || q.terms) && (
        <div style={{ padding: "0 28px 16px", borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
          {q.notes && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 2 }}>Notes</div>
              <div style={{ fontSize: 12, color: b.font, whiteSpace: "pre-wrap" }}>{q.notes}</div>
            </div>
          )}
          {q.terms && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 2 }}>Terms &amp; Conditions</div>
              <div style={{ fontSize: 12, color: b.font, whiteSpace: "pre-wrap" }}>{q.terms}</div>
            </div>
          )}
        </div>
      )}

      {/* Footer bar */}
      <div style={{ background: b.primary, color: onDarkText, padding: "12px 28px", textAlign: "center", fontSize: 11 }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{b.footer_text}</div>
        <div style={{ opacity: 0.8 }}>{[b.shop_website, b.shop_phone].filter(Boolean).join("  •  ")}</div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "10px 8px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 };
const tdStyle: React.CSSProperties = { padding: "10px 8px", borderBottom: "1px solid #eef0f3" };
const Row = ({ k, v }: { k: string; v: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
    <span style={{ opacity: 0.7 }}>{k}</span>
    <span style={{ fontWeight: 600 }}>{v}</span>
  </div>
);

/**
 * Mini-preview for the Admin Branding tab. Same header as full preview.
 */
export function QuotationHeaderPreview({ b }: { b: QuotationBranding }) {
  return (
    <div style={{ width: "100%", maxWidth: 600, fontFamily: "'Inter', system-ui, sans-serif", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
      <div style={{ background: b.primary, color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        {b.logo_url ? (
          <img src={b.logo_url} alt="" style={{ height: 40, background: "#fff", padding: 3, borderRadius: 4, objectFit: "contain" }} />
        ) : (
          <div style={{ width: 40, height: 40, background: b.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, borderRadius: 5 }}>CS</div>
        )}
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{b.shop_name}</div>
          <div style={{ fontSize: 10, opacity: 0.85 }}>{b.shop_phone} · {b.shop_email}</div>
        </div>
      </div>
      <div style={{ padding: "12px 20px", background: b.bg, color: b.font, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: b.accent, letterSpacing: 1 }}>{b.watermark}</div>
        <div style={{ background: b.accent, color: "#fff", padding: "6px 14px", borderRadius: 4, fontSize: 13, fontWeight: 700 }}>GRAND TOTAL ₹54,727</div>
      </div>
    </div>
  );
}
