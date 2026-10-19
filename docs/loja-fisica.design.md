# Loja física — registro de design

Escopo: somente `/loja-fisica/`. Modo: Persuade. Registro da revisão final de 24/09/2026; decisões implementadas, sem substituir a identidade das demais páginas. Os redesenhos de 25/09, 11/10 e 17/10/2026 vêm em ordem cronológica no fim; o último prevalece onde houver conflito (categorias, `#mudas`, avaliações).

## Identidade e hierarquia

- Fontes locais existentes: Fraunces nos títulos e Jost no corpo, importadas de `src/routes/home-fonts.css`.
- Cores provenientes de `src/styles/tokens.generated.css`, cuja fonte é o design system Plante. Rota usa `--color-action-brand-primary`; ligação usa `--color-action-primary`; legenda da fachada usa superfície inversa e texto sobre escuro. Nenhum token gerado foi alterado.
- Hero apresenta produtos, prova social fornecida no briefing, ligação e rota antes da fotografia no fluxo mobile. A fachada real identifica o destino; nota e quantidade de avaliações não são dados consultados ao vivo.
- Desktop organiza texto e fachada em duas colunas. As quatro categorias passam de uma coluna no mobile a duas no tablet e quatro no desktop. As ilustrações decorativas acompanham títulos e descrições explícitos.
- Endereço, horários, telefones, mapa e navegação ficam na seção de visita. WhatsApp permanece secundário no header. A barra mobile divide ligação e rota em duas metades e respeita a área segura inferior.

## Acessibilidade e comportamento

- Títulos sem etiquetas decorativas acima deles; ordem semântica de headings, link para pular ao conteúdo, foco visível, imagem com texto alternativo e iframe com título.
- Texto descritivo das categorias usa o foreground existente sobre a superfície alternativa. A revisão corrigiu a combinação anterior de texto muted, cujo contraste calculado era inferior a 4,5:1. Isso não equivale a uma auditoria completa de contraste da página.
- Controles principais têm altura mínima de 48 px pelas utilidades existentes; a barra mobile usa 64 px. Resultados de localização são anunciados por região de status; carregamento desabilita temporariamente o botão e erros permitem continuar pelos mapas.
- Horário calculado em `America/Sao_Paulo`, acompanhado de ressalva para feriados. Links nativos de telefone e mapas permanecem disponíveis sem JavaScript.
- Localização somente após ação e permissão. Coordenadas ficam na memória do módulo, nunca nos hrefs do DOM. O clique primário comum constrói a rota personalizada; cliques com modificadores mantêm o link genérico. Eventos próprios de conversão não incluem coordenadas.
- Cálculo de distância permanece desativado por padrão até os gates de backend e publicação. As capturas de QA exercitam também a variante habilitada com respostas simuladas; não comprovam disponibilidade do provedor real.

## Evidência e limites

Revisão visual das capturas em `.impeccable/review/desktop.png`, `tablet.png`, `mobile-viewport.png` e `mobile-map.png`, além das capturas completas e de viewport produzidas na mesma rodada. A captura separada do mapa demonstra seu conteúdo; áreas vazias em full-page podem decorrer da composição lazy do iframe.

Confirmação final por leitura do código e das capturas: corrigidas a exposição de coordenadas em hrefs, a combinação de contraste das categorias e as etiquetas decorativas. A coordenação informou sucesso da rodada de navegador com links genéricos, abertura personalizada simulada, eventos limpos e ausência de chamadas ao CRM. Esta revisão não repetiu testes nem build.

Disposição visual/frontend: ship, condicionada à conclusão dos gates de integração e publicação. Sem novos problemas materiais identificados na confirmação. Não julgados nesta revisão: configuração efetiva do GTM, Redis de produção, consulta paga ao Google, precisão da rota real, deploy e auditoria completa de acessibilidade.

## Redesign mobile de 25/09/2026

