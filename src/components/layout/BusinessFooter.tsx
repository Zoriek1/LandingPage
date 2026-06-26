import { Building2, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { BUSINESS_INFO } from "@/lib/business-info";
import { SITE_URL, WHATSAPP_URL } from "@/lib/config";
import { trackSiteClick } from "@/lib/tracking";
import { openWhatsAppModal } from "@/lib/whatsappModal";

type BusinessFooterProps = {
  tagline: string;
  onWhatsAppClick?: () => void;
};

const infoItems = [
  {
    icon: Building2,
    label: "CNPJ",
    value: `${BUSINESS_INFO.taxId} · ${BUSINESS_INFO.taxRegime}`,
  },
  {
    icon: MapPin,
    label: "Loja fisica",
    value: BUSINESS_INFO.address.full,
  },
  {
    icon: Clock,
    label: "Atendimento",
    value: BUSINESS_INFO.businessHours,
  },
  {
    icon: Phone,
    label: "Telefone",
    value: `${BUSINESS_INFO.phone} · Cel. ${BUSINESS_INFO.mobile}`,
  },
  {
    icon: Mail,
    label: "Notas fiscais",
    value: BUSINESS_INFO.fiscalEmail,
  },
  {
    icon: MapPin,
    label: "Regioes atendidas",
    value: BUSINESS_INFO.regions,
  },
];

const BusinessFooter = ({ tagline, onWhatsAppClick }: BusinessFooterProps) => {
  const handleWhatsAppClick =
    onWhatsAppClick ??
    (() =>
      openWhatsAppModal(WHATSAPP_URL, {
        cta_location: "footer",
        cta_label: "icone_whatsapp",
        destination_url: WHATSAPP_URL,
      }));

  return (
    <footer className="border-t border-primary-foreground/10 bg-primary py-12">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.7fr] lg:items-start">
          <div>
            <img src={logo} alt="Plante Uma Flor" className="mb-3 h-12 w-auto" />
            <p className="font-body text-sm text-primary-foreground/60">{tagline}</p>
            <p className="mt-3 font-body text-xs uppercase tracking-[0.16em] text-primary-foreground/40">
              {BUSINESS_INFO.legalName}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground/75 transition-colors hover:bg-primary-foreground/20 hover:text-accent"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
              </button>
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackSiteClick({
                    cta_location: "footer",
                    cta_label: "link_site",
                    destination_url: SITE_URL,
                  })
                }
                className="font-body text-sm font-semibold text-accent hover:underline"
              >
                www.planteumaflor.com
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {infoItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex gap-3 text-left">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 text-accent">
                    <Icon size={15} />
                  </span>
                  <span>
                    <span className="block font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/38">
                      {item.label}
                    </span>
                    <span className="mt-1 block font-body text-sm leading-6 text-primary-foreground/72">
                      {item.value}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 border-t border-primary-foreground/10 pt-8 text-center">
          <p className="font-body text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} {BUSINESS_INFO.tradeName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default BusinessFooter;
