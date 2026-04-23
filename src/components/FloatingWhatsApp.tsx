import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-data";
import { useWhatsappTemplates, getTemplateMessage } from "@/hooks/use-whatsapp-templates";

export default function FloatingWhatsApp() {
  const { data: settings } = useSiteSettings();
  const { data: templates } = useWhatsappTemplates();
  const wa = settings?.shop_whatsapp || settings?.whatsapp || "919876543210";
  const msg = getTemplateMessage(templates, "floating_button", {}, settings?.whatsapp_default_msg || "Hi! I am interested in your products.");

  return (
    <a
      href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-[0_8px_24px_rgba(34,197,94,0.5)] hover:scale-110 transition-all"
      style={{ animation: "glow-pulse 2.5s ease-in-out infinite" }}
    >
      <MessageCircle className="h-7 w-7 text-white" fill="currentColor" />
      <span className="absolute inset-0 rounded-full bg-green-400/40 animate-ping" />
    </a>
  );
}