- Hero no conceito "Chegada": foto real da entrada (`assets-src/loja-fisica/fachada-rua.jpg`, recortes gerados por `npm run images`) ao fundo, bloco de texto com contorno orgânico, status real da loja, nota do Google e Ligar antes de Como chegar. No iPhone SE os dois botões ficam na primeira tela.
- Nota do Google: 4,8 e 210 avaliações, conferidas no perfil em 25/09/2026. A página mostra "mais de 200 avaliações" para não envelhecer a cada nova avaliação. Conferir a nota antes de cada publicação.
- Avaliações da seção "Quem já passou por aqui": texto literal do Google (inclusive "sai" sem acento), sem data e sem link externo. Nenhuma avaliação acessada fala de estacionamento, então esse ponto continua só como fato operacional, nunca atribuído a clientes.
- Categorias em grade 2x2 com fotos do Unsplash (créditos em `assets-src/loja-fisica/README.md`). Não são produtos da loja; trocar por fotos próprias quando houver, mantendo os nomes dos arquivos, e rodar `npm run images`.
- Barra mobile em bandeja creme: Ligar em verde com o status curto, Como chegar em contorno com o endereço. Aparece só depois que os botões do hero saem da tela; sem JavaScript fica sempre visível; sem animação com redução de movimento.
- Ajustes de 25/09/2026: véu verde na foto do hero (mais forte no celular, ainda mais leve que o das LPs de anúncio), sem a plaquinha do endereço sobre a foto (o endereço fica numa linha discreta no fim do bloco do hero, na seção de visita e no rodapé), folha vetorial do cabeçalho removida (usar o logo real quando houver um arquivo próprio para fundo claro) e WhatsApp do cabeçalho só como ícone verde, sem texto.

## Plantas e mudas de 11/10/2026

Substituído em 17/10/2026: a seção `#mudas` deixou de listar frutíferas e árvores, as categorias ganharam carrossel e as âncoras por grupo saíram (ver "Foco ornamental de 17/10/2026").

Motivo: experiência na página de destino "Abaixo da média" em 12 de 13 palavras-chave da campanha "PESQUISA | IR PARA LOJA". "loja de plantas" é 60% do gasto e boa parte das buscas procura muda, frutífera ou uma planta específica, termos que a página não citava.

- Topo: H1 "Plantas, mudas, vasos e adubo para levar na hora." e subtítulo com "loja de plantas" e "jardinagem". Ligar, WhatsApp e Como chegar em três colunas iguais; no celular o ícone fica sobre o rótulo para caberem lado a lado. Ligar segue cheio em verde; WhatsApp e Como chegar em contorno, com o ícone do WhatsApp no verde próprio do DS (`--color-whatsapp-base`).
- Primeira tela no celular: a foto do topo passou de 4:3 para 3:2 abaixo de 768 px e os títulos em Fraunces usam a entrelinha do DS (1,06, `display-h1-marketing`/`display-h2`). Em 390 x 664 os três botões terminam em 656 px. Antes, em 390 x 664, Ligar e Como chegar já ficavam cortados.
- Categorias: textos de vasos, adubos e terras explicam para que serve cada item; o card de plantas vira "Plantas e Mudas" e leva à seção nova. Bloco "Para o jardim" (pedras e seixos, jardineiras, musgo vivo) sem foto, porque não há foto própria.
- Seção `#mudas`: sete blocos de texto (frutíferas, árvores e nativas, palmeiras e coníferas, interior e folhagens, floríferas, suculentas/cactos/bonsai, horta e temperos) com o que a loja tem e uma linha "Conforme a época, sob consulta". Lista confirmada pelo Caio em 11/10/2026. Não citar grama, sementes, pau-brasil, barbatimão, tagete, bulbos, peônia, flor de corte nem buquê (o teste `physicalStorePage.test.ts` barra esses termos). Sem fotos: o repositório não tem foto própria de mudas e a regra é não usar banco de imagem. Trocar por fotos da loja quando houver.
- No desktop os blocos ficam em colunas de texto (`columns`), não em grade, para os blocos de alturas diferentes encaixarem sem vãos. No fim, aviso de estoque com WhatsApp e Ligar.
- Âncoras dos anúncios: `#mudas` (seção), `#plantas` (bloco de interior e folhagens, onde estão bambu da sorte, zamioculca e afins), `#vasos`, `#terras` e `#jardim`, todas com `scroll-margin-top` pela classe `anchor-target`. `#visite`, `#categories-title` e `#reviews-title` não mudaram.
- Visita: link "WhatsApp: (62) 99650-3403" logo abaixo do telefone do balcão, no mesmo estilo.
- A barra fixa do celular continua com Ligar e Como chegar.
- Lighthouse mobile local (`scripts/perf/lighthouse-run.mjs`, mediana de 5): 88 antes e 88 depois; LCP 2,49 s e 2,45 s; CLS 0,052 e 0,053.

