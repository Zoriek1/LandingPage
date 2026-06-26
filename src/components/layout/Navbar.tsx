import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { openWhatsAppModal } from "@/lib/whatsappModal";
import { WHATSAPP_URL } from "@/lib/config";
import { openGuidedWhatsApp } from "@/lib/landing-whatsapp";
import { useScrollThreshold } from "@/hooks/use-scroll-threshold";

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
          <button
            type="button"
            onClick={() => openGuidedChoice("navbar_desktop")}
            className="bg-accent text-accent-foreground px-6 py-2.5 rounded-xl font-body text-sm font-semibold tracking-wide uppercase hover:brightness-110 transition-all"
          >
            Me ajude a escolher
          </button>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-primary-foreground p-2"
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
              <button
                type="button"
                onClick={() => {
                  openGuidedChoice("navbar_mobile");
                  setMobileOpen(false);
                }}
                className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-body text-sm font-semibold tracking-wide uppercase text-center hover:brightness-110 transition-all"
              >
                Me ajude a escolher
              </button>
              <button
                onClick={() => {
                  openWhatsAppModal(WHATSAPP_URL, {
                    cta_location: "navbar_mobile",
                    cta_label: "falar_no_whatsapp",
                    destination_url: WHATSAPP_URL,
                  });
                  setMobileOpen(false);
                }}
                className="border border-primary-foreground/30 text-primary-foreground px-6 py-3 rounded-xl font-body text-sm font-medium tracking-wide uppercase text-center"
              >
                Falar no WhatsApp
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
