# NILO — fonte autoral de poses e âncoras

## Direção e preservação

A revisão manteve a identidade: cabelo castanho, rosto quente, camisa creme, colete ocre, calção escuro, mochila e botas. O ciclo anterior de 12 imagens foi reprovado na inspeção porque a perna próxima permanecia à frente na maior parte das poses e o braço próximo pouco variava. A tentativa gerada de oito poses também foi reprovada; nenhuma das duas serve como evidência de alternância anatômica.

A instrução posterior do Diretor pediu leitura em monitores/TVs atuais, menos pixelização e o fundo da tela inicial. Essa correção prevaleceu sobre a proposta inicial de renderização de tudo em 320×180. A gameplay continua lógica em 320×180, enquanto a arte do ator usa células nativas de 64×64 e resolução de textura 2: uma célula mede 32×32 unidades no mundo, sem mudar sua física. O renderizador pode apresentar essa arte em resolução maior, sem blur.

## Fonte editável

- [Pose e paleta](../src/assets/pixel/player-poses.json): pixels de cabelo/rosto, coordenadas dos membros, fases e cores.
- [Gerador](../scripts/build-pixel-player.mjs): rasterização inteira, sem SVG, antialiasing ou redução de uma imagem HD. Cada pixel final pertence à paleta de 24 cores. Cabeça, dedos, costuras, botas e contornos utilizam a grade nativa de 64 pixels.
- [Spritesheet](../src/assets/hd/player-pixel.png): 512×512, oito colunas e oito linhas, transparência binária.
- [Âncoras](../src/game/config/playerArt.ts): geradas da posição real da mão, relativas ao centro da célula lógica. Não são coordenadas de viewport.

Regenerar com `node scripts/build-pixel-player.mjs`. O comando também produz as prévias de inspeção em `artifacts/`, que não entram no build. A ampliação nearest dessas prévias serve apenas à inspeção; o asset de jogo é exportado diretamente em sua resolução nativa.

## Identidade anatômica e contato

Vista para a direita: a perna direita é próxima, quente, desenhada por último. A esquerda é distante, em sombra, desenhada atrás do tronco. As identidades não trocam entre frames. O espelhamento do ator inteiro para a esquerda conserva essa relação anatômica.

| Frame de textura | Fase | Apoio | Pé de apoio x lógico | Pé de balanço |
|---|---|---|---:|---|
| 8 | Contato direito | Direita | 22 | Esquerdo atrás, elevado |
| 9 | Amortecimento direito | Direita | 19 | Esquerdo recolhido |
| 10 | Passagem direita | Direita | 16 | Esquerdo passa à frente |
| 11 | Impulsão direita | Direita | 13 | Esquerdo avança |
| 12 | Contato esquerdo | Esquerda | 22 | Direito atrás, elevado |
| 13 | Amortecimento esquerdo | Esquerda | 19 | Direito recolhido |
| 14 | Passagem esquerda | Esquerda | 16 | Direito passa à frente |
| 15 | Impulsão esquerda | Esquerda | 13 | Direito avança |

O recuo de três unidades do pé por fase corresponde a uma passada completa de 24 unidades. O membro oposto dá suporte na segunda metade. A soleira de apoio termina na coordenada lógica 29, junto ao limite inferior da hitbox existente; não há margem transparente sob o pé de apoio. A oscilação do tronco é de no máximo uma unidade em cada direção. A matemática de fase/deslocamento e a trava de deslizamento pertencem ao sistema de locomoção, não ao gerador.

## Compatibilidade dos estados

- 0/1: repouso e piscar; 2–7 mantêm compatibilidade de repouso.
- 8–15: oito fases únicas de caminhada. 16–23 são compatibilidade para locomoção, sem criar um segundo ciclo anatômico.
- 24–31: poses aéreas; 25 subida inicial, 26 subida, 28 ápice, 29 queda.
- 32–39: deslocamento abaixado.
- 40 preparação, 41 braço atrás/acima, 42 impulso, 43 liberação, 44 finalização, 45 recuperação, 46 acomodação, 47 repouso.
- 48–55: mesmos gestos abaixados; 56–63: empurrar.

Nenhum taco está desenhado no corpo. A arma é um objeto independente, e a âncora segue a mão que executa o gesto. O atributo `angle` em cada âncora descreve a orientação visual sugerida no perfil para a direita; a integração deve espelhar a orientação juntamente com o ator.

## Validação e limites

O diretor de arte inspecionou as prévias de oito poses em ordem e a sequência de arremesso: contato próximo/distante e gesto atrás/impulso/frente aparecem de forma distinta. Isso não aprova sozinho a animação executada, suas colisões, cadência ou transição entre arma presa e solta. A revisão independente de QA e a execução no jogo são necessárias; a aprovação estética final continua pertencendo ao Diretor do Jogo.
