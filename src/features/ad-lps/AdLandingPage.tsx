import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowDown,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Flower2,
  Gift,
  Heart,
  MessageCircle,
  Package,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import logoUrl from "@/assets/logo.png";
import logoWebpUrl from "@/assets/generated/logo-240.webp";
import { DocumentMeta } from "@/components/seo/DocumentMeta";
const PriceRangeSelector = lazy(() =>
  import("@/components/conversion/PriceRangeSelector").then((m) => ({ default: m.PriceRangeSelector })),
);
import type { PriceRangeRoute } from "@/lib/price-ranges";
import {
  BRAND_BONUS,
  BRAND_DOMAIN,
  COMMON_FAQ,
  DEFAULT_SECTION_ORDER,
  GLOBAL_CONFIG,
  GUARANTEE,
  LP_CONFIGS,
  PRODUCTS,
  WHATSAPP_BASE_URL,
  inferProductBadge,
  type BrandBonus,
  type CtaOriginKey,
  type ChatExample,
  type FAQItem,
  type LPConfig,
  type Product,
  type ProductBadge,
  type SectionKey,
} from "@/features/ad-lps/data/configs";
import {
  FALLBACK_REVIEWS,
  FEATURED_REVIEW_ORDER,
  orderReviews,
  type GoogleReview,
} from "@/features/ad-lps/lib/reviews";
import { formatBrl, formatInstallments, parsePriceBrl } from "@/features/ad-lps/lib/pricing";
import { useResolvedConfig } from "@/features/ad-lps/lib/useQueryVariant";
import { useIsPastCutoff } from "@/features/ad-lps/lib/useCutoffCopy";
import { HeroReviewCard, ReviewCard } from "@/features/ad-lps/components/ReviewCard";
import { DifferentialCard } from "@/features/ad-lps/components/DifferentialCard";
import { DiferenciaisFusedSection } from "@/features/ad-lps/components/DiferenciaisFusedSection";
import { HowItWorksSection } from "@/features/ad-lps/components/HowItWorksSection";
import { HeroBadges } from "@/features/ad-lps/components/HeroBadges";
import { ComparisonStrip } from "@/features/ad-lps/components/ComparisonStrip";
import { ReassuranceStrip } from "@/features/ad-lps/components/ReassuranceStrip";
import { StoreFooter } from "@/features/ad-lps/components/StoreFooter";
import { CountUpValue } from "@/features/ad-lps/components/CountUpValue";
import {
  buildAdLpWhatsAppUrl,
  openAdLpGuidedWhatsApp,
  openAdLpWhatsApp,
} from "@/features/ad-lps/lib/whatsapp";
import {
  resolveDeliveryTiming,
  resolveUrgencyMessage,
} from "@/features/ad-lps/lib/urgency";
import {
  FACHADA_SOURCES,
  getHeroSources,
  resolveOgImagePath,
  type PictureSources,
} from "@/features/ad-lps/lib/hero-images";
import { BUSINESS_INFO } from "@/lib/business-info";
import { trackVariantSeen } from "@/lib/tracking";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import "./fonts.css";
import "./theme.css";
const PRODUCT_PLACEHOLDER = "/lpb/placeholders/product.svg";
const STICKY_SENTINEL_ID = "ad-lp-sticky-sentinel";

type AdLandingPageProps = {
  slug: string;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function ImageWithFallback({
  src,
  fallback,
  alt,
  className,
  loading = "lazy",
  width = 1024,
  height = 1024,
  srcSet,
  sizes,
}: {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
  srcSet?: string;
  sizes?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      srcSet={srcSet}
      sizes={sizes}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.src.endsWith(fallback)) return;
        if (srcSet && image.dataset.originalRetry !== "true") {
          image.dataset.originalRetry = "true";
          image.removeAttribute("srcset");
          image.removeAttribute("sizes");
          image.src = src;
          return;
        }
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
        image.src = fallback;
      }}
    />
  );
}

function WhatsAppCtaIcon() {
  return <WhatsAppIcon size={20} className="ad-lp-cta__icon" />;
}

type CtaOrigin =
  | "hero"
  | "vitrine"
  | "faq"
  | "sticky"
  | "como_funciona"
  | "final"
  | "guarantee";

function resolveCtaLabel(config: LPConfig, origin: CtaOrigin): string {
  if (origin === "vitrine") return "Comprar no WhatsApp";
  const key = origin as CtaOriginKey;
  return config.ctaCopy?.[key] ?? config.ctaCopy?.hero ?? "Falar no WhatsApp";
}

/** Returns false on SSR + first client render, true after the first useEffect. */
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function CtaButton({
  config,
  origin,
  children,
  className = "",
}: {
  config: LPConfig;
  origin: CtaOrigin;
  children?: ReactNode;
  className?: string;
}) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <a
        href={WHATSAPP_BASE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`ad-lp-cta ${className}`}
        data-testid={`ad-lp-cta-${origin}`}
      >
        <span>{children || resolveCtaLabel(config, origin)}</span>
        <WhatsAppCtaIcon />
      </a>
    );
  }

  // Só hero/sticky pulam a etapa de escolha de faixa: são os CTAs principais,
  // os únicos que uma variante `?oferta=`/`?criativo=` deve tirar do genérico.
  const variantProduct =
    (origin === "hero" || origin === "sticky") && config.variantProductId
      ? PRODUCTS[config.variantProductId]
      : undefined;

  return (
    <button
      type="button"
      className={`ad-lp-cta ${className}`}
      data-testid={`ad-lp-cta-${origin}`}
      onClick={() => openAdLpWhatsApp({ config, origin, product: variantProduct })}
    >
      <span>{children || resolveCtaLabel(config, origin)}</span>
      <WhatsAppCtaIcon />
    </button>
  );
}

function ResponsivePicture({
  sources,
  alt,
  className,
  loading,
  priority = false,
  sizes = "100vw",
  testId,
}: {
  sources: PictureSources;
  alt: string;
  className?: string;
  loading?: "lazy";
  priority?: boolean;
  sizes?: string;
  testId?: string;
}) {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet={`${sources.avif480} 480w, ${sources.avif900} 900w`}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={`${sources.webp480} 480w, ${sources.webp900} 900w`}
        sizes={sizes}
      />
      <img
        src={sources.fallbackSrc}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        width={900}
        height={675}
        data-testid={testId}
      />
    </picture>
  );
}

function ResponsiveStorefrontImage(
  props: Omit<Parameters<typeof ResponsivePicture>[0], "sources">,
) {
  return <ResponsivePicture {...props} sources={FACHADA_SOURCES} />;
}

