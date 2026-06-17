import { motion } from "framer-motion";
import { Camera, Truck, MessageCircle } from "lucide-react";
import heroImg from "@/assets/hero-flowers.jpg";
import { openWhatsAppModal } from "@/lib/whatsappModal";
import { WHATSAPP_URL } from "@/lib/config";

const badges = [
  { icon: Camera, label: "Foto do arranjo antes de sair pra entrega" },
  { icon: Truck, label: "Entrega agendada em Goiânia" },
  { icon: MessageCircle, label: "Confirmação rápida no WhatsApp" },
];

const HeroSection = () => (
  <section className="relative flex min-h-screen items-center overflow-hidden">
    {/* Background image + camadas de overlay */}
    <div className="absolute inset-0">
      <img
        src={heroImg}
        alt="Arranjo floral elegante da Plante Uma Flor"
        className="h-full w-full object-cover brightness-[0.78]"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/88 via-primary/68 to-primary/92 md:bg-gradient-to-r md:from-primary/94 md:via-primary/70 md:via-[54%] md:to-primary/25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_42%,hsl(148_30%_8%_/_0.7)_0%,hsl(148_30%_8%_/_0.45)_28%,transparent_70%)]" />
    </div>

    <div className="container relative z-10 py-28 md:py-40">
      <div className="max-w-2xl">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 inline-flex items-center rounded-full bg-accent px-5 py-2 font-body text-[10px] font-bold uppercase tracking-[0.1em] text-accent-foreground shadow-lg shadow-black/20 md:text-xs"
        >
          Goiânia e região · Entrega agendada · Foto antes da entrega
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 max-w-[16ch] font-display text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] text-primary-foreground [text-shadow:0_12px_36px_rgba(0,0,0,0.42)] sm:text-[3.1rem] md:max-w-none md:text-5xl md:leading-[1.07]"
        >
          Buquês e arranjos sob encomenda, entregues com cuidado em Goiânia
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mb-5 font-body text-sm font-semibold tracking-wide text-accent [text-shadow:0_6px_18px_rgba(0,0,0,0.45)] md:text-base"
        >
          Foto do arranjo pronto antes da entrega. Pix com desconto. Cartão à mão por nossa conta.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-9 max-w-xl font-body text-[1.04rem] font-medium leading-8 text-primary-foreground/90 [text-shadow:0_10px_28px_rgba(0,0,0,0.55)] md:mb-10 md:text-lg md:font-normal"
        >
          Você escolhe pelo catálogo e encomenda pelo WhatsApp. A gente confirma data, endereço e mensagem do cartão, e manda foto do arranjo pronto antes de sair pra entrega.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8 md:mb-14"
        >
          <button
            onClick={() =>
              openWhatsAppModal(WHATSAPP_URL, {
                cta_location: "hero",
                cta_label: "encomendar_no_whatsapp",
                destination_url: WHATSAPP_URL,
              })
            }
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-7 py-4 font-body text-sm font-semibold uppercase tracking-wide text-white shadow-xl shadow-[#25D366]/30 transition-all hover:brightness-110 sm:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Encomendar pelo WhatsApp
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col flex-wrap gap-2 sm:flex-row sm:gap-5"
        >
          {badges.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-2 text-primary-foreground/90 [text-shadow:0_4px_16px_rgba(0,0,0,0.32)]"
            >
              <b.icon size={18} className="text-accent" />
              <span className="font-body text-sm font-medium">{b.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
