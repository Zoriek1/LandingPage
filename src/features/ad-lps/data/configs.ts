import { formatBrl, parsePriceBrl } from "@/features/ad-lps/lib/pricing";

export type Accent = "rose" | "lily" | "sun" | "urgent" | "classic";
export type HeroMode = "overlay" | "standalone";

export type FAQItem = {
  question: string;
  answer: string;
};

export type ProductDetails = {
  flowerCount?: number;
  size?: "P" | "M" | "G";
  heightCm?: number;
  includes?: string[];
};

export type ProductBadge = "mais-vendido" | "custo-beneficio" | "premium";

export type ProductCategory = "rosas" | "lirios" | "girassois" | "campo" | "orquideas" | "astromelias";

export type Product = {
  id: string;
  storeSlug: string;
  name: string;
  priceBrl: string;
  category?: ProductCategory;
  image: string;
  waText: string;
  details?: ProductDetails;
};

export type BrandBonus = {
  icon: "card" | "package" | "truck" | "camera" | "message" | "shield";
  title: string;
  body: string;
};

export type Stat = {
  label: string;
  value: string;
};

export type NossaHistoriaContent = {
  title: string;
  paragraphs: string[];
  imageAlt: string;
  stats?: Stat[];
};

export type CtaOriginKey =
  | "hero"
  | "como_funciona"
  | "faq"
  | "sticky"
  | "final"
  | "guarantee";

export type CtaCopy = Partial<Record<CtaOriginKey, string>> & {
  hero: string;
  final: string;
};

export type GuaranteeContent = {
  badge: string;
  title: string;
  body: string;
  ctaLabel: string;
};

/**
 * Chaves de seção usadas por `LPConfig.sectionOrder`. `diferenciais` é a dupla
 * original ("Por que somos diferentes"); `diferenciais-fundidos` é o bloco único
 * de 4 itens que substitui `diferenciais` + `bonus` nas LPs de conversão.
 */
export type SectionKey =
  | "hero"
  | "guarantee"
  | "vitrine"
  | "social"
  | "diferenciais"
  | "diferenciais-fundidos"
  | "comofunciona"
  | "historia"
  | "bonus"
  | "faq"
  | "final";

/**
 * Espelha a ordem hardcoded original do `AdLandingPage`. Toda LP sem
 * `sectionOrder` renderiza exatamente como antes.
 */
export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "hero",
  "diferenciais",
  "social",
  "vitrine",
  "historia",
  "bonus",
  "faq",
  "guarantee",
  "final",
];

export type LPConfig = {
  slug: string;
  canonicalUrl?: string;
  accent: Accent;
  heroImage: string;
  heroImageAlt: string;
  heroMode: HeroMode;
  headline: string;
  subheadline: string;
  priceAnchor?: string;
  ctaCopy: CtaCopy;
  testimonialOrder: string[];
  vitrineTitle: string;
  vitrineSubtitle: string;
  vitrineProductIds: string[];
  vitrineHighlightId?: string;
  vitrineVisibleCount?: number;
  scarcityMessage?: string;
  faq: FAQItem[];
  nossaHistoria: NossaHistoriaContent;
  pageTitle: string;
  pageDescription: string;
  /** "minimal" remove as âncoras da navbar, deixando logo + nota. Default: "full". */
  navMode?: "full" | "minimal";
  /** Texto do CTA dentro do card de produto. Default: "Quero encomendar pelo WhatsApp". */
  vitrineCardCta?: string;
  /** Default: true. Em false, os depoimentos saem sem avatar de iniciais. */
  showReviewAvatars?: boolean;
  /** Ordem das seções da página. Default: `DEFAULT_SECTION_ORDER`. */
  sectionOrder?: SectionKey[];
  /** FAQ curto renderizado logo abaixo da vitrine (além do FAQ do rodapé). */
  vitrineFaq?: FAQItem[];
  /** Título do bloco `vitrineFaq`. Default: "Dúvidas rápidas". */
  vitrineFaqTitle?: string;
  /** Rótulo extra por produto no card da vitrine (ex.: "Se quiser variar"). */
  vitrineProductNotes?: Record<string, string>;
  /** Selo do rodapé dos depoimentos. Default: "Cliente real no Google". */
  reviewSealText?: string;
  /** Em true, o selo de escassez aparece em todos os produtos, não só nos com badge. */
  scarcityAppliesToAll?: boolean;
  /** Em true, a vitrine mostra filtros de categoria/preço acima da grade. Default: false. */
  vitrineFilters?: boolean;
  /** Mostra a linha dinâmica "Peça até as 18h.../Consulte o próximo horário..." no hero (ver useIsPastCutoff). Default: false. */
  showCutoffCopy?: boolean;
  /** Mostra o link "Ver as N avaliações no Google" (BUSINESS_INFO.googleReviewsUrl) na seção de depoimentos. Default: false. */
  showGoogleReviewsLink?: boolean;
  /** Nome do query param que seleciona a variante (ex.: "oferta", "criativo"). Default: "oferta". */
  variantParam?: string;
  /**
   * Variantes por valor de query param. Cada uma sobrescreve só os campos
   * listados; valores desconhecidos ou parâmetro ausente mantêm a config
   * padrão (ver useResolvedConfig, lib/useQueryVariant.ts).
   */
  variants?: Record<string, LPConfigVariant>;
  /** Só populado depois de useResolvedConfig aplicar uma variante — nunca setado direto numa LPConfig base. */
  variantProductId?: string;
  /**
   * Diferenciais exibidos sob o hero. Default: os textos atuais
   * ("Entrega ou agendamento em Goiânia" / "Encomenda com data combinada" /
   * "Embalagem caprichada e cartão grátis"), com o caso especial do slug
   * `urgencia` ("Entrega hoje em Goiânia") preservado.
   */
  heroBadges?: HeroBadge[];
  /** Faixa comparativa (ex.: Arranjo × Buquê) exibida no topo da vitrine. */
  comparisonStrip?: {
    title?: string;
    options: Array<{
      name: string;
      priceRange: string;
      description: string;
      highlight?: boolean;
    }>;
  };
  /** Em true, cards com tamanho P/M/G ganham rótulo de impacto (delicado/marcante/grande impacto). */
  vitrineShowSize?: boolean;
  /**
   * Ação do CTA principal do hero. Default: "price-range" (abre o seletor de
   * faixa de preço). "scroll-vitrine" rola até a vitrine (#vitrine) — também
   * funciona sem JavaScript via âncora.
   */
  heroCtaAction?: "price-range" | "scroll-vitrine";
  /**
   * Botão secundário do hero. Default: { label: "Ver produtos", action:
   * "scroll-vitrine" }. "guided-whatsapp" abre o WhatsApp com mensagem guiada.
   */
  heroSecondaryCta?: {
    label: string;
    action: "scroll-vitrine" | "guided-whatsapp";
  };
  /**
   * Faixa de urgência operacional exibida sob os CTAs do hero.
   * Antes do corte → beforeCutoff; depois → afterCutoff.
   * Corte: 18h seg–sex, 13h sáb; domingo nunca promete "entrega hoje"
   * (horário America/Sao_Paulo).
   */
  urgencyWindow?: { beforeCutoff: string; afterCutoff: string };
};

export type LPConfigVariant = Partial<
  Pick<LPConfig, "headline" | "subheadline" | "priceAnchor" | "vitrineHighlightId" | "testimonialOrder">
> & {
  /** Produto do criativo: reordena a vitrine, ativa o selo "Visto no anúncio" e o CTA direto pro WhatsApp. */
  variantProductId?: string;
};

export type HeroBadge = {
  text: string;
  icon?: "truck" | "calendar" | "sparkles" | "camera";
};

export const BRAND_DOMAIN = "lpb.planteumaflor.com";
export const WHATSAPP_NUMBER = "5562996503403";
export const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const GLOBAL_CONFIG = {
  brandName: "Plante Uma Flor",
  brandTagline: "Floricultura",
  googleRating: "4.9",
  googleReviewsCount: "184",
  cityRegion: "Goiânia e região metropolitana",
} as const;

