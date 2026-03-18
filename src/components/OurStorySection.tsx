import { motion } from "framer-motion";

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
          <div className="w-full aspect-[4/3] rounded shadow-2xl bg-muted flex items-center justify-center border-2 border-dashed border-accent/30">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </div>
              <p className="font-body text-muted-foreground text-sm">
                Foto da fachada da floricultura
              </p>
              <p className="font-body text-muted-foreground/60 text-xs mt-1">
                Substitua este espaço pela imagem real
              </p>
            </div>
          </div>
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
