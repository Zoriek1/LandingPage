# Fotos da loja física

Fontes de `/loja-fisica/`. O `npm run images` lê esta pasta e gera AVIF e WebP em `src/assets/generated/`. Os nomes dos arquivos são o contrato com a página: trocar uma foto mantendo o nome não exige mexer em HTML.

```
assets-src/loja-fisica/
  fachada-rua.jpg          hero (recortes definidos no script)
  categorias/<cat>-<n>.jpg   cat: vasos, adubos, terras, plantas; n = 1..N sem pular número
  faixas/<faixa>-<n>.jpg     faixa: ornamentais, vasos, historia, avaliacoes
```

## Variantes geradas

| Origem | Recorte | Larguras | Arquivos em `src/assets/generated/` |
|---|---|---|---|
| `categorias/<cat>-<n>` | 4:5 retrato, centralizado | 480 e 960 | `loja-cat-<cat>-<n>-{480,960}.{avif,webp}` (480x600 e 960x1200) |
| `faixas/<faixa>-<n>` | proporção de cada foto (abaixo), centralizado | 640 e 1200 | `loja-faixa-<faixa>-<n>-{640,1200}.{avif,webp}` |

Proporção de cada foto de faixa, definida em `STORE_STRIP_RATIOS` no `scripts/optimize-images.mjs`:

| Foto | Proporção | 640 de largura | 1200 de largura |
|---|---|---|---|
| `ornamentais-1` | 3:2 paisagem | 640x427 | 1200x800 |
| `ornamentais-2`, `ornamentais-3` | 4:5 retrato | 640x800 | 1200x1500 |
| `vasos-1` a `vasos-5` | 4:5 retrato | 640x800 | 1200x1500 |
| `historia-1` | 4:3 paisagem | 640x480 | 1200x900 |
| `historia-2`, `historia-3` | 4:5 retrato | 640x800 | 1200x1500 |
| `avaliacoes-1` | 4:3 paisagem | 640x480 | 1200x900 |

## Como trocar uma foto

1. Salve a foto nova com o mesmo nome (por exemplo `categorias/vasos-2.jpg`), em JPG, PNG ou WebP.
2. Rode `npm run images` e confira o enquadramento: o recorte é centralizado, então deixe o assunto no meio da foto.
   Depois reescreva o `alt` e o `data-caption` (ou a `figcaption`) da foto em `loja-fisica/index.html`: eles descrevem o recorte atual, não a foto nova.
3. Foto de celular em pé vale. A orientação do EXIF é respeitada e os metadados (inclusive localização) não vão para a imagem gerada.
4. Número a mais ou foto de faixa nova pede ajuste: em categorias, o HTML ganha um `<li>`; em faixas, a proporção entra em `STORE_STRIP_RATIOS` antes da foto. Nome fora do padrão, numeração com buraco e foto sem proporção aparecem no fim do log do script.

## Origem de cada foto

Nenhuma foto foi gerada por IA. Enquanto as fotos reais não chegam, os arquivos marcados PLACEHOLDER são recortes diferentes (zoom e região) das poucas fotos que já existiam no repositório. Eles não mostram produtos da loja, e as fotos de origem das categorias são de banco de imagem. Não publicar PLACEHOLDER sem aprovação da loja; a meta é trocar todos por foto própria.

Os recortes foram extraídos sem reamostrar (JPEG qualidade 88) e o `npm run images` amplia até a largura de saída. Os mais fechados saem mais macios que uma foto real de 1400 px. Posição dos recortes em pixels da foto de origem: esquerda,topo largura x altura.

Fotos de origem:

- `fachada-rua.jpg`: foto da entrada da loja (Rua 132), feita pela equipe. Foto própria. 2000x1125.
- `categorias/*-1.jpg`: fotos do Unsplash (licença Unsplash: uso comercial livre, sem atribuição obrigatória), 1400x1400, usadas inteiras. Não são produtos da loja.
  - `vasos-1.jpg`: Nathalie Klippert, https://unsplash.com/photos/brown-clay-pots-with-green-plants-9II6ibogNLk
  - `terras-1.jpg`: Alicia Christin Gerald, https://unsplash.com/photos/bQ9y93kdk4c
  - `adubos-1.jpg`: Zemos, https://unsplash.com/photos/pile-of-small-light-brown-granular-material-on-black-5-LBYIucVGM
  - `plantas-1.jpg`: Sehajpal Singh, https://unsplash.com/photos/a-bunch-of-plants-that-are-on-a-shelf-BjvKS274fk8

### Carrosséis das categorias (`categorias/`)

