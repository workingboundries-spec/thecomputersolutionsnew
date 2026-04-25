// CRM data importer. Accepts a JSON payload of rows (exported from the source
// project using the service role) and inserts them into this project's CRM
// tables using the service role, bypassing RLS.
//
// Auth: requires a logged-in CRM admin OR a shared secret header
// (x-import-secret matching CRM_IMPORT_SECRET if set).
//
// Payload shape:
// {
//   "tables": {
//     "crm_customers":  [ { ...row }, ... ],
//     "crm_enquiries":  [ ... ],
//     "crm_sales":      [ ... ],
//     "crm_services":   [ ... ],
//     "crm_quotations": [ ... ],
//     "crm_catalogue":  [ ... ],
//     "crm_warranty_reminders": [ ... ]
//   },
//   "mode": "upsert" | "insert"   // default: upsert (on id)
// }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-import-secret",
};

// Order matters: parents before children (FK refs).
const ALLOWED_TABLES = [
  "crm_customers",
  "crm_catalogue",
  "crm_enquiries",
  "crm_quotations",
  "crm_sales",
  "crm_services",
  "crm_warranty_reminders",
  "customer_event_logs",
  "campaigns",
  "campaign_recipients",
  "campaign_templates",
  "crm_whatsapp_templates",
  "crm_whatsapp_log",
  "quotation_templates",
  "quotation_send_log",
  "inventory_transactions",
  "inventory_audits",
  "crm_stock_audit_log",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const IMPORT_SECRET = Deno.env.get("CRM_IMPORT_SECRET");

    // ---- Auth: either x-import-secret OR a logged-in crm_admin ----
    const providedSecret = req.headers.get("x-import-secret");
    let authorized = false;

    if (IMPORT_SECRET && providedSecret && providedSecret === IMPORT_SECRET) {
      authorized = true;
    } else {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const userClient = createClient(SUPABASE_URL, ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: claimsData } = await userClient.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (userId) {
          const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
          const { data: roleRow } = await admin
            .from("crm_user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "crm_admin")
            .maybeSingle();
          if (roleRow) authorized = true;
        }
      }
    }

    if (!authorized) {
      return json({ error: "Unauthorized" }, 401);
    }

    // ---- Parse payload ----
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || !body.tables) {
      return json({ error: "Body must be { tables: { <table>: [rows] } }" }, 400);
    }

    const mode: "upsert" | "insert" = body.mode === "insert" ? "insert" : "upsert";
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const results: Record<string, { inserted: number; error?: string }> = {};

    for (const table of ALLOWED_TABLES) {
      const rows = body.tables[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      // Chunk to avoid hitting payload limits.
      const chunkSize = 500;
      let inserted = 0;
      let lastError: string | undefined;

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const query =
          mode === "upsert"
            ? admin.from(table as AllowedTable).upsert(chunk, { onConflict: "id" })
            : admin.from(table as AllowedTable).insert(chunk);
        const { error, count } = await query.select("id", { count: "exact", head: true });
        if (error) {
          lastError = error.message;
          break;
        }
        inserted += count ?? chunk.length;
      }

      results[table] = lastError
        ? { inserted, error: lastError }
        : { inserted };
    }

    return json({ ok: true, mode, results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