export const COMMON_FAQ: FAQItem[] = [
  {
    question: "Posso agendar para outro dia?",
    answer:
      "Pode sim. Você diz a data no WhatsApp e a gente já bloqueia ali na agenda. Em datas comemorativas a gente confirma o horário com antecedência pra não dar nenhum aperto.",
  },
  {
    question: "O buquê vai igual à foto?",
    answer:
      "Vai. E pra você ter certeza, antes de sair pra entrega a gente manda uma foto real do arranjo pronto. Só sai depois que você aprovar.",
  },
  {
    question: "Vocês enviam foto antes de entregar?",
    answer:
      "Sempre. É padrão da casa. Você recebe a foto do buquê real pelo WhatsApp e libera a entrega antes da gente sair com ele.",
  },
  {
    question: "Como funciona o pedido?",
    answer:
      "É bem simples: você chama a gente no WhatsApp dizendo qual flor te chamou atenção, a data e o endereço. Em poucos minutos a gente confirma o valor, combina o horário e ainda escreve o cartão pra você.",
  },
  {
    question: "Como posso pagar?",
    answer:
      "Pix, cartão de crédito em até 3x sem juros, débito ou dinheiro na hora da entrega. Você escolhe o que ficar melhor. A gente acerta tudo no WhatsApp.",
  },
  {
    question: "Vocês entregam onde?",
    answer:
      "Goiânia inteira, Aparecida de Goiânia e Senador Canedo. Se você for de outra região, manda o CEP que a gente confere pra você.",
  },
];

export const DEFAULT_NOSSA_HISTORIA: NossaHistoriaContent = {
  title: "Quatro décadas plantando flores em Goiânia.",
  paragraphs: [
    "A Plante Uma Flor é uma família de floricultores tradicional de Goiânia há 40 anos. Começamos pequenininhos, vendendo rosas no bairro, e seguimos com o mesmo princípio: cada buquê sai daqui como se fosse pra alguém da nossa família.",
    "Hoje a gente recebe flor direto do produtor três vezes por semana, monta na hora e ainda manda foto do arranjo pronto antes da entrega. Não é mágica — é cuidado de quem faz isso desde sempre.",
  ],
  imageAlt: "Fachada da Plante Uma Flor em Goiânia",
  stats: [
    { label: "Buquês entregues", value: "+3.000" },
    { label: "Tradição em Goiânia", value: "40 anos" },
    { label: "Avaliação no Google", value: "4.9 ★" },
  ],
};

export const BRAND_BONUS: BrandBonus[] = [
  {
    icon: "truck",
    title: "Entrega no mesmo dia",
    body: "Goiânia, Aparecida e Senador Canedo. Pedido até 16h sai hoje.",
  },
  {
    icon: "camera",
    title: "Foto real antes do envio",
    body: "Você aprova o buquê pelo WhatsApp antes da gente sair pra entrega.",
  },
  {
    icon: "card",
    title: "Cartão personalizado grátis",
    body: "Você manda o recado e a gente escreve à mão pra entregar junto.",
  },
  {
    icon: "message",
    title: "Atendimento humano",
    body: "Sem bot, sem espera. Quem responde no WhatsApp é da floricultura.",
  },
  {
    icon: "shield",
    title: "Garantia de satisfação",
    body: "Não gostou? A gente refaz, troca ou devolve o valor no mesmo dia.",
  },
];

export const GUARANTEE: GuaranteeContent = {
  badge: "Garantia Plante Uma Flor",
  title: "Você aprova a foto antes da entrega.",
  body:
    "Antes de sair da loja, mandamos a foto real do arranjo pronto. Se algo não sair como combinado, resolvemos no mesmo dia pelo WhatsApp.",
  ctaLabel: "Ver detalhes da garantia",
};

