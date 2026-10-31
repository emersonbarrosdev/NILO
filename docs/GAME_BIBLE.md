# ESTALO 88 — Bíblia do Jogo

## 1. Visão

**ESTALO 88** é um action-platformer 2D em pixel art 8-bit, rápido de entender e baseado em habilidade. O jogo combina plataforma precisa, combate à distância com estilingue, obstáculos, inimigos, pequenos puzzles integrados ao movimento, segredos e colecionáveis. A referência não é copiar um jogo clássico específico, mas recuperar a filosofia de jogos 8-bit: controles imediatos, fases memoráveis, progressão de dificuldade, identidade visual forte e trilha melódica.

**Duração-alvo:** primeira campanha entre 2h e 2h40; conclusão 100% em aproximadamente 3h.

**Estrutura planejada:** 4 mundos, cada um com 3 fases normais e 1 chefe. Total futuro: 12 fases + 4 chefes. Somente o Mundo 1 / Fase 1-1 entra em produção detalhada nesta etapa.

## 2. Pilares

1. **Controle antes de conteúdo.** Correr, pular, mirar e disparar precisam ser divertidos em uma sala vazia.
2. **Estilingue como assinatura.** O combate e parte da interação de cenário nascem dele.
3. **Ritmo sem pressa artificial.** O jogo pode ser fluido sem transformar velocidade em cópia de Sonic.
4. **Puzzle curto.** Um puzzle deve interromper o fluxo por segundos, não por minutos.
5. **Cada fase com uma ideia dominante.** Repetição só quando serve para combinar habilidades já aprendidas.
6. **Pixel art legível e colorida.** Elementos interativos sempre se destacam do fundo.
7. **Música memorável.** A melodia deve ser reconhecível e assobiável; não apenas ambiente chiptune.
8. **Escopo curto e polido.** Melhor 2h30 excelentes do que 5h infladas.

## 3. Premissa narrativa

A história acontece em uma cidade vertical extremamente colorida, conectada por telhados, jardins suspensos, canais, pontes, bondes, ferrovias, elevadores e bairros altos.

O protagonista é um jovem mensageiro urbano. Seu parceiro é um pequeno pássaro mecânico usado pela antiga rede de mensageiros para registrar rotas, atalhos e endereços. Durante uma entrega, uma gangue invade o posto de mensageiros e rouba o pássaro.

O líder, conhecido como **O Colecionador**, descobriu que a memória do pássaro contém rotas antigas que levam a passagens de serviço esquecidas. Ele pretende usar essas rotas para penetrar no Museu das Alturas e realizar o maior roubo da cidade.

O protagonista segue a gangue não porque é um escolhido ou porque precisa salvar o planeta, mas porque seu parceiro foi levado. A perseguição atravessa os quatro grandes distritos planejados e termina no Museu das Alturas.

### Tom

- aventura leve;
- humor visual;
- diálogos curtos;
- sem profecia, cristal ancestral, núcleo mágico ou ameaça cósmica;
- o conflito cresce naturalmente a partir de um roubo simples.

## 4. Protagonista

O nome permanece **em aberto** até a arte final do personagem.

### Base visual

- humano jovem, urbano e cartunesco;
- silhueta legível em aproximadamente 24×32 px;
- cabelo/topete reconhecível;
- jaqueta curta;
- bolsa transversal de mensageiro;
- estilingue sempre associado à silhueta ou animação;
- cores fortes;
- sem tênis gigantes ou elementos que remetam diretamente a Sonic;
- sem estética de garoto selvagem para evitar associação a Mogli/Tarzan.

### Personalidade

Curioso, teimoso, bem-humorado e leal. Não faz discursos heroicos. Sua motivação inicial é recuperar o parceiro e terminar a entrega.

## 5. Controles

| Entrada | Ação |
|---|---|
| Esquerda / Direita | mover/correr |
| Baixo | agachar |
| A / Z / Cross | pular |
| B / X / Square | tiro rápido |
| Segurar ataque | carregar tiro e mirar |
| Direcional durante carga | mira em até 8 direções |
| Baixo + pulo em plataforma fina | atravessar plataforma |
| Start / Esc | pausa |

