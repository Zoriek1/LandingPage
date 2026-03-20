import { useState, useEffect, useRef } from "react";
import { registerWhatsAppModal } from "@/lib/whatsappModal";
import { trackWhatsAppClick, setLeadPhone } from "@/lib/tracking";

export default function WhatsAppLeadModal() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [phone, setPhone] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    registerWhatsAppModal((targetUrl) => {
      setUrl(targetUrl);
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return raw;
  }

  const isValid = phone.replace(/\D/g, "").length >= 10;

  function proceed() {
    if (!isValid) return;
    setLeadPhone(phone.replace(/\D/g, ""));
    trackWhatsAppClick();
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
    setPhone("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* Backdrop — sem onClick para não fechar ao clicar fora */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header verde */}
        <div className="bg-[#1a2e22] px-6 pt-6 pb-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 flex-shrink-0">
              <path
                d="M20.52 3.48A11.93 11.93 0 0 0 12.01 0C5.37 0 0 5.37 0 11.99c0 2.12.56 4.19 1.62 6L0 24l6.18-1.62A12.03 12.03 0 0 0 12 23.97C18.63 23.97 24 18.6 24 11.97c0-3.18-1.24-6.18-3.48-8.49ZM12 21.92c-1.77 0-3.5-.47-5.02-1.37l-.36-.21-3.73.98.99-3.65-.24-.38A9.9 9.9 0 0 1 2.08 12C2.08 6.5 6.5 2.08 12 2.08c2.64 0 5.12 1.03 6.98 2.9a9.84 9.84 0 0 1 2.89 6.97c0 5.51-4.42 9.97-9.87 9.97Zm5.44-7.47c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.46s1.05 2.85 1.2 3.05c.15.2 2.07 3.16 5.02 4.43.7.3 1.25.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35Z"
                fill="#25D366"
              />
            </svg>
            <span className="font-semibold text-base">Antes de ir para o WhatsApp</span>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            Deixe seu número para receber novidades e promoções exclusivas.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6">
          <label className="block text-sm font-semibold text-[#1a2e22] mb-2">
            Seu WhatsApp
          </label>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            placeholder="(62) 9 9999-9999"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && proceed()}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[#1a2e22] text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all mb-4"
          />

          <button
            onClick={proceed}
            disabled={!isValid}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold text-sm tracking-wide uppercase py-4 rounded-2xl shadow-lg shadow-[#25D366]/30 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Continuar no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
