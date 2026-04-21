import { supabase } from "@/integrations/supabase/client";

export function fillTemplate(tpl: string, vars: Record<string, string | number | undefined | null>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
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
