import type { LPConfig } from "@/features/ad-lps/data/configs";

/** `businessHours` em business-info.ts: a loja abre 08h todos os dias em que abre. */
const OPENING_MINUTES = 8 * 60;

const WEEKDAY_CUTOFF_MINUTES: Record<string, number> = {
  "seg.": 18 * 60,
  "ter.": 18 * 60,
  "qua.": 18 * 60,
  "qui.": 18 * 60,
  "sex.": 18 * 60,
  "sab.": 13 * 60,
};

function saoPauloParts(now: Date): { weekday: string; minutesSinceMidnight: number } {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const weekday = value("weekday")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const minutesSinceMidnight = Number(value("hour")) * 60 + Number(value("minute"));

  return { weekday, minutesSinceMidnight };
}

export function resolveUrgencyMessage(config: LPConfig, now: Date = new Date()): string | null {
  const window = config.urgencyWindow;
  if (!window) return null;

  const { weekday, minutesSinceMidnight } = saoPauloParts(now);

  if (weekday === "dom.") return window.afterCutoff;

  const cutoff = WEEKDAY_CUTOFF_MINUTES[weekday];
  if (cutoff === undefined) return window.afterCutoff;

  return minutesSinceMidnight < cutoff ? window.beforeCutoff : window.afterCutoff;
}

/**
 * Minutos que faltam para o corte de hoje, no fuso da loja. `null` quando não
 * há corte a anunciar: domingo (não abre), depois do horário, ou antes das 08h
 * — a loja ainda nem abriu, e "faltam 10h" não é urgência, é ruído.
 *
 * Mesma tabela de corte de `resolveUrgencyMessage`: 18h de segunda a sexta, 13h
 * no sábado, sempre em America/Sao_Paulo e nunca no relógio do visitante.
 */
export function minutesUntilCutoff(now: Date = new Date()): number | null {
  const { weekday, minutesSinceMidnight } = saoPauloParts(now);

  const cutoff = WEEKDAY_CUTOFF_MINUTES[weekday];
  if (cutoff === undefined) return null;
  if (minutesSinceMidnight < OPENING_MINUTES) return null;
  if (minutesSinceMidnight >= cutoff) return null;

  return cutoff - minutesSinceMidnight;
}

/** "2h 40min", "3h", "18min". */
export function formatMinutesLeft(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (hours && minutes) return `${hours}h ${minutes}min`;
  if (hours) return `${hours}h`;
  return `${minutes}min`;
}

export type DeliveryTimingStatus = "before-opening" | "active" | "after-cutoff" | "closed";

export type DeliveryTiming = {
  status: DeliveryTimingStatus;
  message: string;
  minutesLeft: number | null;
};

/** Copy operacional única para hero e informações de entrega. */
export function resolveDeliveryTiming(now: Date = new Date()): DeliveryTiming {
  const { weekday, minutesSinceMidnight } = saoPauloParts(now);

  if (weekday === "dom.") {
    return {
      status: "closed",
      minutesLeft: null,
      message:
        "A loja está fechada aos domingos. Envie seu pedido para combinar uma próxima entrega.",
    };
  }

  const cutoff = WEEKDAY_CUTOFF_MINUTES[weekday];
  if (cutoff === undefined) {
    return {
      status: "closed",
      minutesLeft: null,
      message: "Consulte pelo WhatsApp o próximo horário disponível para entrega.",
    };
  }

  if (minutesSinceMidnight < OPENING_MINUTES) {
    return {
      status: "before-opening",
      minutesLeft: null,
      message: "A loja abre às 8h. Envie seu pedido agora para combinar a entrega.",
    };
  }

  if (minutesSinceMidnight < cutoff) {
    const minutesLeft = cutoff - minutesSinceMidnight;
    return {
      status: "active",
      minutesLeft,
      message: `Faltam ${formatMinutesLeft(minutesLeft)} para fechar as entregas de hoje.`,
    };
  }

  const cutoffLabel = weekday === "sab." ? "13h" : "18h";
  return {
    status: "after-cutoff",
    minutesLeft: null,
    message: `As entregas de hoje encerraram às ${cutoffLabel}. Você pode agendar o próximo dia de entrega.`,
  };
}
