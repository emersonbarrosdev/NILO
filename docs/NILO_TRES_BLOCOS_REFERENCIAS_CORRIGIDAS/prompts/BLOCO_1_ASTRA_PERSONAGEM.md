# BLOCO 1 — ASTRA / EXTRA HIGH — NILO ORIGINAL, SPRITESHEETS, ANIMAÇÕES E BASTÃO

**Prioridade crítica. Executar ANTES dos outros blocos.**

Atue como equipe multiagente com [DEV_GAME] (engenheiro sênior de gameplay e matemática), [ART_DIRECTOR] (pixel artist e diretor técnico de arte) e [QA_DATA] (validador rigoroso). O Diretor do Jogo aprovou a identidade original de NILO e reprovou completamente o personagem simplificado mostrado no último screenshot. Sua missão é recuperar o personagem original das spritesheets/repositório, corrigir seus frames, conectar as animações à gameplay e validar visual e matematicamente. **IMPLEMENTAR, NÃO APENAS DESCREVER.**

## 1. Auditoria não destrutiva
- Inspecionar engine/stack reais, animações, assets, loaders, atlas, cena Phaser/Canvas, configurações, Git e worktree. Salvar/identificar versão original do personagem; nunca `reset --hard`, descartar alterações do usuário nem mudar a estética base.
- Identificar spritesheets do Nilo detalhado (cabelo castanho encaracolado volumoso, rosto expressivo, camisa clara, colete, shorts, botas e mochila). A referência enviada possui poses com bastão e sem bastão. Restaurá-las antes de implementar qualquer nova pose. Não usar o sprite pixelizado grosseiro criado posteriormente como base.
- Validar recortes, grid, dimensões, alpha real, contornos sem halos vermelhos, alinhamento dos pés, pivôs, direção, escala e carregamento no jogo. Só reprojetar frames específicos que estejam ausentes ou inconsistentes, sem reinventar o Nilo.

## 2. Catálogo mínimo completo e extensível
Criar organização por estado e equipamento. Estados: `idle`, `blink`, `walk`, `run`, `start_run`, `brake`, `turn`, `jump_start`, `jump_up`, `fall`, `land`, `crouch`, `crouch_move` se existir, `push_standing`, `push_crouched`, `push_blocked`, `melee`, `throw_prepare`, `throw_release`, `throw_recover`, `retrieve_bat`, `hurt`, `knockback`, `stunned`, `defeat`, `respawn`. Para os estados aplicáveis, variantes `WITH_BAT` e `WITHOUT_BAT` usando os mesmos proporção, roupa e rosto. Não gerar duplicatas desnecessárias, usar composição em camadas quando viável e respeitar assets reais. Não inventar ações que ainda não existem, mas preparar estados sem quebrar a gameplay.
- Criar animações de Nilo **empurrando em pé e agachado** com contato das mãos e pés, expressão de esforço e reação quando bloqueado.
- Quando bastão está em voo/chão, usar sprites **sem** bastão. Quando equipado, mostrá-lo na mão em idle/caminhada/corrida/agachar/ataque; transições precisas.

