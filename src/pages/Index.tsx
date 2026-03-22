import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import CategoriesSection from "@/components/sections/CategoriesSection";
import WhyChooseSection from "@/components/sections/WhyChooseSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import ProcessSection from "@/components/sections/ProcessSection";
import OurStorySection from "@/components/sections/OurStorySection";
import FAQSection from "@/components/sections/FAQSection";
import FinalCTASection from "@/components/sections/FinalCTASection";
import WhatsAppFAB from "@/components/floating/WhatsAppFAB";
import BackToTop from "@/components/floating/BackToTop";
import WhatsAppLeadModal from "@/components/floating/WhatsAppLeadModal";

const Index = () => (
  <>
    <Navbar />
    <main>
      <HeroSection />
      <BenefitsSection />
      <CategoriesSection />
      <WhyChooseSection />
      <TestimonialsSection />
      <ProcessSection />
      <OurStorySection />
      <FAQSection />
      <FinalCTASection />
    </main>
    <Footer />
    <WhatsAppFAB />
    <BackToTop />
    <WhatsAppLeadModal />
  </>
);

export default Index;
