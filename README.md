# NILO

Action-platformer 2D em pixel art 8-bit, construído com **Phaser 4 + TypeScript + Vite**.

**NILO** é o nome oficial do jogo e também do protagonista.

## Premissa

Nilo é uma criança em idade escolar. Depois de ser levado para longe de casa, ele consegue escapar em uma região de mata e inicia uma jornada para voltar para casa. A campanha acompanha essa travessia por florestas, rios, serras, campos e caminhos cada vez mais familiares.

## Estado atual

Fundação técnica e produção do **vertical slice da Fase 1-1 — Vale da Brisa**.

## Direção atual

- mundo colorido, natural e fantástico;
- primeira fase com céu amplo, colinas, vegetação, plataformas e elementos de caminho;
- **não usar cidade, skyline de prédios ou estética urbana como identidade do jogo**;
- inspiração nos clássicos 8-bit está na fluidez, leitura, ritmo, cores e música — não em copiar fases ou personagens;
- protagonista criança, com roupa escolar/casual e estilingue;
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

## Protagonista

Nilo já possui estados visuais separados para:

- idle;
- caminhada/corrida;
- salto/subida;
- ápice;
- queda;
- aterrissagem;
- agachado;
- frenagem/troca de direção;
- tiro no chão;
- tiro no ar;
- carga do estilingue;
- idle especial após 10 segundos parado.

### Regra do ciclo de corrida

O ciclo visual avança pela **distância real percorrida em X**, mantendo a passada ligada ao deslocamento do personagem e evitando o efeito de deslize.

### Idle especial

- após 10 segundos sem input, Nilo senta;
- enquanto estiver sentado, joga uma pedrinha a cada 5 segundos;
- qualquer input cancela imediatamente o idle especial.

## Estilingue

- pedra normal visível;
- origem do projétil alinhada ao estilingue conforme a direção da mira;
- tiro carregado maior e mais rápido;
- disparo permitido durante o salto;
- tiro não cancela o momentum do personagem;
- pedra colide com chão/plataformas e gera impacto pixelado.

## Fluxo atual

As cenas `BootScene` e `PreloadScene` são técnicas e ficam invisíveis para o jogador. O fluxo visível do vertical slice é:

**Tela inicial/menu → rota da aventura → Fase 1-1**

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
- [`docs/STORY_CAMPAIGN.md`](docs/STORY_CAMPAIGN.md) — história e estrutura da campanha.
- [`docs/PHASE_1_1_TASK_BIBLE.md`](docs/PHASE_1_1_TASK_BIBLE.md) — plano para produzir somente a Fase 1-1.
