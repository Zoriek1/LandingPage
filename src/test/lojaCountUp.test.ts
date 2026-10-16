import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatCountUpValue, initCountUp, parseCountUpValue } from "@/loja-fisica/count-up";

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void;

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly observed = new Set<Element>();
  disconnected = false;
  constructor(readonly callback: ObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe = (node: Element) => void this.observed.add(node);
  unobserve = (node: Element) => void this.observed.delete(node);
  disconnect = () => {
    this.disconnected = true;
    this.observed.clear();
  };
  takeRecords = () => [];
}

/** Dispara a interseção do jeito que o navegador faria. */
function intersect(node: Element, isIntersecting = true) {
  for (const observer of FakeIntersectionObserver.instances) {
    if (!observer.observed.has(node)) continue;
    observer.callback([{ isIntersecting, target: node } as unknown as IntersectionObserverEntry]);
  }
}

/** requestAnimationFrame manual: cada flush roda os callbacks pendentes com o relógio dado. */
let frames: Array<(now: number) => void> = [];
const flush = (now: number) => {
  const due = frames;
  frames = [];
  due.forEach((callback) => callback(now));
};

/** O setup.ts define matchMedia e IntersectionObserver como writable, não configurable: só atribuição funciona. */
function setGlobal(name: "matchMedia" | "IntersectionObserver", value: unknown) {
  (window as unknown as Record<string, unknown>)[name] = value;
  (globalThis as unknown as Record<string, unknown>)[name] = value;
}

const original = {
  matchMedia: window.matchMedia,
  IntersectionObserver: window.IntersectionObserver,
};

function stubReducedMotion(reduce: boolean) {
  setGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function mount(values: string[] = ["4,8", "200+", "40+"]) {
  document.body.innerHTML = `<section>${values.map((value) => `<p><span data-count-up>${value}</span></p>`).join("")}</section>`;
  return Array.from(document.querySelectorAll<HTMLElement>("[data-count-up]"));
}

const digitsOf = (text: string | null) => (text ?? "").replace(/\D/g, "").length;

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  frames = [];
  stubReducedMotion(false);
  setGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("requestAnimationFrame", (callback: (now: number) => void) => frames.push(callback));
});

afterEach(() => {
  vi.unstubAllGlobals();
  setGlobal("matchMedia", original.matchMedia);
  setGlobal("IntersectionObserver", original.IntersectionObserver);
  document.body.innerHTML = "";
});

describe("parseCountUpValue e formatCountUpValue", () => {
  it("lê a vírgula como decimal e preserva o separador", () => {
    const parsed = parseCountUpValue("4,8")!;
    expect(parsed).toMatchObject({ target: 4.8, decimals: 1, separator: ",", prefix: "", suffix: "" });
    expect(formatCountUpValue(parsed, 1)).toBe("1,0");
    expect(formatCountUpValue(parsed, 4.8)).toBe("4,8");
  });

  it("preserva prefixo e sufixo", () => {
    expect(formatCountUpValue(parseCountUpValue("200+")!, 137.4)).toBe("137+");
    expect(formatCountUpValue(parseCountUpValue("40+")!, 10)).toBe("10+");
    expect(formatCountUpValue(parseCountUpValue("+3.000")!, 1234)).toBe("+1.234");
  });

  it("distingue ponto de milhar e ponto decimal", () => {
    expect(parseCountUpValue("3.000")).toMatchObject({ target: 3000, decimals: 0, separator: "" });
    expect(parseCountUpValue("4.9 ★")).toMatchObject({ target: 4.9, decimals: 1, separator: ".", suffix: " ★" });
  });

  it("devolve null para o que não é número", () => {
    expect(parseCountUpValue("sem nota")).toBeNull();
    expect(parseCountUpValue("")).toBeNull();
  });
});

