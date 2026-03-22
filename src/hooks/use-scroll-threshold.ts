import { useEffect, useState } from "react";

export function useScrollThreshold(threshold: number) {
  const [isPastThreshold, setIsPastThreshold] = useState(false);

  useEffect(() => {
    let ticking = false;

    const updateState = () => {
      const nextValue = window.scrollY > threshold;
      setIsPastThreshold((prev) => (prev === nextValue ? prev : nextValue));
    };

    const onScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        updateState();
        ticking = false;
      });
    };

    updateState();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return isPastThreshold;
}
