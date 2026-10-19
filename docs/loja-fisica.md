# Loja física — implementação e operação

Plano aprovado na conversa: HTML independente em `/loja-fisica/`, mantendo a home e as campanhas existentes. Público local buscando retirada de vasos, insumos e plantas. Conversões principais: ligação e rota GPS. Desde 17/10/2026 o foco é o morador de casa e apartamento que compra planta ornamental, vaso, adubo e terra (seção "Redesign de 17/10/2026" no fim deste arquivo).

## Registro de execução

- Escopo: frontend estático, tracking dataLayer e endpoint público restrito à Plante no Gestor.
- Decisão autorizada: trabalhar no checkout atual, sem worktree. README previamente commitado em `aabd442`.
- Interface: POST `/api/landing/distancia-loja`, JSON `{latitude, longitude}` → `{success, distancia_km, duracao_min, provider: "google_routes"}`. Não há fallback em linha reta.
- Estado: implementação validada; publicação e ativação do serviço dependem dos gates abaixo.

## Direção da página

Superfície de decisão rápida. Identidade já existente, fundo claro, Fraunces/Jost, verde botânico para rota e ação neutra para ligação. Headline e ações à esquerda, fachada real à direita no desktop; ações antes da foto no mobile. Categorias sem links comerciais adicionais. Mapa e horário juntos na seção de visita. Barra inferior mobile com duas ações iguais em largura. A ordem das seções, as categorias e a barra fixa (hoje com três ações) mudaram depois; o estado atual está em `docs/loja-fisica.design.md` e na seção "Redesign de 17/10/2026" abaixo.

## Publicação

1. Publicar primeiro as alterações do Gestor: `core.py`, `google_routes.py` e `landing_distance.py`. Não há migration desta funcionalidade.
2. Configurar no servidor `GOOGLE_MAPS_API_KEY` com Geocoding API e Routes API habilitadas/restritas ao backend. Não colocar chave em variável `VITE_*`.
3. Manter `RATELIMIT_ENABLED=true` e `RATELIMIT_STORAGE_URI` em Redis compartilhado (`redis://` ou `rediss://`). O endpoint recusa consultas se o limiter estiver desligado, em fallback ou sem armazenamento compartilhado na produção. Limites de 5/min por IP e 60/min globais; o geocode da loja é cacheado por processo por 24h (falhas por 60s).
4. Confirmar `APP_BASE_DOMAIN=gestaoonline.app.br`, loja ativa de slug `planteumaflor` e origem CORS `https://lpb.planteumaflor.com`. Hosts desconhecidos/outras lojas não podem usar o endpoint.
5. Validar uma rota real e o destino geocodificado no endereço **Rua 132, 289, Setor Sul, Goiânia**. O código rejeita geocode aproximado, mas essa checagem visual continua sendo um gate de publicação. Consultas pagas não foram feitas na implementação.
6. Auditar o GTM conforme `docs/tracking.md`: os links no DOM são genéricos; a origem fica em memória e é usada só na abertura do Maps. Não capturar localização em tags ou instrumentação extra. Publicação/configuração de tags não está incluída.
7. Depois dos gates, construir a landing com `VITE_STORE_DISTANCE_ENABLED=true`. Sem essa variável, o botão apenas obtém a localização e prepara o link para consultar distância no Google Maps; não chama o backend. O mapa, ligações e rotas continuam disponíveis sem JavaScript.

Não há detecção por IP. A permissão de localização é pedida só ao clicar. A origem não é gravada no navegador/CRM e não passa pelo logger de rotas. Não habilitar captura de corpos de requisição para este endpoint no proxy/APM. Recusa, timeout, 429 e indisponibilidade preservam os links de rota. A duração é estimativa de carro, sem previsão de trânsito ao vivo.

## Verificação reproduzível

