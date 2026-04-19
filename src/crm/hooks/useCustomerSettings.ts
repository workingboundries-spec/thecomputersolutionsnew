import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CustomerSettingType = "rank" | "source_mode" | "occupation" | "campaign_type";

export interface CustomerSettingRow {
  id: string;
  setting_type: string;
  value: string;
  colour: string | null;
  sort_order: number;
  is_active: boolean;
}

// Module-level cache shared across components.
let CACHE: CustomerSettingRow[] | null = null;
let PENDING: Promise<void> | null = null;
const LISTENERS = new Set<() => void>();

async function loadAll() {
  if (CACHE) return;
  if (PENDING) return PENDING;
  PENDING = (async () => {
    const { data } = await supabase
      .from("admin_customer_settings" as any)
      .select("id, setting_type, value, colour, sort_order, is_active")
      .order("sort_order", { ascending: true });
    CACHE = (data || []) as any;
    PENDING = null;
  })();
  return PENDING;
}

export function invalidateCustomerSettings() {
  CACHE = null;
  LISTENERS.forEach((l) => l());
}

export function useCustomerSettings(type: CustomerSettingType) {
  const [rows, setRows] = useState<CustomerSettingRow[]>(() =>
    CACHE ? CACHE.filter((r) => r.setting_type === type && r.is_active) : []
  );
  useEffect(() => {
    let mounted = true;
    const update = () => {
      if (!mounted || !CACHE) return;
      setRows(CACHE.filter((r) => r.setting_type === type && r.is_active));
    };
    LISTENERS.add(update);
    loadAll().then(update);
    return () => { mounted = false; LISTENERS.delete(update); };
  }, [type]);
  return rows;
}

export function useAllCustomerSettings() {
  const [rows, setRows] = useState<CustomerSettingRow[]>(() => CACHE || []);
  useEffect(() => {
    let mounted = true;
    const update = () => { if (mounted && CACHE) setRows([...CACHE]); };
    LISTENERS.add(update);
    loadAll().then(update);
    return () => { mounted = false; LISTENERS.delete(update); };
  }, []);
  return rows;
}

export function rankColour(value: string | null | undefined, rows: CustomerSettingRow[]): string {
  if (!value) return "#64748b";
  const r = rows.find((x) => x.setting_type === "rank" && x.value === value);
  return r?.colour || "#64748b";
}
