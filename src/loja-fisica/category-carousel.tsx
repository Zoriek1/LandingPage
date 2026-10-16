import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import type { PanInfo } from "framer-motion";

/**
 * Carrossel das categorias de /loja-fisica/.
 *
 * Porta a mecânica do feature-carousel do 21st.dev: pilha de cartões em que o
 * ativo fica no centro e o anterior e o próximo espiam atrás, com spring do
 * framer-motion. Fica de fora tudo o que era enfeite do original (painel azul,
 * chips, gradientes, glow, ícones hugeicons, Tailwind inline). O visual vem do
 * style.css da página, só com tokens.
 *
 * As fotos chegam do HTML estático (ver carousels.tsx). Geometria combinada com
 * o CSS: o cartão ocupa 76% da largura do palco (inset de 12% em cada lado) e
 * é 4:5; o palco tem aspect-ratio 100 / 95. Os vizinhos espiam dentro desses
 * 12%, então PEEK_X não pode crescer sem mexer no inset do CSS.
 */

export interface CarouselSource {
  type?: string;
  srcSet: string;
  sizes?: string;
  media?: string;
}

export interface CarouselSlide {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  /** Legenda curta (data-caption do <li>, com o alt como reserva). */
  caption: string;
  width?: number;
  height?: number;
  sources: CarouselSource[];
}

export interface CategoryCarouselProps {
  /** Nome da categoria: vira o aria-label do grupo e entra nos nomes dos botões. */
  label: string;
  slides: CarouselSlide[];
  autoPlayMs?: number;
}

export const CAROUSEL_AUTOPLAY_MS = 4500;

const SWIPE_DISTANCE_PX = 48;
const SWIPE_VELOCITY_PX_S = 450;
const IN_VIEW_THRESHOLD = 0.25;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const PEEK_X = 18;
const SPRING = { type: "spring", stiffness: 260, damping: 25, mass: 0.8 } as const;
const INSTANT = { duration: 0 } as const;

type CardStatus = "active" | "prev" | "next" | "hidden";

const CARD_POSE = {
  active: { x: "0%", scale: 1, rotate: 0, opacity: 1 },
  prev: { x: `-${PEEK_X}%`, scale: 0.86, rotate: -3, opacity: 0.45 },
  next: { x: `${PEEK_X}%`, scale: 0.86, rotate: 3, opacity: 0.45 },
  hidden: { x: "0%", scale: 0.72, rotate: 0, opacity: 0 },
} as const;

const mod = (value: number, size: number) => ((value % size) + size) % size;

/** Distância assinada pelo caminho mais curto no anel de `len` fotos. */
function shortestDiff(index: number, current: number, len: number): number {
  let diff = index - current;
  if (diff > len / 2) diff -= len;
  if (diff < -len / 2) diff += len;
  return diff;
}

function getCardStatus(index: number, current: number, len: number): CardStatus {
  const diff = shortestDiff(index, current, len);
  if (diff === 0) return "active";
  if (diff === -1) return "prev";
  if (diff === 1) return "next";
  return "hidden";
}

/** -1 volta, 1 avança, 0 ignora o gesto. Arrastar para a esquerda avança. */
function swipeDirection({ offset, velocity }: Pick<PanInfo, "offset" | "velocity">): -1 | 0 | 1 {
  const strong = Math.abs(offset.x) > SWIPE_DISTANCE_PX || Math.abs(velocity.x) > SWIPE_VELOCITY_PX_S;
  if (!strong) return 0;
  const dx = offset.x || velocity.x;
  return dx < 0 ? 1 : -1;
}

function readReducedMotion(): boolean {
  try {
    return typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
  } catch {
    return false;
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduced(query.matches);
    sync();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", sync);
      return () => query.removeEventListener("change", sync);
    }
    query.addListener?.(sync);
    return () => query.removeListener?.(sync);
  }, []);

  return reduced;
}

/** Foco que merece pausar o autoplay: teclado, não o clique do mouse. */
function hasVisibleFocus(target: EventTarget): boolean {
  try {
    return (target as Element).matches(":focus-visible");
  } catch {
    return true;
  }
}

const isTouchPointer = (event: ReactPointerEvent) => event.pointerType === "touch";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="category-carousel-icon"
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function CarouselPicture({ slide, eager }: { slide: CarouselSlide; eager: boolean }) {
  return (
    <picture className="category-carousel-picture">
      {slide.sources.map((source, index) => (
        <source key={index} type={source.type} srcSet={source.srcSet} sizes={source.sizes} media={source.media} />
      ))}
      <img
        className="category-carousel-img"
        src={slide.src}
        srcSet={slide.srcSet}
        sizes={slide.sizes}
        alt={slide.alt}
        width={slide.width}
        height={slide.height}
        loading={eager ? "eager" : "lazy"}
        // A 1ª foto troca a do HTML estático: decodificação síncrona evita um quadro em branco.
        decoding={eager ? "sync" : "async"}
        draggable={false}
      />
    </picture>
  );
}

