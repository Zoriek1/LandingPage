import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowDown,
  Camera,
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
import { PriceRangeSelector } from "@/components/conversion/PriceRangeSelector";
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
  inferProductBadge,
  type BrandBonus,
  type CtaOriginKey,
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
import { HeroReviewCard, ReviewCard } from "@/features/ad-lps/components/ReviewCard";
import { DifferentialCard } from "@/features/ad-lps/components/DifferentialCard";
import { DiferenciaisFusedSection } from "@/features/ad-lps/components/DiferenciaisFusedSection";
import { HowItWorksSection } from "@/features/ad-lps/components/HowItWorksSection";
import { HeroBadges } from "@/features/ad-lps/components/HeroBadges";
import { StoreFooter } from "@/features/ad-lps/components/StoreFooter";
import {
  buildAdLpWhatsAppUrl,
  openAdLpWhatsApp,
} from "@/features/ad-lps/lib/whatsapp";
import {
  FACHADA_SOURCES,
  getHeroSources,
  resolveOgImagePath,
  type PictureSources,
} from "@/features/ad-lps/lib/hero-images";
import { BUSINESS_INFO } from "@/lib/business-info";
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
  return (
    <button
      type="button"
      className={`ad-lp-cta ${className}`}
      data-testid={`ad-lp-cta-${origin}`}
      onClick={() => openAdLpWhatsApp({ config, origin })}
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

function HeroSection({ config }: { config: LPConfig }) {
  const scrollToProducts = () => {
    document.getElementById("vitrine")?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  const heroSources = getHeroSources(config.slug);

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
          <div className="ad-lp-hero__actions">
            <CtaButton config={config} origin="hero" className="ad-lp-hero__cta" />
            <button
              type="button"
              className="ad-lp-secondary-cta"
              data-testid="ad-lp-see-products"
              onClick={scrollToProducts}
            >
              <span>Ver produtos</span>
              <ArrowDown size={19} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
          <HeroBadges config={config} />
        </div>
      </div>
    </section>
  );
}

function BrandBar({ config }: { config: LPConfig }) {
  const minimal = config.navMode === "minimal";
  return (
    <header className={`ad-lp-brand-bar ${minimal ? "ad-lp-brand-bar--minimal" : ""}`}>
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
    title: "Por que somos diferentes",
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

  useEffect(() => {
    if (paused || prefersReducedMotion()) return;
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
  }, [paused]);

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
    </section>
  );
}

function ProductBadgePill({ badge }: { badge: ProductBadge }) {
  const label =
    badge === "mais-vendido"
      ? "Mais vendido"
      : badge === "custo-beneficio"
      ? "Custo-benefício"
      : "Premium";
  return (
    <span className={`ad-lp-card__badge ad-lp-card__badge--${badge}`}>
      {label}
    </span>
  );
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

function VitrineSection({
  config,
  products,
}: {
  config: LPConfig;
  products: Product[];
}) {
  const initialCount = Math.min(config.vitrineVisibleCount ?? 6, products.length);
  const [expanded, setExpanded] = useState(false);
  const visibleProducts = expanded ? products : products.slice(0, initialCount);
  const hasMore = products.length > initialCount;

  return (
    <section id="vitrine" className="ad-lp-vitrine" aria-label={config.vitrineTitle}>
      <header className="ad-lp-section-head">
        <h2>{config.vitrineTitle}</h2>
        <p>{config.vitrineSubtitle}</p>
      </header>
      <div className="ad-lp-vitrine__grid">
        {visibleProducts.map((product) => {
          const featured = product.id === config.vitrineHighlightId;
          const badge = inferProductBadge(product, products, config.vitrineHighlightId);
          const showScarcity =
            !!config.scarcityMessage &&
            (badge === "mais-vendido" ||
              badge === "custo-beneficio" ||
              !!config.scarcityAppliesToAll);
          const note = config.vitrineProductNotes?.[product.id];
          return (
            <article
              className={`ad-lp-card ${featured ? "ad-lp-card--featured" : ""}`}
              key={product.id}
            >
              {/* Só o selo de categoria fica sobre a foto. O de prazo desceu pro
                  corpo do card: empilhados, os dois tampavam metade da flor no
                  card de 156px do mobile. */}
              {badge ? <ProductBadgePill badge={badge} /> : null}
              <a
                href={buildAdLpWhatsAppUrl(config, product)}
                className="ad-lp-card__link"
                data-testid={`product-card-${product.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  openAdLpWhatsApp({ config, origin: "vitrine", product });
                }}
              >
                <span className="ad-lp-card__media">
                  <ImageWithFallback
                    src={product.image}
                    fallback={PRODUCT_PLACEHOLDER}
                    alt={product.name}
                    srcSet={getProductImageSrcSet(product.image)}
                    sizes={featured ? FEATURED_CARD_SIZES : CARD_SIZES}
                  />
                </span>
                <span className="ad-lp-card__body">
                  {note ? <span className="ad-lp-card__note">{note}</span> : null}
                  <span className="ad-lp-card__name">{product.name}</span>
                  <ProductDetailsList product={product} />
                  {showScarcity ? (
                    <span className="ad-lp-card__scarcity">{config.scarcityMessage}</span>
                  ) : null}
                  <span className="ad-lp-card__price">{product.priceBrl}</span>
                  <span className="ad-lp-card__installments">{product.installments}</span>
                  <span className="ad-lp-card__cta">
                    {config.vitrineCardCta ?? "Quero encomendar pelo WhatsApp"}
                  </span>
                </span>
              </a>
            </article>
          );
        })}
      </div>
      {hasMore && !expanded ? (
        <div className="ad-lp-vitrine__more">
          <button type="button" onClick={() => setExpanded(true)}>
            Quero ver mais opções ({products.length - initialCount})
          </button>
        </div>
      ) : null}
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
          <StoreFooter />
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
                  <dt className="ad-lp-historia__stat-value">{stat.value}</dt>
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
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FaqSection({ config }: { config: LPConfig }) {
  const faqItems = [...config.faq, ...COMMON_FAQ];
  return (
    <section id="faq" className="ad-lp-faq" aria-label="Perguntas frequentes">
      <header className="ad-lp-section-head">
        <h2>Perguntas frequentes</h2>
      </header>
      <div className="ad-lp-faq__list">
        {faqItems.map((item) => (
          <details className="ad-lp-faq__item" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
      <div className="ad-lp-faq__cta">
        <CtaButton config={config} origin="faq" />
      </div>
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
    if (!sentinel || typeof IntersectionObserver !== "function") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="ad-lp-sticky" data-visible={visible} hidden={!visible}>
      <CtaButton config={config} origin="sticky" className="ad-lp-sticky__cta" />
    </div>
  );
}

function GuaranteeSection({ config }: { config: LPConfig }) {
  return (
    <section className="ad-lp-guarantee" aria-label="Garantia">
      <div className="ad-lp-guarantee__inner">
        <span className="ad-lp-guarantee__icon" aria-hidden="true">
          <ShieldCheck size={36} strokeWidth={1.6} />
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

function FinalCtaSection({ config }: { config: LPConfig }) {
  return (
    <section className="ad-lp-final" aria-label="Comprar pelo WhatsApp">
      <div className="ad-lp-final__shape ad-lp-final__shape--top" aria-hidden="true" />
      <div className="ad-lp-final__shape ad-lp-final__shape--bottom" aria-hidden="true" />
      <div className="ad-lp-final__inner">
        <h2>Escolha agora seu buquê e fala com a gente.</h2>
        <p>A gente responde rápido no WhatsApp em horário comercial. Em segundos a gente confirma a data e o endereço da entrega.</p>
        <div className="ad-lp-final__cta">
          <CtaButton config={config} origin="final">Comprar no WhatsApp</CtaButton>
        </div>
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
    case "diferenciais":
      return <DifferentialsSection config={config} />;
    case "diferenciais-fundidos":
      return <DiferenciaisFusedSection />;
    case "comofunciona":
      return (
        <HowItWorksSection cta={<CtaButton config={config} origin="como_funciona" />} />
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
    case "final":
      return <FinalCtaSection config={config} />;
    default:
      return null;
  }
}

export default function AdLandingPage({ slug }: AdLandingPageProps) {
  const config = LP_CONFIGS[slug];
  const canonicalUrl = config.canonicalUrl ?? `https://${BRAND_DOMAIN}/${config.slug}`;

  const products = useMemo(
    () => config.vitrineProductIds.map((id) => PRODUCTS[id]).filter(Boolean),
    [config],
  );

  return (
    <div className="ad-lp-theme" data-accent={config.accent}>
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
          <PageSection key={section} section={section} config={config} products={products} />
        ))}
      </main>
      <Footer />
      <StickyCta config={config} />
      <PriceRangeSelector route={`/${config.slug}` as PriceRangeRoute} />
    </div>
  );
}
