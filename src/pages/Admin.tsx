import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Plus, Trash2, LogOut, Flame, Camera, Menu, Image as ImageIcon, Tag, Award, Instagram, MessageSquare, Inbox, Eye, EyeOff, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface DailyDeal {
  id: string;
  name: string;
  image: string;
  original_price: string;
  deal_price: string;
  valid_until: string;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  is_new: boolean;
  specs: string | null;
  display_order: number;
}

interface CCTVProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
  category: string;
  display_order: number;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  thumbnail_url: string | null;
  display_order: number;
}

interface YouTubeVideo {
  id: string;
  embed_url: string;
  title: string;
  display_order: number;
}

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
}

interface NavItem { id: string; label: string; href: string; sort_order: number; is_visible: boolean; }
interface BannerSlide { id: string; image_url: string | null; heading: string | null; subheading: string | null; button_text: string | null; button_link: string | null; sort_order: number; is_active: boolean; }
interface SectionHeading { id: string; section_key: string; heading: string; subheading: string | null; is_visible: boolean; }
interface DealerBrand { id: string; brand_name: string; logo_url: string | null; website_url: string | null; brand_type: string | null; sort_order: number; is_active: boolean; }
interface InstagramReel { id: string; title: string | null; reel_url: string | null; thumbnail_url: string; caption: string | null; sort_order: number; is_active: boolean; }
interface TestimonialVideo { id: string; customer_name: string; location: string | null; product_purchased: string | null; video_url: string | null; thumbnail_url: string | null; review_text: string | null; rating: number; sort_order: number; is_active: boolean; }
interface Enquiry { id: string; name: string; phone: string; message: string | null; status: string; created_at: string; }
interface SisterConcern { id: string; name: string; tagline: string | null; description: string | null; thumbnail_url: string | null; website_url: string | null; sort_order: number; is_active: boolean; }
interface IntroSectionRow { id: string; heading: string; subheading: string | null; body_text: string | null; youtube_url: string | null; is_visible: boolean; }

type Settings = Record<string, string>;

