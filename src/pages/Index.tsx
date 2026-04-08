import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import BrandsMarquee from "@/components/BrandsMarquee";
import Services from "@/components/Services";
import NewArrivals from "@/components/NewArrivals";
import Products from "@/components/Products";
import WhyChooseUs from "@/components/WhyChooseUs";
import Gallery from "@/components/Gallery";
import YouTubeVideos from "@/components/YouTubeVideos";
import ContactUs from "@/components/ContactUs";
import Footer from "@/components/Footer";

const Index = () => {
  useEffect(() => {
    document.title = "ComputerSolutions — Premium Laptops & Computers at Best Prices";
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroBanner />
      <BrandsMarquee />
      <Services />
      <NewArrivals />
      <Products />
      <WhyChooseUs />
      <Gallery />
      <YouTubeVideos />
      <ContactUs />
      <Footer />
    </div>
  );
};

export default Index;
