import { motion } from "framer-motion";
import { Check } from "lucide-react";
import whyImg from "@/assets/why-choose.jpg";

const points = [
  "Atendimento cuidadoso e personalizado",
  "Flores selecionadas com rigor e frescor",
  "Arranjos que encantam em cada detalhe",
  "Confiança e segurança em toda a compra",
  "Uma experiência especial do início ao fim",
];

const SITE_URL = "https://www.planteumaflor.com";

const WhyChooseSection = () => (
  <section id="sobre" className="py-20 md:py-28 bg-background">
    <div className="container">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <img
            src={whyImg}
            alt="Florista preparando arranjo"
            className="w-full rounded shadow-2xl"
            loading="lazy"
          />
          <div className="absolute -bottom-4 -right-4 w-24 h-24 border-2 border-accent rounded-br-lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
            Por que escolher a Plante Uma Flor?
          </h2>
          <p className="font-body text-muted-foreground mb-8 leading-relaxed">
            Somos apaixonados por transformar sentimentos em arranjos. Cada flor é escolhida a dedo para 
            criar composições que emocionam e surpreendem, com a qualidade e o cuidado que você merece.
          </p>

          <ul className="space-y-4 mb-10">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-accent" />
                </div>
                <span className="font-body text-foreground">{p}</span>
              </li>
            ))}
          </ul>

          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-accent text-accent-foreground px-8 py-4 rounded font-body text-sm font-semibold tracking-widest uppercase hover:brightness-110 transition-all"
          >
            Conheça Nosso Catálogo
          </a>
        </motion.div>
      </div>
    </div>
  </section>
);

export default WhyChooseSection;
