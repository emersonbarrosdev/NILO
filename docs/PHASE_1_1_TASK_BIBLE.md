# NILO — Bíblia de Tarefas da Fase 1-1

> **NILO** é o nome oficial do jogo e do protagonista. Esta bíblia cobre somente o vertical slice da **Fase 1-1 — Vale da Brisa**.

## Escopo

A meta é terminar uma fase pequena, polida e representativa antes de produzir qualquer outra fase. A direção urbana anterior foi descartada: **não usar prédios, skyline, telhados, metrô ou estética de cidade como identidade desta fase**.

A 1-1 deve ser aberta, colorida, natural e convidar ao movimento. O jogador precisa enxergar céu, colinas, vegetação, relevo, madeira, bandeirolas e plataformas legíveis.

**Tempo-alvo:** 6–8 min na primeira conclusão; 3–5 min para jogador experiente.

## Definição de pronto

A fase só é considerada pronta quando possuir:

- personagem em sprite final;
- movimento e pulo polidos;
- estilingue funcional;
- 3 inimigos diferentes;
- obstáculos e plataformas fixas/móveis;
- pelo menos 1 puzzle curto;
- checkpoint;
- coletáveis, coração e 1-UP;
- vidas e respawn;
- HUD;
- áudio;
- stage clear;
- game over/continue;
- save básico;
- arte natural/colorida coerente;
- performance estável;
- início, meio e fim claros.

---

# ÉPICO 01 — Fundação técnica

## Tarefa 01 — Validar runtime

Manter Phaser 4 + TypeScript + Vite + Arcade Physics. Resolução lógica 320×180, `pixelArt: true`, antialias desligado e `roundPixels: true`.

**Aceite:** `npm install`, `npm run typecheck` e `npm run build` sem erros.

## Tarefa 02 — Garantir escala pixel-perfect

O canvas só pode usar multiplicadores inteiros sempre que possível: 2×, 3×, 4×, 5× etc. Não usar escala fracionária que borre fonte e sprites.

## Tarefa 03 — Consolidar fluxo inicial

Fluxo visível do vertical slice:

**Tela inicial/menu → Rota da Aventura → Fase 1-1**.

Boot/Preload permanecem técnicos. Intro narrativa não entra enquanto história/arte não forem aprovadas.

## Tarefa 04 — Pipeline de assets

Definir nomes e pastas para spritesheets, tilesets, backgrounds, UI, mapas e áudio. Primitives em runtime são permitidas apenas durante graybox.

---

# ÉPICO 02 — Protagonista e controles

## Tarefa 05 — Movimento horizontal

Implementar aceleração, velocidade máxima, desaceleração, direção/facing e colisão estável.

Controles:
- A/D ou ←/→ mover;
- S/↓ direção para baixo/agachar quando implementado.

## Tarefa 06 — Pulo responsivo

W, ↑ e SPACE devem pular. Implementar altura variável, coyote time e jump buffer discretos.

## Tarefa 07 — Plataformas semissólidas

Permitir atravessar plataformas finas para baixo quando a mecânica entrar no level design.

## Tarefa 08 — Spritesheet final do protagonista

Produzir Nilo cartunesco e legível, sem estética urbana obrigatória e sem associação visual a Sonic/Mogli.

Animações mínimas:
- idle 4;
- run 6–8;
- jump 2–3;
- fall 2;
- crouch 1–2;
- aim;
- shoot 3–4;
- charged shot 4;
- hit 2;
- death 6.

**Aceite:** corrida alterna membros corretamente e não parece slide.

---

# ÉPICO 03 — Estilingue

## Tarefa 09 — Tiro rápido

Projétil normal ilimitado, cooldown curto e origem alinhada à mão/estilingue.

## Tarefa 10 — Mira

Permitir mira horizontal, vertical e diagonal de forma simples e previsível.

## Tarefa 11 — Tiro carregado

Segurar ataque aumenta força/alcance. Feedback visual e sonoro obrigatório.

## Tarefa 12 — Combate aéreo

