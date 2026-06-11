import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { trackSiteClick } from "@/lib/tracking";
import { openNamoradosWhatsApp } from "@/features/namorados/lib/whatsapp";
import { NAMORADOS_URL } from "@/lib/config";
import { useScrollThreshold } from "@/hooks/use-scroll-threshold";

const NAV_LINKS = [
  { label: "Categorias", href: "#categorias" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "FAQ", href: "#faq" },
];

const Navbar = () => {
  const scrolled = useScrollThreshold(40);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-primary/94 backdrop-blur-md shadow-lg border-b border-primary-foreground/10"
          : "bg-gradient-to-b from-primary/80 via-primary/38 to-transparent backdrop-blur-[2px]"
      }`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        <a href="#" className="flex items-center">
          <img src={logo} alt="Plante Uma Flor" className="h-12 md:h-14 w-auto" />
        </a>

        {/* Desktop */}
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
          <a
            href={NAMORADOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackSiteClick({
                cta_location: "navbar_desktop",
                cta_label: "ver_catalogo",
                destination_url: NAMORADOS_URL,
              })
            }
            className="bg-accent text-accent-foreground px-6 py-2.5 rounded font-body text-sm font-semibold tracking-wide uppercase hover:brightness-110 transition-all shadow-lg shadow-black/20"
          >
            Ver Catálogo
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-primary-foreground p-2 [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
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
              <a
                href={NAMORADOS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackSiteClick({
                    cta_location: "navbar_mobile",
                    cta_label: "ver_catalogo",
                    destination_url: NAMORADOS_URL,
                  })
                }
                className="bg-accent text-accent-foreground px-6 py-3 rounded font-body text-sm font-semibold tracking-wide uppercase text-center hover:brightness-110 transition-all"
              >
                Ver Catálogo
              </a>
              <button
                onClick={() => {
                  openNamoradosWhatsApp("navbar_mobile", "falar_no_whatsapp");
                  setMobileOpen(false);
                }}
                className="border border-primary-foreground/30 text-primary-foreground px-6 py-3 rounded font-body text-sm font-medium tracking-wide uppercase text-center"
              >
                Encomendar pelo WhatsApp
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
