import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, Camera, MessageCircle } from "lucide-react";
import heroImg from "@/assets/hero-flowers.jpg";
import { trackSiteClick } from "@/lib/tracking";
import { openWhatsAppModal } from "@/lib/whatsappModal";
import { NAMORADOS_URL, WHATSAPP_URL } from "@/lib/config";

// 12/06/2026 — sexta-feira
const VALENTINES_DAY = new Date("2026-06-12T00:00:00-03:00").getTime();

const badges = [
  { icon: Camera, label: "Foto do arranjo antes de sair pra entrega" },
  { icon: Truck, label: "Entrega no dia 12 de junho" },
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
  const { days, hours, minutes, seconds } = useCountdown(VALENTINES_DAY);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Buquê para o Dia dos Namorados"
          className="w-full h-full object-cover brightness-[0.7] saturate-[0.95]"
          loading="eager"
        />
        <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a0d14]/86 via-[#22090f]/76 to-[#180609]/92 md:bg-gradient-to-r md:from-primary/94 md:via-primary/72 md:via-[54%] md:to-primary/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 md:from-black/48 md:to-black/22" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_42%,rgba(24,6,9,0.78)_0%,rgba(24,6,9,0.6)_24%,rgba(24,6,9,0.34)_46%,rgba(24,6,9,0.12)_62%,transparent_78%)]" />
      </div>

      <div className="container relative z-10 py-28 md:py-40">
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2 text-center font-body text-[10px] font-bold uppercase tracking-[0.1em] text-accent-foreground shadow-lg shadow-black/20 sm:w-auto md:text-xs"
          >
            12 de Junho · Entrega com foto · Goiânia
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-7 max-w-[14ch] font-display text-[2.7rem] font-bold leading-[1.04] tracking-[-0.02em] text-primary-foreground [text-shadow:0_12px_36px_rgba(0,0,0,0.42)] sm:max-w-[14ch] sm:text-[3.15rem] md:mb-6 md:max-w-none md:text-5xl md:leading-[1.06]"
          >
            Surpreenda no Dia dos Namorados, sem stress de última hora
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mb-5 font-body text-sm font-semibold tracking-wide text-accent [text-shadow:0_6px_18px_rgba(0,0,0,0.45)] md:text-base"
          >
            A partir de R$ 139,90 · Pix com 5% off · Cartão escrito à mão grátis
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-9 max-w-[34ch] font-body text-[1.06rem] font-medium leading-8 [text-shadow:0_10px_28px_rgba(0,0,0,0.68)] md:mb-8 md:max-w-xl md:text-lg md:font-normal"
            style={{ color: "rgba(245, 232, 230, 0.96)" }}
          >
            Você escolhe pelo catálogo e encomenda pelo WhatsApp. Confirmamos endereço, horário, mensagem do cartão e mandamos foto do arranjo pronto antes de sair pra entrega.
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
            className="flex flex-col sm:flex-row gap-4 mb-8 md:mb-14"
          >
            <button
              onClick={() =>
                openWhatsAppModal(WHATSAPP_URL, {
                  cta_location: "hero",
                  cta_label: "pedir_pelo_whatsapp",
                  destination_url: WHATSAPP_URL,
                })
              }
              className="flex items-center justify-center gap-3 bg-accent text-accent-foreground px-7 py-3.5 rounded-2xl font-body text-sm font-semibold tracking-wide uppercase hover:brightness-110 transition-all text-center shadow-xl shadow-black/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Encomendar pelo WhatsApp
            </button>
            <a
              href={NAMORADOS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackSiteClick({
                  cta_location: "hero",
                  cta_label: "ver_catalogo",
                  destination_url: NAMORADOS_URL,
                })
              }
              className="flex items-center justify-center border border-primary-foreground/55 bg-primary/22 text-primary-foreground px-5 py-3 rounded font-body text-sm font-semibold tracking-wide uppercase hover:bg-primary/34 transition-all text-center backdrop-blur-sm shadow-lg shadow-black/10"
            >
              Ver Catálogo
            </a>
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
