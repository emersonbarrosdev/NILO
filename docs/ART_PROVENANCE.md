> Direção atual (4/11/2026): as sprites detalhadas originais são canônicas. O estudo simplificado player-pixel foi reprovado e não é base de produção. As seções 0.3.0/0.3.1 abaixo são histórico; o catálogo atual e seus recortes estão em player-original-metadata.json, gerado por pack-original-player.mjs. Menu, logo e forest-backdrop.png permanecem aprovados. Mockups de interface e storyboard não são fontes de sprites recortadas.

# Arte da versão 0.3.0

Assets raster criados com ImageGen para este projeto; nenhum sprite ou áudio foi extraído de Sonic, Mario ou Donkey Kong. O personagem foi mantido conforme a identidade aprovada: cabelo castanho, camisa clara, colete ocre, shorts, tênis e mochila. Fonte Fredoka distribuída localmente com licença OFL em `src/assets/fonts/OFL.txt`.

## Fontes preservadas

Arquivos originais da ferramenta permanecem na pasta de imagens geradas do Codex. Cópias de trabalho em `src/assets/hd/*-source.png` são excluídas do carregamento/empacotamento do jogo. Os scripts são processos determinísticos de recorte, escala, limpeza de RGB em pixels transparentes e organização em células; não desenham um personagem substituto.

| Arquivo de trabalho | Origem ImageGen (identificador) | Brief de produção |
|---|---|---|
| player-source.png | 7648cc7b-bd5a-45c1-9a2c-b770a91fa48c | Versão anterior, 48 poses do menino cartoon |
| nilo-logo.png | 8cff294b-0990-4430-8bbe-df963e39777a | Edição do logo aprovado: retirar faixa e “de volta pra casa”, preservar NILO e folha |
| forest-backdrop.png | c87320fd-fa39-43c9-9d78-40b212479baa | Floresta viva e densa, usada na abertura e nos menus |
| forest-source.png | eb34d26a-8e69-4d8a-978c-4bd80bdffef3 | Atlas 4×3: tronco, árvore, copa, cipó, grama/terra, terra, tronco-plataforma, pedra, samambaia, arbusto, bromélia, borda de grama |
| enemies-source.png | 95e34e25-f9ec-40fc-a9a4-8fbfc806c4a3 | Atlas de aranha, abelha e sapo, quatro poses de cada |
| player-baton-source.png | 277c0e34-3c61-48a6-8831-5228ce1ea20f | 8×8: idle, andar, correr, salto, andar abaixado, golpe/arremesso, golpe/arremesso abaixado, empurrar; identidade existente preservada |
| monkey-source.png | 858b9503-034e-4ad4-8b70-74aa87748f69 | 4×4: oito poses de macaco, quatro de cobra, caixa inteira/rachada, bastão, casca de banana |
| player-unarmed-source.png | 79827623-eb60-457c-8fb8-5ca314018e94 | Edição 8×8 removendo apenas o bastão, preservando poses e células para estado desarmado |
| grove-backdrop.png | c99b69e4-82d0-4f01-b6df-993c61be3824 | Bosque simples em camadas, céu ciano, grandes silhuetas verdes, sem elementos jogáveis nem perspectiva de caminho |
| items-source.png | b01a1a17-d729-441c-ae7a-9e5dcc5d23b0 | 4×2: lancheira azul, distintivo de folha, postal, postal apagado, bandeira inativa/ativa, sino parado/tocando |

## Prompts das três últimas gerações

### Variante sem arma

“Precise production sprite-sheet edit. Keep the exact image size, all 8 columns by 8 rows, every character pose, every face, foot position, clothing, color, scale and empty cell spacing unchanged. ONLY remove the wooden baton from every hand in all frames. Nilo is now unarmed, both hands empty, retain hand anatomy and the existing pose, including swing/throw arm poses. Do not change layout. No extra props, no shadows, no text. Transparent background. This is an alternate unarmed-state sheet for the same video game, must register with the original sheet.”

Referência: `player-baton-source.png`. Fundo transparente solicitado.

### Bosque distante

“Production background painting for NILO, colorful 2D side-scrolling cartoon platformer. Wide 16:9 panoramic repeating forest backdrop, influenced by the simple readable landscape layering of early console platformers but entirely original, NOT pixel art. Sparse spacious grove: clean cyan turquoise sky visible across upper half, a few huge distant emerald broadleaf trees with simple rounded clustered canopies, tall smooth teal trunks, softly rolling dark green forest silhouettes at bottom. Flat clean cel-shaded shapes, crisp curves, limited palette of vivid emerald, teal and cyan. Restrained detail and only two distant layers, no foreground foliage, no massive foreground trunks, no bridges, no terrain platforms, no path with perspective, no characters, no waterfalls, no text, no glow or fog or pastel wash. Horizontal side-view elevation. Left and right edges should match seamlessly. The gameplay foreground will supply all detailed trees and foliage separately. Open airy clearings and strongly readable silhouettes, simpler than a digital fantasy painting.”

