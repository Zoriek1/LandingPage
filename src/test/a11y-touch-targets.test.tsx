import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BackToTop from "@/components/floating/BackToTop";
import BusinessFooter from "@/components/layout/BusinessFooter";
import Navbar from "@/components/layout/Navbar";

vi.mock("@/hooks/use-scroll-threshold", () => ({
  useScrollThreshold: (threshold: number) => threshold === 400,
}));

afterEach(cleanup);

const MINIMUM_TOUCH_TARGET = 44;
const TAILWIND_SPACING_UNIT = 4;

function utilityPixels(className: string, axis: "h" | "w"): number | null {
  const values: number[] = [];
  const tokens = className.split(/\s+/);

  for (const token of tokens) {
    if (token.includes(":")) continue;

    const arbitrary = token.match(
      new RegExp(`^(?:min-)?(?:${axis}|size)-\\[(\\d+(?:\\.\\d+)?)px\\]$`),
    );
    if (arbitrary) values.push(Number(arbitrary[1]));

    const spacing = token.match(
      new RegExp(`^(?:min-)?(?:${axis}|size)-(\\d+(?:\\.\\d+)?)$`),
    );
    if (spacing) values.push(Number(spacing[1]) * TAILWIND_SPACING_UNIT);
  }

  return values.length ? Math.max(...values) : null;
}

function expectMinimumAxis(
  element: HTMLElement,
  axis: "h" | "w",
  accessibleName: string,
) {
  let pixels = utilityPixels(element.className, axis);
  if (pixels === null) {
    const paddingAxis = axis === "h" ? "py" : "px";
    const padding = element.className.match(
      new RegExp(`(?:^|\\s)(?:p|${paddingAxis})-(\\d+(?:\\.\\d+)?)(?:\\s|$)`),
    );
    const iconSize = Number(
      element.querySelector("svg")?.getAttribute(axis === "h" ? "height" : "width"),
    );
    if (padding && iconSize) {
      pixels = iconSize + Number(padding[1]) * TAILWIND_SPACING_UNIT * 2;
    }
  }
  const dimension = axis === "h" ? "altura" : "largura";

  expect(
    pixels,
    `${accessibleName}: ${dimension} precisa estar explícita em utilitários Tailwind`,
  ).not.toBeNull();
  expect(
    pixels,
    `${accessibleName}: ${dimension} acionável é ${pixels}px; mínimo ${MINIMUM_TOUCH_TARGET}px`,
  ).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
}

describe("a11y — alvos de toque de pelo menos 44x44", () => {
  it("Navbar: menu mobile tem área acionável 44x44", () => {
    render(<Navbar />);
    const button = screen.getByRole("button", { name: "Menu" });

    expectMinimumAxis(button, "h", "Menu mobile");
    expectMinimumAxis(button, "w", "Menu mobile");
  });

  it("BackToTop tem área acionável 44x44", () => {
    render(<BackToTop />);
    const button = screen.getByRole("button", { name: "Voltar ao topo" });

    expectMinimumAxis(button, "h", "Voltar ao topo");
    expectMinimumAxis(button, "w", "Voltar ao topo");
  });

  it("BusinessFooter: WhatsApp tem área acionável 44x44", () => {
    render(<BusinessFooter tagline="Flores e presentes" />);
    const button = screen.getByRole("button", { name: "WhatsApp" });

    expectMinimumAxis(button, "h", "WhatsApp do rodapé");
    expectMinimumAxis(button, "w", "WhatsApp do rodapé");
  });
});
