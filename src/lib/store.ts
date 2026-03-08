// Simple localStorage-based store for admin panel
export interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  isNew?: boolean;
  specs?: string;
}

export interface SiteData {
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImage: string;
  products: Product[];
  galleryImages: string[];
  youtubeVideos: string[];
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  whatsapp: string;
}

const defaultProducts: Product[] = [
  { id: "1", name: "HP Pavilion 15", price: "₹45,999", image: "", category: "Business", isNew: true, specs: "i5 12th Gen, 8GB RAM, 512GB SSD" },
  { id: "2", name: "Dell Inspiron 14", price: "₹52,499", image: "", category: "Business", isNew: true, specs: "i5 13th Gen, 16GB RAM, 512GB SSD" },
  { id: "3", name: "Lenovo IdeaPad 3", price: "₹38,999", image: "", category: "Budget", isNew: false, specs: "Ryzen 5, 8GB RAM, 256GB SSD" },
  { id: "4", name: "ASUS VivoBook 15", price: "₹41,999", image: "", category: "Student", isNew: true, specs: "i3 12th Gen, 8GB RAM, 512GB SSD" },
  { id: "5", name: "Acer Nitro 5", price: "₹72,990", image: "", category: "Gaming", isNew: false, specs: "i5 12th Gen, RTX 3050, 16GB RAM" },
  { id: "6", name: "MacBook Air M2", price: "₹99,900", image: "", category: "Premium", isNew: true, specs: "M2 Chip, 8GB RAM, 256GB SSD" },
];

const defaultData: SiteData = {
  bannerTitle: "Premium Laptops at Best Prices",
  bannerSubtitle: "Your trusted destination for branded laptops — new, refurbished & accessories",
  bannerImage: "",
  products: defaultProducts,
  galleryImages: [],
  youtubeVideos: [
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
  ],
  contactPhone: "+91 98765 43210",
  contactEmail: "info@laptopstore.com",
  contactAddress: "Shop No. 12, Tech Market, Main Road, City - 110001",
  whatsapp: "919876543210",
};

const STORAGE_KEY = "laptop-store-data";

export function getSiteData(): SiteData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultData, ...JSON.parse(stored) };
  } catch {}
  return defaultData;
}

export function setSiteData(data: Partial<SiteData>) {
  const current = getSiteData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...data }));
}