O resultado precisou de repetição alternadamente espelhada no runtime para casar as bordas, e recebeu tint verde no gameplay.

### Itens

“Production sprite atlas for NILO, polished colorful hand-painted cartoon 2D forest platformer, no pixel art. EXACTLY 4 columns by 2 rows, 8 distinct isolated objects, each centered in equal square cell on transparent background with wide empty gutters. Bold readable silhouettes at small game sizes, crisp highlights and dark brown/green outlines, vivid saturated natural colors. Row1 cell1 small child's blue metal lunchbox with orange handle and cream star sticker, cell2 golden embroidered scout patch shaped like an octagonal leaf badge (NOT a coin, no circular rim), cell3 cream landscape postcard with a small green tree illustration and red stamp corner, cell4 same postcard dark teal silhouette as empty collection slot. Row2 cell1 checkpoint flag on a wooden stake small orange triangle rolled down inactive, cell2 same checkpoint flag bright green triangle unfurled active same stake scale, cell3 mossy bell switch hanging from a small wooden arch with brass bell, cell4 matching switch with bell tilted ringing. NO words or letters. Orthographic side-view game props, no ground, no shadows beyond object silhouettes. Even grid, four columns, two rows, clear padding.”

Fundo transparente solicitado. A preparação descarta resíduos de alpha baixo antes do recorte.

## Preparação

`npm run art:pack` executa, nesta ordem:

1. `pack-player.mjs`: recortes por limites reais das oito linhas, escala uniforme de 0,63 e pés em Y 116 dentro das células 128; duas folhas 1024×1280, com 64 poses anteriores e 12 poses novas de corrida.
2. `pack-forest.mjs`: atlas de floresta com JSON, três folhas de inimigos e oito poses de folhas rasterizadas.
3. `pack-adventure.mjs`: macaco, cobra, caixas, bastão e banana.
4. `pack-terrain.mjs`: faixas opostas de borda interpoladas em 24 pixels para continuidade; mantém interior sem simetria espelhada.
5. `pack-items.mjs`: oito itens e estados do postal em tamanhos adequados ao mundo/HUD.

`generate-hd-art.mjs` é o gerador anterior do protótipo; não é etapa de `art:pack`, pois sobrescreveria a nova arte. Fontes originais antigas são mantidas como histórico, sem substituir as folhas novas usadas pelo jogo.


## Corrida e menus — 0.3.1

Skill imagegen usada para criar as poses adicionais, preservando a identidade aprovada. Fontes PNG transparentes:
- [Corrida com taco](../src/assets/hd/player-run-source.png), geração exec-797e0245-1293-48eb-939d-9766f5984e4b.
- [Corrida sem taco](../src/assets/hd/player-run-unarmed-source.png), geração exec-f75c63d5-31f1-4369-89d0-c3577ea90a33.

Brief da primeira geração: menino NILO exatamente como a referência aprovada, mesmas roupas, mochila, cabelo e taco; spritesheet transparente de 4 colunas por 3 linhas, 12 poses cronológicas de corrida lateral (contato, apoio, impulso, voo e troca das pernas), cabeça estável e mesma direção do olhar, sem textos, sombras de chão ou linhas de velocidade. Brief da edição: remover somente o taco das mesmas 12 poses, preservando posição, anatomia, expressão, roupa, escala e transparência.

As fontes de 1448×1086 são recortadas em células e registradas pela cabeça no [empacotador](../scripts/pack-player.mjs). Escala uniforme por folha; poses de voo não são artificialmente esticadas para encostar no chão. Frames novos 64–75. A animação em jogo avança pela distância, com ciclo de 56 unidades; repouso usa duas poses lentas. As folhas finais são [com taco](../src/assets/hd/player-sheet.png) e [sem taco](../src/assets/hd/player-unarmed-sheet.png).

O [tronco de apoio](../src/assets/hd/platform-log.png) combina recorte da madeira e musgo existentes, com topo em Y=0. A mesma imagem é usada por troncos estáticos, móveis e de queda. Não foram importados assets dos clássicos.

Menu sem personagem ampliado. Fonte Press Start 2P, de CodeMan38, distribuída localmente sob OFL: [fonte](../src/assets/fonts/press-start-2p.ttf), [licença](../src/assets/fonts/PressStart2P-OFL.txt), [origem Google Fonts](https://github.com/google/fonts/tree/main/ofl/pressstart2p). A fonte foi explicitamente carregada antes da criação do motor.
