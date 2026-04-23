import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import IntroSection from "@/components/IntroSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import EmiBanner from "@/components/EmiBanner";
import BrandsMarquee from "@/components/BrandsMarquee";
import NewArrivals from "@/components/NewArrivals";
import DailyDeals from "@/components/DailyDeals";
import Services from "@/components/Services";
import Products from "@/components/Products";
import CCTVProducts from "@/components/CCTVProducts";
import TestimonialVideos from "@/components/TestimonialVideos";
import YouTubeVideos from "@/components/YouTubeVideos";
import InstagramReels from "@/components/InstagramReels";
import SisterConcerns from "@/components/SisterConcerns";
import Gallery from "@/components/Gallery";
import SocialLinks from "@/components/SocialLinks";
import ContactUs from "@/components/ContactUs";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEO pageKey="home" fallbackTitle="Computer Solutions — Premium Laptops, CCTV & Tech" />
      <Navbar />
      <HeroBanner />
      <IntroSection />
      <WhyChooseUs />
      <EmiBanner />
      <BrandsMarquee />
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
    </div>
  );
};

export default Index;
