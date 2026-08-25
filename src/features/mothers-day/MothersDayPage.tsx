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
import { MOTHERS_DAY_META } from "@/features/mothers-day/meta";
import { MOTHERS_DAY_CONFIG } from "@/features/mothers-day/config";
import "@/features/mothers-day/theme.css";

const MothersDayPage = () => (
  <div className="mothers-day-theme min-h-screen bg-background text-foreground">
    <DocumentMeta {...MOTHERS_DAY_META} />
    <Navbar config={MOTHERS_DAY_CONFIG.navbar} />
    <main>
      <HeroSection config={MOTHERS_DAY_CONFIG.hero} />
      <FeaturedProductsSection config={MOTHERS_DAY_CONFIG.featuredProducts} />
      <BenefitsSection config={MOTHERS_DAY_CONFIG.benefits} />
      <CategoriesSection config={MOTHERS_DAY_CONFIG.categories} />
      <TestimonialsSection config={MOTHERS_DAY_CONFIG.testimonials} />
      <FAQSection config={MOTHERS_DAY_CONFIG.faq} />
      <FinalCTASection config={MOTHERS_DAY_CONFIG.finalCta} />
    </main>
    <Footer config={MOTHERS_DAY_CONFIG.footer} />
    <WhatsAppFAB config={MOTHERS_DAY_CONFIG.whatsAppFab} />
    <BackToTop />
    <PriceRangeSelector route="/dia-das-maes" />
  </div>
);

export default MothersDayPage;
