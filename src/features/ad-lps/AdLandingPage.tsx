import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck2,
  CreditCard,
  Heart,
  Package,
  Search,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import heroFallbackUrl from "@/assets/hero-flowers.jpg";
import fachadaUrl from "@/assets/fachada.jpg";
import logoUrl from "@/assets/logo.png";
import { DocumentMeta } from "@/components/seo/DocumentMeta";
import {
  BRAND_BONUS,
  BRAND_DOMAIN,
  COMMON_FAQ,
  GLOBAL_CONFIG,
  LP_CONFIGS,
  PRODUCTS,
  type BrandBonus,
  type LPConfig,
  type Product,
} from "@/features/ad-lps/data/configs";
import {
  buildAdLpWhatsAppUrl,
  openAdLpWhatsApp,
} from "@/features/ad-lps/lib/whatsapp";
import "./theme.css";
const HERO_PLACEHOLDER = heroFallbackUrl;
const PRODUCT_PLACEHOLDER = "/lpb/placeholders/product.svg";
const STORE_BASE_URL = "https://www.planteumaflor.com";
const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
];

type AdLandingPageProps = {
  slug: string;
};

type GoogleReview = {
  reviewId: string;
  authorName: string;
  authorPhotoUrl?: string | null;
  rating: number;
  comment: string;
  relativeTime?: string;
  reviewCountLabel?: string;
};

const FALLBACK_REVIEWS: GoogleReview[] = [
  {
    reviewId: "rafaella-martins",
    authorName: "Rafaella Martins",
    authorPhotoUrl: null,
    rating: 5,
    relativeTime: "Há 13 semanas",
    reviewCountLabel: "4 avaliações",
    comment:
      "Atendimento maravilhoso, a qualidade das rosas e a perfeição do buquê não tem explicação. Fui atendida pelo Caio, super recomendo.",
  },
  {
    reviewId: "hellen-araujo",
    authorName: "Hellen Araújo",
    authorPhotoUrl: null,
    rating: 5,
    relativeTime: "Há 17 semanas",
    reviewCountLabel: "3 avaliações",
    comment:
      "Atendimento excepcional!! O moço que me atendeu foi muito atencioso e cuidadoso em cada detalhe! Trabalho impecável!!",
  },
  {
    reviewId: "taina-santos",
    authorName: "Tainá Santos",
    authorPhotoUrl: null,
    rating: 5,
    relativeTime: "Há 24 semanas",
    reviewCountLabel: "4 avaliações",
    comment:
      "O atendimento foi ótimo e muito cordial. Os arranjos são lindos e com valores justos, além do diferencial de fazerem entrega.",
  },
  {
    reviewId: "marcos-vinicius",
    authorName: "Marcos Vinícius",
    authorPhotoUrl: null,
    rating: 5,
    relativeTime: "Há 12 semanas",
    reviewCountLabel: "2 avaliações",
    comment:
      "Produto chegou no dia e na hora combinado, muito lindo, surpreendeu e superou minhas expectativas.",
  },
  {
    reviewId: "fabiana-moraes",
    authorName: "Fabiana Moraes",
    authorPhotoUrl: null,
    rating: 5,
    relativeTime: "Há 15 semanas",
    reviewCountLabel: "4 avaliações",
    comment:
      "Extremamente satisfeita, ótimo atendimento. As flores, mais que perfeitas! Obrigada pelo trabalho excelente!!",
  },
  {
    reviewId: "melissa-pimentel",
    authorName: "Melissa Pimentel",
    authorPhotoUrl: null,
    rating: 5,
    relativeTime: "16 de abr. de 2025",
    reviewCountLabel: "3 avaliações",
    comment:
      "Conversei com a empresa por WhatsApp e me responderam muito rápido. Funcionário Caio me atendeu, hiper simpático e paciente.",
  },
];

