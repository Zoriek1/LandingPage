import { openGuidedWhatsApp, openProductWhatsApp } from "@/lib/landing-whatsapp";
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
    deliveryIntent: "entrega hoje em Goiania",
    request: "Quero confirmar disponibilidade para entregar ainda hoje em Goiania.",
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
  "qual-b": {
    pageLabel: "flores do campo e girassol",
    deliveryIntent: "entrega de flores do campo com data combinada",
    request: "Quero ver opcoes de flores do campo e girassol por faixa de preco.",
  },
};

const getContext = (config: LPConfig) =>
  AD_LP_CONTEXT[config.slug] ?? {
    pageLabel: config.vitrineTitle.toLowerCase(),
    deliveryIntent: "entrega em Goiania com data combinada",
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

  openGuidedWhatsApp({
    pageSlug: config.slug,
    pageLabel: context.pageLabel,
    ctaLocation: origin,
    ctaLabel: `${origin}_whatsapp`,
    request: context.request,
  });
}
