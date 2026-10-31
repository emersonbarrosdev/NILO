# ESTALO 88 — Bíblia de Tarefas da Fase 1-1

## Escopo desta bíblia

Esta documentação cobre **somente a produção completa da Fase 1-1 — Telhados do Mercado** e a fundação técnica indispensável para fazê-la funcionar como vertical slice. Não produzir fases 1-2 em diante, chefes ou sistemas que existam apenas para conteúdo futuro. A meta é terminar uma fase pequena, polida e representativa antes de expandir o jogo.

## Definição de pronto do vertical slice

A Fase 1-1 deve poder ser aberta a partir do fluxo inicial, jogada do início ao fim, concluída, reiniciada após morte e rejogada. Deve possuir personagem em sprite final, movimentação, estilingue, inimigos, obstáculos, plataformas, puzzle curto, checkpoints, coletáveis, vida, vidas, HUD, áudio, stage clear, game over/continue, save básico e performance estável.

Tempo-alvo da primeira conclusão: **6–8 minutos**. Jogador experiente: **3–5 minutos**.

---

# ÉPICO 01 — Fundação técnica

## Tarefa 01 — Inicializar Phaser + TypeScript + Vite

**Objetivo:** estabelecer runtime limpo e reproduzível.

**Implementação:**
- Phaser 4;
- TypeScript strict;
- Vite;
- Arcade Physics;
- resolução lógica 320×180;
- pixel art habilitada;
- antialias desligado;
- scale FIT + centralização;
- scripts `dev`, `typecheck`, `build` e `preview`.

**Aceite:** `npm install`, `npm run typecheck` e `npm run build` executam sem erro.

## Tarefa 02 — Criar arquitetura base

Criar e conectar:
- BootScene;
- PreloadScene;
- TitleScene;
- MenuScene;
- IntroScene;
- MapScene;
- GameScene;
- UIScene;
- StageClearScene;
- GameOverScene;
- EndingScene placeholder;
- Player;
- Projectile;
- systems de combate, coletáveis, checkpoint, save e áudio;
- dados/configs de fase.

**Aceite:** fluxo mínimo Title → Menu → Intro → Map → Game funciona sem reload da página.

## Tarefa 03 — Configurar pipeline de assets

Definir convenções de nomes, spritesheets, tilesets, áudio e mapas. Nenhum sprite final deve ser desenhado por primitives em runtime. Primitives são aceitas exclusivamente durante graybox e devem ser removidas antes da aprovação visual.

---

# ÉPICO 02 — Controle do protagonista

## Tarefa 04 — Graybox de movimento

Implementar:
- aceleração horizontal;
- velocidade máxima;
- desaceleração;
- direção/facing;
- colisão com chão e paredes;
- estado grounded/airborne.

**Validação:** testar andando em terreno plano por pelo menos 2 minutos e ajustar até não haver sensação de gelo ou travamento.

## Tarefa 05 — Pulo responsivo

Implementar:
- pulo de altura variável;
- gravidade adequada;
- coyote time discreto;
- jump buffer;
- queda mais responsiva que subida quando necessário;
- atravessar plataformas finas por comando.

**Aceite:** saltos curtos, longos, na borda e entre plataformas estreitas são previsíveis.

## Tarefa 06 — Produzir spritesheet final do protagonista

Criar personagem humano jovem, urbano, mensageiro e altamente legível em pixel art. Não usar vetor ou boneco provisório na entrega final.

Animações mínimas:
- idle 4 frames;
- run 6–8;
- jump 2–3;
- fall 2;
- crouch 1–2;
- aim;
- shoot 3–4;
- charged shot 4;
- hit 2;
- death 6.

**Aceite:** corrida alterna membros corretamente e não parece slide; transições não deixam frame congelado incorreto.

---

# ÉPICO 03 — Estilingue

## Tarefa 07 — Tiro rápido

Implementar projétil normal ilimitado, cooldown curto, origem alinhada à mão/estilingue, direção baseada no facing e feedback de impacto.

**Aceite:** disparar em sequência não cria spam ilimitado nem atravessa colisores indevidos.

## Tarefa 08 — Mira e tiro carregado

Segurar ataque entra em estado de carga. Permitir até 8 direções. A carga deve possuir feedback de sprite/SFX. Ao soltar, criar tiro mais forte/rápido conforme regra definida.

