import { motion } from "framer-motion";
import { Camera, Truck, MessageCircle, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-flowers.jpg";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const badges = [
  { icon: Camera, label: "Foto do arranjo antes de sair pra entrega" },
  { icon: Truck, label: "Entrega agendada em Goiânia" },
  { icon: MessageCircle, label: "Confirmação rápida no WhatsApp" },
];

const HeroSection = () => (
  <section className="relative flex min-h-screen items-center overflow-hidden">
    {/* Background image + overlay (apenas 2 camadas: imagem + gradient directional) */}
    <div className="absolute inset-0">
      <img
        src={heroImg}
        alt="Arranjo floral elegante da Plante Uma Flor"
        className="h-full w-full object-cover brightness-[0.82]"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      {/*
        Opacidades precisam ser múltiplos de 5: a escala do Tailwind 3.4 vai de
        5 em 5, e um valor fora dela (como o /92 que estava aqui) não gera CSS
        nenhum — o --tw-gradient-from fica indefinido, invalida o
        --tw-gradient-stops e o background-image inteiro computa como "none".
        No mobile o texto ocupa a largura toda, por isso o degradê é vertical
        ali e só vira horizontal a partir do md:.
      */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/45 to-primary/70 md:bg-gradient-to-r md:from-primary/85 md:via-primary/45 md:to-primary/10" />
      {/*
        Halo elíptico atrás do texto: escurece só onde o texto está, deixando o
        resto da foto respirar. Usa valor arbitrário de propósito — o Tailwind
        sempre gera esses, ao contrário dos modificadores /NN fora da escala.
      */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_87%_28%_at_50%_43%,hsl(148_30%_8%_/_0.9)_0%,hsl(148_30%_8%_/_0.55)_50%,transparent_100%)] md:bg-[radial-gradient(ellipse_45%_35%_at_28%_50%,hsl(148_30%_8%_/_0.9)_0%,hsl(148_30%_8%_/_0.5)_50%,transparent_100%)]" />
    </div>

    <div className="container relative z-10 py-28 md:py-40">
      <div className="max-w-2xl">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 inline-flex items-center rounded-full bg-accent px-5 py-2 font-body text-xs font-bold uppercase tracking-[0.1em] text-accent-foreground shadow-lg shadow-black/20"
        >
          Goiânia e região · Entrega agendada
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-5 max-w-[16ch] font-display text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] text-primary-foreground [text-shadow:0_12px_36px_rgba(0,0,0,0.42)] sm:text-[3.1rem] md:max-w-none md:text-5xl md:leading-[1.07]"
        >
          Buquês e arranjos sob encomenda, entregues com cuidado em Goiânia
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mb-4 font-body text-sm font-semibold tracking-wide text-accent [text-shadow:0_6px_18px_rgba(0,0,0,0.45)] md:text-base"
        >
          Pix com desconto · Cartão à mão por nossa conta · Foto do arranjo pronto antes da entrega
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
          className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center md:mb-14"
        >
          <Button
            type="button"
            size="xl"
            variant="whatsapp"
            onClick={() =>
              openPriceRangeSelector({
                cta_location: "hero",
                cta_label: "encomendar_no_whatsapp",
                destination_url: WHATSAPP_URL,
              })
            }
            className="w-full sm:w-auto"
          >
            <WhatsAppIcon size={20} />
            Encomendar pelo WhatsApp
          </Button>
          <Button
            type="button"
            size="xl"
            variant="outline-light"
            asChild
            className="w-full sm:w-auto"
          >
            <a href="#categorias">
              Ver categorias
              <ArrowRight size={18} />
            </a>
          </Button>
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
