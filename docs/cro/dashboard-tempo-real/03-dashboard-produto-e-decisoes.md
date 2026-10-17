# 03 — Dashboard: produto, métricas, telas e decisões

> **Planejamento para implementação futura.** Documento elaborado em 12/10/2026, no fuso `America/Sao_Paulo`. Não cria componentes, endpoints, infraestrutura, usuários ou dados de produção. A coleta própria será a fonte deste dashboard; GA4 não é necessário. Leia este documento junto dos contratos de eventos e do plano de arquitetura/deploy desta mesma pasta.

Projeto: [Zoriek1/LandingPage — Plante Uma Flor](https://github.com/Zoriek1/LandingPage). Referência do código auditado: `2b2a937846e09e6603733fe7b725882503685d58`. Todas as telas abaixo são propostas de produto, não telas existentes.

## 1. Objetivo do produto

O painel deve permitir que uma pessoa responsável pelo marketing entenda o uso das landings e escolha o próximo teste com base em comportamentos observados. A prioridade é **uso e engajamento**; ações de contato e leads são a segunda prioridade. A interface precisa responder a perguntas concretas:

1. Quais páginas estão sendo usadas agora e quais ações aconteceram recentemente?
2. Até onde as sessões avançam, quanto tempo ativo acumulam e o que exploram?
3. Quais produtos, filtros e faixas de preço despertam interesse?
4. Quais campanhas e variantes trazem sessões que exploram a página e acionam um contato?
5. Em qual etapa há uma diferença que justifique investigar ou experimentar uma mudança?

O dashboard deve ser simples o suficiente para uma revisão diária sem recorrer a menus de uma plataforma de analytics. O sistema terá definições próprias de sessão, engajamento e atribuição documentadas e visíveis na interface quando necessárias. O painel mostrará dados recebidos e persistidos; não apresentará uma estimativa do tráfego total do site como uma medição exata.

### 1.1. Quem usa e para quê

| Perfil inicial | Trabalho que precisa realizar | Informação necessária |
| --- | --- | --- |
| Responsável pelo marketing | Revisar campanhas e escolher um teste para a próxima rodada | Comparação de páginas/campanhas, volumes e taxas com denominador |
| Responsável pela landing | Encontrar seções ou escolhas que merecem investigação | Exposição, exploração, scroll, tempo ativo e sequência observada |
| Responsável pelo atendimento | Entender a origem de cliques e, futuramente, contatos confirmados | Contexto de CTA e estados provenientes do Gestor |
| Administrador autorizado | Verificar se o painel está atualizando e se a coleta está funcionando | Última atualização, atraso, cobertura e diagnóstico restrito |

Na fase A, um administrador atende esses papéis. Perfis separados, convites e permissões por equipe entram apenas quando houver necessidade confirmada. Mesmo com um único administrador, a API deve verificar a autorização em toda consulta, conexão ao vivo e exportação.

### 1.2. Como saber se o produto está cumprindo seu objetivo

Os critérios iniciais são verificáveis sem prometer aumento de conversão:

- Em até dois minutos, um administrador consegue identificar a página com mais sessões no período, sua taxa de ação de contato e a limitação de amostra.
- Uma jornada de teste conhecida aparece com a página, campanha e ações corretas, sem duplicação por reenvio.
- Sessões ativas expiram quando deixam de emitir presença; o painel informa sua definição.
- Em até cinco minutos, o administrador consegue formular uma hipótese e um próximo teste usando dados de uma das telas da fase B.
- Cliques, eventos registrados e resultados de atendimento aparecem com nomes diferentes e fontes explícitas.
- Falha de atualização produz um aviso visível, preservando o último dado válido com seu horário.

Esses tempos são metas de usabilidade propostas. Devem ser validados com o usuário na implementação, sem converter navegação rápida em indicador de eficácia de marketing.

## 2. Escopo e fases

| Fase | Produto entregue | Uso previsto | Estimativa de esforço acumulado |
| --- | --- | --- | --- |
| A — Primeira versão utilizável | Uma tela **Agora e resumo**, com dados reais, autenticação, filtros básicos e atualização ao vivo | Acompanhar atividade e ter um resumo confiável de páginas, campanhas e CTAs | 2–3 dias úteis |
| B — Comportamento completo | Cinco telas, exposição/seleções, jornadas, funis e comparação de períodos | Escolher melhorias de conteúdo, oferta e navegação | 5–7 dias úteis |
| C — Operação ampliada | Exportação controlada, diagnóstico e ajustes de capacidade | Operar com histórico e tráfego medidos | 7–12 dias úteis |
| D — Integrações opcionais | Gestor, custos de mídia, receita e replay/heatmaps | Ver resultados confirmados e métricas financeiras | Estimativa separada |

As estimativas representam trabalho de desenvolvimento e validação com infraestrutura, contratos e acessos disponíveis. Não são garantia de entrega em prazo corrido. O esforço da fase A já inclui proteção de acesso, consentimento, persistência, tolerância a falhas e verificação do deploy. A fase C amplia esses requisitos; não os adia.

O avanço de fase exige qualidade dos dados anteriores. Criar mais gráficos antes de validar sessões, exposição, identificação de ações e deduplicação aumenta o risco de interpretar ruído como comportamento.

### 2.1. Dentro e fora da primeira entrega

| Incluído na fase A | Incluído a partir da fase B | Depende da fase D |
| --- | --- | --- |
| Sessões online estimadas, feed e páginas atuais | Exposição de seção, produto e CTA | Conversa recebida/qualificada pelo atendimento |
| Visitas por página/entrada/variante | Filtros, vitrine expandida, FAQ e carrossel manual | Pedido, pagamento e receita confirmados |
| Origem por UTM permitida | Escolha, abertura e cancelamento de faixa de preço | Gastos, CPL, CPA e ROAS |
| Scroll e tempo ativo estimado | Jornadas e funis ordenados | Replay, heatmaps e amostragem de gravações |
| WhatsApp, catálogo, telefone e rotas | Comparação de campanhas/produtos por exposição | Identificação/correlação com sistemas externos |
| Filtros por período e página | Filtros avançados e comparações | Orquestração de experimentos formais |

Não há compra, receita ou qualificação produzida no frontend auditado. Não devem aparecer cards com zero, gráfico vazio ou rótulo “conversão de venda” que insinuem que essas informações já são coletadas. Durante as fases A/B, o máximo confirmado pelo dashboard é o evento persistido de uma ação no site. Uma resposta HTTP do fluxo existente de leads não prova recebimento de mensagem ou conclusão de pedido.

## 3. Fundamentos da experiência

### 3.1. Linguagem da interface

Usar português brasileiro, nomes concretos e unidades visíveis. Evitar uma interface que exige conhecimento de analytics para interpretar os números.

| Termo apresentado | Significado e cuidado |
| --- | --- |
| **Sessões online** | Sessões/abas com presença recente observada; não pessoas únicas |
| **Sessões observadas** | Sessões com coleta autorizada e eventos aceitos no recorte |
| **Visitas à página** | Entradas e navegações contabilizadas por instância de página |
| **Tempo ativo estimado** | Tempo com página visível e interação recente; não duração do atendimento |
| **Ações de contato** | Cliques em WhatsApp, telefone ou rotas; manter cada tipo separado |
| **Cliques no catálogo** | Navegação ao destino de catálogo; não compra |
| **Origem não informada** | Ausência de origem utilizável; não afirmar que é tráfego direto com certeza |
| **Amostra pequena** | Volume insuficiente para priorização confiante; os valores continuam descritivos |
| **Dados parciais** | Período incompleto ou cobertura/entrega com limitações conhecidas |
| **Conversa confirmada** | Resultado recebido de uma fonte de atendimento integrada e identificada, somente na fase D |

Tooltips e um pequeno glossário trazem fórmula, denominador, janela e fonte. A tela principal não exibe payload, nome de tabela, status do container ou outro detalhe técnico que não ajude uma decisão de marketing. Diagnóstico técnico permanece em uma área administrativa própria.

### 3.2. Política de honestidade dos dados

- Sem coleta no período: mostrar “Ainda não há dados neste período”, sem preencher números de demonstração.
- Sem denominador: mostrar “—” e explicar “Sem sessões elegíveis”; nunca exibir `0%` como substituto.
- Denominador positivo e nenhuma ação: `0 de N` e `0%` são corretos.
- Evento ainda não instrumentado: informar “Disponível após instrumentação”; não transformar ausência de medição em ausência de comportamento.
- Dado não autorizado ao administrador: não consultar nem retornar essa informação; a interface respeita a mesma autorização.
- Dados de teste: ambiente ou marcador próprios, excluídos dos totais de produção por padrão.
- Modo de demonstração, se criado futuramente: conjunto totalmente separado, banner permanente e nenhuma mistura com produção. Não faz parte do caminho crítico.
- Indicadores de presença e tempo ativo levam a palavra “estimado” nas explicações, com regras públicas.
- Sessões de múltiplas abas e dispositivos não devem ser descritas como indivíduos únicos.
- Um gráfico sem mudança recente não comprova que ninguém está no site. Falhas de rede, consentimento e bloqueio de scripts continuam limitando a observação.

## 4. Definições de métricas

Os nomes, fórmulas e regras abaixo devem ser tratados como um contrato de produto. Os detalhes de eventos e armazenamento pertencem ao contrato técnico. Mudanças futuras de regra precisam ser versionadas; comparações devem informar quando há uma quebra de definição.

### 4.1. Unidade de análise e relógios

| Unidade | Definição proposta | Consequência para o painel |
| --- | --- | --- |
| Evento | Ação autorizada recebida e persistida, identificada uma vez | Reenvio não acrescenta uma segunda ação |
| Instância de página | Uma entrada/navegação com `pageview_id` próprio | Reload cria nova visita; rerender não cria outra |
| Sessão por aba | Sequência de ações em uma aba; reinicia após 30 min sem atividade elegível | Outra aba pode representar outra sessão; não somar como pessoas únicas |
| Contexto sessão-página | Sessão que teve ao menos uma instância de determinada página | Base de taxas por página, evitando inflar por reloads |
| Presença | Sinal recente enquanto a página está visível | A tela Agora mostra estimativa atual, mesmo quando o período histórico muda |
| Interação recente | Ação elegível do usuário ou navegação; proposta de limiar de 30 s para tempo ativo | Heartbeat sozinho não mantém engajamento ou evita timeout da sessão |

Parâmetros iniciais propostos: presença a cada 15 s enquanto visível, expiração após 60 s sem presença recebida e inatividade de sessão de 30 min. A presença exige uma medição de rede, e a perda de uma conexão pode deixar a sessão aparecendo por até o TTL definido. O servidor controla a expiração; não confiar apenas na remoção de uma linha no navegador.

Horários são armazenados/consultados em UTC; a interface apresenta **São Paulo (`America/Sao_Paulo`)**. A data de calendário deve ser convertida antes da consulta. Intervalos são `[início, fim)` para evitar duplicação nas fronteiras. “Agora” utiliza horário do servidor e horário de recebimento; eventos com relógio de navegador inválido são sinalizados e tratados pela regra do contrato, sem reordenar silenciosamente uma jornada como se fossem precisos.

### 4.2. Catálogo principal de indicadores

| Indicador | Fórmula/unidade | Denominador e recorte | Limite de interpretação |
| --- | --- | --- | --- |
| Sessões online | Distintos `session_id` com presença válida recebida nos últimos 60 s | Snapshot atual, página/campanha permitidas | Aproxima abas/sessões observadas, não visitantes únicos |
| Visitas à página | Instâncias de página distintas | Eventos de visita no intervalo | Reload e retorno são novas visitas |
| Sessões observadas | Sessões distintas com evento de atividade elegível de navegação/interação no intervalo, excluindo heartbeat | Filtros escolhidos | Uma sessão pode aparecer em duas janelas; contagens diárias não são aditivas |
| Sessões iniciadas | Sessões cujo início pertence ao intervalo | Coorte de entrada | Não confundir com sessões que continuaram do dia anterior |
| Sessões com CTA | Sessões distintas que acionaram o CTA no intervalo | Mesmo conjunto de sessões observadas sob os filtros | Muitas ações em uma sessão contam uma vez nesta taxa |
| Taxa de ação da página, fase A | Sessões-página com ao menos um CTA ÷ sessões-página observadas | Visita e ação da mesma página | Mede ação após visita; não é CTR de um botão exposto |
| CTR de CTA, fase B | Contextos sessão-página-CTA com clique após exposição ÷ contextos sessão-página-CTA expostos | Mesmo `(session_id, path, cta_id)` e posição quando segmentada; exposição anterior ao clique | Depende de cobertura da exposição e regra de viewport |
| CTR de produto | Sessões-página-produto com `whatsapp_click` vinculado após exposição ÷ sessões-página-produto expostas | Contexto distinto `(session_id, path, product_id)` sob os mesmos filtros; exposição anterior à ação | No fluxo atual, ação do produto é saída ao WhatsApp; não inferir exploração distinta |
| Alcance de scroll | Instâncias elegíveis que chegaram ao marco ÷ instâncias com medição de scroll válida | Página/variante e 25%, 50%, 75%, 90% | Página curta e conteúdo expandido alteram interpretação |
| Tempo ativo mediano | Mediana dos intervalos ativos consolidados por sessão-página | Apenas contextos mensuráveis, com tamanho da amostra | Não calcular média somando todas as sessões; não usar heartbeat oculto |
| Tempo ativo p75 | Percentil 75 dos mesmos totais | Mesmo conjunto da mediana | Complementa a distribuição, não substitui análise da jornada |
| Uso de filtro | Sessões-página que escolheram um filtro ÷ sessões-página com filtro exposto | IDs semânticos estáveis | Mudança automática de estado não é escolha manual |
| Escolha de faixa | Instâncias de abertura com faixa selecionada ÷ instâncias de abertura elegíveis | Mesmo `open_id`, com escolha posterior à abertura | Escolha pode abrir WhatsApp; não é aceitação comercial do preço |
| Cancelamento entre encerramentos do seletor | Instâncias encerradas sem escolha ÷ instâncias encerradas com escolha ou sem escolha | Distintos `open_id` encerrados; mostrar pendentes/sem final separadamente | Ausência de fechamento não demonstra cancelamento; o denominador difere da taxa de escolha |
| Exploração de FAQ | Sessões-página que abriram item ÷ sessões-página com FAQ exposta | ID de pergunta, abertura manual | Pode indicar interesse ou dúvida; não explica a causa |
| Continuação no funil | Sessões que completaram B após A ÷ sessões que chegaram a A | Mesma sessão/contexto, ordem válida | Queda não demonstra abandono definitivo ou intenção |
| Ações brutas de CTA | Eventos de clique distintos | Tipo, posição, produto/variante permitidos | Pode haver mais de um clique por sessão; mostrar junto à taxa de sessões |

Para exposições, a fase B propõe regra inicial de **pelo menos 50% da área do elemento visível por 1 s contínuo**, uma vez por ID semântico e `pageview_id`. Em seção ou elemento maior que a tela, exigir área visível de pelo menos **50% da menor área entre elemento e viewport**, por 1 s contínuo; metade da seção inteira poderia nunca caber na tela. Registrar a regra aplicável no contrato de coleta, com versões e testes; não afirmar comparabilidade entre elementos com regras diferentes. Exposição prova visibilidade suficiente, não leitura ou atenção.

O dashboard deve mostrar `12 de 180 sessões (6,7%)`, e não apenas `6,7%`. Separar arredondamento de cálculo; taxas derivam dos numeradores e denominadores reais. Mostrar até uma casa decimal para taxas no uso habitual. Diferença entre taxas usa **pontos percentuais**; diferença relativa pode aparecer no detalhe, com seu denominador.

No relatório de produto por página, usar o contexto sessão-página-produto. Um total de produto atravessando páginas requer recalcular sua população distinta e declarar se a unidade segue incluindo página ou passa a sessão-produto; não somar as linhas e chamar o resultado de sessões únicas. Na faixa de preço, o indicador principal usa instâncias de abertura. Um resumo opcional por sessão usa, separadamente, sessões que escolheram ÷ sessões que abriram; não dividir sessões por aberturas nem misturar esses denominadores no mesmo funil.

Cliques rápidos podem ocorrer antes de cumprir 1 s de exposição. Mostrar esses cliques como ações sem exposição confirmada, separadamente do numerador do CTR; não dividi-los pelo denominador de exposições confirmadas. Se existir futuramente uma exploração de produto distinta do CTA, ela precisa de evento e definição próprios antes de entrar em um card ou estágio do funil.

Uso de filtro e expansão com taxa por exposição exigem o `control_view` da fase B para o controle semântico correspondente, conforme o contrato de eventos. Exposição de uma seção inteira não é prova de que seu botão/filtro foi visto. Enquanto esse denominador não estiver instrumentado, apresentar contagem de ações ou taxa por visita com esse nome explícito; não chamar de taxa por controle exposto.

### 4.3. Sessão engajada como indicador opcional

O resumo pode apresentar “Sessões com exploração” com uma regra simples, própria e visível: ao menos uma ação de exploração registrada, como abrir FAQ, escolher filtro/faixa, explorar produto ou clicar em CTA. Na fase A, usar apenas os eventos já instrumentados e deixar explícito que a cobertura é inicial.

Não copiar um rótulo de GA4 supondo a mesma definição. Tempo ativo, scroll e ação devem aparecer separadamente até que a regra composta seja aprovada. Uma pontuação de engajamento que combina pesos arbitrários não é necessária para o MVP e pode esconder as causas do resultado.

### 4.4. Tempo ativo e scroll: casos que alteram a leitura

- O tempo é consolidado a partir de intervalos, limitado pela visibilidade e pela atividade recente. Uma aba aberta durante horas não gera horas de tempo ativo.
- A janela de atividade recente proposta é de 30 s. Cada incremento informado tem teto de 15 s, só acumula enquanto visível/ativo e segue a deduplicação do evento; a definição detalhada está no contrato de coleta.
- Períodos sem confirmação suficiente não são preenchidos por interpolação irrestrita. A interface informa a amostra mensurável quando há perda conhecida.
- Navegação para WhatsApp ou catálogo encerra a observação daquela página; não inferir duração no destino.
- Para o resumo por sessão-página, somar intervalos válidos das visitas à mesma página dentro da sessão, evitando sobreposição. Mediana é calculada depois dessa consolidação.
- Não somar medianas por página para obter uma “mediana do site”. O total requer recálculo sobre sua própria população.
- Scroll mede a profundidade da instância de página. Não somar eventos 25/50/75/90 como quatro visitas.
- Se toda a página cabe na tela, exposição inicial de 90% não é evidência de rolagem. Sinalizar páginas curtas e não comparar esse alcance diretamente a landings longas.
- Expansão da vitrine altera a altura da página. Preservar a regra registrada no contrato e apresentar alcance por seção como indicador complementar.
- Os valores conhecidos só têm validade após consentimento/coleta; não estimar retrospectivamente a parte anterior da navegação.

### 4.5. Origem de campanhas e variantes

O sistema deve preservar dois contextos:

1. **Origem de entrada da sessão**, congelada no início da sessão a partir dos parâmetros permitidos. Esse é o agrupamento principal de campanhas no painel.
2. **Contexto da ação**, derivado da URL atual autorizada e das regras de atribuição existentes. Serve para explicar um clique sem sobrescrever eventos passados.

Se novas UTMs aparecerem no meio da navegação, o detalhe pode mostrar a diferença. Não substituir toda a origem histórica da sessão pela última ação. As regras existentes de precedência e limpeza de UTMs precisam ser respeitadas ou migradas explicitamente. A ausência de UTM fica como “Origem não informada”; referrer saneado pode ser exibido separadamente. Não atribuir gasto, eficiência de criativo ou intenção ao identificador isolado de campanha.

Variantes são dimensões de exposição observada. Sem alocação controlada e contrato de experimento, o painel compara grupos de variantes descritivamente. Diferenças podem vir de origem, dispositivo, horário ou preço; não chamar a maior taxa de “vencedora” automática.

## 5. Períodos, filtros e comparação

### 5.1. Seletores básicos

Fase A:

- Período: **Hoje**, **Últimos 60 minutos**, **Últimos 7 dias** e intervalo de datas limitado ao histórico disponível.
- Página: todas ou uma entrada da lista de páginas autorizadas, com nome amigável e path.
- Separação visual entre **Agora**, que sempre usa a janela de presença atual, e **Resumo do período**.
- Filtro rápido ao clicar em uma página do ranking, preservando o período.

Fase B:

- Campanha/origem/meio UTM, variante, classe de dispositivo, produto, posição de CTA e tipo de ação.
- Comparação com período anterior equivalente; mesma definição de elegibilidade e instrumentação.
- Seleção por ID estável e nomes amigáveis do catálogo, sem consultas livres que retornem dados arbitrários.
- Mostrar chips dos filtros aplicados e ação “Limpar filtros”.

Não adicionar todos os filtros à primeira tela visível. Manter período e página sempre acessíveis; usar “Mais filtros” para os demais.

### 5.2. Semântica de intervalo

| Opção | Regra proposta | Exibição necessária |
| --- | --- | --- |
| Hoje | Da meia-noite em São Paulo até o snapshot atual | “Hoje até HH:mm” |
| Últimos 60 minutos | Janela móvel terminando no snapshot | Início, fim e indicação de janela móvel |
| Últimos 7 dias | Sete datas de calendário incluindo hoje, com hoje parcial | “Inclui hoje, ainda parcial” |
| Datas personalizadas | Início do primeiro dia até início do dia após a última data | Datas e fuso; período parcial quando inclui hoje |
| Comparação anterior | Janela anterior de mesma duração, preservando o tipo de período | Datas dos dois grupos e volumes |

Comparação “Hoje até 14h” precisa comparar com a janela anterior até o mesmo horário quando a escolha for equivalência de duração. Comparar um dia parcial com um dia inteiro exige um aviso. A janela atual pode receber eventos atrasados e mudar ligeiramente; mostrar o horário do snapshot e sua condição provisória.

Quando o denominador anterior é zero, não apresentar aumento infinito nem percentual de crescimento. Mostrar os dois valores e “Sem base anterior”. Quando uma taxa anterior é nula, a diferença em pontos percentuais é permitida se ambos os denominadores forem positivos.

### 5.3. Filtros na URL e privacidade

Persistir no endereço apenas filtros públicos e autorizados: IDs semânticos de página/produto/variante, enums e datas. Usar allowlist, limites de tamanho e normalização. Senhas, tokens de autenticação e `token_rastreio` não pertencem à querystring. Identificadores de jornada, payloads e informação pessoal não entram na URL compartilhável de navegação do painel. Consultas internas de drilldown utilizam referência permitida pelo contrato, sob autorização, sem transformá-la em um link público. Valores UTM não devem ser copiados indiscriminadamente para uma URL compartilhável; preferir referência opaca do catálogo ou manter filtros sensíveis apenas em memória.

A URL compartilhada é uma conveniência para administradores já autorizados; não concede acesso. Ao abrir o link sem sessão administrativa, mostrar login e reconstruir apenas filtros permitidos após autenticação. Não transmitir dados do último administrador ao próximo por cache persistente do browser. Ao sair, limpar estado/cache administrativo e encerrar conexão ao vivo.

## 6. Fase A: uma tela Agora e resumo

### 6.1. Hierarquia visual

Priorizar, nesta ordem: estado da atualização, presença atual, resumo do período, páginas/campanhas e ações recentes. A tela usa os tokens do projeto e a identidade Plante Uma Flor, com hierarquia de painel para leitura de números. Valores críticos devem ser compreensíveis sem depender de cor.

Wireframe textual, com placeholders sem números inventados:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Plante Uma Flor  • Marketing                       [Conta] [Sair]       │
│ Agora e resumo              Atualizado em <horário> • <estado>          │
│ [Período: Hoje ▾] [Página: Todas ▾]                [Limpar filtros]      │
├─────────────────────────────────────────────────────────────────────────┤
│ AGORA — presença observada na última janela                             │
│ [Sessões online: <valor>] [Páginas em uso: <valor>]                       │
│ Sessões por página                     Últimas ações persistidas       │
│ <página> | <presenças>                  <hora> <ação> <página>           │
│ <página> | <presenças>                  <hora> <ação> <página>           │
│ <limite da observação>                  [Pausar feed] [Ver recentes]     │
├─────────────────────────────────────────────────────────────────────────┤
│ RESUMO — <início> a <fim>, São Paulo                                    │
│ [Sessões] [Visitas] [Tempo ativo mediano] [Sessões com contato]           │
│ <cada card mostra unidade, amostra e ajuda de definição>                 │
│                                                                         │
│ Atividade por intervalo                Alcance de scroll                │
│ <gráfico com tabela alternativa>       <25% / 50% / 75% / 90% e base>    │
│                                                                         │
│ Páginas                               Campanhas de entrada              │
│ <visitas, sessões, contatos/taxa>      <origem, sessões, contatos/taxa>   │
│                                                                         │
│ Ações por tipo e posição                                                │
│ <WhatsApp / catálogo / telefone / rotas com volume e sessões>             │
├─────────────────────────────────────────────────────────────────────────┤
│ Coleta própria • <cobertura conhecida> • [Definições dos indicadores]     │
└─────────────────────────────────────────────────────────────────────────┘
```

O bloco “Agora” não apresenta uma presença histórica inexistente. Em um intervalo passado, ele continua identificado como presença atual ou pode ser recolhido. Os cards do resumo respeitam o período; o usuário não deve concluir que o número online é calculado sobre sete dias.

### 6.2. Cards e ações

| Elemento | Conteúdo | Interação proposta |
| --- | --- | --- |
| Sessões online | Estimativa, definição de presença e horário | Abrir lista paginada de sessões pseudônimas atuais |
| Páginas em uso | Páginas distintas da presença atual | Filtrar uma página no bloco Agora |
| Sessões no período | Contagem e condição de coleta | Abrir definição; fase B permite comparação |
| Visitas | Instâncias de página e relação com sessões | Abrir ranking por página |
| Tempo ativo mediano | Valor, população mensurável e unidade | Explicação da regra e distribuição inicial |
| Sessões com contato | Numerador/base, WhatsApp/telefone/rotas separados | Filtrar as ações de contato |
| Alcance de scroll | Marcos com base mensurável | Filtrar página; não somar taxas |
| Campanhas | Origem de entrada e volumes | Fase A: detalhe simples; fase B: filtro persistente |
| CTAs | Tipo, posição e sessão com ação | Explicar que o denominador de exposição só chega na fase B |

No ranking, ordenar inicialmente por sessões observadas. O usuário pode ordenar por volume ou taxa, mas uma taxa alta com uma sessão não recebe destaque de “melhor resultado”. Mostrar a base na mesma linha. Páginas sem tráfego ficam no catálogo apenas se o usuário escolher “Mostrar páginas sem dados”; não ocupar o resumo padrão.

### 6.3. Feed recente

O feed não precisa mostrar cada heartbeat, reenvio ou evento técnico. Priorizar navegação, ação de CTA e escolhas úteis. Cada linha traz horário, ação em português, página e contexto permitido. Um identificador curto de sessão pode ajudar o drilldown; ele é pseudônimo, não nome de visitante.

- Mostrar últimas ações **persistidas**, com cursor estável de paginação. Reenvio e atualização da tela não duplicam linhas.
- Inicialmente carregar uma quantidade limitada, proposta de 50 linhas. “Ver mais” consulta a próxima página, sem trazer todo o histórico ao navegador.
- Exibir recebimento de evento atrasado sem fingir que a ação ocorreu agora. A linha pode informar “Recebido agora; ocorrido às HH:mm”, se o relógio for válido.
- A atualização pode indicar “Há novas ações” se o administrador está lendo linhas antigas. Não deslocar a lista inesperadamente.
- “Pausar feed” interrompe a movimentação visual; não interrompe a ingestão do site nem significa que o histórico foi congelado.
- Manter a seleção e a posição de leitura durante atualizações. Evitar anúncios de acessibilidade a cada evento.
- Eventos de teste/bot excluídos segundo regra conhecida não se misturam à visão de marketing. Um filtro diagnóstico, restrito, pode inspecioná-los depois.

### 6.4. Mobile

Em celular, header compacto, período/página no topo, cards em uma ou duas colunas e blocos empilhados. Feed recente fica depois do resumo essencial; pode ser aberto pelo botão “Ações recentes”. Não apresentar uma tabela larga como única forma de consulta. Rankings têm linhas compactas e detalhes expansíveis, com tabelas horizontais apenas quando preservam a leitura.

Nenhuma ação exige hover. Os filtros abrem em painel/dialog acessível; aplicar filtros tem confirmação visual e mantém o contexto. Menus e modais usam os componentes existentes por composição, sem alterar primitivas do design system.

## 7. Fase B: cinco telas

Navegação desktop lateral ou superior, sem submenus profundos. No mobile, seletor de seção ou menu compacto. Cada tela preserva período e página, respeitando os filtros disponíveis para sua população. Títulos e texto de ajuda explicam quando uma métrica usa um denominador diferente.

### 7.1. Agora

**Pergunta:** o que está acontecendo neste momento?

| Bloco | Conteúdo | Próxima ação |
| --- | --- | --- |
| Presença | Sessões online e distribuição por página/dispositivo | Inspecionar uma sessão pseudônima |
| Ações recentes | Feed com navegação, produto/filtro/faixa/FAQ/CTA | Abrir a jornada elegível |
| Páginas em uso | Página atual e última presença | Ir à análise de página |
| Estado da atualização | Horário, atraso conhecido, conexão/recuperação | Atualizar ou abrir diagnóstico permitido |

```text
[Agora] [Engajamento] [Produtos e escolhas] [Páginas e campanhas] [Ações e leads]
[Página ▾] [Campanha ▾]                               <atualização>
[Sessões online] [Páginas em uso] [Última ação recebida]
<presença por página>                    <feed ao vivo pausável>
<sessões pseudônimas com página/recência; abrir jornada>
```

Contagem ao vivo é operacional, não base suficiente para alterar orçamento. O padrão de análise de campanha permanece uma janela histórica com amostra informada.

### 7.2. Engajamento

**Pergunta:** até onde as sessões avançam e o que exploram?

| Bloco | Conteúdo | Leitura útil |
| --- | --- | --- |
| Distribuição de tempo ativo | Mediana, p75, amostra e buckets | Identificar mudança de uso sem confundir abas abertas com engajamento |
| Alcance de scroll | Marcos por página e dispositivo | Investigar comprimento e sequência de conteúdo |
| Exposição de seções | Ordem semântica, exposição e ações posteriores | Ver se a informação é encontrada |
| Exploração | FAQ, expansão e carrossel manual | Investigar dúvidas e descoberta de produtos |
| Jornada por sessão | Sequência limitada de ações | Formular hipótese contextual |

```text
Engajamento       [Período] [Página] [Dispositivo] [Comparar período]
[Tempo ativo mediano • n] [p75 • n] [Sessões com exploração • base]
<distribuição de tempo>                     <scroll por marco>
Seção                   Expostas     Ações após exposição     Base
<hero / vitrine / FAQ / ...>
<perguntas abertas e ações de exploração>
[Ver jornadas elegíveis]
```

Se mais FAQ estiver associado a menos contato, isso não demonstra que a FAQ atrapalha. Pode indicar dúvidas não resolvidas ou seleção de sessões com necessidades diferentes. O painel precisa ajudar a investigar o item e seu contexto, sem sugerir remover a seção automaticamente.

### 7.3. Produtos e escolhas

**Pergunta:** quais produtos, filtros e faixas despertam interesse?

| Bloco | Conteúdo | Denominador |
| --- | --- | --- |
| Produtos | Exposições e CTA relacionado; exploração distinta apenas quando instrumentada | Sessões-página-produto expostas, distintas por sessão/path/produto |
| Filtros | Seleção manual, base de exposição e próximos produtos | Sessões com filtro exposto |
| Vitrine | Expansão manual e exploração posterior | Sessões com controle exposto |
| Faixas de preço | Abertura, escolha, encerramento sem escolha e CTA | Aberturas/sessões elegíveis do seletor |
| Variantes | Produto/ordem/oferta vistos e escolhas | Sessões expostas à variante válida |

```text
Produtos e escolhas      [Período] [Página] [Produto] [Variante]
Produto              Expostas    CTA após exposição/base    Cliques sem exposição
<produto e identificador estável>
<filtros escolhidos>                        <faixas escolhidas>
Seletor: [Abriram] -> [Escolheram] -> [Acionaram contato]
<encerrou sem escolha / ainda aberto / cobertura insuficiente>
```

Não usar uma lista de preços como campo numérico livre derivado de textos da página. Faixas e produtos têm IDs e nomes do catálogo. “Contato relacionado ao produto” exige vínculo explícito no evento; não inferir interesse em um produto porque ele estava na página. Se o usuário clicou em um CTA genérico, apresentar como genérico.

Um produto que quase não foi exposto deve ser classificado como “Pouca exposição”, preservando sua taxa observada. Um produto com alta exposição e pouca exploração merece um teste diferente. O painel ajuda a distinguir esses casos.

### 7.4. Páginas e campanhas

**Pergunta:** quais entradas e origens trazem uso consistente?

| Coluna | Conteúdo |
| --- | --- |
| Página/campanha | Nome amigável, path ou origem de entrada permitida |
| Sessões/visitas | Bases independentes, sem somar sessões entre páginas |
| Tempo ativo mediano | População mensurável |
| Alcance/ exploração | Regra e base explícitas |
| Sessões com ação de contato | Numerador, denominador e taxa |
| Comparação | Diferença, período de referência e amostra |
| Limitações | Coleta recente, período parcial, amostra pequena ou quebra de definição |

```text
Páginas e campanhas   [Período] [Comparação] [Origem] [Mais filtros]
[Agrupar: Página | Campanha | Variante]
Grupo             Sessões    Tempo mediano    Contatos/base    Diferença
<linhas ordenáveis com denominadores>
<evolução por dia/intervalo, sem média de taxas com bases diferentes>
[Abrir detalhe do grupo] -> <exposição / escolhas / ações no mesmo recorte>
```

Separar **campanha de entrada** de **contexto da ação** no detalhe. Manter desconhecidos como grupos próprios; não distribuir ausência de origem proporcionalmente às campanhas conhecidas. Se custos de anúncios não estiverem integrados, não exibir custo zero ou “campanha mais rentável”.

### 7.5. Ações e leads

**Pergunta:** onde ocorre a ação de contato e quais resultados são realmente confirmados?

| Estado | Fonte | Disponibilidade |
| --- | --- | --- |
| Clique WhatsApp | Evento de interação do coletor próprio | A/B |
| Clique catálogo | Evento de interação do coletor próprio | A/B |
| Clique telefone/rotas | Evento de interação do coletor próprio | A/B |
| Registro recebido pela API do dashboard | Confirmação de persistência própria | A/B, diagnóstico/contexto |
| Resultado técnico da API de leads existente | Contrato observado e confirmação própria do envio | Somente se houver instrumentação explícita e confiável |
| Conversa recebida | Evento confirmado de sistema de atendimento | D |
| Qualificação/motivo | Estado confirmado do Gestor | D |
| Pedido/pagamento/receita | Estado confirmado de origem comercial | D |

```text
Ações e leads      [Período] [Página] [Tipo de ação] [Posição]
[Sessões com WhatsApp/base] [Catálogo/base] [Telefone/base] [Rotas/base]
<ranking de CTAs por página/posição com exposição e taxa>
<funil observado: visita -> exposição -> escolha -> ação>
<jornadas que chegaram ou não ao próximo estágio>
<quando integrado: resultados confirmados, fonte e atualização separadas>
```

A palavra “lead” na navegação representa o objetivo secundário e sua evolução futura. Antes de integrar atendimento, o título do bloco é **Ações de contato**. A API de analytics não transforma um clique em conversa, nem uma conversa em venda.

Um `cta_click` cuja ação é abrir o seletor não é uma ação de contato. A abertura do seletor e o `whatsapp_click` posterior pertencem a estágios diferentes; não somá-los como dois contatos. O contrato normaliza o clique de catálogo como `catalog_click`, preservando o vínculo com o `site_click` legado. Telefone e rotas mantêm seus eventos específicos.

## 8. Jornadas e funis

### 8.1. Jornada pseudônima

Ao abrir uma sessão, apresentar uma linha do tempo limitada a eventos permitidos: entrada, variante, seção/produto exposto, escolha, FAQ e CTA. Exibir horários e lacunas, sem preencher a ausência de eventos com comportamento inferido. Uma lista de eventos não é uma gravação de tela.

- Nome curto “Sessão <identificador abreviado>”; não buscar identificação de pessoa.
- Origem de entrada, páginas, dispositivo em classe ampla e cobertura disponível.
- Ordenação baseada nos tempos válidos e recebimento/cursor como desempate. Eventos com relógio inconsistente têm indicação.
- Histórico paginado e limite de consulta. A URL compartilhável do painel não expõe token de atendimento ou identificador persistente sensível.
- Sem valores digitados, mensagens WhatsApp, telefone do visitante, coordenadas, HTML ou texto arbitrário do DOM.
- Estados externos, quando houver integração, aparecem com origem e horário separados.

### 8.2. Funis elegíveis

Propostas iniciais:

| Funil | Sequência | Unidade |
| --- | --- | --- |
| Geral da landing | Visita → exposição de CTA → clique | Sessão-página |
| Descoberta de produto | Exposição de produto → CTA WhatsApp vinculado; exploração é estágio opcional somente se houver ação distinta instrumentada | Sessão-página-produto sob os mesmos filtros |
| Seletor de faixa | Abertura → escolha → CTA correspondente | Instância de abertura; resumo por sessão é um relatório separado |
| Atendimento futuro | Clique → conversa confirmada → qualificação → pedido | Unidade de correlação definida com o Gestor |

Exigir ordem válida. Repetições de um estágio não contam como novas sessões no funil; ações anteriores à exposição não devem inflar “conversão após exposição”. Selecionar início de funil dentro do período e permitir conclusão conforme janela declarada; para os funis A/B, a proposta é completar na mesma sessão e dentro da janela de inatividade de 30 min. Exibir quando a coorte ainda está em observação e pode receber ações tardias.

Funis por visita e por sessão são diferentes. A interface deve manter uma unidade por relatório e permitir sua explicação. Um clique genérico não completa um estágio “produto específico”. Uma sessão que troca de página só completa o funil de página anterior se o evento preservar esse contexto explicitamente.

## 9. Decisões de marketing: da observação ao teste

O painel organiza evidências e pode indicar uma hipótese. Não comprova causas, não declara vencedor de teste sem desenho experimental e não modifica orçamento/oferta automaticamente.

| Observação | Hipótese a investigar | Próximo teste possível | Critério de sucesso | Guardrails |
| --- | --- | --- | --- | --- |
| Muitas sessões entram, poucas veem a vitrine | Conteúdo inicial ou ordem pode atrasar descoberta | Aproximar a vitrine do início em uma variante controlada | Mais sessões expostas à vitrine e exploração por exposição | Tempo de carregamento, ação de contato e comparabilidade da origem |
| Produto tem alta exposição e pouca ação relacionada | Foto, título ou apresentação podem não esclarecer o valor | Testar uma apresentação alternativa mantendo público e posição | Maior taxa de ação relacionada por exposição com base suficiente | Disponibilidade, qualidade do contato e mudança de preço |
| Produto é pouco exposto, mas quem vê aciona o contato | Ordem ou filtro pode limitar descoberta | Testar posição/ordem para um público comparável | Mais exposição mantendo taxa e qualidade de ação | Não degradar outros produtos prioritários |
| Muitas aberturas do seletor, poucas escolhas | Faixas, texto ou navegação podem gerar dúvida | Clarificar faixas e processo de escolha | Maior escolha por abertura | Não aumentar cliques acidentais ou prometer oferta indisponível |
| FAQ de entrega é muito aberta e pouco seguida por CTA | Entrega pode ser uma dúvida relevante | Testar resumo de entrega próximo da oferta | Menos fricção observada e mais ação após exposição | Frete real, área de atendimento e resultados confirmados futuros |
| Sticky CTA concentra cliques e CTA da vitrine não | A posição pode facilitar ação ou concorrer com exploração | Testar hierarquia mantendo acesso ao contato | Melhor taxa de ação total por sessão-página | Scroll, exploração e ausência de cliques involuntários |
| Campanha traz visitas, mas baixo tempo/exploração | Promessa do anúncio pode divergir da página | Alinhar mensagem de anúncio e primeira seção | Mais exploração em público comparável | Mesma janela/origem/dispositivo e resultado de atendimento |
| Mobile tem pouca escolha em um componente | Uso ou apresentação pode dificultar interação | Testar layout/tamanho/ordem no mobile | Maior uso por exposição no mobile | Performance, acessibilidade e redução de erro de toque |
| Muitas rotas/telefone na página da loja | Visitantes podem buscar informação presencial | Testar clareza de endereço/horário | Informação encontrada e ações coerentes | Não inferir presença física ou chamada atendida |
| CTA sobe, mas pedidos confirmados caem, fase D | Qualidade do contato ou operação pode ter mudado | Investigar atendimento e manter contexto da campanha | Melhor resultado confirmado na mesma janela | Não atribuir queda exclusivamente ao site |

### 9.1. Volume mínimo e interpretação

Proposta inicial de sinalização para comparar taxas: **menos de 100 unidades elegíveis ou menos de 10 ações no recorte** recebe “Amostra pequena”. Mostrar sempre as contagens, inclusive abaixo desse limiar. Esse número é uma heurística de leitura, não cálculo de poder estatístico, comprovação causal ou promessa de significância. Métricas de zero ação também têm utilidade descritiva; não ocultá-las porque não chegaram a dez ações.

Para um experimento formal, definir hipótese, unidade de alocação, métrica primária, menor efeito relevante, horizonte, cálculo de amostra e regras de parada antes de iniciar. O volume necessário pode ser muito maior. Não encerrar um teste porque o feed ao vivo mostrou alguns cliques seguidos.

Em rankings, a informação sobre amostra aparece na linha. Por padrão, não usar cores “bom/ruim” para taxas sem um objetivo acordado. Mostre comparação e base; destaque mudanças relevantes somente com contexto e sem afirmar explicação automática.

### 9.2. Registro de decisão

Como fluxo futuro simples, o administrador pode usar um template documental:

```text
Pergunta:
Página/campanha e período:
Observação, numerador e denominador:
Limitações de coleta/amostra:
Hipótese:
Mudança proposta:
Métrica primária e guardrails:
Critério e janela de avaliação:
Resultado observado e próxima decisão:
```

Na primeira entrega, esse registro pode ser manual nos documentos CRO existentes. Uma ferramenta de gerenciamento de experimentos não é necessária para entregar o dashboard.

## 10. Estados da interface

| Estado | Comportamento esperado | Texto sugerido |
| --- | --- | --- |
| Carregamento inicial | Skeleton de estrutura e `aria-busy`, sem números falsos | “Carregando dados do período” |
| Sem dados | Explicar período/filtros e possibilidade de coleta recente | “Ainda não há dados neste recorte” |
| Sem coleta instalada | Informação do estado conhecido, sem gráfico fictício | “A coleta ainda não está disponível” |
| Filtro sem resultado | Preservar filtros e oferecer limpeza | “Nenhum dado corresponde a estes filtros” |
| Erro de consulta | Preservar último snapshot válido com horário | “Não foi possível atualizar. Último dado de HH:mm” |
| Conexão ao vivo interrompida | Reconectar ou usar fallback; informar estado | “Atualização ao vivo interrompida; tentando reconectar” |
| Polling ativo | Informar atualização periódica sem fingir stream | “Atualização periódica ativa” |
| Dados desatualizados | Mostrar idade; evitar aparência de dado atual | “Sem atualização há <tempo>” |
| Consentimento/cobertura limitada | Exibir condição conhecida sem estimar recusas invisíveis | “Mostramos sessões com coleta autorizada; o total do site pode ser maior” |
| Período parcial | Identificar hoje/janela em andamento | “Período ainda em andamento” |
| Amostra pequena | Exibir valores e limite de interpretação | “Amostra pequena: compare com cautela” |
| Sessão administrativa expirada | Suspender consultas/stream e esconder dados até novo acesso | “Entre novamente para continuar” |
| Acesso negado | Sem payload nem detalhes sensíveis | “Sua conta não tem acesso a estes dados” |
| Instrumentação incompleta | Indicar qual indicador ainda não é mensurável | “Este comportamento ainda não é medido nesta página” |
| Relógio/atraso inconsistente | Marcar detalhe afetado e regra usada | “Horário da ação com precisão limitada” |

O estado “sem dados” não deve ter prioridade sobre um erro real de API. Uma consulta que falhou não pode virar `[]` silenciosamente e aparentar ausência de tráfego. A interface nunca remove o aviso de atraso apenas porque a conexão SSE voltou: precisa receber um snapshot válido.

## 11. Consulta, atualização e arquitetura do frontend

Esta seção pertence ao planejamento técnico do produto; nomes de endpoints e formatos não devem aparecer nos fluxos normais de marketing.

### 11.1. Entrada dedicada

Planejar uma entrada HTML/Vite própria em `/admin/marketing/`, usando React e TypeScript e mantendo chunks administrativos separados das landings. A configuração atual já é multi-entry; é preciso verificar o build, prerender e `.htaccess` na implementação para preservar a entrada e suas rotas internas.

- O HTML administrativo não inclui Meta Pixel, GTM, Google tag nem coleta de visitas de marketing.
- A aplicação administrativa não importa um módulo de tracking cujo import já captura atribuição/storage ou gera PageView.
- Reutilizar componentes, tokens e helpers puros após verificar efeitos colaterais; reutilização de toda a árvore `App/main` não é necessária.
- HTML/JS da interface podem ser públicos como artefatos estáticos. Todos os dados exigem autenticação/autorização no servidor; esconder rota/link não constitui proteção.
- Login não adiciona segredo ao bundle nem usa chave privada em variável Vite pública.
- A URL pública proposta deve ser confirmada com a hospedagem. Publicar a shell não implica publicar dados administrativos.

Na auditoria, o `index.html` principal carrega Pixel/GTM e a entrada principal já dispara rastreamento de visita. Fazer o painel apenas como rota no mesmo HTML traria trackers à área administrativa e poderia contaminar a coleta. [Evidência no código auditado: HTML](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/index.html), [entrada principal](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/src/main.tsx), [configuração de build](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/vite.config.ts).

### 11.2. Reutilização e dependências atuais

No `package.json` auditado há React `^18.3.1`, Vite `^8.2.2`, React Router `^7.18.2`, TanStack Query `^5.83.0`, Recharts `^2.15.4`, Tailwind `^3.4.17` e componentes shadcn/Radix. Esses são intervalos declarados; confirmar versões resolvidas e compatibilidade no início da implementação. O texto geral de `AGENTS.md` ainda menciona Vite 5/Router 6, mas a configuração/dependências atuais prevalecem para o planejamento.

Recharts está disponível e há uma primitiva `src/components/ui/chart.tsx`. A proposta do MVP é reutilizar a versão travada existente e verificar compatibilidade, integridade e manutenção no início da implementação. O lockfile registra aviso de que os ramos 1/2 de Recharts não recebem manutenção ativa; uma migração de major tem impacto próprio e fica para decisão posterior fundamentada, sem entrar automaticamente no escopo do painel. [Guia oficial de migração Recharts 3](https://github.com/recharts/recharts/wiki/3.0-migration-guide).

Usar os tokens de `src/styles/tokens.generated.css`, sem cores literais novas e sem editar esse arquivo gerado. Compor primitivas existentes, sem reescrever `components/ui/`. Escolher fontes e densidade adequadas à leitura de números dentro do design system. Uma fonte de títulos da marca não precisa ser usada para todas as células e valores.

### 11.3. Endpoints e responsabilidades propostas

| Endpoint | Responsabilidade no produto | Requisito |
| --- | --- | --- |
| `GET /admin/overview` | Snapshot consistente de cards, rankings, presença e séries do recorte autorizado | Autenticação; validação de filtros; limites de período/custo; `as_of` |
| `GET /admin/events` | Feed/histórico permitido e jornada paginada | Autenticação; cursor opaco; campos autorizados; limite por página |
| `GET /admin/stream` | Sinalizar que existem dados mais novos | Autenticação; recuperação; evento de controle sem dados privados desnecessários |
| Endpoints de detalhe, fase B | Agregados de exposição, escolhas e funis | Contrato próprio quando necessário; não transformar overview em resposta ilimitada |
| Exportação, fase C | Criar/obter relatório autorizado | Mesmos filtros e permissões; limites e auditoria |

Resposta de snapshot deve fornecer, conceitualmente, versão de definição, `as_of`, recorte efetivo, fuso de exibição, bases, avisos de qualidade e dados. Essa é uma proposta de requisitos, não schema final. Consultas que excedam limites retornam erro controlado e orientação; não executam full scan arbitrário porque o browser enviou outro parâmetro.

### 11.4. SSE como sinal, snapshot como fonte da tela

1. Consultar snapshot autorizado ao abrir ou aplicar filtros.
2. Abrir stream autenticado após validar a sessão administrativa.
3. A mensagem ao vivo sinaliza mudança com marcador/revisão; agrupar sinais próximos.
4. Refazer consultas relevantes com coalescência e limites, em vez de atualizar contadores permanentemente a partir de deltas crus.
5. Ao reconectar, buscar um snapshot novo; recuperar o feed por cursor conforme contrato.
6. Ao perder o stream, fallback de polling, proposta inicial a cada 5 s enquanto a tela estiver visível.
7. Pausar trabalho redundante em aba administrativa oculta e atualizar ao voltar.

A confirmação visual depende de consulta bem-sucedida, não apenas de um socket aberto. Uma conexão perdida não duplica eventos nem perde o histórico persistido. Uma mensagem de atualização não deve conter todo o payload bruto ou dados de outro escopo de autorização.

SSE permite comunicação servidor→cliente e reconexão nativa do `EventSource`; a recuperação de dados e a autenticação continuam sendo responsabilidades da aplicação. O mecanismo final de cookie/sessão, CORS e domínio deve ser validado com o desenho de hospedagem. [MDN: uso de Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).

Meta de experiência inicial: dados aparecem em **2–5 s em condições normais**, medidos da persistência no backend até o snapshot renderizado. Medir separadamente o percurso completo desde a ação do navegador, incluindo lote, transporte e persistência. Uma média baixa não oculta picos: registrar percentis e condição de rede. Ao usar polling ou ocorrer backlog, apresentar o atraso real. Essa é meta a validar, não SLA já garantido.

### 11.5. Consistência e cache

- Agrupar respostas sob um snapshot/revisão sempre que necessário para que cards e tabelas não pareçam contraditórios.
- Ao trocar filtro, cancelar/ignorar resultado antigo que chega depois da resposta do filtro novo.
- Cache é segregado por usuário/escopo e chave de filtros normalizados. Limpar na saída ou expiração.
- Respostas administrativas não entram em cache público/CDN; a configuração da API deve refletir isso.
- Presença usa janela atual independente dos agregados históricos; a API retorna seus relógios e bases separadamente.
- Feed pode ser mais recente que um agregado; mostrar seus horários e sincronizar em próxima atualização. Não “corrigir” dados inventando um delta no browser.
- Consultas são paginadas; séries usam granularidade adequada à janela, com limites de pontos.

## 12. Segurança, saneamento e acesso na interface

Dados de evento são entrada não confiável, mesmo quando originados pelo próprio coletor. A API valida e restringe propriedades; o painel renderiza texto escapado e IDs do catálogo.

- Sem `dangerouslySetInnerHTML`, HTML arbitrário do evento, URL executável ou imagens remotas derivadas de payload sem autorização.
- Links para páginas usam domínio/path autorizados. Não renderizar `javascript:`, `data:` ou destino recebido livremente de um evento.
- Não exibir mensagem de WhatsApp, telefone do visitante, coordenadas, conteúdo de formulário, referrer/querystring completos ou token de rastreio em tabelas.
- UTMs podem conter texto sensível inserido indevidamente; saneamento, truncamento e restrições valem para elas também.
- Dados sensíveis não aparecem em logs do browser, notificações, atributos HTML ou mensagens de erro.
- Sessão expirada encerra stream, suspende consulta e exige novo login. Uma tela previamente renderizada não continua revelando dados ao próximo usuário do dispositivo.
- A API aplica limites e autorização em cada rota. Route guard React tem função de experiência, não de controle de dados.
- Área técnica de diagnóstico mantém acesso restrito e resultados saneados.
- A auditoria de acesso/exportação deve registrar metadados necessários sem copiar todo o relatório.

Retenção, exportação, exclusão e bases/finalidades de coleta são definidos nos documentos de dados/privacidade. O produto não presume que hospedagem própria dispense consentimento ou avaliação de finalidade. A interface informa a limitação de cobertura conhecida sem inventar número de recusas quando essas sessões não são observáveis.

## 13. Exportação e compartilhamento

Fase A/B: compartilhar link com filtros permitidos ou registrar observações manualmente. Fase C: exportação do relatório visível, com os mesmos controles do servidor e sem payload bruto por padrão.

| Aspecto | Regra proposta |
| --- | --- |
| Formato inicial | CSV de agregados e tabelas permitidas; dicionário de colunas |
| Conteúdo | Período, fuso, definição/versionamento, filtros, numeradores/denominadores e `as_of` |
| Limite | Período, número de linhas e custo máximo; paginação/geração controlada quando necessário |
| Acesso | Administrador autorizado; download sem URL pública permanente |
| Dados pessoais/pseudônimos | Excluídos da exportação padrão; ampliação exige finalidade e permissão explícitas |
| Segurança de planilha | Neutralizar conteúdo que possa ser interpretado como fórmula em células de texto |
| Auditoria | Quem solicitou, horário, escopo e resultado, sem duplicar os dados no log |
| Consistência | Arquivo reflete snapshot definido, não páginas consultadas em horários distintos sem identificação |

Exportar não altera o consentimento de coleta nem autoriza redistribuição externa. Relatório agregado continua sujeito às políticas de acesso e retenção definidas pelo projeto.

## 14. Acessibilidade e responsividade

Usar WCAG 2.2 AA como referência de implementação, sem declarar certificação automática. [Referência oficial WCAG 2.2](https://www.w3.org/TR/WCAG22/).

- Navegação por teclado em filtros, tabelas, menus, dialogs, paginação e login; foco visível e restaurado ao fechar um dialog.
- Nome acessível para cards, controles e ícones; conteúdo compreensível fora de contexto.
- Gráficos com legenda, unidades e tabela/resumo textual equivalente. Não depender de hover ou cor para a informação principal.
- Contraste vem dos tokens apropriados; testar estados, conteúdo, foco e gráficos dentro do sistema de design.
- `aria-live` moderado para estados de conexão; não anunciar cada linha do feed e interromper a leitura.
- Usuário pode pausar movimentação do feed; respeitar preferência por movimento reduzido.
- Áreas de toque com tamanho adequado, zoom/reflow e telas estreitas; sem esconder denominadores essenciais no mobile.
- Tabelas têm cabeçalhos semânticos, ordenação anunciada e identificação do recorte.
- Loading, erro e vazio são identificáveis sem cor; foco não salta em cada atualização.
- Quando dados chegam, preservar posição de leitura e não reorganizar ranking continuamente enquanto o usuário está interagindo.

## 15. Performance e limitações de carregamento

O painel pode ser mais rico que uma landing, mas seu bundle não pode ser carregado pelas páginas de anúncio. O coletor tem orçamento próprio no plano técnico.

- Entrada dedicada e imports administrativos isolados; verificar bundle/prerender após adicionar a entrada.
- Carregar telas da fase B sob demanda, evitar carregar todos os gráficos/jornadas no primeiro acesso.
- Query de overview traz agregados limitados; não baixar eventos do mês para calcular métricas no cliente.
- Limitar linhas renderizadas e pontos por série; avaliar virtualização apenas se o tamanho observado justificar.
- Deduplicar consultas, coalescer sinais do stream e limitar atualização do feed/ordenação.
- Não deixar animações custosas concorrendo com a leitura das métricas.
- Reduzir consultas quando o painel fica oculto; restaurar com snapshot ao retornar.
- Comparar desempenho das landings com baseline anterior e confirmar que CTA não ganhou dependência da API de analytics.
- Metas de resposta dependem do volume, hardware e consulta escolhidos; registrar p95 e limites do inventário antes de fechar um objetivo operacional específico.

## 16. Aceite do produto por fase

### 16.1. Fase A

| Cenário | Resultado esperado |
| --- | --- |
| Navegar em home, LP prerenderizada, campanha com entry própria e loja física | Visitas corretas aparecem no resumo e feed sem depender do GA4 |
| Abrir outra aba e deixar uma aba oculta | Definição de sessão/presença continua explícita; tempo ativo não cresce oculto |
| Ficar sem interação e sair | Tempo ativo deixa de acumular; presença expira pela regra proposta |
| Clicar em WhatsApp várias vezes | Cada interação aceita entra uma vez; supressão de conversão existente não apaga ação do dashboard |
| Fazer reenvio e reconexão | IDs não duplicam; snapshot e feed recuperam histórico persistido |
| Aplicar período/página e trocar rapidamente o filtro | Dados exibidos pertencem ao último filtro aplicado |
| Consultar período sem dados e simular erro da API | Estados vazio e erro são diferentes; erro preserva horário do dado anterior |
| Abrir painel sem login | API/stream não entregam dados; shell leva ao acesso autorizado |
| Expirar sessão administrativa | Consultas/stream cessam e dados são retirados da visão até reautenticação |
| Recusar/revogar coleta no site | Nova coleta segue a política; painel não infere retrospectivamente ações perdidas |
| Abrir dashboard/admin | Pixel/GTM/PageView de marketing não são carregados/disparados |
| Usar celular/teclado | Filtros, feed, números e definições são utilizáveis |
| API indisponível na landing | CTA continua funcionando sem aguardar a nova analytics |

### 16.2. Fase B

- Jornada conhecida de exposição→filtro→produto→faixa→CTA produz numerador/denominador reproduzíveis.
- Taxa baseada em exposição não inclui contextos sem exposição válida; estágio posterior sem anterior não completa funil.
- FAQ, carrossel e filtros distinguem escolha manual de atualização automática de UI.
- Produto/CTA genérico não recebe vínculo artificial a outro produto.
- Comparação de período parcial mostra bases e janela correta; anterior zero não gera percentual infinito.
- Sessões em mais de uma página não são somadas como total único do site.
- Amostra pequena permanece visível e não recebe “vencedor” automático.
- Nenhuma tela apresenta venda/conversa como confirmada sem integração de origem.

### 16.3. Fase C

- Exportação respeita autorização, filtros, limites, snapshot e saneamento de planilha.
- Diagnóstico distingue atualização da tela, atraso de agregados e ingestão, sem expor dados indevidos.
- Consultas e feed mantêm comportamento sob o pico representativo acordado.
- Metas de latência são medidas e seus percentis documentados; o painel informa atraso real.
- Histórico e consultas respeitam retenção/exclusão aplicáveis e acesso administrativo.

### 16.4. Validação com o responsável pelo marketing

Uma sessão breve com dados de teste identificados deve executar três tarefas: entender o resumo, abrir uma página/campanha e propor um teste a partir de uma observação. Registrar pontos de confusão, termos e filtros que não ajudam. A validação deve revisar a experiência usando dados reais autorizados após a primeira publicação; não depende de fabricar tráfego de produção.

## 17. Dependências e decisões antes da implementação

| Tema | Decisão/pendência | Efeito no produto |
| --- | --- | --- |
| Domínio e arquitetura | Confirmar URL admin, domínio API, HTTPS e método de sessão | Login, CORS/credenciais, SSE e links |
| Recursos Hostinger | Inventariar VPS, runtime e capacidade | Limites de consulta/atualização e custo |
| CMP/consentimento | Verificar CookieHub/GTM real e categorias/finalidades | Cobertura de coleta e linguagem de aviso |
| Contrato de eventos | Confirmar nomes/IDs, exposição, clocks e regras de sessão | Todas as fórmulas e jornadas |
| Catálogo semântico | Mapear páginas, produtos, seções, CTAs e variantes | Labels estáveis, filtros e comparações |
| Volume e equipe | Tráfego médio/pico, administradores e retenção | Limites, paginação e permissões |
| Versões frontend | Validar Vite/Router/Recharts atuais e eventual migração | Reutilização, esforço e bundle |
| Origem/atribuição | Aprovar entrada de sessão vs contexto da ação | Campanhas comparáveis e histórico preservado |
| Integração de atendimento | Contrato e eventos confirmados por token | Conversa/qualificação/pedido na fase D |
| Custos/receita | Fonte, janela e regra de atribuição financeira | CPL/CPA/ROAS, fora A/B/C |
| Replay | Decisão separada, mascaramento e amostragem | Nenhuma gravação é necessária para eventos do MVP |

As pendências não impedem o planejamento. Impedem prometer latência, dimensionamento, cobertura, prazo corrido ou métricas externas como se já estivessem comprovados.

## 18. Fontes e distinção entre fato e proposta

Os fatos sobre o projeto provêm do código auditado e de seus documentos. Layout, regras de métrica, limites, parâmetros, fases e textos são propostas deste plano e precisam ser aprovados/versionados durante a implementação.

| Fonte | O que sustenta |
| --- | --- |
| [package.json do código auditado](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/package.json) | Dependências declaradas e comandos do projeto |
| [vite.config.ts](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/vite.config.ts) e [.htaccess](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/public/.htaccess) | Build multi-entry, prerender e publicação das entradas |
| [Tracking existente](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/src/lib/tracking.ts) | Eventos e distinções do fluxo atual |
| [Atribuição existente](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/src/lib/attribution.ts) | Regras de UTM e contexto existente |
| [Fluxo WhatsApp](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/src/lib/whatsappModal.ts) | Token/correlação e abertura atual; não prova resultado comercial |
| [SOP de medições](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/docs/cro/medicoes.md) e [atendimento](https://github.com/Zoriek1/LandingPage/blob/2b2a937846e09e6603733fe7b725882503685d58/docs/cro/atendimento.md) | Distinção de página/contato/lead/compra e contexto de decisões CRO |
| [Documentação Vite: builds multi-page](https://vite.dev/guide/build.html#multi-page-app) | Suporte e organização de entradas independentes, a validar na versão do repo |
| [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) | Fluxo unidirecional e comportamento de reconexão |
| [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) | Visibilidade para limitar presença/atividade; não prova atenção do usuário |
| [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/) | Referência de acessibilidade |
| [Recharts: migração para versão 3](https://github.com/recharts/recharts/wiki/3.0-migration-guide) | Avaliação de atualização da dependência existente |

**Limite deste documento:** define a experiência e as regras de leitura do dashboard independente do GA4. A implementação depende dos contratos de coleta, segurança/privacidade e operação dos demais documentos. Só os arquivos de planejamento integram esta entrega; nenhuma tela, coletor ou integração foi implementada por este documento.
