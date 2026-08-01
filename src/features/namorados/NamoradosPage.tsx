import { DocumentMeta } from "@/components/seo/DocumentMeta";
import { PriceRangeSelector } from "@/components/conversion/PriceRangeSelector";
import Footer from "@/features/namorados/components/layout/Footer";
import Navbar from "@/features/namorados/components/layout/Navbar";
import BackToTop from "@/features/namorados/components/floating/BackToTop";
import WhatsAppFAB from "@/features/namorados/components/floating/WhatsAppFAB";
import BenefitsSection from "@/features/namorados/components/sections/BenefitsSection";
import CategoriesSection from "@/features/namorados/components/sections/CategoriesSection";
import FAQSection from "@/features/namorados/components/sections/FAQSection";
import FeaturedProductsSection from "@/features/namorados/components/sections/FeaturedProductsSection";
import FinalCTASection from "@/features/namorados/components/sections/FinalCTASection";
import HeroSection from "@/features/namorados/components/sections/HeroSection";
import TestimonialsSection from "@/features/namorados/components/sections/TestimonialsSection";
import { NAMORADOS_META } from "@/features/namorados/meta";
import "@/features/namorados/theme.css";

const NamoradosPage = () => (
  <div className="namorados-theme min-h-screen bg-background text-foreground">
    <DocumentMeta {...NAMORADOS_META} />
    <Navbar />
    <main>
      <HeroSection />
      <FeaturedProductsSection />
      <BenefitsSection />
      <CategoriesSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </main>
    <Footer />
    <WhatsAppFAB />
    <BackToTop />
    <PriceRangeSelector route="/dia-dos-namorados" />
  </div>
);

export default NamoradosPage;
