import { lazy, Suspense } from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import IntroSection from "@/components/IntroSection";

// Lazy-load below-the-fold sections to shrink initial JS bundle
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

const SectionFallback = () => <div className="h-32" aria-hidden />;

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEO pageKey="home" fallbackTitle="Computer Solutions — Premium Laptops, CCTV & Tech" />
      <Navbar />
      <HeroBanner />
      <IntroSection />
      <Suspense fallback={<SectionFallback />}>
        <WhyChooseUs />
        <BrandsMarquee />
        <EmiBanner />
        <NewArrivals />
        <DailyDeals />
        <Services />
        <Products />
        <CCTVProducts />
        <TestimonialVideos />
        <YouTubeVideos />
        <InstagramReels />
        <SisterConcerns />
        <Gallery />
        <SocialLinks />
        <ContactUs />
        <Footer />
        <FloatingWhatsApp />
      </Suspense>
    </div>
  );
};

export default Index;
