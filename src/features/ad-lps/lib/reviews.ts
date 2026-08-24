export type GoogleReview = {
  reviewId: string;
  authorName: string;
  authorPhotoUrl?: string | null;
  rating: number;
  comment: string;
  relativeTime?: string;
  reviewCountLabel?: string;
};

export const FALLBACK_REVIEWS: GoogleReview[] = [
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
      "Conversei com a empresa por WhatsApp e me responderam muito rápido! Funcionário Caio me atendeu, hiper simpático e paciente, com certeza vou comprar mais vezes. Flores lindas!!",
  },
  {
    reviewId: "sffart-gamer",
    authorName: "sffart gamer",
    authorPhotoUrl: null,
    rating: 5,
    relativeTime: "Há 26 semanas",
    reviewCountLabel: "10 avaliações",
    comment:
      "Flores lindas e cheirosas, além de um atendimento direto, sem ser grosseiro, e solícito. Muito obrigado pela experiência.",
  },
];

export const FEATURED_REVIEW_ORDER = [
  "rafaella-martins",
  "hellen-araujo",
  "taina-santos",
  "marcos-vinicius",
  "fabiana-moraes",
  "melissa-pimentel",
  "gisele-galdiano",
  "patricia-gusmao",
  "alan-braz",
  "sffart-gamer",
];

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * Reordena as avaliações segundo `testimonialOrder` da LP. Ids não listados
 * mantêm a ordem original logo depois dos listados — LPs que ainda usam as
 * chaves antigas (`sheila`, `taina`...) ficam exatamente como estavam.
 */
export function orderReviews(
  reviews: GoogleReview[],
  testimonialOrder?: string[],
): GoogleReview[] {
  if (!testimonialOrder?.length) return reviews;
  const rank = new Map(testimonialOrder.map((id, index) => [id, index]));
  return reviews
    .map((review, index) => ({ review, index }))
    .sort((a, b) => {
      const aRank = rank.get(a.review.reviewId) ?? Number.MAX_SAFE_INTEGER;
      const bRank = rank.get(b.review.reviewId) ?? Number.MAX_SAFE_INTEGER;
      return aRank === bRank ? a.index - b.index : aRank - bRank;
    })
    .map((entry) => entry.review);
}
