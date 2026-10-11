# Loja física — registro de design

Escopo: somente `/loja-fisica/`. Modo: Persuade. Registro da revisão final de 24/09/2026; decisões implementadas, sem substituir a identidade das demais páginas.

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
