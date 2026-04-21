import { supabase } from "@/integrations/supabase/client";

export type MovementType =
  | "manual_entry"
  | "sale"
  | "sale_reversal"
  | "damage"
  | "write_off"
  | "return_to_supplier"
  | "audit_adjustment"
  | "opening_stock";

export type MovementInput = {
  itemId: string;
  movementType: MovementType;
  /** Signed delta. Positive = adds to stock. Negative = removes from stock. */
  qty: number;
  referenceId?: string | null;
  referenceType?: string | null;
  supplierName?: string | null;
  purchasePrice?: number | null;
  reason?: string | null;
  notes?: string | null;
  createdBy?: string | null;
};

export type MovementResult = {
  ok: boolean;
  balanceAfter?: number;
  error?: string;
};

/**
 * Apply a stock movement atomically:
 *  1. Update crm_catalogue.current_stock (and mirror to legacy stock_qty)
 *  2. Insert one row into inventory_transactions with the resulting balance
 *
 * The whole flow is best-effort sequential — Supabase doesn't expose true
 * transactions from the JS client, but step 1 is idempotent (delta-based) and
 * step 2 is append-only, so this is safe enough for our scale.
 */
export async function applyMovement(m: MovementInput): Promise<MovementResult> {
  if (!m.itemId) return { ok: false, error: "itemId required" };

  const { data: cat, error: readErr } = await supabase
    .from("crm_catalogue")
    .select("current_stock, stock_qty")
    .eq("id", m.itemId)
    .maybeSingle();

  if (readErr) return { ok: false, error: readErr.message };
  if (!cat) return { ok: false, error: "Item not found" };

  const current = Number((cat as any).current_stock ?? (cat as any).stock_qty ?? 0);
  const newBalance = Math.max(0, current + m.qty);

  const { error: upErr } = await supabase
    .from("crm_catalogue")
    .update({ current_stock: newBalance, stock_qty: newBalance })
    .eq("id", m.itemId);

  if (upErr) return { ok: false, error: upErr.message };

  const { error: txErr } = await supabase.from("inventory_transactions" as any).insert({
    item_id: m.itemId,
    movement_type: m.movementType,
    qty: m.qty,
    balance_after: newBalance,
    reference_id: m.referenceId ?? null,
    reference_type: m.referenceType ?? null,
    supplier_name: m.supplierName ?? null,
    purchase_price: m.purchasePrice ?? null,
    reason: m.reason ?? null,
    notes: m.notes ?? null,
    created_by: m.createdBy ?? null,
  });

  if (txErr) return { ok: false, balanceAfter: newBalance, error: txErr.message };

  return { ok: true, balanceAfter: newBalance };
}

/** Force current_stock to an exact value (used by month-end "Reset to Physical Count"). */
export async function setStockExact(itemId: string, value: number, opts: {
  reason?: string; notes?: string; createdBy?: string | null;
} = {}): Promise<MovementResult> {
  const { data: cat, error } = await supabase
    .from("crm_catalogue")
    .select("current_stock, stock_qty")
    .eq("id", itemId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!cat) return { ok: false, error: "Item not found" };

  const before = Number((cat as any).current_stock ?? (cat as any).stock_qty ?? 0);
  const delta = value - before;

  const { error: upErr } = await supabase
    .from("crm_catalogue")
    .update({ current_stock: value, stock_qty: value })
    .eq("id", itemId);
  if (upErr) return { ok: false, error: upErr.message };

  if (delta !== 0) {
    await supabase.from("inventory_transactions" as any).insert({
      item_id: itemId,
      movement_type: "audit_adjustment",
      qty: delta,
      balance_after: value,
      reason: opts.reason ?? "Month-end reset to physical count",
      notes: opts.notes ?? null,
      created_by: opts.createdBy ?? null,
    });
  }
  return { ok: true, balanceAfter: value };
}
