import { lazy, Suspense, useEffect } from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import IntroSection from "@/components/IntroSection";

// Lazy-load below-the-fold sections to shrink initial JS bundle.
// Each section gets its OWN Suspense boundary so one slow chunk
// doesn't block all the others from rendering.
const WhyChooseUs = lazy(() => import("@/components/WhyChooseUs"));
const BrandsMarquee = lazy(() => import("@/components/BrandsMarquee"));
const EmiBanner = lazy(() => import("@/components/EmiBanner"));
const NewArrivals = lazy(() => import("@/components/NewArrivals"));
const DailyDeals = lazy(() => import("@/components/DailyDeals"));
const Services = lazy(() => import("@/components/Services"));
const Products = lazy(() => import("@/components/Products"));
const CCTVProducts = lazy(() => import("@/components/CCTVProducts"));
const TestimonialVideos = lazy(() => import("@/components/TestimonialVideos"));
const YouTubeVideos = lazy(() => import("@/components/YouTubeVideos"));
const InstagramReels = lazy(() => import("@/components/InstagramReels"));
const SisterConcerns = lazy(() => import("@/components/SisterConcerns"));
const Gallery = lazy(() => import("@/components/Gallery"));
const SocialLinks = lazy(() => import("@/components/SocialLinks"));
const ContactUs = lazy(() => import("@/components/ContactUs"));
const Footer = lazy(() => import("@/components/Footer"));
const FloatingWhatsApp = lazy(() => import("@/components/FloatingWhatsApp"));

const SectionFallback = () => <div className="h-24" aria-hidden />;

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<SectionFallback />}>{children}</Suspense>
);

const Index = () => {
  // Warm up below-the-fold chunks during browser idle time so they're
  // already in cache by the time the user scrolls down.
  useEffect(() => {
    const idle =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => setTimeout(cb, 800));
    idle(() => {
      import("@/components/WhyChooseUs");
      import("@/components/BrandsMarquee");
      import("@/components/EmiBanner");
      import("@/components/NewArrivals");
      import("@/components/DailyDeals");
      import("@/components/Services");
      import("@/components/Products");
      import("@/components/CCTVProducts");
      import("@/components/TestimonialVideos");
      import("@/components/YouTubeVideos");
      import("@/components/InstagramReels");
      import("@/components/SisterConcerns");
      import("@/components/Gallery");
      import("@/components/SocialLinks");
      import("@/components/ContactUs");
      import("@/components/Footer");
      import("@/components/FloatingWhatsApp");
    });
  }, []);

  return (
    <div className="min-h-screen">
      <SEO pageKey="home" fallbackTitle="Computer Solutions — Premium Laptops, CCTV & Tech" />
      <Navbar />
      <HeroBanner />
      <IntroSection />
      <Lazy><WhyChooseUs /></Lazy>
      <Lazy><BrandsMarquee /></Lazy>
      <Lazy><EmiBanner /></Lazy>
      <Lazy><NewArrivals /></Lazy>
      <Lazy><DailyDeals /></Lazy>
      <Lazy><Services /></Lazy>
      <Lazy><Products /></Lazy>
      <Lazy><CCTVProducts /></Lazy>
      <Lazy><TestimonialVideos /></Lazy>
      <Lazy><YouTubeVideos /></Lazy>
      <Lazy><InstagramReels /></Lazy>
      <Lazy><SisterConcerns /></Lazy>
      <Lazy><Gallery /></Lazy>
      <Lazy><SocialLinks /></Lazy>
      <Lazy><ContactUs /></Lazy>
      <Lazy><Footer /></Lazy>
      <Lazy><FloatingWhatsApp /></Lazy>
    </div>
  );
};

export default Index;
