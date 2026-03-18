import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Como faço meu pedido?",
    a: "Basta acessar nosso site, escolher o arranjo desejado e finalizar a compra de forma rápida e segura. Você também pode entrar em contato pelo WhatsApp para um atendimento personalizado.",
  },
  {
    q: "Posso escolher o arranjo pelo site?",
    a: "Sim! Nosso catálogo online conta com diversas opções de buquês, arranjos, cestas e plantas para você escolher o presente perfeito.",
  },
  {
    q: "Vocês fazem entrega?",
    a: "Sim, realizamos entregas com todo o cuidado para que suas flores cheguem frescas e impecáveis.",
  },
  {
    q: "Tem opções para datas especiais?",
    a: "Com certeza! Temos arranjos especiais para aniversários, Dia das Mães, Dia dos Namorados, formaturas e outras ocasiões memoráveis.",
  },
  {
    q: "Posso pedir com antecedência?",
    a: "Sim, recomendamos fazer seu pedido com antecedência para garantir a disponibilidade e a entrega no horário desejado.",
  },
];

const FAQSection = () => (
  <section id="faq" className="py-20 md:py-28 bg-secondary/30">
    <div className="container max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
          Perguntas Frequentes
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-background rounded px-6 border-none shadow-sm"
            >
              <AccordionTrigger className="font-display text-lg text-primary hover:text-accent hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="font-body text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default FAQSection;
