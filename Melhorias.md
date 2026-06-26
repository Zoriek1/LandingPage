# PLAN.md — Melhorias nas Landing Pages por Prioridade

> **Status (2026-06-26):** P0 e P1 concluídos. P2 são experimentos futuros; itens 14–16 foram ignorados de propósito.
> Legenda: ✅ feito · 🔜 futuro · ⏭️ ignorado neste ciclo.
>
> Verificação: `npm run check` (typecheck + lint + testes) — 32/32 testes passando.

## P0 — Corrigir primeiro

### 1. Corrigir preços divergentes — ✅ FEITO

> Fonte única: snapshots (`src/data` e `src/features/*/data`) + `ad-lps/data/configs.ts` (`priceBrl`).
> A mensagem do WhatsApp é montada a partir do preço atual (`landing-whatsapp.ts`), não de texto fixo.
> Consistência `waText` × `priceBrl` é travada por teste (`src/test/adProducts.test.ts`).

* Unificar todos os preços dos produtos em uma única fonte de verdade.
* Conferir principalmente:

  * Buquê Clássico de Rosas Vermelhas.
  * Arranjo de Mão de Rosas Vermelhas.
  * Buquê de Rosas com Astromélias.
  * Buquês de Lírios.
  * Produtos usados nas LPs de urgência, rosas, lírios, aniversário, Dia das Mães e Dia dos Namorados.
* Evitar que home, LPs e snapshots tenham preços diferentes.
* Atualizar também o texto automático do WhatsApp com o preço correto.
* Motivo: preço divergente quebra confiança e pode gerar reclamação no atendimento.

### 2. Fazer produtos da vitrine abrirem WhatsApp com dados do produto — ✅ FEITO

> Todos os cards (home, Dia das Mães, Namorados e ad-lps) chamam `openProductWhatsApp`/`openAdLpWhatsApp`
> com nome, preço, página de origem e intenção de entrega.

* Trocar o comportamento dos cards de produto da LP.
* Em vez de mandar o usuário para o site, abrir WhatsApp com mensagem automática.
* A mensagem deve incluir:

  * Nome do produto.
  * Preço.
  * Página de origem.
  * Código de atendimento.
  * Intenção de entrega.
* Exemplo de mensagem:

  * “Olá! Vi a página de buquês e quero encomendar: Buquê Clássico de Rosas Vermelhas — R$ 325,90. Gostaria de confirmar disponibilidade para entrega hoje.”
* Usar o campo `waText` dos produtos, mas corrigindo para preço atualizado.
* Motivo: reduz atrito e melhora a jornada LP → WhatsApp.

### 3. Reduzir desvios da jornada LP → WhatsApp — ✅ FEITO

> Hero, Navbar, CTA final e garantia agora vão para o WhatsApp. Sobrou apenas um link de site
> secundário no rodapé (`trackSiteClick`), como previsto no plano.

* A jornada principal deve ser:

  * LP → WhatsApp com contexto.
* Reduzir caminhos que desviam o cliente:

  * LP → site.
  * LP → catálogo externo.
  * LP → botão genérico de conversa.
  * LP → garantia com CTA forte.
  * LP → produto no site.
* Manter links secundários apenas quando necessários.
* O WhatsApp deve ser o destino principal das landing pages de tráfego pago.
* Motivo: quanto mais caminhos, maior a chance do cliente sair sem chamar.

### 4. Completar footer com informações essenciais — ✅ FEITO

> `src/components/layout/BusinessFooter.tsx` alimentado por `src/lib/business-info.ts` (CNPJ, endereço,
> horário, telefone/WhatsApp, e-mail fiscal, regiões). Usado na home, Dia das Mães e Namorados.

* Adicionar no rodapé:

  * CNPJ.
  * Endereço físico completo.
  * Horário de funcionamento.
  * WhatsApp/telefone.
  * Cidade e regiões atendidas.
* Se possível, adicionar também links de:

  * Política de entrega.
  * Política de troca/garantia.
  * Política de privacidade.
* Motivo: aumenta confiança, segurança jurídica e percepção de empresa real.

---

## P1 — Melhorar conversão depois dos ajustes críticos

### 5. Melhorar CTAs genéricos — ✅ FEITO

> `ctaCopy` específico por LP + pedidos guiados ("Me ajude a escolher", "Quero confirmar disponibilidade" etc.).

* Revisar botões com textos fracos como:

  * “Falar com atendente”.
  * “Tirar dúvida”.
  * “Ver opções”.
  * “Comprar no WhatsApp”.
* Trocar por CTAs mais específicos, conforme intenção da página:

  * “Quero encomendar esse buquê”.
  * “Quero confirmar disponibilidade”.
  * “Quero mandar com cartão”.
  * “Quero ajuda para escolher”.
  * “Quero agendar a entrega”.
* Não exagerar na agressividade.
* O tom deve parecer atendimento guiado, não pressão artificial.

### 6. Melhorar botão “Ver mais buquês” — ✅ FEITO

> Virou expansão da vitrine na própria página ("Quero ver mais opções") + "Me ajude a escolher" via WhatsApp guiado.
> Não depende mais de catálogo externo.

* O botão atual é fraco e pouco vendedor.
* Como não há catálogo direto perfeito, evitar depender só do site externo.
* Trocar por uma opção mais útil:

  * “Quero ajuda para escolher”.
  * “Ver mais opções”.
  * “Me ajude a encontrar o buquê ideal”.