## Repaginação de 11/10/2026

Substituído em 17/10/2026 nos itens de categorias (miniatura no celular, quatro colunas em 4:3), de plantas e mudas (sumário e âncoras por grupo) e de avaliações (sem foto); os demais itens seguem valendo.

Pedido do dono depois da rodada de plantas e mudas: tirar o "round corner" do topo (o card creme de cantos orgânicos), fazer um degradê da foto para o texto, nada de caixa abaulada no desktop, logo real da empresa no lugar do texto "Plante Uma Flor" e seções mais organizadas. Plano escolhido entre três direções (pesquisa no 21st, Aceternity, Magic UI e React Bits; tudo portado para HTML e CSS, sem React).

- Topo sem caixa nem véu verde. A fachada se dissolve no creme por uma camada `::after` com degradê na cor do fundo (`--color-surface-page`) em várias paradas, para não deixar faixa leitosa. No celular a foto fica em cima (4:3) e dissolve para baixo; o status ao vivo da loja abre o texto exatamente na emenda. A partir de 1024 px o texto fica na borda do `.container` e a foto ocupa o resto até a borda direita, dissolvendo para a esquerda e para baixo. Um escurecimento curto no alto da foto segura o logo e o ícone do WhatsApp brancos.
- Recorte novo da fachada para 640 px ou mais: `loja-fachada-lado-{960,1360}` (portão, corredor e letreiro), no lugar de `loja-fachada-desktop-*`. 1360 é a largura real da área na foto.
- Logo real: `logo-240.webp` (branco sobre transparente) usado como máscara CSS e colorido por token. Branco sobre a foto e no rodapé; verde da marca sobre o creme no cabeçalho do desktop, com 64 px de altura como nas LPs de anúncio. Em alto contraste do Windows vira `CanvasText`. O cabeçalho é absoluto sobre o topo, sem faixa e sem fio, e não é fixo.
- Faixa "Na loja" logo abaixo do topo: o checklist com ícones de check virou três fatos só tipográficos, cada um com uma frase que já existia (aviso de estoque, endereço e a dica do balcão).
- Ritmo: 64 px entre seções no celular e 96 px (`--space-section-y`) no desktop, sem faixa cinza e sem fios entre seções. Uma única faixa tonal, nas avaliações (`--color-surface-sunken`). Rodapé em `--color-surface-inverse` com o logo branco.
- Tipos: H1 e H2 em Fraunces 600 (valor do DS) com `text-wrap: balance`; leitura em 16 px; metadados em 15 px (`--text-h6-size`); 12 px só em notas legais. "para levar na hora." em `--color-brand-green` (a cor anterior media 1,08:1 contra o texto e não aparecia).
- Botões: um sistema só, primário cheio (`action-primary`) e secundário em contorno (`action-secondary`), 48 px, raio de 8 px, hover visível e motion do DS (130 ms). Google Maps deixou de ser o verde quase preto e o Waze deixou a borda cinza.
- Categorias: lista com miniatura no celular e quatro colunas no desktop; "Para o jardim" entrou como quinto item, só em texto.
- Plantas e mudas: o texto das listas não mudou. Ganhou sumário dos sete grupos no celular e no tablet e âncoras novas por grupo: `#frutiferas`, `#arvores`, `#palmeiras`, `#floriferas`, `#suculentas`, `#horta` (o `#plantas` continua no grupo de interior). No desktop, três colunas sem fios. "Conforme a época, sob consulta:" em dourado (`--color-brand-accent-hover`).
- Avaliações: nota "4,8" grande, estrela em SVG (o "★" de texto caía na fonte do sistema), citações em Fraunces com aspa pendurada e sem a faixa dourada lateral. Texto literal do Google.
- Visita: rota (Google Maps e Waze lado a lado, mesma largura) logo depois do endereço, mapa, horários com números tabulares e telefones num padrão único. No desktop o mapa fica em 4:3 na coluna da direita e acompanha a rolagem. "Goiânia – GO" virou "Goiânia, GO".
- Barra fixa do celular plana, sem bandeja arredondada nem sombra, com Ligar, WhatsApp (`sticky`/`botao_whatsapp`) e Como chegar como no topo: ícone sobre o rótulo para os três caberem. O horário e o endereço saíram da barra (decisão do dono em 11/10/2026); continuam no topo, na faixa "Na loja" e na visita. Um script inline no `<head>` marca `js-bar` para ela já nascer escondida (sem deslocamento no primeiro quadro); sem JavaScript, ou se o `main.ts` não carregar em 3 s depois do `load`, ela volta a aparecer.
- Movimento: só a "aproximação" da fachada (cresce 6% enquanto o topo sai da tela), em CSS com `animation-timeline: scroll()`, partindo de `scale(1)`. Desligada com redução de movimento e parada em navegadores sem suporte.
- Troca de fonte sem salto: "para levar na hora." fica sempre em linha própria e a página declara uma fonte reserva com a largura da Jost (`"Jost Fallback"`, Arial com `size-adjust: 96%`) antes das fontes de sistema. O ideal é levar essa fonte reserva para os tokens do DS.
- Acessibilidade: com texto ampliado pelo usuário (media query em `em`) botões, categorias e sumário viram uma coluna e nada vaza; no celular o `scroll-padding-bottom` impede que o foco fique escondido sob a barra fixa; em cores forçadas o logo vira `CanvasText` e os botões ganham borda; o nome acessível do Waze contém o texto visível; `#store-status` só é reescrito quando o texto muda.
- Rastreio sem mudança: mesmos `data-*`, ids e hrefs, e a mesma ordem de links fixada em `physicalStorePage.test.ts`. Os links internos (sumário e "Ver a lista") não têm `data-*` e não disparam evento; o teste confere isso.
- Lighthouse mobile local (`scripts/perf/lighthouse-run.mjs`, 10 rodadas intercaladas com a versão anterior, mediana): nota 85 e 85; LCP 2,48 s e 2,42 s; CLS 0,053 e 0,002. Com GTM e gtag bloqueados, 95 nas duas, TBT 0: a oscilação da nota vem dos scripts do Google. No desktop a foto do topo caiu de 88 KB para 38 a 62 KB (AVIF).

