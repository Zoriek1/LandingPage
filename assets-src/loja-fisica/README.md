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

Todas as fotos são próprias, feitas pela equipe na loja. Nenhuma é de banco de imagem nem gerada por IA. As de 19/10/2026 vieram do celular (1500x2000) e foram recortadas na proporção final antes do `npm run images`, então o recorte centralizado do script não corta mais nada. Os recortes deixam de fora as etiquetas de preço (a página não mostra preço) e os riscos vermelhos que vieram em algumas fotos. Posição em pixels da foto do celular: esquerda,topo largura x altura.

Fotos do celular usadas (19/10/2026): vaso de cerâmica oliva, vaso de cerâmica azul na embalagem, saquinho de adubo NPK 04-14-08, sacos de substrato (Jeronima 30 L, Terral orquídeas, Terral samambaia, Terral suculentas), terra ensacada, pátio com figueira-lira, folhagem em vaso preto, letreiro no muro verde (duas fotos).

### Carrosséis das categorias (`categorias/`)

| Arquivo | Origem e recorte |
|---|---|
| `vasos-1.jpg` | vaso de cerâmica oliva na mão, 260,420 1120x1400 |
| `vasos-2.jpg` | vaso de cerâmica azul na embalagem, 180,480 1200x1500 |
| `vasos-3.jpg` | pátio, prateleira de arame com vasos pretos e begônias, 0,850 400x500 |
| `adubos-1.jpg` | saquinho de adubo 04-14-08 na mão, parte de baixo (sem a etiqueta de preço), 330,830 620x775 |
| `adubos-2.jpg` | mesmo saquinho, grânulos do lado esquerdo, 160,880 440x550 |
| `adubos-3.jpg` | mesmo saquinho, grânulos do lado direito, 880,900 440x550 |
| `terras-1.jpg` | saco Jeronima de 30 L, 230,560 1120x1400 |
| `terras-2.jpg` | pacote Terral orquídeas, 150,260 1150x1437 |
| `terras-3.jpg` | pacote Terral samambaia (sem a etiqueta de preço), 330,600 820x1025 |
| `terras-4.jpg` | pacote Terral Suculentas Pro (sem a etiqueta de preço), 330,430 780x975 |
| `terras-5.jpg` | terra ensacada no muro de pedra, 230,330 1060x1325 |
| `plantas-1.jpg` | folhagem em vaso preto, 220,420 1000x1250 |
| `plantas-2.jpg` | pátio, figueira-lira, 450,140 720x900 |
| `plantas-3.jpg` | pátio, palmeira de folha em leque, 120,120 520x650 |
| `plantas-4.jpg` | pátio, aglaonemas em vasos verdes, 740,1110 420x525 |
| `plantas-5.jpg` | pátio, begônias e espadas-de-são-jorge, 0,1170 470x587 |

### Faixas (`faixas/`)

| Arquivo | Origem e recorte |
|---|---|
| `ornamentais-1.jpg` | pátio inteiro, 0,560 1500x1000 (3:2) |
| `ornamentais-2.jpg` | pátio, samambaias pendentes, 980,620 520x650 |
| `ornamentais-3.jpg` | folhagem de folha recortada ao lado do vaso preto, 1030,640 470x587 |
| `vasos-1.jpg` | vaso de cerâmica oliva com a prateleira atrás, 0,200 1300x1625 |
| `vasos-2.jpg` | vaso de cerâmica azul com a prateleira atrás, 0,300 1340x1675 |
| `vasos-3.jpg` | pátio, prateleira com vasos de barro e alecrim, 0,520 520x650 |
| `vasos-4.jpg` | pátio, vaso cor de barro da figueira-lira, 340,1440 400x500 |
| `vasos-5.jpg` | vaso preto da folhagem, 470,1040 680x850 |
| `historia-1.jpg` | `fachada-rua.jpg`, 250,150 1300x975 (4:3): entrada inteira com portão e letreiro |
| `historia-2.jpg` | letreiro no muro verde, foto em pé (1440x2560), 0,0 1440x1800 |
| `historia-3.jpg` | pátio inteiro em pé, 150,100 1200x1500 |
| `avaliacoes-1.jpg` | letreiro no muro verde visto de lado, 0,220 1500x1125 (4:3) |

Os recortes menores (vasos-3, adubos-2 e 3, plantas-3 a 5, ornamentais-2 e 3, vasos-3 e 4 das faixas) têm de 400 a 520 px de largura e saem um pouco macios na versão de 960 ou 1200. Uma foto feita só daquele assunto, de perto, resolve.

## O que ainda vale fotografar

- Adubo: hoje são três recortes do mesmo saquinho. Fotos de outros adubos (torta de mamona, farinha de osso, NPK de outras fórmulas) deixam o carrossel mais variado.
- Vasos: só há duas fotos de vaso de cerâmica. Vasos de barro e cachepôs fotografados de perto entram no carrossel e na faixa.
- Nossa História: equipe e balcão. A foto da entrada (`historia-1`) ainda é um recorte da foto da rua usada no topo.

Ideal: luz do dia, fundo limpo, sem etiqueta de preço, mínimo de 1400 px no lado maior e o assunto no meio da foto.

Depois de trocar qualquer arquivo, rode `npm run images`.
