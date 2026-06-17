import { lazy, Suspense } from "react";
import { DocumentMeta } from "@/components/seo/DocumentMeta";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import { HOME_META } from "@/pages/index-meta";

const FeaturedProductsSection = lazy(() => import("@/components/sections/FeaturedProductsSection"));
const CategoriesSection = lazy(() => import("@/components/sections/CategoriesSection"));
const TestimonialsSection = lazy(() => import("@/components/sections/TestimonialsSection"));
const WhyChooseSection = lazy(() => import("@/components/sections/WhyChooseSection"));
const ProcessSection = lazy(() => import("@/components/sections/ProcessSection"));
const OurStorySection = lazy(() => import("@/components/sections/OurStorySection"));
const GuaranteeSection = lazy(() => import("@/components/sections/GuaranteeSection"));
const FAQSection = lazy(() => import("@/components/sections/FAQSection"));
const FinalCTASection = lazy(() => import("@/components/sections/FinalCTASection"));
const Footer = lazy(() => import("@/components/layout/Footer"));
const WhatsAppFAB = lazy(() => import("@/components/floating/WhatsAppFAB"));
const BackToTop = lazy(() => import("@/components/floating/BackToTop"));
const StickyCTA = lazy(() => import("@/components/floating/StickyCTA"));

const Index = () => (
  <>
    <DocumentMeta {...HOME_META} />
    <Navbar />
    <main>
      <HeroSection />
      <BenefitsSection />
      <Suspense fallback={null}>
        <FeaturedProductsSection />
        <CategoriesSection />
        <TestimonialsSection />
        <WhyChooseSection />
        <ProcessSection />
        <OurStorySection />
        <GuaranteeSection />
        <FAQSection />
        <FinalCTASection />
      </Suspense>
    </main>
    <Suspense fallback={null}>
      <Footer />
      <WhatsAppFAB />
      <BackToTop />
      <StickyCTA />
    </Suspense>
  </>
);

export default Index;
