import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PublicSalesForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    whatsapp: "",
    address: "",
    customer_dob: "",
    item_name: "",
    sale_price: "",
    payment_mode: "cash",
    notes: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.phone.trim() || !form.item_name.trim()) {
      toast.error("Please fill name, phone and item.");
      return;
    }
    setSubmitting(true);
    const price = Number(form.sale_price) || 0;
    const payload: any = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim() || form.phone.trim(),
      address: form.address.trim() || null,
      customer_dob: form.customer_dob || null,
      item_name: form.item_name.trim(),
      qty: 1,
      sale_price: price,
      discount: 0,
      total_amount: price,
      payment_mode: form.payment_mode,
      payment_status: "pending_review",
      invoice_no: `CUST-${Date.now()}`,
      warranty_months: 12,
      notes: form.notes.trim() || null,
    };
    const { error } = await supabase.from("crm_sales").insert(payload);
    setSubmitting(false);
    if (error) {
      console.error(error);
      toast.error("Could not submit. Please try again.");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 text-green-400" size={56} />
          <h1 className="text-2xl font-bold text-white mb-2">Thank you!</h1>
          <p className="text-slate-400">Your details have been submitted. Our team will review and confirm your purchase shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Purchase Details</h1>
          <p className="text-sm text-slate-400 mt-1">Please fill in your details — we'll confirm your purchase shortly.</p>
        </div>

        <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <Field label="Full Name *">
            <input required value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone *">
              <input required value={form.phone} onChange={(e) => update("phone", e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
            </Field>
            <Field label="WhatsApp">
              <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="Same as phone"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
            </Field>
          </div>

          <Field label="Address">
            <textarea value={form.address} onChange={(e) => update("address", e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
          </Field>

          <Field label="Date of Birth (optional)">
            <input type="date" value={form.customer_dob} onChange={(e) => update("customer_dob", e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
          </Field>

          <div className="border-t border-slate-800 pt-4">
            <Field label="Item Purchased *">
              <input required value={form.item_name} onChange={(e) => update("item_name", e.target.value)}
                placeholder="e.g. HP Laptop 15s, CCTV Camera 4ch kit"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Sale Price (₹)">
              <input type="number" min="0" value={form.sale_price} onChange={(e) => update("sale_price", e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
            </Field>
            <Field label="Payment Mode">
              <select value={form.payment_mode} onChange={(e) => update("payment_mode", e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="emi">EMI</option>
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
          </Field>

          <button type="submit" disabled={submitting}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded font-medium flex items-center justify-center gap-2">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Submitting..." : "Submit Details"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}
