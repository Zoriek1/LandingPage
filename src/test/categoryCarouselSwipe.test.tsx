import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { destroyCategoryCarousels, initCategoryCarousels } from "@/loja-fisica/carousels";
import { CAROUSEL_AUTOPLAY_MS } from "@/loja-fisica/category-carousel";

/**
 * O jsdom não tem PointerEvent nem layout, então o gesto de arrastar do
 * framer-motion não roda de verdade. Este arquivo troca o `motion.div` por uma
 * div simples que entrega ao teste as props de drag, e confere o que o
 * carrossel faz com o fim do gesto. A animação em si fica coberta pelo
 * categoryCarousel.test.tsx, com o framer-motion real.
 */

type PanInfoLike = { offset: { x: number; y: number }; velocity: { x: number; y: number } };

const stage = vi.hoisted(() => ({ props: null as null | Record<string, unknown> }));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MOTION_ONLY = new Set([
    "initial",
    "animate",
    "transition",
    "drag",
    "dragConstraints",
    "dragElastic",
    "dragMomentum",
    "dragSnapToOrigin",
    "onDragStart",
    "onDragEnd",
  ]);
  const MotionDiv = React.forwardRef<HTMLDivElement, Record<string, unknown>>(function MotionDiv(props, ref) {
    if (props.drag) stage.props = props;
    const domProps = Object.fromEntries(Object.entries(props).filter(([key]) => !MOTION_ONLY.has(key)));
    return React.createElement("div", { ...domProps, ref });
  });
  return { motion: { div: MotionDiv } };
});

const pan = (x: number, velocityX = 0): PanInfoLike => ({
  offset: { x, y: 0 },
  velocity: { x: velocityX, y: 0 },
});

const startDrag = () => act(() => void (stage.props!.onDragStart as () => void)());
const endDrag = (info: PanInfoLike) =>
  act(() => void (stage.props!.onDragEnd as (event: unknown, info: PanInfoLike) => void)({}, info));

const caption = () => document.querySelector(".category-carousel-caption")!;

function mount() {
  const items = Array.from(
    { length: 5 },
    (_unused, index) =>
      `<li data-caption="Foto ${index + 1}"><picture><img src="/img/${index + 1}.webp" alt="Alt ${index + 1}" width="480" height="600"/></picture></li>`,
  ).join("");
  document.body.innerHTML = `<div data-carousel data-carousel-label="Adubos"><ul>${items}</ul></div>`;
  act(() => initCategoryCarousels());
}

beforeEach(() => {
  stage.props = null;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  act(() => destroyCategoryCarousels());
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("swipe do carrossel", () => {
  it("liga o arrasto horizontal no palco e devolve o cartão ao lugar", () => {
    mount();

    expect(stage.props).toMatchObject({ drag: "x", dragSnapToOrigin: true, dragConstraints: { left: 0, right: 0 } });
    expect(document.querySelector(".category-carousel-stage")).not.toBeNull();
  });

  it("arrastar para a esquerda avança e para a direita volta", () => {
    mount();

    endDrag(pan(-80));
    expect(caption()).toHaveTextContent("Foto 2, 2 de 5");

    endDrag(pan(120));
    expect(caption()).toHaveTextContent("Foto 1, 1 de 5");

    endDrag(pan(90));
    expect(caption()).toHaveTextContent("Foto 5, 5 de 5");
  });

  it("um arrasto curto e lento não troca a foto, mas um gesto rápido troca", () => {
    mount();

    endDrag(pan(-20, -100));
    expect(caption()).toHaveTextContent("Foto 1, 1 de 5");

    endDrag(pan(-12, -900));
    expect(caption()).toHaveTextContent("Foto 2, 2 de 5");

    endDrag(pan(8, 700));
    expect(caption()).toHaveTextContent("Foto 1, 1 de 5");
  });

  it("não deixa o autoplay trocar a foto no meio do arrasto", () => {
    mount();

    startDrag();
    act(() => void vi.advanceTimersByTime(CAROUSEL_AUTOPLAY_MS * 4));
    expect(caption()).toHaveTextContent("Foto 1, 1 de 5");

    endDrag(pan(-10, 0));
    expect(caption()).toHaveTextContent("Foto 1, 1 de 5");
    act(() => void vi.advanceTimersByTime(CAROUSEL_AUTOPLAY_MS));
    expect(caption()).toHaveTextContent("Foto 2, 2 de 5");
  });
});
