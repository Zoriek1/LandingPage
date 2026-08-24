# Spec de implementação — redesign da `/lirios-apt`

Escopo: **só o slug `lirios-apt`**. Nenhuma outra LP e nem a home mudam.
Referência visual: `lirios-apt-proposta.html` (protótipo solto, não é código pra portar).
Tokens prontos: `lirios-apt-tokens.css`.

---

## 1. A tese

A página no ar lidera com preço. Preço é o argumento que qualquer floricultura de Goiânia copia numa tarde.

O que ninguém copia é a foto do arranjo pronto chegando no WhatsApp esperando o "pode ir". A página no ar já diz isso — **seis vezes**, espalhado em badge, seção de garantia, diferencial #02, passo #3 do como funciona e duas perguntas do FAQ. Repetir seis vezes é o oposto de destacar.

O redesign faz duas coisas: **mostra** a promessa uma vez, no hero, em vez de repeti-la; e devolve hierarquia ao resto.

---

## 2. Por que o escopo funciona sem tocar em componente compartilhado

- O tema `lily` é usado **só** por `lirios-apt` (confira na tabela de rotas do contexto canônico). Mudar os tokens do lily já é escopado.
- `theme.css` já tem precedente de escopo por slug: `.ad-lp-theme[data-slug="girassol"]`. Use o mesmo gancho.
- `--font-display` e `--font-body` são lidas pelo `@layer base` na posição do elemento, então redefini-las em `.ad-lp-theme[data-slug="lirios-apt"]` troca a tipografia só dentro dessa árvore.

Se algum componente precisar de markup diferente, adicione **variante por prop**, com o comportamento atual como default. Nunca mude o default.

---

## 3. Estrutura nova

Ordem das seções (sobrescreva `sectionOrder` na config do slug):

```
1. hero              (reformulado — ver §4)
2. faixa do dia      (novo, componente .ad-lp-daystrip)
3. vitrine           (reformulada — ver §5)
4. quatro tempos     (substitui "diferenciais" + "comofunciona", ver §6)
5. social            (prova, ver §7)
6. historia          (a loja, ver §8)
7. faq               (um só, 8 perguntas, ver §9)
8. final
```

**Seções que saem:** `diferenciais` e `comofunciona` viram uma coisa só (§6). `guarantee` como seção autônoma sai — a garantia passa a ser o bloco `.ad-lp-pledge` colado abaixo dos preços da vitrine (§5). `bonus` sai.

**Os dois FAQs viram um.** Hoje existem "Dúvidas sobre lírios" (3 perguntas) e "Perguntas frequentes" (9). Duas delas dizem a mesma coisa sobre a foto. Ver §9.

---

## 4. Hero

Layout assimétrico em duas colunas (empilha no mobile, texto primeiro):

- **Esquerda:** olho, h1, subheadline, CTA primário + botão secundário, três linhas de prova.
- **Direita:** foto do hero em 4/5, com o card de conversa (`.ad-lp-chat`) sobreposto, deslocado pra fora da grade.

### O card de conversa

É o elemento-assinatura. Três balões:

1. (loja) foto do arranjo pronto + "Ficou assim. Pode sair pra entrega?" · 14:07
2. (cliente, `--mine`) "Pode! Ficou lindo" · 14:08
3. (loja) "Perfeito. O cartão vai escrito à mão, como você mandou." · 14:08

Três regras não negociáveis:

- **Rótulo "Exemplo" visível** no cabeçalho do card. Sem ele o bloco passa por print real de conversa. `aria-label` não resolve: ninguém vê.
- **Foto diferente da usada no card em destaque da vitrine.** Use `arranjo-mao-lirios-g`. Repetir a mesma imagem desperdiça as duas.
- **Não anima balão por `useEffect` sem estado inicial visível.** No HTML pré-renderizado os três balões já existem e são visíveis.

### Headline

