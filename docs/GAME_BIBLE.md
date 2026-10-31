# ESTALO 88 — Bíblia do Jogo

> **Status do nome:** `ESTALO 88` é codinome. O título comercial ainda não está fechado.

## 1. Visão

ESTALO 88 é um action-platformer 2D em pixel art 8-bit, colorido, direto e baseado em habilidade. O jogo combina plataforma precisa, combate à distância com estilingue, inimigos, obstáculos, pequenos puzzles integrados ao movimento, segredos, vidas e coletáveis.

A referência aos clássicos 8-bit está na filosofia: controles imediatos, fases memoráveis, progressão clara, visual legível, cores fortes e trilha melódica. O objetivo **não** é copiar Sonic, Mario, Batman ou Road Fighter.

**Duração-alvo:** primeira campanha entre 2h e 2h40; 100% em aproximadamente 3h.

**Escopo macro planejado:** 4 mundos, cada um com 3 fases normais e 1 chefe. Total futuro: 12 fases + 4 chefes. Somente a Fase 1-1 entra em produção detalhada agora.

## 2. Direção aprovada

- visual 8-bit muito colorido;
- primeira fase aberta e natural;
- céu amplo, colinas, vegetação, relevo, madeira e elementos leves de feira/caminho;
- ritmo fluido, sem transformar velocidade em cópia de Sonic;
- estilingue como assinatura do combate;
- puzzles curtos, resolvidos durante o fluxo;
- plataforma e habilidade acima de sistemas complexos;
- música com melodia forte e memorável;
- **não usar cidade, skyline de prédios ou estética urbana como identidade principal**.

## 3. Direção descartada

A antiga premissa de cidade vertical, mensageiro urbano, mapa de metrô, telhados e Museu das Alturas está **descartada** e não deve orientar novas implementações.

A história definitiva ainda não está fechada. Durante o vertical slice, o foco é validar personagem, estilingue, movimentação, inimigos, plataformas, coletáveis, estética natural/colorida e música.

## 4. Protagonista

Nome e aparência final continuam em aberto.

### Regras visuais

- personagem cartunesco e legível em sprite pequeno;
- silhueta reconhecível;
- roupa/acessórios coloridos;
- estilingue integrado à silhueta ou animação;
- não parecer Sonic com outra roupa;
- não criar estética de “menino da selva” que remeta a Mogli/Tarzan;
- não usar vetor como arte final.

### Personalidade

A definir junto com o design final. Deve ser simples, carismático e funcionar com pouca exposição narrativa.

## 5. Controles

| Entrada | Ação |
|---|---|
| A / D ou ← / → | mover/correr |
| W / ↑ / SPACE | pular |
| S / ↓ | baixo/agachar/atravessar plataforma quando implementado |
| ataque | tiro rápido |
| segurar ataque | carregar tiro e mirar |
| direção durante carga | mira em até 8 direções |
| Esc / Start | pausa |

### Regras de movimento

- pulo com altura variável;
- coyote time discreto;
- jump buffer discreto;
- aceleração e desaceleração responsivas;
- sem dash, double jump, spin ou wall-jump na fundação;
- disparo no ar sem matar o momentum horizontal.

## 6. Estilingue

### Munição normal

Pedra padrão ilimitada. Tiro rápido é o ataque principal.

### Tiro carregado

Segurar ataque aumenta força/alcance e permite mira. Deve possuir feedback visual e sonoro claro.

### Munições especiais futuras

| Tipo | Função |
|---|---|
| Pesada | quebra proteção e blocos frágeis |
| Ricochete | rebate em superfícies marcadas |
| Espalhada | três projéteis de curto alcance |

Poucas cargas por coleta. Ao acabar, retorno automático à munição normal.

## 7. Vida, vidas e falha

- 3 corações por tentativa;
- dano comum remove 1 coração;
- invulnerabilidade curta após dano;
- 3 vidas iniciais;
- queda fatal ou perda total de corações consome 1 vida;
- respawn no checkpoint;
- ao zerar vidas, `CONTINUE?`;
- continuar retorna à fase com 3 vidas;
- progresso global não é apagado.

## 8. Checkpoints

O formato final do checkpoint ainda não está fechado. Para a direção natural, preferir **marcos de rota, bandeiras, totens, placas ou outro elemento do mundo**, e não caixas de correio urbanas.

## 9. Coletáveis

### Selos

Coletável comum provisório. **50 selos = 1 vida extra.** O nome/visual pode mudar junto com a identidade final do mundo.

### Cartões-postais

3 por fase normal. Funcionam como colecionável de exploração/100%. O conceito pode ser renomeado, mas a regra de três segredos por fase permanece útil para o vertical slice.

### 1-UP

Vidas extras podem ser encontradas em rotas secretas ou de maior risco.

### Corações

Recuperam 1 coração até o máximo padrão.

## 10. Fase 1-1 — Vale da Brisa

**Nome provisório aprovado para o vertical slice.**

### Objetivo visual

Uma área aberta, ensolarada e extremamente colorida. O jogador deve sentir vontade de se mover assim que a fase começa.

### Elementos de cenário