- Unitários: `npx vitest run src/test/physicalStore.test.ts src/test/physicalStoreTracking.test.ts`.
- Tipos: `npm run typecheck`.
- Build local sem sincronização externa de produtos: `npx vite build`.
- Carrosséis, faixas, "encontra / não encontra" e avaliações: `npx vitest run src/test/physicalStorePage.test.ts src/test/categoryCarousel.test.tsx src/test/categoryCarouselFallback.test.tsx src/test/categoryCarouselSwipe.test.tsx src/test/lojaCountUp.test.ts src/test/lojaMainEnhancements.test.ts`. O `theme.tokens.test.ts` barra cor literal no CSS da página.
- Navegador: servidor Vite com `VITE_STORE_DISTANCE_ENABLED=true`, porta 4179; `playwright-cli -s=loja-fisica run-code --filename=scripts/qa-loja-fisica.cjs`. O script bloqueia GTM/Meta/leads e simula apenas o serviço de distância, nunca o mapa incorporado.
- Evidências locais: `.impeccable/review/` em desktop 1280, mobile 375 e tablet 768. Não houve overflow horizontal; botões/links têm pelo menos 48px de altura; barra mobile visível apenas abaixo de 768px. Sucesso, erro 503 e recusa de permissão foram exercitados. O Google Maps real exibiu o pin da loja.
- Backend: `BACKEND_IMAGE=gestor-landing-test:local bash scripts/run-test-bands.sh --picked` no Gestor, exclusivamente PostgreSQL descartável. A imagem de teste precisa ter **código atual** e dependências compatíveis: a imagem antiga não tinha `leads.status_changed_at`; uma reconstrução sem lock instalou SQLAlchemy 2.1 e tentou usar `psycopg` ausente. A validação usa as dependências da imagem local previamente funcional com o código atual copiado sobre ela, sem alteração de requirements.

## Rulings

- Preservar fontes e tokens Plante em vez de introduzir uma segunda identidade — decisão aprovada no plano.
- Distância dentro da página fica atrás do gate de deploy — evita disponibilizar uma chamada para endpoint ainda não publicado; rotas permanecem funcionais.
- Usar revisão independente generalista com capturas e contrato visual — o tipo de agente nomeado do Impeccable não está disponível neste harness.

## Resultado final

- 15 testes frontend passaram; typecheck e build final passaram. Alterações de navegação após revisão foram verificadas no navegador.
- 20 testes do endpoint passaram no PostgreSQL descartável, incluindo CORS/host com a aplicação real. Auditoria pública adicional: 5 passaram, 1 não pertence à banda rollback.
- Build padrão (distância desativada) verificado sem chamadas ao backend, com storage bloqueado e com JavaScript desativado.
- Revisão independente concluída após correções de privacidade e contraste, sem pendências materiais. Registro visual: `docs/loja-fisica.design.md`. Detector automático executou em modo degradado, sem avaliar contraste computado; não representa auditoria completa de acessibilidade.
- Nenhum token gerado, home ou campanha existente foi substituído. Alterações externas do usuário foram preservadas. Deploy e publicação de tags não fizeram parte da validação local.

## Redesign de 17/10/2026

Origem: wireframe anotado do dono e respostas dele. Branch `claude/loja-fisica-redesign-t754nt`. Topo, faixa "Na loja", visita, rodapé e barra fixa do celular ficaram como estavam. Registro visual e de acessibilidade em `docs/loja-fisica.design.md`.

### Ordem da página

| # | Seção | Âncoras | Formato |
|---|---|---|---|
| 1 | Topo | `hero-title` | Igual |
| 2 | Faixa "Na loja" | | Igual |
| 3 | Categorias | `categories-title`, `vasos`, `terras`, `jardim` | Carrossel de fotos por categoria; "Para o jardim" só em texto |
| 4 | Aqui você encontra / não encontra | `mudas`, `plantas`, `nao-encontra` | Duas listas tipográficas e Ligar/WhatsApp |
| 5 | Ornamentais | `faixa-ornamentais` | Mosaico: uma foto horizontal e duas verticais |
| 6 | Vasos | `faixa-vasos` | Fila de cinco fotos que rola de lado |
| 7 | Nossa História | `nossa-historia` | Título, foto, texto curto e duas fotos verticais |
| 8 | Avaliações | `reviews-title` | Foto da loja, três números que sobem e três citações |
| 9 | Visita | `visite` | Igual |

As três faixas (5 a 7) não têm CTA próprio. Ligar, WhatsApp e Como chegar continuam no topo, em `#mudas`, na visita e na barra fixa, então a ação primária segue clara.

### Foco ornamental e o bloco "encontra / não encontra"

