import { motion } from "framer-motion";
import { Truck, ShieldCheck, Flower2 } from "lucide-react";
import heroImg from "@/assets/hero-flowers.jpg";

const SITE_URL = "https://www.planteumaflor.com";
const WHATSAPP_URL = "https://wa.me/+5562996503403";

const badges = [
  { icon: Truck, label: "Entrega com cuidado" },
  { icon: ShieldCheck, label: "Compra rápida e segura" },
  { icon: Flower2, label: "Arranjos para cada ocasião" },
];

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center overflow-hidden">
    {/* Background image */}
    <div className="absolute inset-0">
      <img src={heroImg} alt="Arranjo floral elegante" className="w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
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
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-accent-foreground px-8 py-4 rounded font-body text-sm font-semibold tracking-widest uppercase hover:brightness-110 transition-all text-center"
          >
            Ver Catálogo no Site
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-primary-foreground/40 text-primary-foreground px-8 py-4 rounded font-body text-sm font-semibold tracking-widest uppercase hover:bg-primary-foreground/10 transition-all text-center"
          >
            Falar no WhatsApp
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