### Regras de movimento

- pulo com altura variável conforme duração do botão;
- coyote time discreto;
- jump buffer discreto;
- aceleração e desaceleração rápidas, porém não instantâneas;
- sem dash, double jump, spin ou wall-jump na fundação;
- disparo permitido no ar sem cancelar brutalmente o momentum.

## 6. Estilingue

### Munição normal

Pedra padrão ilimitada. Tiro rápido causa dano básico.

### Tiro carregado

Segurar o botão aumenta força e alcance. Permite mirar em até 8 direções. Deve ter feedback audiovisual claro sem barra complexa.

### Munições especiais futuras

| Tipo | Função |
|---|---|
| Pesada | quebra proteção e blocos frágeis |
| Ricochete | rebate em superfícies marcadas |
| Espalhada | três projéteis de curto alcance |

Cada coleta especial concede poucas cargas; ao acabar, o jogo retorna automaticamente à munição normal.

## 7. Vida, vidas e falha

- 3 corações por tentativa;
- dano normal remove 1 coração;
- aproximadamente 1 segundo de invulnerabilidade após dano;
- 3 vidas iniciais;
- morte por perda total de corações ou queda fatal consome 1 vida;
- respawn no último checkpoint;
- ao zerar vidas, exibir `CONTINUE?`;
- continuar retorna ao início da fase com 3 vidas;
- progresso de mundos não é apagado.

## 8. Checkpoints

As **caixas de correio** são checkpoints. Quando ativadas, levantam uma pequena bandeira, tocam um SFX curto e registram o ponto de respawn. A metáfora conversa com a profissão do protagonista e evita checkpoints genéricos.

## 9. Coletáveis

### Selos

Coletável comum. **50 selos = 1 vida extra.** Selos servem para incentivar linhas de movimento e exploração, mas não funcionam como proteção de dano e não se espalham quando o personagem é atingido.

### Cartões-postais

3 por fase normal. São os colecionáveis de exploração e 100%. Planejamento total futuro: 36 cartões-postais nas 12 fases normais.

### 1-UP

Vidas completas podem ser encontradas diretamente em rotas secretas ou de risco elevado.

### Corações

Recuperam 1 coração até o máximo padrão.

## 10. Estrutura futura dos mundos

### Mundo 1 — Bairro Solar

Telhados, mercados, jardins suspensos e bondes. Ensina o jogo em ambiente ensolarado e colorido.

- 1-1 Telhados do Mercado
- 1-2 Jardins Suspensos
- 1-3 Ponte dos Bondes
- Chefe: Gato de Sucata

### Mundo 2 — Canais Azuis

Pontes, porto, casas de bombas, comportas, água e perseguição por enchente.

- 2-1 Cais das Pontes
- 2-2 Casa das Bombas
- 2-3 Túnel da Enchente
- Chefe: Caranguejo Hidráulico

### Mundo 3 — Linha Ferroviária

Pátio ferroviário, fábrica de sinais e trem em movimento. Eleva a precisão e o ritmo.

- 3-1 Pátio Ferroviário
- 3-2 Fábrica de Sinais
- 3-3 Expresso 88
- Chefe: Locomotiva Blindada

### Mundo 4 — Cidade Alta

Distrito noturno/neon, pontes aéreas e Museu das Alturas. Combina tudo aprendido.

- 4-1 Avenida Neon
- 4-2 Pontes do Céu
- 4-3 Museu das Alturas
- Chefe final: O Colecionador

> Os mundos 2, 3 e 4 são direção macro, não especificação de produção. Suas bíblias detalhadas serão escritas somente depois que a Fase 1-1 estiver validada.

## 11. Chefes

Não haverá chefe em cada fase. Haverá **um chefe por mundo**. Chefes devem durar aproximadamente 3–5 minutos na primeira tentativa, possuir leitura clara, poucos padrões fortes e evitar barras de vida exageradas.