**Aceite:** mirar no chão, diagonal, cima e horizontal funciona inclusive no ar quando permitido pelo design.

## Tarefa 09 — Combate aéreo

Permitir pular e disparar sem zerar artificialmente o momentum horizontal. Validar sequências `correr → pular → atirar → aterrissar`.

---

# ÉPICO 04 — Level design graybox 1-1

## Tarefa 10 — Construir macro-layout

Criar graybox horizontal de Telhados do Mercado com duração-alvo de 6–8 minutos na primeira jogada. Dividir em cinco atos:

1. **Abertura segura:** movimento e primeiro salto.
2. **Primeiro combate:** inimigo simples e primeiro tiro.
3. **Verticalidade:** toldos, caixas, pequenas plataformas e inimigo aéreo.
4. **Puzzle/segredo:** contrapeso e primeira rota opcional.
5. **Trecho final:** combina movimento, combate, plataformas móveis e chegada ao ponto de saída.

Evitar corredores vazios longos e saltos cegos.

## Tarefa 11 — Plataformas fixas e semissólidas

Criar blocos de rooftop, plataformas finas atravessáveis, bordas claras e alturas coerentes com métricas do pulo.

## Tarefa 12 — Plataformas móveis

Adicionar pelo menos dois padrões:
- horizontal;
- vertical.

A velocidade deve permitir leitura antes do salto. Evitar esmagamento injusto.

## Tarefa 13 — Toldos elásticos

Criar toldos que funcionam como trampolim. O jogador deve reconhecer visualmente o comportamento antes do primeiro uso obrigatório.

## Tarefa 14 — Obstáculos ambientais

Adicionar e validar:
- buracos/quedas;
- caixas empilhadas;
- placas móveis;
- obstáculos de teto;
- trechos de precisão curta.

Nenhum obstáculo fatal pode depender de informação fora da tela.

---

# ÉPICO 05 — Inimigos da Fase 1-1

## Tarefa 15 — Lata

Inimigo básico de patrulha. Anda entre limites, muda direção em bordas/obstáculos conforme regra e morre com um tiro normal.

Função pedagógica: ensinar que o estilingue derrota inimigos.

## Tarefa 16 — Saltador

Permanece em patrulha curta ou espera; ao jogador entrar na zona de detecção, prepara visualmente e salta. Um tiro normal derrota.

Função: obrigar o jogador a reagir verticalmente.

## Tarefa 17 — Pipa-Drone

Inimigo aéreo com movimento simples, aproximação previsível e vulnerabilidade clara.

Função: ensinar mira vertical/diagonal e tiro no ar.

## Tarefa 18 — Sistema comum de inimigos

Padronizar:
- dano ao jogador;
- hit flash/piscar;
- knockback moderado;
- morte;
- desativação fora de câmera conforme necessário;
- respawn apenas quando apropriado após morte/checkpoint;
- colisão sem dano múltiplo por frame.

---

# ÉPICO 06 — Puzzle e interação de cenário

## Tarefa 19 — Contrapeso de plataforma

Criar puzzle principal da 1-1: um peso/engate visível segura uma plataforma em posição inadequada. O jogador atira no alvo, o mecanismo solta e a plataforma assume nova posição.

**Regras:**
- solução deve ser lida visualmente;
- não usar texto explicativo obrigatório;
- resolução em poucos segundos;
- resposta audiovisual imediata.

## Tarefa 20 — Segredo opcional com tiro carregado

Criar uma pequena rota opcional em que um alvo distante ou protegido exige o tiro carregado. Recompensa: cartão-postal ou 1-UP. O jogador que não descobrir deve conseguir concluir a fase normalmente.

---

# ÉPICO 07 — Coletáveis, vida e checkpoint

## Tarefa 21 — Selos

Distribuir selos em linhas que ensinem saltos e sugiram rotas. Implementar contador e regra de 50 selos = +1 vida.

## Tarefa 22 — Cartões-postais

Inserir exatamente 3:
1. visível e relativamente fácil;
2. escondido por exploração;
3. associado ao desafio opcional mais difícil.

Salvar coleta por fase e impedir duplicação permanente indevida no mesmo save.

## Tarefa 23 — Coração