O anúncio promete "Lírios a partir de R$ 159,90", então **o message match tem que sobreviver**. A solução é o olho carregar a promessa exata do anúncio e o h1 carregar o diferencial:

Linhas de prova, abaixo dos CTAs (três linhas soltas, não caixas):

1. **Entrega hoje** em Goiânia, Aparecida e Senador Canedo
2. **Cartão escrito à mão** por conta da casa
3. **Frete de R$ 10 a R$ 30** conforme o bairro, dito antes de fechar

- Olho: `Lírios em Goiânia · a partir de R$ 159,90`
- H1: `Você vê a foto do seu buquê antes dele sair da loja.` (a palavra "antes" com o marcador rosa)
- Sub: `Lírios frescos do produtor, montados na hora aqui no Setor Sul. Você aprova pelo WhatsApp, a gente escreve o cartão à mão e entrega hoje.`

O preço aparece **uma vez**, no olho. Hoje aparece três vezes antes de qualquer prova.

Se depois vocês quiserem testar a headline rotativa por ocasião (`Lírios para um aniversário / um me perdoa / um obrigado / um bom dia / nenhum motivo`), o CSS está em `.ad-lp-rotator`. Altura travada, para com o hero fora da tela, morre em `prefers-reduced-motion`. **Não implemente na fase 1** — é teste posterior.

### CTAs

- Primário: `.ad-lp-cta`, "Falar no WhatsApp". Sólido em repouso. No hover a linha desliza 5px e uma seta entra. **Sem troca de fundo.**
- Secundário: `.ad-lp-fillbtn`, "Ver os 6 arranjos", âncora pra vitrine.
- Ambos passam pelos helpers existentes. Nada de `wa.me` direto.

---

## 5. Vitrine

### A grade — leia isto antes de escrever CSS

São 6 produtos: 1 em destaque grande, 1 par, 4 normais. Numa grade de **6 colunas** com destaque(3) + par(3) + quatro cards de span 2, a segunda linha comporta três cards e o sexto fica órfão com 4 colunas vazias ao lado.

Use **12 colunas**: destaque `span 6`, par `span 6`, os quatro restantes `span 3`. Duas linhas cheias.

Em 2 colunas (640–999px) todos ocupam 1. Abaixo de 640px, uma coluna.

### O card

A linha mais valiosa hoje é `P · ~35cm · Papel jornal artesanal`. Isso é ficha técnica, não é o que faz clicar. Nova ordem:

1. Foto
2. Nome
3. **Linha de intenção** (nova, ver tabela)
4. Preço grande com `tabular-nums` + parcelamento pequeno
5. Ficha técnica, fina, em cima de um fio tracejado
6. CTA

| Produto | Preço | Linha de intenção |
|---|---|---|
| Arranjo de Mão Lírios M (destaque, "Mais vendido") | R$ 229,90 | O que mais sai. Volume suficiente pra aparecer na foto e no rosto de quem recebe. |
| Buquê de Lírios M (par) | R$ 399,90 | O presente de data marcada. Chega e ocupa o ambiente inteiro. |
| Arranjo de Mão Lírios P ("Menor preço") | R$ 159,90 | O menor. Cabe na mesa da cozinha e perfuma a sala inteira. |
| Arranjo de Mão Lírios G | R$ 289,90 | Meio metro de flor, ainda em papel jornal. Pra quando o recado é grande. |
| Buquê de Lírios P | R$ 299,90 | Acabamento de buquê e fita de cetim, do tamanho de um abraço. |
| Buquê de Lírios G ("O maior") | R$ 459,90 | Sessenta centímetros. É o maior que a gente monta. |

Preços conferidos contra `PRODUCTS` em `configs.ts`. **Se divergirem do que você encontrar no código, o código ganha — e me avise.**

A segunda linha fica em ordem crescente de preço (159,90 → 289,90 → 299,90 → 459,90). A primeira quebra a ordem de propósito: são os dois destacados.