* Idealmente, abrir WhatsApp com mensagem:

  * “Olá! Vi a página e quero ver mais opções de buquês. Pode me ajudar a escolher por faixa de preço e ocasião?”

### 7. Reduzir força visual da garantia — ✅ FEITO

> `GuaranteeSection` virou bloco de confiança com botão secundário (outline) "Ver detalhes da garantia".

* A garantia é boa, mas não deve competir com o botão de compra.
* Transformar a seção de garantia em bloco de confiança.
* Evitar botão verde grande igual ao CTA principal.
* Usar texto mais discreto:

  * “Você aprova a foto antes da entrega.”
  * “Se algo não sair como combinado, resolvemos no mesmo dia.”
* Se houver link, usar como secundário:

  * “Ver detalhes da garantia”.

### 8. Ajustar exibição das avaliações antigas — ✅ FEITO

> Datas "há X semanas" removidas; rótulo agora é "Avaliação no Google" / "Avaliação pública no Google".

* Manter avaliações reais para preservar transparência.
* Reduzir o destaque de datas como “há 17 semanas”, “há 23 semanas” etc.
* Trocar a data visível por algo como:

  * “Avaliação verificada no Google”.
  * “Cliente real no Google”.
  * “Avaliação pública no Google”.
* Outra opção: deixar a data menor, mais discreta e sem destaque visual.
* Não remover todas as avaliações, porque elas ajudam na prova social.

### 9. Manter foto da fachada, mas melhorar apresentação — ✅ FEITO

> `OurStorySection` mantém a fachada com selo "Loja física em Goiânia / Floricultura tradicional há 40 anos /
> atendimento local e entrega própria".

* Não remover a foto da fachada, porque ela prova que a loja física existe.
* Isso é importante para Facebook Ads, Google Ads e confiança do cliente.
* Melhorar o contexto da imagem com textos como:

  * “Loja física em Goiânia”.
  * “Floricultura tradicional há 40 anos”.
  * “Atendimento local e entrega própria”.
* Usar a fachada como prova de existência, não necessariamente como imagem principal de desejo.
* Futuramente substituir por foto melhor da entrada/vitrine com flores em destaque. (🔜 ver item 13)

### 10. Manter urgência apenas na LP de urgência — ✅ FEITO

> A LP `urgencia` concentra os gatilhos "entrega hoje"; as demais usam intenção específica por ocasião.

* Não aplicar gatilho de “entrega hoje” com muita força em todas as LPs.
* Na LP de urgência, manter CTAs como:

  * “Garantir entrega hoje”.
  * “Quero entregar ainda hoje”.
  * “Quero presentear hoje”.
* Nas outras LPs, usar intenção específica:

  * Aniversário: “Quero agendar a entrega”.
  * Lírios: “Quero encomendar lírios”.
  * Rosas: “Quero mandar rosas”.
  * Baixo ticket: “Quero ver opções até R$ 149,90”.

---

## P2 — Experimentos e refinamentos futuros

### 11. Avaliar mini-guia antes do WhatsApp sem travar a compra — 🔜 FUTURO

> Caminho direto (produto → WhatsApp) e caminho guiado ("Me ajude a escolher") já existem;
> o mini-guia visual em si ainda não foi construído.

* Não colocar modal obrigatório antes do WhatsApp para todos os cliques.
* Isso pode aumentar atrito para quem já quer comprar.
* Criar dois caminhos:

  * Caminho direto: produto → WhatsApp com produto e preço.
  * Caminho guiado: “Me ajude a escolher” → mini-guia visual.
* O mini-guia pode perguntar:

  * Qual a ocasião do presente?
  * Qual faixa de preço?
  * Qual flor combina mais?
* Usar imagens bonitas para tornar a escolha mais fácil.
* No final do guia, abrir WhatsApp com a resposta já preenchida.

### 12. Melhorar fotos dos produtos futuramente — 🔜 FUTURO

* Não tratar como gargalo principal agora.
* Futuramente, padronizar fotos de produtos com:

  * Fundo mais limpo.
  * Enquadramento consistente.
  * Boa iluminação.
  * Menos elementos distraindo.
* Melhorar principalmente produtos mais vendidos e usados nos anúncios.

### 13. Melhorar fotografia da fachada/vitrine — 🔜 FUTURO

* Manter foto da loja como prova de existência.
* Futuramente contratar ou fazer foto melhor da entrada.
* Ideal:

  * Foto diurna.
  * Flores visíveis.
  * Fachada limpa.
  * Placa/identidade da loja aparente.
  * Aparência mais elegante e comercial.

---

## Itens ignorados neste ciclo

### 14. Ignorar problema da seção “Como funciona” — ⏭️ IGNORADO

* O apontamento provavelmente veio de print feito durante transição/animação.
* O código atual possui os passos completos.
* Não tratar como erro de layout neste momento.

### 15. Ignorar crítica pesada das imagens dos produtos como prioridade imediata — ⏭️ IGNORADO

* A crítica de acabamento das imagens não deve entrar como prioridade agora.
* As imagens podem ser melhoradas futuramente, mas não são o principal gargalo de conversão.

### 16. Ignorar crítica do texto invisível nas categorias — ⏭️ IGNORADO

* O apontamento veio de print errado.
* O código atual já possui camada escura/gradiente sobre as imagens das categorias.
* Não tratar como prioridade agora.