function getProductImageSrcSet(src: string) {
  if (!src.includes("acdn-us.mitiendanube.com") || !/-1024-1024\.webp(?:\?.*)?$/.test(src)) {
    return undefined;
  }

  // O card renderiza ~314px; sem a variante de 320 o navegador cai na de 480 e
  // descarta metade dos bytes. A CDN da loja gera cada largura sob demanda.
  return [320, 480, 640]
    .map(
      (width) =>
        `${src.replace(/-1024-1024\.webp(\?.*)?$/, `-${width}-0.webp$1`)} ${width}w`,
    )
    .concat(`${src} 1024w`)
    .join(", ");
}

/**
 * `sizes` precisa descrever a largura real do card, senão o navegador escolhe
 * uma variante maior e joga metade dos bytes fora. Até 719px a vitrine é uma
 * grade de 2 colunas com gutter de 4vw e gap de 1rem — daí `46vw - 8px` —, de
 * 720px a 1023px são 3 colunas (~30vw) e acima disso o container trava em
 * 1220px, o que dá 400px por card. O destaque ocupa duas colunas a partir de
 * 1024px (ver .ad-lp-card--featured em theme.css) e precisa da sua própria
 * conta; abaixo disso ele é um card comum.
 */
const CARD_SIZES =
  "(max-width: 719px) calc(46vw - 8px), (max-width: 1259px) 30vw, 400px";
const FEATURED_CARD_SIZES =
  "(max-width: 719px) calc(46vw - 8px), (max-width: 1023px) 30vw, (max-width: 1259px) 62vw, 810px";
const PROGRESSIVE_CARD_SIZES =
  "(max-width: 719px) 92vw, (max-width: 1259px) 30vw, 390px";

function BonusIcon({ icon }: { icon: BrandBonus["icon"] }) {
  const props = { size: 22, strokeWidth: 1.7 };
  if (icon === "card") return <CreditCard {...props} />;
  if (icon === "package") return <Package {...props} />;
  if (icon === "truck") return <Truck {...props} />;
  if (icon === "camera") return <Camera {...props} />;
  if (icon === "message") return <MessageCircle {...props} />;
  if (icon === "shield") return <ShieldCheck {...props} />;
  return <Sparkles {...props} />;
}

