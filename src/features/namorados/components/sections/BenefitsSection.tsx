import { motion } from "framer-motion";
import { Truck, Camera, Heart, MapPin } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Entrega no Dia dos Namorados",
    desc: "Você escolhe pelo catálogo e a gente confirma endereço, frete e janela de entrega no WhatsApp — antes ou no dia 12/06.",
  },
  {
    icon: Camera,
    title: "Foto antes de despachar",
    desc: "Mandamos a foto do pedido pronto antes de sair pra entrega, pra você ver o arranjo que vai surpreender.",
  },
  {
    icon: Heart,
    title: "Cartão escrito à mão grátis",
    desc: "Manda a mensagem pelo WhatsApp e a gente escreve no cartão. Sem cobrar a parte e sem custar a emoção da surpresa.",
  },
  {
    icon: MapPin,
    title: "Atendemos toda Goiânia",
    desc: "Entregamos em toda a cidade. O frete depende do bairro e a gente confirma na hora da encomenda, antes de você fechar o pedido.",
  },
];

const BenefitsSection = () => (
  <section className="py-20 md:py-28 bg-background">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
          Surpresa garantida, sem stress de última hora.
        </h2>
        <p className="font-body text-muted-foreground max-w-md mx-auto">
          Pedido direto pelo WhatsApp, confirmação rápida e entrega no horário combinado.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-secondary/50 rounded p-5 md:p-8 text-center group hover:shadow-lg transition-shadow"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <b.icon size={24} className="text-accent" />
            </div>
            <h3 className="font-display text-lg font-semibold text-primary mb-2">{b.title}</h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
