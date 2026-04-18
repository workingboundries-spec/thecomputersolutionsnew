import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { waLink } from "@/crm/lib/format";
import { toast } from "sonner";
import { Plus, X, Send, Mail, Image as ImageIcon, Search } from "lucide-react";

type Recipient = { id: string; name: string; phone: string; whatsapp: string; email: string };

const newRecipient = (): Recipient => ({ id: crypto.randomUUID(), name: "", phone: "", whatsapp: "", email: "" });

export default function SendQuotationPanel({
  quotation, onJpegRequest,
}: {
  quotation: any;
  onJpegRequest: () => Promise<void>;
}) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [via, setVia] = useState({ wa: true, email: false, jpeg: false });
  const [history, setHistory] = useState<any[]>([]);
  const [showCustomers, setShowCustomers] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [sending, setSending] = useState(false);

  // Initial recipient = quotation customer
  useEffect(() => {
    if (quotation && recipients.length === 0) {
      setRecipients([{
        id: crypto.randomUUID(),
        name: quotation.customer_name || "",
        phone: quotation.phone || "",
        whatsapp: quotation.whatsapp || quotation.phone || "",
        email: quotation.email || "",
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotation?.id]);

  // Send history
  useEffect(() => {
    if (!quotation?.id) return;
    supabase.from("quotation_send_log" as any).select("*").eq("quotation_id", quotation.id).order("sent_at", { ascending: false }).limit(20).then(({ data }: any) => setHistory(data || []));
  }, [quotation?.id, sending]);

  const openCustomerPicker = async (rid: string) => {
    if (customers.length === 0) {
      const { data } = await supabase.from("crm_customers").select("id, name, phone, whatsapp, email").order("name");
      setCustomers(data || []);
    }
    setShowCustomers(rid);
  };

  const pickCustomer = (rid: string, c: any) => {
    setRecipients(recipients.map((r) => r.id === rid ? { ...r, name: c.name, phone: c.phone || "", whatsapp: c.whatsapp || c.phone || "", email: c.email || "" } : r));
    setShowCustomers(null);
    setCustSearch("");
  };

  const updateR = (id: string, patch: Partial<Recipient>) => setRecipients(recipients.map((r) => r.id === id ? { ...r, ...patch } : r));
  const removeR = (id: string) => setRecipients(recipients.filter((r) => r.id !== id));

  const logSend = async (r: Recipient, method: string) => {
    await supabase.from("quotation_send_log" as any).insert({
      quotation_id: quotation.id,
      customer_name: r.name, phone: r.phone, whatsapp: r.whatsapp, email: r.email,
      send_method: method, status: "sent",
    });
  };

  const sendAll = async () => {
    if (recipients.length === 0) return toast.error("Add at least one recipient");
    if (!via.wa && !via.email && !via.jpeg) return toast.error("Select at least one send method");
    setSending(true);

    const url = `${window.location.origin}/q/quote/${quotation.id}`;

    // If WhatsApp is selected, ALWAYS download the JPEG first so the user
    // has the image ready to attach (otherwise WA opens with no image and
    // looks blank to the recipient).
    if (via.wa || via.jpeg) {
      try {
        await onJpegRequest();
        toast.success("Quotation image saved to your device");
      } catch (e: any) {
        toast.error("Could not generate image: " + (e?.message || ""));
      }
    }

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      if (!r.name && !r.phone && !r.email) continue;

      if (via.wa && (r.whatsapp || r.phone)) {
        const msg =
          `Dear ${r.name || "Customer"},\n\n` +
          `Please find attached your quotation *${quotation.quote_no}*.\n` +
          `Total: ₹${Number(quotation.total_amount).toLocaleString("en-IN")}\n` +
          (quotation.validity_date ? `Valid till: ${quotation.validity_date}\n` : "") +
          `\nView online: ${url}\n\n` +
          `(Image saved to your device — please attach it in this chat.)`;
        window.open(waLink(r.whatsapp || r.phone, msg), "_blank");
        await logSend(r, "whatsapp");
        if (i < recipients.length - 1) {
          await new Promise((res) => setTimeout(res, 800));
          toast.message(`Opened WhatsApp for ${r.name || r.phone}. Attach image, click Send, then continue.`);
        }
      }

      if (via.email && r.email) {
        const subject = encodeURIComponent(`Quotation ${quotation.quote_no}`);
        const body = encodeURIComponent(`Dear ${r.name || "Customer"},\n\nPlease find your quotation ${quotation.quote_no}.\nTotal: ₹${Number(quotation.total_amount).toLocaleString("en-IN")}\nValid till: ${quotation.validity_date || ""}\n\nView online: ${url}`);
        window.open(`mailto:${r.email}?subject=${subject}&body=${body}`);
        await logSend(r, "email");
      }
    }

    toast.success(`Send actions triggered for ${recipients.length} recipient(s)`);
    setSending(false);
  };

  const lastSent = history[0];
  const filteredCustomers = customers.filter((c) =>
    !custSearch || c.name?.toLowerCase().includes(custSearch.toLowerCase()) || (c.phone || "").includes(custSearch)
  );

  return (
    <div className="border-t bg-slate-50 px-6 py-4 space-y-3 print:hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Send size={14} />SEND THIS QUOTATION</h3>
        {history.length > 0 && (
          <div className="text-xs text-slate-500">Sent to {history.length} {history.length === 1 ? "person" : "people"} · last {new Date(lastSent.sent_at).toLocaleString()}</div>
        )}
      </div>

      <div className="space-y-2">
        {recipients.map((r, idx) => (
          <div key={r.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-slate-200">
            <div className="col-span-12 md:col-span-1 text-xs text-slate-500 font-medium">#{idx + 1}</div>
            <input value={r.name} onChange={(e) => updateR(r.id, { name: e.target.value })} placeholder="Name" className="col-span-6 md:col-span-2 px-2 py-1.5 text-sm border border-slate-300 rounded" />
            <input value={r.phone} onChange={(e) => updateR(r.id, { phone: e.target.value })} placeholder="Phone" className="col-span-6 md:col-span-2 px-2 py-1.5 text-sm border border-slate-300 rounded" />
            <input value={r.whatsapp} onChange={(e) => updateR(r.id, { whatsapp: e.target.value })} placeholder="WhatsApp" className="col-span-6 md:col-span-2 px-2 py-1.5 text-sm border border-slate-300 rounded" />
            <input value={r.email} onChange={(e) => updateR(r.id, { email: e.target.value })} placeholder="Email" className="col-span-6 md:col-span-3 px-2 py-1.5 text-sm border border-slate-300 rounded" />
            <button onClick={() => openCustomerPicker(r.id)} title="Pick from customers" className="col-span-6 md:col-span-1 px-2 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 rounded flex items-center justify-center gap-1"><Search size={11} />Pick</button>
            <button onClick={() => removeR(r.id)} className="col-span-6 md:col-span-1 text-red-500 hover:bg-red-50 rounded p-1.5 flex justify-center"><X size={14} /></button>
          </div>
        ))}
        <button onClick={() => setRecipients([...recipients, newRecipient()])} className="text-xs px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded flex items-center gap-1"><Plus size={12} />Add Person</button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm pt-2 border-t border-slate-200">
        <span className="text-slate-700 font-medium">Send via:</span>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={via.wa} onChange={(e) => setVia({ ...via, wa: e.target.checked })} /><Send size={12} />WhatsApp</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={via.email} onChange={(e) => setVia({ ...via, email: e.target.checked })} /><Mail size={12} />Email</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={via.jpeg} onChange={(e) => setVia({ ...via, jpeg: e.target.checked })} /><ImageIcon size={12} />JPEG Download</label>
        <button disabled={sending} onClick={sendAll} className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded text-sm font-medium flex items-center gap-1.5">
          <Send size={14} />{sending ? "Sending…" : `Send to ${recipients.length}`}
        </button>
      </div>

      {showCustomers && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowCustomers(null)}>
          <div className="bg-white rounded-lg w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <span className="font-semibold text-sm">Pick a Customer</span>
              <button onClick={() => setShowCustomers(null)}><X size={16} /></button>
            </div>
            <div className="p-3 border-b">
              <input value={custSearch} onChange={(e) => setCustSearch(e.target.value)} placeholder="Search name or phone…" className="w-full px-3 py-2 text-sm border border-slate-300 rounded" />
            </div>
            <div className="overflow-y-auto divide-y">
              {filteredCustomers.length === 0 ? <div className="p-4 text-center text-sm text-slate-500">No matches</div> :
                filteredCustomers.slice(0, 50).map((c) => (
                  <button key={c.id} onClick={() => pickCustomer(showCustomers, c)} className="w-full text-left px-4 py-2.5 hover:bg-slate-50">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.phone} {c.email && `· ${c.email}`}</div>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
