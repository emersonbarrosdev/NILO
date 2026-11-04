# Bloco 1 — personagem original, locomoção e bastão

Revisão técnica de 04/11/2026. Implementação e QA realizados com Astra; a aprovação artística final pertence ao Diretor do Jogo. Não houve commit ou push nesta etapa.

## Resultado implementado

Nilo voltou a usar o corpo detalhado original. O runtime usa [player-unarmed-sheet.png](../src/assets/hd/player-unarmed-sheet.png), células de 128 × 128 pixels em resolução 4, equivalentes a 32 × 32 unidades do mundo. [Player.ts](../src/game/entities/Player.ts) não usa mais o personagem simplificado. Fundo, menu, resolução global e regras de vida/fôlego permaneceram fora deste bloco.

O atlas contém 88 células, sem duplicar equipamento ou gestos já existentes:

| Células | Origem | Uso |
| --- | --- | --- |
| 0–63 | [player-unarmed-source.png](../src/assets/hd/player-unarmed-source.png), original preservado | Idle/blink, poses de salto, agachar, melee, arremesso, empurrar em pé e aliases do catálogo |
| 64–71 | [player-walk8-source.png](../src/assets/hd/player-walk8-source.png), correção baseada na identidade original | Caminhada com oito poses distintas |
| 72–79 | [player-run8-source.png](../src/assets/hd/player-run8-source.png), correção baseada na identidade original | Corrida com oito poses distintas, voo deliberado nas fases 3 e 7 |
| 80–87 | [player-push-crouched8-source.png](../src/assets/hd/player-push-crouched8-source.png), complemento baseado na identidade original | Empurrar agachado |

Arremesso reutiliza 40–47 e empurrar em pé reutiliza 56–63. Os fontes originais armados e os antigos run12 continuam preservados para auditoria; o run12 não participa da locomoção atual. [player-sheet.png](../src/assets/hd/player-sheet.png) continua carregado somente por compatibilidade com o retrato do HUD legado. O ícone de taco do HUD usa a imagem diagonal original, evitando deformação pelo novo formato horizontal.

[PLAYER_POSES](../src/game/config/playerArt.ts) registra os 26 estados solicitados e as duas variantes de equipamento. Estados preparatórios sem uma mecânica própria, como turn/stunned, são aliases explícitos de poses existentes; não se afirma que receberam animações inéditas.

## Locomoção

A velocidade horizontal passou de 118 para 103 unidades/s (−12,7%). Impulso do salto −288, gravidade e limite vertical permanecem iguais. O ciclo avança pela distância real relativa ao apoio e mantém defasagem anatômica de PI. A passada completa foi calibrada em 48 unidades: aproximadamente 17,17 mudanças de pose/s na velocidade de corrida, em vez de 34,33 com a configuração anterior de 24 unidades. O GIF de corrida usa aproximadamente 58 ms por pose; caminhada usa 130 ms como demonstração a 46 unidades/s. Esses GIFs são pranchas de animação, não medições de FPS do dispositivo.

O callback de contato com plataforma móvel informa o apoio ao personagem. Após a física, o deslocamento do apoio é subtraído antes de avançar o ciclo. Teleportes, primeiro frame da aterrissagem, ar e knockback não alimentam a passada. A trava verifica falha no avanço lógico; repetir uma imagem por vários updates é permitido. Um teste real injeta falha no ciclo e confirma que o knockback ainda desloca Nilo.

A [prancha anatômica](../artifacts/bloco1/walk-anatomy-audit.png) identifica quadril, joelho e tornozelo da perna direita próxima e esquerda distante. A leitura manual de oclusão do quadril e continuidade da coxa distingue 0/4 e 2/6; nomes de frames, hashes e cor de botas não foram tratados como prova suficiente. Os testes de raster confirmam integridade e distinção, não substituem essa leitura visual. A calibragem de passada reduz deslizamento; não é uma solução de IK nem promete contato subpixel perfeito de cada sola.

## Bastão único

[BatonSystem.ts](../src/game/systems/BatonSystem.ts) mantém um único sprite durante HELD, MELEE, PREPARE, RELEASE, FLYING, BOUNCING, GROUND e RECOVERED. O corpo de Nilo é sempre sem taco embutido; o equipamento é uma camada única. [batonConfig.ts](../src/game/config/batonConfig.ts) centraliza comprimento 18, espessura 4, escala, pegada, soltura e tempos. A AABB acompanha a rotação sem alterar comprimento ou escala.

A preparação dura 180 ms. A soltura ocorre após selecionar a pose de release e usa sua âncora de mão, seguida de voo e recuperação corporal. Melee tem sua própria janela de impacto e conserva o equipamento. No chão, aproximação sozinha não recolhe o taco: K inicia o gesto de recolhimento. As [âncoras](../src/assets/hd/player-hand-anchors.json) foram apontadas manualmente na imagem empacotada e conferidas por overlay e capturas; não são medições biomecânicas exatas. Ao empurrar, o taco fica vertical junto ao contato, evitando atravessar visualmente a caixa.

