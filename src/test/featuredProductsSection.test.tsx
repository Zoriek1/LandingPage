import { createElement, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FeaturedProductsSection from "@/features/mothers-day/components/sections/FeaturedProductsSection";
import snapshot from "@/features/mothers-day/data/featured-products.snapshot.json";

const { openWhatsAppModal } = vi.hoisted(() => ({
  openWhatsAppModal: vi.fn(),
}));

vi.mock("@/lib/whatsappModal", () => ({
  openWhatsAppModal,
}));

vi.mock("framer-motion", () => {
  const createMotionComponent =
    (tag: keyof JSX.IntrinsicElements) =>
    ({
      children,
      initial: _initial,
      animate: _animate,
      whileInView: _whileInView,
      viewport: _viewport,
      transition: _transition,
      ...props
    }: {
      children: ReactNode;
      initial?: unknown;
      animate?: unknown;
      whileInView?: unknown;
      viewport?: unknown;
      transition?: unknown;
    }) =>
      createElement(tag, props, children);

  return {
    motion: {
      div: createMotionComponent("div"),
    },
  };
});

vi.mock("@/components/ui/carousel", () => ({
  Carousel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselItem: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CarouselPrevious: () => null,
  CarouselNext: () => null,
}));

describe("FeaturedProductsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))) as unknown as typeof fetch,
    );
  });

  it("renders the curated fallback snapshot", async () => {
    render(<FeaturedProductsSection />);

    expect(await screen.findByText(snapshot[0].title)).toBeInTheDocument();
    expect(screen.getByText(snapshot[0].priceLabel)).toBeInTheDocument();
  });

  it("opens WhatsApp with product context when a curated product is clicked", async () => {
    render(<FeaturedProductsSection />);

    const productLink = await screen.findByRole("link", {
      name: new RegExp(snapshot[0].title, "i"),
    });

    fireEvent.click(productLink);

    expect(openWhatsAppModal).toHaveBeenCalledWith(
      "https://wa.me/+5562996503403",
      expect.objectContaining({
        lp_slug: "dia-das-maes",
        cta_location: "featured_products",
        cta_label: "produto_whatsapp",
        product_id: snapshot[0].slug,
        product_name: snapshot[0].title,
        product_price: snapshot[0].priceLabel,
        delivery_intent: "entrega na data combinada",
      }),
      expect.stringContaining(snapshot[0].title + " - " + snapshot[0].priceLabel),
      "pagina=dia-das-maes",
    );
  });
});