Permitir `correr → pular → atirar → aterrissar` sem zerar momentum horizontal.

## Tarefa 13 — Impacto e feedback

Criar hit flash, pequeno recuo, SFX e partículas pixeladas apropriadas.

---

# ÉPICO 04 — Level design da 1-1

## Tarefa 14 — Macro-layout

Construir Vale da Brisa em cinco atos:

1. abertura segura e primeiro salto;
2. primeiro inimigo e primeiro tiro;
3. plataformas com verticalidade e inimigo aéreo;
4. puzzle curto + rota opcional;
5. trecho final combinando movimento, combate e plataformas móveis.

## Tarefa 15 — Terreno principal

Usar terra/pedra com topo de grama. Variar altura e largura para evitar uma faixa reta contínua.

## Tarefa 16 — Plataformas naturais

Criar plataformas de terra, pedra, madeira e pequenas estruturas de caminho/feira. Nada de rooftops urbanos.

## Tarefa 17 — Plataformas móveis

Adicionar pelo menos uma horizontal e uma vertical.

## Tarefa 18 — Elemento de impulso

Criar um elemento próprio do mundo que lance o personagem para cima/frente. Pode ser flor, tecido elástico, folha, mola estilizada ou outro conceito aprovado visualmente.

## Tarefa 19 — Obstáculos

Adicionar:
- buracos;
- troncos/pedras;
- espinhos ou perigo equivalente;
- pequenas quedas;
- plataformas estreitas;
- trecho curto de precisão.

Nenhuma morte pode depender de informação fora da tela.

## Tarefa 20 — Rotas alternativas

Criar pelo menos uma rota alta e uma rota baixa que se reencontrem.

---

# ÉPICO 05 — Inimigos

## Tarefa 21 — Inimigo terrestre básico

Patrulha simples, 1 tiro normal para derrotar e telegraph claro.

## Tarefa 22 — Inimigo saltador

Reage à aproximação do jogador com preparação visível antes do salto.

## Tarefa 23 — Inimigo aéreo

Movimento previsível que ensina mira vertical/diagonal e combate durante salto.

## Tarefa 24 — Redesign artístico dos placeholders

Os nomes `lata`, `saltador` e `pipa-drone` são técnicos. Criar criaturas/inimigos coerentes com o mundo natural/fantástico antes da aprovação final.

## Tarefa 25 — Sistema comum de inimigos

Padronizar dano, knockback, invulnerabilidade, morte, ativação fora de câmera e respawn consistente.

---

# ÉPICO 06 — Puzzle e interação

## Tarefa 26 — Puzzle principal da 1-1

Criar um mecanismo visual acionado por estilingue que altere uma plataforma ou passagem. Resolver em poucos segundos e sem texto obrigatório.

## Tarefa 27 — Segredo com tiro carregado

Alvo opcional distante/protegido abre rota secreta ou recompensa.

## Tarefa 28 — Interações de cenário

Adicionar pelo menos dois objetos do ambiente que reajam a tiros sem virar puzzle longo.

---

# ÉPICO 07 — Coletáveis e vidas

## Tarefa 29 — Coletável comum

Manter temporariamente `selos` como nome técnico. Distribuir em linhas que ensinem movimento e revelem rotas.

Regra atual: 50 = +1 vida.

## Tarefa 30 — Três segredos da fase

Manter exatamente 3 cartões-postais ou equivalente:
1. fácil/visível;
2. exploração;
3. desafio opcional.

O nome/arte pode mudar com a identidade final.

## Tarefa 31 — Coração

Pickup recupera 1 HP sem ultrapassar o máximo.

## Tarefa 32 — 1-UP escondido

Adicionar exatamente 1 vida extra física em rota secreta ou de risco.

## Tarefa 33 — Checkpoint

Trocar a antiga caixa de correio por marcador coerente com a direção natural: bandeira, marco, totem ou conceito final aprovado.

---

# ÉPICO 08 — Dano e falha

## Tarefa 34 — Sistema de HP