O fallback legado de arma perdida permanece. A revisão independente identificou que seu timeout de 12 s também pode reposicionar uma arma no chão; o responsável pelo Bloco 2 já registrou a correção para restringi-lo a perda real/voo inacessível.

## Auditoria e reprodução

[scripts/pack-original-player.mjs](../scripts/pack-original-player.mjs) empacota os fontes sem sobrescrevê-los, remove matte com alpha baixo e componentes soltos, alinha o apoio e gera atlas/metadados/pranchas/GIFs. [scripts/pack-player.mjs](../scripts/pack-player.mjs) delega ao empacotador canônico, e `npm run art:pack` chama diretamente o novo script.

[scripts/audit-original-player.mjs](../scripts/audit-original-player.mjs) gera hashes por célula, limites alpha, inspeção de borda vermelha e a prancha anotada. No atlas final: 190 pixels que atendem ao critério RGB vermelho, quase todos internos; apenas 1 pixel de borda no frame original 19. Nenhum pixel de borda vermelho nos novos 64–87. O critério é RGB r>150, g<70, b<70 com alpha>=128 e vizinho transparente. Não se removeu globalmente todo vermelho, pois isso apagaria cores legítimas do personagem.

Os novos raster sources foram produzidos com a ferramenta integrada `image_gen`, usando a folha original como referência de identidade. O primeiro rascunho de caminhada foi rejeitado por ambiguidade anatômica; a segunda versão recebeu correção de pernas/oclusão. [BLOCO_1_ARTE_PROMPTS.json](./BLOCO_1_ARTE_PROMPTS.json) conserva os prompts completos e identifica o modo utilizado. [player-original-metadata.json](../src/assets/hd/player-original-metadata.json) registra hashes dos sources, recortes, escala e origem de cada célula.

## QA executado

- `npx playwright test tests/locomotion.spec.ts tests/player-art.spec.ts tests/block1.spec.ts`: 15/15 aprovados em 1,1 min.
- Caso acrescentado depois, `npx playwright test tests/block1.spec.ts --grep 'melee damages'`: 1/1 aprovado. Inimigo real recebe dano; taco permanece no mesmo objeto equipado, sem emitir arremesso. A suíte atual contém 16 testes validados.
- `npm run build`: aprovado, incluindo TypeScript. Aviso remanescente: chunk JavaScript maior que 1600 kB; não é erro de build.
- Chromium real em viewport 1280 × 720: corpo detalhado, oito fases, pulo sem caminhar no ar, apoio móvel neutro, knockback com falha injetada, taco único, preparo equipado, release na mão, tamanho invariável, chão sem auto-pickup, recolhimento por K, arremessos para ambos os lados parado/em movimento/no ar, e push em pé/agachado/bloqueado.

Houve uma falha inicial de teste por ler `hasBaton` em chamada posterior ao frame de preparação; a captura passou a pausar a cena real no estado observado. Outra execução encontrou reload de desenvolvimento enquanto fontes eram reempacotados; a suíte final foi executada com os sources estáveis. Essas execuções falhas não foram contadas como aprovadas.

## Evidências locais

- [Personagem no jogo real, HUD legado sem placeholder](../artifacts/block1-original-runtime.png).
- [Preparação](../artifacts/block1-throw-prepare.png), [voo](../artifacts/block1-throw-flight.png), [taco no chão](../artifacts/block1-baton-ground.png).
- [Push em pé](../artifacts/block1-push-standing.png), [agachado](../artifacts/block1-push-crouched.png), [bloqueado](../artifacts/block1-push-blocked.png).
- [Comparação original/novos ciclos](../artifacts/bloco1/original-and-new-comparison.png), [anatomia anotada](../artifacts/bloco1/walk-anatomy-audit.png), [âncoras](../artifacts/bloco1/hand-anchors-contact.png), [auditoria raster](../artifacts/bloco1/raster-audit.json).
- [GIF caminhada](../artifacts/bloco1/walk.gif), [GIF corrida](../artifacts/bloco1/run.gif), [GIF empurrar em pé](../artifacts/bloco1/push-standing.gif), [GIF agachado](../artifacts/bloco1/push-crouched.gif), [sequência corporal do arremesso](../artifacts/bloco1/throw.gif).

As evidências em `artifacts/` são ignoradas pelo Git e permanecem no workspace; devem ser adicionadas explicitamente se o commit precisar carregá-las. A matriz PC/mobile e FPS em hardware físico não foi afirmada neste bloco. A revisão de proporções dos novos movimentos continua aberta ao Diretor; o quadro idle canônico permanece derivado diretamente do original.

