import { lazy, useEffect } from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import IntroSection from "@/components/IntroSection";
import LazySection from "@/components/LazySection";

// Lazy chunk loaders — kept as named factories so we can both lazy-render
// AND manually preload them via IntersectionObserver as the user nears them.
const loadWhyChooseUs = () => import("@/components/WhyChooseUs");
const loadBrandsMarquee = () => import("@/components/BrandsMarquee");
const loadEmiBanner = () => import("@/components/EmiBanner");
const loadNewArrivals = () => import("@/components/NewArrivals");
const loadDailyDeals = () => import("@/components/DailyDeals");
const loadServices = () => import("@/components/Services");
const loadProducts = () => import("@/components/Products");
const loadCCTVProducts = () => import("@/components/CCTVProducts");
const loadTestimonialVideos = () => import("@/components/TestimonialVideos");
const loadYouTubeVideos = () => import("@/components/YouTubeVideos");
const loadInstagramReels = () => import("@/components/InstagramReels");
const loadSisterConcerns = () => import("@/components/SisterConcerns");
const loadGallery = () => import("@/components/Gallery");
const loadSocialLinks = () => import("@/components/SocialLinks");
const loadContactUs = () => import("@/components/ContactUs");
const loadFooter = () => import("@/components/Footer");
const loadFloatingWhatsApp = () => import("@/components/FloatingWhatsApp");

const WhyChooseUs = lazy(loadWhyChooseUs);
const BrandsMarquee = lazy(loadBrandsMarquee);
const EmiBanner = lazy(loadEmiBanner);
const NewArrivals = lazy(loadNewArrivals);
const DailyDeals = lazy(loadDailyDeals);
const Services = lazy(loadServices);
const Products = lazy(loadProducts);
const CCTVProducts = lazy(loadCCTVProducts);
const TestimonialVideos = lazy(loadTestimonialVideos);
const YouTubeVideos = lazy(loadYouTubeVideos);
const InstagramReels = lazy(loadInstagramReels);
const SisterConcerns = lazy(loadSisterConcerns);
const Gallery = lazy(loadGallery);
const SocialLinks = lazy(loadSocialLinks);
const ContactUs = lazy(loadContactUs);
const Footer = lazy(loadFooter);
const FloatingWhatsApp = lazy(loadFloatingWhatsApp);

const Index = () => {
  // Idle-time warmup of the FIRST few below-the-fold sections so they're
  // ready almost immediately after first paint. Remaining sections are
  // prefetched on-demand by LazySection's IntersectionObserver as the
  // user scrolls toward them.
  useEffect(() => {
    const idle =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => setTimeout(cb, 600));
    idle(() => {
      loadWhyChooseUs();
      loadBrandsMarquee();
      loadEmiBanner();
      loadNewArrivals();
      loadDailyDeals();
    });
  }, []);

  return (
    <div className="min-h-screen">
      <SEO pageKey="home" fallbackTitle="Computer Solutions — Premium Laptops, CCTV & Tech" />
      <Navbar />
      <HeroBanner />
      <LazySection preload={loadDailyDeals}><DailyDeals /></LazySection>
      <IntroSection />

      <LazySection preload={loadWhyChooseUs}><WhyChooseUs /></LazySection>
      <LazySection preload={loadBrandsMarquee}><BrandsMarquee /></LazySection>
      <LazySection preload={loadEmiBanner}><EmiBanner /></LazySection>
      <LazySection preload={loadNewArrivals}><NewArrivals /></LazySection>
      <LazySection preload={loadServices}><Services /></LazySection>
      <LazySection preload={loadProducts}><Products /></LazySection>
      <LazySection preload={loadCCTVProducts}><CCTVProducts /></LazySection>
      <LazySection preload={loadTestimonialVideos}><TestimonialVideos /></LazySection>
      <LazySection preload={loadYouTubeVideos}><YouTubeVideos /></LazySection>
      <LazySection preload={loadInstagramReels}><InstagramReels /></LazySection>
      <LazySection preload={loadSisterConcerns}><SisterConcerns /></LazySection>
      <LazySection preload={loadGallery}><Gallery /></LazySection>
      <LazySection preload={loadSocialLinks}><SocialLinks /></LazySection>
      <LazySection preload={loadContactUs}><ContactUs /></LazySection>
      <LazySection preload={loadFooter} minHeight="100px"><Footer /></LazySection>
      <LazySection preload={loadFloatingWhatsApp} minHeight="0px"><FloatingWhatsApp /></LazySection>
    </div>
  );
};

export default Index;
