import { useState, useEffect } from "react";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export type WhatsAppFABConfig = {
  tooltip: string;
  ariaLabel: string;
  appearance: "whatsapp" | "accent";
  showOnMobile: boolean;
  lpSlug?: string;
};

type WhatsAppFABProps = {
  config?: WhatsAppFABConfig;
};

const defaultConfig: WhatsAppFABConfig = {
  tooltip: "Fale conosco 💬",
  ariaLabel: "Falar no WhatsApp",
  appearance: "whatsapp",
  showOnMobile: false,
};

export default function WhatsAppFAB({ config = defaultConfig }: WhatsAppFABProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed bottom-6 right-5 z-50 items-center ${config.showOnMobile ? "flex" : "hidden md:flex"}`}
    >
      {/* Tooltip */}
      <div
        className={`relative mr-3 rounded-xl bg-card px-3 py-2 text-sm font-semibold text-primary shadow-md whitespace-nowrap transition-all duration-300 pointer-events-none select-none ${
          showTooltip
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-2"
        }`}
        aria-hidden="true"
      >
        {config.tooltip}
        {/* seta apontando para direita */}
        <span
          className="absolute right-[-7px] top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-white"
          style={{ display: "block", width: 0, height: 0 }}
        />
      </div>

      {/* Botão + anel de pulso */}
      <div className="relative h-14 w-14">
        {/* Anel de pulso */}
        <span
          className="absolute inset-0 animate-ping rounded-full bg-accent opacity-40"
        />

        <Button
          type="button"
          size="fab"
          variant={config.appearance}
          aria-label={config.ariaLabel}
          onClick={() => {
            openPriceRangeSelector({
              ...(config.lpSlug ? { lp_slug: config.lpSlug } : {}),
              cta_location: "whatsapp_fab",
              cta_label: "floating_button",
              destination_url: WHATSAPP_URL,
            });
            setShowTooltip(false);
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative bg-accent text-accent-foreground shadow-accent/30 hover:-translate-y-0.5 hover:bg-accent/90"
        >
          <WhatsAppIcon
            size={28}
            className="text-accent-foreground"
          />
        </Button>
      </div>
    </div>
  );
}
