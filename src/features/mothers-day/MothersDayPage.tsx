import { DocumentMeta } from "@/components/seo/DocumentMeta";
import { PriceRangeSelector } from "@/components/conversion/PriceRangeSelector";
import Footer from "@/features/mothers-day/components/layout/Footer";
import Navbar from "@/features/mothers-day/components/layout/Navbar";
import BackToTop from "@/features/mothers-day/components/floating/BackToTop";
import WhatsAppFAB from "@/features/mothers-day/components/floating/WhatsAppFAB";
import BenefitsSection from "@/features/mothers-day/components/sections/BenefitsSection";
import CategoriesSection from "@/features/mothers-day/components/sections/CategoriesSection";
import FAQSection from "@/features/mothers-day/components/sections/FAQSection";
import FinalCTASection from "@/features/mothers-day/components/sections/FinalCTASection";
import FeaturedProductsSection from "@/features/mothers-day/components/sections/FeaturedProductsSection";
import HeroSection from "@/features/mothers-day/components/sections/HeroSection";
import TestimonialsSection from "@/features/mothers-day/components/sections/TestimonialsSection";
import { MOTHERS_DAY_META } from "@/features/mothers-day/meta";
import "@/features/mothers-day/theme.css";

const MothersDayPage = () => (
  <div className="mothers-day-theme min-h-screen bg-background text-foreground">
    <DocumentMeta {...MOTHERS_DAY_META} />
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
    <PriceRangeSelector route="/dia-das-maes" />
  </div>
);

export default MothersDayPage;
