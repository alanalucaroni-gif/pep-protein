# PEP Protein — experiência 3D

Loja PEP em HTML, CSS, JavaScript e Three.js, com animações ligadas ao scroll, latas em 3D, caixa oficial preta, seleção de sabores, detalhes e carrinho local.

## Rodar localmente

Requer Node.js 22.12 ou superior.

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

O build está em `dist/` e pode ser hospedado como site estático. Os modelos GLB estão em `source/pep-3d/` e `source/pep-official-box-3d/`. A página e seus scripts estão em `source/pep-html/`.

## Comportamento

- Scroll apresenta a lata e seus benefícios, depois abre a caixa com três sabores.
- As latas são selecionáveis para ver detalhes, girar e adicionar ao carrinho.
- Menu, setas de sabores, vídeos e perguntas frequentes têm controles próprios.
- Há alternativa com fotos para movimento reduzido ou WebGL indisponível.

O carrinho guarda uma seleção local. Pagamento, preço e frete ainda não estão integrados; o botão de compra abre a loja oficial. O rótulo traseiro definitivo depende do arquivo oficial da PEP.

Versão publicada: https://pep-protein-nova-loja.contasproifood10.chatgpt.site/
