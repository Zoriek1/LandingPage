import { createElement, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FeaturedProductsSection from "@/features/mothers-day/components/sections/FeaturedProductsSection";
import snapshot from "@/features/mothers-day/data/featured-products.snapshot.json";

const { trackSiteClick } = vi.hoisted(() => ({
  trackSiteClick: vi.fn(),
}));

vi.mock("@/lib/tracking", async () => {
  const actual = await vi.importActual<typeof import("@/lib/tracking")>("@/lib/tracking");
  return {
    ...actual,
    trackSiteClick,
  };
});

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

  it("tracks the click when a curated product is opened", async () => {
    render(<FeaturedProductsSection />);

    const productLink = await screen.findByRole("link", {
      name: new RegExp(snapshot[0].title, "i"),
    });

    fireEvent.click(productLink);

    expect(trackSiteClick).toHaveBeenCalledWith(
      expect.objectContaining({
        cta_location: "featured_products",
        cta_label: "open_product",
        destination_url: snapshot[0].url,
        product_name: snapshot[0].title,
        product_price: snapshot[0].priceLabel,
      }),
    );
  });
});
