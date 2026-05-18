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

/**
 * QuoteDisplaySettings — controls which fields appear on the JPEG/print output.
 * All data is always saved to DB. These settings only affect the rendered preview.
 *
 * Persisted in localStorage so they survive page refreshes.
 */
export type QuoteDisplaySettings = {
  showLogo: boolean;
  showCompanyName: boolean;
  showCompanyAddress: boolean;
  showCompanyPhone: boolean;
  showCompanyEmail: boolean;
  showCompanyGst: boolean;
  showQuoteNo: boolean;
  showDate: boolean;
  showValidTill: boolean;
  showCustomerPhone: boolean;
  showCustomerEmail: boolean;
  showCustomerAddress: boolean;
  showItemCode: boolean;
  showSpecs: boolean;
  showQty: boolean;
  showUnitPrice: boolean;
  showItemDiscount: boolean;
  showSubtotal: boolean;
  showDiscount: boolean;
  showGst: boolean;
  showGrandTotal: boolean;
  showTerms: boolean;
  showFooter: boolean;
  showNotes: boolean;
};

export const DEFAULT_DISPLAY_SETTINGS: QuoteDisplaySettings = {
  showLogo: true,
  showCompanyName: true,
  showCompanyAddress: true,
  showCompanyPhone: true,
  showCompanyEmail: true,
  showCompanyGst: false,
  showQuoteNo: true,
  showDate: true,
  showValidTill: true,
  showCustomerPhone: true,
  showCustomerEmail: true,
  showCustomerAddress: true,
  showItemCode: false,
  showSpecs: true,
  showQty: true,
  showUnitPrice: true,
  showItemDiscount: true,
  showSubtotal: true,
  showDiscount: true,
  showGst: true,
  showGrandTotal: true,
  showTerms: true,
  showFooter: true,
  showNotes: false,
};

const SETTINGS_KEY = "quotation_display_settings";

export function loadDisplaySettings(): QuoteDisplaySettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_DISPLAY_SETTINGS };
    return { ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DISPLAY_SETTINGS };
  }
}

