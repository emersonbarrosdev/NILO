> Atualização 0.3.1: a versão pública agora é um laboratório de uma tela. Veja [arquitetura e estado atual](PC_ANDROID_VERTICAL_SLICE.md). O percurso abaixo está preservado como preset interno forest, fora do menu.

﻿# Fase 1 — estado da versão 0.3.0

Este documento substitui as regras antigas de pixel art 8-bit, estilingue, semente, salto que atordoa e três corações. Somente a Fase 1 está em produção. O planejamento de outras fases continua sendo contexto futuro.

## Direção visual

Canvas 1280 × 720, antialias ligado. Texturas de personagem em células de 128 × 128 equivalem a 32 × 32 unidades de mundo. Câmera a 3,2 mostra 400 × 225 unidades: Nilo tem aproximadamente 26 unidades de altura visível; árvores próximas chegam a 173. Menus usam câmera a 4.

Logo único NILO, sem faixa/subtítulo. Splash animado com permanência mínima de três segundos, fundo de floresta e progresso de recursos. Menu com fonte Fredoka local, folhagem e personagem animados. Gameplay com fundo simples, atlas de árvores e copas, clareiras alternadas com bosque, arbustos, folhas em oito quadros e terreno com bordas de repetição tratadas. O fundo alterna o sentido das peças para evitar cortes abruptos na repetição.

O protagonista tem 64 quadros com bastão e 64 correspondentes de mãos vazias: oito cada para idle, andar, correr, salto, andar abaixado, ataque/arremesso em pé, ataque/arremesso abaixado e empurrar. A preparação usa escala uniforme entre poses e linha dos pés comum. Quadros de salto são selecionados conforme a velocidade vertical; a velocidade dos ciclos de passada acompanha a velocidade horizontal. Ainda cabe avaliação artística humana de fluidez e identidade quadro a quadro.

## Percurso atual

Mantidos 8.200 × 360 unidades, sem iniciar a Fase 2. A versão pode ser revista por trechos sem descartar o restante do mapa.

| Faixa X | Experiência |
|---|---|
| 0–1100 | Clareira, elevações suaves, primeiro caminho alto e ponte com chão de recuperação |
| 1100–1600 | Aranha, caixa empurrável como degrau e primeiro postal |
| 1600–2470 | Bifurcação: descer, levar caixa ao encaixe, voltar e atravessar por cima; checkpoint |
| 2470–3120 | Caixa quebrável, túnel, sapo, caminho alto, abelha e segundo postal |
| 3120–3980 | Travessia com jangada lenta, degraus e checkpoint |
| 3980–4530 | Sino opcional abre plataforma; caixa guarda lancheira extra |
| 4530–5680 | Ponte que cai com recuperação por baixo, terceiro postal, flor, cobra e checkpoint |
| 5680–7320 | Segundo túnel, caixas, alturas diferentes, cobra e travessia móvel |
| 7320–8200 | Checkpoint antes do macaco, arena fechada e saída liberada após derrotá-lo |

As placas explicativas foram retiradas. Caixas de empurrar usam marca de mão; caixas quebráveis usam rachaduras. O encaixe espelha a forma da caixa e muda de cor ao completar. Checkpoints trocam bandeira laranja por verde.

## Combate e sobrevivência

J / Quadrado golpeia; K / Círculo lança. Existe apenas um bastão: enquanto está no cenário, Nilo fica sem atacar e sem bastão na mão. Ele cai após impacto e é recolhido por contato após 400 ms. Buraco ou 12 segundos sem recuperação fazem o bastão reaparecer ao lado do jogador. Não quebra. O indicador do HUD fica apagado enquanto está fora da mão.

Inimigos comuns têm dois acertos: o primeiro paralisa por cerca de 3,8 s; o segundo derrota mesmo depois de recuperarem o movimento. Proteção de 250 ms impede acertos duplicados no mesmo contato. Não há chute de inimigo nem ataque por pisão. Contato com inimigo ativo custa uma vida. Há nove ciclos breves de piscar; não há camada extra de HP. A queda consome uma vida e retorna ao checkpoint. Continue restabelece três vidas.

