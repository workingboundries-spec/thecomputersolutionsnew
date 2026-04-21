import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate } from "@/crm/lib/format";

export function fillTemplate(tpl: string, vars: Record<string, string | number | undefined | null>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export type ShopInfo = {
  shop_name?: string;
  shop_phone?: string;
  shop_email?: string;
  shop_address?: string;
};

const SHOP_DEFAULTS = { shop_name: "The Computer Solutions", shop_phone: "", shop_email: "", shop_address: "" };

function shopVars(shop?: ShopInfo) {
  return {
    shop_name: shop?.shop_name || SHOP_DEFAULTS.shop_name,
    shop_phone: shop?.shop_phone || "",
    shop_email: shop?.shop_email || "",
    shop_address: shop?.shop_address || "",
  };
}

/** Full placeholder map for enquiry-style messages. */
export function buildEnquiryVars(r: any, opts?: { shop?: ShopInfo; specs?: string }) {
  const specs = (opts?.specs || "").trim();
  const notes = (r?.notes || "").trim();
  const item = r?.item_name || r?.product_category || "";
  return {
    name: r?.customer_name || "",
    phone: r?.phone || "",
    whatsapp: r?.whatsapp || r?.phone || "",
    item,
    device: item,
    category: r?.product_category || "",
    address: r?.address || "",
    budget: r?.budget ? formatINR(r.budget) : "",
    price: r?.budget ? formatINR(r.budget) : "",
    amount: r?.budget ? formatINR(r.budget) : "",
    description: r?.description || "",
    specs_block: specs ? `\n\nSpecifications:\n${specs}` : "",
    notes_block: notes ? `\n\n${notes}` : "",
    link: "",
    valid_until: "",
    job_no: "",
    status: "",
    invoice_no: "",
    purchase_date: "",
    expiry: "",
    cost_line: "",
    ...shopVars(opts?.shop),
  };
}

/** Full placeholder map for service status messages. */
export function buildServiceVars(r: any, opts?: { shop?: ShopInfo; statusLabel?: string }) {
  const finalCost = Number(r?.final_cost || 0);
  const estCost = Number(r?.estimated_cost || 0);
  const costLine = finalCost
    ? ` Final cost: ${formatINR(finalCost)}.`
    : estCost ? ` Estimate: ${formatINR(estCost)}.` : "";
  const device = [r?.device_type, r?.brand, r?.model].filter(Boolean).join(" ");
  return {
    name: r?.customer_name || "",
    phone: r?.phone || "",
    whatsapp: r?.whatsapp || r?.phone || "",
    device: device || r?.device_type || "",
    item: device || r?.device_type || "",
    job_no: r?.job_card_no || "",
    status: opts?.statusLabel || r?.status || "",
    cost_line: costLine,
    amount: finalCost ? formatINR(finalCost) : (estCost ? formatINR(estCost) : ""),
    price: finalCost ? formatINR(finalCost) : (estCost ? formatINR(estCost) : ""),
    address: r?.address || "",
    notes_block: r?.technician_notes ? `\n\n${r.technician_notes}` : "",
    specs_block: "",
    link: "",
    valid_until: "",
    invoice_no: "",
    purchase_date: r?.received_date ? formatDate(r.received_date) : "",
    expiry: r?.delivery_date ? formatDate(r.delivery_date) : "",
    category: "",
    ...shopVars(opts?.shop),
  };
}

/** Full placeholder map for sales receipt / sales-form messages. */
export function buildSalesVars(s: any, opts?: { shop?: ShopInfo; link?: string }) {
  return {
    name: s?.customer_name || "",
    phone: s?.phone || "",
    whatsapp: s?.whatsapp || s?.phone || "",
    item: s?.item_name || "",
    device: s?.item_name || "",
    invoice_no: s?.invoice_no || "",
    job_no: "",
    amount: s?.total_amount ? formatINR(s.total_amount) : "",
    price: s?.sale_price ? formatINR(s.sale_price) : (s?.total_amount ? formatINR(s.total_amount) : ""),
    purchase_date: s?.sale_date ? formatDate(s.sale_date) : "",
    date: s?.sale_date ? formatDate(s.sale_date) : "",
    expiry: s?.warranty_expiry ? formatDate(s.warranty_expiry) : "",
    warranty_expiry: s?.warranty_expiry ? formatDate(s.warranty_expiry) : "",
    address: s?.address || "",
    link: opts?.link || "",
    valid_until: "",
    status: s?.payment_status || "",
    cost_line: "",
    specs_block: "",
    notes_block: s?.notes ? `\n\n${s.notes}` : "",
    category: "",
    budget: "",
    description: "",
    ...shopVars(opts?.shop),
  };
}

/** Full placeholder map for direct catalogue quote-share messages. */
export function buildCatalogueQuoteVars(opts: {
  name?: string;
  phone?: string;
  item?: any;
  price?: number;
  specs?: string;
  link?: string;
  validUntil?: string;
  shop?: ShopInfo;
}) {
  const itemName = typeof opts.item === "string"
    ? opts.item
    : opts.item ? `${opts.item.brand || ""} ${opts.item.model || ""}`.trim() : "";
  const specs = (opts.specs || "").trim();
  return {
    name: opts.name || "there",
    phone: opts.phone || "",
    whatsapp: opts.phone || "",
    item: itemName,
    device: itemName,
    price: opts.price !== undefined ? formatINR(opts.price) : "",
    amount: opts.price !== undefined ? formatINR(opts.price) : "",
    link: opts.link || "",
    valid_until: opts.validUntil ? formatDate(opts.validUntil) : "",
    specs_block: specs ? `\n\nSpecifications:\n${specs}` : "",
    notes_block: "",
    invoice_no: "",
    job_no: "",
    status: "",
    purchase_date: "",
    expiry: "",
    cost_line: "",
    address: "",
    budget: "",
    category: "",
    description: "",
    ...shopVars(opts.shop),
  };
}

/** Full placeholder map for warranty / dashboard reminder messages. */
export function buildReminderVars(r: any, opts?: { shop?: ShopInfo }) {
  return {
    name: r?.customer_name || "",
    phone: r?.phone || "",
    whatsapp: r?.whatsapp || r?.phone || "",
    item: r?.item_name || "purchase",
    device: r?.item_name || "",
    purchase_date: r?.purchase_date ? formatDate(r.purchase_date) : "",
    date: r?.purchase_date ? formatDate(r.purchase_date) : "",
    expiry: r?.warranty_expiry ? formatDate(r.warranty_expiry) : "",
    warranty_expiry: r?.warranty_expiry ? formatDate(r.warranty_expiry) : "",
    invoice_no: "",
    job_no: "",
    status: r?.reminder_type || "",
    amount: "",
    price: "",
    link: "",
    valid_until: "",
    cost_line: "",
    specs_block: "",
    notes_block: "",
    address: "",
    budget: "",
    category: "",
    description: "",
    ...shopVars(opts?.shop),
  };
}

export function waLink(phone: string, message: string) {
  const digits = (phone || "").replace(/\D/g, "");
  const cc = digits.startsWith("91") ? digits : "91" + digits;
  return `https://wa.me/${cc}?text=${encodeURIComponent(message)}`;
}

export async function logWhatsApp(payload: {
  sale_id?: string | null;
  customer_name?: string;
  phone?: string;
  message_type: string;
  message_text: string;
}) {
  await supabase.from("crm_whatsapp_log").insert({
    sale_id: payload.sale_id || null,
    customer_name: payload.customer_name || null,
    phone: payload.phone || null,
    message_type: payload.message_type,
    message_text: payload.message_text,
    status: "sent",
  });
}

// Simple in-memory cache so we don't hit the DB on every WhatsApp click.
let _tplCache: Record<string, string> | null = null;
let _tplCacheAt = 0;
const TPL_TTL_MS = 60_000;

/** Load all WhatsApp templates from crm_whatsapp_templates (cached 60s). */
export async function loadWhatsappTemplates(force = false): Promise<Record<string, string>> {
  if (!force && _tplCache && Date.now() - _tplCacheAt < TPL_TTL_MS) return _tplCache;
  const { data } = await supabase.from("crm_whatsapp_templates").select("template_name, message_body");
  const map: Record<string, string> = {};
  (data || []).forEach((r: any) => { map[r.template_name] = r.message_body; });
  _tplCache = map;
  _tplCacheAt = Date.now();
  return map;
}

/** Get a single template by name; falls back to provided default if missing. */
export async function getTemplate(name: string, fallback: string): Promise<string> {
  const all = await loadWhatsappTemplates();
  return all[name] || fallback;
}

/** Reset cache (call after edits in Settings). */
export function clearTemplateCache() { _tplCache = null; }
