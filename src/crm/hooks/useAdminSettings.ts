import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache so multiple components share one fetch
let CACHE: Record<string, { value: string; type: string }> | null = null;
let PENDING: Promise<void> | null = null;
const LISTENERS = new Set<() => void>();

async function loadAll() {
  if (CACHE) return;
  if (PENDING) return PENDING;
  PENDING = (async () => {
    const { data } = await supabase.from("crm_admin_settings").select("setting_key, setting_value, setting_type");
    CACHE = {};
    (data || []).forEach((r: any) => {
      CACHE![r.setting_key] = { value: r.setting_value ?? "", type: r.setting_type ?? "text" };
    });
    PENDING = null;
  })();
  return PENDING;
}

export function invalidateAdminSettings() {
  CACHE = null;
  LISTENERS.forEach((l) => l());
}

function parse(value: string, type: string): any {
  if (type === "json") {
    try { return JSON.parse(value); } catch { return []; }
  }
  if (type === "number") return Number(value || 0);
  if (type === "boolean") return value === "true";
  return value;
}

export function useAdminSetting<T = any>(key: string, fallback?: T): T {
  const [val, setVal] = useState<T>(() => {
    if (CACHE && CACHE[key]) return parse(CACHE[key].value, CACHE[key].type);
    return fallback as T;
  });

  useEffect(() => {
    let mounted = true;
    const update = () => {
      if (!mounted) return;
      if (CACHE && CACHE[key]) setVal(parse(CACHE[key].value, CACHE[key].type));
      else if (fallback !== undefined) setVal(fallback);
    };
    LISTENERS.add(update);
    loadAll().then(update);
    return () => { mounted = false; LISTENERS.delete(update); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return val;
}

export function useAdminSettings(keys: string[]) {
  const [map, setMap] = useState<Record<string, any>>({});
  useEffect(() => {
    let mounted = true;
    const update = () => {
      if (!mounted || !CACHE) return;
      const m: Record<string, any> = {};
      keys.forEach((k) => { if (CACHE![k]) m[k] = parse(CACHE![k].value, CACHE![k].type); });
      setMap(m);
    };
    LISTENERS.add(update);
    loadAll().then(update);
    return () => { mounted = false; LISTENERS.delete(update); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(",")]);
  return map;
}

export async function getAdminSetting(key: string): Promise<string> {
  await loadAll();
  return CACHE?.[key]?.value ?? "";
}
