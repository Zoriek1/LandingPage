# Fotos da loja física

Fontes de `/loja-fisica/`. O `npm run images` lê esta pasta e gera AVIF e WebP em `src/assets/generated/`. Os nomes dos arquivos são o contrato com a página: trocar uma foto mantendo o nome não exige mexer em HTML.

```
assets-src/loja-fisica/
  fachada-rua.jpg          hero (recortes definidos no script)
  categorias/<cat>-<n>.jpg   cat: vasos, adubos, terras, plantas; n = 1..N sem pular número
  faixas/<faixa>-<n>.jpg     faixa: ornamentais, vasos, historia
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

## Como trocar uma foto

1. Salve a foto nova com o mesmo nome (por exemplo `categorias/vasos-2.jpg`), em JPG, PNG ou WebP.
2. Rode `npm run images` e confira o enquadramento: o recorte é centralizado, então deixe o assunto no meio da foto.
   Depois reescreva o `alt` e o `data-caption` (ou a `figcaption`) da foto em `loja-fisica/index.html`: eles descrevem o recorte atual, não a foto nova.
3. Foto de celular em pé vale. A orientação do EXIF é respeitada e os metadados (inclusive localização) não vão para a imagem gerada.
4. Número a mais ou foto de faixa nova pede ajuste: em categorias, o HTML ganha um `<li>`; em faixas, a proporção entra em `STORE_STRIP_RATIOS` antes da foto. Nome fora do padrão, numeração com buraco e foto sem proporção aparecem no fim do log do script.

## Origem de cada foto

Nenhuma foto foi gerada por IA. Há dois tipos:

- **Própria**: feita pela equipe na loja, no celular (1500x2000), em 19/10/2026.
- **Pexels**: banco de imagem gratuito (licença Pexels: uso comercial livre, sem atribuição obrigatória). Entra onde ainda não há foto própria do assunto. Não é produto da loja; troque por foto própria quando tiver.

Regra de enquadramento: a foto vai quase inteira. O corte é só o mínimo para chegar à proporção (de 3:4 para 4:5 sai 6% da altura; de 2:3 para 4:5, 17%), sem recortar um detalhe da foto e ampliar. O alinhamento vertical (topo, meio ou base) deixa de fora os riscos vermelhos que vieram em algumas fotos do celular; onde não bastou, o corte fecha de 1% a 3% a mais, com a posição anotada na tabela (esquerda,topo largura x altura, em pixels da foto do celular). As fontes ficam com 1200 px de largura.

Na foto do saquinho de adubo, a linha do preço da etiqueta foi coberta com a cor da própria etiqueta: a página não mostra preço e o valor muda.

A foto das avaliações não fica nesta pasta: é a mesma fachada (`src/assets/fachada.jpg`, variantes `fachada-{480,900}`) que as outras landing pages usam na seção Nossa História.

### Carrosséis das categorias (`categorias/`)

| Arquivo | Tipo | Foto |
|---|---|---|
| `vasos-1.jpg` | Própria | vaso de cerâmica oliva na mão, alinhado ao topo |
| `vasos-2.jpg` | Própria | vaso de cerâmica azul na embalagem, alinhado ao topo |
| `vasos-3.jpg` | Pexels 8503259 | vasos de cerâmica coloridos sobre mesas |
| `adubos-1.jpg` | Própria | saquinho de adubo NPK 04-14-08 na mão, 20,0 1460x1825, preço coberto |
| `adubos-2.jpg` | Pexels 25974981 | mãos de luva com adubo granulado |
| `adubos-3.jpg` | Pexels 9413786 | composto orgânico numa jardineira |
| `terras-1.jpg` | Própria | saco Jeronima de 30 L, 22,180 1456x1820 |
| `terras-2.jpg` | Própria | pacote Terral orquídeas, alinhado ao topo |
| `terras-3.jpg` | Própria | pacote Terral samambaia, 24,0 1452x1815 |
| `terras-4.jpg` | Própria | pacote Terral Suculentas Pro, alinhado ao topo |
| `terras-5.jpg` | Própria | terra ensacada no muro de pedra, centralizada |
| `plantas-1.jpg` | Própria | pacová em vaso preto, 16,165 1468x1835 |
| `plantas-2.jpg` | Própria | pátio com o Ficus lyrata, 10,0 1480x1850 |
| `plantas-3.jpg` | Pexels 3125195 | costela-de-adão em vaso branco |
| `plantas-4.jpg` | Pexels 5188783 | zamioculca em vaso branco |
| `plantas-5.jpg` | Pexels 5825350 | lírio-da-paz em vaso branco |

### Faixas (`faixas/`)

| Arquivo | Tipo | Foto |
|---|---|---|
| `ornamentais-1.jpg` | Própria | pátio com o Ficus lyrata, faixa da largura inteira (3:2) |
| `ornamentais-2.jpg` | Pexels 9641446 | folhas de calatéia |
| `ornamentais-3.jpg` | Pexels 20233838 | antúrios vermelhos e laranja |
| `vasos-1.jpg` | Própria | vaso de cerâmica oliva (mesma foto de `categorias/vasos-1`) |
| `vasos-2.jpg` | Própria | vaso de cerâmica azul (mesma foto de `categorias/vasos-2`) |
| `vasos-3.jpg` | Pexels 4750383 | vasos de barro no plantio |
| `vasos-4.jpg` | Pexels 13699034 | vasos rasos de cerâmica nas prateleiras |
| `vasos-5.jpg` | Pexels 29118327 | jiboia em vaso preto de polietileno |
| `historia-1.jpg` | Própria | `fachada-rua.jpg`, 250,150 1300x975 (4:3): entrada inteira com portão e letreiro |
| `historia-2.jpg` | Própria | letreiro no muro verde, foto em pé (1440x2560), 0,0 1440x1800 |
| `historia-3.jpg` | Própria | pacová no pátio (mesma foto de `categorias/plantas-1`) |

Página de cada foto do Pexels: `https://www.pexels.com/photo/<número>/`.

## O que ainda vale fotografar

Cada foto própria nova substitui uma do Pexels. Na ordem de impacto:

- Plantas: hoje só a pacová e o Ficus lyrata são da loja. Costela-de-adão, zamioculca, lírio-da-paz, calatéia e antúrio, cada uma no seu vaso.
- Vasos: vasos de barro, cachepôs e vasos de polietileno, fotografados de perto.
- Adubo: torta de mamona, farinha de osso e NPK de outras fórmulas.
- Nossa História: equipe e balcão.

Ideal: luz do dia, fundo limpo, sem etiqueta de preço, mínimo de 1400 px no lado maior e o assunto no meio da foto.

Depois de trocar qualquer arquivo, rode `npm run images`.