const FEATURED_REVIEW_ORDER = [
  "rafaella-martins",
  "hellen-araujo",
  "taina-santos",
  "marcos-vinicius",
  "fabiana-moraes",
  "melissa-pimentel",
  "gisele-galdiano",
  "patricia-gusmao",
  "alan-braz",
];

function ImageWithFallback({
  src,
  fallback,
  alt,
  className,
  loading = "lazy",
}: {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.src.endsWith(fallback)) return;
        image.src = fallback;
      }}
    />
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      className="ad-lp-cta__icon"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function CtaButton({
  config,
  origin,
  product,
  children,
  className = "",
}: {
  config: LPConfig;
  origin: "hero" | "vitrine" | "faq" | "sticky" | "como_funciona" | "final";
  product?: Product;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={buildAdLpWhatsAppUrl(config, product)}
      className={`ad-lp-cta ${className}`}
      data-testid={`ad-lp-cta-${origin}`}
      onClick={(event) => {
        event.preventDefault();
        openAdLpWhatsApp({ config, origin, product });
      }}
    >
      <span>{children || "Comprar no WhatsApp"}</span>
      <WhatsAppIcon />
    </a>
  );
}

function BonusIcon({ icon }: { icon: BrandBonus["icon"] }) {
  const props = { size: 22, strokeWidth: 1.7 };
  if (icon === "card") return <CreditCard {...props} />;
  if (icon === "package") return <Package {...props} />;
  return <Truck {...props} />;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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
          .slice(0, 9);

        if (alive && featured.length) setReviews(featured);
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  return reviews;
}

