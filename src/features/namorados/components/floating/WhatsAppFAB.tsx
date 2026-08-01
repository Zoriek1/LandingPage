import { useState, useEffect } from "react";
import { openNamoradosWhatsApp } from "@/features/namorados/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export default function WhatsAppFAB() {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed bottom-6 right-5 z-50 flex items-center">
      {/* Tooltip */}
      <div
        className={`relative mr-3 bg-white text-[#1a2e22] text-sm font-semibold px-3 py-2 rounded-xl shadow-md whitespace-nowrap transition-all duration-300 pointer-events-none select-none ${
          showTooltip
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-2"
        }`}
        aria-hidden="true"
      >
        Encomende aqui 💬
        {/* seta apontando para direita */}
        <span
          className="absolute right-[-7px] top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-white"
          style={{ display: "block", width: 0, height: 0 }}
        />
      </div>

      {/* Botão + anel de pulso */}
      <div className="relative h-14 w-14">
        {/* Anel de pulso */}
        <span className="absolute inset-0 rounded-full bg-accent opacity-40 animate-ping" />

        <Button
          type="button"
          size="fab"
          variant="accent"
          aria-label="Encomendar pelo WhatsApp"
          onClick={() => {
            openNamoradosWhatsApp("whatsapp_fab", "floating_button");
            setShowTooltip(false);
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative hover:-translate-y-0.5"
        >
          <WhatsAppIcon size={28} className="text-accent-foreground" />
        </Button>
      </div>
    </div>
  );
}
