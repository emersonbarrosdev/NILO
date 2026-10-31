# ESTALO 88

Action-platformer 2D em pixel art 8-bit, construído com **Phaser 4 + TypeScript + Vite**.

> `ESTALO 88` é o codinome atual do projeto. O nome comercial ainda não está fechado.

## Estado atual

Fundação técnica e pré-produção do **vertical slice da Fase 1-1 — Vale da Brisa**.

## Direção atual

- mundo aberto, colorido e fantástico;
- primeira fase natural, com céu amplo, colinas, vegetação, plataformas e elementos de feira/caminho;
- **não usar cidade, skyline de prédios ou estética urbana como identidade do jogo**;
- inspiração nos clássicos 8-bit está na fluidez, leitura, ritmo, cores e música — não em copiar fases ou personagens;
- controles simples e precisos;
- combate principal com estilingue;
- plataforma, inimigos, obstáculos, puzzles curtos e exploração;
- música chiptune melódica e memorável;
- campanha completa planejada para até ~3h em 100%;
- nenhuma produção em massa dos demais mundos antes da Fase 1-1 ficar divertida e completa.

## Controles atuais

- **A / D** ou **← / →**: mover;
- **W**, **↑** ou **SPACE**: pular;
- **S** ou **↓**: direção para baixo / base para agachar e atravessar plataformas quando essas ações entrarem no vertical slice.

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

> O nome, aparência final e história do protagonista continuam deliberadamente em aberto. A mecânica do estilingue e a direção 8-bit colorida são os pilares já aprovados.
