import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import CategoriesSection from "@/components/CategoriesSection";
import WhyChooseSection from "@/components/WhyChooseSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ProcessSection from "@/components/ProcessSection";
import OurStorySection from "@/components/OurStorySection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";

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
  </>
);

export default Index;
