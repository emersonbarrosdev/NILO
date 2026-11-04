# BLOCO 2 — SOL 6.1 / HIGH — GAMEPLAY, FÔLEGO, BÚSSOLAS, PLATAFORMAS, HUD E FILTRO 2D

**Pré-requisito:** Bloco 1 entregue sem regressão. Executar com [DEV_GAME], [ART_DIRECTOR] e [QA_DATA], testando e implementando cada subsistema. NÃO substituir o personagem nem os cenários/menu aprovados. Os mockups do pacote são REFERÊNCIAS, mas a especificação escrita tem precedência se contiverem HUD antigo.

## 1. Duas cenas fixas, sem expansão
- `START_CLEARING`: **primeira tela da aventura**, calma, floresta bonita, chão, Nilo ORIGINAL com bastão na mão e 1–3 Marcadores de Trilha para demonstrar coleta; SEM troncos/plataformas flutuantes, caixas e inimigos. Não é permitido avançar horizontalmente ainda; câmera fixa, mundo igual ao viewport lógico. Não colocar fruta de cura se Nilo estiver 2/2 de Fôlego (sem necessidade); introduzir quando ferido futuramente.
- `DEV_LAB`: laboratório técnico SEPARADO, também uma tela fixa, não mostrado no fluxo normal de JOGAR. Nele testar plataformas, caixas, cobra, ricochete e fruta. Os screenshots de plataformas se referem ao laboratório ou fases futuras e NÃO determinam o layout do começo da história.
- Separar `worldSize`, `cameraSize`, `viewport`, `rendererSize`, `levelConfig` para expansão FUTURA a 512 unidades, sem implementar scrolling ou fases agora.

## 2. HUD FINAL — obrigatório
- À esquerda: retrato do rosto ORIGINAL + `×3` vidas e duas **FOLHAS de Fôlego** pequenas (cheias ou apagadas conforme dano). Não trocar as folhas por fruta: fruta é o item de recuperação, folhas são o indicador persistente.
- Centro: `SCORE 000000`.
- Depois: `TIME 00:00` **SEM nenhum ícone/relógio/desenho de cronômetro**. Tempo decorrido, pausa congela, formato MM:SS; não pressionar por tempo limite nesta demo.
- À direita: **um ícone pequeno de bússola + contador simples `000`** (ou 001, 099, 100, 200). Proibido `00/10`, meta fixa na tela ou reinício do contador em 100.
- **Não mostrar ícone permanente do bastão no HUD.** Bastão aparece na mão, no voo ou no chão, conforme estado. HUD legível no PC e Android 20:9 (Galaxy S20 landscape), não cobrir o personagem/controles.

## 3. Dois danos por vida — Fôlego
- `maxBreath=2`, `currentBreath=2`, `lives=3`. Dano válido reduz `currentBreath` em 1; ao zerar, animação de derrota, `lives -= 1`, respawn e restauro para `maxBreath`. Invulnerabilidade breve (~1,2 s, ajustável) após o primeiro dano para evitar perda imediata do segundo por uma única colisão. Não acumular múltiplos danos no mesmo frame.
- Fruta única original (ex.: **Fruta do Fôlego**, fruto avermelhado/alaranjado com detalhe de folha) recupera **+1 folha** até o limite de 2 e nunca concede vida por si. Criar pickup animado, pequena emissão de partículas, som e atualização imediata do HUD. Se estiver 2/2, tratar sem desperdício involuntário (não consumir até necessário, ou bloquear consumo conforme decisão documentada). Testar Nilo recolhendo fruta após dano.
- Animar o dano ao personagem: expressão, knockback leve, invulnerabilidade visível, derrota sem violência gráfica, respawn.

## 4. Marcadores de Trilha — bússola, contador acumulativo e bônus a cada 100
- O item colecionável comum é um **Marcador de Trilha** pequeno com símbolo de bússola dourada original; não é uma bússola funcional usada pelo personagem, mas um símbolo de orientação/aventura. Deve ser visualmente diferente da Fruta do Fôlego.
- O contador `totalTrailMarkers` é CUMULATIVO no save e permanece após mudar de fase. Mostrar `000`, `001`, ... `099`, `100`, `101`, ... `200` etc.; sem `/10`.
- A cada limiar múltiplo positivo de 100: `100 -> +1 vida`, `200 -> +1 vida`, `300 -> +1 vida` etc. Não zerar contador ao atingir limiar. Permitir contar 999+ com largura responsiva do HUD. Limitar vidas somente se uma regra explícita for definida, não inventar limite.
- Controle anti-farm: cada item de fase possui ID persistente; evitar premiar repetidamente o mesmo marcador por reiniciar/recarregar/entrar e sair da tela. Persistir `lastAwardedMilestone` ou equivalente, evitando crédito duplicado no carregamento do save. Garantir coleta idempotente.
- Testar marcos 0, 1, 99, 100, 101, 199, 200, 201, reload em 100/200, reinício da fase e vidas antes/depois. HUD deve mostrar soma acumulada, não alvo da fase.
- `score` separado de `totalTrailMarkers`. Coleta pode gerar pontos (tabela central de regras), mas não confundir score com vidas. Sem lógica de perder todos os marcadores ao levar dano — não copiar exatamente Sonic.

