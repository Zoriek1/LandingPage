import { motion } from "framer-motion";
import { Truck, ShieldCheck, Flower2 } from "lucide-react";
import heroImg from "@/assets/hero-flowers.jpg";
import { trackWhatsAppClick, trackSiteClick } from "@/lib/tracking";

const SITE_URL = "https://www.planteumaflor.com";
const WHATSAPP_URL = "https://wa.me/+5562996503403?text=Olá, vim pela sua landing page e gostaria de saber mais sobre os produtos";

const badges = [
  { icon: Truck, label: "Entrega com cuidado" },
  { icon: ShieldCheck, label: "Agendamento online disponível" },
  { icon: Flower2, label: "Arranjos para cada ocasião" },
];

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center overflow-hidden">
    {/* Background image */}
    <div className="absolute inset-0">
      <img src={heroImg} alt="Arranjo floral elegante" className="w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />
    </div>

    <div className="container relative z-10 py-32 md:py-40">
      <div className="max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6"
        >
          Flores que transformam momentos em memórias
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-body text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-lg leading-relaxed"
        >
          Buquês, arranjos e presentes florais criados com elegância para surpreender quem importa.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackWhatsAppClick}
            className="flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-2xl font-body text-sm font-semibold tracking-widest uppercase hover:brightness-110 transition-all text-center shadow-lg shadow-[#25D366]/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Falar no WhatsApp
          </a>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackSiteClick}
            className="flex items-center justify-center border border-primary-foreground/30 text-primary-foreground/80 px-5 py-3 rounded font-body text-sm font-medium tracking-widest uppercase hover:bg-primary-foreground/10 transition-all text-center"
          >
            Ver Catálogo
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-wrap gap-6"
        >
          {badges.map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-primary-foreground/70">
              <b.icon size={18} className="text-accent" />
              <span className="font-body text-sm">{b.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
