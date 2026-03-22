import { useState, useEffect, useRef } from "react";
import { registerWhatsAppModal } from "@/lib/whatsappModal";
import {
  trackWhatsAppClick,
  trackWhatsAppModalOpen,
  setLeadPhone,
  type TrackingParams,
} from "@/lib/tracking";

export default function WhatsAppLeadModal() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [context, setContext] = useState<TrackingParams>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    registerWhatsAppModal(({ url: targetUrl, context: nextContext }) => {
      setUrl(targetUrl);
      setContext(nextContext);
      setOpen(true);
      trackWhatsAppModalOpen({
        cta_location: nextContext.cta_location ?? "whatsapp_modal",
        cta_label: nextContext.cta_label ?? "abrir_modal_whatsapp",
        destination_url: nextContext.destination_url ?? targetUrl,
        ...nextContext,
      });
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
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

  function close() {
    setOpen(false);
    setPhone("");
    setContext({});
  }

  function proceed() {
    if (!isValid) return;
    const normalizedPhone = phone.replace(/\D/g, "");
    setLeadPhone(normalizedPhone);

    const popup = window.open("", "_blank", "noopener,noreferrer");
    const openDestination = () => {
      if (popup && !popup.closed) {
        popup.location.href = url;
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    };

    trackWhatsAppClick(
      {
        cta_location: context.cta_location ?? "whatsapp_modal",
        cta_label: context.cta_label ?? "continuar_no_whatsapp",
        destination_url: context.destination_url ?? url,
        ...context,
      },
      {
        eventCallback: openDestination,
      },
    );

    setOpen(false);
    setPhone("");
    setContext({});
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65" onClick={close} />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        style={{ willChange: "transform" }}
      >
        {/* Header verde escuro */}
        <div
          className="px-6 pt-6 pb-6 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(150deg, #1b3325 0%, #234a35 60%, #1e3f2e 100%)" }}
        >
          {/* Círculos decorativos */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: -20,
              left: -20,
              width: 70,
              height: 70,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          />

          {/* Botão X */}
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/50 hover:text-white/90 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
            aria-label="Fechar"
          >
            ×
          </button>

          {/* Ícone + Título */}
          <div className="flex items-start gap-3 relative">
            <div
              className="flex-shrink-0 flex items-center justify-center mt-1"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(37,211,102,0.12)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
                  fill="#25D366"
                />
                <path
                  d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
                  stroke="#25D366"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>
            <h2
              className="font-display text-white leading-snug"
              style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              Para te direcionar ao nosso atendimento, precisamos do seu WhatsApp
            </h2>
          </div>

          {/* Subtítulo */}
          <p
            className="font-body mt-3 relative"
            style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5, lineHeight: 1.6, fontWeight: 300 }}
          >
            Seu número será usado exclusivamente para este contato. Não enviamos promoções, listas de transmissão ou mensagens não solicitadas.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6">
          <label
            className="block font-body mb-2"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#7a6f63",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
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
            className="w-full text-[#1a2e22] text-base placeholder-[#b5aa9e] focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all mb-4 font-body"
            style={{
              border: "1.5px solid #ddd5cb",
              borderRadius: 14,
              padding: "15px 18px",
              background: "#fcfaf8",
            }}
          />

          <button
            onClick={proceed}
            disabled={!isValid}
            className="w-full flex items-center justify-center gap-2 text-white font-semibold text-sm tracking-wide uppercase py-4 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100 font-body"
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #1fba56 100%)",
              borderRadius: 14,
              boxShadow: "0 6px 20px rgba(37,211,102,0.25)",
            }}
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
