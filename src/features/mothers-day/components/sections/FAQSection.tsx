import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Até quando posso encomendar para entregar no Dia das Mães?",
    a: "O ideal é até 7 de maio para garantir a entrega no domingo (10/05). Pedido de última hora depende da disponibilidade. Manda no WhatsApp e a gente confirma na hora.",
  },
  {
    q: "Vocês entregam no domingo de Dia das Mães?",
    a: "Sim. Fazemos entregas ao longo do domingo. No WhatsApp, a gente confirma a melhor janela para o seu endereço.",
  },
  {
    q: "Quais bairros de Goiânia vocês atendem?",
    a: "Toda Goiânia. O frete varia por região e a gente informa na hora da encomenda. Em alguns bairros centrais, frete grátis acima de um valor mínimo.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Pix, cartão (parcelado em até 3x) ou dinheiro na entrega. A forma de pagamento é confirmada no WhatsApp antes de fechar o pedido.",
  },
  {
    q: "E se minha mãe não estiver em casa na hora da entrega?",
    a: "A gente entra em contato e combina um novo horário, ou entrega para porteiro ou vizinho de confiança com a sua autorização.",
  },
  {
    q: "Como sei que vai chegar bonito?",
    a: "Antes de sair para entrega, mandamos a foto do pedido pronto no seu WhatsApp para você conferir que ele está como o catálogo prometia. Se algo fugir desse padrão, a gente corrige antes de enviar.",
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
          Perguntas frequentes
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