- A categoria "Plantas e Mudas" virou "Plantas Ornamentais" (ficus, monstera, samambaia e outras folhagens de casa e apartamento). O link "Ver a lista" aponta para `#mudas`, que manteve o id para não quebrar link de anúncio. `#plantas` agora é o bloco "Aqui você encontra".
- Saíram o sumário dos sete grupos, os blocos de frutíferas, árvores, palmeiras, floríferas, suculentas e horta, as linhas "Conforme a época, sob consulta" e as âncoras `#frutiferas`, `#arvores`, `#palmeiras`, `#floriferas`, `#suculentas` e `#horta`. Quem ainda tiver anúncio apontando para elas cai no topo da página, sem erro.
- "Aqui você encontra" (16 itens): ficus, monstera, samambaia, begônia dragão, impatiens, jiboia, zamioculca, costela-de-adão, lírio-da-paz, antúrio, orquídea, rosa-do-deserto, suculentas, bambu da sorte, aglaonema e filodendro. Ficus, monstera, begônia dragão e impatiens vêm do wireframe do dono; os outros 12 já estavam na lista antiga do site. Nenhuma planta nova entra sem ele confirmar.
- "Aqui você não encontra": grama, plantas do cerrado, sementes e ração para gado. O remate é "Falta de atenção e carinho também não. Aqui sobra." (texto provisório, ver pendências). "Cajuzinho do cerrado" e "pequi", que a lista antiga citava como sob consulta, saíram de vez, porque a página agora diz que não há plantas do cerrado.
- Visual: duas colunas a partir de 768 px (48em), empilhadas no celular. "Encontra" em verde da marca, em Fraunces; "não encontra" em cor muted e Jost, sem texto riscado e sem pills.
- O CTA do bloco ("Não achou na lista ou quer garantir a sua planta?") manteve Ligar e WhatsApp com `data-location="mudas"`. Tracking inalterado.
- `physicalStorePage.test.ts` fixa as regras: grama e semente só aparecem dentro de `#nao-encontra`; continuam barrados buquê, flor de corte, pau-brasil, barbatimão, tagete, bulbo, peônia e o travessão; frutíferas, árvores e "sob consulta" não aparecem no corpo, no title nem na description; os termos de busca (loja de plantas, jardinagem, garden center, plantas ornamentais, mudas, vasos, adubo, terra e nomes como ficus, monstera, samambaia e zamioculca) precisam estar no texto, e pomar, cajuzinho, pequi, ipê e jabuticaba não podem.

### Risco de SEO e Ads

Sai da página o vocabulário "frutíferas, jabuticaba, ipê, muda de árvore", que alimentava a relevância das campanhas. Em 11/10/2026 a experiência na página de destino estava "Abaixo da média" em 12 de 13 palavras-chave da campanha "PESQUISA | IR PARA LOJA", e a rodada daquele dia acrescentou esse vocabulário justamente para subir a nota. Agora ele sai de novo, porque o dono quer falar com quem mora em casa e apartamento e compra planta ornamental.

- Mitigação no código: "mudas" continua no title ("Plantas, mudas e vasos no Setor Sul"), no H1 ("Plantas, mudas, vasos e adubo para levar na hora.") e no texto de `#mudas` ("plantas ornamentais e mudas de folhagem"). A description cita plantas ornamentais, mudas de folhagem, vasos, terra e adubo.
- Ação fora do código, do dono: depois de publicar, conferir os termos de pesquisa e as palavras-chave da campanha. Se ela ainda compra "muda de ipê", "frutífera" ou "jabuticaba", a página não responde a isso: negativar esses termos ou aceitar relevância menor neles. Reavaliar a experiência na página de destino depois da publicação e comparar com o "Abaixo da média" de 11/10.

### Carrosséis das categorias

Cada categoria com foto (vasos, adubos, terras, plantas) tem um carrossel: ilha React carregada só quando se aproxima da tela, com o HTML estático como fonte de verdade (é o que o Google e quem está sem JavaScript enxergam).

Contrato de marcação:

