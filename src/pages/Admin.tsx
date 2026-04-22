import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Plus, Trash2, LogOut, Flame, Camera, Menu, Image as ImageIcon, Tag, Award, Instagram, MessageSquare, Inbox, Eye, EyeOff } from "lucide-react";
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
    const [s, p, sv, v, g, d, cc] = await Promise.all([
      supabase.from("site_settings").select("*"),
      supabase.from("products").select("*").order("display_order"),
      supabase.from("services").select("*").order("display_order"),
      supabase.from("youtube_videos").select("*").order("display_order"),
      supabase.from("gallery_images").select("*").order("display_order"),
      supabase.from("daily_deals").select("*").order("display_order"),
      supabase.from("cctv_products").select("*").order("display_order"),
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
    setLoading(false);
  };

  const saveSettings = async () => {
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    }
  };

  const saveCRUD = async (table: "products" | "services" | "youtube_videos" | "gallery_images" | "daily_deals" | "cctv_products", items: any[]) => {
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
      await Promise.all([
        saveSettings(),
        saveCRUD("products", products),
        saveCRUD("services", services),
        saveCRUD("youtube_videos", videos),
        saveCRUD("gallery_images", gallery),
        saveCRUD("daily_deals", deals),
        saveCRUD("cctv_products", cctvProducts),
      ]);
      queryClient.invalidateQueries();
      toast.success("All changes saved to database!");
    } catch (err) {
      toast.error("Error saving changes. Please try again.");
    }
  };

  const updateSetting = (key: string, value: string) => setSettings({ ...settings, [key]: value });

  const productCategories = (settings.product_categories || "Business,Gaming,Student,Budget,Premium").split(",").map(c => c.trim()).filter(Boolean);

  const tabs = [
    { id: "banner", label: "Banner" },
    { id: "deals", label: "🔥 Deals" },
    { id: "products", label: "Products" },
    { id: "cctv", label: "📹 CCTV" },
    { id: "services", label: "Services" },
    { id: "videos", label: "YouTube" },
    { id: "gallery", label: "Gallery" },
    { id: "contact", label: "Contact" },
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
            <h2 className="font-heading text-2xl font-semibold mb-4">Banner Settings</h2>
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
              <button onClick={() => setServices([...services, { id: crypto.randomUUID(), title: "New Service", description: "", icon_name: "Monitor", display_order: services.length + 1 }])} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
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
      </div>
    </div>
  );
}
