import { useState, useEffect, useRef } from "react";
import { openWhatsAppDestination, registerWhatsAppModal } from "@/lib/whatsappModal";
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

    trackWhatsAppClick({
      cta_location: context.cta_location ?? "whatsapp_modal",
      cta_label: context.cta_label ?? "continuar_no_whatsapp",
      destination_url: context.destination_url ?? url,
      ...context,
    });
    openWhatsAppDestination(url);

    setOpen(false);
    setPhone("");
    setContext({});
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/65" onClick={close} />

      <div
        className="relative w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:max-w-md sm:rounded-2xl"
        style={{ willChange: "transform" }}
      >
        <div
          className="relative overflow-hidden px-6 pt-6 pb-6 text-white"
          style={{ background: "linear-gradient(150deg, #1b3325 0%, #234a35 60%, #1e3f2e 100%)" }}
        >
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

          <button
            onClick={close}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center text-2xl leading-none text-white/50 transition-colors hover:text-white/90"
            aria-label="Fechar"
          >
            ×
          </button>

          <div className="relative flex items-start gap-3">
            <div
              className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center"
              style={{
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
            <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-white sm:text-2xl">
              Para te direcionar ao <strong className="font-semibold text-white">nosso atendimento</strong>,
              precisamos do <strong className="font-semibold text-white">seu WhatsApp</strong>
            </h2>
          </div>

          <div className="font-body relative mt-3 space-y-2.5 text-sm leading-relaxed font-normal text-white/[0.82] sm:text-base">
            <p>
              Seu número será usado{" "}
              <strong className="font-semibold text-white">exclusivamente para este contato</strong>.{" "}
              <strong className="font-semibold text-white">Não enviamos promoções</strong>, listas de
              transmissão ou mensagens não solicitadas.
            </p>
            <p>
              Ao continuar, você segue para o <strong className="font-semibold text-white">WhatsApp</strong> e
              fala com a equipe.
            </p>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6">
          <label className="font-body mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#5c5349] sm:text-sm">
            Número do WhatsApp
          </label>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            placeholder="(62) 9 9999-9999"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && proceed()}
            className="font-body mb-4 w-full text-base text-[#1a2e22] placeholder-[#b5aa9e] transition-all focus:outline-none focus:ring-2 focus:ring-[#25D366]"
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
            className="font-body flex min-h-[52px] w-full items-center justify-center gap-2 py-4 text-base font-semibold uppercase tracking-wide text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100"
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #1fba56 100%)",
              borderRadius: 14,
              boxShadow: "0 6px 20px rgba(37,211,102,0.25)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
