import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MothersDayPage from "@/features/mothers-day/MothersDayPage";

vi.mock("@/components/seo/DocumentMeta", () => ({
  DocumentMeta: () => null,
}));

vi.mock("@/components/layout/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("@/components/layout/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("@/components/floating/BackToTop", () => ({
  default: () => null,
}));

vi.mock("@/components/floating/WhatsAppFAB", () => ({
  default: () => null,
}));

vi.mock("@/components/sections/HeroSection", () => ({
  default: () => <section data-testid="hero-section">Hero</section>,
}));

vi.mock("@/components/sections/FeaturedProductsSection", () => ({
  default: () => <section data-testid="featured-products-section">Featured</section>,
}));

vi.mock("@/components/sections/BenefitsSection", () => ({
  default: () => <section data-testid="benefits-section">Benefits</section>,
}));

vi.mock("@/components/sections/CategoriesSection", () => ({
  default: () => <section data-testid="categories-section">Categories</section>,
}));

vi.mock("@/components/sections/TestimonialsSection", () => ({
  default: () => <section data-testid="testimonials-section">Testimonials</section>,
}));

vi.mock("@/components/sections/FAQSection", () => ({
  default: () => <section data-testid="faq-section">Faq</section>,
}));

vi.mock("@/components/sections/FinalCTASection", () => ({
  default: () => <section data-testid="final-cta-section">Final CTA</section>,
}));

describe("MothersDayPage", () => {
  it("renders the featured products section after the hero and before categories", () => {
    render(<MothersDayPage />);

    const hero = screen.getByTestId("hero-section");
    const featured = screen.getByTestId("featured-products-section");
    const categories = screen.getByTestId("categories-section");

    expect(hero.compareDocumentPosition(featured) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(featured.compareDocumentPosition(categories) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
