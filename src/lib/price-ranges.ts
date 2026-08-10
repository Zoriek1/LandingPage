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
  | "/qual-b"
  | "/so-porque-sim"
  | "/buque-real"
  | "/reconciliacao"
  | "/girassol"
  | "/catalogo-precos";

/**
 * Opção do seletor de intenção (reconciliacao): mesma forma visual de
 * PriceRange, mas quando `productId` está presente o clique vai direto pro
 * WhatsApp com aquele produto, sem passar pela mensagem genérica de faixa.
 * Preço/nome ficam literais aqui pelo mesmo motivo do `lowFloorBrl` acima —
 * não importar o catálogo inteiro no bundle da home.
 */
export type IntentOption = {
  key: string;
  label: string;
  outcome: string;
  productId?: string;
  productName?: string;
  productPrice?: string;
};

export type PriceRangeConfig = {
  lpSlug: string;
  messageContext: string;
  /**
   * Menor preço real da vitrine da LP — o mesmo número que o priceAnchor do
   * hero promete. Fica como literal em vez de ser derivado de
   * features/ad-lps/data/configs.ts porque o seletor também é montado na home
   * (pages/Index.tsx), e importar aquele módulo arrastaria o catálogo PRODUCTS
   * inteiro para o bundle da home. A coerência é garantida em tempo de teste
   * por priceRangeSelector.test.tsx.
   */
  lowFloorBrl: string;
  ranges: readonly [PriceRange, PriceRange, PriceRange];
  /** Quando presente, o seletor mostra essas opções no lugar das faixas de preço. */
  intents?: readonly IntentOption[];
};

const LOW_OUTCOME = "Uma opção bonita e bem resolvida";
const MID_OUTCOME = "Mais presença para marcar a ocasião";
const HIGH_OUTCOME = "Um presente marcante, com mais volume";