describe("initCountUp", () => {
  it("mantém o valor final do HTML quando não há IntersectionObserver", () => {
    setGlobal("IntersectionObserver", undefined);
    const nodes = mount();

    expect(() => initCountUp()).not.toThrow();

    expect(nodes.map((node) => node.textContent)).toEqual(["4,8", "200+", "40+"]);
    expect(frames).toHaveLength(0);
    expect(document.querySelectorAll("[aria-hidden]")).toHaveLength(0);
  });

  it("não mexe em nada antes de o número entrar na tela", () => {
    const nodes = mount();
    initCountUp();

    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(nodes.map((node) => node.textContent)).toEqual(["4,8", "200+", "40+"]);

    intersect(nodes[0], false);
    expect(nodes[0].textContent).toBe("4,8");
    expect(frames).toHaveLength(0);
  });

  it("conta até o valor exato em 900 ms e preserva decimal, prefixo e sufixo", () => {
    const nodes = mount();
    initCountUp();
    nodes.forEach((node) => intersect(node));

    flush(1000);
    flush(1450);
    expect(nodes[0].textContent).toMatch(/^\d,\d$/);
    expect(nodes[1].textContent).toMatch(/^\d{3}\+$/);
    expect(nodes[2].textContent).toMatch(/^\d{2}\+$/);
    expect(nodes[1].textContent).not.toBe("200+");

    // Um milissegundo antes do fim a animação ainda está viva (o easing já assentou perto de 200).
    flush(1899);
    expect(frames).not.toHaveLength(0);

    flush(1900);
    expect(nodes.map((node) => node.textContent)).toEqual(["4,8", "200+", "40+"]);
    expect(frames).toHaveLength(0);
  });

  it("termina no valor exato mesmo quando o navegador pula quadros", () => {
    const [node] = mount(["200+"]);
    initCountUp();
    intersect(node);

    flush(5000);
    flush(9000);

    expect(node.textContent).toBe("200+");
    expect(frames).toHaveLength(0);
  });

  it("começa de um número com a mesma quantidade de dígitos do final", () => {
    const nodes = mount();
    initCountUp();
    nodes.forEach((node) => intersect(node));

    expect(nodes.map((node) => node.textContent)).toEqual(["1,0", "100+", "10+"]);
    expect(nodes.map((node) => digitsOf(node.textContent))).toEqual([2, 3, 2]);
  });

  it("mantém a quantidade de caracteres em todos os quadros", () => {
    const nodes = mount();
    const lengths = nodes.map((node) => node.textContent!.length);
    initCountUp();
    nodes.forEach((node) => intersect(node));

    for (let now = 2000; now <= 2900; now += 50) {
      flush(now);
      expect(nodes.map((node) => node.textContent!.length)).toEqual(lengths);
    }
    expect(nodes.map((node) => node.textContent)).toEqual(["4,8", "200+", "40+"]);
  });

  it("nunca passa do valor final nem volta atrás durante a contagem", () => {
    const [node] = mount(["200+"]);
    initCountUp();
    intersect(node);

    let previous = 0;
    for (let now = 3000; now < 3900; now += 30) {
      flush(now);
      const current = Number(node.textContent!.replace(/\D/g, ""));
      expect(current).toBeGreaterThanOrEqual(previous);
      expect(current).toBeLessThanOrEqual(200);
      previous = current;
    }
  });

  it("anima uma vez só: nova interseção depois do fim não recomeça", () => {
    const [node] = mount(["40+"]);
    initCountUp();
    intersect(node);
    flush(0);
    flush(900);
    expect(node.textContent).toBe("40+");

    intersect(node);
    intersect(node, false);
    intersect(node);

    expect(node.textContent).toBe("40+");
    expect(frames).toHaveLength(0);
    expect(FakeIntersectionObserver.instances[0].disconnected).toBe(true);
  });

  it("não anima com prefers-reduced-motion e nem observa os números", () => {
    stubReducedMotion(true);
    const nodes = mount();

    initCountUp();

    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(nodes.map((node) => node.textContent)).toEqual(["4,8", "200+", "40+"]);
    expect(frames).toHaveLength(0);
  });

  it("respeita prefers-reduced-motion ligado depois do init, quando o número entra na tela", () => {
    const [node] = mount(["200+"]);
    initCountUp();
    stubReducedMotion(true);

    intersect(node);

    expect(node.textContent).toBe("200+");
    expect(frames).toHaveLength(0);
  });

  it("é idempotente: chamar de novo não duplica observer nem animação", () => {
    const nodes = mount();
    initCountUp();
    initCountUp();
    initCountUp(document.body);

    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(FakeIntersectionObserver.instances[0].observed.size).toBe(3);

    nodes.forEach((node) => intersect(node));
    expect(frames).toHaveLength(3);

    initCountUp();
    expect(FakeIntersectionObserver.instances).toHaveLength(1);

    flush(0);
    flush(900);
    expect(nodes.map((node) => node.textContent)).toEqual(["4,8", "200+", "40+"]);
    expect(frames).toHaveLength(0);
  });

  it("liga elementos novos numa segunda chamada sem repetir os antigos", () => {
    const [first] = mount(["200+"]);
    initCountUp();
    const late = document.createElement("span");
    late.setAttribute("data-count-up", "");
    late.textContent = "40+";
    document.body.append(late);

    initCountUp();

    expect(FakeIntersectionObserver.instances).toHaveLength(2);
    expect(FakeIntersectionObserver.instances[0].observed).toEqual(new Set([first]));
    expect(FakeIntersectionObserver.instances[1].observed).toEqual(new Set([late]));
  });

  it("só toca nos números dentro do root informado", () => {
    document.body.innerHTML = `
      <div id="dentro"><span data-count-up>200+</span></div>
      <div id="fora"><span data-count-up>40+</span></div>`;
    const dentro = document.querySelector<HTMLElement>("#dentro [data-count-up]")!;
    const fora = document.querySelector<HTMLElement>("#fora [data-count-up]")!;

    initCountUp(document.querySelector("#dentro")!);

    expect(FakeIntersectionObserver.instances[0].observed).toEqual(new Set([dentro]));
    intersect(dentro);
    expect(dentro.textContent).toBe("100+");
    expect(fora.textContent).toBe("40+");
  });

  it("deixa só o valor final para leitor de tela enquanto conta e devolve o DOM ao fim", () => {
    const [node] = mount(["200+"]);
    const paragraph = node.parentElement!;
    initCountUp();
    intersect(node);

    expect(node).toHaveAttribute("aria-hidden", "true");
    const reader = paragraph.querySelector<HTMLElement>("span:not([data-count-up])")!;
    expect(reader).toHaveTextContent("200+");
    expect(reader.getAttribute("aria-hidden")).toBeNull();

    flush(0);
    flush(450);
    expect(node).toHaveAttribute("aria-hidden", "true");
    expect(reader.isConnected).toBe(true);

    flush(900);
    expect(node).not.toHaveAttribute("aria-hidden");
    expect(reader.isConnected).toBe(false);
    expect(paragraph.children).toHaveLength(1);
    expect(paragraph.textContent).toBe("200+");
  });

  it("preserva um aria-hidden que já existia no elemento", () => {
    const [node] = mount(["200+"]);
    node.setAttribute("aria-hidden", "true");
    initCountUp();
    intersect(node);
    flush(0);
    flush(900);

    expect(node).toHaveAttribute("aria-hidden", "true");
    expect(node.parentElement!.children).toHaveLength(1);
    expect(node.textContent).toBe("200+");
  });

  it("ignora o que não dá para animar com segurança", () => {
    document.body.innerHTML = `
      <span data-count-up>sem nota</span>
      <span data-count-up>1</span>
      <span data-count-up>0,5</span>
      <span data-count-up><b>40</b>+</span>`;
    const before = document.body.innerHTML;

    initCountUp();

    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(document.body.innerHTML).toBe(before);
  });

  it("nunca lança, mesmo se o IntersectionObserver quebrar", () => {
    const nodes = mount();
    setGlobal(
      "IntersectionObserver",
      class {
        constructor() {
          throw new Error("sem suporte");
        }
      },
    );

    expect(() => initCountUp()).not.toThrow();
    expect(nodes.map((node) => node.textContent)).toEqual(["4,8", "200+", "40+"]);
  });

  it("nunca lança e termina no valor final se o quadro de animação falhar", () => {
    const [node] = mount(["200+"]);
    initCountUp();
    vi.stubGlobal("requestAnimationFrame", () => {
      throw new Error("sem rAF");
    });

    expect(() => intersect(node)).not.toThrow();

    expect(node.textContent).toBe("200+");
    expect(node).not.toHaveAttribute("aria-hidden");
    expect(node.parentElement!.children).toHaveLength(1);
  });

  it("não faz nada quando não há números marcados", () => {
    document.body.innerHTML = "<p>Sem números aqui</p>";
    expect(() => initCountUp()).not.toThrow();
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });
});
