import { DocumentMeta } from "@/components/seo/DocumentMeta";
import { PriceRangeSelector } from "@/components/conversion/PriceRangeSelector";
import BenefitsSection from "@/components/sections/BenefitsSection";
import CategoriesSection from "@/components/sections/CategoriesSection";
import FAQSection from "@/components/sections/FAQSection";
import FinalCTASection from "@/components/sections/FinalCTASection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/floating/BackToTop";
import WhatsAppFAB from "@/components/floating/WhatsAppFAB";
import FeaturedProductsSection from "@/components/sections/FeaturedProductsSection";
import HeroSection from "@/components/sections/HeroSection";
import { NAMORADOS_META } from "@/features/namorados/meta";
import { NAMORADOS_CONFIG } from "@/features/namorados/config";
import "@/features/namorados/theme.css";

const NamoradosPage = () => (
  <div className="namorados-theme min-h-screen bg-background text-foreground">
    <DocumentMeta {...NAMORADOS_META} />
    <Navbar config={NAMORADOS_CONFIG.navbar} />
    <main>
      <HeroSection config={NAMORADOS_CONFIG.hero} />
      <FeaturedProductsSection config={NAMORADOS_CONFIG.featuredProducts} />
      <BenefitsSection config={NAMORADOS_CONFIG.benefits} />
      <CategoriesSection config={NAMORADOS_CONFIG.categories} />
      <TestimonialsSection config={NAMORADOS_CONFIG.testimonials} />
      <FAQSection config={NAMORADOS_CONFIG.faq} />
      <FinalCTASection config={NAMORADOS_CONFIG.finalCta} />
    </main>
    <Footer config={NAMORADOS_CONFIG.footer} />
    <WhatsAppFAB config={NAMORADOS_CONFIG.whatsAppFab} />
    <BackToTop />
    <PriceRangeSelector route="/dia-dos-namorados" />
  </div>
);

export default NamoradosPage;