Implementar pickup que recupera 1 coração sem exceder máximo.

## Tarefa 24 — 1-UP físico

Inserir exatamente 1 vida extra escondida na fase, separada da vida obtida por 50 selos.

## Tarefa 25 — Caixa de correio/checkpoint

Adicionar pelo menos 1 checkpoint principal aproximadamente após metade da fase. Deve levantar bandeira, tocar SFX, registrar posição e servir de respawn.

---

# ÉPICO 08 — Dano, morte e continue

## Tarefa 26 — Sistema de corações

3 corações máximos, dano de 1 coração, invulnerabilidade temporária, feedback de hit e knockback controlado.

## Tarefa 27 — Queda fatal

Definir kill zone e respawn. Evitar perder várias vidas pelo mesmo evento.

## Tarefa 28 — Morte e respawn

Executar animação curta, consumir 1 vida e retornar ao checkpoint. Resetar inimigos/objetos conforme regra consistente.

## Tarefa 29 — Game Over / Continue

Ao zerar vidas, abrir GameOverScene com `CONTINUE?`. Sim reinicia a fase com 3 vidas; não retorna ao menu/mapa conforme decisão final. Nunca apagar progresso global.

---

# ÉPICO 09 — HUD e telas necessárias para 1-1

## Tarefa 30 — HUD definitivo do vertical slice

Exibir com leitura rápida:
- ♥ corações;
- × vidas;
- selos;
- cartões da fase;
- munição especial somente quando existir.

Não cobrir área significativa do gameplay.

## Tarefa 31 — Title Screen provisória de qualidade

Criar composição pixel art coerente com o jogo, `ESTALO 88` como título de trabalho e `PRESS START`. Pode ser refinada depois, mas não deve parecer formulário web.

## Tarefa 32 — Menu mínimo

Para o vertical slice, Novo Jogo e Continuar podem ser os fluxos funcionais principais. Opções ainda podem ser reduzidas, desde que áudio/controles essenciais estejam acessíveis.

## Tarefa 33 — Mapa de transporte mínimo

Exibir 1-1 ativa e demais estações bloqueadas/sem produção. Não implementar conteúdo das outras fases.

## Tarefa 34 — Pré-fase

Exibir `1-1 — Telhados do Mercado`, cartões coletados e melhor tempo quando houver.

## Tarefa 35 — Stage Clear

Exibir tempo, selos, inimigos derrotados, cartões e score. Permitir retornar ao mapa/rejogar conforme fluxo definido.

## Tarefa 36 — Pause

Continuar, reiniciar fase, controles e sair para mapa. Pausa deve congelar física e timers relevantes.

---

# ÉPICO 10 — Arte da Fase 1-1

## Tarefa 37 — Tileset Telhados do Mercado

Criar tileset 16×16 com:
- telhados;
- paredes;
- bordas;
- caixas;
- toldos;
- placas;
- estruturas de mercado;
- elementos de colisão claramente legíveis.

## Tarefa 38 — Background em camadas

Criar céu, skyline distante e camada intermediária com parallax leve. O fundo nunca pode competir visualmente com jogador, inimigos, projéteis e plataformas.

## Tarefa 39 — Sprites dos três inimigos

Cada inimigo precisa de silhueta própria, telegraph visual e animação suficiente para não parecer objeto estático arrastado.

## Tarefa 40 — Itens e efeitos

Produzir sprites/animações para:
- selo;
- cartão-postal;
- coração;
- 1-UP;
- caixa de correio;
- pedra/projétil;
- impacto;
- poeira de corrida/pouso quando adequado;
- hit feedback.

## Tarefa 41 — Revisão visual de legibilidade

Capturar screenshots de cada ato da fase e validar se jogador, inimigos, obstáculos e coletáveis são identificáveis sem precisar conhecer o código.

---

# ÉPICO 11 — Áudio da Fase 1-1

## Tarefa 42 — Tema musical 1-1

Criar faixa chiptune melódica própria para Telhados do Mercado. Deve transmitir manhã ensolarada, movimento e aventura urbana. Loop sem corte perceptível e sem copiar melodias de referências.

## Tarefa 43 — SFX essenciais

Criar/integrar:
- pulo;
- estilingue;
- tiro carregado;
- impacto;
- inimigo derrotado;
- dano;
- morte;
- selo;
- cartão;
- coração;
- 1-UP;
- checkpoint;
- puzzle acionado;
- stage clear.

