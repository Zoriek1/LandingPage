import { useEffect, useRef, useState } from "react";

/**
 * Número que conta ao entrar na tela — acréscimo, nunca a fonte do número.
 *
 * Três regras que o desenho impõe:
 *
 * 1. O valor final é o estado inicial. Ele sai assim do `renderToString()` e é
 *    o que aparece com JavaScript bloqueado; a contagem só começa depois que o
 *    observer dispara.
 * 2. A contagem começa de um número com a MESMA quantidade de dígitos do final
 *    (3.000 parte de 1.000, 40 parte de 10). Com um dígito a menos a largura do
 *    texto pularia no meio da animação e o CLS sairia de zero.
 * 3. `prefers-reduced-motion` desliga tudo: fica o valor final, parado.
 *
 * Formatos aceitos: um número em pt-BR com prefixo e sufixo opcionais
 * ("+3.000", "40", "4,9"). Qualquer coisa fora disso é devolvida como texto,
 * sem animar.
 */
const DURATION_MS = 900;

type ParsedValue = {
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
function parseValue(value: string): ParsedValue | null {
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

function format({ prefix, suffix, decimals, separator }: ParsedValue, current: number) {
  const [integerPart, decimalPart] = current.toFixed(decimals).split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const number = decimalPart ? `${grouped}${separator}${decimalPart}` : grouped;
  return `${prefix}${number}${suffix}`;
}

export function CountUpValue({ value }: { value: string }) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver !== "function") return;

    const parsed = parseValue(value);
    if (!parsed) return;

    // Mesma quantidade de dígitos inteiros do valor final.
    const digits = Math.trunc(parsed.target).toString().length;
    const from = 10 ** (digits - 1);
    if (from >= parsed.target) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / DURATION_MS, 1);
          // easeOutCubic: rápido no começo, assenta no fim.
          const eased = 1 - (1 - progress) ** 3;
          setText(format(parsed, from + (parsed.target - from) * eased));
          if (progress < 1) frame = requestAnimationFrame(step);
          else setText(value);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value]);

  return <span ref={ref}>{text}</span>;
}