## Foco ornamental de 17/10/2026

Pedido do dono, a partir de um wireframe: falar com o morador de casa e apartamento (planta ornamental, vaso bonito, adubo e terra para o vaso), e não com quem procura muda frutífera, árvore, chácara ou fazenda. Hero, faixa "Na loja" e visita ficam como estão, porque ele gosta deles. Sem entrega, forma de pagamento nem preço. Estética premium dentro da identidade existente: Fraunces e Jost, verde, dourado e creme dos tokens, sem glow, glassmorphism, gradiente decorativo nem excesso de pills.

### Hierarquia e ritmo

- Ordem: topo, "Na loja", categorias, "Aqui você encontra / não encontra", Ornamentais, Vasos, Nossa História, avaliações e visita. A ação primária segue sendo ligar ou chamar no WhatsApp; as faixas novas não têm CTA, e o bloco de `#mudas` mantém Ligar e WhatsApp.
- Cada faixa tem um formato próprio para a página não repetir a mesma seção: mosaico assimétrico (Ornamentais), fila que rola de lado (Vasos) e foto grande com texto curto (Nossa História). A segunda e a terceira faixas dividem o espaço de uma seção só (`.strip + .strip`), então o respiro entre elas não dobra. Avaliações continua sendo a única faixa tonal (`--color-surface-sunken`).
- Sem Cards aninhados: foto com raio do token `--radius`, texto solto e espaço fazendo a separação. Legendas em 15 px (`--text-h6-size`) na cor muted.

### Categorias com carrossel

