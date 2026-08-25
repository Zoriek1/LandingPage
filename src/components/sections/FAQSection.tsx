import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type FAQSectionConfig = {
  title: string;
  description?: string;
  items: readonly {
    question: string;
    answer: string;
  }[];
};

type FAQSectionProps = {
  config?: FAQSectionConfig;
};

const defaultConfig: FAQSectionConfig = {
  title: "Perguntas Frequentes",
  items: [
    {
      question: "Como faço meu pedido?",
      answer:
        "Basta acessar nosso site, escolher o arranjo desejado e finalizar a compra de forma rápida e segura. Você também pode entrar em contato pelo WhatsApp para um atendimento personalizado.",
    },
    {
      question: "Posso escolher o arranjo pelo site?",
      answer:
        "Sim! Nosso catálogo online conta com diversas opções de buquês, arranjos, cestas e plantas para você escolher o presente perfeito.",
    },
    {
      question: "Vocês fazem entrega?",
      answer:
        "Sim, realizamos entregas com todo o cuidado para que suas flores cheguem frescas e impecáveis.",
    },
    {
      question: "Tem opções para datas especiais?",
      answer:
        "Com certeza! Temos arranjos especiais para aniversários, Dia das Mães, Dia dos Namorados, formaturas e outras ocasiões memoráveis.",
    },
    {
      question: "Posso pedir com antecedência?",
      answer:
        "Sim, recomendamos fazer seu pedido com antecedência para garantir a disponibilidade e a entrega no horário desejado.",
    },
  ],
};

const FAQSection = ({ config = defaultConfig }: FAQSectionProps) => (
  <section id="faq" className="bg-secondary/30 py-section-y">
    <div className="container max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="mb-4 font-display text-h2 font-semibold text-primary">
          {config.title}
        </h2>
        {config.description && (
          <p className="font-body text-muted-foreground">{config.description}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        <Accordion type="single" collapsible className="space-y-3">
          {config.items.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`faq-${index}`}
              className="bg-background rounded px-6 border-none shadow-sm"
            >
              <AccordionTrigger className="font-display text-h5 text-primary hover:text-accent hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="font-body text-muted-foreground leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default FAQSection;