### O que sai da vitrine

As quatro caixas de `.ad-lp-reassure` ("Frete sem surpresa", "Foto antes de sair", "Cor do dia", "Pague como preferir") saem daqui. Elas competem com os produtos na dobra mais importante da página. O conteúdo se redistribui: frete e foto viram linhas de prova no hero, cor do dia vira a faixa do dia, pagamento vira pergunta do FAQ.

A `.ad-lp-comparison` (Arranjo × Buquê) vira duas linhas de texto acima da grade, não dois cards.

### Bloco de garantia

Logo abaixo da grade, `.ad-lp-pledge`:

> **Não gostou? Refazemos, trocamos ou devolvemos no mesmo dia.** E o frete fica entre R$ 10 e R$ 30 conforme o bairro — confirmado no WhatsApp antes de você fechar.

Valores de frete confirmados pelo cliente em 23/08/2026 (ver §12). Se a tabela mudar, ela aparece em **três lugares** — aqui, na linha de prova do hero e no FAQ. Mantenha os três em sincronia.

---

## 6. Quatro tempos

Substitui as seções "Por que somos diferentes" (4 pilares) e "Como funciona" (4 passos), que hoje dizem quase a mesma coisa uma embaixo da outra.

Componente `.ad-lp-beats`. Numeração `01–04` é legítima aqui porque **é uma sequência real** — não use numeração em nada que não seja.

1. **Você escolhe** — Passa a vitrine, escolhe o tamanho e chama a gente no WhatsApp.
2. **A gente monta** — Com a flor que chegou nesta semana. Você diz o recado do cartão.
3. **Você aprova a foto** — Antes de sair da loja, mandamos a foto real do arranjo pronto. Ele só sai depois do seu ok. → `--key`, o único destacado em rosa.
4. **Chega hoje** — Entrega própria em Goiânia, Aparecida e Senador Canedo, ou na data que você marcar.

---

## 7. Prova

O carrossel horizontal de cards pequenos sai. Vira: uma citação grande + grade de 4 + agregado real com link.

**Citação em destaque — troque quem está lá hoje.** O `.ad-lp-proof__hero` atual usa "sffart gamer", nome de usuário anônimo, falando de atendimento. Numa LP fria o medo é a entrega, não a simpatia. Use:

> "Produto chegou no dia e na hora combinado, muito lindo, surpreendeu e superou minhas expectativas."
> — Marcos Vinícius

Na grade de 4: Melissa Pimentel, sffart gamer, Hellen Araújo, Tainá Santos. Textos exatamente como estão em `public/lpb/google-reviews.json`.

Agregado: `4,9 · 203 avaliações públicas no Google`, com link pro Google. Esses números vêm do JSON — se ele mudar, mudam.

---

## 8. A loja

A foto da fachada com o carro na porta é o ativo mais subutilizado da página. Dê tamanho: foto à esquerda, texto à direita.

Legenda: `Rua 132, Setor Sul. A entrega sai desta porta, no nosso carro.`

Os três números (`+3.000` buquês, `40` anos, `4,9` no Google) contam ao entrar na tela. Duas regras: começar de um número com a **mesma quantidade de dígitos** do final (senão a largura pula), e não animar em `prefers-reduced-motion`. O valor final tem que estar no HTML, pra sobreviver ao SSR e ao JS bloqueado.

---

## 9. FAQ único

Oito perguntas, nesta ordem — que é a ordem em que elas travam a compra, não a ordem atual:

1. Quanto vou pagar de frete? *(aberta por padrão, com a tabela de §12)*
2. Ainda dá tempo de receber hoje?
3. O buquê vai igual à foto do site?
4. Como posso pagar?
5. Lírios duram menos que rosas?
6. Tem outras cores além de rosa?
7. O perfume é forte mesmo?
8. Posso agendar para outro dia?

As respostas são as que já existem, com duas fusões:

