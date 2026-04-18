// Quotation message template + renderer.
// Used by WhatsApp/Email sends and by the Admin "Quotation Message Template" editor.
//
// Supported placeholders (both {x} and {{x}} are accepted):
//   {{client_name}}    {{company_name}}   {{quote_no}}
//   {{date}}           {{validity_date}}  {{grand_total}}
//   {{subtotal}}       {{discount}}       {{notes}}
//   {{items_table}}    {{shop_phone}}     {{shop_email}}
//   {{image_url}}      {{online_url}}

export const DEFAULT_QUOTATION_MESSAGE_TEMPLATE = `*{{company_name}}*
Quotation: *{{quote_no}}*
Date: {{date}}

Dear {{client_name}},
Thank you for your enquiry. Please find your quotation below.

{{items_table}}

Subtotal : {{subtotal}}
Discount : {{discount}}
*GRAND TOTAL : {{grand_total}}*

Valid till: {{validity_date}}

Notes:
{{notes}}

For any queries, contact us:
📞 {{shop_phone}}
✉ {{shop_email}}

🖼 Quotation image: {{image_url}}
🔗 View online: {{online_url}}

— {{company_name}}`;

export type QuotationMessageVars = {
  client_name?: string;
  company_name?: string;
  quote_no?: string;
  date?: string;
  validity_date?: string;
  grand_total?: string;
  subtotal?: string;
  discount?: string;
  notes?: string;
  items_table?: string;
  shop_phone?: string;
  shop_email?: string;
  image_url?: string;
  online_url?: string;
};

export function renderQuotationMessage(template: string, vars: QuotationMessageVars): string {
  const tpl = template && template.trim() ? template : DEFAULT_QUOTATION_MESSAGE_TEMPLATE;
  // Accept both {{name}} and {name}
  let out = tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => stringify((vars as any)[k]));
  out = out.replace(/\{\s*(\w+)\s*\}/g, (_, k) => stringify((vars as any)[k]));
  // Strip any line that ends up empty after a label like "Notes:" / "🖼 ...:" with no value.
  return out
    .split("\n")
    .filter((ln) => {
      const t = ln.trim();
      if (!t) return true;
      // remove "🖼 ...:" / "🔗 ...:" lines with empty url
      if (/^[^A-Za-z0-9]*\S+\s*:\s*$/.test(t) && /(image_url|online_url|http)/i.test("")) return false;
      return true;
    })
    .join("\n")
    // collapse 3+ blank lines into max 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stringify(v: any): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

// Build a clean monospaced items table for WhatsApp/text.
// Sr | Item | Qty | Unit | Total
export function buildItemsTable(items: Array<{ name: string; qty: number; price: number; discount_pct?: number }>): string {
  if (!items || items.length === 0) return "(no items)";

  const fmt = (n: number) =>
    "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const lines: string[] = [];
  lines.push("--------------------------------------");
  items.forEach((it, i) => {
    const qty = Number(it.qty || 0);
    const price = Number(it.price || 0);
    const total = qty * price * (1 - Number(it.discount_pct || 0) / 100);
    lines.push(`${i + 1}. ${it.name}`);
    lines.push(`   Qty: ${qty}   Unit: ${fmt(price)}   Total: ${fmt(total)}`);
    lines.push("");
  });
  // remove the trailing blank line, then close
  if (lines[lines.length - 1] === "") lines.pop();
  lines.push("--------------------------------------");
  return lines.join("\n");
}

export function buildMessageVarsFromQuote(opts: {
  quote: any;
  companyName: string;
  shopPhone?: string;
  shopEmail?: string;
  imageUrl?: string | null;
  onlineUrl?: string;
  recipientName?: string;
}): QuotationMessageVars {
  const { quote, companyName, shopPhone, shopEmail, imageUrl, onlineUrl, recipientName } = opts;
  const items = Array.isArray(quote.items) ? quote.items : [];
  const fmt = (n: number) =>
    "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const dateStr = (() => {
    const d = quote.created_at ? new Date(quote.created_at) : new Date();
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  })();
  return {
    client_name: recipientName || quote.customer_name || "Customer",
    company_name: companyName || "",
    quote_no: quote.quote_no || "",
    date: dateStr,
    validity_date: quote.validity_date
      ? new Date(quote.validity_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "",
    grand_total: fmt(quote.total_amount),
    subtotal: fmt(quote.subtotal),
    discount: fmt(quote.discount),
    notes: quote.notes || "—",
    items_table: buildItemsTable(items),
    shop_phone: shopPhone || "",
    shop_email: shopEmail || "",
    image_url: imageUrl || "",
    online_url: onlineUrl || "",
  };
}