```html
<div class="category-carousel" data-carousel data-carousel-label="Vasos de alto padrão">
  <ul class="category-carousel-list" role="list">
    <li class="category-carousel-slide" data-caption="legenda curta">
      <picture>
        <source type="image/avif" srcset="... 480w, ... 960w" sizes="..."/>
        <source type="image/webp" srcset="... 480w, ... 960w" sizes="..."/>
        <img src="..." alt="alt descritivo" width="960" height="1200" loading="lazy" decoding="async"/>
      </picture>
    </li>
    <!-- um <li> por foto, 3 ou mais -->
  </ul>
</div>
```

- `data-carousel-label` vira o nome do grupo e entra no nome de todos os botões. `data-caption` é a legenda visível; sem ele vale o `alt`.
- Sem JavaScript o CSS mostra só o primeiro `<li>`, na mesma caixa do cartão montado (76% da largura do palco, 4:5, moldura creme do token `--color-surface-card`, raio `--radius`). O palco reserva a altura dos controles para não haver salto de layout; `@media (scripting: none)` tira essa reserva.
- Módulos: `src/loja-fisica/carousels.tsx` exporta `initCategoryCarousels(root?)` (monta, idempotente, nunca lança), `destroyCategoryCarousels(root?)` e `readCarouselSlides(container)`; `src/loja-fisica/category-carousel.tsx` é o componente. Depois de montado, o carrossel recebe `data-carousel-ready`. Se o componente quebrar, uma fronteira de erro devolve o HTML estático. Com menos de duas fotos não monta.
- Carregamento (`main.ts`): `import("./carousels")` quando o primeiro `[data-carousel]` chega a 200 px da tela (`IntersectionObserver`). Sem `IntersectionObserver` usa `requestIdleCallback` (limite de 4 s) ou, sem ele, `setTimeout` de 2 s. Se o chunk não chegar, os carrosséis não montados ganham `data-carousel-failed` e o CSS solta o espaço reservado. Não toca o LCP do hero.
- Bundle: `vite.config.ts` ganhou o grupo `preload-helper`. O helper do `import()` dinâmico é usado por toda entrada; sem grupo próprio ele caía no `react-vendor` e a `/loja-fisica/` (página sem React) baixaria o React inteiro antes do `main.ts`. O HTML final carrega só `lojaFisica`, `modulepreload-polyfill` e `preload-helper` no topo; React e `framer-motion` (chunk `motion`) vêm no `import()` do carrossel. Conferir isso em `dist/loja-fisica/index.html` depois de qualquer mudança de build.
- Mecânica (porte do feature-carousel do 21st.dev, sem painel azul, chips, gradiente, glow nem hugeicons): pilha de cartões em que o ativo fica no centro e o anterior e o próximo espiam atrás (`scale` 0,86, `rotate` de 3 graus, `opacity` 0,45, deslocamento de 18% do cartão) com spring do `framer-motion`. Só as fotos vizinhas ao centro montam `<picture>`; as outras esperam a vez.
- Autoplay de 4,5 s, uma foto por vez. Pausa com mouse em cima, com foco de teclado dentro, durante o arrasto, com menos de 25% do carrossel na tela e pelo botão de pausa (WCAG 2.2.2). Com `prefers-reduced-motion` não há autoplay, o botão de pausa não aparece e a troca é instantânea.
- Controles: setas anterior e próxima, indicadores clicáveis (só o ativo entra no Tab), arrasto horizontal no toque (`drag="x"`) e setas do teclado. Todos têm alvo de 3 rem (48 px). São `<button>` sem `data-whatsapp` nem `data-store-action`, então não contam como conversão e o `main.ts` não os trata.
- Acessibilidade: `role="group"` com `aria-roledescription="carrossel"` e o nome da categoria; cada cartão é `role="group"` `aria-roledescription="slide"`, com os inativos em `aria-hidden`; indicador ativo com `aria-current`. A legenda só é anunciada (região `role="status"`) depois de uma ação da pessoa, nunca durante o autoplay. Foto que não carrega sai do giro e dos indicadores, e as posições são recontadas.
- Layout: uma coluna em largura total no celular, duas colunas a partir de 40em (640 px) e quatro a partir de 64em (1024 px). Os pontos de quebra são em `em` para o texto ampliado não espremer o carrossel.

### Faixas Ornamentais, Vasos e Nossa História

Texto só com fatos que a página já afirma, sem preço, entrega, forma de pagamento nem número novo (o teste confere). Sem Cards aninhados e sem ícones decorativos.

