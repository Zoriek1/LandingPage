import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { getInitials, type GoogleReview } from "@/features/ad-lps/lib/reviews";

const DEFAULT_SEAL_TEXT = "Cliente real no Google";

const HIGHLIGHT_PHRASES = [
  "mais bonito que na foto",
  "entrega super rápida",
  "atendimento impecável",
  "super recomendo",
  "qualidade das rosas",
  "trabalho impecável",
  "extremamente satisfeita",
  "mais que perfeitas",
  "superou minhas expectativas",
];

function renderHighlightedComment(comment: string): ReactNode {
  const lower = comment.toLowerCase();
  const ranges: { start: number; end: number }[] = [];
  HIGHLIGHT_PHRASES.forEach((phrase) => {
    let cursor = 0;
    while (true) {
      const index = lower.indexOf(phrase, cursor);
      if (index === -1) break;
      ranges.push({ start: index, end: index + phrase.length });
      cursor = index + phrase.length;
    }
  });

  if (!ranges.length) return comment;

  ranges.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  const parts: ReactNode[] = [];
  let cursor = 0;
  merged.forEach((range, idx) => {
    if (range.start > cursor) {
      parts.push(comment.slice(cursor, range.start));
    }
    parts.push(
      <mark className="ad-lp-proof__highlight" key={`hl-${idx}`}>
        {comment.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });
  if (cursor < comment.length) {
    parts.push(comment.slice(cursor));
  }
  return parts;
}

function ReviewAvatar({ review }: { review: GoogleReview }) {
  return (
    <span className="ad-lp-proof__avatar" aria-hidden="true">
      {review.authorPhotoUrl ? (
        <img src={review.authorPhotoUrl} alt="" loading="lazy" width="44" height="44" />
      ) : (
        getInitials(review.authorName)
      )}
    </span>
  );
}

export function ReviewCard({
  review,
  showAvatar = true,
  sealText = DEFAULT_SEAL_TEXT,
}: {
  review: GoogleReview;
  showAvatar?: boolean;
  sealText?: string;
}) {
  return (
    <figure className="ad-lp-proof__card">
      <figcaption className="ad-lp-proof__person">
        {showAvatar ? <ReviewAvatar review={review} /> : null}
        <span>
          <strong>{review.authorName}</strong>
          <small>{review.reviewCountLabel || sealText}</small>
        </span>
      </figcaption>
      <div className="ad-lp-proof__stars" role="img" aria-label={`${review.rating} estrelas`}>
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
      <blockquote>{renderHighlightedComment(review.comment)}</blockquote>
      <p className="ad-lp-proof__date">Avaliação pública no Google</p>
    </figure>
  );
}

export function HeroReviewCard({
  review,
  showAvatar = true,
  sealText = DEFAULT_SEAL_TEXT,
}: {
  review: GoogleReview;
  showAvatar?: boolean;
  sealText?: string;
}) {
  return (
    <figure className="ad-lp-proof__hero">
      <div className="ad-lp-proof__hero-stars" role="img" aria-label={`${review.rating} estrelas`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={20} fill="currentColor" aria-hidden="true" />
        ))}
      </div>
      <blockquote>{renderHighlightedComment(review.comment)}</blockquote>
      <figcaption className="ad-lp-proof__hero-author">
        {showAvatar ? <ReviewAvatar review={review} /> : null}
        <span>
          <strong>{review.authorName}</strong>
          <span> · {sealText}</span>
        </span>
      </figcaption>
    </figure>
  );
}