function CarouselStack({ label, slides, autoPlayMs = CAROUSEL_AUTOPLAY_MS }: CategoryCarouselProps) {
  const total = slides.length;
  const reduced = usePrefersReducedMotion();

  // `step` cresce sem limite (como no original): o índice é step mod total e os
  // cartões sempre andam pelo caminho mais curto, inclusive na volta do fim.
  const [step, setStep] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(true);
  // Fotos que já ficaram perto do centro: só elas montam <picture>. As demais
  // esperam a vez para não baixar todas as imagens de uma vez.
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0]));

  const rootRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusDotRef = useRef(false);

  const current = mod(step, total);
  const playing = !reduced && !userPaused && !hovered && !focused && !dragging && inView;

  const go = useCallback((delta: number) => setStep((value) => value + delta), []);
  const goTo = useCallback(
    (index: number) => setStep((value) => value + shortestDiff(index, mod(value, total), total)),
    [total],
  );

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (last) setInView(last.isIntersecting);
      },
      { threshold: IN_VIEW_THRESHOLD },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Um timeout por foto (e não um setInterval): qualquer troca, automática ou
  // manual, reinicia a contagem e a pessoa nunca perde a foto no meio do gesto.
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setStep((value) => value + 1), autoPlayMs);
    return () => window.clearTimeout(id);
  }, [playing, step, autoPlayMs]);

  useEffect(() => {
    setSeen((previous) => {
      let next: Set<number> | null = null;
      for (const delta of [-1, 0, 1]) {
        const index = mod(current + delta, total);
        if (!previous.has(index)) {
          next = next ?? new Set(previous);
          next.add(index);
        }
      }
      return next ?? previous;
    });
  }, [current, total]);

  // Seta do teclado com o foco num indicador: o foco acompanha o indicador ativo.
  useEffect(() => {
    if (!focusDotRef.current) return;
    focusDotRef.current = false;
    dotRefs.current[current]?.focus();
  }, [current]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    if ((event.target as Element).closest?.(".category-carousel-dot")) focusDotRef.current = true;
    go(event.key === "ArrowRight" ? 1 : -1);
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!next || !event.currentTarget.contains(next)) setFocused(false);
  };

  const slide = slides[current];
  const position = `${current + 1} de ${total}`;
  const caption = slide.caption ? `${slide.caption}, ${position}` : position;

  return (
    <div
      ref={rootRef}
      className="category-carousel-root"
      role="group"
      aria-roledescription="carrossel"
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerEnter={(event) => !isTouchPointer(event) && setHovered(true)}
      onPointerLeave={(event) => !isTouchPointer(event) && setHovered(false)}
      onFocus={(event) => setFocused(hasVisibleFocus(event.target))}
      onBlur={onBlur}
    >
      <motion.div
        className="category-carousel-stage"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        dragMomentum={false}
        dragSnapToOrigin
        onDragStart={() => setDragging(true)}
        onDragEnd={(_event, info) => {
          setDragging(false);
          const direction = swipeDirection(info);
          if (direction) go(direction);
        }}
      >
        {slides.map((item, index) => {
          const status = getCardStatus(index, current, total);
          const isActive = status === "active";
          return (
            <motion.div
              key={index}
              className="category-carousel-card"
              data-status={status}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${total}`}
              aria-hidden={isActive ? undefined : true}
              initial={false}
              animate={CARD_POSE[status]}
              transition={reduced ? INSTANT : SPRING}
              style={{ zIndex: isActive ? 2 : status === "hidden" ? 0 : 1, pointerEvents: isActive ? "auto" : "none" }}
            >
              {(status !== "hidden" || seen.has(index)) && <CarouselPicture slide={item} eager={index === 0} />}
            </motion.div>
          );
        })}
      </motion.div>

      <div className="category-carousel-controls">
        <div className="category-carousel-progress">
          {/* Sem autoplay (prefers-reduced-motion) não há o que pausar. */}
          {!reduced && (
            <button
              type="button"
              className="category-carousel-btn category-carousel-pause"
              aria-label={`${userPaused ? "Retomar" : "Pausar"} a rotação automática: ${label}`}
              onClick={() => setUserPaused((value) => !value)}
            >
              <Icon>{userPaused ? <path d="M8 5.5v13l10-6.5z" fill="currentColor" /> : <path d="M9 5v14M15 5v14" />}</Icon>
            </button>
          )}
          <div className="category-carousel-dots" role="group" aria-label={`Escolher a foto: ${label}`}>
            {slides.map((_item, index) => (
              <button
                key={index}
                type="button"
                className="category-carousel-dot"
                aria-label={`Ir para a foto ${index + 1} de ${total}`}
                aria-current={index === current ? "true" : undefined}
                // Só o indicador ativo entra na ordem do Tab: o teclado troca de foto pelas setas.
                tabIndex={index === current ? 0 : -1}
                ref={(node) => {
                  dotRefs.current[index] = node;
                }}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </div>

        <div className="category-carousel-nav">
          <button
            type="button"
            className="category-carousel-btn category-carousel-prev"
            aria-label={`Foto anterior: ${label}`}
            onClick={() => go(-1)}
          >
            <Icon>
              <path d="M15 5l-7 7 7 7" />
            </Icon>
          </button>
          <p className="category-carousel-caption" aria-live={playing ? "off" : "polite"} aria-atomic="true">
            {caption}
          </p>
          <button
            type="button"
            className="category-carousel-btn category-carousel-next"
            aria-label={`Próxima foto: ${label}`}
            onClick={() => go(1)}
          >
            <Icon>
              <path d="M9 5l7 7-7 7" />
            </Icon>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Com menos de 2 fotos não há o que girar: o HTML estático já resolve. */
export function CategoryCarousel(props: CategoryCarouselProps) {
  if (props.slides.length < 2) return null;
  return <CarouselStack {...props} />;
}