- céu azul forte;
- nuvens pixeladas;
- colinas em camadas;
- árvores, arbustos e flores;
- chão de terra com topo de grama;
- plataformas naturais;
- madeira, bandeirolas e pequenos elementos de feira/caminho;
- sem prédios, skyline, antenas ou arquitetura urbana dominante.

### Ritmo

A fase deve alternar:

**movimento → salto → combate → pequena descoberta → movimento**.

Tempo-alvo: 6–8 minutos na primeira conclusão e 3–5 minutos para jogador experiente.

### Inimigos previstos

- inimigo terrestre simples;
- inimigo saltador;
- inimigo aéreo.

Os nomes atuais (`lata`, `saltador`, `pipa-drone`) são placeholders técnicos e podem mudar com a direção de arte.

### Obstáculos e plataformas

- buracos e quedas;
- plataformas fixas;
- plataformas finas;
- plataformas móveis;
- troncos/pedras/elementos naturais;
- obstáculos que exijam pulo e leitura de tempo;
- pelo menos um trecho de precisão curta.

### Puzzle

Pelo menos um puzzle curto baseado em estilingue e cenário, resolvido em segundos. Deve ser visual e opcionalmente criar rota secreta ou recompensa.

## 11. Mundos futuros

Os mundos 2, 3 e 4 **não têm tema definitivo nesta etapa**. Não assumir cidade, ferrovia ou museu como destino final.

Apenas manter estas regras:

- cada mundo deve ter identidade visual própria;
- cada mundo deve introduzir uma ideia dominante;
- variedade de biomas e situações;
- um chefe por mundo;
- uma fase especial pode mudar o ritmo ou perspectiva, desde que continue coerente com o jogo;
- nenhuma produção detalhada antes da aprovação da Fase 1-1.

## 12. Chefes

Não haverá chefe em cada fase. Haverá **um chefe por mundo**.

Cada chefe deve:

- durar aproximadamente 3–5 minutos na primeira tentativa;
- possuir poucos padrões fortes;
- ter leitura clara;
- usar a mecânica do estilingue de forma interessante;
- evitar barra de vida exagerada;
- ser visualmente memorável.

## 13. Telas e fluxo

### Boot / Preload

Técnicas e invisíveis enquanto o carregamento for instantâneo.

### Tela inicial/menu

Uma única tela forte: cenário natural colorido + logo/codinome + Novo Jogo/Continuar quando houver save.

### Mapa

**Rota da Aventura**, não mapa de transporte urbano. Mostra 1-1 ativa e rotas futuras bloqueadas.

### Intro

Só entra no fluxo depois que história e arte narrativa forem aprovadas.

### HUD

Informação mínima: HP/corações, vidas, coletável comum, segredos da fase e munição especial quando existir.

### Pause

Continuar, reiniciar fase, controles, opções e sair para mapa.

### Stage Clear

Tempo, coletáveis, inimigos derrotados, segredos e score. Sem XP ou sistemas de RPG.

### Game Over

`CONTINUE?` com retorno rápido.

## 14. Direção visual

- resolução lógica: 320×180;
- escala inteira obrigatória sempre que possível;
- pixel art nítida;
- `pixelArt: true`;
- `roundPixels: true`;
- antialias desligado;
- tiles base de 16×16;
- personagem aproximadamente 24×32;
- inimigos comuns 16×16 a 32×32;
- chefes 64×64 a 96×96;
- fundos com parallax discreto;
- nenhuma arte vetorial como sprite final;
- elementos perigosos/interativos precisam saltar do fundo visualmente.

## 15. Animações mínimas do protagonista

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

A corrida deve alternar corretamente pernas e braços. Não aceitar personagem deslizando com sprite quase estático.

## 16. Direção sonora

A trilha é um pilar do projeto.

Cada fase deve ter:

- melodia forte;
- baixo legível;
- ritmo que favoreça movimento;
- loop limpo;
- identidade própria;
- nenhuma cópia melódica de referências.

SFX prioritários: salto, estilingue, disparo, carga, impacto, coletável, coração, 1-UP, checkpoint, dano, morte, pausa e stage clear.

## 17. Tecnologia

- Phaser 4.2.1;
- TypeScript 7.0.2;
- Vite 8.3.5;
- Arcade Physics;
- Tiled para mapas quando o graybox estabilizar;
- Aseprite ou equivalente para spritesheets;
- localStorage para save inicial;
- sem Angular dentro do runtime;
- sem backend no MVP.

## 18. Critério para avançar além da 1-1

Nenhuma outra fase entra em produção completa até Vale da Brisa provar:

- movimento satisfatório;
- salto confiável;
- estilingue divertido;
- combate legível;
- pelo menos 3 inimigos distintos;
- plataformas fixas e móveis;
- pelo menos 1 puzzle curto;
- checkpoint;
- coletáveis, coração e 1-UP;
- HUD;
- morte, respawn e continue;
- trilha e SFX básicos;
- início, meio e fim de fase;
- arte 8-bit natural/colorida coerente;
- performance estável;
- gameplay divertido sem depender de conteúdo futuro.