## 5. Bastão, caixas e inimigos
- Preservar bastão de escala canônica do Bloco 1. `MELEE` = Nilo segura e atinge; `THROW` = bastão é lançado, gira mantendo dimensões e pode quicar moderadamente em chão/pedra/inimigo/caixa, dissipar energia, cair, ficar visível no mundo, ser recuperado com interação. Sem ricochete infinito nem teleporte.
- Criar splash de impacto pequeno como efeito por spritesheet/partícula original (não redesenhar o inimigo para cada pancada). Partículas breves + knockback e hitstop discreto; sem sangue. Animais (cobra etc.) devem ter `hurt`, `stun`, `retreat` e desaparecimento/derrota leve conforme regra definida, não necessariamente morte violenta. Nilo também anima reação e derrota.
- `CRATE_BREAKABLE`: madeira rachada/frágil, destruível, fragmentos de madeira. `CRATE_PUSHABLE`: madeira robusta + metal/correntes; só empurrável, não se quebra com golpe normal. Ambos com colisão e feedback; Nilo usa sprites PUSH_STANDING e PUSH_CROUCHED reais do Bloco 1.

## 6. Plataformas de tronco (somente LAB; evitar excesso)
- Três famílias configuráveis: FIXA (curta/média/longa), MÓVEL (horizontal, vertical, ponte longa), ESPECIAL (instável/que cai/tronco longo com inimigo). Todo tronco precisa parecer parte de uma árvore: casca e anéis de madeira nas extremidades, musgo, raízes/trepadeiras discretas, sombra e superfície de apoio legível. Não encher o cenário de plataformas repetidas.
- Móveis estão rápidas: reduzir velocidade inicial em ~20–30% e calibrar por testes; permitir inversão suave em pontos de retorno, sem teleporte. Transportar personagem apoiado sem patinação ou deslocamento relativo incorreto.
- Queda/colapso: animar aviso visual, pequena vibração e queda; colisões coerentes, reset previsível. Tronco comprido com cobra ou outro animal só no laboratório/demais fases. Separar lógica de movimento, renderização e colisão; limites configuráveis e sem hardcodes de viewport.

## 7. Filtro do jogo 2D: retrô LEVE, não hiper-pixelado
- **Padrão visual é o print do MENU ORIGINAL aprovado**: floresta detalhada, sprites nítidos e um toque retrô. Não aplicar posterização extrema, downsampling grosseiro, scanlines fortes, CRT curvo, blur/bloom excessivo. Proibido transformar personagens HD em bonecos de 12 pixels.
- Inspecionar resolução/assets atuais. Preferir avaliar **640×360** de resolução lógica interna para 16:9 (ou preservar uma base existente equivalente se ficar melhor); **NÃO forçar 320×180** quando destruir a riqueza de detalhes aprovada. Usar nearest-neighbor/pixelArt para sprites de baixa resolução, mas respeitar texturas de background já aprovadas e evitar tremulação, moiré e escala inconsistente. Priorizar scaling inteiro quando viável.
- Oferecer, se simples, presets visuais `NÍTIDO (padrão)` e `RETRÔ SUAVE (opcional)`, sem refazer menu original. Nada de tornar filtro agressivo padrão. Testar em 720p, 1080p, 1440p, 4K e viewport Galaxy S20 landscape sem distorção.

## 8. Controles, áudio, desempenho
- Preservar bindings PC/controle existentes e suporte touch Android. Se estiverem faltando, implementar ações mínimas para andar, pular, bater e lançar/recuperar, com multitouch e safe area; não sobrepor HUD. Física do gameplay única para PC/Android, separar coordenadas do mundo das coordenadas CSS/tela.
- Meta 60 FPS medida em execução. Não afirmar desempenho no Galaxy S20 real sem aparelho; emulação de viewport não equivale a performance real. Evitar filtros pesados e GC desnecessário.

## 9. Validação e entrega
[QA_DATA] deve inspecionar os HUDs reais e testar: sem relógio; bússola 000 e contador acumulado sem `/10`; marcos 100/200 com +1 vida, sem duplicação; dois danos por vida e fruta +1 folha; primeiro cenário totalmente limpo; laboratório isolado; taco no mundo vs mão; quique/física; caixas distintas; plataformas mais lentas/sem foot sliding; efeitos; PC/Android.
- Execução real no navegador + testes automatizados + build; comparar prints e gerar GIF/frames dos estados. Se não puder validar visualmente, relatar limitação sem afirmar aprovação.
- Commit Conventional Commits **es-ES**, sem reset destrutivo nem push forçado. Relatório de arquivos, testes, capturas, pendências. Não expandir o level.

**DEFINIÇÃO DE PRONTO:** Menu/gameplay preservados, início limpo, HUD correto, fôlego e fruta, bússola acumulativa + vida a cada 100, plataformas/caixas/inimigos no LAB, filtro moderado e PC/Android sem deformação.
