import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Reusable confirmation dialog.
 * - Cancel button gets initial focus (safe default).
 * - Esc closes; Enter does NOT auto-confirm (destructive actions must be deliberate).
 */
export default function ConfirmDialog({
  open, title, description,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  tone = "default", busy = false,
  onConfirm, onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const dangerBtn = "bg-red-600 hover:bg-red-500 focus:ring-red-400";
  const defaultBtn = "bg-blue-600 hover:bg-blue-500 focus:ring-blue-400";

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4"
      onClick={() => { if (!busy) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {tone === "danger" && <AlertTriangle size={20} className="text-red-400" />}
            <h2 id="confirm-title" className="text-base font-bold text-white">{title}</h2>
          </div>
          <button onClick={onCancel} disabled={busy} className="text-slate-400 hover:text-white disabled:opacity-50">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 text-sm text-slate-300 whitespace-pre-line">
          {description}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-sm rounded text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 text-sm rounded text-white font-medium disabled:opacity-50 focus:outline-none focus:ring-2 ${tone === "danger" ? dangerBtn : defaultBtn}`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
