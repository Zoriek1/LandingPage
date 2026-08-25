import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";
import { openGuidedWhatsApp } from "@/lib/landing-whatsapp";
import { useScrollThreshold } from "@/hooks/use-scroll-threshold";
import { Button } from "@/components/ui/button";

export type NavbarConfig = {
  links: readonly {
    label: string;
    href: string;
  }[];
  overlay: "transparent" | "gradient";
  guided: {
    pageSlug: string;
    pageLabel: string;
    request: string;
  };
  mobileWhatsAppLpSlug?: string;
};

type NavbarProps = {
  config?: NavbarConfig;
};

const defaultConfig: NavbarConfig = {
  links: [
    { label: "Categorias", href: "#categorias" },
    { label: "Sobre", href: "#sobre" },
    { label: "Depoimentos", href: "#depoimentos" },
    { label: "FAQ", href: "#faq" },
  ],
  overlay: "transparent",
  guided: {
    pageSlug: "home",
    pageLabel: "buques",
    request: "Pode me ajudar a escolher por faixa de preco e ocasiao?",
  },
};

const openGuidedChoice = (config: NavbarConfig, location: string) =>
  openGuidedWhatsApp({
    pageSlug: config.guided.pageSlug,
    pageLabel: config.guided.pageLabel,
    ctaLocation: location,
    ctaLabel: "ajuda_escolher",
    request: config.guided.request,
  });

const Navbar = ({ config = defaultConfig }: NavbarProps) => {
  const scrolled = useScrollThreshold(40);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? `bg-primary/95 shadow-lg backdrop-blur-md ${config.overlay === "gradient" ? "border-b border-primary-foreground/10" : ""}`
          : config.overlay === "gradient"
            ? "bg-gradient-to-b from-primary/80 via-primary/40 to-transparent backdrop-blur-[2px]"
            : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        <a href="#" className="flex items-center">
          <img src={logo} alt="Plante Uma Flor" className="h-12 md:h-14 w-auto" />
        </a>

        <div className="hidden md:flex items-center gap-8">
          {config.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`font-body text-sm uppercase tracking-wide transition-colors hover:text-accent-on-dark ${config.overlay === "gradient" ? "font-semibold text-primary-foreground/95 [text-shadow:0_2px_12px_hsl(var(--foreground)_/_0.28)]" : "font-medium text-primary-foreground/80"}`}
            >
              {link.label}
            </a>
          ))}
          <Button
            type="button"
            variant="accent"
            onClick={() => openGuidedChoice(config, "navbar_desktop")}
            className="uppercase tracking-wide"
          >
            Me ajude a escolher
          </Button>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`flex h-11 w-11 items-center justify-center rounded-md text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden ${config.overlay === "gradient" ? "[text-shadow:0_2px_12px_hsl(var(--foreground)_/_0.35)]" : ""}`}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary/95 backdrop-blur-md overflow-hidden"
          >
            <div className="container py-4 flex flex-col gap-4">
              {config.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-primary-foreground/80 hover:text-accent-on-dark font-body text-sm font-medium tracking-wide uppercase"
                >
                  {link.label}
                </a>
              ))}
              <Button
                type="button"
                variant="accent"
                onClick={() => {
                  openGuidedChoice(config, "navbar_mobile");
                  setMobileOpen(false);
                }}
                className="uppercase tracking-wide"
              >
                Me ajude a escolher
              </Button>
              <Button
                type="button"
                variant="outline-light"
                onClick={() => {
                  openPriceRangeSelector({
                    ...(config.mobileWhatsAppLpSlug
                      ? { lp_slug: config.mobileWhatsAppLpSlug }
                      : {}),
                    cta_location: "navbar_mobile",
                    cta_label: "falar_no_whatsapp",
                    destination_url: WHATSAPP_URL,
                  });
                  setMobileOpen(false);
                }}
                className="uppercase tracking-wide"
              >
                Falar no WhatsApp
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