function useGoogleReviews() {
  const [reviews, setReviews] = useState<GoogleReview[]>(FALLBACK_REVIEWS);

  useEffect(() => {
    if (typeof fetch !== "function") return;

    let alive = true;
    fetch("/lpb/google-reviews.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        const nextReviews = Array.isArray(payload?.reviews) ? payload.reviews : [];
        const featured = nextReviews
          .filter((review: GoogleReview) => review.rating >= 5 && review.comment)
          .sort((a: GoogleReview, b: GoogleReview) => {
            const aIndex = FEATURED_REVIEW_ORDER.indexOf(a.reviewId);
            const bIndex = FEATURED_REVIEW_ORDER.indexOf(b.reviewId);
            return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
          })
          .slice(0, FEATURED_REVIEW_ORDER.length);

        if (alive && featured.length) setReviews(featured);
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  return reviews;
}

/**
 * Card de conversa que ilustra a promessa da foto.
 *
 * Duas regras que não podem cair numa refatoração: o rótulo `chat.label` é
 * visível (sem ele o bloco passa por print real de conversa, e aí vira
 * propaganda enganosa), e os três balões existem no HTML pré-renderizado, sem
 * estado inicial escondido esperando efeito.
 */
function ChatExampleCard({ chat }: { chat: ChatExample }) {
  return (
    <figure className="ad-lp-chat" data-testid="ad-lp-chat-example">
      <figcaption className="ad-lp-chat__head">
        <span className="ad-lp-chat__dot" aria-hidden="true" />
        {chat.contact}
        <span className="ad-lp-chat__label">{chat.label}</span>
      </figcaption>
      {chat.bubbles.map((bubble) => {
        const product = bubble.imageProductId ? PRODUCTS[bubble.imageProductId] : undefined;
        return (
          <p
            key={bubble.text}
            className={`ad-lp-chat__bubble ${bubble.mine ? "ad-lp-chat__bubble--mine" : ""}`}
          >
            {product ? (
              <ImageWithFallback
                src={product.image}
                fallback={PRODUCT_PLACEHOLDER}
                alt={bubble.imageAlt ?? product.name}
                srcSet={getProductImageSrcSet(product.image)}
                sizes="300px"
                width={300}
                height={300}
              />
            ) : null}
            {bubble.text}
            <time>{bubble.time}</time>
          </p>
        );
      })}
    </figure>
  );
}

function HeroSection({ config }: { config: LPConfig }) {
  const scrollToProducts = () => {
    document.getElementById("vitrine")?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  const hydrated = useHydrated();
  const heroSources = getHeroSources(config.slug);
  const pastCutoff = useIsPastCutoff();
  const heroCtaAction = config.heroCtaAction ?? "price-range";
  const secondaryCta = config.heroSecondaryCta ?? {
    label: "Ver produtos",
    action: "scroll-vitrine" as const,
  };
  const urgencyMessage = hydrated ? resolveUrgencyMessage(config) : null;
  const deliveryTiming = hydrated && config.deliveryInfo ? resolveDeliveryTiming() : null;

  return (
    <section id="hero" className="ad-lp-hero">
      {/* Marca o ponto a partir do qual o CTA fixo aparece (ver StickyCta). */}
      <div id={STICKY_SENTINEL_ID} className="ad-lp-hero__sentinel" aria-hidden="true" />
      <div className="ad-lp-hero__media">
        <ResponsivePicture
          sources={heroSources}
          // Sem foto própria a LP mostra a fachada, e o alt precisa dizer isso.
          alt={
            heroSources === FACHADA_SOURCES
              ? "Fachada da Plante Uma Flor em Goiânia"
              : config.heroImageAlt
          }
          className="ad-lp-hero__image"
          priority
          testId="ad-lp-hero-image"
        />
      </div>

      <div className="ad-lp-hero__overlay">
        <div className="ad-lp-hero__content">
          {config.priceAnchor ? <p className="ad-lp-hero__anchor">{config.priceAnchor}</p> : null}
          <h1 className="ad-lp-hero__title">{config.headline}</h1>
          <p className="ad-lp-hero__sub">{config.subheadline}</p>
          {config.showCutoffCopy ? (
            <p className="ad-lp-hero__cutoff">
              {pastCutoff
                ? "Consulte o próximo horário disponível."
                : "Peça até as 18h e receba hoje."}
            </p>
          ) : null}
          <div className="ad-lp-hero__actions">
            {/* Com variante ativa (?criativo=...) o CTA volta a apontar direto pro
                produto do anúncio — o scroll pra vitrine é só o estado genérico. */}
            {heroCtaAction === "scroll-vitrine" && !config.variantProductId ? (
              <a
                href="#vitrine"
                className="ad-lp-cta ad-lp-hero__cta"
                data-testid="ad-lp-cta-hero"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToProducts();
                }}
              >
                {resolveCtaLabel(config, "hero")}
              </a>
            ) : (
              <CtaButton config={config} origin="hero" className="ad-lp-hero__cta" />
            )}
            {secondaryCta.action === "guided-whatsapp" ? (
              hydrated ? (
                <button
                  type="button"
                  className="ad-lp-secondary-cta"
                  data-testid="ad-lp-secondary-cta"
                  onClick={() => openAdLpGuidedWhatsApp(config)}
                >
                  <span>{secondaryCta.label}</span>
                  <MessageCircle size={19} strokeWidth={2.2} aria-hidden="true" />
                </button>
              ) : (
                <a
                  href={WHATSAPP_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ad-lp-secondary-cta"
                  data-testid="ad-lp-secondary-cta"
                >
                  <span>{secondaryCta.label}</span>
                  <MessageCircle size={19} strokeWidth={2.2} aria-hidden="true" />
                </a>
              )
            ) : (
              // Rolar até a vitrine é navegação, não conversão: no mobile este
              // botão vira link de texto para não competir com o CTA do
              // WhatsApp (ver .ad-lp-secondary-cta--quiet).
              <a
                href="#vitrine"
                className="ad-lp-secondary-cta ad-lp-secondary-cta--quiet"
                data-testid="ad-lp-see-products"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToProducts();
                }}
              >
                <span>{secondaryCta.label}</span>
                <ArrowDown size={19} strokeWidth={2.2} aria-hidden="true" />
              </a>
            )}
          </div>
          {deliveryTiming ? (
            <p className="ad-lp-hero__delivery-timing" data-testid="ad-lp-hero-delivery-timing">
              {deliveryTiming.message}
            </p>
          ) : null}
          {urgencyMessage ? (
            <p className="ad-lp-hero__urgency" data-testid="ad-lp-urgency-line">
              {urgencyMessage}
            </p>
          ) : null}
          <HeroBadges config={config} />
        </div>
      </div>
    </section>
  );
}

/**
 * Bloco visível logo abaixo do hero. Entrega é uma objeção central desta LP,
 * então horário, cobertura e condições não ficam atrás de uma interação.
 * O SSR entrega a frase estática; após a hidratação ela vira a orientação
 * correspondente ao horário local da loja.
 */
function DeliveryInfoSection({ config }: { config: LPConfig }) {
  const deliveryInfo = config.deliveryInfo;
  const hydrated = useHydrated();
  const timing = hydrated ? resolveDeliveryTiming() : null;

  if (!deliveryInfo) return null;

  return (
    <section className="ad-lp-delivery" aria-label="Informações de entrega">
      <div className="ad-lp-delivery__panel" data-testid="ad-lp-delivery-info">
        <h2>{deliveryInfo.summary}</h2>
        <div className="ad-lp-delivery__content">
          <p>{deliveryInfo.intro}</p>
          <p className="ad-lp-delivery__timing" data-testid="ad-lp-delivery-timing">
            {timing?.message ??
              "Pedidos fechados até 18h de segunda a sexta e até 13h no sábado podem sair no mesmo dia."}
          </p>
          <dl>
            {deliveryInfo.items.map((item) => (
              <div key={item.title}>
                <dt>{item.title}</dt>
                <dd>{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function BrandBar({ config }: { config: LPConfig }) {
  const minimal = config.navMode === "minimal";
  const [visible, setVisible] = useState(!config.mobileChromeAfterHero);

  useEffect(() => {
    if (!config.mobileChromeAfterHero) return;
    const hero = document.getElementById("hero");
    if (!hero || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [config.mobileChromeAfterHero]);

  return (
    <header
      className={`ad-lp-brand-bar ${minimal ? "ad-lp-brand-bar--minimal" : ""}`}
      data-visible={visible}
    >
      <a href="#hero" className="ad-lp-logo" aria-label="Plante Uma Flor">
        <picture>
          <source type="image/webp" srcSet={logoWebpUrl} />
          <img src={logoUrl} alt="Plante Uma Flor" width="240" height="160" />
        </picture>
      </a>
      {/* Numa página de venda cada âncora é uma saída: a nav minimal fica só com
          logo + nota do Google. O CTA do hero e o fixo já cobrem a compra. */}
      {minimal ? null : (
        <nav className="ad-lp-nav" aria-label="Seções da página">
          <a href="#como-funciona">Diferenciais</a>
          <a href="#vitrine">Produtos</a>
          <a href="#depoimentos">Depoimentos</a>
          <a href="#bonus">Por que nós</a>
          <a href="#faq">FAQ</a>
        </nav>
      )}
      <div
        className="ad-lp-rating"
        role="img"
        aria-label={`Avaliação ${GLOBAL_CONFIG.googleRating} estrelas com ${GLOBAL_CONFIG.googleReviewsCount} avaliações no Google`}
      >
        <span className="ad-lp-rating__g">G</span>
        <span>{GLOBAL_CONFIG.googleRating}</span>
        <Star size={14} fill="currentColor" />
      </div>
    </header>
  );
}

function BrandBonusSection() {
  return (
    <section id="bonus" className="ad-lp-bonus" aria-label="Por que nos escolher">
      <header className="ad-lp-section-head">
        <h2>Por que nos escolher?</h2>
        <p>Cada detalhe é pensado para que sua experiência seja especial do início ao fim.</p>
      </header>
      <ul className="ad-lp-bonus__list">
        {BRAND_BONUS.map((bonus) => (
          <li className="ad-lp-bonus__item" key={bonus.title}>
            <span className="ad-lp-bonus__icon" aria-hidden="true">
              <BonusIcon icon={bonus.icon} />
            </span>
            <h3>{bonus.title}</h3>
            <p>{bonus.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const DIFFERENTIAL_PILLARS = [
  {
    num: "01",
    Icon: Heart,
    title: "Flores direto do produtor",
    body:
      "Flores recebidas direto do produtor 3× por semana. Cada buquê é montado na hora, com a mesma flor que iríamos colocar na nossa casa.",
  },
  {
    num: "02",
    Icon: Sparkles,
    title: "O que está incluso",
    body:
      "Cartão escrito à mão, embalagem artesanal e foto real antes da entrega. Sem custo adicional. Faz parte do nosso jeito.",
  },
  {
    num: "03",
    Icon: ShieldCheck,
    title: "Garantia de qualidade",
    body:
      "Não gostou de algum detalhe? A gente refaz, troca ou devolve o valor no mesmo dia. Sem letra miúda, sem enrolação.",
  },
];

function DifferentialsSection({ config }: { config: LPConfig }) {
  return (
    <section id="como-funciona" className="ad-lp-process" aria-label="Por que somos diferentes">
      <header className="ad-lp-section-head">
        <h2>Por que somos diferentes</h2>
        <p>O cuidado de uma floricultura tradicional, com o frescor e a transparência que você merece.</p>
      </header>
      <ol className="ad-lp-process__grid">
        {DIFFERENTIAL_PILLARS.map((pillar) => (
          <DifferentialCard pillar={pillar} key={pillar.num} />
        ))}
      </ol>
      <div className="ad-lp-process__cta">
        <CtaButton config={config} origin="como_funciona" />
      </div>
    </section>
  );
}

function SocialProofSection({ config }: { config: LPConfig }) {
  const fetchedReviews = useGoogleReviews();
  const showAvatar = config.showReviewAvatars !== false;
  const sealText = config.reviewSealText ?? "Cliente real no Google";
  const reviews = useMemo(
    () => orderReviews(fetchedReviews, config.testimonialOrder),
    [fetchedReviews, config.testimonialOrder],
  );
  const [heroReview, ...restReviews] = reviews;
  const carouselReviews = restReviews.length ? restReviews : reviews;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const quoteGrid = config.proofLayout === "quote-grid";

  useEffect(() => {
    // No "quote-grid" não há carrossel para girar: o intervalo nem começa.
    if (paused || quoteGrid || prefersReducedMotion()) return;
    const interval = window.setInterval(() => {
      const el = viewportRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 340, behavior: "smooth" });
      }
    }, 4500);
    return () => window.clearInterval(interval);
  }, [paused, quoteGrid]);

  const handleNav = (direction: "prev" | "next") => {
    const el = viewportRef.current;
    if (!el) return;
    setPaused(true);
    el.scrollBy({
      left: direction === "next" ? 340 : -340,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    window.setTimeout(() => setPaused(false), 8000);
  };

  const googleLink = config.showGoogleReviewsLink ? (
    <p className="ad-lp-proof__google-link">
      <a href={BUSINESS_INFO.googleReviewsUrl} target="_blank" rel="noopener noreferrer">
        Ver as {GLOBAL_CONFIG.googleReviewsCount} avaliações no Google
      </a>
    </p>
  ) : null;

  // Uma citação grande sobre entrega + quatro vozes lado a lado. O carrossel
  // pedia clique ou espera para mostrar a segunda avaliação; aqui as cinco
  // estão visíveis de uma vez, sem autoplay e sem botão de navegação.
  if (quoteGrid) {
    return (
      <section
        id="depoimentos"
        className="ad-lp-proof ad-lp-proof--quotes"
        aria-label="Avaliações de clientes"
        data-testid="ad-lp-proof-quotes"
      >
        <div className="ad-lp-proof__inner">
          <div className="ad-lp-proof__top">
            <p className="ad-lp-proof__eyebrow">Quem comprou</p>
            <p className="ad-lp-proof__rating">
              <span className="ad-lp-proof__stars" aria-hidden="true">
                ★★★★★
              </span>
              <span>
                {GLOBAL_CONFIG.googleRating} · {GLOBAL_CONFIG.googleReviewsCount} avaliações
                públicas no Google
              </span>
            </p>
          </div>
          {heroReview ? (
            <figure className="ad-lp-proof__shout">
              <blockquote>{`“${heroReview.comment}”`}</blockquote>
              <figcaption>{heroReview.authorName} · avaliação pública no Google</figcaption>
            </figure>
          ) : null}
          <div className="ad-lp-proof__voices">
            {restReviews.slice(0, 4).map((review, index) => (
              <figure
                className="ad-lp-voice"
                key={`${review.reviewId || review.authorName}-${index}`}
              >
                <blockquote>{`“${review.comment}”`}</blockquote>
                <figcaption>{review.authorName}</figcaption>
              </figure>
            ))}
          </div>
          {googleLink}
        </div>
      </section>
    );
  }

  return (
    <section id="depoimentos" className="ad-lp-proof" aria-label="Avaliações de clientes">
      <header className="ad-lp-section-head">
        <p>{GLOBAL_CONFIG.googleReviewsCount} avaliações · Google {GLOBAL_CONFIG.googleRating}★</p>
        <h2>Quem comprou, indica.</h2>
      </header>
      {heroReview ? (
        <HeroReviewCard review={heroReview} showAvatar={showAvatar} sealText={sealText} />
      ) : null}
      <div className="ad-lp-proof__carousel">
        <button
          type="button"
          className="ad-lp-proof__nav ad-lp-proof__nav--prev"
          aria-label="Avaliação anterior"
          onClick={() => handleNav("prev")}
        >
          <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <div
          className="ad-lp-proof__viewport"
          ref={viewportRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="ad-lp-proof__track">
            {carouselReviews.map((review, index) => (
              <ReviewCard
                key={`${review.reviewId || review.authorName}-${index}`}
                review={review}
                showAvatar={showAvatar}
                sealText={sealText}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="ad-lp-proof__nav ad-lp-proof__nav--next"
          aria-label="Próxima avaliação"
          onClick={() => handleNav("next")}
        >
          <ChevronRight size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      {googleLink}
    </section>
  );
}

const DEFAULT_BADGE_LABELS: Record<ProductBadge, string> = {
  "mais-vendido": "Mais vendido",
  "custo-beneficio": "Custo-benefício",
  premium: "Premium",
};

function ProductBadgePill({
  badge,
  labels,
}: {
  badge: ProductBadge;
  labels?: Partial<Record<ProductBadge, string>>;
}) {
  const label = labels?.[badge] ?? DEFAULT_BADGE_LABELS[badge];
  return (
    <span className={`ad-lp-card__badge ad-lp-card__badge--${badge}`}>
      {label}
    </span>
  );
}

const SIZE_IMPACT_LABELS: Record<string, string> = {
  P: "Delicado",
  M: "Marcante",
  G: "Grande impacto",
};

function sizeImpactLabel(product: Product): string | null {
  const size = product.details?.size;
  if (!size) return null;
  return SIZE_IMPACT_LABELS[size] ?? null;
}

function ProductDetailsList({ product }: { product: Product }) {
  const details = product.details;
  if (!details) return null;
  const items: { icon: ReactNode; label: string }[] = [];
  if (details.flowerCount) {
    items.push({
      icon: <Flower2 size={14} strokeWidth={1.8} aria-hidden="true" />,
      label: `${details.flowerCount} ${details.flowerCount === 1 ? "flor" : "flores"}`,
    });
  }
  if (details.size && details.heightCm) {
    items.push({
      icon: <Ruler size={14} strokeWidth={1.8} aria-hidden="true" />,
      label: `${details.size} · ~${details.heightCm}cm`,
    });
  } else if (details.size) {
    items.push({
      icon: <Ruler size={14} strokeWidth={1.8} aria-hidden="true" />,
      label: `Tamanho ${details.size}`,
    });
  } else if (details.heightCm) {
    items.push({
      icon: <Ruler size={14} strokeWidth={1.8} aria-hidden="true" />,
      label: `~${details.heightCm}cm`,
    });
  }
  if (details.includes?.length) {
    items.push({
      icon: <Gift size={14} strokeWidth={1.8} aria-hidden="true" />,
      label: details.includes.slice(0, 2).join(" + "),
    });
  }
  if (!items.length) return null;
  return (
    <ul className="ad-lp-card__details">
      {items.map((item, idx) => (
        <li className="ad-lp-card__detail" key={idx}>
          {item.icon}
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

const CATEGORY_FILTER_LABELS: Record<string, string> = {
  rosas: "Rosas",
  lirios: "Lírios",
  girassois: "Girassóis",
  campo: "Flores do campo",
  orquideas: "Orquídeas",
  astromelias: "Astromélias",
};

const PRICE_FILTERS = [
  { key: "price:low", label: "Até R$ 150", test: (price: number) => price <= 150 },
  { key: "price:mid", label: "R$ 150 a R$ 250", test: (price: number) => price > 150 && price <= 250 },
  { key: "price:high", label: "Acima de R$ 250", test: (price: number) => price > 250 },
];

function matchesVitrineFilter(product: Product, filterKey: string | null): boolean {
  if (!filterKey) return true;
  if (filterKey.startsWith("cat:")) return product.category === filterKey.slice(4);
  const price = parsePriceBrl(product.priceBrl);
  return PRICE_FILTERS.find((f) => f.key === filterKey)?.test(price) ?? true;
}

/**
 * Filtros com contagem zero não aparecem — computados sobre os produtos
 * realmente exibidos (após a reordenação de variante), não o catálogo todo.
 */
function useVitrineFilters(products: Product[], enabled: boolean) {
  return useMemo(() => {
    if (!enabled) return [];
    const categories = Object.keys(CATEGORY_FILTER_LABELS).map((category) => ({
      key: `cat:${category}`,
      label: CATEGORY_FILTER_LABELS[category],
      count: products.filter((p) => p.category === category).length,
    }));
    const prices = PRICE_FILTERS.map((filter) => ({
      key: filter.key,
      label: filter.label,
      count: products.filter((p) => filter.test(parsePriceBrl(p.priceBrl))).length,
    }));
    return [...categories, ...prices].filter((option) => option.count > 0);
  }, [products, enabled]);
}

function ProductWhatsAppCta({
  config,
  product,
}: {
  config: LPConfig;
  product: Product;
}) {
  const hydrated = useHydrated();
  const content = (
    <>
      <WhatsAppCtaIcon />
      <span>{config.vitrineCardCta ?? "Comprar este no WhatsApp"}</span>
    </>
  );

  if (!hydrated) {
    return (
      <a
        href={buildAdLpWhatsAppUrl(config, product)}
        target="_blank"
        rel="noopener noreferrer"
        className="ad-lp-card__button"
        data-testid={`product-cta-${product.id}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="ad-lp-card__button"
      data-testid={`product-cta-${product.id}`}
      onClick={() => openAdLpWhatsApp({ config, origin: "vitrine", product })}
    >
      {content}
    </button>
  );
}

function VitrineProductCard({
  config,
  product,
  products,
}: {
  config: LPConfig;
  product: Product;
  products: Product[];
}) {
  const featured = product.id === config.vitrineHighlightId;
  const badge = inferProductBadge(product, products, config.vitrineHighlightId);
  const isAdMatch = !!config.variantProductId && product.id === config.variantProductId;
  const showScarcity =
    !!config.scarcityMessage &&
    (badge === "mais-vendido" || badge === "custo-beneficio" || !!config.scarcityAppliesToAll);
  const note = config.vitrineProductNotes?.[product.id];
  const impact = config.vitrineShowSize ? sizeImpactLabel(product) : null;
  const pitch = config.vitrineProductPitch?.[product.id];
  const buttonMode = config.vitrineCardCtaMode === "button";
  const sizes = buttonMode ? PROGRESSIVE_CARD_SIZES : featured ? FEATURED_CARD_SIZES : CARD_SIZES;

  const content = (
    <>
      <span className="ad-lp-card__media">
        <ImageWithFallback
          src={product.image}
          fallback={PRODUCT_PLACEHOLDER}
          alt={product.name}
          srcSet={getProductImageSrcSet(product.image)}
          sizes={sizes}
        />
      </span>
      <span className="ad-lp-card__body">
        {note ? <span className="ad-lp-card__note">{note}</span> : null}
        <span className="ad-lp-card__name">{product.name}</span>
        {pitch ? <span className="ad-lp-card__pitch">{pitch}</span> : null}
        <ProductDetailsList product={product} />
        {impact ? <span className="ad-lp-card__impact">{impact}</span> : null}
        {showScarcity ? <span className="ad-lp-card__scarcity">{config.scarcityMessage}</span> : null}
        <span className="ad-lp-card__price">{product.priceBrl}</span>
        <span className="ad-lp-card__installments">{formatInstallments(product.priceBrl)}</span>
        {buttonMode ? (
          <ProductWhatsAppCta config={config} product={product} />
        ) : (
          <span className="ad-lp-card__cta">
            {config.vitrineCardCta ?? "Quero encomendar pelo WhatsApp"}
          </span>
        )}
      </span>
    </>
  );

  return (
    <article
      className={`ad-lp-card ${featured ? "ad-lp-card--featured" : ""} ${
        buttonMode ? "ad-lp-card--button" : ""
      }`}
      data-testid={buttonMode ? `product-card-${product.id}` : undefined}
    >
      {isAdMatch ? (
        <span className="ad-lp-card__badge ad-lp-card__badge--ad-match">Visto no anúncio</span>
      ) : badge ? (
        <ProductBadgePill badge={badge} labels={config.productBadgeLabels} />
      ) : null}
      {buttonMode ? (
        <div className="ad-lp-card__link">{content}</div>
      ) : (
        <a
          href={buildAdLpWhatsAppUrl(config, product)}
          className="ad-lp-card__link"
          data-testid={`product-card-${product.id}`}
          onClick={(event) => {
            event.preventDefault();
            openAdLpWhatsApp({ config, origin: "vitrine", product });
          }}
        >
          {content}
        </a>
      )}
    </article>
  );
}

function priceRangeForIds(productIds: string[], products: Product[]) {
  const prices = productIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean)
    .map((product) => parsePriceBrl(product!.priceBrl));
  if (!prices.length) return "";
  return `${formatBrl(Math.min(...prices))} a ${formatBrl(Math.max(...prices))}`;
}

function VitrineSection({
  config,
  products,
}: {
  config: LPConfig;
  products: Product[];
}) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filterOptions = useVitrineFilters(products, !!config.vitrineFilters);
  const filteredProducts = config.vitrineFilters
    ? products.filter((product) => matchesVitrineFilter(product, activeFilter))
    : products;
  const initialCount = Math.min(config.vitrineVisibleCount ?? 6, filteredProducts.length);
  const [expanded, setExpanded] = useState(false);
  const visibleProducts = expanded ? filteredProducts : filteredProducts.slice(0, initialCount);
  const hasMore = filteredProducts.length > initialCount;

  return (
    <section id="vitrine" className="ad-lp-vitrine" aria-label={config.vitrineTitle}>
      {/* O <h2> da seção vem antes das faixas: com elas na frente, os <h3> de
          "Frete sem surpresa" e "Arranjo de Mão" ficavam pendurados no <h2> da
          garantia, quebrando o índice de cabeçalhos para leitor de tela. */}
      <header className="ad-lp-section-head">
        <h2>{config.vitrineTitle}</h2>
        <p>{config.vitrineSubtitle}</p>
      </header>
      {/* Antes da comparação de preço: quem chega do anúncio precisa saber o
          custo total, a prova do produto e a forma de pagamento antes de olhar
          a grade — não depois. */}
      {config.reassurances?.length ? <ReassuranceStrip items={config.reassurances} /> : null}
      {config.comparisonStrip ? <ComparisonStrip strip={config.comparisonStrip} /> : null}
      {config.vitrineIntroLines?.length ? (
        <div className="ad-lp-vitrine__intro" data-testid="ad-lp-vitrine-intro">
          {config.vitrineIntroLines.map((line) => (
            <p key={line.name}>
              <b>{line.name}</b> {line.body}{" "}
              <span className="ad-lp-vitrine__intro-price">
                {priceRangeForIds(line.productIds, products)}.
              </span>
            </p>
          ))}
        </div>
      ) : null}
      {filterOptions.length ? (
        <div className="ad-lp-vitrine__filters" role="group" aria-label="Filtrar produtos">
          <button
            type="button"
            className="ad-lp-vitrine__filter"
            data-active={activeFilter === null}
            onClick={() => {
              setActiveFilter(null);
              setExpanded(false);
            }}
          >
            Todos
          </button>
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className="ad-lp-vitrine__filter"
              data-active={activeFilter === option.key}
              aria-pressed={activeFilter === option.key}
              onClick={() => {
                setActiveFilter(activeFilter === option.key ? null : option.key);
                setExpanded(false);
              }}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      ) : null}
      <div className="ad-lp-vitrine__grid">
        {config.vitrineMobileProgressive ? (
          <>
            {filteredProducts
              .slice(0, config.vitrineMobileProgressive.initialCount)
              .map((product) => (
                <VitrineProductCard
                  key={product.id}
                  config={config}
                  product={product}
                  products={products}
                />
              ))}
            <details className="ad-lp-vitrine__progressive" data-testid="ad-lp-vitrine-progressive">
              <summary aria-controls="ad-lp-progressive-products">
                <span>{config.vitrineMobileProgressive.expandLabel}</span>
                <ChevronDown size={20} strokeWidth={2} aria-hidden="true" />
              </summary>
            </details>
            <div
              id="ad-lp-progressive-products"
              className="ad-lp-vitrine__progressive-grid"
            >
              {filteredProducts
                .slice(config.vitrineMobileProgressive.initialCount)
                .map((product) => (
                  <VitrineProductCard
                    key={product.id}
                    config={config}
                    product={product}
                    products={products}
                  />
                ))}
            </div>
          </>
        ) : (
          visibleProducts.map((product) => (
            <VitrineProductCard
              key={product.id}
              config={config}
              product={product}
              products={products}
            />
          ))
        )}
      </div>
      {!config.vitrineMobileProgressive && hasMore && !expanded ? (
        <div className="ad-lp-vitrine__more">
          <button type="button" onClick={() => setExpanded(true)}>
            Quero ver mais opções ({filteredProducts.length - initialCount})
          </button>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Os quatro tempos do pedido. Substitui "Por que somos diferentes" e "Como
 * funciona", que diziam quase a mesma coisa uma embaixo da outra. A numeração
 * `01–04` é legítima porque isto é uma sequência real, e só um dos tempos é
 * destacado: a promessa que a concorrência não faz.
 *
 * O CTA continua com `origin="como_funciona"` — a seção mudou de nome, o ponto
 * de conversão e o `cta_location` do evento não.
 */
function BeatsSection({ config, cta }: { config: LPConfig; cta: ReactNode }) {
  if (!config.beats?.length) return null;

  const chat = config.chatExample ? <ChatExampleCard chat={config.chatExample} /> : null;

  return (
    <section id="como-funciona" className="ad-lp-beats-section" aria-label="Como funciona">
      <header className="ad-lp-section-head">
        <h2>Do seu “oi” à porta de quem recebe.</h2>
      </header>
      <div className="ad-lp-beats__layout">
        <div className="ad-lp-beats__main">
          <ol className="ad-lp-beats" data-testid="ad-lp-beats">
            {config.beats.map((beat) => (
              <li
                className={`ad-lp-beats__item ${beat.key ? "ad-lp-beats__item--key" : ""}`}
                key={beat.title}
              >
                <h3>{beat.title}</h3>
                <p>{beat.body}</p>
              </li>
            ))}
          </ol>
          <div className="ad-lp-beats__cta">{cta}</div>
        </div>
        {chat ? <div className="ad-lp-beats__conversation">{chat}</div> : null}
      </div>
    </section>
  );
}

function NossaHistoriaSection({ config }: { config: LPConfig }) {
  const { nossaHistoria } = config;
  return (
    <section id="nossa-historia" className="ad-lp-historia" aria-label="Nossa História">
      <div className="ad-lp-historia__grid">
        <figure className="ad-lp-historia__media">
          <ResponsiveStorefrontImage
            alt={nossaHistoria.imageAlt}
            loading="lazy"
            sizes="(max-width: 780px) 100vw, 50vw"
          />
          <StoreFooter caption={config.storeCaption} />
        </figure>
        <div className="ad-lp-historia__body">
          <h2>{nossaHistoria.title}</h2>
          {nossaHistoria.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {nossaHistoria.stats?.length ? (
            <dl className="ad-lp-historia__stats">
              {nossaHistoria.stats.map((stat) => (
                <div className="ad-lp-historia__stat" key={stat.label}>
                  <dt className="ad-lp-historia__stat-value">
                    {config.historiaCountUp ? (
                      <CountUpValue value={stat.value} />
                    ) : (
                      stat.value
                    )}
                  </dt>
                  <dd className="ad-lp-historia__stat-label">{stat.label}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/**
 * As perguntas que decidem a compra (duração, cor, perfume) não podem esperar o
 * rodapé: elas vêm coladas na grade, onde a dúvida aparece.
 */
function VitrineFaqSection({ config }: { config: LPConfig }) {
  if (!config.vitrineFaq?.length) return null;
  return (
    <section
      id="duvidas-vitrine"
      className="ad-lp-faq ad-lp-faq--vitrine"
      aria-label={config.vitrineFaqTitle ?? "Dúvidas rápidas"}
      data-testid="ad-lp-vitrine-faq"
    >
      <header className="ad-lp-section-head">
        <h2>{config.vitrineFaqTitle ?? "Dúvidas rápidas"}</h2>
      </header>
      <div className="ad-lp-faq__list">
        {config.vitrineFaq.map((item) => (
          <details className="ad-lp-faq__item" key={item.question}>
            <summary>
              <span>{item.question}</span>
              <ChevronDown size={20} strokeWidth={2} aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/**
 * Um item com `bullets` vira uma resposta com tabela; o JSON-LD junta os dois em
 * texto corrido porque `acceptedAnswer.text` não tem lista.
 */
function faqAnswerText(item: FAQItem) {
  const rows = item.bullets?.map((row) => `${row.label}: ${row.value}.`).join(" ");
  return rows ? `${rows} ${item.answer}` : item.answer;
}

function FaqSection({ config }: { config: LPConfig }) {
  // `faqUseCommon: false` significa que a LP já absorveu as perguntas comuns na
  // própria lista — concatenar o COMMON_FAQ ali duplicaria pergunta.
  const faqItems =
    config.faqUseCommon === false ? config.faq : [...config.faq, ...COMMON_FAQ];
  // Renderiza no SSR: o rich result não pode depender de hidratação.
  const jsonLd = config.faqJsonLd
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: faqAnswerText(item) },
        })),
      }).replace(/</g, "\\u003c")
    : null;

  return (
    <section id="faq" className="ad-lp-faq" aria-label="Perguntas frequentes">
      <header className="ad-lp-section-head">
        <h2>Perguntas frequentes</h2>
      </header>
      <div className="ad-lp-faq__list">
        {faqItems.map((item) => (
          <details className="ad-lp-faq__item" key={item.question} open={item.defaultOpen}>
            <summary>
              <span>{item.question}</span>
              <ChevronDown size={20} strokeWidth={2} aria-hidden="true" />
            </summary>
            {item.bullets?.length ? (
              <ul className="ad-lp-faq__table">
                {item.bullets.map((row) => (
                  <li key={row.label}>
                    <span>{row.label}</span>
                    <b>{row.value}</b>
                  </li>
                ))}
              </ul>
            ) : null}
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
      <div className="ad-lp-faq__cta">
        <CtaButton config={config} origin="faq" />
      </div>
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      ) : null}
    </section>
  );
}

function StickyCta({ config }: { config: LPConfig }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Um handler de scroll aqui lia window.innerHeight a cada evento e chamava
    // setVisible; o re-render invalidava o layout que o evento seguinte lia de
    // novo, e o PageSpeed contabilizava 68 ms de reflow forçado. O observer
    // resolve o mesmo gatilho sem ler geometria.
    const sentinel = document.getElementById(STICKY_SENTINEL_ID);
    const target = config.mobileChromeAfterHero ? document.getElementById("hero") : sentinel;
    if (!target || typeof IntersectionObserver !== "function") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [config.mobileChromeAfterHero]);

  return (
    <div className="ad-lp-sticky" data-visible={visible} hidden={!visible}>
      <CtaButton config={config} origin="sticky" className="ad-lp-sticky__cta" />
    </div>
  );
}

function GuaranteeSection({ config }: { config: LPConfig }) {
  // Logo depois do hero é a posição de mais atrito: uma seção inteira ali
  // empurra a vitrine pra baixo. Compacta só nesse caso; no rodapé (posição
  // padrão) o tamanho não atrapalha, então fica como sempre foi.
  const compact = (config.sectionOrder ?? DEFAULT_SECTION_ORDER)[1] === "guarantee";
  return (
    <section
      className={`ad-lp-guarantee ${compact ? "ad-lp-guarantee--compact" : ""}`}
      aria-label="Garantia"
    >
      <div className="ad-lp-guarantee__inner">
        <span className="ad-lp-guarantee__icon" aria-hidden="true">
          <ShieldCheck size={compact ? 26 : 36} strokeWidth={1.6} />
        </span>
        <span className="ad-lp-guarantee__badge">{GUARANTEE.badge}</span>
        <h2 className="ad-lp-guarantee__title">{GUARANTEE.title}</h2>
        <p className="ad-lp-guarantee__body">{GUARANTEE.body}</p>
        <div className="ad-lp-guarantee__cta">
          <button
            type="button"
            className="ad-lp-guarantee__link"
            onClick={() => openAdLpWhatsApp({ config, origin: "guarantee" })}
          >
            {config.ctaCopy.guarantee ?? GUARANTEE.ctaLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

function TrustIcon({ icon }: { icon: "flower" | "camera" | "card" | "message" }) {
  const props = { size: 24, strokeWidth: 1.7, "aria-hidden": true as const };
  if (icon === "flower") return <Flower2 {...props} />;
  if (icon === "camera") return <Camera {...props} />;
  if (icon === "card") return <CreditCard {...props} />;
  return <MessageCircle {...props} />;
}

function IntegratedTrustSection({ config }: { config: LPConfig }) {
  const trust = config.integratedTrust;
  if (!trust) return null;

  return (
    <section className="ad-lp-trust" aria-label="Diferenciais e garantia" data-testid="ad-lp-trust">
      <header className="ad-lp-section-head">
        <h2>{trust.title}</h2>
        {trust.subtitle ? <p>{trust.subtitle}</p> : null}
      </header>
      <ul className="ad-lp-trust__items">
        {trust.items.map((item) => (
          <li key={item.title}>
            <span className="ad-lp-trust__icon">
              <TrustIcon icon={item.icon} />
            </span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </li>
        ))}
      </ul>
      <div className="ad-lp-trust__guarantee">
        <span className="ad-lp-trust__guarantee-icon" aria-hidden="true">
          <ShieldCheck size={36} strokeWidth={1.6} />
        </span>
        <div>
          <p className="ad-lp-trust__badge">{trust.guarantee.badge}</p>
          <h3>{trust.guarantee.title}</h3>
          <p>{trust.guarantee.body}</p>
        </div>
        <CtaButton config={config} origin="guarantee">
          {trust.guarantee.ctaLabel}
        </CtaButton>
      </div>
    </section>
  );
}

function FinalTrustIcon({ icon }: { icon: "star" | "camera" | "message" }) {
  const props = { size: 18, strokeWidth: 1.9, "aria-hidden": true as const };
  if (icon === "star") return <Star {...props} fill="currentColor" />;
  if (icon === "camera") return <Camera {...props} />;
  return <MessageCircle {...props} />;
}

function FinalCtaSection({ config }: { config: LPConfig }) {
  return (
    <section className="ad-lp-final" aria-label="Comprar pelo WhatsApp">
      <div className="ad-lp-final__shape ad-lp-final__shape--top" aria-hidden="true" />
      <div className="ad-lp-final__shape ad-lp-final__shape--bottom" aria-hidden="true" />
      <div className="ad-lp-final__inner">
        {config.finalCta?.eyebrow ? (
          <p className="ad-lp-final__eyebrow">{config.finalCta.eyebrow}</p>
        ) : null}
        <h2>{config.finalCta?.title ?? "Escolha agora seu buquê e fale com a gente."}</h2>
        <p>
          {config.finalCta?.body ??
            "A gente responde rápido no WhatsApp em horário comercial. Em segundos a gente confirma a data e o endereço da entrega."}
        </p>
        <div className="ad-lp-final__cta">
          <CtaButton config={config} origin="final">Comprar no WhatsApp</CtaButton>
        </div>
        {config.finalTrustItems?.length ? (
          <ul className="ad-lp-final__trust" aria-label="Confiança para comprar">
            {config.finalTrustItems.map((item) => (
              <li key={item.text}>
                <FinalTrustIcon icon={item.icon} />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="ad-lp-footer">
      <p>{BUSINESS_INFO.legalName} · CNPJ {BUSINESS_INFO.taxId}</p>
      <p>{BUSINESS_INFO.address.full}</p>
      <p>{BUSINESS_INFO.businessHours}</p>
      <p>WhatsApp {BUSINESS_INFO.whatsapp} · Tel. {BUSINESS_INFO.phone} · Cel. {BUSINESS_INFO.mobile}</p>
      <p>Entregas em {BUSINESS_INFO.regions}.</p>
    </footer>
  );
}

function PageSection({
  section,
  config,
  products,
}: {
  section: SectionKey;
  config: LPConfig;
  products: Product[];
}) {
  switch (section) {
    case "hero":
      return <HeroSection config={config} />;
    case "delivery-info":
      return <DeliveryInfoSection config={config} />;
    case "diferenciais":
      return <DifferentialsSection config={config} />;
    case "diferenciais-fundidos":
      return <DiferenciaisFusedSection />;
    case "comofunciona":
      return (
        <HowItWorksSection cta={<CtaButton config={config} origin="como_funciona" />} />
      );
    case "beats":
      return (
        <BeatsSection
          config={config}
          cta={<CtaButton config={config} origin="como_funciona" />}
        />
      );
    case "social":
      return <SocialProofSection config={config} />;
    case "vitrine":
      return (
        <>
          <VitrineSection config={config} products={products} />
          <VitrineFaqSection config={config} />
        </>
      );
    case "historia":
      return <NossaHistoriaSection config={config} />;
    case "bonus":
      return <BrandBonusSection />;
    case "faq":
      return <FaqSection config={config} />;
    case "guarantee":
      return <GuaranteeSection config={config} />;
    case "trust":
      return <IntegratedTrustSection config={config} />;
    case "final":
      return <FinalCtaSection config={config} />;
    default:
      return null;
  }
}

export default function AdLandingPage({ slug }: AdLandingPageProps) {
  const config = LP_CONFIGS[slug];
  const canonicalUrl = config.canonicalUrl ?? `https://${BRAND_DOMAIN}/${config.slug}`;
  const resolvedConfig = useResolvedConfig(config);

  useEffect(() => {
    if (resolvedConfig === config) return;
    const paramName = config.variantParam ?? "oferta";
    const value = new URLSearchParams(window.location.search).get(paramName);
    if (value) trackVariantSeen(config.slug, paramName, value);
  }, [config, resolvedConfig]);

  const products = useMemo(() => {
    const base = resolvedConfig.vitrineProductIds
      .map((id) => PRODUCTS[id])
      .filter(Boolean)
      .map((product) => {
        const override = resolvedConfig.productImageOverrides?.[product.id]?.trim();
        return override ? { ...product, image: override } : product;
      });
    if (!resolvedConfig.variantProductId) return base;
    // Produto do anúncio primeiro; sort é estável (ES2019+), a ordem original
    // do resto da vitrine não muda.
    return [...base].sort(
      (a, b) =>
        (a.id === resolvedConfig.variantProductId ? -1 : 0) -
        (b.id === resolvedConfig.variantProductId ? -1 : 0),
    );
  }, [resolvedConfig]);

  return (
    <div
      className="ad-lp-theme"
      data-accent={config.accent}
      data-slug={config.slug}
      data-chrome-after-hero={config.mobileChromeAfterHero || undefined}
    >
      <DocumentMeta
        title={config.pageTitle}
        description={config.pageDescription}
        canonical={canonicalUrl}
        ogTitle={config.pageTitle}
        ogDescription={config.pageDescription}
        ogUrl={canonicalUrl}
        ogImage={`https://${BRAND_DOMAIN}${resolveOgImagePath(config)}`}
      />
      <a className="ad-lp-skip-link" href="#ad-lp-main">
        Pular para o conteúdo principal
      </a>
      <BrandBar config={config} />
      <main id="ad-lp-main" tabIndex={-1}>
        {(config.sectionOrder ?? DEFAULT_SECTION_ORDER).map((section) => (
          <PageSection key={section} section={section} config={resolvedConfig} products={products} />
        ))}
      </main>
      <Footer />
      <StickyCta config={resolvedConfig} />
      <Suspense fallback={<div className="ad-lp-price-selector-placeholder" aria-hidden="true" />}>
        <PriceRangeSelector route={`/${config.slug}` as PriceRangeRoute} />
      </Suspense>
    </div>
  );
}
