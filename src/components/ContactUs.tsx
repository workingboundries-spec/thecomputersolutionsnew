import { useSiteSettings } from "@/hooks/use-site-data";
import { useWhatsappTemplates, getTemplateMessage, fillTemplate } from "@/hooks/use-whatsapp-templates";
import { Phone, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ContactUs() {
  const { data: settings } = useSiteSettings();
  const { data: waTemplates } = useWhatsappTemplates();
  const contactPhone = settings?.shop_phone || settings?.contact_phone || "+91 98765 43210";
  const contactEmail = settings?.shop_email || settings?.contact_email || "info@computersolutions.com";
  const contactAddress = settings?.shop_address || settings?.contact_address || "Shop No. 12, Tech Market, Main Road";
  const whatsapp = settings?.shop_whatsapp || settings?.whatsapp || "919876543210";
  const mapsEmbed = settings?.maps_embed_url || settings?.google_maps_embed || "";

  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Save enquiry to database
      const { error } = await supabase.from("enquiries").insert({
        name: form.name,
        phone: form.phone,
        message: form.message,
      });
      if (error) throw error;

      // Open WhatsApp pre-filled using admin-managed template
      const tpl = waTemplates?.find((x) => x.template_key === "contact_form" && x.is_active);
      const body = tpl?.message_body || "Name: {name}%0APhone: {phone}%0AMessage: {message}";
      const text = fillTemplate(body, { name: form.name, phone: form.phone, message: form.message });
      window.open(`https://wa.me/${whatsapp}?text=${text}`, "_blank");
      toast.success("Enquiry submitted! Redirecting to WhatsApp.");
      setForm({ name: "", phone: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save enquiry. Please try again or message us on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section-padding bg-card/50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Get In Touch</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mt-3">Contact Us</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
          <div className="space-y-6">
            <h3 className="font-heading text-2xl font-semibold mb-2">Let's Connect</h3>
            {[
              { icon: Phone, label: "Phone", value: contactPhone },
              { icon: Mail, label: "Email", value: contactEmail },
              { icon: MapPin, label: "Address", value: contactAddress },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <p className="font-medium">{item.value}</p>
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                const msg = getTemplateMessage(waTemplates, "contact_chat_button", {}, "Hi! I would like to chat about your products and services.");
                window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
              }}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
            </button>

            {mapsEmbed && (
              <div className="rounded-2xl overflow-hidden border border-primary/20 mt-4">
                <iframe
                  src={mapsEmbed}
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Store Location"
                />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
            <h3 className="font-heading text-xl font-semibold">Send Enquiry</h3>
            <input type="text" placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input type="tel" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <textarea placeholder="Your Message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            <button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-heading font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Send className="h-4 w-4" /> {submitting ? "Sending..." : "Send Enquiry"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
