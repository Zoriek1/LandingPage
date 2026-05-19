import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Até quando posso encomendar para entregar no Dia dos Namorados?",
    a: "O ideal é até 10 de junho para garantir a entrega no dia 12/06. Pedido em cima da hora depende da disponibilidade — manda no WhatsApp que a gente confirma na mesma hora.",
  },
  {
    q: "Vocês entregam na sexta-feira, dia 12 de junho?",
    a: "Sim. Fazemos entregas ao longo do dia 12/06 com janelas de horário. No WhatsApp, a gente combina a melhor janela para o seu endereço (manhã, almoço ou fim da tarde).",
  },
  {
    q: "Consigo entregar surpresa no trabalho dela(e)?",
    a: "Sim — é o pedido mais comum no Dia dos Namorados. Você só precisa passar o nome da pessoa, empresa, endereço, andar/setor e o melhor horário. A gente entrega direto.",
  },
  {
    q: "Quanto custa o frete?",
    a: "Depende do bairro. Em alguns bairros centrais, frete grátis acima de um valor mínimo. A gente confirma o frete na hora da encomenda, antes de você fechar o pedido.",
  },
  {
    q: "O cartão escrito à mão é grátis?",
    a: "Sim. Você manda a mensagem pelo WhatsApp e a gente escreve à mão no cartão. Sem cobrar a parte.",
  },
  {
    q: "Posso pagar pelo Pix?",
    a: "Pode. Pix tem 5% de desconto. Também aceitamos crédito, débito e link de pagamento.",
  },
];

const FAQSection = () => (
  <section id="faq" className="py-20 md:py-28 bg-secondary/30">
    <div className="container max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-3">
          Perguntas frequentes
        </h2>
        <p className="font-body text-muted-foreground">
          As dúvidas mais comuns de quem encomenda no Dia dos Namorados.
        </p>
      </motion.div>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="bg-background rounded border-none px-5"
          >
            <AccordionTrigger className="font-display text-left text-base md:text-lg font-semibold text-primary hover:no-underline">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="font-body text-sm leading-relaxed text-muted-foreground">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQSection;
