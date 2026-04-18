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
