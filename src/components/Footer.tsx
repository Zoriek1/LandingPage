import { Instagram, Facebook, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { trackSiteClick } from "@/lib/tracking";
import { openWhatsAppModal } from "@/lib/whatsappModal";

const SITE_URL = "https://www.planteumaflor.com";
const WHATSAPP_URL = "https://wa.me/+5562996503403?text=Olá, vim pela sua landing page e gostaria de saber mais sobre os produtos";

const Footer = () => (
  <footer className="bg-primary py-12 border-t border-primary-foreground/10">
    <div className="container">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <img src={logo} alt="Plante Uma Flor" className="h-12 w-auto mb-2" />
          <p className="font-body text-primary-foreground/50 text-sm">
            Flores que transformam momentos em memórias.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => openWhatsAppModal(WHATSAPP_URL)}
            className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/70 hover:text-accent hover:bg-primary-foreground/20 transition-colors"
            aria-label="WhatsApp"
          >
            <MessageCircle size={18} />
          </button>
          <a
            href="#"
            className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/70 hover:text-accent hover:bg-primary-foreground/20 transition-colors"
            aria-label="Instagram"
          >
            <Instagram size={18} />
          </a>
          <a
            href="#"
            className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/70 hover:text-accent hover:bg-primary-foreground/20 transition-colors"
            aria-label="Facebook"
          >
            <Facebook size={18} />
          </a>
        </div>

        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackSiteClick}
          className="font-body text-accent text-sm font-semibold hover:underline"
        >
          www.planteumaflor.com
        </a>
      </div>

      <div className="mt-8 pt-8 border-t border-primary-foreground/10 text-center">
        <p className="font-body text-primary-foreground/40 text-xs">
          © {new Date().getFullYear()} Plante Uma Flor. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