export const PRODUCTS: Record<string, Product> = {
  "arranjo-mao-rosas": {
    id: "arranjo-mao-rosas",
    storeSlug: "arranjo-de-mao-rosas",
    name: "Arranjo de Mão Rosas Vermelhas",
    priceBrl: "R$ 99,90",
    category: "rosas",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/4-9c54ee7764b808caff17739768549369-1024-1024.webp",
    waText: "Oi! Quero o Arranjo de Mão Rosas Vermelhas (R$ 99,90).",
    details: {
      flowerCount: 3,
      size: "P",
      heightCm: 30,
      includes: ["Cartão à mão", "Embalagem artesanal"],
    },
  },
  "arranjo-4-rosas-ferrero": {
    id: "arranjo-4-rosas-ferrero",
    storeSlug: "arranjo-de-mao-4-rosas-vermelhas-balao-vermelho-4uni-ferrero",
    name: "Arranjo 4 Rosas com Balão e Ferrero",
    priceBrl: "R$ 199,90",
    category: "rosas",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/101-a8d58e663b48716da117589320248185-1024-1024.webp",
    waText: "Oi! Quero o Arranjo 4 Rosas com Balão e Ferrero (R$ 199,90).",
    details: {
      flowerCount: 4,
      size: "P",
      heightCm: 35,
      includes: ["4 Ferrero Rocher", "Balão", "Cartão à mão"],
    },
  },
  "buque-classico-rosas": {
    id: "buque-classico-rosas",
    storeSlug: "buque-classico-rosas",
    name: "Buquê Clássico de Rosas Vermelhas",
    priceBrl: "R$ 249,90",
    category: "rosas",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/buque-classico-rosas-d2fa59866d0ab5edcd17739777570911-1024-1024.webp",
    waText: "Oi! Quero o Buquê Clássico de Rosas Vermelhas (R$ 249,90).",
    details: {
      flowerCount: 12,
      size: "M",
      heightCm: 40,
      includes: ["Papel artesanal", "Cartão à mão"],
    },
  },
  "buque-12-rosas-rosa": {
    id: "buque-12-rosas-rosa",
    storeSlug: "buque-12-rosas-rosa",
    name: "Buquê de 12 Rosas Cor de Rosa",
    priceBrl: "R$ 289,90",
    category: "rosas",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/22-5d679a53a5b0b1108917739795779563-1024-1024.webp",
    waText: "Oi! Quero o Buquê de 12 Rosas Cor de Rosa (R$ 289,90).",
    details: {
      flowerCount: 12,
      size: "M",
      heightCm: 45,
      includes: ["Papel artesanal", "Fita de cetim", "Cartão à mão"],
    },
  },
  "buque-rosas-astromelias": {
    id: "buque-rosas-astromelias",
    storeSlug: "buque-rosas-astromelias",
    name: "Buquê de Rosas com Astromélias",
    priceBrl: "R$ 199,90",
    category: "rosas",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/92-b8cda4a238fee8ca5f17739802507996-1024-1024.webp",
    waText: "Oi! Quero o Buquê de Rosas com Astromélias (R$ 199,90).",
    details: {
      flowerCount: 6,
      size: "M",
      heightCm: 42,
      includes: ["Astromélias mistas", "Cartão à mão"],
    },
  },
  "box-rosas": {
    id: "box-rosas",
    storeSlug: "box-coracao-rosas",
    name: "Box Coração de Rosas Vermelhas",
    priceBrl: "R$ 680,00",
    category: "rosas",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/71-3785d54256d5ef690217739784959341-1024-1024.webp",
    waText: "Oi! Quero o Box Coração de Rosas Vermelhas (R$ 680,00).",
    details: {
      flowerCount: 50,
      size: "G",
      heightCm: 28,
      includes: ["Caixa em formato de coração", "Cartão à mão"],
    },
  },
  "buque-30-rosas": {
    id: "buque-30-rosas",
    storeSlug: "buque-30-rosas",
    name: "Buquê Especial 30 Rosas Vermelhas",
    priceBrl: "R$ 680,00",
    category: "rosas",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/buques-jutninhos-4-80740d0bed120f8d2c17739790243094-1024-1024.webp",
    waText: "Oi! Quero o Buquê Especial 30 Rosas Vermelhas (R$ 680,00).",
    details: {
      flowerCount: 30,
      size: "G",
      heightCm: 55,
      includes: ["Papel artesanal", "Fita de cetim", "Cartão à mão"],
    },
  },
  "arranjo-mao-lirios-p": {
    id: "arranjo-mao-lirios-p",
    storeSlug: "arranjo-mao-lirios",
    name: "Arranjo de Mão Lírios P",
    priceBrl: "R$ 159,90",
    category: "lirios",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/38-1223af3425b904cf2917739779596922-1024-1024.webp",
    waText: "Oi! Quero o Arranjo de Mão Lírios P (R$ 159,90).",
    details: {
      size: "P",
      heightCm: 35,
      includes: ["Papel jornal artesanal", "Cartão à mão"],
    },
  },
  "arranjo-mao-lirios-m": {
    id: "arranjo-mao-lirios-m",
    storeSlug: "arranjo-mao-lirios",
    name: "Arranjo de Mão Lírios M",
    priceBrl: "R$ 229,90",
    category: "lirios",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/41-28b68fc71bb1cd62fc17739779592690-1024-1024.webp",
    waText: "Oi! Quero o Arranjo de Mão Lírios M (R$ 229,90).",
    details: {
      size: "M",
      heightCm: 42,
      includes: ["Papel jornal artesanal", "Cartão à mão"],
    },
  },
  "arranjo-mao-lirios-g": {
    id: "arranjo-mao-lirios-g",
    storeSlug: "arranjo-mao-lirios",
    name: "Arranjo de Mão Lírios G",
    priceBrl: "R$ 289,90",
    category: "lirios",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/19-55fd9b51dfb250f77017739779598056-1024-1024.webp",
    waText: "Oi! Quero o Arranjo de Mão Lírios G (R$ 289,90).",
    details: {
      size: "G",
      heightCm: 50,
      includes: ["Papel jornal artesanal", "Cartão à mão"],
    },
  },
  "buque-lirios-m": {
    id: "buque-lirios-m",
    storeSlug: "buque-lirios",
    name: "Buquê de Lírios M",
    priceBrl: "R$ 399,90",
    category: "lirios",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/25-a22098d763e0c73efe17739780254780-640-0.webp",
    waText: "Oi! Quero o Buquê de Lírios M (R$ 399,90).",
    details: {
      size: "M",
      heightCm: 50,
      includes: ["Papel artesanal", "Fita de cetim", "Cartão à mão"],
    },
  },
  "buque-lirios-p": {
    id: "buque-lirios-p",
    storeSlug: "buque-lirios",
    name: "Buquê de Lírios P",
    priceBrl: "R$ 299,90",
    category: "lirios",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/8-d0ddc261ebbf23879a17739780251538-640-0.webp",
    waText: "Oi! Quero o Buquê de Lírios P (R$ 299,90).",
    details: {
      size: "P",
      heightCm: 42,
      includes: ["Papel artesanal", "Fita de cetim", "Cartão à mão"],
    },
  },
  "buque-lirios-g": {
    id: "buque-lirios-g",
    storeSlug: "buque-lirios",
    name: "Buquê de Lírios G",
    priceBrl: "R$ 459,90",
    category: "lirios",
    // P1.4: foto própria do tamanho G — antes era a mesma foto do M.
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/img_1193-c66f40f582ce89780617745668131555-640-0.webp",
    waText: "Oi! Quero o Buquê de Lírios G (R$ 459,90).",
    details: {
      size: "G",
      heightCm: 60,
      includes: ["Papel artesanal", "Fita de cetim", "Cartão à mão"],
    },
  },
  "girassol-avulso": {
    id: "girassol-avulso",
    storeSlug: "girassol-avulso",
    name: "Girassol Avulso",
    priceBrl: "R$ 65,00",
    category: "girassois",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/1c7815aceda84b7a9d73eee1083c5282-2bd7098f1afe7dac8c17580374273171-640-0-160efa30343dc676a817739814757412-1024-1024.webp",
    waText: "Oi! Quero o Girassol Avulso (R$ 65,00).",
    details: {
      flowerCount: 1,
      size: "P",
      heightCm: 30,
      includes: ["Cone de papel artesanal", "Cartão à mão"],
    },
  },
  "arranjo-2-girassois-balao": {
    id: "arranjo-2-girassois-balao",
    storeSlug: "arranjo-de-mao-2-girassois-com-balao-vermelho",
    name: "Arranjo 2 Girassóis com Balão",
    priceBrl: "R$ 109,90",
    category: "girassois",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/167-3ad6b0b2fafcecba1b17589313460597-1024-1024.webp",
    waText: "Oi! Quero o Arranjo 2 Girassóis com Balão (R$ 109,90).",
    details: {
      flowerCount: 2,
      size: "P",
      heightCm: 35,
      includes: ["Balão", "Cartão à mão"],
    },
  },
  "buque-girassois-g": {
    id: "buque-girassois-g",
    storeSlug: "buque-girassois",
    name: "Buquê de Girassóis G",
    priceBrl: "R$ 349,90",
    category: "girassois",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/buques-girassois-11a187c671891055bd17739793692651-1024-1024.webp",
    waText: "Oi! Quero o Buquê de Girassóis G (R$ 349,90).",
    details: {
      flowerCount: 12,
      size: "G",
      heightCm: 50,
      includes: ["Papel artesanal", "Cartão à mão"],
    },
  },
  "buque-girassois-m": {
    id: "buque-girassois-m",
    storeSlug: "buque-girassois",
    name: "Buquê de Girassóis M",
    priceBrl: "R$ 289,90",
    category: "girassois",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/buques-girassois-6-7c3a8b93a303d808f317739793693990-640-0.webp",
    waText: "Oi! Quero o Buquê de Girassóis M (R$ 289,90).",
    details: {
      flowerCount: 8,
      size: "M",
      heightCm: 48,
      includes: ["Papel artesanal", "Fita de cetim", "Cartão à mão"],
    },
  },
  "buque-girassois-p": {
    id: "buque-girassois-p",
    storeSlug: "buque-girassois",
    name: "Buquê de Girassóis P",
    priceBrl: "R$ 199,90",
    category: "girassois",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/buques-girassois-5-e6bcb94fdf9fd460fe17739793690718-640-0.webp",
    waText: "Oi! Quero o Buquê de Girassóis P (R$ 199,90).",
    details: {
      flowerCount: 6,
      size: "P",
      heightCm: 40,
      includes: ["Papel artesanal", "Cartão à mão"],
    },
  },
  "buque-flor-campo-m": {
    id: "buque-flor-campo-m",
    storeSlug: "buque-flores-campo",
    name: "Buquê Flores do Campo M",
    priceBrl: "R$ 259,90",
    category: "campo",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/29-2c5abf4e632797dc4f17739781849711-640-0.webp",
    waText: "Oi! Quero o Buquê Flores do Campo M (R$ 259,90).",
    details: {
      size: "M",
      heightCm: 45,
      includes: ["Mix de flores do campo", "Papel artesanal", "Cartão à mão"],
    },
  },
  "buque-flor-campo-girassol": {
    id: "buque-flor-campo-girassol",
    storeSlug: "buque-flores-campo-girassol",
    name: "Buquê Flores do Campo com Girassol",
    priceBrl: "R$ 159,90",
    category: "girassois",
    image: "https://acdn-us.mitiendanube.com/stores/006/718/510/products/115-6a4f27189d7ec8b6cb17739800780178-1024-1024.webp",
    waText: "Oi! Quero o Buquê Flores do Campo com Girassol (R$ 159,90).",
    details: {
      includes: ["Mix de flores do campo", "Girassol", "Papel artesanal", "Cartão à mão"],
    },
  },
  "orquidea-mini-phaleanopsis": {
    id: "orquidea-mini-phaleanopsis",
    storeSlug: "orquidea-mini-phaleanopsis",
    name: "Orquídea Mini Phalaenopsis",
    priceBrl: "R$ 135,00",
    category: "orquideas",
    image: "/lpb/products/orquidea-mini-phaleanopsis.jpg",
    waText: "Oi! Quero a Orquídea Mini Phalaenopsis (R$ 135,00).",
    details: {
      includes: ["Embalagem decorada", "Cartão à mão"],
    },
  },
  "rosa-astromelia-unitaria": {
    id: "rosa-astromelia-unitaria",
    storeSlug: "rosa-astromelia-unitaria",
    name: "Rosa Unitária com Astromélia",
    priceBrl: "R$ 65,00",
    category: "rosas",
    image: "/lpb/products/rosa-astromelia-unitaria.jpg",
    waText: "Oi! Quero a Rosa Unitária com Astromélia (R$ 65,00).",
    details: {
      flowerCount: 1,
      includes: ["Papel artesanal", "Cartão à mão"],
    },
  },
  "cone-astromelia": {
    id: "cone-astromelia",
    storeSlug: "cone-astromelia",
    name: "Cone de Astromélia",
    priceBrl: "R$ 124,90",
    category: "astromelias",
    image: "/lpb/products/cone-astromelia.jpg",
    waText: "Oi! Quero o Cone de Astromélia (R$ 124,90).",
    details: {
      includes: ["Embalagem em cone", "Cartão à mão"],
    },
  },
};

export function inferProductBadge(
  product: Product,
  allInLp: Product[],
  highlightId?: string,
): ProductBadge | undefined {
  if (highlightId && product.id === highlightId) return "mais-vendido";
  if (allInLp.length < 2) return undefined;
  const sorted = [...allInLp].sort(
    (a, b) => parsePriceBrl(a.priceBrl) - parsePriceBrl(b.priceBrl),
  );
  const cheapest = sorted[0];
  const priciest = sorted[sorted.length - 1];
  if (product.id === cheapest.id && product.id !== highlightId) {
    return "custo-beneficio";
  }
  if (product.id === priciest.id && product.id !== highlightId) {
    return "premium";
  }
  return undefined;
}

