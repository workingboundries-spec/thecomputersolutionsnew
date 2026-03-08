import { getSiteData } from "@/lib/store";
import { Phone, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactUs() {
  const data = getSiteData();
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Name: ${form.name}%0APhone: ${form.phone}%0AMessage: ${form.message}`;
    window.open(`https://wa.me/${data.whatsapp}?text=${text}`, "_blank");
    toast.success("Redirecting to WhatsApp!");
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <section id="contact" className="section-padding bg-card/50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Get In Touch</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mt-3">Contact Us</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Info */}
          <div className="space-y-6">
            <h3 className="font-heading text-2xl font-semibold mb-6">Let's Connect</h3>
            {[
              { icon: Phone, label: "Phone", value: data.contactPhone },
              { icon: Mail, label: "Email", value: data.contactEmail },
              { icon: MapPin, label: "Address", value: data.contactAddress },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <p className="font-medium">{item.value}</p>
                </div>
              </div>
            ))}

            <button
              onClick={() => window.open(`https://wa.me/${data.whatsapp}`, "_blank")}
              className="flex items-center gap-2 bg-green-600 text-foreground px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors mt-4"
            >
              <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
            <h3 className="font-heading text-xl font-semibold">Send Enquiry</h3>
            <input
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <textarea
              placeholder="Your Message"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              className="w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-heading font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" /> Send via WhatsApp
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
