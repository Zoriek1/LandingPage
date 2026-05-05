import { lazy, Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import BenefitsSection from "@/components/sections/BenefitsSection";

const CategoriesSection = lazy(() => import("@/components/sections/CategoriesSection"));
const WhyChooseSection = lazy(() => import("@/components/sections/WhyChooseSection"));
const TestimonialsSection = lazy(() => import("@/components/sections/TestimonialsSection"));
const ProcessSection = lazy(() => import("@/components/sections/ProcessSection"));
const OurStorySection = lazy(() => import("@/components/sections/OurStorySection"));
const FAQSection = lazy(() => import("@/components/sections/FAQSection"));
const FinalCTASection = lazy(() => import("@/components/sections/FinalCTASection"));
const Footer = lazy(() => import("@/components/layout/Footer"));
const WhatsAppFAB = lazy(() => import("@/components/floating/WhatsAppFAB"));
const BackToTop = lazy(() => import("@/components/floating/BackToTop"));

const Index = () => (
  <>
    <Navbar />
    <main>
      <HeroSection />
      <BenefitsSection />
      <Suspense fallback={null}>
        <CategoriesSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <ProcessSection />
        <OurStorySection />
        <FAQSection />
        <FinalCTASection />
      </Suspense>
    </main>
    <Suspense fallback={null}>
      <Footer />
      <WhatsAppFAB />
      <BackToTop />
    </Suspense>
  </>
);

export default Index;
