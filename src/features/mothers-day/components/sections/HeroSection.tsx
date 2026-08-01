import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, Camera, MessageCircle, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-flowers.jpg";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const MOTHERS_DAY = new Date("2026-05-10T00:00:00-03:00").getTime();

const badges = [
  { icon: Camera, label: "Foto do arranjo antes de sair pra entrega" },
  { icon: Truck, label: "Entrega no domingo, 10 de maio" },
  { icon: MessageCircle, label: "Confirmação rápida no WhatsApp" },
];

const useCountdown = (target: number) => {
  const calc = () => Math.max(0, target - Date.now());
  const [ms, setMs] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setMs(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const pad = (n: number) => n.toString().padStart(2, "0");

const HeroSection = () => {
  const { days, hours, minutes, seconds } = useCountdown(MOTHERS_DAY);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Background: apenas imagem + gradient directional (era 5 camadas) */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Buquê para o Dia das Mães"
          className="h-full w-full object-cover brightness-[0.82]"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        {/* Opacidades múltiplas de 5; ver a nota em components/sections/HeroSection.tsx. */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/70 to-primary/90 md:bg-gradient-to-r md:from-primary/95 md:via-primary/70 md:to-primary/25" />
      </div>

      <div className="container relative z-10 py-28 md:py-40">
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2 text-center font-body text-xs font-bold uppercase tracking-[0.1em] text-accent-foreground shadow-lg shadow-black/20 sm:w-auto"
          >
            10 de Maio · Montado à mão em Goiânia
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-5 max-w-[12ch] font-display text-[2.7rem] font-bold leading-[1.04] tracking-[-0.02em] text-primary-foreground [text-shadow:0_12px_36px_rgba(0,0,0,0.38)] sm:max-w-[12ch] sm:text-[3.15rem] md:max-w-none md:text-5xl md:leading-[1.06]"
          >
            Buquês, cestas e plantas para o Dia das Mães em Goiânia
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mb-4 font-body text-sm font-semibold tracking-wide text-accent [text-shadow:0_6px_18px_rgba(0,0,0,0.4)] md:text-base"
          >
            A partir de R$ 99,90 · Pix com 5% off · Foto do arranjo antes da entrega
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-9 max-w-[32ch] font-body text-[1.06rem] font-medium leading-8 [text-shadow:0_10px_28px_rgba(0,0,0,0.66)] md:mb-10 md:max-w-xl md:text-lg md:font-normal"
            style={{ color: "rgba(236, 245, 239, 0.96)" }}
          >
            Você escolhe pelo catálogo e encomenda pelo WhatsApp. A gente confirma endereço, horário e pagamento na hora, com foto do pedido antes da entrega.
          </motion.p>

          {days + hours + minutes + seconds > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-8 flex gap-2 sm:gap-4"
            >
              {[
                { label: "Dias", value: days },
                { label: "Horas", value: hours },
                { label: "Min", value: minutes },
                { label: "Seg", value: seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="min-w-[58px] rounded-lg border border-primary-foreground/35 bg-primary/30 px-2.5 py-2 text-center shadow-lg shadow-black/15 backdrop-blur-md sm:min-w-[78px] sm:px-5 sm:py-3"
                >
                  <div className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground tabular-nums">
                    {pad(unit.value)}
                  </div>
                  <div className="font-body text-[10px] sm:text-xs text-primary-foreground/70 uppercase tracking-wider">
                    {unit.label}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center md:mb-14"
          >
            <Button
              type="button"
              size="xl"
              variant="accent"
              onClick={() =>
                openPriceRangeSelector({
                  cta_location: "hero",
                  cta_label: "pedir_pelo_whatsapp",
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
            className="hidden flex-col flex-wrap gap-2 sm:flex sm:flex-row sm:gap-5"
          >
            {badges.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 text-primary-foreground [text-shadow:0_4px_16px_rgba(0,0,0,0.32)]"
              >
                <b.icon size={18} className="text-accent" />
                <span className="font-body text-sm font-semibold">{b.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
