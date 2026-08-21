import { buildGuidedWhatsAppMessage, openProductWhatsApp } from "@/lib/landing-whatsapp";
import { WHATSAPP_URL } from "@/lib/config";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { openWhatsAppModal } from "@/lib/whatsappModal";
import { WHATSAPP_BASE_URL, type LPConfig, type Product } from "@/features/ad-lps/data/configs";

type CtaOrigin =
  | "hero"
  | "vitrine"
  | "faq"
  | "sticky"
  | "como_funciona"
  | "final"
  | "guarantee";

type OpenAdLpWhatsAppArgs = {
  config: LPConfig;
  origin: CtaOrigin;
  product?: Product;
};

const AD_LP_CONTEXT: Record<string, { pageLabel: string; deliveryIntent: string; request: string }> = {
  urgencia: {
    pageLabel: "flores com entrega hoje",
    deliveryIntent: "entrega hoje em Goiânia",
    request: "Quero confirmar disponibilidade para entregar ainda hoje em Goiânia.",
  },
  aniversario: {
    pageLabel: "flores para aniversario",
    deliveryIntent: "entrega agendada no dia do aniversario",
    request: "Quero agendar uma entrega de aniversario e escolher por faixa de preco.",
  },
  "rosas-apt": {
    pageLabel: "buques de rosas",
    deliveryIntent: "envio de rosas com data combinada",
    request: "Quero mandar rosas e preciso de ajuda para escolher a melhor opcao.",
  },
  "lirios-apt": {
    pageLabel: "buques de lirios",
    deliveryIntent: "encomenda de lirios com data combinada",
    request: "Quero encomendar lirios e confirmar as opcoes disponiveis.",
  },
  "carro-low": {
    pageLabel: "flores ate R$ 149,90",
    deliveryIntent: "presente em conta com entrega combinada",
    request: "Quero ver opcoes ate R$ 149,90 e escolher por ocasiao.",
  },
  "carro-high": {
    pageLabel: "buques premium",
    deliveryIntent: "entrega de buque premium com data combinada",
    request: "Quero escolher um buque premium e confirmar disponibilidade.",
  },
  "presente-hoje": {
    pageLabel: "presente com flores para hoje",
    deliveryIntent: "entrega hoje em Goiânia",
    request: "Quero escolher um presente com flores para entregar hoje em Goiânia.",
  },
  "tradicao-comprovacao": {
    pageLabel: "floricultura tradicional com prova antes da entrega",
    deliveryIntent: "entrega em Goiânia com foto antes do envio",
    request: "Quero comprar com seguranca e ver as opcoes disponiveis da floricultura.",
  },
  "sem-erro": {
    pageLabel: "flores para presente sem erro",
    deliveryIntent: "presente recomendado com entrega combinada",
    request: "Quero ajuda para escolher uma opcao de presente sem erro.",
  },
  "qual-b": {
    pageLabel: "flores do campo e girassol",
    deliveryIntent: "entrega de flores do campo com data combinada",
    request: "Quero ver opcoes de flores do campo e girassol por faixa de preco.",
  },
  reconciliacao: {
    pageLabel: "flores para reconciliacao",
    deliveryIntent: "entrega hoje em Goiânia",
    request: "Quero ajuda para escolher flores para pedir desculpas e reabrir a conversa.",
  },
};

const getContext = (config: LPConfig) =>
  AD_LP_CONTEXT[config.slug] ?? {
    pageLabel: config.vitrineTitle.toLowerCase(),
    deliveryIntent: "entrega em Goiânia com data combinada",
    request: "Quero ajuda para escolher por faixa de preco e ocasiao.",
  };

export function buildAdLpWhatsAppUrl(_config?: LPConfig, _product?: Product) {
  return WHATSAPP_BASE_URL;
}

export function openAdLpWhatsApp({ config, origin, product }: OpenAdLpWhatsAppArgs) {
  const context = getContext(config);

  if (product) {
    openProductWhatsApp({
      pageSlug: config.slug,
      pageLabel: context.pageLabel,
      ctaLocation: origin,
      ctaLabel: "produto_whatsapp",
      productId: product.id,
      productName: product.name,
      productPrice: product.priceBrl,
      deliveryIntent: context.deliveryIntent,
    });
    return;
  }

  openPriceRangeSelector({
    lp_slug: config.slug,
    cta_location: origin,
    cta_label: `${origin}_whatsapp`,
    destination_url: WHATSAPP_URL,
  });
}

export function openAdLpGuidedWhatsApp(config: LPConfig) {
  const context = getContext(config);

  openWhatsAppModal(
    WHATSAPP_URL,
    {
      lp_slug: config.slug,
      cta_location: "hero",
      cta_label: "hero_guided_whatsapp",
      destination_url: WHATSAPP_URL,
      delivery_intent: context.deliveryIntent,
    },
    buildGuidedWhatsAppMessage({
      pageLabel: context.pageLabel,
      request: context.request,
    }),
    `pagina=${config.slug}`,
  );
}
