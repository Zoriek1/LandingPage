import { motion } from "framer-motion";
import fachadaImg from "@/assets/fachada.jpg";

const OurStorySection = () => (
  <section id="nossa-historia" className="py-20 md:py-28 bg-secondary">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
          Nossa História
        </h2>
        <p className="font-body text-muted-foreground max-w-md mx-auto">
          Conheça a Plante Uma Flor e a paixão por trás de cada arranjo.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Espaço reservado para foto da fachada */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <img
            src={fachadaImg}
            alt="Fachada da Plante Uma Flor"
            className="w-full aspect-[4/3] rounded shadow-2xl object-cover"
            loading="lazy"
          />
          <div className="absolute -bottom-4 -right-4 w-24 h-24 border-2 border-accent rounded-br-lg" />
        </motion.div>

        {/* Texto da história */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-6">
            De um sonho florido à sua porta
          </h3>

          <div className="space-y-4 font-body text-muted-foreground leading-relaxed">
            <p>
              {/* Substitua este texto pela história real da floricultura */}
              A Plante Uma Flor nasceu do amor pelas flores e do desejo de transformar cada momento em uma lembrança especial. Desde o início, nosso compromisso é oferecer arranjos que emocionam, com qualidade, frescor e carinho em cada detalhe.
            </p>
            <p>
              Nossa loja é um espaço pensado para inspirar: cada flor é selecionada a dedo, cada arranjo é criado com dedicação. Acreditamos que flores são muito mais do que um presente — são uma forma de dizer o que palavras às vezes não conseguem expressar.
            </p>
            <p>
              Estamos aqui para fazer parte dos seus momentos mais especiais, seja um aniversário, uma declaração de amor ou simplesmente um gesto de carinho.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default OurStorySection;
