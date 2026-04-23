import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteWhatsappTemplate {
  id: string;
  template_key: string;
  label: string;
  description: string | null;
  message_body: string;
  placeholders: string | null;
  sort_order: number;
  is_active: boolean;
}

export function useWhatsappTemplates() {
  return useQuery({
    queryKey: ["site_whatsapp_templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_whatsapp_templates")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data || []) as SiteWhatsappTemplate[];
    },
    staleTime: 60_000,
  });
}

/** Replace {placeholders} in a template body with values. Unknown keys become empty strings. */
export function fillTemplate(body: string, vars: Record<string, string | number | undefined | null>) {
  return (body || "").replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

/** Look up a template by key and apply variables. Returns the fallback if missing/disabled. */
export function getTemplateMessage(
  templates: SiteWhatsappTemplate[] | undefined,
  key: string,
  vars: Record<string, string | number | undefined | null>,
  fallback: string,
): string {
  const t = templates?.find((x) => x.template_key === key && x.is_active);
  return fillTemplate(t?.message_body || fallback, vars);
}
