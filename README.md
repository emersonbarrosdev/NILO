# ESTALO 88

Action-platformer 2D em pixel art 8-bit, construído com **Phaser 4 + TypeScript + Vite**.

> `ESTALO 88` é o codinome atual do projeto. O nome comercial ainda não está fechado.

## Estado atual

Fundação técnica e pré-produção do **vertical slice da Fase 1-1 — Vale da Brisa**.

## Direção atual

- mundo aberto, colorido e fantástico;
- primeira fase natural, com céu amplo, colinas, vegetação, plataformas e elementos de caminho;
- **não usar cidade, skyline de prédios ou estética urbana como identidade do jogo**;
- inspiração nos clássicos 8-bit está na fluidez, leitura, ritmo, cores e música — não em copiar fases ou personagens;
- protagonista definido como **criança aventureira**, não adulto;
- combate principal com estilingue;
- plataforma, inimigos, obstáculos, puzzles curtos e exploração;
- música chiptune melódica e memorável;
- campanha completa planejada para até ~3h em 100%;
- nenhuma produção em massa dos demais mundos antes da Fase 1-1 ficar divertida e completa.

## Controles atuais

- **A / D** ou **← / →**: mover;
- **W**, **↑** ou **SPACE**: pular;
- **S** ou **↓**: agachar/direcionar mira para baixo;
- **J** ou **X**: estilingue;
- tocar **J/X**: tiro normal;
- segurar **J/X**: carregar tiro;
- durante a carga, usar **WASD/setas** para mirar, incluindo diagonais.

## Protótipo do protagonista

O protótipo atual já possui estados visuais separados para:

- idle;
- corrida em 8 frames;
- salto/subida;
- ápice;
- queda;
- aterrissagem;
- agachado;
- frenagem/troca de direção;
- tiro no chão;
- tiro no ar;
- carga do estilingue.

A arte desses frames ainda é **procedural e temporária** para validar movimento e leitura. A spritesheet final desenhada substituirá esses frames sem mudar a máquina de estados.

## Estilingue

- pedra normal visível;
- tiro carregado maior e mais rápido;
- disparo permitido durante o salto;
- tiro não cancela o momentum do personagem;
- pedra colide com chão/plataformas e gera impacto pixelado;
- câmera recebe feedback mínimo no disparo, mais forte no carregado.

## Fluxo atual

As cenas `BootScene` e `PreloadScene` são técnicas e ficam invisíveis para o jogador. O fluxo visível do vertical slice é:

**Tela inicial/menu → rota da aventura → Fase 1-1**

A `IntroScene` permanece no projeto para uma introdução narrativa futura, mas não participa do fluxo enquanto história e arte definitivas não forem aprovadas.

## Stack

- Phaser 4.2.1
- TypeScript 7.0.2
- Vite 8.3.5
- Arcade Physics
- Tiled (planejado para mapas)
- Aseprite ou equivalente (planejado para sprites)
- localStorage para save local

## Rodar

```bash
npm install
npm run dev
```

## Validar

```bash
npm run typecheck
npm run build
```

## Documentação

- [`docs/GAME_BIBLE.md`](docs/GAME_BIBLE.md) — Bíblia geral do jogo.
- [`docs/PHASE_1_1_TASK_BIBLE.md`](docs/PHASE_1_1_TASK_BIBLE.md) — plano para produzir somente a Fase 1-1.

> O nome e a arte final do protagonista continuam em aberto. Já estão fechados: protagonista criança, estilingue, direção natural/colorida e foco em movimento 8-bit responsivo.