| Arquivo | Status | Origem e recorte |
|---|---|---|
| `vasos-1.jpg` | PLACEHOLDER | Unsplash (Nathalie Klippert), foto inteira |
| `vasos-2.jpg` | PLACEHOLDER | `vasos-1.jpg`, 650,110 700x875: vaso canelado sobre vaso bege |
| `vasos-3.jpg` | PLACEHOLDER | `vasos-1.jpg`, 120,575 660x825: vaso virado com furo e base do vaso grande |
| `vasos-4.jpg` | PLACEHOLDER | `vasos-1.jpg`, 760,600 640x800: pratos empilhados |
| `adubos-1.jpg` | PLACEHOLDER | Unsplash (Zemos), foto inteira |
| `adubos-2.jpg` | PLACEHOLDER | `adubos-1.jpg`, 380,560 640x800: monte de grãos mais de perto |
| `adubos-3.jpg` | PLACEHOLDER | `adubos-1.jpg`, 100,600 620x775: lado esquerdo do monte |
| `adubos-4.jpg` | PLACEHOLDER | `adubos-1.jpg`, 760,600 620x775: lado direito do monte |
| `terras-1.jpg` | PLACEHOLDER | Unsplash (Alicia Christin Gerald), foto inteira |
| `terras-2.jpg` | PLACEHOLDER | `terras-1.jpg`, 420,450 680x850: substrato na mão |
| `terras-3.jpg` | PLACEHOLDER | `terras-1.jpg`, 380,0 640x800: dedos e topo do substrato |
| `terras-4.jpg` | PLACEHOLDER | `terras-1.jpg`, 600,500 500x625: textura do substrato bem de perto (a região mais nítida da foto) |
| `plantas-1.jpg` | PLACEHOLDER | Unsplash (Sehajpal Singh), foto inteira |
| `plantas-2.jpg` | PLACEHOLDER | `plantas-1.jpg`, 680,500 720x900: bancada com vasos pretos e poste |
| `plantas-3.jpg` | PLACEHOLDER | `plantas-1.jpg`, 420,380 720x900: miolo da bancada |
| `plantas-4.jpg` | PLACEHOLDER | `plantas-1.jpg`, 180,20 720x900: plantas pendentes e fundo desfocado |
| `plantas-5.jpg` | PLACEHOLDER | `plantas-1.jpg`, 0,330 720x900: lado esquerdo da bancada |

### Faixas (`faixas/`)

| Arquivo | Status | Origem e recorte |
|---|---|---|
| `ornamentais-1.jpg` | PLACEHOLDER | `categorias/plantas-1.jpg`, 100,600 1100x733 (3:2): bancada de folhagem |
| `ornamentais-2.jpg` | PLACEHOLDER | `categorias/plantas-1.jpg`, 150,700 560x700: folhas grandes de perto |
| `ornamentais-3.jpg` | PLACEHOLDER | `categorias/plantas-1.jpg`, 760,0 640x800: plantas pendentes e poste |
| `vasos-1.jpg` | PLACEHOLDER | `categorias/vasos-1.jpg`, 0,0 600x750: vaso grande com flores |
| `vasos-2.jpg` | PLACEHOLDER | `categorias/vasos-1.jpg`, 700,130 540x675: vaso canelado |
| `vasos-3.jpg` | PLACEHOLDER | `categorias/vasos-1.jpg`, 690,520 620x775: vaso bege com pratos |
| `vasos-4.jpg` | PLACEHOLDER | `categorias/vasos-1.jpg`, 150,725 540x675: vaso virado com furo |
| `vasos-5.jpg` | PLACEHOLDER | `categorias/vasos-1.jpg`, 0,380 520x650: bordas dos vasos empilhados |
| `historia-1.jpg` | PLACEHOLDER | `fachada-rua.jpg`, 250,150 1300x975 (4:3): entrada inteira com portão e letreiro |
| `historia-2.jpg` | PLACEHOLDER | `fachada-rua.jpg`, 0,0 900x1125: árvore, cobertura e portão |
| `historia-3.jpg` | PLACEHOLDER | `fachada-rua.jpg`, 1000,0 900x1125: letreiro e canteiro |
| `avaliacoes-1.jpg` | PLACEHOLDER | `fachada-rua.jpg`, 540,560 750x563 (4:3): portão aberto e corredor de entrada |

As três fotos de `historia-*` e a de `avaliacoes-1` saem da foto da rua feita pela equipe, mas ainda não mostram equipe, balcão nem corredor interno.

## O que precisa ser enviado

Ideal: paisagem ou retrato natural, luz do dia, fundo limpo, sem logotipo de terceiros, mínimo de 1400 px no lado maior e enquadramento 4:5 nos carrosséis. São 29 fotos: 17 de categorias e 12 de faixas.

| Uso | Arquivos | Quantidade | Conteúdo |
|---|---|---|---|
| Carrossel Vasos | `categorias/vasos-1` a `vasos-4` | 4 | vasos de alto padrão, cerâmica, barro e cachepô |
| Carrossel Adubos | `categorias/adubos-1` a `adubos-4` | 4 | adubo ensacado em sacolinhas pequenas (bancada, mão segurando) |
| Carrossel Terras | `categorias/terras-1` a `terras-4` | 4 | substrato de 40 L (saco, terra aberta) |
| Carrossel Plantas Ornamentais | `categorias/plantas-1` a `plantas-5` | 5 | ficus, monstera, samambaia e plantas de maior valor |
| Faixa Ornamentais | `faixas/ornamentais-1` (horizontal 3:2), `ornamentais-2` e `ornamentais-3` (verticais 4:5) | 3 | uma foto horizontal e duas verticais |
| Faixa Vasos | `faixas/vasos-1` a `vasos-5` (verticais 4:5) | 5 | vasos em ambiente |
| Faixa Nossa História | `faixas/historia-1` (horizontal 4:3), `historia-2` e `historia-3` (verticais 4:5) | 3 | fachada, equipe, balcão |
| Avaliações | `faixas/avaliacoes-1` (horizontal 4:3) | 1 | corredor ou fachada lateral da loja |

Depois de trocar qualquer arquivo, rode `npm run images`.
