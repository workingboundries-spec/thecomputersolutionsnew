import { formatINR, formatDate } from "@/crm/lib/format";
import type { QuotationBranding } from "@/crm/lib/quotationBranding";

export type QuotePreviewData = {
  quote_no: string;
  customer_name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  items: Array<{ name: string; qty: number; price: number; discount_pct?: number; specs?: string }>;
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

// ── Visibility controls ───────────────────────────────────────────────────────
export type QuotationVisibility = {
  // Header
  logo: boolean;
  shopName: boolean;
  shopContact: boolean;      // address · phone · email · GST in header sub-line
  // Quote meta bar
  watermark: boolean;        // "QUOTATION" heading text
  quoteNo: boolean;
  quoteDate: boolean;
  validTill: boolean;
  // Bill To
  billTo: boolean;           // entire Bill To section
  customerContact: boolean;  // phone / whatsapp / email line
  customerAddress: boolean;
  // Items table columns
  colSerial: boolean;        // # column
  colQty: boolean;
  colPrice: boolean;
  colDiscount: boolean;      // Disc% column
  colTotal: boolean;
  itemSpecs: boolean;        // spec line under item name
  // Totals block
  rowSubtotal: boolean;
  rowDiscount: boolean;
  rowGst: boolean;
  grandTotal: boolean;
  // Footer sections
  terms: boolean;
  footer: boolean;
};

export const DEFAULT_VISIBILITY: QuotationVisibility = {
  logo: true, shopName: true, shopContact: true,
  watermark: true, quoteNo: true, quoteDate: true, validTill: true,
  billTo: true, customerContact: true, customerAddress: true,
  colSerial: true, colQty: true, colPrice: true, colDiscount: true, colTotal: true,
  itemSpecs: true,
  rowSubtotal: true, rowDiscount: true, rowGst: true, grandTotal: true,
  terms: true, footer: true,
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure render-from-props quotation. NO data fetching, NO server calls.
 * Container is fixed 794px wide (A4) with id="quotation-preview" for html2canvas.
 */
export function QuotationPreview({
  q,
  b,
  showNotes = false,
  vis: visProp,
}: {
  q: QuotePreviewData;
  b: QuotationBranding;
  showNotes?: boolean;
  vis?: Partial<QuotationVisibility>;
}) {
  // Merge caller overrides with defaults so partial vis objects work
  const vis: QuotationVisibility = { ...DEFAULT_VISIBILITY, ...(visProp || {}) };

  const onDarkText = "#ffffff";
  const altRowBg = "#f8f9fa";

  // Build visible column list once so header + rows stay in sync
  const cols = [
    { key: "serial",   show: vis.colSerial,   label: "#",     width: 36,  align: "center" as const },
    { key: "item",     show: true,             label: "Item Description", width: undefined, align: "left" as const },
    { key: "qty",      show: vis.colQty,       label: "Qty",   width: 50,  align: "right" as const },
    { key: "price",    show: vis.colPrice,     label: "Price", width: 90,  align: "right" as const },
    { key: "discount", show: vis.colDiscount,  label: "Disc",  width: 60,  align: "right" as const },
    { key: "total",    show: vis.colTotal,     label: "Total", width: 100, align: "right" as const },
  ].filter((c) => c.show);

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
      {/* ── Header bar ─────────────────────────────────────────────────── */}
      {(vis.logo || vis.shopName || vis.shopContact) && (
        <div style={{ background: b.primary, color: onDarkText, padding: "20px 28px", display: "flex", alignItems: "center", gap: 16 }}>
          {vis.logo && (
            b.logo_url ? (
              <img src={b.logo_url} alt="logo" crossOrigin="anonymous"
                style={{ height: 50, objectFit: "contain", background: "white", padding: 4, borderRadius: 4 }} />
            ) : (
              <div style={{ width: 50, height: 50, background: b.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, borderRadius: 6 }}>
                {(b.shop_name || "CS").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            )
          )}
          <div style={{ flex: 1 }}>
            {vis.shopName && <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.3 }}>{b.shop_name}</div>}
            {vis.shopContact && (
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                {[b.shop_address, b.shop_phone, b.shop_email, b.shop_gst && `GST: ${b.shop_gst}`].filter(Boolean).join("  •  ")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quote meta bar ─────────────────────────────────────────────── */}
      {(vis.watermark || vis.quoteNo || vis.quoteDate || vis.validTill) && (
        <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e5e7eb" }}>
          {vis.watermark
            ? <div style={{ fontSize: 28, fontWeight: 700, color: b.accent, letterSpacing: 1 }}>{b.watermark}</div>
            : <div />}
          <div style={{ textAlign: "right", fontSize: 12, color: b.font, lineHeight: 1.6 }}>
            {vis.quoteNo && <div><span style={{ opacity: 0.6 }}>Quote No: </span><strong>{q.quote_no}</strong></div>}
            {vis.quoteDate && <div><span style={{ opacity: 0.6 }}>Date: </span>{formatDate(q.created_at || new Date().toISOString())}</div>}
            {vis.validTill && q.validity_date && <div><span style={{ opacity: 0.6 }}>Valid Till: </span>{formatDate(q.validity_date)}</div>}
          </div>
        </div>
      )}

      {/* ── Bill To ────────────────────────────────────────────────────── */}
      {vis.billTo && (
        <div style={{ padding: "16px 28px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280", marginBottom: 4 }}>Bill To</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: b.font }}>{q.customer_name}</div>
          {vis.customerContact && (
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {[q.phone, q.whatsapp && q.whatsapp !== q.phone ? `WA: ${q.whatsapp}` : null, q.email].filter(Boolean).join("  •  ")}
            </div>
          )}
          {vis.customerAddress && q.address && (
            <div style={{ fontSize: 12, color: "#6b7280" }}>{q.address}</div>
          )}
        </div>
      )}

      {/* ── Items table ────────────────────────────────────────────────── */}
      <div style={{ padding: "0 28px", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: b.primary, color: onDarkText }}>
              {cols.map((c) => (
                <th key={c.key} style={{ ...thStyle, width: c.width, textAlign: c.key === "item" ? "left" : c.align as any }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.items.map((it, i) => {
              const total = Number(it.qty) * Number(it.price) * (1 - Number(it.discount_pct || 0) / 100);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : altRowBg }}>
                  {cols.map((c) => {
                    switch (c.key) {
                      case "serial":
                        return <td key={c.key} style={{ ...tdStyle, textAlign: "center", color: b.font, verticalAlign: "top" }}>{i + 1}</td>;
                      case "item":
                        return (
                          <td key={c.key} style={{ ...tdStyle, color: b.font }}>
                            <div style={{ fontWeight: 600 }}>{it.name}</div>
                            {vis.itemSpecs && it.specs && (
                              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, whiteSpace: "pre-wrap" }}>{it.specs}</div>
                            )}
                          </td>
                        );
                      case "qty":
                        return <td key={c.key} style={{ ...tdStyle, textAlign: "right", color: b.font }}>{it.qty}</td>;
                      case "price":
                        return <td key={c.key} style={{ ...tdStyle, textAlign: "right", color: b.font }}>{formatINR(it.price)}</td>;
                      case "discount":
                        return <td key={c.key} style={{ ...tdStyle, textAlign: "right", color: b.font }}>{it.discount_pct || 0}%</td>;
                      case "total":
                        return <td key={c.key} style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: b.font }}>{formatINR(total)}</td>;
                      default:
                        return null;
                    }
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Totals block ───────────────────────────────────────────────── */}
      {(vis.rowSubtotal || vis.rowDiscount || vis.rowGst || vis.grandTotal) && (
        <div style={{ padding: "16px 28px", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 300, fontSize: 13, color: b.font }}>
            {vis.rowSubtotal && <TRow k="Subtotal" v={formatINR(q.subtotal)} />}
            {vis.rowDiscount && q.discount > 0 && <TRow k="Discount" v={`- ${formatINR(q.discount)}`} />}
            {vis.rowGst && Number(q.gst_percent) > 0 && <TRow k={`GST (${q.gst_percent}%)`} v={formatINR(q.gst_amount)} />}
            {vis.grandTotal && (
              <div style={{ marginTop: 8, background: b.accent, color: onDarkText, padding: "10px 14px", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>GRAND TOTAL</span>
                <span style={{ fontSize: 18, fontWeight: 700 }}>{formatINR(q.total_amount)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Terms / Notes ──────────────────────────────────────────────── */}
      {vis.terms && ((showNotes && q.notes) || q.terms) && (
        <div style={{ padding: "0 28px 16px", borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
          {showNotes && q.notes && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 2 }}>Internal Notes (Private)</div>
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

      {/* ── Footer bar ─────────────────────────────────────────────────── */}
      {vis.footer && (
        <div style={{ background: b.primary, color: onDarkText, padding: "12px 28px", textAlign: "center", fontSize: 11 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{b.footer_text}</div>
          <div style={{ opacity: 0.8 }}>{[b.shop_website, b.shop_phone].filter(Boolean).join("  •  ")}</div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "10px 8px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 };
const tdStyle: React.CSSProperties = { padding: "10px 8px", borderBottom: "1px solid #eef0f3" };
const TRow = ({ k, v }: { k: string; v: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
    <span style={{ opacity: 0.7 }}>{k}</span>
    <span style={{ fontWeight: 600 }}>{v}</span>
  </div>
);

/**
 * Mini-preview for the Admin Branding tab.
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