// Tipado como Partial aqui porque as 5 rotas mais recentes só entram via
// Object.assign logo abaixo; o cast final (após o Object.assign) é que
// garante — e o teste em priceRangeSelector.test.tsx confirma — que todas as
// PriceRangeRoute realmente têm entrada.
const BASE_PRICE_RANGE_CONFIGS: Partial<Record<PriceRangeRoute, PriceRangeConfig>> = {
  "/": {
    lpSlug: "home",
    messageContext: "presentes florais —",
    lowFloorBrl: "R$ 99,90",
    ranges: [
      { key: "low", label: "R$ 99,90 a R$ 200", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 200 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/dia-das-maes": {
    lpSlug: "dia-das-maes",
    messageContext: "presentes para o Dia das Mães —",
    lowFloorBrl: "R$ 99,90",
    ranges: [
      { key: "low", label: "R$ 99,90 a R$ 230", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 230 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/dia-dos-namorados": {
    lpSlug: "dia-dos-namorados",
    messageContext: "surpresas para o Dia dos Namorados —",
    lowFloorBrl: "R$ 99,90",
    ranges: [
      { key: "low", label: "R$ 99,90 a R$ 200", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 200 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/urgencia": {
    lpSlug: "urgencia",
    messageContext: "flores para entrega urgente —",
    lowFloorBrl: "R$ 99,90",
    ranges: [
      { key: "low", label: "R$ 99,90 a R$ 230", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 230 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/aniversario": {
    lpSlug: "aniversario",
    messageContext: "presentes de aniversário —",
    lowFloorBrl: "R$ 199,90",
    // Corte em 300 (e não 250): com piso de R$ 199,90 uma faixa de 20 reais
    // não é uma escolha. Em 300 a faixa baixa cobre 5 dos 8 produtos.
    ranges: [
      { key: "low", label: "R$ 199,90 a R$ 300", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 300 a R$ 450", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 450", outcome: HIGH_OUTCOME },
    ],
  },
  "/rosas-apt": {
    lpSlug: "rosas-apt",
    messageContext: "arranjos de rosas —",
    lowFloorBrl: "R$ 99,90",
    ranges: [
      { key: "low", label: "R$ 99,90 a R$ 200", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 200 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/lirios-apt": {
    lpSlug: "lirios-apt",
    messageContext: "arranjos de lírios —",
    lowFloorBrl: "R$ 159,90",
    ranges: [
      { key: "low", label: "R$ 159,90 a R$ 230", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 230 a R$ 400", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 400", outcome: HIGH_OUTCOME },
    ],
  },
  "/carro-low": {
    lpSlug: "carro-low",
    messageContext: "mimos florais econômicos —",
    lowFloorBrl: "R$ 65,00",
    ranges: [
      { key: "low", label: "R$ 65,00 a R$ 100", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 100 a R$ 150", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 150", outcome: HIGH_OUTCOME },
    ],
  },
  "/carro-high": {
    lpSlug: "carro-high",
    messageContext: "buquês premium —",
    lowFloorBrl: "R$ 199,90",
    ranges: [
      { key: "low", label: "R$ 199,90 a R$ 300", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 300 a R$ 500", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 500", outcome: HIGH_OUTCOME },
    ],
  },
  "/presente-hoje": {
    lpSlug: "presente-hoje",
    messageContext: "presentes com flores para hoje —",
    lowFloorBrl: "R$ 99,90",
    ranges: [
      { key: "low", label: "R$ 99,90 a R$ 160", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 160 a R$ 300", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME },
    ],
  },
  "/tradicao-comprovacao": {
    lpSlug: "tradicao-comprovacao",
    messageContext: "arranjos com foto antes da entrega —",
    lowFloorBrl: "R$ 199,90",
    ranges: [
      { key: "low", label: "R$ 199,90 a R$ 300", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 300 a R$ 450", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 450", outcome: HIGH_OUTCOME },
    ],
  },
  "/sem-erro": {
    lpSlug: "sem-erro",
    messageContext: "presentes florais sem erro —",
    lowFloorBrl: "R$ 99,90",
    ranges: [
      { key: "low", label: "R$ 99,90 a R$ 230", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 230 a R$ 350", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 350", outcome: HIGH_OUTCOME },
    ],
  },
  "/qual-b": {
    lpSlug: "qual-b",
    messageContext: "flores do campo e girassóis —",
    lowFloorBrl: "R$ 65,00",
    ranges: [
      { key: "low", label: "R$ 65,00 a R$ 109,90", outcome: LOW_OUTCOME },
      { key: "mid", label: "R$ 110 a R$ 249,90", outcome: MID_OUTCOME },
      { key: "high", label: "Acima de R$ 250", outcome: HIGH_OUTCOME },
    ],
  },
};

export const PRICE_RANGE_CONFIGS = BASE_PRICE_RANGE_CONFIGS as Record<PriceRangeRoute, PriceRangeConfig>;

Object.assign(PRICE_RANGE_CONFIGS, {
  "/so-porque-sim": { lpSlug: "so-porque-sim", messageContext: "flores para surpreender sem data —", lowFloorBrl: "R$ 99,90", ranges: [{ key: "low", label: "R$ 99,90 a R$ 200", outcome: LOW_OUTCOME }, { key: "mid", label: "R$ 200 a R$ 300", outcome: MID_OUTCOME }, { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME }] },
  "/buque-real": { lpSlug: "buque-real", messageContext: "buquês com foto real antes da entrega —", lowFloorBrl: "R$ 99,90", ranges: [{ key: "low", label: "R$ 99,90 a R$ 200", outcome: LOW_OUTCOME }, { key: "mid", label: "R$ 200 a R$ 300", outcome: MID_OUTCOME }, { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME }] },
  // As faixas continuam existindo (compatibilidade/fallback), mas o estado
  // sem `?criativo=` mostra `intents` abaixo: escolha por intenção, não por
  // faixa de preço sobreposta.
  "/reconciliacao": {
    lpSlug: "reconciliacao",
    messageContext: "flores para reconciliação —",
    lowFloorBrl: "R$ 99,90",
    ranges: [{ key: "low", label: "R$ 99,90 a R$ 199,90", outcome: LOW_OUTCOME }, { key: "mid", label: "R$ 200 a R$ 300", outcome: MID_OUTCOME }, { key: "high", label: "Acima de R$ 300", outcome: HIGH_OUTCOME }],
    intents: [
      {
        key: "lirio",
        label: "Quero lírios",
        outcome: "Arranjo de Mão Lírios P — R$ 159,90",
        productId: "arranjo-mao-lirios-p",
        productName: "Arranjo de Mão Lírios P",
        productPrice: "R$ 159,90",
      },
      {
        key: "rosas",
        label: "Quero rosas",
        outcome: "Buquê de Rosas com Astromélias — R$ 199,90",
        productId: "buque-rosas-astromelias",
        productName: "Buquê de Rosas com Astromélias",
        productPrice: "R$ 199,90",
      },
      {
        key: "ate-200",
        label: "Quero ver opções até R$ 200",
        outcome: "Escolhas variadas dentro do orçamento",
      },
      {
        key: "ajuda",
        label: "Ainda não sei — preciso de ajuda",
        outcome: "A gente te ajuda a escolher pelo WhatsApp",
      },
    ],
  },
  "/girassol": { lpSlug: "girassol", messageContext: "girassóis —", lowFloorBrl: "R$ 65,00", ranges: [{ key: "low", label: "R$ 65,00 a R$ 109,90", outcome: LOW_OUTCOME }, { key: "mid", label: "R$ 110 a R$ 249,90", outcome: MID_OUTCOME }, { key: "high", label: "Acima de R$ 250", outcome: HIGH_OUTCOME }] },
  "/catalogo-precos": { lpSlug: "catalogo-precos", messageContext: "flores por faixa de preço —", lowFloorBrl: "R$ 65,00", ranges: [{ key: "low", label: "R$ 65,00 a R$ 134,90", outcome: LOW_OUTCOME }, { key: "mid", label: "R$ 135 a R$ 249,90", outcome: MID_OUTCOME }, { key: "high", label: "Acima de R$ 250", outcome: HIGH_OUTCOME }] },
});

export const PRICE_RANGE_SELECTOR_EVENT = "price-range-selector:open";

export type PriceRangeSelectorRequest = TrackingParams;

export function openPriceRangeSelector(request: PriceRangeSelectorRequest) {
  window.dispatchEvent(
    new CustomEvent<PriceRangeSelectorRequest>(PRICE_RANGE_SELECTOR_EVENT, {
      detail: request,
    }),
  );
}

/**
 * Só a frase. O bloco do código de atendimento é anexado por
 * appendTrackingBlock (whatsappModal.ts), igual ao caminho dos cards de produto.
 */
export function buildPriceRangeWhatsAppMessage(context: string, rangeLabel: string) {
  return `Oi! Quero ver opções de ${context} ${rangeLabel}.`;
}
