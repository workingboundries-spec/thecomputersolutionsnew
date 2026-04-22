import logo from "@/assets/logo-cs.png";
import { useSiteSettings } from "@/hooks/use-site-data";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  const { data: settings } = useSiteSettings();
  const shopName = settings?.shop_name || "Computer Solutions";
  const shopLogo = settings?.shop_logo_url;
  const phone = settings?.shop_phone;
  const email = settings?.shop_email;
  const address = settings?.shop_address;

  return (
    <footer className="border-t border-primary/20 py-10 px-4 bg-card/50">
      <div className="container mx-auto grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <img src={shopLogo || logo} alt={shopName} className="h-12 w-auto object-contain" />
            <span className="font-heading font-bold text-lg text-vibrant">{shopName}</span>
          </div>
          <p className="text-sm text-muted-foreground">{settings?.shop_tagline || "Your Complete Technology Partner"}</p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <h4 className="font-heading font-semibold text-foreground mb-3">Reach Us</h4>
          {phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {phone}</p>}
          {email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {email}</p>}
          {address && <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-primary mt-0.5" /> <span>{address}</span></p>}
        </div>

        <div className="text-sm text-muted-foreground md:text-right">
          <p>© {new Date().getFullYear()} <span className="text-primary font-semibold">{shopName}</span>.</p>
          <p>All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
