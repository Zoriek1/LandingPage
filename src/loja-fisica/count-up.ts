/**
 * Números que contam ao entrar na tela na /loja-fisica/ (nota, avaliações,
 * anos de loja). É um acréscimo: o número de verdade é o que está no HTML.
 *
 * Marcação: `<span data-count-up>4,8</span>`, com o valor final como texto.
 *
 * Mesmas três regras de `features/ad-lps/components/CountUpValue.tsx`, aqui
 * em TS puro, sem React:
 *
 * 1. O valor final é o estado inicial. Sem JavaScript, sem IntersectionObserver
 *    ou para o robô do Google, o texto do HTML é o que vale. A contagem só
 *    começa depois que o observer dispara.
 * 2. A contagem parte de um número com a MESMA quantidade de dígitos do final
 *    (200 parte de 100, 40 parte de 10, 4,8 parte de 1,0). Com um dígito a
 *    menos a largura pularia no meio da animação e o CLS sairia de zero.
 * 3. `prefers-reduced-motion` desliga tudo: fica o valor final, parado.
 *
 * Largura: o script garante a mesma quantidade de dígitos em todos os quadros,
 * mas não a mesma largura. O CSS da página pede `font-variant-numeric:
 * tabular-nums` aos elementos `[data-count-up]`, e isso só iguala as larguras
 * se a fonte tiver algarismos tabulares: a Fraunces do subset da página não
 * tem, então o número e o sufixo ("+", ",") andam de lado durante a contagem.
 * Não há deslocamento de layout, porque o número fica sozinho na linha. Esse
 * estilo não é aplicado aqui.
 *
 * Leitor de tela: enquanto conta, o elemento animado recebe `aria-hidden` e
 * ganha um irmão visualmente oculto com o valor final, então ninguém ouve
 * "137" no meio da contagem. Ao terminar, o irmão sai e o `aria-hidden` volta
 * ao que era.
 *
 * Formatos aceitos: número em pt-BR com prefixo e sufixo opcionais ("4,8",
 * "200+", "40+"). Texto fora disso, ou com elementos filhos, não é animado.
 */
const SELECTOR = "[data-count-up]";
const DURATION_MS = 900;
const VISIBLE_THRESHOLD = 0.4;

export type ParsedCountUp = {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
  /** O separador decimal do texto original, preservado na saída. */
  separator: string;
};

/**
 * Os valores do repo misturam convenções: "+3.000" usa o ponto como milhar e
 * "4.9 ★" usa o mesmo ponto como decimal. Um ponto seguido de três dígitos é
 * milhar; de um ou dois, decimal. A vírgula é sempre decimal.
 */
export function parseCountUpValue(value: string): ParsedCountUp | null {
  const match = value.match(/^(\D*)(\d[\d.,]*)(\D*)$/);
  if (!match) return null;

  const [, prefix, number, suffix] = match;

  let separator = "";
  let integerPart = number;
  let decimalPart = "";

  if (/,\d+$/.test(number)) {
    separator = ",";
    [integerPart, decimalPart] = number.split(",");
  } else if (/^\d+\.\d{1,2}$/.test(number)) {
    separator = ".";
    [integerPart, decimalPart] = number.split(".");
  }

  const target = Number(`${integerPart.replace(/\./g, "")}.${decimalPart || "0"}`);
  if (!Number.isFinite(target)) return null;

  return { prefix, suffix, target, decimals: decimalPart.length, separator };
}

export function formatCountUpValue({ prefix, suffix, decimals, separator }: ParsedCountUp, current: number): string {
  const [integerPart, decimalPart] = current.toFixed(decimals).split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const number = decimalPart ? `${grouped}${separator}${decimalPart}` : grouped;
  return `${prefix}${number}${suffix}`;
}

type Plan = {
  node: HTMLElement;
  finalText: string;
  parsed: ParsedCountUp;
  from: number;
};

/** Elementos já entregues a algum `initCountUp`: chamar de novo não duplica nada. */
const claimed = new WeakSet<Element>();

