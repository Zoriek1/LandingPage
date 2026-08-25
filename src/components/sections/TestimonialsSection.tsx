import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const STAR_SLOTS = [0, 1, 2, 3, 4];
const REVIEWS_ENDPOINT = "/lpb/google-reviews.json";
const MAX_REVIEWS = 6;

export type TestimonialItem = {
  reviewId: string;
  authorName: string;
  rating: number;
  comment: string;
  reviewCountLabel?: string;
};

export type TestimonialsSectionConfig = {
  title: string;
  description: string;
  columns: 3 | 4;
  items: readonly TestimonialItem[];
};

type TestimonialsSectionProps = {
  config?: TestimonialsSectionConfig;
};

// Fallback estático: usado se o fetch das avaliações do Google falhar.
const FALLBACK_REVIEWS: TestimonialItem[] = [
  {
    reviewId: "camila-r",
    authorName: "Camila R.",
    rating: 5,
    comment: "Chegou impecável e ficou ainda mais bonito do que eu esperava. Minha mãe amou!",
    reviewCountLabel: "Avaliação no Google",
  },
  {
    reviewId: "rodrigo-m",
    authorName: "Rodrigo M.",
    rating: 5,
    comment: "Atendimento excelente e flores lindíssimas. Surpreendi minha esposa no aniversário.",
    reviewCountLabel: "Avaliação no Google",
  },
  {
    reviewId: "ana-paula-s",
    authorName: "Ana Paula S.",
    rating: 5,
    comment: "Comprei para presentear minha sogra e foi um sucesso absoluto. Super recomendo!",
    reviewCountLabel: "Avaliação no Google",
  },
  {
    reviewId: "fernanda-l",
    authorName: "Fernanda L.",
    rating: 5,
    comment: "Praticidade incrível! Escolhi pelo site, paguei em minutos e chegou perfeito.",
    reviewCountLabel: "Avaliação no Google",
  },
];

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const useGoogleReviews = (enabled: boolean) => {
  const [reviews, setReviews] = useState<TestimonialItem[]>(FALLBACK_REVIEWS);
  const [summary, setSummary] = useState({ rating: "4.9", count: "203" });

  useEffect(() => {
    if (!enabled || typeof fetch !== "function") return;

    let alive = true;
    fetch(REVIEWS_ENDPOINT)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!alive || !payload) return;

        const list: TestimonialItem[] = Array.isArray(payload.reviews) ? payload.reviews : [];
        const featured = list
          .filter((review) => review.rating >= 5 && review.comment)
          .slice(0, MAX_REVIEWS);

        if (featured.length) setReviews(featured);
        if (payload.businessRating) {
          setSummary({
            rating: String(payload.businessRating),
            count: String(payload.businessReviewCount ?? "203"),
          });
        }
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, [enabled]);

  return { reviews, summary };
};

const TestimonialsSection = ({ config }: TestimonialsSectionProps) => {
  const { reviews: googleReviews, summary } = useGoogleReviews(!config);
  const reviews = config?.items ?? googleReviews;
  const title = config?.title ?? "Quem comprou, indica";
  const description = config?.description ?? "A satisfação de quem confia na Plante Uma Flor.";
  const columns = config?.columns ?? 3;

  return (
    <section id="depoimentos" className="bg-primary py-section-y">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          {!config && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-on-dark/30 bg-accent-on-dark/10 px-4 py-1.5 font-body text-eyebrow font-semibold uppercase text-accent-on-dark">
              <Star size={14} className="fill-accent-on-dark text-accent-on-dark" />
              Google {summary.rating} · {summary.count} avaliações
            </span>
          )}
          <h2 className="mb-4 font-display text-h2 font-semibold text-primary-foreground">
            {title}
          </h2>
          <p className="mx-auto max-w-md font-body text-primary-foreground/60">
            {description}
          </p>
        </motion.div>

        <div
          className={`grid gap-6 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
        >
          {reviews.map((review, i) => (
            <motion.figure
              key={review.reviewId}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.08, 0.4) }}
              className="flex h-full flex-col rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur-sm"
            >
              <div className="mb-4 flex gap-1" aria-label={`${review.rating} estrelas`}>
                {STAR_SLOTS.map((j) =>
                  j < review.rating ? (
                    <Star key={j} size={16} className="fill-accent-on-dark text-accent-on-dark" />
                  ) : null,
                )}
              </div>
              <blockquote className="mb-5 flex-1 font-body text-sm italic leading-relaxed text-primary-foreground/85">
                "{review.comment}"
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-on-dark/20 font-body text-xs font-semibold text-accent-on-dark"
                  aria-hidden="true"
                >
                  {getInitials(review.authorName)}
                </span>
                <span className="leading-tight">
                  <span className="block font-body text-sm font-semibold text-accent-on-dark">
                    {review.authorName}
                  </span>
                  <span className="block font-body text-xs text-primary-foreground/50">
                    {review.reviewCountLabel || "Avaliação publica no Google"}
                  </span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
