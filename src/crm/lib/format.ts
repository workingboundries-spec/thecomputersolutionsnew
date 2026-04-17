import { format, parseISO } from "date-fns";

export function formatINR(value: number | string | null | undefined): string {
  const n = Number(value || 0);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    const date = typeof d === "string" ? parseISO(d) : d;
    return format(date, "dd MMM yyyy");
  } catch {
    return String(d);
  }
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addMonths(dateISO: string, months: number): string {
  const d = new Date(dateISO);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function waLink(phone: string, message: string) {
  const cleaned = (phone || "").replace(/\D/g, "");
  const withCC = cleaned.startsWith("91") || cleaned.length > 10 ? cleaned : "91" + cleaned;
  return `https://wa.me/${withCC}?text=${encodeURIComponent(message)}`;
}
