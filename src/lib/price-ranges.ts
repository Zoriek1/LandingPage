import type { TrackingParams } from "@/lib/tracking";

export type PriceRangeKey = "low" | "mid" | "high";

export type PriceRange = {
  key: PriceRangeKey;
  label: string;
  outcome: string;
};

export type PriceRangeRoute =
  | "/"
  | "/dia-das-maes"
  | "/dia-dos-namorados"
  | "/urgencia"
  | "/aniversario"
  | "/rosas-apt"
  | "/lirios-apt"
  | "/carro-low"
  | "/carro-high"
  | "/presente-hoje"
  | "/tradicao-comprovacao"
  | "/sem-erro"
  | "/qual-b";

export type PriceRangeConfig = {
  lpSlug: string;
  messageContext: string;
  ranges: readonly [PriceRange, PriceRange, PriceRange];
};

const LOW_OUTCOME = "Uma opção bonita e bem resolvida";
const MID_OUTCOME = "Mais presença para marcar a ocasião";
const HIGH_OUTCOME = "Um presente marcante, com mais volume";

export const PRICE_RANGE_CONFIGS: Record<PriceRangeRoute, PriceRangeConfig> = {
  "/": {
    lpSlug: "home",
    messageContext: "presentes florais —",
    ranges: [
      { key: "low", label: "Até R$ 200", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 200 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/dia-das-maes": {
    lpSlug: "dia-das-maes",
    messageContext: "presentes para o Dia das Mães —",
    ranges: [
      { key: "low", label: "Até R$ 230", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 230 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/dia-dos-namorados": {
    lpSlug: "dia-dos-namorados",
    messageContext: "surpresas para o Dia dos Namorados —",
    ranges: [
      { key: "low", label: "Até R$ 200", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 200 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/urgencia": {
    lpSlug: "urgencia",
    messageContext: "flores para entrega urgente —",
    ranges: [
      { key: "low", label: "Até R$ 230", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 230 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/aniversario": {
    lpSlug: "aniversario",
    messageContext: "presentes de aniversário —",
    ranges: [
      { key: "low", label: "Até R$ 250", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 250 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/rosas-apt": {
    lpSlug: "rosas-apt",
    messageContext: "arranjos de rosas —",
    ranges: [
      { key: "low", label: "Até R$ 200", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 200 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/lirios-apt": {
    lpSlug: "lirios-apt",
    messageContext: "arranjos de lírios —",
    ranges: [
      { key: "low", label: "Até R$ 230", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 230 a R$ 400", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 400", outcome: HIGH_OUTCOME },
    ],
  },
  "/carro-low": {
    lpSlug: "carro-low",
    messageContext: "mimos florais econômicos —",
    ranges: [
      { key: "low", label: "Até R$ 100", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 100 a R$ 150", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 150", outcome: HIGH_OUTCOME },
    ],
  },
  "/carro-high": {
    lpSlug: "carro-high",
    messageContext: "buquês premium —",
    ranges: [
      { key: "low", label: "Até R$ 300", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 300 a R$ 500", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 500", outcome: HIGH_OUTCOME },
    ],
  },
  "/presente-hoje": {
    lpSlug: "presente-hoje",
    messageContext: "presentes com flores para hoje —",
    ranges: [
      { key: "low", label: "Até R$ 160", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 160 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/tradicao-comprovacao": {
    lpSlug: "tradicao-comprovacao",
    messageContext: "arranjos com foto antes da entrega —",
    ranges: [
      { key: "low", label: "Até R$ 250", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 250 a R$ 450", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 450", outcome: HIGH_OUTCOME },
    ],
  },
  "/sem-erro": {
    lpSlug: "sem-erro",
    messageContext: "presentes florais sem erro —",
    ranges: [
      { key: "low", label: "Até R$ 230", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 230 a R$ 350", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 350", outcome: HIGH_OUTCOME },
    ],
  },
  "/qual-b": {
    lpSlug: "qual-b",
    messageContext: "flores do campo e girassóis —",
    ranges: [
      { key: "low", label: "Até R$ 110", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 110 a R$ 250", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 250", outcome: HIGH_OUTCOME },
    ],
  },
};

export const PRICE_RANGE_SELECTOR_EVENT = "price-range-selector:open";

export type PriceRangeSelectorRequest = TrackingParams;

export function openPriceRangeSelector(request: PriceRangeSelectorRequest) {
  window.dispatchEvent(
    new CustomEvent<PriceRangeSelectorRequest>(PRICE_RANGE_SELECTOR_EVENT, {
      detail: request,
    }),
  );
}

export function buildPriceRangeWhatsAppMessage(
  context: string,
  rangeLabel: string,
  token: string,
) {
  return `Oi! Quero ver opções de ${context} ${rangeLabel}. [${token}]`;
}