## 12. Telas e fluxo

### Splash

Logo do estúdio por 1–2 segundos.

### Title Screen

Pixel art panorâmica da cidade; protagonista e pássaro mecânico em um telhado; logo; `PRESS START` e tema principal.

### Main Menu

- Continuar
- Novo jogo
- Seleção de fase (após concluir o jogo)
- Extras
- Opções
- Créditos

### Save

3 slots. Cada slot exibe fase atual, cartões coletados e tempo de jogo. Save automático em eventos importantes.

### Intro

40–60 segundos de storyboard em pixel art, texto mínimo e sem dublagem obrigatória.

### Mapa

Mapa de transporte estilizado, não mapa de tabuleiro. Cada estação representa uma fase e conecta visualmente os bairros.

### Pré-fase

Exibe número, nome, cartões já encontrados e melhor tempo. Transição curta.

### HUD

Informação mínima: corações, vidas, selos, cartões encontrados na fase e munição especial ativa.

### Pause

Continuar, reiniciar fase, controles, opções e sair para o mapa.

### Stage Clear

Tempo, selos, inimigos derrotados, cartões encontrados e score. Sem XP ou telas longas de recompensas.

### Game Over

`CONTINUE?` com retorno rápido.

### Extras futuros

Sound Test, galeria, bestiário e Time Attack após concluir o jogo.

## 13. Direção visual

- resolução lógica: 320×180;
- escala inteira sempre que possível;
- `pixelArt`, `roundPixels` e antialias desligado;
- tiles base de 16×16;
- protagonista em torno de 24×32;
- inimigos comuns entre 16×16 e 32×32;
- chefes entre 64×64 e 96×96;
- fundos em camadas de parallax discretas;
- nenhuma arte vetorial substituindo sprite final;
- elementos perigosos/interativos precisam ter leitura imediata.

## 14. Animações mínimas do protagonista

| Animação | Frames-alvo |
|---|---:|
| Idle | 4 |
| Run | 6–8 |
| Jump | 2–3 |
| Fall | 2 |
| Crouch | 1–2 |
| Aim | 2+ por direção conforme necessidade |
| Shoot | 3–4 |
| Charged shot | 4 |
| Hit | 2 |
| Death | 6 |

## 15. Direção sonora

A música é um pilar do projeto. Cada região deve ter melodia própria e reconhecível. Chiptune não significa ruído retrô genérico. A composição deve possuir tema principal forte, baixo legível, ritmo que favoreça o movimento e variações por contexto.

A fase **Expresso 88** está planejada para possuir faixa exclusiva e altamente rítmica.

SFX prioritários: salto, estilingue, tiro carregado, impacto, coletar selo, cartão-postal, coração, 1-UP, checkpoint, dano, morte, pausa e conclusão de fase.

## 16. Tecnologia

- Phaser 4.2.1;
- TypeScript 7.0.2;
- Vite 8.3.5;
- Arcade Physics;
- Tiled para mapas quando o layout sair do graybox;
- Aseprite ou equivalente para spritesheets;
- localStorage para save inicial;
- sem Angular dentro do runtime do jogo;
- sem backend no MVP.

## 17. Arquitetura

Scenes coordenam fluxo. Entidades encapsulam comportamento de objetos de jogo. Systems centralizam regras reutilizáveis. Dados de fases ficam separados da lógica principal. `GameScene` deve carregar configurações/mapas de fases; não criar uma classe duplicada para cada stage.

## 18. Critério para avançar além de 1-1

Nenhuma outra fase entra em produção completa até a Fase 1-1 provar:

- movimento satisfatório;
- salto confiável;
- tiro rápido e carregado divertidos;
- combate legível;
- pelo menos 3 inimigos distintos;
- plataformas fixas e móveis;
- pelo menos 1 puzzle curto;
- checkpoint;
- selos, cartões, coração e 1-UP;
- HUD;
- morte, respawn e continue;
- trilha e SFX básicos;
- início, meio e fim de fase;
- performance estável;
- gameplay divertido sem depender de conteúdo futuro.
