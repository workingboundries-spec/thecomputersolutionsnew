import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo-cs.png";
import { useNavItems, useSiteSettings } from "@/hooks/use-site-data";

const fallbackLinks = [
  { id: "f1", label: "Home", href: "#home" },
  { id: "f2", label: "Services", href: "#services" },
  { id: "f3", label: "Products", href: "#products" },
  { id: "f4", label: "Deals", href: "#deals" },
  { id: "f5", label: "Sister Concerns", href: "#sister-concerns" },
  { id: "f6", label: "Gallery", href: "#gallery" },
  { id: "f7", label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: navItems } = useNavItems();
  const { data: settings } = useSiteSettings();
  const links = (navItems && navItems.length > 0) ? navItems : fallbackLinks;
  const shopName = settings?.shop_name || "Computer Solutions";
  const shopLogo = settings?.shop_logo_url;

  const handleNav = (href: string) => {
    setOpen(false);
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = href;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-b border-primary/20">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={shopLogo || logo}
            alt={shopName}
            className="h-12 w-auto object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
          />
          <span className="hidden sm:inline-block font-heading font-bold text-lg tracking-tight">
            <span className="text-vibrant">{shopName}</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => handleNav(l.href)}
              className="text-sm font-heading font-medium text-foreground/80 hover:text-primary transition-colors relative group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </div>

        <button className="lg:hidden text-primary" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-background/95 backdrop-blur-xl border-t border-primary/20 px-4 pb-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => handleNav(l.href)}
              className="block w-full text-left py-3 text-foreground/80 hover:text-primary transition-colors font-heading font-medium border-b border-border/50"
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