- "O buquê vai igual à foto?" e "Vocês enviam foto antes de entregar?" viram uma só, e a resposta absorve a garantia: *"…Ele só sai depois que você aprovar. Se não sair como combinado, refazemos, trocamos ou devolvemos no mesmo dia."*
- "Como funciona o pedido?" sai — os quatro tempos (§6) já respondem, com mais clareza.

Acrescente `FAQPage` em JSON-LD. A LP no ar não tem, e é ganho de graça.

---

## 10. Faixa do dia

Componente `.ad-lp-daystrip`, logo abaixo do hero. Uma linha:

> ● **Lírios chegam 3× por semana.** A cor do dia a gente manda por foto. — Pedido até **18h** de segunda a sexta (13h no sábado) sai hoje.

O segundo trecho pode virar relógio real. **Só se for verdade:**

- Seg–sex fecha 18h, sábado 13h, domingo não abre — os horários já estão em `business-info.ts`.
- Dentro da janela: `Faltam 2h 40min pra fechar a entrega de hoje.`
- Fora da janela, ou domingo, ou antes das 8h: volta pra frase estática.
- Fuso fixo em `America/Sao_Paulo`, não no relógio do visitante.

Atenção: já existem **duas regras de urgência divergentes** no repo (`urgencyWindow` e `showCutoffCopy` — ver "Inconsistências conhecidas" no contexto canônico). Reaproveite `urgencyWindow`, que é a correta, e não crie uma terceira.

Urgência falsa derruba a confiança que o resto da página constrói. Se a lógica ficar complicada, deixe a frase estática.

---

## 12. Frete

Confirmado pelo cliente em 23/08/2026. Estes números **não estão no repo hoje** — a página no ar só diz "varia conforme o bairro". Numa LP fria, "varia" lê-se como "pode ser caro", e essa é a objeção que mais trava a decisão.

| Onde | Valor |
|---|---|
| Setor Sul e Marista | R$ 10,00 |
| Demais bairros, até 20 km | R$ 25,00 |
| De 20 a 30 km | R$ 30,00 |

Resposta do FAQ: a tabela acima em lista, seguida de *"Manda o endereço ou o CEP no WhatsApp que a gente confirma o valor exato antes de você fechar. O preço que você fecha é o preço final."*

Três observações de implementação:

- **A tabela não cobre todos os casos.** Entre o Setor Sul e os 20 km existe uma faixa que o cliente não especificou. A frase do CEP cobre isso sem prometer o que não foi dito. Não preencha a lacuna por conta própria.
- **Coloque os valores num único lugar do código** (constante em `business-info.ts` ou na config do slug) e consuma nos três pontos. Espalhar os números em três strings vira divergência na primeira mudança de preço — é exatamente o problema que o repo já tem entre home e LPs.
- R$ 10 no Setor Sul é o bairro da própria loja. Vale citar o nome do bairro, não só o valor: "R$ 10 aqui no Setor Sul" carrega proximidade junto com o preço.

---

## 11. Checklist antes de considerar pronto

- [ ] Nenhuma outra LP mudou de aparência. Compare screenshots de `/rosas-apt` e `/urgencia` antes e depois.
- [ ] Fraunces e Instrument Sans **não** são baixadas pela home nem pelas outras LPs.
- [ ] Com JavaScript desativado a página continua legível e todos os CTAs levam ao WhatsApp.
- [ ] Todos os cliques de CTA disparam `whatsapp_click` no dataLayer e `Contact` no Meta, com `cta_location` correto.
- [ ] `npm run check` e `npm run check:build` passam.
- [ ] CLS continua 0,000. LCP não piorou.
- [ ] Contraste AA em cada par novo. Os valores calculados estão nos comentários do `lirios-apt-tokens.css` — reconfira, não confie neles.
- [ ] O rótulo "Exemplo" está visível no card de conversa.
- [ ] Nenhum preço, prazo ou número foi inventado.