function prefersReducedMotion(): boolean {
  try {
    return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return true;
  }
}

function planFor(node: HTMLElement): Plan | null {
  if (node.childElementCount > 0) return null;

  const finalText = node.textContent ?? "";
  const parsed = parseCountUpValue(finalText.trim());
  if (!parsed) return null;

  // Mesma quantidade de dígitos inteiros do valor final.
  const digits = Math.trunc(parsed.target).toString().length;
  const from = 10 ** (digits - 1);
  if (from >= parsed.target) return null;

  return { node, finalText, parsed, from };
}

/** Esconde o número em movimento e deixa o valor final para quem usa leitor de tela. */
function keepFinalValueForReaders(node: HTMLElement, finalText: string): () => void {
  if (node.getAttribute("aria-hidden") === "true") return () => {};

  const reader = node.ownerDocument.createElement("span");
  reader.textContent = finalText.trim();
  Object.assign(reader.style, {
    position: "absolute",
    width: "1px",
    height: "1px",
    margin: "-1px",
    padding: "0",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: "0",
  });

  node.setAttribute("aria-hidden", "true");
  node.after(reader);

  return () => {
    node.removeAttribute("aria-hidden");
    reader.remove();
  };
}

function run({ node, finalText, parsed, from }: Plan): void {
  let restoreReaders = () => {};

  const finish = () => {
    try {
      node.textContent = finalText;
      restoreReaders();
    } catch {
      // Nada a fazer: o valor final já é o texto do elemento.
    }
  };

  try {
    restoreReaders = keepFinalValueForReaders(node, finalText);
    node.textContent = formatCountUpValue(parsed, from);

    let start: number | undefined;
    const step = (now: number) => {
      try {
        if (start === undefined) start = now;
        const progress = Math.min(Math.max((now - start) / DURATION_MS, 0), 1);
        if (progress >= 1) {
          finish();
          return;
        }
        // easeOutCubic: rápido no começo, assenta no fim.
        const eased = 1 - (1 - progress) ** 3;
        node.textContent = formatCountUpValue(parsed, from + (parsed.target - from) * eased);
        requestAnimationFrame(step);
      } catch {
        finish();
      }
    };
    requestAnimationFrame(step);
  } catch {
    finish();
  }
}

function collect(scope: ParentNode): HTMLElement[] {
  const nodes = Array.from(scope.querySelectorAll<HTMLElement>(SELECTOR));
  if (scope instanceof HTMLElement && scope.matches(SELECTOR)) nodes.unshift(scope);
  return nodes;
}

/**
 * Liga a contagem em todo `[data-count-up]` dentro de `root` (a página inteira
 * por padrão). Cada número anima uma única vez, ao ficar 40% visível, em 900 ms.
 * Pode ser chamada mais de uma vez e nunca lança: no pior caso o número fica
 * parado no valor final do HTML.
 */
export function initCountUp(root?: ParentNode): void {
  try {
    const scope = root ?? (typeof document === "undefined" ? null : document);
    if (!scope) return;

    const nodes = collect(scope).filter((node) => !claimed.has(node));
    if (nodes.length === 0) return;
    nodes.forEach((node) => claimed.add(node));

    if (prefersReducedMotion()) return;
    if (typeof IntersectionObserver !== "function" || typeof requestAnimationFrame !== "function") return;

    const pending = new Map<Element, Plan>();
    for (const node of nodes) {
      const plan = planFor(node);
      if (plan) pending.set(node, plan);
    }
    if (pending.size === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const plan = pending.get(entry.target);
          if (!plan) continue;

          pending.delete(entry.target);
          observer.unobserve(entry.target);
          if (!prefersReducedMotion()) run(plan);
        }
        if (pending.size === 0) observer.disconnect();
      },
      { threshold: VISIBLE_THRESHOLD },
    );

    pending.forEach((_plan, node) => observer.observe(node));
  } catch {
    // O valor final já está no HTML; sem animação a página segue correta.
  }
}
