import { useScrollThreshold } from "@/hooks/use-scroll-threshold";

export default function BackToTop() {
  const visible = useScrollThreshold(400);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-24 left-5 z-40 flex items-center justify-center w-10 h-10 bg-primary/80 backdrop-blur-sm text-primary-foreground rounded-full shadow-md hover:bg-primary transition-all md:bottom-6"
      aria-label="Voltar ao topo"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