export const LP_CONFIGS: Record<string, LPConfig> = {
  "dia-das-maes": {
    slug: "dia-das-maes",
    canonicalUrl: "https://www.planteumaflor.com/dia-das-maes/",
    accent: "classic",
    heroImage: "/dia-das-maes/og-maes.jpg",
    heroImageAlt: "Buquê artesanal preparado para presentear no Dia das Mães",
    heroMode: "overlay",
    headline: "Flores para tornar o Dia das Mães inesquecível.",
    subheadline:
      "Escolha um buquê, uma cesta ou uma planta e combine tudo pelo WhatsApp. A gente prepara com carinho, escreve o cartão à mão e envia uma foto antes da entrega.",
    priceAnchor: "Opções a partir de R$ 99,90",
    scarcityMessage: "Agenda da data sujeita à disponibilidade",
    vitrineVisibleCount: 6,
    ctaCopy: {
      hero: "Escolher o presente da minha mãe",
      como_funciona: "Combinar a entrega",
      faq: "Tirar uma dúvida",
      sticky: "Ver opções",
      final: "Encomendar pelo WhatsApp",
      guarantee: "Ver detalhes da garantia",
    },
    testimonialOrder: ["hellen-araujo", "taina-santos", "rafaella-martins"],
    vitrineTitle: "Presentes para o Dia das Mães",
    vitrineSubtitle:
      "Escolhas delicadas, montadas à mão e prontas para emocionar.",
    vitrineProductIds: [
      "arranjo-mao-rosas",
      "arranjo-mao-lirios-m",
      "buque-flor-campo-m",
      "buque-12-rosas-rosa",
      "buque-lirios-m",
      "buque-girassois-p",
      "box-rosas",
    ],
    vitrineHighlightId: "buque-flor-campo-m",
    faq: [
      {
        question: "Posso agendar a entrega para o Dia das Mães?",
        answer:
          "Pode sim. Chame no WhatsApp com o bairro e o melhor período. A gente consulta a agenda e confirma a janela disponível antes de fechar o pedido.",
      },
      {
        question: "O cartão personalizado está incluído?",
        answer:
          "Está. Você manda a mensagem pelo WhatsApp e a gente escreve o cartão à mão, sem custo adicional.",
      },
      {
        question: "Vou ver o presente antes da entrega?",
        answer:
          "Sim. Enviamos uma foto real do arranjo pronto para você aprovar antes de ele sair da loja.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Flores para o Dia das Mães em Goiânia | Plante Uma Flor",
    pageDescription:
      "Buquês, cestas e plantas para o Dia das Mães em Goiânia. Encomende pelo WhatsApp, receba foto antes do envio e inclua cartão escrito à mão.",
  },
  "dia-dos-namorados": {
    slug: "dia-dos-namorados",
    canonicalUrl: "https://www.planteumaflor.com/dia-dos-namorados/",
    accent: "rose",
    heroImage: "/lpb/heros/rosas-apt.jpg",
    heroImageAlt: "Buquê romântico de rosas vermelhas para o Dia dos Namorados",
    heroMode: "overlay",
    headline: "Um presente à altura da sua história de amor.",
    subheadline:
      "Escolha o arranjo, mande o recado do cartão e combine a entrega pelo WhatsApp. Antes de sair da loja, a gente envia uma foto real para você aprovar.",
    priceAnchor: "Buquês a partir de R$ 99,90",
    scarcityMessage: "Agenda do dia 12 sujeita à disponibilidade",
    vitrineVisibleCount: 6,
    ctaCopy: {
      hero: "Escolher o presente",
      como_funciona: "Combinar a surpresa",
      faq: "Tirar uma dúvida",
      sticky: "Ver buquês",
      final: "Encomendar pelo WhatsApp",
      guarantee: "Ver detalhes da garantia",
    },
    testimonialOrder: ["rafaella-martins", "hellen-araujo", "taina-santos"],
    vitrineTitle: "Favoritos para o Dia dos Namorados",
    vitrineSubtitle:
      "Dos gestos delicados aos buquês que impressionam de verdade.",
    vitrineProductIds: [
      "arranjo-mao-rosas",
      "arranjo-4-rosas-ferrero",
      "buque-classico-rosas",
      "buque-12-rosas-rosa",
      "buque-rosas-astromelias",
      "box-rosas",
      "buque-30-rosas",
    ],
    vitrineHighlightId: "buque-rosas-astromelias",
    faq: [
      {
        question: "Consigo agendar para o dia 12 de junho?",
        answer:
          "Sim, enquanto houver horário disponível. Chame no WhatsApp com o bairro e o período desejado para a gente confirmar a agenda.",
      },
      {
        question: "Posso mandar uma mensagem romântica no cartão?",
        answer:
          "Claro. Você envia o texto pelo WhatsApp e a gente escreve à mão para acompanhar o presente, sem custo adicional.",
      },
      {
        question: "O buquê vai igual ao anunciado?",
        answer:
          "Antes da entrega, enviamos a foto real do buquê pronto. Você confere e aprova antes de ele sair da floricultura.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Flores para o Dia dos Namorados em Goiânia | Plante Uma Flor",
    pageDescription:
      "Buquês e presentes para o Dia dos Namorados em Goiânia. Combine a entrega pelo WhatsApp, receba foto antes do envio e inclua cartão escrito à mão.",
  },
  urgencia: {
    slug: "urgencia",
    accent: "urgent",
    heroImage: "/lpb/heros/urgencia.jpg",
    heroImageAlt: "Buquê de rosas vermelhas com alstroemérias brancas em embalagem vermelha",
    heroMode: "overlay",
    headline: "Esqueceu a data? Ainda dá tempo.",
    subheadline:
      "Você fecha o pedido até 18h de segunda a sexta (13h no sábado) e a gente entrega hoje em Goiânia. Tudo embalado com capricho e cartão escrito à mão, sem cobrar nada a mais.",
    priceAnchor: "Entrega hoje",
    scarcityMessage: "Pedido até 18h sai hoje",
    scarcityAppliesToAll: true,
    vitrineVisibleCount: 6,
    navMode: "minimal",
    showReviewAvatars: false,
    reviewSealText: "Avaliação pública no Google",
    vitrineCardCta: "Escolher este e comprar no WhatsApp",
    sectionOrder: [
      "hero",
      "guarantee",
      "vitrine",
      "social",
      "diferenciais-fundidos",
      "comofunciona",
      "historia",
      "faq",
      "final",
    ],
    ctaCopy: {
      hero: "Comprar no WhatsApp",
      como_funciona: "Comprar no WhatsApp",
      faq: "Comprar no WhatsApp",
      sticky: "Comprar no WhatsApp",
      final: "Quero presentear hoje",
      guarantee: "Ver detalhes da garantia",
    },
    // melissa/marcos falam de resposta rápida e entrega na hora combinada:
    // é o reforço de prazo que essa página promete no hero.
    testimonialOrder: ["melissa-pimentel", "marcos-vinicius", "rafaella-martins"],
    vitrineTitle: "Sai para entrega hoje mesmo",
    vitrineSubtitle: "Tudo aqui é montado na hora, com flor recebida direto do produtor.",
    vitrineProductIds: [
      "buque-classico-rosas",
      "arranjo-mao-lirios-m",
      "arranjo-mao-rosas",
      "buque-rosas-astromelias",
      "buque-lirios-m",
      "buque-girassois-g",
    ],
    vitrineHighlightId: "buque-classico-rosas",
    faq: [
      {
        question: "Dá tempo mesmo de chegar hoje?",
        answer:
          "Se você fechar o pedido até 18h de segunda a sexta, dá sim. No sábado o corte é 13h. Domingo e feriado a gente não abre — nesses dias dá pra deixar agendado para o próximo dia útil. Em Goiânia e região, em 10 minutinhos a gente confirma a janela de entrega pelo WhatsApp.",
      },
      {
        question: "Dá pra escrever um recado no cartão?",
        answer:
          "Claro, sem custo. Você manda a mensagem no WhatsApp e a gente escreve no cartão à mão pra entregar junto.",
      },
      // Fica por último de propósito: é a única pergunta que pode desqualificar
      // o visitante, e ela não precisa aparecer antes da decisão.
      {
        question: "E se eu não estiver em Goiânia?",
        answer:
          "A gente também entrega em Aparecida de Goiânia e Senador Canedo. Manda seu CEP no WhatsApp que a gente confirma na hora.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Flores com entrega hoje em Goiânia | Plante Uma Flor",
    pageDescription:
      "Esqueceu a data? Ainda dá tempo. Pedido até 18h de segunda a sexta e a gente entrega hoje em Goiânia. Embalagem caprichada e cartão escrito à mão, por nossa conta.",
  },
  aniversario: {
    slug: "aniversario",
    accent: "classic",
    heroImage: "/lpb/heros/aniversario.jpg",
    heroImageAlt: "Buquê multicolorido de flores do campo com girassóis para aniversário",
    heroMode: "overlay",
    headline: "Um presente que diz tudo, no dia certo.",
    subheadline:
      "Você escolhe a data e a gente entrega em Goiânia. Buquê montado com capricho e cartão escrito à mão. Por nossa conta.",
    priceAnchor: "Agende a data com a gente",
    scarcityMessage: "Alta demanda nesta data",
    vitrineVisibleCount: 6,
    ctaCopy: {
      hero: "Quero surpreender",
      como_funciona: "Agendar pelo WhatsApp",
      faq: "Quero confirmar disponibilidade",
      sticky: "Agendar agora",
      final: "Quero agendar",
      guarantee: "Ver detalhes da garantia",
    },
    testimonialOrder: ["hellen-araujo", "rafaella-martins", "taina-santos"],
    vitrineTitle: "Buquês para aniversário",
    vitrineSubtitle: "Do clássico ao surpreendente. Escolhe o que combina com ela.",
    vitrineProductIds: [
      "buque-rosas-astromelias",
      "buque-12-rosas-rosa",
      "buque-flor-campo-m",
      "buque-girassois-p",
      "buque-lirios-m",
      "buque-classico-rosas",
      "box-rosas",
      "buque-30-rosas",
    ],
    vitrineHighlightId: "buque-rosas-astromelias",
    faq: [
      {
        question: "Como faço pra agendar o dia exato?",
        answer:
          "É só chamar a gente no WhatsApp e dizer a data. A gente confirma o horário com você e entrega no dia combinado, sem stress.",
      },
      {
        question: "E se ela não estiver em casa na hora?",
        answer:
          "A gente combina o melhor horário com você. Se mesmo assim ela não estiver, podemos deixar com o porteiro ou vizinho. Sempre com a sua autorização.",
      },
      {
        question: "Dá pra mandar com cartão escrito à mão?",
        answer:
          "Dá sim, e é cortesia da casa. Você manda a mensagem no WhatsApp e a gente escreve em letra cursiva pra entregar junto.",
      },
      {
        question: "Vocês entregam em Aparecida?",
        answer:
          "Entregamos sim. Atendemos Goiânia, Aparecida de Goiânia e Senador Canedo. Manda o CEP que a gente confirma rapidinho.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Flores para Aniversário em Goiânia | Plante Uma Flor",
    pageDescription:
      "Buquês de aniversário com entrega agendada em Goiânia. Embalagem caprichada, cartão escrito à mão e entrega no dia que você combinar.",
  },
  "rosas-apt": {
    slug: "rosas-apt",
    accent: "rose",
    heroImage: "/lpb/heros/rosas-apt.jpg",
    heroImageAlt: "Buquê de rosas vermelhas com alstroemérias brancas",
    heroMode: "standalone",
    headline: "Buquê de rosas a partir de R$ 99,90.",
    subheadline:
      "Você manda rosas em Goiânia com data combinada, embalagem caprichada e cartão escrito à mão. Sem cobrar a parte.",
    priceAnchor: "A partir de R$ 99,90",
    vitrineVisibleCount: 6,
    ctaCopy: {
      hero: "Quero presentear hoje",
      como_funciona: "Falar com a floricultura",
      faq: "Quero ajuda para escolher",
      sticky: "Pedir agora",
      final: "Encomendar agora",
      guarantee: "Ver detalhes da garantia",
    },
    testimonialOrder: ["rafaella-martins", "hellen-araujo", "taina-santos"],
    vitrineTitle: "Buquês de rosas",
    vitrineSubtitle: "Do menor ao maior. Todas frescas, vindas direto do produtor.",
    vitrineProductIds: [
      "arranjo-mao-rosas",
      "arranjo-4-rosas-ferrero",
      "buque-classico-rosas",
      "buque-12-rosas-rosa",
      "buque-rosas-astromelias",
      "box-rosas",
      "buque-30-rosas",
    ],
    vitrineHighlightId: "buque-12-rosas-rosa",
    faq: [
      {
        question: "Tem rosa mais em conta que isso?",
        answer:
          "Tem sim. A gente tem rosa unitária a partir de R$ 26,90 e arranjos de mão a partir de R$ 99,90. O anúncio mostra um destaque, mas a vitrine inteira está aqui em cima pra você comparar.",
      },
      {
        question: "Consigo receber hoje mesmo?",
        answer:
          "Consegue. Se você fechar o pedido até 16h, a gente entrega ainda hoje em Goiânia e região.",
      },
      {
        question: "As rosas são frescas mesmo?",
        answer:
          "São. A gente recebe rosas três vezes por semana direto do produtor, então o que você leva foi colhido faz pouquíssimo tempo.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Buquê de Rosas a partir de R$ 99,90 | Plante Uma Flor",
    pageDescription:
      "Rosas vermelhas frescas, entregues hoje em Goiânia. A partir de R$ 99,90, com embalagem caprichada e cartão escrito à mão por conta da casa.",
  },
  "lirios-apt": {
    slug: "lirios-apt",
    accent: "lily",
    heroImage: "/lpb/heros/lirios-apt.jpg",
    heroImageAlt: "Buquê de lírios rosa em papel jornal artesanal",
    heroMode: "standalone",
    headline: "Lírios a partir de R$ 159,90.",
    subheadline:
      "Você encomenda lírios em Goiânia e a gente entrega hoje — ou agenda a data que preferir. Papel artesanal e cartão escrito à mão no capricho.",
    priceAnchor: "A partir de R$ 159,90",
    // P1.1: fotos reais e carta escrita à mão entram nos diferenciais do hero.
    heroBadges: [
      { text: "Entrega hoje ou agendada em Goiânia", icon: "truck" },
      { text: "Você aprova a foto real antes da entrega", icon: "camera" },
      { text: "Embalagem caprichada e cartão escrito à mão grátis", icon: "sparkles" },
    ],
    // P1.2: comparação direta entre as duas famílias de lírios logo acima da grade.
    comparisonStrip: {
      options: [
        {
          name: "Arranjo de Mão",
          priceRange: "R$ 159,90–289,90",
          description: "Melhor custo-benefício e presente delicado",
        },
        {
          name: "Buquê de Lírios",
          priceRange: "R$ 299,90–459,90",
          description: "Mais volume, acabamento premium e maior impacto",
        },
      ],
    },
    vitrineVisibleCount: 6,
    // P1.3: os três tamanhos ganham leitura de impacto no card, sem trocar fotos.
    vitrineShowSize: true,
    navMode: "minimal",
    showReviewAvatars: false,
    reviewSealText: "Avaliação pública no Google",
    vitrineCardCta: "Escolher este e comprar no WhatsApp",
    sectionOrder: [
      "hero",
      "guarantee",
      "vitrine",
      "social",
      "diferenciais-fundidos",
      "comofunciona",
      "historia",
      "faq",
      "final",
    ],
    ctaCopy: {
      hero: "Comprar no WhatsApp",
      como_funciona: "Comprar no WhatsApp",
      faq: "Quero encomendar meus lírios",
      sticky: "Comprar no WhatsApp",
      final: "Quero encomendar",
      guarantee: "Ver detalhes da garantia",
    },
    // sffart-gamer é a única avaliação que fala de perfume ("cheirosas") e não
    // cita rosas — é o destaque coerente numa página de lírios.
    testimonialOrder: ["sffart-gamer", "taina-santos", "hellen-araujo"],
    vitrineTitle: "Buquês de lírios",
    vitrineSubtitle: "Perfume marcante, presença única. Daquelas flores que se sentem antes mesmo de ver.",
    // Rosa vermelha e flor-do-campo cortavam a leitura de preço dos lírios no
    // meio da grade; ficam no fim, rotuladas como alternativa.
    vitrineProductIds: [
      "arranjo-mao-lirios-p",
      "arranjo-mao-lirios-m",
      "arranjo-mao-lirios-g",
      "buque-lirios-p",
      "buque-lirios-m",
      "buque-lirios-g",
      "buque-rosas-astromelias",
      "buque-flor-campo-m",
    ],
    vitrineHighlightId: "arranjo-mao-lirios-m",
    vitrineProductNotes: {
      "buque-rosas-astromelias": "Se quiser variar",
      "buque-flor-campo-m": "Se quiser variar",
    },
    vitrineFaqTitle: "Dúvidas sobre lírios",
    vitrineFaq: [
      {
        question: "Lírios duram menos que rosas?",
        answer:
          "Não. Com cuidado básico, lírios duram de 7 a 10 dias bonitos. A gente já manda as dicas de conservação junto com o buquê.",
      },
      {
        question: "Tem outras cores além de rosa?",
        answer:
          "Tem sim, depende do que chegou no dia. Pergunta pra gente no WhatsApp que mando foto na hora.",
      },
      {
        question: "O perfume é forte mesmo?",
        answer:
          "É marcante. É uma das coisas que as pessoas mais amam neles. Pra ambientes pequenos e fechados, é melhor pensar duas vezes; pra sala, escritório ou varanda, é perfeito.",
      },
    ],
    // As três perguntas de lírio subiram para `vitrineFaq`, coladas na grade.
    faq: [],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Lírios a partir de R$ 159,90 | Plante Uma Flor",
    pageDescription:
      "Lírios em papel artesanal, entregues hoje em Goiânia. A partir de R$ 159,90, com cartão escrito à mão por conta da casa.",
  },
  "carro-low": {
    slug: "carro-low",
    accent: "sun",
    heroImage: "/lpb/heros/carro-low.jpg",
    heroImageAlt: "Girassol unitário no cone",
    heroMode: "overlay",
    headline: "Presente do dia: bonito sem pesar no bolso.",
    subheadline:
      "Arranjos a partir de R$ 65,00, com foco no que cabe em até R$ 149,90. Mesmo capricho dos buquês grandes: embalagem artesanal e cartão escrito à mão por nossa conta.",
    priceAnchor: "A partir de R$ 65,00",
    vitrineVisibleCount: 6,
    ctaCopy: {
      hero: "Quero ver opções",
      como_funciona: "Combinar entrega",
      faq: "Quero ajuda para escolher",
      sticky: "Ver opções até R$ 149,90",
      final: "Encomendar agora",
      guarantee: "Ver detalhes da garantia",
    },
    testimonialOrder: ["taina-santos", "hellen-araujo", "rafaella-martins"],
    vitrineTitle: "Presentes do dia",
    vitrineSubtitle: "Os mais em conta primeiro. Tamanho ideal pra mesa, cabeceira ou escritório.",
    vitrineProductIds: [
      "girassol-avulso",
      "arranjo-2-girassois-balao",
      "arranjo-mao-rosas",
      "arranjo-mao-lirios-p",
      "buque-rosas-astromelias",
      "arranjo-4-rosas-ferrero",
    ],
    vitrineHighlightId: "arranjo-mao-rosas",
    faq: [
      {
        question: "Vai parecer um presente pequeno demais?",
        answer:
          "Não vai não. Aqui os arranjos menores levam a mesma embalagem artesanal e o mesmo cartão escrito à mão dos buquês grandes. O que muda é só o tamanho.",
      },
      {
        question: "A embalagem é simples?",
        answer:
          "Nada disso. Papel artesanal, fita de cetim e o mesmo acabamento dos buquês maiores. A gente não economiza nesse detalhe.",
      },
      {
        question: "Dá pra parcelar mesmo nos valores menores?",
        answer:
          "Dá sim, no cartão em 3x sem juros. Sai a partir de R$ 21,67 por mês.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Flores e arranjos até R$ 149,90 em Goiânia | Plante Uma Flor",
    pageDescription:
      "Presentes do dia em Goiânia, todos por até R$ 149,90: arranjos e girassóis com embalagem caprichada e cartão escrito à mão por conta da casa.",
  },
  "carro-high": {
    slug: "carro-high",
    accent: "rose",
    heroImage: "/lpb/heros/carro-high.jpg",
    heroImageAlt: "Buquê 12 rosas vermelhas premium",
    heroMode: "overlay",
    headline: "Buquês memoráveis a partir de R$ 199,90.",
    subheadline:
      "Pra quem quer impressionar de verdade. Você combina a entrega em Goiânia, com embalagem artesanal e cartão escrito à mão.",
    priceAnchor: "A partir de R$ 199,90",
    vitrineVisibleCount: 6,
    ctaCopy: {
      hero: "Encomendar agora",
      como_funciona: "Falar com a floricultura",
      faq: "Quero confirmar disponibilidade",
      sticky: "Encomendar",
      final: "Quero encomendar",
      guarantee: "Ver detalhes da garantia",
    },
    testimonialOrder: ["rafaella-martins", "hellen-araujo", "taina-santos"],
    vitrineTitle: "Buquês premium",
    vitrineSubtitle: "Porte, frescor e embalagem que fazem a flor falar antes de você abrir a boca.",
    vitrineProductIds: [
      "buque-classico-rosas",
      "buque-12-rosas-rosa",
      "buque-flor-campo-m",
      "buque-girassois-m",
      "buque-rosas-astromelias",
      "buque-girassois-p",
      "buque-lirios-m",
      "buque-lirios-p",
      "buque-lirios-g",
      "box-rosas",
      "buque-30-rosas",
    ],
    vitrineHighlightId: "buque-rosas-astromelias",
    faq: [
      {
        question: "O que muda de um buquê mais em conta pra um premium?",
        answer:
          "Muda a quantidade de flores nobres, o porte do arranjo, a embalagem (papel artesanal e fita de cetim no topo de linha) e a durabilidade. Você sente a diferença na hora.",
      },
      {
        question: "A embalagem está à altura do preço?",
        answer:
          "Tá sim. Papel artesanal, fita de cetim e acabamento à mão, no mesmo padrão do que a gente faz pros buquês mais caros.",
      },
      {
        question: "Dá pra ver foto do produto antes de fechar?",
        answer:
          "Claro. Manda mensagem no WhatsApp que a gente envia foto do que tá disponível hoje, real e atualizada.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Buquês premium a partir de R$ 199,90 | Plante Uma Flor",
    pageDescription:
      "Buquês memoráveis entregues hoje em Goiânia. A partir de R$ 199,90, com embalagem artesanal e cartão escrito à mão por conta da casa.",
  },
  "presente-hoje": {
    slug: "presente-hoje",
    accent: "urgent",
    heroImage: "/lpb/heros/presente-hoje.jpg",
    heroImageAlt: "Buquê pronto para presente com embalagem artesanal",
    heroMode: "overlay",
    headline: "Presente bonito para entregar hoje.",
    subheadline:
      "Você escolhe uma opção pronta, manda o recado do cartão e a gente entrega em Goiânia ainda hoje para pedidos fechados até 18h, de segunda a sexta.",
    priceAnchor: "Entrega hoje em Goiânia",
    scarcityMessage: "Pedido até 18h sai hoje",
    vitrineVisibleCount: 6,
    navMode: "minimal",
    showReviewAvatars: false,
    reviewSealText: "Avaliação pública no Google",
    vitrineCardCta: "Escolher este e comprar no WhatsApp",
    sectionOrder: [
      "hero",
      "guarantee",
      "vitrine",
      "social",
      "diferenciais-fundidos",
      "comofunciona",
      "historia",
      "faq",
      "final",
    ],
    ctaCopy: {
      hero: "Comprar no WhatsApp",
      como_funciona: "Comprar no WhatsApp",
      faq: "Comprar no WhatsApp",
      sticky: "Comprar no WhatsApp",
      final: "Quero entregar hoje",
      guarantee: "Ver detalhes da garantia",
    },
    testimonialOrder: ["rafaella-martins", "taina-santos", "hellen-araujo"],
    vitrineTitle: "Presentes para hoje",
    vitrineSubtitle: "Opções com boa presença, embalagem caprichada e entrega rápida.",
    vitrineProductIds: [
      "arranjo-mao-rosas",
      "arranjo-2-girassois-balao",
      "arranjo-mao-lirios-p",
      "buque-classico-rosas",
      "buque-flor-campo-m",
      "buque-rosas-astromelias",
      "buque-lirios-m",
      "box-rosas",
    ],
    vitrineHighlightId: "buque-classico-rosas",
    faq: [
      {
        question: "Consigo resolver tudo ainda hoje?",
        answer:
          "Consegue. Você chama no WhatsApp, escolhe uma opção disponível, manda o texto do cartão e a gente confirma a janela de entrega em poucos minutos.",
      },
      {
        question: "Vocês ajudam a escolher se eu estiver em dúvida?",
        answer:
          "Ajudamos sim. Diz pra quem é o presente, o orçamento e o bairro da entrega que a gente indica as melhores opções do dia.",
      },
      {
        question: "O presente já vai pronto para entregar?",
        answer:
          "Vai sim. Montamos com embalagem artesanal, cartão escrito à mão e enviamos foto real antes de sair da loja.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Presente com flores para entregar hoje em Goiânia | Plante Uma Flor",
    pageDescription:
      "Presentes com flores para entregar hoje em Goiânia. Buquês e arranjos com embalagem caprichada, cartão escrito à mão e foto antes da entrega.",
  },
  "tradicao-comprovacao": {
    slug: "tradicao-comprovacao",
    accent: "classic",
    heroImage: "/lpb/heros/tradicao-comprovacao.jpg",
    heroImageAlt: "Fachada da Plante Uma Flor em Goiânia",
    heroMode: "overlay",
    headline: "Floricultura tradicional, com prova antes da entrega.",
    subheadline:
      "São 40 anos em Goiânia, avaliação 4.9 no Google e foto real do arranjo antes de sair da loja. Você compra sabendo exatamente o que vai chegar.",
    priceAnchor: "40 anos em Goiânia",
    vitrineVisibleCount: 6,
    ctaCopy: {
      hero: "Falar com a floricultura",
      como_funciona: "Ver como funciona",
      faq: "Tirar dúvida no WhatsApp",
      sticky: "Falar agora",
      final: "Quero comprar com segurança",
      guarantee: "Ver detalhes da garantia",
    },
    testimonialOrder: ["hellen-araujo", "rafaella-martins", "taina-santos"],
    vitrineTitle: "Mais pedidos da floricultura",
    vitrineSubtitle: "Escolhas frequentes de quem quer acertar sem depender só de foto bonita.",
    vitrineProductIds: [
      "buque-classico-rosas",
      "buque-rosas-astromelias",
      "arranjo-mao-lirios-m",
      "buque-flor-campo-m",
      "buque-12-rosas-rosa",
      "buque-lirios-m",
      "box-rosas",
      "buque-30-rosas",
    ],
    vitrineHighlightId: "buque-rosas-astromelias",
    faq: [
      {
        question: "Como eu sei que o buquê vai ficar bonito?",
        answer:
          "Antes da entrega, mandamos a foto real do arranjo pronto pelo WhatsApp. Se algum detalhe não estiver como combinado, a gente ajusta antes de sair.",
      },
      {
        question: "A loja existe mesmo em Goiânia?",
        answer:
          "Sim. A Plante Uma Flor tem loja física em Goiânia e uma história familiar de 40 anos trabalhando com flores.",
      },
      {
        question: "As avaliações são de clientes reais?",
        answer:
          "São avaliações públicas no Google. A página mostra depoimentos de clientes que compraram e avaliaram a experiência.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Floricultura tradicional em Goiânia | Plante Uma Flor",
    pageDescription:
      "Floricultura tradicional em Goiânia há 40 anos. Buquês com foto real antes da entrega, avaliação 4.9 no Google e atendimento pelo WhatsApp.",
  },
  "sem-erro": {
    slug: "sem-erro",
    accent: "rose",
    heroImage: "/lpb/heros/sem-erro.jpg",
    heroImageAlt: "Buquê clássico de rosas para presente",
    heroMode: "standalone",
    headline: "Na dúvida, escolha o presente que não tem erro.",
    subheadline:
      "Se você quer acertar sem conhecer todos os gostos da pessoa, comece pelos buquês mais pedidos: rosas, lírios e flores do campo com cartão escrito à mão.",
    priceAnchor: "Escolhas mais seguras",
    vitrineVisibleCount: 6,
    ctaCopy: {
      hero: "Me ajuda a escolher",
      como_funciona: "Ver opções certeiras",
      faq: "Pedir indicação",
      sticky: "Escolher agora",
      final: "Quero uma opção sem erro",
      guarantee: "Ver detalhes da garantia",
    },
    testimonialOrder: ["rafaella-martins", "taina-santos", "hellen-araujo"],
    vitrineTitle: "Presentes que costumam acertar",
    vitrineSubtitle: "Clássicos com boa presença, preço claro e acabamento de presente.",
    vitrineProductIds: [
      "arranjo-mao-rosas",
      "buque-classico-rosas",
      "buque-12-rosas-rosa",
      "buque-rosas-astromelias",
      "arranjo-mao-lirios-m",
      "buque-flor-campo-m",
      "buque-lirios-p",
      "box-rosas",
    ],
    vitrineHighlightId: "buque-classico-rosas",
    faq: [
      {
        question: "Qual opção é mais segura para presentear?",
        answer:
          "Rosas são o clássico mais seguro. Se a pessoa gosta de algo mais marcante, lírios funcionam muito bem. Se prefere algo alegre e leve, flor do campo e girassol são ótimas opções.",
      },
      {
        question: "Dá pra escolher por orçamento?",
        answer:
          "Dá sim. Você fala o valor que quer investir e a gente mostra as melhores opções disponíveis dentro dessa faixa.",
      },
      {
        question: "E se eu não souber o que escrever no cartão?",
        answer:
          "A gente te ajuda com uma mensagem simples e bonita. Depois escrevemos à mão e enviamos junto com o presente.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Flores para presente sem erro em Goiânia | Plante Uma Flor",
    pageDescription:
      "Flores para presente sem erro em Goiânia. Buquês clássicos, cartão escrito à mão, foto antes da entrega e ajuda pelo WhatsApp para escolher.",
  },
  "qual-b": {
    slug: "qual-b",
    accent: "sun",
    heroImage: "/lpb/heros/qual-b.jpg",
    heroImageAlt: "Buquê multicolorido de flores do campo com girassol e alstroemérias",
    heroMode: "overlay",
    headline: "Flores do campo: bonito porque é diferente.",
    subheadline:
      "Buquês originais, com girassol e alstroemérias. Você combina a entrega em Goiânia e a gente inclui cartão escrito à mão.",
    priceAnchor: "A partir de R$ 65,00",
    vitrineVisibleCount: 6,
    ctaCopy: {
      hero: "Quero ver os buquês",
      como_funciona: "Falar no WhatsApp",
      faq: "Quero confirmar disponibilidade",
      sticky: "Ver buquês",
      final: "Falar agora",
      guarantee: "Ver detalhes da garantia",
    },
    testimonialOrder: ["hellen-araujo", "taina-santos", "rafaella-martins"],
    vitrineTitle: "Campo & girassol",
    vitrineSubtitle: "Charme rústico, alegria visível. Flor de campo é pra quem gosta de fugir do óbvio.",
    vitrineProductIds: [
      "girassol-avulso",
      "arranjo-2-girassois-balao",
      "buque-girassois-g",
      "buque-flor-campo-m",
      "buque-girassois-m",
      "buque-girassois-p",
    ],
    vitrineHighlightId: "buque-flor-campo-m",
    faq: [
      {
        question: "Flor do campo é mais barata porque é inferior?",
        answer:
          "De jeito nenhum. É uma escolha de estilo. Quem gosta de flor do campo gosta da personalidade e do visual mais natural, fora do óbvio das rosas.",
      },
      {
        question: "Quanto tempo o girassol dura?",
        answer:
          "Em média de 5 a 8 dias com cuidados simples. A gente já manda as dicas junto pra ele aguentar bonito até o final.",
      },
      {
        question: "Dá pra fazer buquê só de girassol ou só flor do campo?",
        answer:
          "Dá sim, dos dois jeitos. Manda no WhatsApp como você quer e a gente monta exatamente como pediu.",
      },
    ],
    nossaHistoria: DEFAULT_NOSSA_HISTORIA,
    pageTitle: "Buquês de Campo e Girassol em Goiânia | Plante Uma Flor",
    pageDescription:
      "Buquês de flor do campo e girassol entregues hoje em Goiânia. A partir de R$ 65,00, com embalagem caprichada e cartão escrito à mão por conta da casa.",
  },
};

// Preço mínimo real da vitrine do catálogo — computado a partir de PRODUCTS
// em vez de string fixa, pra nunca contradizer a própria vitrine se o
// catálogo mudar.
const CATALOGO_PRECOS_PRODUCT_IDS = [
  "arranjo-mao-rosas",
  "arranjo-2-girassois-balao",
  "arranjo-mao-lirios-p",
  "buque-classico-rosas",
  "buque-rosas-astromelias",
  "buque-lirios-p",
  "orquidea-mini-phaleanopsis",
  "rosa-astromelia-unitaria",
  "cone-astromelia",
];
const catalogoPrecosMinPrice = formatBrl(
  Math.min(...CATALOGO_PRECOS_PRODUCT_IDS.map((id) => parsePriceBrl(PRODUCTS[id].priceBrl))),
);

Object.assign(LP_CONFIGS, {
  "so-porque-sim": {
    ...LP_CONFIGS["sem-erro"], slug: "so-porque-sim", accent: "sun",
    headline: "Não precisa de data para mostrar que pensou nela.",
    subheadline: "Um buquê inesperado muda o dia de quem você gosta. A gente prepara, escreve seu recado e entrega hoje em Goiânia.",
    priceAnchor: "Um gesto que chega hoje", vitrineTitle: "Flores só porque sim",
    vitrineSubtitle: "Escolhas leves e bonitas para surpreender sem esperar uma ocasião.",
    pageTitle: "Flores Só Porque Sim em Goiânia | Plante Uma Flor",
    pageDescription: "Surpreenda sem data especial: flores com cartão e entrega em Goiânia.",
  },
  "buque-real": {
    ...LP_CONFIGS.urgencia, slug: "buque-real", accent: "classic",
    headline: "Você aprova a foto real do buquê antes da entrega.",
    subheadline: "Nada de surpresa desagradável: montamos seu arranjo, enviamos a foto para aprovação e entregamos hoje em Goiânia.",
    priceAnchor: "Foto real antes de sair", vitrineTitle: "Buquês que você vê antes de receber",
    pageTitle: "Buquê Real com Foto Antes da Entrega | Plante Uma Flor",
    pageDescription: "Aprove a foto real do seu buquê antes da entrega hoje em Goiânia.",
  },
  reconciliacao: {
    ...LP_CONFIGS["presente-hoje"], slug: "reconciliacao", accent: "rose",
    headline: "Um gesto para reabrir a conversa — entregue hoje em Goiânia.",
    subheadline: "Flores para pedir desculpas a partir de R$ 99,90, com cartão escrito à mão e foto para você aprovar antes da entrega.",
    priceAnchor: "UM GESTO PARA HOJE", vitrineTitle: "Flores para pedir desculpas",
    ctaCopy: { ...LP_CONFIGS["presente-hoje"].ctaCopy, hero: "Ver opções a partir de R$ 99,90" },
    heroCtaAction: "scroll-vitrine",
    heroSecondaryCta: { label: "Pedir ajuda no WhatsApp", action: "guided-whatsapp" },
    urgencyWindow: {
      beforeCutoff: "Peça até as 18h e receba hoje.",
      afterCutoff: "Agende agora para amanhã ou escolha outra data.",
    },
    pageTitle: "Flores para Reconciliação em Goiânia | Plante Uma Flor",
    pageDescription: "Envie um gesto de reconciliação com entrega hoje em Goiânia.",
    // Os dois criativos mostram um produto específico no banco do carro — sem
    // variante, a página fica no estado genérico (seletor de intenção).
    variantParam: "criativo",
    variants: {
      lirio: {
        headline: "Lírios para mostrar que você foi além da mensagem.",
        subheadline:
          "Arranjo de lírios preparado para presente, com cartão escrito à mão e entrega hoje para pedidos até as 18h.",
        vitrineHighlightId: "arranjo-mao-lirios-p",
        variantProductId: "arranjo-mao-lirios-p",
      },
      rosas: {
        headline: "Rosas para transformar o pedido de desculpas em atitude.",
        subheadline:
          "Buquê de rosas com astromélias, cartão escrito à mão e entrega hoje para pedidos até as 18h.",
        vitrineHighlightId: "buque-rosas-astromelias",
        variantProductId: "buque-rosas-astromelias",
      },
    },
  },
  girassol: {
    ...LP_CONFIGS["qual-b"], slug: "girassol", heroImage: "/lpb/heros/girassol.jpg",
    heroImageAlt: "Buquê de girassóis para presente, entregue em Goiânia",
    headline: "Girassóis para presentear a partir de R$ 65",
    subheadline:
      "Do girassol avulso aos buquês mais marcantes. Peça até as 18h, aprove a foto pelo WhatsApp e receba ainda hoje.",
    priceAnchor: "A partir de R$ 65,00",
    showCutoffCopy: true,
    showGoogleReviewsLink: true,
    ctaCopy: {
      hero: "Pedir agora",
      como_funciona: "Falar no WhatsApp",
      faq: "Quero confirmar disponibilidade",
      sticky: "Pedir agora",
      final: "Falar agora",
      guarantee: "Ver detalhes da garantia",
    },
    vitrineTitle: "Girassóis para presentear",
    vitrineProductIds: ["girassol-avulso", "arranjo-2-girassois-balao", "buque-girassois-p", "buque-girassois-m", "buque-girassois-g", "buque-flor-campo-girassol"],
    // "buque-flor-campo-m" (herdado de qual-b) não existe na lista acima: o
    // destaque nunca aparecia. buque-girassois-g é o topo de linha real da LP.
    vitrineHighlightId: "buque-girassois-g",
    // marcos-vinicius fala de entrega no dia/hora combinado — reforça o prazo
    // sem citar rosas, ao contrário do destaque herdado de qual-b.
    testimonialOrder: ["marcos-vinicius", "taina-santos", "hellen-araujo"],
    sectionOrder: [
      "hero",
      "vitrine",
      "diferenciais-fundidos",
      "social",
      "historia",
      "faq",
      "guarantee",
      "final",
    ],
    variantParam: "oferta",
    variants: {
      "65": {
        headline: "Girassol por R$ 65",
        subheadline: "Peça até as 18h e receba hoje em Goiânia e região.",
        vitrineHighlightId: "girassol-avulso",
        variantProductId: "girassol-avulso",
      },
      "199": {
        headline: "Buquê de girassóis por R$ 199,90",
        subheadline: "Peça até as 18h e receba hoje em Goiânia e região.",
        vitrineHighlightId: "buque-girassois-p",
        variantProductId: "buque-girassois-p",
      },
      "159": {
        headline: "Buquê Flores do Campo com Girassol por R$ 159,90",
        subheadline: "Peça até as 18h e receba hoje em Goiânia e região.",
        vitrineHighlightId: "buque-flor-campo-girassol",
        variantProductId: "buque-flor-campo-girassol",
      },
    },
    pageTitle: "Girassóis em Goiânia | Plante Uma Flor", pageDescription: "Girassóis a partir de R$ 65,00, com cartão e entrega em Goiânia.",
  },
  "catalogo-precos": {
    ...LP_CONFIGS["sem-erro"], slug: "catalogo-precos", heroImage: "/lpb/heros/catalogo-precos.jpg",
    headline: `Flores a partir de ${catalogoPrecosMinPrice}.`,
    priceAnchor: `A partir de ${catalogoPrecosMinPrice}`,
    showCutoffCopy: true,
    ctaCopy: {
      hero: "Pedir agora",
      como_funciona: "Ver opções certeiras",
      faq: "Pedir indicação",
      sticky: "Pedir agora",
      final: "Quero uma opção sem erro",
      guarantee: "Ver detalhes da garantia",
    },
    vitrineCardCta: "Pedir este agora",
    vitrineFilters: true,
    vitrineTitle: "Catálogo de preços", vitrineSubtitle: "Escolha seu presente por faixa de preço, com valores claros desde o começo.",
    vitrineProductIds: CATALOGO_PRECOS_PRODUCT_IDS,
    sectionOrder: [
      "hero",
      "vitrine",
      "diferenciais-fundidos",
      "social",
      "historia",
      "faq",
      "guarantee",
      "final",
    ],
    variantParam: "oferta",
    variants: {
      "rosas-199": {
        vitrineHighlightId: "buque-rosas-astromelias",
        variantProductId: "buque-rosas-astromelias",
      },
      "orquidea-135": {
        vitrineHighlightId: "orquidea-mini-phaleanopsis",
        variantProductId: "orquidea-mini-phaleanopsis",
      },
      "rosa-65": {
        vitrineHighlightId: "rosa-astromelia-unitaria",
        variantProductId: "rosa-astromelia-unitaria",
      },
      "astromelia-124": {
        vitrineHighlightId: "cone-astromelia",
        variantProductId: "cone-astromelia",
      },
    },
    pageTitle: "Catálogo de Flores e Preços | Plante Uma Flor",
    pageDescription: `Flores a partir de ${catalogoPrecosMinPrice} em Goiânia.`,
  },
});

export { AD_LP_SLUGS } from "@/routes/routeManifest";
