import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";
import { openGuidedWhatsApp } from "@/lib/landing-whatsapp";
import { useScrollThreshold } from "@/hooks/use-scroll-threshold";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  {
    "label": "Categorias",
    "href": "#categorias"
  },
  {
    "label": "Sobre",
    "href": "#sobre"
  },
  {
    "label": "Depoimentos",
    "href": "#depoimentos"
  },
  {
    "label": "FAQ",
    "href": "#faq"
  }
];

const openGuidedChoice = (location: string) =>
  openGuidedWhatsApp({
    pageSlug: "home",
    pageLabel: "buques",
    ctaLocation: location,
    ctaLabel: "ajuda_escolher",
    request: "Pode me ajudar a escolher por faixa de preco e ocasiao?",
  });

const Navbar = () => {
  const scrolled = useScrollThreshold(40);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-primary/95 backdrop-blur-md shadow-lg" : "bg-transparent"}`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        <a href="#" className="flex items-center">
          <img src={logo} alt="Plante Uma Flor" className="h-12 md:h-14 w-auto" />
        </a>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-primary-foreground/80 hover:text-accent font-body text-sm font-medium tracking-wide uppercase transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Button
            type="button"
            variant="accent"
            onClick={() => openGuidedChoice("navbar_desktop")}
            className="uppercase tracking-wide"
          >
            Me ajude a escolher
          </Button>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-primary-foreground p-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-primary-foreground/80 hover:text-accent font-body text-sm font-medium tracking-wide uppercase"
                >
                  {link.label}
                </a>
              ))}
              <Button
                type="button"
                variant="accent"
                onClick={() => {
                  openGuidedChoice("navbar_mobile");
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