- Celular: o carrossel passa a ocupar a largura inteira, 4:5, com o texto abaixo e uma categoria por vez. A miniatura de 6 rem à esquerda era pequena demais para mais de uma foto. Tablet em duas colunas (a partir de 40em) e desktop em quatro (a partir de 64em), em `em` para o texto ampliado não espremer o carrossel. Saíram o recorte baixo (`.category-art--low`) e o ajuste de `#terras`, feitos para as fotos de banco de imagem.
- Mecânica do feature-carousel do 21st.dev, adaptada: pilha de cartões com o ativo no centro e o anterior e o próximo espiando atrás (`scale` 0,86, 3 graus de rotação, `opacity` 0,45, deslocamento de 18% do cartão), spring do `framer-motion` e troca animada. O cartão ocupa 76% do palco e o palco tem proporção 100 / 95, o que dá foto 4:5. Se o inset do CSS mudar, `PEEK_X` no componente muda junto.
- Fora do porte, por ferir o `CLAUDE.md`: painel azul, chips de feature, gradientes, glow, "Live Session", ícones hugeicons e Tailwind inline. Moldura clara de 6 px no token `--color-surface-card`, ícones de traço simples em SVG próprio, estilo todo em `style.css` com tokens.
- Controles em duas linhas de 3 rem (alvo de 48 px): pausa e indicadores, depois seta anterior, legenda e seta próxima. A legenda ("Vasos e pratos de barro, 1 de 4") mostra o texto inteiro, sem corte; em coluna estreita (container abaixo de 18 rem) as setas ficam nas pontas, em cima, e a legenda ocupa a linha de baixo com altura de duas linhas reservada. Hover só em ponteiro que passa por cima, para não grudar no toque.
- Movimento: autoplay de 4,5 s, parado por mouse em cima, foco de teclado, arrasto, carrossel fora da tela (menos de 25% visível) e botão de pausa. Com `prefers-reduced-motion`: sem autoplay, sem botão de pausa e troca instantânea.
- Acessibilidade: grupo com `aria-roledescription="carrossel"` e nome da categoria, cartões inativos em `aria-hidden`, indicador ativo com `aria-current`, só o indicador ativo no Tab e as setas do teclado trocando a foto (o foco acompanha o indicador). Legenda anunciada por região `status` somente depois de ação da pessoa, nunca no autoplay. Em cores forçadas os botões ganham borda e os traços dos indicadores viram cores de sistema (`CanvasText` e `Highlight`).
- Sem JavaScript, ou se o chunk não chegar: primeira foto estática na mesma caixa do cartão montado (sem salto de layout), com os `alt` no HTML que o Google lê. A ilha só baixa perto da tela e não toca o LCP do hero (detalhes em `docs/loja-fisica.md`).

### "Aqui você encontra / não encontra"

- Duas colunas a partir de 768 px (7fr e 5fr), empilhadas no celular. "Encontra" em Fraunces 500 no verde da marca, com 16 itens em lista tipográfica de colunas automáticas (mínimo de 9,5 rem) e fio fino entre as linhas, não pills nem badges. "Não encontra" em Jost 400 na cor muted, em duas colunas, sem texto riscado: a diferença é só de hierarquia.
- O remate "Falta de atenção e carinho também não. Aqui sobra." usa Fraunces, com "Aqui sobra." em verde. Texto provisório; o dono escolhe a versão final.
- Um fio separa o bloco do CTA ("Não achou na lista ou quer garantir a sua planta?"), com Ligar cheio e WhatsApp em contorno, lado a lado a partir de 768 px.
- Risco de SEO e Ads registrado em `docs/loja-fisica.md`: sai o vocabulário de frutíferas que a rodada de 11/10 tinha acrescentado.

### Faixas

- Ornamentais: título à esquerda e linha de apoio à direita no desktop (grade de 12 colunas); mosaico com a foto 3:2 em 6 colunas e duas verticais 4:5 em 3 colunas cada, a primeira alinhada pela base da linha e a segunda pelo topo. No celular a horizontal ocupa a linha e as verticais ficam lado a lado.
- Vasos: região rolável de borda a borda com `scroll-snap` obrigatório, cartões de 15 rem (no máximo 68% da tela) e o seguinte aparecendo em parte no celular, o que mostra que rola. O primeiro cartão parte do alinhamento do `.container`. A partir de 1280 px as cinco fotos cabem e viram grade; a região só é parada de Tab enquanto há o que rolar. Legendas de material em muted.
- Nossa História: título, foto 4:3 da entrada, três parágrafos curtos e duas fotos 4:5. A partir de 64em, foto grande à esquerda e, à direita, título, texto e as duas fotos, com a foto alta descendo até a base das verticais.
- Todas as fotos reservam a proporção por classe (`photo-3x2`, `photo-4x3`, `photo-4x5`), então não há deslocamento de layout quando carregam. Um teste confere que a classe bate com as dimensões `width` e `height` do HTML.
- Movimento reduzido, cores forçadas e texto ampliado têm regras próprias no CSS das faixas (conferidas por teste).

### Avaliações