export function saveDisplaySettings(s: QuoteDisplaySettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ── Settings Panel UI ────────────────────────────────────────────────────────
type ToggleGroup = { label: string; items: { key: keyof QuoteDisplaySettings; label: string }[] };

const TOGGLE_GROUPS: ToggleGroup[] = [
  {
    label: "Company Header",
    items: [
      { key: "showLogo",           label: "Company Logo" },
      { key: "showCompanyName",    label: "Company Name" },
      { key: "showCompanyAddress", label: "Address" },
      { key: "showCompanyPhone",   label: "Phone" },
      { key: "showCompanyEmail",   label: "Email" },
      { key: "showCompanyGst",     label: "GST Number" },
    ],
  },
  {
    label: "Quote Info",
    items: [
      { key: "showQuoteNo",    label: "Quote Number" },
      { key: "showDate",       label: "Date" },
      { key: "showValidTill",  label: "Valid Till" },
    ],
  },
  {
    label: "Customer Info",
    items: [
      { key: "showCustomerPhone",   label: "Customer Phone" },
      { key: "showCustomerEmail",   label: "Customer Email" },
      { key: "showCustomerAddress", label: "Customer Address" },
    ],
  },
  {
    label: "Items Table",
    items: [
      { key: "showSpecs",        label: "Specifications" },
      { key: "showQty",          label: "Quantity Column" },
      { key: "showUnitPrice",    label: "Unit Price Column" },
      { key: "showItemDiscount", label: "Item Discount Column" },
    ],
  },
  {
    label: "Totals",
    items: [
      { key: "showSubtotal",  label: "Subtotal Row" },
      { key: "showDiscount",  label: "Discount Row" },
      { key: "showGst",       label: "GST Row" },
      { key: "showGrandTotal",label: "Grand Total Block" },
    ],
  },
  {
    label: "Footer / Notes",
    items: [
      { key: "showTerms",  label: "Terms & Conditions" },
      { key: "showFooter", label: "Footer Bar" },
      { key: "showNotes",  label: "Internal Notes (private)" },
    ],
  },
];

export function QuoteDisplaySettingsPanel({
  settings,
  onChange,
}: {
  settings: QuoteDisplaySettings;
  onChange: (s: QuoteDisplaySettings) => void;
}) {
  const toggle = (key: keyof QuoteDisplaySettings) => {
    const next = { ...settings, [key]: !settings[key] };
    onChange(next);
    saveDisplaySettings(next);
  };

  const resetAll = () => {
    onChange({ ...DEFAULT_DISPLAY_SETTINGS });
    saveDisplaySettings({ ...DEFAULT_DISPLAY_SETTINGS });
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Quotation Display Settings</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Controls what appears on the JPEG image &amp; print. All data is always saved to the database.
          </p>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 hover:border-slate-500 transition-colors"
        >
          Reset defaults
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOGGLE_GROUPS.map((group) => (
          <div key={group.label} className="bg-slate-800/50 rounded-lg p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
              {group.label}
            </div>
            {group.items.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                {/* Custom toggle switch */}
                <div
                  onClick={() => toggle(key)}
                  className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                    settings[key] ? "bg-blue-500" : "bg-slate-600"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                      settings[key] ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <span
                  onClick={() => toggle(key)}
                  className={`text-xs transition-colors ${
                    settings[key] ? "text-slate-200" : "text-slate-500"
                  } group-hover:text-white`}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main QuotationPreview ────────────────────────────────────────────────────
/**
 * Pure render-from-props quotation. NO data fetching, NO server calls.
 * Container is fixed 794px wide (A4) with id="quotation-preview" for html2canvas.
 *
 * ds = display settings — controls which fields appear.
 * Falls back to DEFAULT_DISPLAY_SETTINGS if not provided (backward compatible).
 */
export function QuotationPreview({
  q,
  b,
  showNotes = false,
  ds,
}: {
  q: QuotePreviewData;
  b: QuotationBranding;
  showNotes?: boolean;
  ds?: QuoteDisplaySettings;
}) {
  // Merge with defaults so missing keys don't break anything
  const d: QuoteDisplaySettings = { ...DEFAULT_DISPLAY_SETTINGS, ...(ds || {}) };

  // showNotes prop still works as before (legacy compat) but ds.showNotes takes precedence if ds provided
  const displayNotes = ds ? d.showNotes : showNotes;

  const onDarkText = "#ffffff";
  const altRowBg = "#f8f9fa";

  // Build company info line
  const companyInfoParts = [
    d.showCompanyAddress && b.shop_address,
    d.showCompanyPhone   && b.shop_phone,
    d.showCompanyEmail   && b.shop_email,
    d.showCompanyGst     && b.shop_gst && `GST: ${b.shop_gst}`,
  ].filter(Boolean);

  // Determine which columns to show in items table
  const colQty      = d.showQty;
  const colPrice    = d.showUnitPrice;
  const colDiscount = d.showItemDiscount;
  // Total column always shown if grand total is shown
  const colTotal    = d.showGrandTotal;

  // Count visible columns for colspan
  const visibleCols = 2 + (colQty ? 1 : 0) + (colPrice ? 1 : 0) + (colDiscount ? 1 : 0) + (colTotal ? 1 : 0);

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
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div style={{ background: b.primary, color: onDarkText, padding: "20px 28px", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Logo */}
        {d.showLogo && b.logo_url ? (
          <img src={b.logo_url} alt="logo" crossOrigin="anonymous" style={{ height: 50, objectFit: "contain", background: "white", padding: 4, borderRadius: 4 }} />
        ) : d.showLogo && !b.logo_url ? (
          <div style={{ width: 50, height: 50, background: b.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, borderRadius: 6 }}>
            {(b.shop_name || "CS").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
          </div>
        ) : null}

        {/* Company name + info */}
        <div style={{ flex: 1 }}>
          {d.showCompanyName && (
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.3 }}>{b.shop_name}</div>
          )}
          {companyInfoParts.length > 0 && (
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
              {companyInfoParts.join("  •  ")}
            </div>
          )}
        </div>
      </div>

      {/* ── Quote meta ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: b.accent, letterSpacing: 1 }}>{b.watermark}</div>
        <div style={{ textAlign: "right", fontSize: 12, color: b.font, lineHeight: 1.6 }}>
          {d.showQuoteNo   && <div><span style={{ opacity: 0.6 }}>Quote No: </span><strong>{q.quote_no}</strong></div>}
          {d.showDate      && <div><span style={{ opacity: 0.6 }}>Date: </span>{formatDate(q.created_at || new Date().toISOString())}</div>}
          {d.showValidTill && q.validity_date && <div><span style={{ opacity: 0.6 }}>Valid Till: </span>{formatDate(q.validity_date)}</div>}
        </div>
      </div>

      {/* ── Bill To ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 28px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280", marginBottom: 4 }}>Bill To</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: b.font }}>{q.customer_name}</div>
        {(() => {
          const parts = [
            d.showCustomerPhone && q.phone,
            d.showCustomerPhone && q.whatsapp && q.whatsapp !== q.phone ? `WA: ${q.whatsapp}` : null,
            d.showCustomerEmail && q.email,
          ].filter(Boolean);
          return parts.length > 0 ? (
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{parts.join("  •  ")}</div>
          ) : null;
        })()}
        {d.showCustomerAddress && q.address && (
          <div style={{ fontSize: 12, color: "#6b7280" }}>{q.address}</div>
        )}
      </div>

      {/* ── Items table ────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 28px", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: b.primary, color: onDarkText }}>
              <th style={{ ...thStyle, width: 36 }}>#</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Item Description</th>
              {colQty      && <th style={{ ...thStyle, width: 50,  textAlign: "right" }}>Qty</th>}
              {colPrice    && <th style={{ ...thStyle, width: 90,  textAlign: "right" }}>Price</th>}
              {colDiscount && <th style={{ ...thStyle, width: 60,  textAlign: "right" }}>Disc</th>}
              {colTotal    && <th style={{ ...thStyle, width: 100, textAlign: "right" }}>Total</th>}
            </tr>
          </thead>
          <tbody>
            {q.items.map((it, i) => {
              const total = Number(it.qty) * Number(it.price) * (1 - Number(it.discount_pct || 0) / 100);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : altRowBg }}>
                  <td style={{ ...tdStyle, color: b.font, verticalAlign: "top" }}>{i + 1}</td>
                  <td style={{ ...tdStyle, color: b.font }}>
                    <div style={{ fontWeight: 600 }}>{it.name}</div>
                    {d.showSpecs && it.specs && (
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, whiteSpace: "pre-wrap" }}>{it.specs}</div>
                    )}
                  </td>
                  {colQty      && <td style={{ ...tdStyle, textAlign: "right", color: b.font }}>{it.qty}</td>}
                  {colPrice    && <td style={{ ...tdStyle, textAlign: "right", color: b.font }}>{formatINR(it.price)}</td>}
                  {colDiscount && <td style={{ ...tdStyle, textAlign: "right", color: b.font }}>{it.discount_pct || 0}%</td>}
                  {colTotal    && <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: b.font }}>{formatINR(total)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Totals ─────────────────────────────────────────────────────────── */}
      {(d.showSubtotal || d.showDiscount || d.showGst || d.showGrandTotal) && (
        <div style={{ padding: "16px 28px", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 300, fontSize: 13, color: b.font }}>
            {d.showSubtotal && <TotalsRow k="Subtotal" v={formatINR(q.subtotal)} />}
            {d.showDiscount && q.discount > 0 && <TotalsRow k="Discount" v={`- ${formatINR(q.discount)}`} />}
            {d.showGst && Number(q.gst_percent) > 0 && <TotalsRow k={`GST (${q.gst_percent}%)`} v={formatINR(q.gst_amount)} />}
            {d.showGrandTotal && (
              <div style={{ marginTop: 8, background: b.accent, color: onDarkText, padding: "10px 14px", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>GRAND TOTAL</span>
                <span style={{ fontSize: 18, fontWeight: 700 }}>{formatINR(q.total_amount)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Terms / Notes ──────────────────────────────────────────────────── */}
      {((displayNotes && q.notes) || (d.showTerms && q.terms)) && (
        <div style={{ padding: "0 28px 16px", borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
          {displayNotes && q.notes && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 2 }}>Internal Notes (Private)</div>
              <div style={{ fontSize: 12, color: b.font, whiteSpace: "pre-wrap" }}>{q.notes}</div>
            </div>
          )}
          {d.showTerms && q.terms && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 2 }}>Terms &amp; Conditions</div>
              <div style={{ fontSize: 12, color: b.font, whiteSpace: "pre-wrap" }}>{q.terms}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Footer bar ─────────────────────────────────────────────────────── */}
      {d.showFooter && (
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
const TotalsRow = ({ k, v }: { k: string; v: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
    <span style={{ opacity: 0.7 }}>{k}</span>
    <span style={{ fontWeight: 600 }}>{v}</span>
  </div>
);

/**
 * Mini-preview for the Admin Branding tab. Unchanged.
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