## Tarefa 44 — Mixer básico

Separar volume de música e SFX. Evitar clipping quando vários selos/projéteis são processados em sequência.

---

# ÉPICO 12 — Save e métricas

## Tarefa 45 — Save local versionado

Salvar em localStorage:
- versão do schema;
- fase desbloqueada;
- cartões coletados;
- melhor tempo;
- configurações essenciais.

Falha/corrupção do save deve cair para estado seguro, não quebrar o boot.

## Tarefa 46 — Cronômetro e melhor tempo

Medir tempo efetivo de gameplay. Pausa não conta. Stage Clear registra melhor tempo.

## Tarefa 47 — Score simples

Definir fórmula baseada em selos, inimigos, cartões e tempo apenas se ela não atrapalhar a clareza. Não criar economia ou progressão em torno do score.

---

# ÉPICO 13 — Qualidade, responsividade e performance

## Tarefa 48 — Teclado e gamepad

Validar teclado e pelo menos layout padrão de gamepad. Não bloquear futuras remap options, mas evitar criar sistema complexo de configuração antes do vertical slice.

## Tarefa 49 — Escala desktop/mobile browser

Canvas deve preservar proporção, ocupar o maior espaço possível sem deformar e manter pixel art nítida. Em celular, o canvas deve adaptar-se à área disponível; controles touch são tarefa futura separada caso entrem no escopo do primeiro release.

## Tarefa 50 — Câmera

Follow suave sem atraso excessivo. Look-ahead horizontal discreto pode ser testado. Impedir mostrar área fora do mapa.

## Tarefa 51 — Performance

Meta de 60 FPS em hardware desktop comum. Evitar criar/destroçar objetos por frame desnecessariamente. Usar pools quando projéteis/efeitos justificarem.

## Tarefa 52 — Testes manuais obrigatórios

Executar pelo menos:
- concluir fase sem morrer;
- concluir perdendo 1 vida;
- zerar vidas e continuar;
- ativar checkpoint e morrer antes/depois dele;
- pegar 50 selos e ganhar vida;
- coletar os 3 cartões;
- coletar coração cheio e ferido;
- encontrar 1-UP;
- matar cada inimigo com tiro normal;
- validar tiro carregado;
- pular/atirar simultaneamente;
- pausar durante movimento;
- reiniciar fase;
- recarregar navegador e restaurar save;
- concluir em diferentes tamanhos de janela.

## Tarefa 53 — Build de produção

`npm run typecheck` e `npm run build` devem finalizar sem erro. Testar build de produção via preview, não apenas dev server.

---

# ÉPICO 14 — Polimento final do vertical slice

## Tarefa 54 — Game feel

Revisar:
- screen shake muito sutil em impactos relevantes;
- hit stop curto quando apropriado;
- partículas pixeladas;
- SFX sincronizados;
- pouso;
- recoil visual do estilingue;
- feedback de carga;
- feedback de coleta.

Tudo deve melhorar leitura, não virar excesso visual.

## Tarefa 55 — Balanceamento

Ajustar posições de inimigos e plataformas depois de jogar a fase repetidamente. A primeira metade deve ensinar; a segunda combinar. Remover mortes baratas e trechos vazios.

## Tarefa 56 — Auditoria de identidade

Revisar a fase procurando elementos que pareçam cópia direta de Sonic, Mario, Batman, Road Fighter ou outro jogo. Referências devem existir em filosofia de design, não em layout, inimigo, personagem, música ou asset.

## Tarefa 57 — Gate de aprovação

A Fase 1-1 só é aprovada quando:
- é divertida sem conteúdo futuro;
- personagem não usa placeholder;
- todos os assets principais são sprites/pixel art finais;
- estilingue é satisfatório;
- 3 inimigos têm comportamento distinto;
- puzzle é claro;
- 3 cartões e 1-UP funcionam;
- checkpoint funciona;
- morte/continue funcionam;
- HUD e Stage Clear funcionam;
- música/SFX funcionam;
- build passa;
- não há bug bloqueador conhecido.

**Somente depois deste gate será escrita a Bíblia detalhada da Fase 1-2 e das etapas seguintes.**
