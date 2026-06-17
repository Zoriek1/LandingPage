import { motion } from "framer-motion";
import fachadaImg from "@/assets/fachada.jpg";

const OurStorySection = () => (
  <section id="nossa-historia" className="bg-secondary py-20 md:py-28">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14 text-center md:mb-16"
      >
        <span className="mb-4 inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Nossa História
        </span>
        <h2 className="mb-4 font-display text-3xl font-semibold text-primary md:text-4xl">
          A paixão por trás de cada arranjo
        </h2>
        <p className="mx-auto max-w-md font-body text-muted-foreground">
          Conheça a Plante Uma Flor e o cuidado que colocamos em cada entrega.
        </p>
      </motion.div>

      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <img
            src={fachadaImg}
            alt="Fachada da Plante Uma Flor em Goiânia"
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-2xl"
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
          <h3 className="mb-6 font-display text-2xl font-semibold text-primary md:text-3xl">
            De um sonho florido à sua porta
          </h3>

          <div className="space-y-4 font-body leading-relaxed text-muted-foreground">
            <p>
              A Plante Uma Flor nasceu do amor pelas flores e do desejo de transformar cada momento em uma lembrança especial. Desde o início, nosso compromisso é oferecer arranjos que emocionam, com qualidade, frescor e carinho em cada detalhe.
            </p>
            <p>
              Nossa loja é um espaço pensado para inspirar: cada flor é selecionada a dedo, cada arranjo é criado com dedicação. Acreditamos que flores são muito mais do que um presente: são uma forma de dizer o que palavras às vezes não conseguem expressar.
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
