import { supabase } from "@/integrations/supabase/client";

export type PriceField = "nlc_price" | "billing_price" | "sale_price" | "online_price" | "mrp";

export type PriceChange = {
  field: PriceField;
  oldValue: number | null;
  newValue: number;
};

export type LogPriceChangesInput = {
  itemId: string;
  changes: PriceChange[];
  source: "add_stock" | "manual_edit";
  referenceId?: string | null;
  supplierName?: string | null;
  notes?: string | null;
  changedBy?: string | null;
};

/** Insert one row per actually-changed price field. */
export async function logPriceChanges(input: LogPriceChangesInput): Promise<void> {
  const filtered = input.changes.filter(
    (c) => Number(c.oldValue ?? 0) !== Number(c.newValue ?? 0)
  );
  if (filtered.length === 0) return;

  const rows = filtered.map((c) => ({
    item_id: input.itemId,
    field_name: c.field,
    old_value: c.oldValue,
    new_value: c.newValue,
    source: input.source,
    reference_id: input.referenceId ?? null,
    supplier_name: input.supplierName ?? null,
    notes: input.notes ?? null,
    changed_by: input.changedBy ?? null,
  }));

  await supabase.from("crm_price_history" as any).insert(rows);
}
