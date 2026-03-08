import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSiteData, setSiteData, type SiteData, type Product } from "@/lib/store";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [data, setData] = useState<SiteData>(getSiteData());
  const [activeTab, setActiveTab] = useState("banner");

  useEffect(() => {
    document.title = "Admin Panel — LaptopHub";
  }, []);

  const save = () => {
    setSiteData(data);
    toast.success("Changes saved! Refresh the homepage to see updates.");
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setData({ ...data, products: data.products.map((p) => (p.id === id ? { ...p, ...updates } : p)) });
  };

  const addProduct = () => {
    const newP: Product = {
      id: Date.now().toString(),
      name: "New Laptop",
      price: "₹0",
      image: "",
      category: "Business",
      isNew: true,
      specs: "",
    };
    setData({ ...data, products: [...data.products, newP] });
  };

  const removeProduct = (id: string) => {
    setData({ ...data, products: data.products.filter((p) => p.id !== id) });
  };

  const addYoutubeVideo = () => {
    setData({ ...data, youtubeVideos: [...data.youtubeVideos, ""] });
  };

  const tabs = [
    { id: "banner", label: "Banner" },
    { id: "products", label: "Products" },
    { id: "videos", label: "YouTube" },
    { id: "contact", label: "Contact" },
  ];

  const inputClass = "w-full bg-secondary rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <h1 className="font-heading text-xl font-bold">Admin Panel</h1>
          </div>
          <button onClick={save} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
            <Save className="h-4 w-4" /> Save Changes
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-surface-hover"
              }`}
            >
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
              <input className={inputClass} value={data.bannerTitle} onChange={(e) => setData({ ...data, bannerTitle: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Banner Subtitle</label>
              <input className={inputClass} value={data.bannerSubtitle} onChange={(e) => setData({ ...data, bannerSubtitle: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Banner Image URL (leave empty for default)</label>
              <input className={inputClass} value={data.bannerImage} onChange={(e) => setData({ ...data, bannerImage: e.target.value })} placeholder="https://..." />
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold">Products</h2>
              <button onClick={addProduct} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Product
              </button>
            </div>

            {data.products.map((p) => (
              <div key={p.id} className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold">{p.name}</span>
                  <button onClick={() => removeProduct(p.id)} className="text-destructive hover:opacity-80">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Name</label>
                    <input className={inputClass} value={p.name} onChange={(e) => updateProduct(p.id, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Price</label>
                    <input className={inputClass} value={p.price} onChange={(e) => updateProduct(p.id, { price: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Category</label>
                    <select className={inputClass} value={p.category} onChange={(e) => updateProduct(p.id, { category: e.target.value })}>
                      {["Business", "Gaming", "Student", "Budget", "Premium"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Image URL</label>
                    <input className={inputClass} value={p.image} onChange={(e) => updateProduct(p.id, { image: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">Specs</label>
                    <input className={inputClass} value={p.specs || ""} onChange={(e) => updateProduct(p.id, { specs: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={p.isNew} onChange={(e) => updateProduct(p.id, { isNew: e.target.checked })} className="accent-primary" id={`new-${p.id}`} />
                    <label htmlFor={`new-${p.id}`} className="text-sm">Mark as New Arrival</label>
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
              <button onClick={addYoutubeVideo} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                <Plus className="h-4 w-4" /> Add Video
              </button>
            </div>
            {data.youtubeVideos.map((url, i) => (
              <div key={i} className="flex gap-3">
                <input
                  className={inputClass}
                  value={url}
                  onChange={(e) => {
                    const vids = [...data.youtubeVideos];
                    vids[i] = e.target.value;
                    setData({ ...data, youtubeVideos: vids });
                  }}
                  placeholder="https://www.youtube.com/embed/..."
                />
                <button onClick={() => setData({ ...data, youtubeVideos: data.youtubeVideos.filter((_, j) => j !== i) })} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <div className="max-w-2xl space-y-5">
            <h2 className="font-heading text-2xl font-semibold mb-4">Contact Info</h2>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Phone</label>
              <input className={inputClass} value={data.contactPhone} onChange={(e) => setData({ ...data, contactPhone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <input className={inputClass} value={data.contactEmail} onChange={(e) => setData({ ...data, contactEmail: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Address</label>
              <input className={inputClass} value={data.contactAddress} onChange={(e) => setData({ ...data, contactAddress: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">WhatsApp Number (with country code, no +)</label>
              <input className={inputClass} value={data.whatsapp} onChange={(e) => setData({ ...data, whatsapp: e.target.value })} placeholder="919876543210" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
