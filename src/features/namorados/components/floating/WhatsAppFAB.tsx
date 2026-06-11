import { useState, useEffect } from "react";
import { openNamoradosWhatsApp } from "@/features/namorados/lib/whatsapp";

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
      <div className="relative w-14 h-14">
        {/* Anel de pulso */}
        <span className="absolute inset-0 rounded-full bg-accent opacity-40 animate-ping" />

        <button
          aria-label="Encomendar pelo WhatsApp"
          onClick={() => {
            openNamoradosWhatsApp("whatsapp_fab", "floating_button");
            setShowTooltip(false);
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative flex items-center justify-center w-14 h-14 bg-accent rounded-full shadow-[0_4px_20px_rgba(220,86,131,0.5)] hover:scale-105 active:scale-95 transition-transform duration-200"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7"
          >
            <path
              d="M20.52 3.48A11.93 11.93 0 0 0 12.01 0C5.37 0 0 5.37 0 11.99c0 2.12.56 4.19 1.62 6L0 24l6.18-1.62A12.03 12.03 0 0 0 12 23.97C18.63 23.97 24 18.6 24 11.97c0-3.18-1.24-6.18-3.48-8.49ZM12 21.92c-1.77 0-3.5-.47-5.02-1.37l-.36-.21-3.73.98.99-3.65-.24-.38A9.9 9.9 0 0 1 2.08 12C2.08 6.5 6.5 2.08 12 2.08c2.64 0 5.12 1.03 6.98 2.9a9.84 9.84 0 0 1 2.89 6.97c0 5.51-4.42 9.97-9.87 9.97Zm5.44-7.47c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.46s1.05 2.85 1.2 3.05c.15.2 2.07 3.16 5.02 4.43.7.3 1.25.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35Z"
              fill="#fff"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