- Foto da loja à esquerda (5 colunas) e, à direita, título "Quem já passou por aqui" com os três números; embaixo, a citação em destaque (6 colunas) e as outras duas. No celular tudo empilha: título, números, foto, citações.
- Números em Fraunces 500, do tamanho de `--text-h2-size` (`--text-h1-size` a partir de 64em), com o rótulo (`dt`) vindo antes no HTML e aparecendo embaixo, então a leitura é "nota no Google, 4,8". Estrela em SVG ao lado de "nota no Google", em dourado. Fio fino em cima da linha de números.
- O count-up segue as três regras do `CountUpValue.tsx` das LPs de anúncio: valor final no HTML, mesma quantidade de dígitos na partida e `prefers-reduced-motion` desliga. Uma vez só, ao ficar 40% visível. A Fraunces do subset não tem algarismos tabulares: a largura do número oscila, mas ele fica sozinho na linha e nada se desloca.
- Dados: 4,8, mais de 200 avaliações e mais de 40 anos são os mesmos do topo. Divergência com `public/lpb/google-reviews.json` (4,9 e 203) registrada em `docs/loja-fisica.md`; nenhum dos dois foi alterado.

### Fotos

- Fotos reais, nunca geradas por IA: próprias da loja e, onde ainda não há, do Pexels (detalhes na seção "Fotos próprias de 19/10/2026").
- `alt` e legendas foram escritos para o que cada recorte mostra hoje; ao trocar a foto, reescrever os dois. Origem, recorte e a tabela de fotos pendentes: `assets-src/loja-fisica/README.md` e `docs/loja-fisica.md`.

### Evidência e limites

- Cobertura automática: `physicalStorePage.test.ts` (conteúdo, âncoras, ordem das seções, proporção das fotos, CSS das faixas, tracking e carregamento tardio), `categoryCarousel*.test.tsx` (montagem, teclado, pausa, movimento reduzido, foto quebrada, arrasto e falha), `lojaCountUp.test.ts`, `lojaMainEnhancements.test.ts` e `theme.tokens.test.ts` (CSS sem cor literal).
- Não consta aqui captura de tela do redesenho. Antes de publicar, rodar `scripts/qa-loja-fisica.cjs` (Playwright, porta 4179) em 375, 768 e 1280 px e conferir: sem rolagem horizontal; carrossel girando e parando com hover, foco e pausa; setas, teclado e arrasto; sem autoplay com movimento reduzido; página sem JavaScript com a primeira foto de cada categoria, as listas, as faixas e os valores finais das avaliações; `dataLayer` com os mesmos `store_phone_click`, `store_directions_click` e `whatsapp_click` de antes e nenhum evento vindo dos controles do carrossel. Registrar o resultado neste arquivo.
- Lighthouse mobile do redesenho não foi medido. O de 11/10 (nota 85, LCP 2,42 s, CLS 0,002) é a referência para comparar: o LCP do hero, o CLS e o JavaScript inicial não devem piorar.
- Contraste, auditoria completa de acessibilidade e as pendências do dono (fotos, lista de plantas, frase final, história, fonte da nota) continuam abertos.

## Fotos próprias de 19/10/2026

- Treze fotos de celular do dono: vasos de cerâmica, saquinho de adubo NPK, sacos de substrato, terra ensacada, o pátio do garden center com o Ficus lyrata, a pacová em vaso preto e o letreiro no muro verde.
- Primeira versão: recortes fechados de detalhes dessas fotos para preencher 28 lugares. O dono reprovou: zoom forte, a mesma foto virando várias e a placa repetida três vezes. Na revisão, cada foto entra quase inteira (só o corte mínimo para a proporção) e os lugares sem foto própria do assunto usam Pexels. Plantas: só a pacová e o Ficus lyrata são da loja; as outras são espécies da lista "Aqui você encontra" (costela-de-adão, zamioculca, lírio-da-paz) e, na faixa, calatéia e antúrio.
- Avaliações usam a mesma fachada das outras landing pages (`src/assets/fachada.jpg`), como pediu o dono. A placa aparece uma vez, em Nossa História.
- A etiqueta do saquinho de adubo teve a linha do preço coberta com a cor da etiqueta, porque a página não mostra preço. Os riscos vermelhos das fotos de celular ficam de fora pelo alinhamento do corte.
- Legendas da faixa Vasos começam pelo material da foto: duas de cerâmica da loja, barro, cerâmica rasa e polietileno preto.
- O carrossel de terras se chama "Terras e substratos", porque as fotos mostram sacos de 30 L e pacotes menores. O texto da categoria ("Substrato em saco de 40 L") não mudou.
