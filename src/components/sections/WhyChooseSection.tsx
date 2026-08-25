import { motion } from "framer-motion";
import { Check } from "lucide-react";
import whyImg from "@/assets/why-choose.jpg";
import { openGuidedWhatsApp } from "@/lib/landing-whatsapp";

const points = [
  "Atendimento cuidadoso e personalizado",
  "Flores selecionadas com rigor e frescor",
  "Arranjos que encantam em cada detalhe",
  "Confiança e segurança em toda a compra",
  "Uma experiência especial do início ao fim",
];

const WhyChooseSection = () => (
  <section id="sobre" className="bg-background py-section-y">
    <div className="container">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <img
            src={whyImg}
            alt="Florista preparando arranjo na Plante Uma Flor"
            className="w-full rounded-2xl shadow-2xl"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-br-2xl border-2 border-accent" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="mb-4 inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 font-body text-eyebrow font-semibold uppercase text-accent">
            Por que escolher
          </span>
          <h2 className="mb-6 font-display text-h2 font-semibold text-primary">
            Por que escolher a Plante Uma Flor?
          </h2>
          <p className="mb-8 font-body leading-relaxed text-muted-foreground">
            Somos apaixonados por transformar sentimentos em arranjos. Cada flor é escolhida a dedo para criar composições que emocionam e surpreendem, com a qualidade e o cuidado que você merece.
          </p>

          <ul className="mb-10 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <Check size={14} className="text-accent" />
                </div>
                <span className="font-body text-foreground">{p}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() =>
              openGuidedWhatsApp({
                pageSlug: "home",
                pageLabel: "buques",
                ctaLocation: "why_choose",
                ctaLabel: "ajuda_escolher",
                request: "Pode me ajudar a escolher o buque ideal por faixa de preco e ocasiao?",
              })
            }
            className="inline-block rounded-2xl bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-accent-foreground shadow-lg transition-all hover:brightness-110"
          >
            Quero ajuda para escolher
          </button>
        </motion.div>
      </div>
    </div>
  </section>
);

export default WhyChooseSection;
