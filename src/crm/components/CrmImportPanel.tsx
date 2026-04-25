import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function CrmImportPanel() {
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    let payload: any;
    try {
      payload = JSON.parse(json);
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    if (!payload?.tables || typeof payload.tables !== "object") {
      toast.error('JSON must include a "tables" object');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("crm-import", {
        body: payload,
      });
      if (error) throw error;
      setResult(data);
      const total = Object.values((data as any)?.results || {}).reduce(
        (s: number, r: any) => s + (r.inserted || 0),
        0
      );
      toast.success(`Imported ${total} rows`);
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setJson(String(r.result || ""));
    r.readAsText(f);
  };

  const exportSql = `SELECT jsonb_build_object(
  'mode','upsert',
  'tables', jsonb_build_object(
    'crm_customers',          (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM crm_customers t),
    'crm_catalogue',          (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM crm_catalogue t),
    'crm_enquiries',          (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM crm_enquiries t),
    'crm_quotations',         (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM crm_quotations t),
    'crm_sales',              (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM crm_sales t),
    'crm_services',           (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM crm_services t),
    'crm_warranty_reminders', (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM crm_warranty_reminders t),
    'customer_event_logs',    (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM customer_event_logs t),
    'crm_whatsapp_templates', (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM crm_whatsapp_templates t),
    'crm_whatsapp_log',       (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM crm_whatsapp_log t),
    'quotation_templates',    (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM quotation_templates t),
    'inventory_transactions', (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM inventory_transactions t),
    'inventory_audits',       (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM inventory_audits t),
    'crm_stock_audit_log',    (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM crm_stock_audit_log t)
  )
) AS payload;`;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 font-semibold">1. Export from old project</h3>
        <p className="mb-2 text-sm text-muted-foreground">
          In your <strong>original</strong> Lovable Cloud project, open the SQL Editor and run this query.
          Copy the JSON value from the <code>payload</code> column.
        </p>
        <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{exportSql}</pre>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(exportSql);
            toast.success("SQL copied");
          }}
          className="mt-2 rounded border border-border px-3 py-1 text-sm hover:bg-muted"
        >
          Copy SQL
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 font-semibold">2. Paste JSON & import</h3>
        <input
          type="file"
          accept=".json,application/json"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
          className="mb-2 block text-sm"
        />
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder='{"tables": {"crm_customers": [...], ...}}'
          className="h-48 w-full rounded border border-border bg-background p-2 font-mono text-xs"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={busy || !json.trim()}
          className="mt-2 inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {busy ? "Importing…" : "Import to this project"}
        </button>
      </div>

      {result && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 font-semibold">Result</h3>
          <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
