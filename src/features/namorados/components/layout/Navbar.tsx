import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { openNamoradosWhatsApp } from "@/features/namorados/lib/whatsapp";
import { openGuidedWhatsApp } from "@/lib/landing-whatsapp";
import { useScrollThreshold } from "@/hooks/use-scroll-threshold";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  {
    "label": "Categorias",
    "href": "#categorias"
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
    pageSlug: "dia-dos-namorados",
    pageLabel: "Dia dos Namorados",
    ctaLocation: location,
    ctaLabel: "ajuda_escolher",
    request: "Pode me ajudar a escolher uma surpresa romantica por faixa de preco e estilo?",
  });

const Navbar = () => {
  const scrolled = useScrollThreshold(40);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-primary/95 backdrop-blur-md shadow-lg border-b border-primary-foreground/10"
          : "bg-gradient-to-b from-primary/80 via-primary/40 to-transparent backdrop-blur-[2px]"
      }`}
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
              className="text-primary-foreground/95 hover:text-accent font-body text-sm font-semibold tracking-wide uppercase transition-colors [text-shadow:0_2px_12px_rgba(0,0,0,0.28)]"
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
          className="md:hidden text-primary-foreground p-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]"
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
                  openNamoradosWhatsApp("navbar_mobile", "falar_no_whatsapp");
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
