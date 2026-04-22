import { CreditCard } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-data";

export default function EmiBanner() {
  const { data: settings } = useSiteSettings();
  const text = settings?.emi_banner_text || "Easy EMI Available  |  0% Interest  |  All Major Banks";

  return (
    <section className="vibrant-gradient py-4 px-4 overflow-hidden">
      <div className="container mx-auto flex items-center justify-center gap-3 text-primary-foreground">
        <CreditCard className="h-5 w-5 shrink-0" />
        <p className="font-heading font-bold text-sm md:text-base text-center tracking-wide">
          {text}
        </p>
      </div>
    </section>
  );
}