export default function Admin() {
  const [activeTab, setActiveTab] = useState("banner");
  const [settings, setSettings] = useState<Settings>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [deals, setDeals] = useState<DailyDeal[]>([]);
  const [cctvProducts, setCctvProducts] = useState<CCTVProduct[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);
  const [sectionHeadings, setSectionHeadings] = useState<SectionHeading[]>([]);
  const [dealerBrands, setDealerBrands] = useState<DealerBrand[]>([]);
  const [instagramReels, setInstagramReels] = useState<InstagramReel[]>([]);
  const [testimonialVideos, setTestimonialVideos] = useState<TestimonialVideo[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [sisterConcerns, setSisterConcerns] = useState<SisterConcern[]>([]);
  const [introSection, setIntroSection] = useState<IntroSectionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  useEffect(() => {
    document.title = "Admin Panel — ComputerSolutions";
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [s, p, sv, v, g, d, cc, ni, bs, sh, db, ir, tv, eq, sc, intro] = await Promise.all([
      supabase.from("site_settings").select("*"),
      supabase.from("products").select("*").order("display_order"),
      supabase.from("services").select("*").order("display_order"),
      supabase.from("youtube_videos").select("*").order("display_order"),
      supabase.from("gallery_images").select("*").order("display_order"),
      supabase.from("daily_deals").select("*").order("display_order"),
      supabase.from("cctv_products").select("*").order("display_order"),
      supabase.from("nav_items").select("*").order("sort_order"),
      supabase.from("banner_slides").select("*").order("sort_order"),
      supabase.from("section_headings").select("*").order("section_key"),
      supabase.from("dealer_brands").select("*").order("sort_order"),
      supabase.from("instagram_reels").select("*").order("sort_order"),
      supabase.from("testimonial_videos").select("*").order("sort_order"),
      supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("sister_concerns").select("*").order("sort_order"),
      (supabase as any).from("intro_section").select("*").limit(1).maybeSingle(),
    ]);
    const settingsMap: Settings = {};
    s.data?.forEach((r) => { settingsMap[r.key] = r.value; });
    setSettings(settingsMap);
    setProducts((p.data as Product[]) || []);
    setServices((sv.data as Service[]) || []);
    setVideos((v.data as YouTubeVideo[]) || []);
    setGallery((g.data as GalleryImage[]) || []);
    setDeals((d.data as DailyDeal[]) || []);
    setCctvProducts((cc.data as CCTVProduct[]) || []);
    setNavItems((ni.data as NavItem[]) || []);
    setBannerSlides((bs.data as BannerSlide[]) || []);
    setSectionHeadings((sh.data as SectionHeading[]) || []);
    setDealerBrands((db.data as DealerBrand[]) || []);
    setInstagramReels((ir.data as InstagramReel[]) || []);
    setTestimonialVideos((tv.data as TestimonialVideo[]) || []);
    setEnquiries((eq.data as Enquiry[]) || []);
    setSisterConcerns(((sc as any).data as SisterConcern[]) || []);
    setIntroSection(((intro as any).data as IntroSectionRow) || null);
    setLoading(false);
  };

  const saveSettings = async () => {
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    }
  };

  const saveCRUD = async (
    table: "products" | "services" | "youtube_videos" | "gallery_images" | "daily_deals" | "cctv_products" | "nav_items" | "banner_slides" | "section_headings" | "dealer_brands" | "instagram_reels" | "testimonial_videos",
    items: any[],
  ) => {
    const existing = await supabase.from(table).select("id");
    const existingIds = new Set(existing.data?.map((r: any) => r.id) || []);
    const currentIds = new Set(items.map((i) => i.id));
    for (const id of existingIds) {
      if (!currentIds.has(id)) await supabase.from(table).delete().eq("id", id);
    }
    for (const item of items) {
      await supabase.from(table).upsert(item);
    }
  };

  const saveAll = async () => {
    try {
      // Sister concerns: upsert/delete
      const existingSC = await (supabase as any).from("sister_concerns").select("id");
      const existingSCIds = new Set<string>(((existingSC.data || []) as any[]).map((r) => r.id as string));
      const currentSCIds = new Set<string>(sisterConcerns.map((i) => i.id));
      for (const id of Array.from(existingSCIds)) {
        if (!currentSCIds.has(id)) await (supabase as any).from("sister_concerns").delete().eq("id", id);
      }
      for (const item of sisterConcerns) {
        await (supabase as any).from("sister_concerns").upsert(item);
      }
      // Intro section: single row upsert
      if (introSection) {
        await (supabase as any).from("intro_section").upsert(introSection);
      }

      await Promise.all([
        saveSettings(),
        saveCRUD("products", products),
        saveCRUD("services", services),
        saveCRUD("youtube_videos", videos),
        saveCRUD("gallery_images", gallery),
        saveCRUD("daily_deals", deals),
        saveCRUD("cctv_products", cctvProducts),
        saveCRUD("nav_items", navItems),
        saveCRUD("banner_slides", bannerSlides),
        saveCRUD("section_headings", sectionHeadings),
        saveCRUD("dealer_brands", dealerBrands),
        saveCRUD("instagram_reels", instagramReels),
        saveCRUD("testimonial_videos", testimonialVideos),
      ]);
      queryClient.invalidateQueries();
      toast.success("All changes saved to database!");
    } catch (err) {
      toast.error("Error saving changes. Please try again.");
    }
  };

  const updateEnquiryStatus = async (id: string, status: string) => {
    await supabase.from("enquiries").update({ status }).eq("id", id);
    setEnquiries(enquiries.map((e) => (e.id === id ? { ...e, status } : e)));
    toast.success("Enquiry status updated");
  };

  const deleteEnquiry = async (id: string) => {
    await supabase.from("enquiries").delete().eq("id", id);
    setEnquiries(enquiries.filter((e) => e.id !== id));
    toast.success("Enquiry deleted");
  };

  const updateSetting = (key: string, value: string) => setSettings({ ...settings, [key]: value });

  const productCategories = (settings.product_categories || "Business,Gaming,Student,Budget,Premium").split(",").map(c => c.trim()).filter(Boolean);

  const tabs = [
    { id: "banner", label: "Banner" },
    { id: "slides", label: "🎞 Slides" },
    { id: "nav", label: "Menu" },
    { id: "headings", label: "Headings" },
    { id: "brands", label: "Brands" },
    { id: "deals", label: "🔥 Deals" },
    { id: "products", label: "Products" },
    { id: "cctv", label: "📹 CCTV" },
    { id: "services", label: "Services" },
    { id: "videos", label: "YouTube" },
    { id: "reels", label: "📸 Reels" },
    { id: "testimonials", label: "Testimonials" },
    { id: "gallery", label: "Gallery" },
    { id: "enquiries", label: "📥 Enquiries" },
    { id: "contact", label: "Contact" },
    { id: "intro", label: "🎬 Intro Video" },
    { id: "family", label: "👥 Our Family" },
  ];

  const inputClass = "w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <h1 className="font-heading text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveAll} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
              <Save className="h-4 w-4" /> Save All
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-surface-hover"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Banner Tab */}
        {activeTab === "banner" && (
          <div className="max-w-2xl space-y-5">
            <h2 className="font-heading text-2xl font-semibold mb-4">Logo & Shop Identity</h2>
            <div className="glass rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Shop Name</label>
                <input className={inputClass} value={settings.shop_name || ""} onChange={(e) => updateSetting("shop_name", e.target.value)} placeholder="Computer Solutions" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Logo Image URL</label>
                <input className={inputClass} value={settings.shop_logo_url || ""} onChange={(e) => updateSetting("shop_logo_url", e.target.value)} placeholder="https://... or upload below" />
              </div>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
                  <ImageIcon className="h-4 w-4" /> Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const ext = file.name.split(".").pop() || "png";
                    const path = `logo/logo-${Date.now()}.${ext}`;
                    const { error } = await supabase.storage.from("shop-assets").upload(path, file, { upsert: true });
                    if (error) { toast.error(error.message); return; }
                    const { data } = supabase.storage.from("shop-assets").getPublicUrl(path);
                    updateSetting("shop_logo_url", data.publicUrl);
                    toast.success("Logo uploaded — click Save All to apply");
                  }} />
                </label>
                {settings.shop_logo_url && (
                  <div className="h-16 w-16 rounded-lg bg-secondary p-1 flex items-center justify-center overflow-hidden">
                    <img src={settings.shop_logo_url} alt="logo preview" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Default Logo Size on Header (px): <span className="text-primary font-semibold">{settings.navbar_logo_size || "80"}</span></label>
                <input
                  type="range"
                  min={40}
                  max={200}
                  step={4}
                  value={parseInt(settings.navbar_logo_size || "80", 10)}
                  onChange={(e) => updateSetting("navbar_logo_size", e.target.value)}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Logo can grow larger than the header bar without changing header height. Visitors can also drag the corner handle to adjust locally.</p>
              </div>
            </div>

            <h2 className="font-heading text-2xl font-semibold mb-4 pt-4 border-t border-border">Banner Settings</h2>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Banner Title</label>
              <input className={inputClass} value={settings.banner_title || ""} onChange={(e) => updateSetting("banner_title", e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Banner Subtitle</label>
              <input className={inputClass} value={settings.banner_subtitle || ""} onChange={(e) => updateSetting("banner_subtitle", e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Banner Image URL</label>
              <input className={inputClass} value={settings.banner_image || ""} onChange={(e) => updateSetting("banner_image", e.target.value)} placeholder="https://..." />
            </div>
            <h3 className="font-heading text-xl font-semibold pt-4 border-t border-border">Brands Section</h3>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Brands Tagline</label>
              <input className={inputClass} value={settings.brands_tagline || ""} onChange={(e) => updateSetting("brands_tagline", e.target.value)} placeholder="Authorized Dealer for All Major Brands" />
            </div>
            <h3 className="font-heading text-xl font-semibold pt-4 border-t border-border">Product Categories</h3>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Categories (comma-separated)</label>
              <input className={inputClass} value={settings.product_categories || ""} onChange={(e) => updateSetting("product_categories", e.target.value)} placeholder="Business,Gaming,Student,Budget,Premium" />
              <p className="text-xs text-muted-foreground mt-1">These categories appear as filter buttons in Featured Laptops section</p>
            </div>
          </div>
        )}

        {/* Daily Deals Tab */}
        {activeTab === "deals" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Flame className="h-6 w-6 text-destructive" /> Daily Deals</h2>
              <button onClick={() => setDeals([...deals, { id: crypto.randomUUID(), name: "New Deal", image: "", original_price: "₹0", deal_price: "₹0", valid_until: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0], display_order: deals.length + 1 }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Deal
              </button>
            </div>
            {deals.map((d) => (
              <div key={d.id} className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold">{d.name}</span>
                  <button onClick={() => setDeals(deals.filter((x) => x.id !== d.id))} className="text-destructive hover:opacity-80"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs text-muted-foreground">Product Name</label><input className={inputClass} value={d.name} onChange={(e) => setDeals(deals.map((x) => x.id === d.id ? { ...x, name: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Image URL</label><input className={inputClass} value={d.image} onChange={(e) => setDeals(deals.map((x) => x.id === d.id ? { ...x, image: e.target.value } : x))} placeholder="https://..." /></div>
                  <div><label className="text-xs text-muted-foreground">Original Price</label><input className={inputClass} value={d.original_price} onChange={(e) => setDeals(deals.map((x) => x.id === d.id ? { ...x, original_price: e.target.value } : x))} placeholder="₹50,000" /></div>
                  <div><label className="text-xs text-muted-foreground">Deal Price</label><input className={inputClass} value={d.deal_price} onChange={(e) => setDeals(deals.map((x) => x.id === d.id ? { ...x, deal_price: e.target.value } : x))} placeholder="₹39,999" /></div>
                  <div><label className="text-xs text-muted-foreground">Valid Until</label><input type="date" className={inputClass} value={d.valid_until} onChange={(e) => setDeals(deals.map((x) => x.id === d.id ? { ...x, valid_until: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Display Order</label><input type="number" className={inputClass} value={d.display_order} onChange={(e) => setDeals(deals.map((x) => x.id === d.id ? { ...x, display_order: parseInt(e.target.value) || 0 } : x))} /></div>
                </div>
              </div>
            ))}
            {deals.length === 0 && <p className="text-muted-foreground text-center py-8">No deals yet. Click "Add Deal" to create one.</p>}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold">Products</h2>
              <button onClick={() => setProducts([...products, { id: crypto.randomUUID(), name: "New Laptop", price: "₹0", image: "", category: productCategories[0] || "Business", is_new: true, specs: "", display_order: products.length + 1 }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Product
              </button>
            </div>
            {products.map((p) => (
              <div key={p.id} className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold">{p.name}</span>
                  <button onClick={() => setProducts(products.filter((x) => x.id !== p.id))} className="text-destructive hover:opacity-80"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs text-muted-foreground">Name</label><input className={inputClass} value={p.name} onChange={(e) => setProducts(products.map((x) => x.id === p.id ? { ...x, name: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Price</label><input className={inputClass} value={p.price} onChange={(e) => setProducts(products.map((x) => x.id === p.id ? { ...x, price: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Category</label>
                    <select className={inputClass} value={p.category} onChange={(e) => setProducts(products.map((x) => x.id === p.id ? { ...x, category: e.target.value } : x))}>
                      {productCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-muted-foreground">Image URL</label><input className={inputClass} value={p.image} onChange={(e) => setProducts(products.map((x) => x.id === p.id ? { ...x, image: e.target.value } : x))} placeholder="https://..." /></div>
                  <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Specs</label><input className={inputClass} value={p.specs || ""} onChange={(e) => setProducts(products.map((x) => x.id === p.id ? { ...x, specs: e.target.value } : x))} /></div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={p.is_new} onChange={(e) => setProducts(products.map((x) => x.id === p.id ? { ...x, is_new: e.target.checked } : x))} className="accent-primary" id={`new-${p.id}`} />
                    <label htmlFor={`new-${p.id}`} className="text-sm">Mark as New Arrival</label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CCTV Tab */}
        {activeTab === "cctv" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Camera className="h-6 w-6 text-primary" /> CCTV Products</h2>
              <button onClick={() => setCctvProducts([...cctvProducts, { id: crypto.randomUUID(), name: "New Camera", price: "₹0", image: "", description: "", category: "Dome", display_order: cctvProducts.length + 1 }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add CCTV Product
              </button>
            </div>
            {cctvProducts.map((c) => (
              <div key={c.id} className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold">{c.name}</span>
                  <button onClick={() => setCctvProducts(cctvProducts.filter((x) => x.id !== c.id))} className="text-destructive hover:opacity-80"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs text-muted-foreground">Name</label><input className={inputClass} value={c.name} onChange={(e) => setCctvProducts(cctvProducts.map((x) => x.id === c.id ? { ...x, name: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Price</label><input className={inputClass} value={c.price} onChange={(e) => setCctvProducts(cctvProducts.map((x) => x.id === c.id ? { ...x, price: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Category</label>
                    <select className={inputClass} value={c.category} onChange={(e) => setCctvProducts(cctvProducts.map((x) => x.id === c.id ? { ...x, category: e.target.value } : x))}>
                      {["Dome", "Bullet", "PTZ", "DVR", "NVR", "IP Camera", "Wireless"].map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-muted-foreground">Image URL</label><input className={inputClass} value={c.image} onChange={(e) => setCctvProducts(cctvProducts.map((x) => x.id === c.id ? { ...x, image: e.target.value } : x))} placeholder="https://..." /></div>
                  <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Description</label><input className={inputClass} value={c.description} onChange={(e) => setCctvProducts(cctvProducts.map((x) => x.id === c.id ? { ...x, description: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Display Order</label><input type="number" className={inputClass} value={c.display_order} onChange={(e) => setCctvProducts(cctvProducts.map((x) => x.id === c.id ? { ...x, display_order: parseInt(e.target.value) || 0 } : x))} /></div>
                </div>
              </div>
            ))}
            {cctvProducts.length === 0 && <p className="text-muted-foreground text-center py-8">No CCTV products yet. Click "Add CCTV Product" to create one.</p>}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold">Services</h2>
              <button onClick={() => setServices([...services, { id: crypto.randomUUID(), title: "New Service", description: "", icon_name: "Monitor", thumbnail_url: "", display_order: services.length + 1 }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Service
              </button>
            </div>
            {services.map((s) => (
              <div key={s.id} className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold">{s.title}</span>
                  <button onClick={() => setServices(services.filter((x) => x.id !== s.id))} className="text-destructive hover:opacity-80"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs text-muted-foreground">Title</label><input className={inputClass} value={s.title} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, title: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Icon Name</label>
                    <select className={inputClass} value={s.icon_name} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, icon_name: e.target.value } : x))}>
                      {["Laptop", "Wrench", "RefreshCw", "ShieldCheck", "Truck", "Headphones", "Monitor", "Cpu", "HardDrive"].map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Description</label><textarea className={inputClass + " resize-none"} rows={2} value={s.description} onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, description: e.target.value } : x))} /></div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">Thumbnail Image — paste URL or upload</label>
                    <div className="flex flex-col md:flex-row gap-3 items-start">
                      <div className="flex-1 w-full space-y-2">
                        <input className={inputClass} value={s.thumbnail_url || ""} placeholder="https://..." onChange={(e) => setServices(services.map((x) => x.id === s.id ? { ...x, thumbnail_url: e.target.value } : x))} />
                        <label className="inline-flex items-center gap-2 text-xs cursor-pointer bg-secondary text-secondary-foreground px-3 py-2 rounded-lg hover:opacity-90">
                          <ImageIcon className="h-4 w-4" /> Upload image
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            const ext = file.name.split(".").pop() || "jpg";
                            const path = `services/${s.id}-${Date.now()}.${ext}`;
                            const t = toast.loading("Uploading...");
                            const { error } = await supabase.storage.from("shop-assets").upload(path, file, { upsert: true, contentType: file.type });
                            if (error) { toast.error(error.message, { id: t }); return; }
                            const { data } = supabase.storage.from("shop-assets").getPublicUrl(path);
                            setServices(services.map((x) => x.id === s.id ? { ...x, thumbnail_url: data.publicUrl } : x));
                            toast.success("Uploaded", { id: t });
                          }} />
                        </label>
                      </div>
                      {s.thumbnail_url ? (
                        <img src={s.thumbnail_url} alt="" className="h-24 w-32 object-cover rounded-lg border border-border" />
                      ) : (
                        <div className="h-24 w-32 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">No image</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* YouTube Tab */}
        {activeTab === "videos" && (
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold">YouTube Videos</h2>
              <button onClick={() => setVideos([...videos, { id: crypto.randomUUID(), embed_url: "", title: "", display_order: videos.length + 1 }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Video
              </button>
            </div>
            {videos.map((v) => (
              <div key={v.id} className="glass rounded-2xl p-4 space-y-3">
                <div className="flex gap-3">
                  <input className={inputClass} value={v.title} onChange={(e) => setVideos(videos.map((x) => x.id === v.id ? { ...x, title: e.target.value } : x))} placeholder="Video Title" />
                  <button onClick={() => setVideos(videos.filter((x) => x.id !== v.id))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <input className={inputClass} value={v.embed_url} onChange={(e) => setVideos(videos.map((x) => x.id === v.id ? { ...x, embed_url: e.target.value } : x))} placeholder="https://www.youtube.com/embed/..." />
              </div>
            ))}
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === "gallery" && (
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold">Gallery Images</h2>
              <button onClick={() => setGallery([...gallery, { id: crypto.randomUUID(), image_url: "", alt_text: "", display_order: gallery.length + 1 }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Image
              </button>
            </div>
            {gallery.map((g) => (
              <div key={g.id} className="glass rounded-2xl p-4 space-y-3">
                <div className="flex gap-3">
                  <input className={inputClass} value={g.alt_text} onChange={(e) => setGallery(gallery.map((x) => x.id === g.id ? { ...x, alt_text: e.target.value } : x))} placeholder="Alt Text" />
                  <button onClick={() => setGallery(gallery.filter((x) => x.id !== g.id))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <input className={inputClass} value={g.image_url} onChange={(e) => setGallery(gallery.map((x) => x.id === g.id ? { ...x, image_url: e.target.value } : x))} placeholder="https://image-url.com/..." />
              </div>
            ))}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <div className="max-w-2xl space-y-5">
            <h2 className="font-heading text-2xl font-semibold mb-4">Contact Info</h2>
            <div><label className="text-sm text-muted-foreground mb-1 block">Phone</label><input className={inputClass} value={settings.contact_phone || ""} onChange={(e) => updateSetting("contact_phone", e.target.value)} /></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Email</label><input className={inputClass} value={settings.contact_email || ""} onChange={(e) => updateSetting("contact_email", e.target.value)} /></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Address</label><input className={inputClass} value={settings.contact_address || ""} onChange={(e) => updateSetting("contact_address", e.target.value)} /></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">WhatsApp (with country code, no +)</label><input className={inputClass} value={settings.whatsapp || ""} onChange={(e) => updateSetting("whatsapp", e.target.value)} placeholder="919876543210" /></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Google Maps Embed URL</label><input className={inputClass} value={settings.google_maps_embed || ""} onChange={(e) => updateSetting("google_maps_embed", e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." /></div>
            <h3 className="font-heading text-xl font-semibold pt-4 border-t border-border">Social Media</h3>
            <div><label className="text-sm text-muted-foreground mb-1 block">Instagram URL</label><input className={inputClass} value={settings.instagram_url || ""} onChange={(e) => updateSetting("instagram_url", e.target.value)} placeholder="https://instagram.com/yourpage" /></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Instagram Thumbnail URL</label><input className={inputClass} value={settings.instagram_thumbnail || ""} onChange={(e) => updateSetting("instagram_thumbnail", e.target.value)} placeholder="https://image-url.com/insta-thumb.jpg" /></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Facebook URL</label><input className={inputClass} value={settings.facebook_url || ""} onChange={(e) => updateSetting("facebook_url", e.target.value)} placeholder="https://facebook.com/yourpage" /></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Facebook Thumbnail URL</label><input className={inputClass} value={settings.facebook_thumbnail || ""} onChange={(e) => updateSetting("facebook_thumbnail", e.target.value)} placeholder="https://image-url.com/fb-thumb.jpg" /></div>
          </div>
        )}

        {/* Banner Slides Tab */}
        {activeTab === "slides" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><ImageIcon className="h-6 w-6 text-primary" /> Hero Banner Slides</h2>
              <button onClick={() => setBannerSlides([...bannerSlides, { id: crypto.randomUUID(), image_url: "", heading: "New Slide", subheading: "", button_text: "Shop Now", button_link: "#products", sort_order: bannerSlides.length + 1, is_active: true }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Slide
              </button>
            </div>
            {bannerSlides.map((b) => (
              <div key={b.id} className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold">{b.heading || "Untitled"}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setBannerSlides(bannerSlides.map((x) => x.id === b.id ? { ...x, is_active: !x.is_active } : x))} className={b.is_active ? "text-primary" : "text-muted-foreground"}>
                      {b.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setBannerSlides(bannerSlides.filter((x) => x.id !== b.id))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Image URL</label><input className={inputClass} value={b.image_url || ""} onChange={(e) => setBannerSlides(bannerSlides.map((x) => x.id === b.id ? { ...x, image_url: e.target.value } : x))} placeholder="https://..." /></div>
                  <div><label className="text-xs text-muted-foreground">Heading</label><input className={inputClass} value={b.heading || ""} onChange={(e) => setBannerSlides(bannerSlides.map((x) => x.id === b.id ? { ...x, heading: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Subheading</label><input className={inputClass} value={b.subheading || ""} onChange={(e) => setBannerSlides(bannerSlides.map((x) => x.id === b.id ? { ...x, subheading: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Button Text</label><input className={inputClass} value={b.button_text || ""} onChange={(e) => setBannerSlides(bannerSlides.map((x) => x.id === b.id ? { ...x, button_text: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Button Link</label><input className={inputClass} value={b.button_link || ""} onChange={(e) => setBannerSlides(bannerSlides.map((x) => x.id === b.id ? { ...x, button_link: e.target.value } : x))} placeholder="#products" /></div>
                  <div><label className="text-xs text-muted-foreground">Sort Order</label><input type="number" className={inputClass} value={b.sort_order} onChange={(e) => setBannerSlides(bannerSlides.map((x) => x.id === b.id ? { ...x, sort_order: parseInt(e.target.value) || 0 } : x))} /></div>
                </div>
              </div>
            ))}
            {bannerSlides.length === 0 && <p className="text-muted-foreground text-center py-8">No slides yet. Click "Add Slide".</p>}
          </div>
        )}

        {/* Nav Items Tab */}
        {activeTab === "nav" && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Menu className="h-6 w-6 text-primary" /> Navigation Menu</h2>
              <button onClick={() => setNavItems([...navItems, { id: crypto.randomUUID(), label: "New Link", href: "#", sort_order: navItems.length + 1, is_visible: true }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Link
              </button>
            </div>
            {navItems.map((n) => (
              <div key={n.id} className="glass rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <input className={inputClass + " md:col-span-3"} placeholder="Label" value={n.label} onChange={(e) => setNavItems(navItems.map((x) => x.id === n.id ? { ...x, label: e.target.value } : x))} />
                <input className={inputClass + " md:col-span-4"} placeholder="Link (e.g. #products)" value={n.href} onChange={(e) => setNavItems(navItems.map((x) => x.id === n.id ? { ...x, href: e.target.value } : x))} />
                <input type="number" className={inputClass + " md:col-span-2"} placeholder="Order" value={n.sort_order} onChange={(e) => setNavItems(navItems.map((x) => x.id === n.id ? { ...x, sort_order: parseInt(e.target.value) || 0 } : x))} />
                <label className="md:col-span-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={n.is_visible} onChange={(e) => setNavItems(navItems.map((x) => x.id === n.id ? { ...x, is_visible: e.target.checked } : x))} className="accent-primary" />
                  Visible
                </label>
                <button onClick={() => setNavItems(navItems.filter((x) => x.id !== n.id))} className="text-destructive md:col-span-1"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Section Headings Tab */}
        {activeTab === "headings" && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Tag className="h-6 w-6 text-primary" /> Section Headings</h2>
              <button onClick={() => setSectionHeadings([...sectionHeadings, { id: crypto.randomUUID(), section_key: "new_section", heading: "New Heading", subheading: "", is_visible: true }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Heading
              </button>
            </div>
            {sectionHeadings.map((h) => (
              <div key={h.id} className="glass rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-secondary px-2 py-1 rounded">{h.section_key}</code>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={h.is_visible} onChange={(e) => setSectionHeadings(sectionHeadings.map((x) => x.id === h.id ? { ...x, is_visible: e.target.checked } : x))} className="accent-primary" />
                      Visible
                    </label>
                    <button onClick={() => setSectionHeadings(sectionHeadings.filter((x) => x.id !== h.id))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <input className={inputClass} placeholder="Section Key" value={h.section_key} onChange={(e) => setSectionHeadings(sectionHeadings.map((x) => x.id === h.id ? { ...x, section_key: e.target.value } : x))} />
                <input className={inputClass} placeholder="Heading" value={h.heading} onChange={(e) => setSectionHeadings(sectionHeadings.map((x) => x.id === h.id ? { ...x, heading: e.target.value } : x))} />
                <input className={inputClass} placeholder="Subheading" value={h.subheading || ""} onChange={(e) => setSectionHeadings(sectionHeadings.map((x) => x.id === h.id ? { ...x, subheading: e.target.value } : x))} />
              </div>
            ))}
          </div>
        )}

        {/* Dealer Brands Tab */}
        {activeTab === "brands" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Authorized Brands</h2>
              <button onClick={() => setDealerBrands([...dealerBrands, { id: crypto.randomUUID(), brand_name: "New Brand", logo_url: "", website_url: "", brand_type: "dealer", sort_order: dealerBrands.length + 1, is_active: true }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Brand
              </button>
            </div>
            {dealerBrands.map((b) => (
              <div key={b.id} className="glass rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <input className={inputClass + " md:col-span-3"} placeholder="Brand Name" value={b.brand_name} onChange={(e) => setDealerBrands(dealerBrands.map((x) => x.id === b.id ? { ...x, brand_name: e.target.value } : x))} />
                <input className={inputClass + " md:col-span-3"} placeholder="Logo URL" value={b.logo_url || ""} onChange={(e) => setDealerBrands(dealerBrands.map((x) => x.id === b.id ? { ...x, logo_url: e.target.value } : x))} />
                <input className={inputClass + " md:col-span-3"} placeholder="Website URL" value={b.website_url || ""} onChange={(e) => setDealerBrands(dealerBrands.map((x) => x.id === b.id ? { ...x, website_url: e.target.value } : x))} />
                <select className={inputClass + " md:col-span-2"} value={b.brand_type || "dealer"} onChange={(e) => setDealerBrands(dealerBrands.map((x) => x.id === b.id ? { ...x, brand_type: e.target.value } : x))}>
                  <option value="dealer">Dealer</option>
                  <option value="service">Service</option>
                </select>
                <button onClick={() => setDealerBrands(dealerBrands.filter((x) => x.id !== b.id))} className="text-destructive md:col-span-1"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Instagram Reels Tab */}
        {activeTab === "reels" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Instagram className="h-6 w-6 text-primary" /> Instagram Reels</h2>
              <button onClick={() => setInstagramReels([...instagramReels, { id: crypto.randomUUID(), title: "New Reel", reel_url: "", thumbnail_url: "", caption: "", sort_order: instagramReels.length + 1, is_active: true }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Reel
              </button>
            </div>
            {instagramReels.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold">{r.title || "Untitled"}</span>
                  <button onClick={() => setInstagramReels(instagramReels.filter((x) => x.id !== r.id))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs text-muted-foreground">Title</label><input className={inputClass} value={r.title || ""} onChange={(e) => setInstagramReels(instagramReels.map((x) => x.id === r.id ? { ...x, title: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Reel URL</label><input className={inputClass} value={r.reel_url || ""} onChange={(e) => setInstagramReels(instagramReels.map((x) => x.id === r.id ? { ...x, reel_url: e.target.value } : x))} placeholder="https://instagram.com/reel/..." /></div>
                  <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Thumbnail URL</label><input className={inputClass} value={r.thumbnail_url} onChange={(e) => setInstagramReels(instagramReels.map((x) => x.id === r.id ? { ...x, thumbnail_url: e.target.value } : x))} placeholder="https://..." /></div>
                  <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Caption</label><input className={inputClass} value={r.caption || ""} onChange={(e) => setInstagramReels(instagramReels.map((x) => x.id === r.id ? { ...x, caption: e.target.value } : x))} /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Testimonial Videos Tab */}
        {activeTab === "testimonials" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> Customer Testimonials</h2>
              <button onClick={() => setTestimonialVideos([...testimonialVideos, { id: crypto.randomUUID(), customer_name: "New Customer", location: "", product_purchased: "", video_url: "", thumbnail_url: "", review_text: "", rating: 5, sort_order: testimonialVideos.length + 1, is_active: true }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Testimonial
              </button>
            </div>
            {testimonialVideos.map((t) => (
              <div key={t.id} className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold">{t.customer_name}</span>
                  <button onClick={() => setTestimonialVideos(testimonialVideos.filter((x) => x.id !== t.id))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs text-muted-foreground">Customer Name</label><input className={inputClass} value={t.customer_name} onChange={(e) => setTestimonialVideos(testimonialVideos.map((x) => x.id === t.id ? { ...x, customer_name: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Location</label><input className={inputClass} value={t.location || ""} onChange={(e) => setTestimonialVideos(testimonialVideos.map((x) => x.id === t.id ? { ...x, location: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Product Purchased</label><input className={inputClass} value={t.product_purchased || ""} onChange={(e) => setTestimonialVideos(testimonialVideos.map((x) => x.id === t.id ? { ...x, product_purchased: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Rating (1-5)</label><input type="number" min={1} max={5} className={inputClass} value={t.rating} onChange={(e) => setTestimonialVideos(testimonialVideos.map((x) => x.id === t.id ? { ...x, rating: parseInt(e.target.value) || 5 } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Video URL</label><input className={inputClass} value={t.video_url || ""} onChange={(e) => setTestimonialVideos(testimonialVideos.map((x) => x.id === t.id ? { ...x, video_url: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Thumbnail URL</label><input className={inputClass} value={t.thumbnail_url || ""} onChange={(e) => setTestimonialVideos(testimonialVideos.map((x) => x.id === t.id ? { ...x, thumbnail_url: e.target.value } : x))} /></div>
                  <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Review Text</label><textarea rows={2} className={inputClass + " resize-none"} value={t.review_text || ""} onChange={(e) => setTestimonialVideos(testimonialVideos.map((x) => x.id === t.id ? { ...x, review_text: e.target.value } : x))} /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enquiries Inbox Tab */}
        {activeTab === "enquiries" && (
          <div className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Inbox className="h-6 w-6 text-primary" /> Enquiries Inbox <span className="text-sm text-muted-foreground font-normal">({enquiries.length})</span></h2>
            {enquiries.length === 0 && <p className="text-muted-foreground text-center py-8">No enquiries yet.</p>}
            {enquiries.map((e) => (
              <div key={e.id} className="glass rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-heading font-semibold">{e.name} <span className="text-sm text-muted-foreground font-normal">· {e.phone}</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={e.status} onChange={(ev) => updateEnquiryStatus(e.id, ev.target.value)} className="bg-secondary rounded-lg px-3 py-1.5 text-sm">
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="resolved">Resolved</option>
                      <option value="spam">Spam</option>
                    </select>
                    <a href={`https://wa.me/91${e.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm">WhatsApp</a>
                    <button onClick={() => deleteEnquiry(e.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {e.message && <p className="text-sm bg-secondary rounded-lg p-3">{e.message}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Intro Video Tab */}
        {activeTab === "intro" && (
          <div className="max-w-2xl space-y-5">
            <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Video className="h-6 w-6 text-primary" /> About / Intro Video Section</h2>
            <p className="text-sm text-muted-foreground">Shown right after the hero banner carousel.</p>
            {!introSection && (
              <button
                onClick={() => setIntroSection({ id: crypto.randomUUID(), heading: "About Computer Solutions", subheading: "", body_text: "", youtube_url: "", is_visible: true })}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Plus className="h-4 w-4" /> Create Intro Section
              </button>
            )}
            {introSection && (
              <div className="glass rounded-2xl p-6 space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={introSection.is_visible} onChange={(e) => setIntroSection({ ...introSection, is_visible: e.target.checked })} className="accent-primary" />
                  Show this section on the homepage
                </label>
                <div>
                  <label className="text-xs text-muted-foreground">Heading</label>
                  <input className={inputClass} value={introSection.heading} onChange={(e) => setIntroSection({ ...introSection, heading: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Subheading</label>
                  <input className={inputClass} value={introSection.subheading || ""} onChange={(e) => setIntroSection({ ...introSection, subheading: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Body Text</label>
                  <textarea rows={4} className={inputClass + " resize-none"} value={introSection.body_text || ""} onChange={(e) => setIntroSection({ ...introSection, body_text: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">YouTube URL (any format — embed, watch, youtu.be)</label>
                  <input className={inputClass} value={introSection.youtube_url || ""} onChange={(e) => setIntroSection({ ...introSection, youtube_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sister Concerns / Our Family Tab */}
        {activeTab === "family" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Our Family (Sister Concerns)</h2>
              <button
                onClick={() => setSisterConcerns([...sisterConcerns, { id: crypto.randomUUID(), name: "New Venture", tagline: "", description: "", thumbnail_url: "", website_url: "", sort_order: sisterConcerns.length + 1, is_active: true }])}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Plus className="h-4 w-4" /> Add Card
              </button>
            </div>
            {sisterConcerns.map((c) => (
              <div key={c.id} className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={c.is_active} onChange={(e) => setSisterConcerns(sisterConcerns.map((x) => x.id === c.id ? { ...x, is_active: e.target.checked } : x))} className="accent-primary" />
                      Visible
                    </label>
                    <button onClick={() => setSisterConcerns(sisterConcerns.filter((x) => x.id !== c.id))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs text-muted-foreground">Name</label><input className={inputClass} value={c.name} onChange={(e) => setSisterConcerns(sisterConcerns.map((x) => x.id === c.id ? { ...x, name: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Tagline</label><input className={inputClass} value={c.tagline || ""} onChange={(e) => setSisterConcerns(sisterConcerns.map((x) => x.id === c.id ? { ...x, tagline: e.target.value } : x))} /></div>
                  <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Description</label><textarea rows={2} className={inputClass + " resize-none"} value={c.description || ""} onChange={(e) => setSisterConcerns(sisterConcerns.map((x) => x.id === c.id ? { ...x, description: e.target.value } : x))} /></div>
                  <div><label className="text-xs text-muted-foreground">Website URL (Learn More link)</label><input className={inputClass} value={c.website_url || ""} onChange={(e) => setSisterConcerns(sisterConcerns.map((x) => x.id === c.id ? { ...x, website_url: e.target.value } : x))} placeholder="https://..." /></div>
                  <div><label className="text-xs text-muted-foreground">Sort Order</label><input type="number" className={inputClass} value={c.sort_order} onChange={(e) => setSisterConcerns(sisterConcerns.map((x) => x.id === c.id ? { ...x, sort_order: parseInt(e.target.value) || 0 } : x))} /></div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">Thumbnail Image (landscape, 16:9 ideal)</label>
                    <div className="flex flex-col md:flex-row gap-3 items-start mt-1">
                      <div className="flex-1 w-full space-y-2">
                        <input className={inputClass} value={c.thumbnail_url || ""} placeholder="https://..." onChange={(e) => setSisterConcerns(sisterConcerns.map((x) => x.id === c.id ? { ...x, thumbnail_url: e.target.value } : x))} />
                        <label className="inline-flex items-center gap-2 text-xs cursor-pointer bg-secondary text-secondary-foreground px-3 py-2 rounded-lg hover:opacity-90">
                          <ImageIcon className="h-4 w-4" /> Upload image
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            const ext = file.name.split(".").pop() || "jpg";
                            const path = `sister-concerns/${c.id}-${Date.now()}.${ext}`;
                            const t = toast.loading("Uploading...");
                            const { error } = await supabase.storage.from("shop-assets").upload(path, file, { upsert: true, contentType: file.type });
                            if (error) { toast.error(error.message, { id: t }); return; }
                            const { data } = supabase.storage.from("shop-assets").getPublicUrl(path);
                            setSisterConcerns(sisterConcerns.map((x) => x.id === c.id ? { ...x, thumbnail_url: data.publicUrl } : x));
                            toast.success("Uploaded", { id: t });
                          }} />
                        </label>
                      </div>
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt="" className="h-24 w-40 object-cover rounded-lg border border-border" />
                      ) : (
                        <div className="h-24 w-40 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">No image</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {sisterConcerns.length === 0 && <p className="text-muted-foreground text-center py-8">No cards yet. Click "Add Card".</p>}
          </div>
        )}
      </div>
    </div>
  );
}
