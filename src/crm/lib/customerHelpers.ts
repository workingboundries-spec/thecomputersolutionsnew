// Helpers for customer events, types, and date math.

export function customerType(totalPurchases: number | null | undefined): "New" | "Repeat" {
  return (totalPurchases || 0) >= 2 ? "Repeat" : "New";
}

/** Days from today until next occurrence of mm-dd. Returns null if invalid date. */
export function daysUntilNextOccurrence(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function yearsCompleted(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - d.getFullYear();
  // If anniversary hasn't happened yet this year, subtract one
  const had = today.getMonth() > d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() >= d.getDate());
  if (!had) years -= 1;
  return Math.max(0, years);
}

export function ageFromDob(dobStr: string | null | undefined): number | null {
  return yearsCompleted(dobStr);
}

export function renderTemplate(tpl: string, vars: Record<string, string | number | null | undefined>): string {
  return (tpl || "").replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? `{{${k}}}` : String(v);
  });
}

/** Build wa.me link with pre-filled text. */
export function whatsappLink(phone: string, text: string): string {
  const cleaned = (phone || "").replace(/[^0-9]/g, "");
  // If 10 digits, assume IN and prefix 91
  const num = cleaned.length === 10 ? `91${cleaned}` : cleaned;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

/** Truncate a message to a hint (default 80 chars). */
export function messageHint(message: string, max = 80): string {
  const t = (message || "").replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1) + "…";
}
