# Fluxo de Atendimento e Classificação de Perdas — WhatsApp→Lead→Compra

> Fase P3 do Plano CRO (v1.1, 2026-08-20). Operacional: serve para quem atende o WhatsApp da loja. O gargalo atual do funil está aqui — WhatsApp→lead caiu de 53,8% para 43,5% na /lirios-apt, e o atendimento é o ponto de maior alavancagem disponível.

## Meta

Primeira resposta em **≤ 5 minutos** dentro do horário comercial
(seg–sex 08h–18h, sáb 08h–13h — horário de Brasília).

## Fluxo de primeira resposta (na ordem)

Ao receber a mensagem do cliente (veio da LP de anúncio com produto ou com faixa de preço):

1. **Confirmar produto e tamanho** — ler a mensagem: se veio de um card, ela já traz produto + tamanho + preço. Repetir de volta: "Você pediu o Buquê de Lírios G (R$ 459,90), certo?"
2. **Data e região/CEP** — "Para qual data você quer o presente? Qual o bairro/CEP da entrega?"
3. **Disponibilidade e frete** — confirmar que dá para montar/entregar e informar o valor do frete.
4. **Reforçar a garantia** — "Monto, mando a foto real para você aprovar antes da entrega, e o cartão escrito à mão é por conta da casa."
5. **Pagamento e confirmação** — forma de pagamento e confirmação final do pedido.

### Regras de atendimento

- Se a mensagem veio da LP e o cliente não especificou produto, oferecer **2 opções** (uma mais barata, uma premium) com preço na primeira mensagem.
- Nunca responder só "olá". Sempre responder com a confirmação do que ele pediu + uma pergunta de avanço (data ou CEP).
- Promessa de entrega: respeitar o que a página prometeu (entrega hoje até 18h seg–sex, 13h sáb; domingo não há entrega hoje). Se não for possível cumprir, avisar imediatamente e oferecer a próxima data.

## Classificação obrigatória de perdas

Toda conversa que **não vira compra** recebe exatamente um destes motivos. Sem conversa sem categoria.

| Categoria | Quando usar |
|-----------|-------------|
| `nao_respondeu` | Cliente iniciou (ou recebeu 1ª resposta) e não respondeu mais |
| `preco` | Desistiu por valor do produto |
| `frete` | Desistiu por valor/condição de frete |
| `fora_da_area` | Endereço fora da área de entrega |
| `data_horario_indisponivel` | Data/horário desejado indisponível |
| `produto_indisponivel` | Produto/tamanho/cor sem estoque ou impossível de montar |
| `trocou_de_produto` | Comprou outro produto da loja (não conta como perda do produto original) |
| `pedido_concluido` | Comprou o que pediu (fim do funil — para medir conversão real) |

## Onde registrar

- Campo/motivo no sistema de gestão ou planilha compartilhada do time de WhatsApp, com data/hora de cada conversa.
- O rastreio do front já envia `cta_location`/`cta_label`/`product_id` e o código de atendimento (bloco "Código de atendimento" na mensagem). Anotar o código junto ao motivo permite cruzar atendimento × página × anúncio.

## Medição semanal

| Métrica | Fórmula | Alvo |
|---------|---------|------|
| Tempo de 1ª resposta | mediana (min) | ≤ 5 min em horário comercial |
| WhatsApp→lead | conversas que viraram lead / conversas | ≥ 50% |
| lead→compra | compras / leads | ≥ 40% |
| Distribuição de perdas | % por categoria | Top 2 categorias viram as próximas ações |

## Próximos passos ligados a este fluxo

- Só depois de medir P1 + este fluxo, testar o CTA "Escolher meus lírios no WhatsApp" (controle: "Comprar no WhatsApp") — não antes.
- Se `preco`/`frete` dominarem as perdas na /lirios-apt, revisar a faixa comparativa (P1.2) e a comunicação de preço antes de mexer em oferta.
