import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Camera, MessageCircle, Truck, type LucideIcon } from "lucide-react";
import heroImg from "@/assets/hero-flowers.jpg";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export type HeroSectionConfig = {
  imageAlt: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  primaryButtonLabel: string;
  primaryButtonVariant?: "whatsapp" | "accent";
  countdownTarget?: number;
  hideBadgesOnMobile?: boolean;
  badges: readonly {
    icon: LucideIcon;
    label: string;
  }[];
  tracking: {
    lpSlug?: string;
    ctaLabel: string;
  };
};

type HeroSectionProps = {
  config?: HeroSectionConfig;
};

const defaultConfig: HeroSectionConfig = {
  imageAlt: "Arranjo floral elegante da Plante Uma Flor",
  eyebrow: "Goiânia e região · Entrega agendada",
  title: "Buquês e arranjos sob encomenda, entregues com cuidado em Goiânia",
  highlight:
    "Pix com desconto · Cartão à mão por nossa conta · Foto do arranjo pronto antes da entrega",
  description:
    "Você escolhe pelo catálogo e encomenda pelo WhatsApp. A gente confirma data, endereço e mensagem do cartão, e manda foto do arranjo pronto antes de sair pra entrega.",
  primaryButtonLabel: "Encomendar pelo WhatsApp",
  primaryButtonVariant: "whatsapp",
  badges: [
    { icon: Camera, label: "Foto do arranjo antes de sair pra entrega" },
    { icon: Truck, label: "Entrega agendada em Goiânia" },
    { icon: MessageCircle, label: "Confirmação rápida no WhatsApp" },
  ],
  tracking: {
    ctaLabel: "encomendar_no_whatsapp",
  },
};

const useCountdown = (target?: number) => {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, (target ?? 0) - Date.now()),
  );

  useEffect(() => {
    const updateRemaining = () =>
      setRemainingMs(Math.max(0, (target ?? 0) - Date.now()));

    updateRemaining();

    if (!target) return undefined;

    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, [target]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const pad = (value: number) => value.toString().padStart(2, "0");

const HeroSection = ({ config = defaultConfig }: HeroSectionProps) => {
  const countdown = useCountdown(config.countdownTarget);
  const showCountdown = Object.values(countdown).some((value) => value > 0);
  const isCampaign = Boolean(config.countdownTarget);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt={config.imageAlt}
          className="h-full w-full object-cover brightness-[0.82]"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/45 to-primary/70 md:bg-gradient-to-r md:from-primary/85 md:via-primary/45 md:to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_87%_28%_at_50%_43%,hsl(var(--primary)_/_0.9)_0%,hsl(var(--primary)_/_0.55)_50%,transparent_100%)] md:bg-[radial-gradient(ellipse_45%_35%_at_28%_50%,hsl(var(--primary)_/_0.9)_0%,hsl(var(--primary)_/_0.5)_50%,transparent_100%)]" />
      </div>

      <div className="container relative z-10 py-28 md:py-40">
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`mb-5 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-center font-body text-eyebrow font-semibold uppercase text-accent-foreground shadow-lg shadow-black/20 ${
              isCampaign ? "w-full sm:w-auto" : ""
            }`}
          >
            {config.eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-5 max-w-[16ch] font-display text-h1 font-semibold leading-[1.05] text-primary-foreground [text-shadow:0_12px_36px_hsl(var(--foreground)_/_0.42)] md:max-w-none md:leading-[1.07]"
          >
            {config.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mb-4 font-body text-sm font-semibold tracking-wide text-accent-on-dark [text-shadow:0_6px_18px_hsl(var(--foreground)_/_0.45)] md:text-base"
          >
            {config.highlight}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-9 max-w-xl font-body text-[1.04rem] font-medium leading-8 text-primary-foreground/90 [text-shadow:0_10px_28px_hsl(var(--foreground)_/_0.55)] md:mb-10 md:text-lg md:font-normal"
          >
            {config.description}
          </motion.p>

          {showCountdown && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-8 flex gap-2 sm:gap-4"
            >
              {[
                { label: "Dias", value: countdown.days },
                { label: "Horas", value: countdown.hours },
                { label: "Min", value: countdown.minutes },
                { label: "Seg", value: countdown.seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="min-w-[58px] rounded-lg border border-primary-foreground/35 bg-primary/30 px-2.5 py-2 text-center shadow-lg shadow-black/15 backdrop-blur-md sm:min-w-[78px] sm:px-5 sm:py-3"
                >
                  <div className="font-display text-2xl font-bold tabular-nums text-primary-foreground sm:text-3xl">
                    {pad(unit.value)}
                  </div>
                  <div className="font-body text-[10px] uppercase tracking-wider text-primary-foreground/70 sm:text-xs">
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
              variant={config.primaryButtonVariant ?? "accent"}
              onClick={() =>
                openPriceRangeSelector({
                  ...(config.tracking.lpSlug ? { lp_slug: config.tracking.lpSlug } : {}),
                  cta_location: "hero",
                  cta_label: config.tracking.ctaLabel,
                  destination_url: WHATSAPP_URL,
                })
              }
              className="w-full sm:w-auto"
            >
              <WhatsAppIcon size={20} />
              {config.primaryButtonLabel}
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
            className={`${config.hideBadgesOnMobile ? "hidden sm:flex" : "flex"} flex-col flex-wrap gap-2 sm:flex-row sm:gap-5`}
          >
            {config.badges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 text-primary-foreground/90 [text-shadow:0_4px_16px_hsl(var(--foreground)_/_0.32)]"
              >
                <badge.icon size={18} className="text-accent-on-dark" />
                <span className="font-body text-sm font-medium">{badge.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