function buildStoreProductUrl(product: Product) {
  const url = new URL(`${STORE_BASE_URL}/produtos/${product.storeSlug}`);

  if (typeof window !== "undefined") {
    const currentParams = new URLSearchParams(window.location.search);
    ATTRIBUTION_KEYS.forEach((key) => {
      const value = currentParams.get(key);
      if (value) url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

function trackStoreProductClick(config: LPConfig, product: Product) {
  if (typeof window === "undefined") return;

  const destinationUrl = buildStoreProductUrl(product);
  window.dataLayer?.push({
    event: "ad_lp_product_click",
    lp_slug: config.slug,
    cta_location: "vitrine",
    cta_label: "produto_site",
    product_id: product.id,
    product_name: product.name,
    product_price: product.priceBrl,
    destination_url: destinationUrl,
  });
}

function HeroSection({ config }: { config: LPConfig }) {
  return (
    <section className="ad-lp-hero">
      <motion.div
        className="ad-lp-hero__media"
        initial={{ scale: 1.03, opacity: 0.82 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <ImageWithFallback
          src={fachadaUrl}
          fallback={HERO_PLACEHOLDER}
          alt="Fachada da Plante Uma Flor em Goiânia"
          className="ad-lp-hero__image"
          loading="eager"
        />
      </motion.div>

      <motion.div
        className="ad-lp-hero__overlay"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
      >
        <div className="ad-lp-hero__content">
          {config.priceAnchor ? <p className="ad-lp-hero__anchor">{config.priceAnchor}</p> : null}
          <h1 className="ad-lp-hero__title">{config.headline}</h1>
          <p className="ad-lp-hero__sub">{config.subheadline}</p>
          <div className="ad-lp-hero__actions">
            <CtaButton config={config} origin="hero" className="ad-lp-hero__cta" />
          </div>
          <ul className="ad-lp-hero__badges" aria-label="Diferenciais">
            <li><Truck size={16} aria-hidden="true" />Entrega hoje em Goiânia</li>
            <li><CalendarCheck2 size={16} aria-hidden="true" />Encomenda com data combinada</li>
            <li><Sparkles size={16} aria-hidden="true" />Embalagem caprichada e cartão grátis</li>
          </ul>
        </div>
      </motion.div>
    </section>
  );
}

function BrandBar() {
  return (
    <header className="ad-lp-brand-bar">
      <a href="#hero" className="ad-lp-logo" aria-label="Plante Uma Flor">
        <img src={logoUrl} alt="Plante Uma Flor" />
      </a>
      <nav className="ad-lp-nav" aria-label="Seções da página">
        <a href="#bonus">Diferenciais</a>
        <a href="#como-funciona">Como funciona</a>
        <a href="#vitrine">Produtos</a>
        <a href="#depoimentos">Depoimentos</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div
        className="ad-lp-rating"
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
    <motion.section
      id="bonus"
      className="ad-lp-bonus"
      aria-label="Por que nos escolher"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.5 }}
    >
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
    </motion.section>
  );
}

const PROCESS_STEPS = [
  {
    num: "01",
    Icon: Search,
    title: "Escolha o arranjo",
    body: "Olha a vitrine aqui embaixo ou dá uma passada no catálogo completo.",
  },
  {
    num: "02",
    Icon: Sparkles,
    title: "Acerta tudo no WhatsApp",
    body: "A gente confirma a data, escreve o cartão à mão e ainda manda foto antes de sair pra entrega.",
  },
  {
    num: "03",
    Icon: Heart,
    title: "Encante quem você ama",
    body: "Entrega cuidadosa em Goiânia e região, no dia e na hora combinados.",
  },
];

function ProcessSection({ config }: { config: LPConfig }) {
  return (
    <section id="como-funciona" className="ad-lp-process" aria-label="Como funciona">
      <motion.header
        className="ad-lp-section-head"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.45 }}
      >
        <h2>Como funciona</h2>
        <p>Três passos para presentear com flores especiais, sem complicação.</p>
      </motion.header>
      <ol className="ad-lp-process__grid">
        {PROCESS_STEPS.map((step, index) => (
          <motion.li
            className="ad-lp-process__item"
            key={step.num}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <span className="ad-lp-process__num" aria-hidden="true">{step.num}</span>
            <span className="ad-lp-process__icon" aria-hidden="true">
              <step.Icon size={26} strokeWidth={1.6} />
            </span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </motion.li>
        ))}
      </ol>
      <div className="ad-lp-process__cta">
        <CtaButton config={config} origin="como_funciona">{config.ctaText}</CtaButton>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <figure className="ad-lp-proof__card">
      <figcaption className="ad-lp-proof__person">
        <span className="ad-lp-proof__avatar" aria-hidden="true">
          {review.authorPhotoUrl ? (
            <img src={review.authorPhotoUrl} alt="" loading="lazy" />
          ) : (
            getInitials(review.authorName)
          )}
        </span>
        <span>
          <strong>{review.authorName}</strong>
          <small>{review.reviewCountLabel || "Avaliação no Google"}</small>
        </span>
      </figcaption>
      <div className="ad-lp-proof__stars" aria-label={`${review.rating} estrelas`}>
        {Array.from({ length: 5 }).map((_, starIndex) => (
          <Star
            key={starIndex}
            size={15}
            fill="currentColor"
            aria-hidden="true"
            className={starIndex < review.rating ? "" : "ad-lp-proof__star-muted"}
          />
        ))}
      </div>
      <blockquote>{review.comment}</blockquote>
      {review.relativeTime ? <p className="ad-lp-proof__date">{review.relativeTime}</p> : null}
    </figure>
  );
}

function SocialProofSection() {
  const reviews = useGoogleReviews();
  const marqueeTrack = [...reviews, ...reviews];

  return (
    <section id="depoimentos" className="ad-lp-proof" aria-label="Avaliações de clientes">
      <motion.header
        className="ad-lp-section-head"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.45 }}
      >
        <p>{GLOBAL_CONFIG.googleReviewsCount} avaliações · Google {GLOBAL_CONFIG.googleRating}★</p>
        <h2>Quem comprou, indica.</h2>
      </motion.header>
      <div className="ad-lp-proof__marquee" aria-hidden="false">
        <div className="ad-lp-proof__track">
          {marqueeTrack.map((review, index) => (
            <ReviewCard
              key={`${review.reviewId || review.authorName}-${index}`}
              review={review}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function VitrineSection({ config, products }: { config: LPConfig; products: Product[] }) {
  return (
    <section id="vitrine" className="ad-lp-vitrine" aria-label={config.vitrineTitle}>
      <header className="ad-lp-section-head">
        <h2>{config.vitrineTitle}</h2>
        <p>{config.vitrineSubtitle}</p>
      </header>
      <div className="ad-lp-vitrine__grid">
        {products.map((product, index) => (
          <motion.article
            className={`ad-lp-card ${
              product.id === config.vitrineHighlightId ? "ad-lp-card--featured" : ""
            }`}
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.16 }}
            transition={{ duration: 0.42, delay: Math.min(index * 0.04, 0.18) }}
          >
            <a
              href={buildStoreProductUrl(product)}
              className="ad-lp-card__link"
              data-testid={`product-card-${product.id}`}
              onClick={() => trackStoreProductClick(config, product)}
            >
              <span className="ad-lp-card__media">
                <ImageWithFallback
                  src={product.image}
                  fallback={PRODUCT_PLACEHOLDER}
                  alt={product.name}
                />
              </span>
              <span className="ad-lp-card__body">
                <span className="ad-lp-card__name">{product.name}</span>
                <span className="ad-lp-card__price">{product.priceBrl}</span>
                <span className="ad-lp-card__installments">{product.installments}</span>
                <span className="ad-lp-card__cta">
                  Ver no site <ArrowRight size={16} />
                </span>
              </span>
            </a>
          </motion.article>
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
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.3);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="ad-lp-sticky" data-visible={visible} aria-hidden={!visible}>
      <CtaButton config={config} origin="sticky" className="ad-lp-sticky__cta" />
    </div>
  );
}

function FinalCtaSection({ config }: { config: LPConfig }) {
  return (
    <section className="ad-lp-final" aria-label="Comprar pelo WhatsApp">
      <div className="ad-lp-final__shape ad-lp-final__shape--top" aria-hidden="true" />
      <div className="ad-lp-final__shape ad-lp-final__shape--bottom" aria-hidden="true" />
      <motion.div
        className="ad-lp-final__inner"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55 }}
      >
        <h2>Escolha agora seu buquê e fala com a gente.</h2>
        <p>A gente responde rápido no WhatsApp em horário comercial. Em segundos a gente confirma a data e o endereço da entrega.</p>
        <div className="ad-lp-final__cta">
          <CtaButton config={config} origin="final">Comprar no WhatsApp</CtaButton>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="ad-lp-footer">
      <p>{GLOBAL_CONFIG.brandName} · {GLOBAL_CONFIG.brandTagline} · {GLOBAL_CONFIG.cityRegion}</p>
      <p>Entregas em Goiânia, Aparecida de Goiânia e Senador Canedo.</p>
    </footer>
  );
}

export default function AdLandingPage({ slug }: AdLandingPageProps) {
  const config = LP_CONFIGS[slug];

  const products = useMemo(
    () => config.vitrineProductIds.map((id) => PRODUCTS[id]).filter(Boolean),
    [config],
  );

  return (
    <div className="ad-lp-theme" data-accent={config.accent}>
      <DocumentMeta
        title={config.pageTitle}
        description={config.pageDescription}
        canonical={`https://${BRAND_DOMAIN}/${config.slug}`}
        ogTitle={config.pageTitle}
        ogDescription={config.pageDescription}
        ogUrl={`https://${BRAND_DOMAIN}/${config.slug}`}
        ogImage={`https://${BRAND_DOMAIN}${config.heroImage}`}
      />
      <BrandBar />
      <main>
        <div id="hero" />
        <HeroSection config={config} />
        <BrandBonusSection />
        <ProcessSection config={config} />
        <VitrineSection config={config} products={products} />
        <SocialProofSection />
        <FaqSection config={config} />
        <FinalCtaSection config={config} />
      </main>
      <Footer />
      <StickyCta config={config} />
    </div>
  );
}