## 3. Walk Cycle de 8 frames — alternância anatômica real
Exigir oito POSES VISUALMENTE DISTINTAS por ciclo; a perna da frente alterna de verdade. A diferença não pode ser só o nome de frame ou um contador.
```
0 contato direito: pé direito à frente inicia apoio, esquerdo atrás
1 amortecimento direito: joelho direito flexiona, esquerda recupera
2 passagem direita: direita em apoio, esquerda passa pelo corpo
3 impulsão direita: direita conclui apoio, esquerda prepara contato
4 contato esquerdo: pé esquerdo à frente, direito atrás
5 amortecimento esquerdo: esquerda absorve peso, direita recupera
6 passagem esquerda: esquerda em apoio, direita passa pelo corpo
7 impulsão esquerda: esquerda conclui apoio, direita prepara contato
```
- A identidade anatômica das pernas deve ser auditável em cada frame: identificar perna do primeiro plano e segundo plano de modo consistente. Checar contato dos pés em GIF/contact sheet. O sprite deve alternar física e visualmente; não usar somente matemática para mascarar sprites errados.
- Matemática universal agnóstica de engine: `rightPhase = phase`, `leftPhase = (phase + PI) mod TAU`; usar progressão por distância realmente percorrida `phase += abs(deltaX_ground_relative) / strideLength * TAU` e `frame = floor(phase / (TAU/8)) mod 8`. Distância relativa ao chão **não** inclui deslocamento passivo por plataforma móvel; não mover os pés durante idle sobre a plataforma.
- Para CAMINHADA, garantir contato de apoio de ao menos um pé nos instantes exigidos; para CORRIDA permitir fase aérea deliberada — não impor apoio contínuo incompatível com corrida. Braços em oposição apropriada, respeitando o bastão.
- Trava de deslizamento deve detectar falha no avanço **lógico** do ciclo, não ausência de troca de sprite em cada update (frame pode durar vários ticks). Não bloquear pulo, knockback, aterrissagem, transporte por plataforma ou idle; não atrelar a física rigidamente à taxa de desenho.
- Reduzir velocidade horizontal de corrida inicialmente ~10–15%, calibrar com comprimento de passada/colisões e sem alterar a altura/velocidade do pulo automaticamente.

## 4. Bastão canônico e arremesso crível
- Criar configurações centralizadas `bat.length`, `bat.thickness`, `bat.gripAnchor`, `bat.releaseAnchor`, `bat.scale`. Corrigir tamanho do bastão: um pouco maior na mão, não gigante em voo. Comprimento físico/escala canônicos inalterados entre `HELD`, `MELEE`, `PREPARE`, `RELEASE`, `FLYING`, `BOUNCING`, `GROUND`, `RECOVERED`. AABB pode variar por rotação, mas comprimento real não.
- Arremesso tem wind-up, braço e corpo impulsionando, frame exato de soltura a partir da mão, projétil, follow-through e estado desequipado. Sem teleporte, pop de escala nem bastão duplicado na mão/no mundo.
- Ataque com bastão na mão (melee) é distinto de lançar bastão (throw). Preservar teclas e regras existentes; preparar impacto/ricochete para Bloco 2, sem duplicar física.
- Validar parado, andando, para ambos os lados e no ar **somente quando esses ataques forem permitidos**.

## 5. QA de verdade
[QA_DATA] deve criar testes de defasagem modular de PI, sequência 0..7, deslocamento→cadência, neutralidade sobre plataforma, contato de caminhada, ausência de animação de caminhada no ar, transições COM/SEM bastão e invariância da escala canônica. Registrar casos reprovados e correções; não inventar aprovação.
- Gerar contato visual dos oito frames com pernas DIREITA/ESQUERDA identificadas, GIF da caminhada/corrida, sequências de empurrar em pé/agachado, arremesso e bastão no chão. Abrir jogo em navegador se possível; não substituir QA visual por unit tests.
- Build/testes e screenshots do jogo REAL. Se o ambiente não permitir execução visual, declarar o bloqueio; não alegar que foi aprovado visualmente.

## 6. Regras de entrega
- Não redesenhar fundo/menu, não expandir mapa, não alterar pixelização global nesta tarefa além de ajuste mínimo necessário ao personagem.
- Commit Conventional Commits em espanhol (es-ES), preservar worktree, evitar push forçado; se push permitido na branch de trabalho, registrar. Relatar arquivos alterados, assets, testes, GIFs/sheets, causa da falha e pendências.
- Se os assets originais não estiverem no repositório, localizar os anexos disponibilizados e **não inventar um substituto**. Declarar somente a dependência material não resolvida.

**DEFINIÇÃO DE PRONTO:** Nilo ORIGINAL em todos os estados, oito frames realmente alternados, bastão de tamanho constante, arremesso convincente, testes e evidência visual reais.