- **Ornamentais** (`#faixa-ornamentais`): título e linha de apoio; mosaico com uma foto horizontal 3:2 e duas verticais 4:5. No celular a horizontal ocupa a linha e as duas verticais ficam lado a lado; no desktop vira grade de 12 colunas.
- **Vasos** (`#faixa-vasos`): cinco fotos 4:5 numa fila que rola de lado com `scroll-snap`, só em CSS, de borda a borda no celular, cada uma com legenda que começa pelo material (Barro, Cerâmica ou Polietileno). A região rolável tem `tabindex="0"` e `role="region"`; o `main.ts` tira o `tabindex` quando não há o que rolar (a partir de 1280 px as cinco cabem).
- **Nossa História** (`#nossa-historia`): título "Mais de 40 anos no Setor Sul.", foto 4:3 da entrada, três parágrafos curtos (nome e endereço, balcão que orienta o cuidado, estacionamento na porta) e duas fotos verticais. No desktop a foto da entrada fica à esquerda, alta, e título, texto e as duas fotos verticais ficam na coluna da direita. O texto atual usa só o que o site já afirma; o dono ainda vai enviar fatos de história (pendência).

### Avaliações com foto e números que sobem

- Foto da loja ao lado do bloco de nota, como na `/lirios-apt`, e três números em lista de definição: 4,8 (nota no Google), 200+ (avaliações no Google) e 40+ (anos no Setor Sul). São os mesmos valores do topo; nenhuma métrica nova. As três citações (Thatiany G., Márcia S. e Calmon X.) continuam com o texto literal do Google.
- `src/loja-fisica/count-up.ts` exporta `initCountUp(root?)`. Marcação: `<span data-count-up>4,8</span>` com o valor final já no HTML. Três regras herdadas de `ad-lps/components/CountUpValue.tsx`: (1) o texto do HTML é o valor final, então sem JavaScript, sem `IntersectionObserver` ou para o robô o número certo aparece; (2) a contagem parte de um número com a mesma quantidade de dígitos (200 parte de 100, 40 de 10, 4,8 de 1,0), sem pular o layout; (3) `prefers-reduced-motion` desliga e fica o valor final. Conta uma vez, em 900 ms, quando 40% do número está visível. Enquanto conta, o leitor de tela recebe só o valor final (o número animado fica `aria-hidden`).
- A Fraunces do subset da página não tem algarismos tabulares, então a largura do número oscila durante a contagem. Nada se desloca, porque o número fica sozinho na linha.

### Divergência nos dados de avaliação

A página diz 4,8 e "mais de 200 avaliações" (conferido no perfil em 25/09/2026, com 210 avaliações). O arquivo `public/lpb/google-reviews.json`, usado pelas LPs de anúncio (`AdLandingPage.tsx`), pela home (`TestimonialsSection.tsx`) e pelos scripts de coleta, diz 4,9 e 203 (`savedAt` 2026-05-14). Não alterei nenhum dos dois. O dono decide qual fonte vale e, se for o caso, o número e o rótulo são atualizados nos dois lugares (`data-count-up`, `.hero-proof` e o JSON). Nota e quantidade devem ser conferidas no Google antes de cada publicação.

### Fotos: política e como trocar

- Fotos reais. Nunca foto gerada por IA. Foto própria da loja primeiro; onde ainda não há, foto do Pexels (aprovado pelo dono em 19/10/2026).
- Enquadramento aberto: a foto entra quase inteira, só com o corte mínimo para a proporção. Não recortar um detalhe de uma foto e ampliar (o dono reprovou: o zoom ficava forte e a mesma foto virava várias).
- Origem de cada arquivo (própria ou número do Pexels): `assets-src/loja-fisica/README.md`.
- Para trocar uma foto: salvar o arquivo novo com o mesmo nome (por exemplo `assets-src/loja-fisica/categorias/vasos-2.jpg`), rodar `npm run images`, conferir o enquadramento (o recorte é centralizado), revisar o `alt` e o `data-caption` (ou a `figcaption`) do HTML, rodar `npm run check` e, como a mudança toca imagens, `npm run check:build`. Trocar mantendo o nome não exige mexer em HTML além de `alt` e legenda.
- Foto a mais: nas categorias, o HTML ganha um `<li>`; nas faixas, a proporção entra em `STORE_STRIP_RATIOS` (`scripts/optimize-images.mjs`) antes da foto. O script avisa no fim do log nome fora do padrão, numeração com buraco e foto sem proporção.
- Variantes geradas em `src/assets/generated/`: `loja-cat-<cat>-<n>-{480,960}.{avif,webp}` (4:5) e `loja-faixa-<faixa>-<n>-{640,1200}.{avif,webp}` (proporção por foto). A fachada (`loja-fachada-*`) segue como estava.
- Ideal para as fotos novas: luz do dia, fundo limpo, sem logotipo de terceiros, mínimo de 1400 px no lado maior e retrato 4:5 nos carrosséis. Foto de celular em pé vale (a orientação do EXIF é respeitada e os metadados, inclusive localização, não vão para a imagem).

