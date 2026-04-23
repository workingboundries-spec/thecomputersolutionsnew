import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Menu, X, GripHorizontal } from "lucide-react";
import logo from "@/assets/logo-cs.png";
import { useNavItems, useSiteSettings } from "@/hooks/use-site-data";

const LOGO_SIZE_KEY = "navbar-logo-size";
const MIN_LOGO = 40;
const MAX_LOGO = 240;
const HEADER_HEIGHT = 88; // fixed header height — logo can overflow without resizing it

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
  const shopName = settings?.shop_name || "";
  const shopLogo = settings?.shop_logo_url;

  const adminDefault = parseInt(settings?.navbar_logo_size || "80", 10);

  const [logoSize, setLogoSize] = useState<number>(() => {
    if (typeof window === "undefined") return 80;
    const saved = window.localStorage.getItem(LOGO_SIZE_KEY);
    const n = saved ? parseInt(saved, 10) : NaN;
    return Number.isFinite(n) ? Math.min(MAX_LOGO, Math.max(MIN_LOGO, n)) : 80;
  });
  const userTouchedRef = useRef(false);
  const draggingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number; size: number } | null>(null);

  // Sync with admin-set default if user hasn't manually adjusted
  useEffect(() => {
    if (!userTouchedRef.current && Number.isFinite(adminDefault)) {
      setLogoSize(Math.min(MAX_LOGO, Math.max(MIN_LOGO, adminDefault)));
    }
  }, [adminDefault]);

  useEffect(() => {
    window.localStorage.setItem(LOGO_SIZE_KEY, String(logoSize));
  }, [logoSize]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current || !startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    const delta = Math.max(dx, dy);
    const next = Math.min(MAX_LOGO, Math.max(MIN_LOGO, startRef.current.size + delta));
    userTouchedRef.current = true;
    setLogoSize(next);
  }, []);

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
    startRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [onPointerMove]);

  const onHandleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    startRef.current = { x: e.clientX, y: e.clientY, size: logoSize };
    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

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
      <div
        className="container mx-auto flex items-center justify-between px-4 relative"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex items-center gap-3">
          {/* Logo box is absolutely sized; allowed to overflow header vertically */}
          <div
            className="relative group flex-shrink-0"
            style={{ height: logoSize, width: logoSize, marginTop: Math.max(0, (logoSize - HEADER_HEIGHT) / 2 + 8) > 0 ? 0 : 0 }}
            title="Drag corner to resize logo"
          >
            <Link to="/" className="block h-full w-full">
              <img
                src={shopLogo || logo}
                alt={shopName}
                draggable={false}
                className="h-full w-full object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.4)] select-none"
              />
            </Link>
            <button
              type="button"
              onPointerDown={onHandleDown}
              onDoubleClick={() => { userTouchedRef.current = false; setLogoSize(adminDefault || 80); }}
              aria-label="Resize logo (double-click to reset)"
              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-sm bg-primary/80 text-primary-foreground opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity flex items-center justify-center cursor-nwse-resize shadow-md"
            >
              <GripHorizontal className="h-3 w-3 rotate-45" />
            </button>
          </div>
          <Link to="/" className="hidden sm:inline-block font-heading font-bold text-lg tracking-tight">
            <span className="text-vibrant">{shopName}</span>
          </Link>
        </div>

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