3 pontos/corações, 1 de dano por hit e invulnerabilidade curta.

## Tarefa 35 — Queda fatal

Kill zone clara e respawn seguro.

## Tarefa 36 — Morte e respawn

Consumir uma vida, executar animação curta e retornar ao checkpoint.

## Tarefa 37 — Game Over / Continue

Ao zerar vidas, `CONTINUE?`. Reiniciar a fase com 3 vidas sem apagar progresso global.

---

# ÉPICO 09 — UI e fluxo

## Tarefa 38 — HUD definitivo

Exibir somente HP, vidas, coletável comum, segredos da fase e munição especial quando existir.

## Tarefa 39 — Tela inicial

Criar composição natural/colorida com o logo **NILO**. Não usar prédios ou skyline urbano. O título deve ser imediatamente legível e memorável.

## Tarefa 40 — Rota da Aventura

Mapa simples e visual, com 1-1 ativa e futuros pontos bloqueados. Não usar linguagem de metrô/transporte.

## Tarefa 41 — Stage Clear

Tempo, coletáveis, inimigos derrotados, segredos e score.

## Tarefa 42 — Pause

Continuar, reiniciar fase, controles e sair para mapa.

---

# ÉPICO 10 — Arte de Vale da Brisa

## Tarefa 43 — Tileset 16×16

Produzir:
- grama;
- terra;
- pedra;
- bordas;
- madeira;
- plataformas;
- arbustos;
- flores;
- bandeirolas;
- obstáculos;
- elementos de puzzle.

## Tarefa 44 — Background em camadas

Criar céu, nuvens, colinas distantes e vegetação intermediária com parallax leve. Nenhum prédio urbano.

## Tarefa 45 — Sprites de inimigos

Cada inimigo precisa de silhueta própria e animação suficiente para não parecer primitive arrastada.

## Tarefa 46 — Itens e efeitos

Sprites para coletável, segredo, coração, 1-UP, checkpoint, projétil, impacto, poeira, hit e stage clear.

## Tarefa 47 — Revisão visual

Capturar screenshots de todos os atos e validar contraste de jogador, inimigos, plataformas, perigos e itens.

---

# ÉPICO 11 — Áudio

## Tarefa 48 — Tema de Vale da Brisa

Criar chiptune melódico próprio, alegre e energético, com loop limpo. A música deve incentivar movimento sem copiar melodias de referências.

## Tarefa 49 — SFX essenciais

Pulo, estilingue, carga, impacto, inimigo, dano, morte, coletável, segredo, coração, 1-UP, checkpoint, puzzle e stage clear.

## Tarefa 50 — Mixer

Separar música e SFX, evitar clipping e permitir volume básico.

---

# ÉPICO 12 — Save, métricas e QA

## Tarefa 51 — Save local versionado

Salvar fase, segredos coletados, melhor tempo e configurações essenciais.

## Tarefa 52 — Cronômetro

Pausa não conta. Stage Clear registra melhor tempo.

## Tarefa 53 — Teclado e gamepad

Validar WASD, setas, SPACE e layout padrão de controle.

## Tarefa 54 — Browser desktop/mobile

Preservar proporção, escala inteira e pixel-perfect. No mobile, priorizar landscape e ocupação máxima sem distorção.

## Tarefa 55 — Performance

Validar 60 FPS estáveis no cenário-alvo e ausência de vazamentos ao reiniciar a fase.

## Tarefa 56 — Playtest completo

Executar múltiplas runs sem cheats, registrando mortes injustas, saltos cegos, inimigos ambíguos, puzzles lentos e pontos sem ritmo.

## Tarefa 57 — Gate final do vertical slice

Só aprovar a Fase 1-1 quando:

- for divertida sem depender de outras fases;
- possuir começo, meio e fim;
- estilingue estiver prazeroso;
- movimento/pulo estiverem polidos;
- arte natural e colorida estiver consistente;
- não houver restos de estética urbana antiga;
- todos os sistemas essenciais funcionarem;
- typecheck/build passarem;
- não existirem bugs bloqueadores.