Fotos por lugar (revisão de 19/10/2026)

| Uso | Arquivos | Qtd. | O que mostra |
|---|---|---|---|
| Carrossel Vasos | `categorias/vasos-1` a `vasos-3` | 3 | Dois vasos de cerâmica esmaltada da loja e vasos de cerâmica coloridos (Pexels) |
| Carrossel Adubos | `categorias/adubos-1` a `adubos-3` | 3 | Saquinho de NPK 04-14-08 da loja, adubo granulado e composto orgânico (Pexels) |
| Carrossel Terras | `categorias/terras-1` a `terras-5` | 5 | Jeronima 30 L, Terral orquídeas, samambaia e suculentas, terra ensacada (todas da loja) |
| Carrossel Plantas Ornamentais | `categorias/plantas-1` a `plantas-5` | 5 | Pacová e Ficus lyrata da loja; costela-de-adão, zamioculca e lírio-da-paz (Pexels) |
| Faixa Ornamentais | `faixas/ornamentais-1` (3:2), `ornamentais-2` e `-3` (4:5) | 3 | Pátio da loja; calatéia e antúrios (Pexels) |
| Faixa Vasos | `faixas/vasos-1` a `vasos-5` (4:5) | 5 | Duas cerâmicas da loja; barro, cerâmica rasa e polietileno preto (Pexels) |
| Nossa História | `faixas/historia-1` (4:3), `historia-2` e `-3` (4:5) | 3 | Entrada (recorte da foto da rua), letreiro, pacová no pátio |
| Avaliações | `src/assets/fachada.jpg` (4:3) | 1 | A mesma fachada das outras landing pages (`fachada-{480,900}`) |

As fotos próprias de vaso, do pátio e da pacová aparecem duas vezes cada (carrossel e faixa). Cada foto própria nova substitui uma do Pexels sem mexer no layout.

### Tracking

Nada mudou: nenhum evento, `cta_label`, `cta_location` (`header`, `hero`, `mudas`, `visit`, `sticky`, `backup-phone`), UTM, `event_id`, pixel, endpoint ou helper, e nenhum link direto novo para `wa.me` ou `tel:`. A ordem dos links de WhatsApp, ligação e rota continua fixada em `physicalStorePage.test.ts`. Carrosséis, faixas e avaliações não têm `data-whatsapp` nem `data-store-action` (os testes conferem). Antes de publicar, repetir a conferência de `dataLayer` (`store_phone_click`, `store_directions_click`, `whatsapp_click`) descrita em "Verificação reproduzível".

### Pendências do dono

1. Quando der, mandar fotos próprias para trocar as do Pexels: plantas (costela-de-adão, zamioculca, lírio-da-paz, calatéia, antúrio), vasos de barro, cachepô e polietileno, adubos, equipe e balcão (lista em `assets-src/loja-fisica/README.md`).
2. Confirmar a lista final de "Aqui você encontra".
3. Escolher a frase final de "Aqui você não encontra" (o texto atual é provisório; propor 2 a 3 variações sem travessão nem clichê).
4. Enviar texto e fatos de "Nossa História".
5. Decidir qual fonte de nota e contagem de avaliações vale (página: 4,8 e mais de 200; JSON: 4,9 e 203).
6. Revisar as palavras-chave da campanha depois de publicar (risco de SEO e Ads acima).