O macaco tem oito acertos. A entrada fecha em X 7750, câmera fixa mostra a arena, saída em X 8106 fica bloqueada. Padrão inicial: aviso de 850 ms, arremesso e pausa de 1.800 ms. Cascas miram a posição atual, inclusive sobre plataformas, e permanecem no chão por um tempo limitado. Ao chegar a quatro acertos restantes, fúria por 1 s. Cabeçada: preparação de 850 ms, corrida a 170 unidades/s até o limite, recuperação vulnerável de 1.900 ms. A fase furiosa intercala arremessos. Cada janela aceita só um golpe; arremessar sem observar o padrão não causa dano. Morte/queda reinicia o combate e remove cascas. Derrota abre a saída.

## Implementação

- Construção do mapa: [buildForest](../src/game/levels/world-1/buildForest.ts).
- Física, animação e entrada: [Player](../src/game/entities/Player.ts).
- Arma única e recuperação: [BatonSystem](../src/game/systems/BatonSystem.ts).
- Padrão e arena: [ForestBoss](../src/game/entities/enemies/ForestBoss.ts).
- Vida direta e progresso: [GameState](../src/game/systems/GameState.ts).
- Embalagens: [Electron](../electron/main.cjs), [Capacitor](../capacitor.config.ts).

O timer de gameplay só avança sem pausa. Pausa congela física, tweens e timers e reduz o BGM. Sons e música são sintetizados localmente, com melodias próprias, volume de música/efeitos separado e compressor. Não foram copiados samples ou músicas dos jogos de referência.

## Validação e limites

A suíte Playwright verifica movimento/pulo, pausa, áudio, reinício, caixas, encaixe, túnel, dois golpes, ausência de pisão, vidas, bastão único, perda em buraco, pickup, chefe, limpeza da arena e multitouch. Testes de trechos usam posicionamento controlado para isolar regras: não equivalem a um playthrough humano integral. Os ciclos finais de vida do chefe são acelerados no teste; aviso, arremesso, transição de 50%, corrida e recuperação executam os estados reais.

A prévia Cloudflare serve para revisar. Windows e Android levam os assets no pacote e rodam instalados. O APK de teste ainda precisa ser avaliado num aparelho físico e, para distribuição em loja, assinado com chave de lançamento. O executável não possui certificado comercial de assinatura.

## Referências consultadas

- [Manual oficial Sonic Origins — SEGA](https://manuals.sega.com/origins/en/index.html): proteção e leitura de dano, consultado como comparação de regras, sem atribuir seus detalhes ao Master System.
- [Manual original Donkey Kong Country — Nintendo](https://www.nintendo.co.jp/clvs/manuals/common/pdf/CLV-P-SAALE.pdf): objetos de cenário e linguagem de plataforma clássica.
- [Manual Donkey Kong Country Tropical Freeze — Nintendo](https://csassets.nintendo.com/noaext/image/private/t_KA_PDF/manual-WiiU-Donkey_Kong_Country_Tropical_Freeze?_a=DATC1RAAZAA0): interação por carregar/arremessar objetos.

A decisão de vida direta, bastão recuperável e macaco furioso vem do pedido do usuário. Essas mecânicas não são uma reprodução literal de nenhum desses jogos.

## Entrega validada — 03/11/2026

- TypeScript e build de produção concluídos.
- Suíte completa: 7 testes Playwright passaram (1,2 min).
- Instalador NSIS Windows 0.3.0 gerado; executável empacotado aberto, menu e movimento conferidos, sem erros JavaScript. A captura inicial com janela oculta suspendia a animação; a validação final usou a janela ativa.
- Gradle assembleDebug concluído; APK 0.3.0 com assinatura v2 verificada pelo apksigner. Sem teste em aparelho Android físico.
- Cloudflare: [NILO](https://nilo-game.botanstudio.workers.dev), HTTP 200; abertura e gameplay conferidos sem falhas de recursos ou erros JavaScript. Deploy d16af8c1-f5e9-4371-b0ff-d0d44d990a6f.
- Não houve playthrough humano completo; validação de mecânicas e trechos automatizada.
