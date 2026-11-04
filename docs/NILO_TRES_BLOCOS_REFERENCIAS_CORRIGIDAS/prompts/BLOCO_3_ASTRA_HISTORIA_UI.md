# BLOCO 3 — ASTRA / HIGH — HISTÓRIA, CUTSCENE, MENUS, SALVAMENTO E QA FINAL

**Pré-requisitos:** Blocos 1 e 2 implementados, testados e com commit. Você opera como [NARRATIVE_DESIGNER], [UI_GAME], [DEV_GAME] e [QA_DATA]; o Diretor do Jogo valida estilo. Priorizar implementação real e integração sobre planejamento abstrato.

## 1. História oficial — NILO: O Caminho de Volta
Aventura infantojuvenil leve e esperançosa. Nilo acampa com pai, mãe, irmão mais novo e irmã mais velha. Pai brinca com o pequeno; mãe conversa com a mais velha; Nilo tenta chamar atenção, sente-se um pouco de fora. Por curiosidade/tristeza se afasta ao anoitecer, perde a trilha na floresta e corre assustado. Perto de uma queda d'água/desnível rochoso, escorrega para um rio, é arrastado pela correnteza e acorda pela manhã na margem. Com mochila e bastão, entra na floresta para reencontrar a família. A família o ama; **não** caracterizar abandono ou pais malvados, nem tragédia sombria.
- Não desenvolver fases novas agora. Documentar possibilidades futuras: floresta; rio/cachoeira; catacumbas antigas de mistério leve; subida da montanha; topo e retorno ao acampamento. A continuidade deve fazer sentido geográfico e emocional.

## 2. Cutscene de 9 quadros — narrativa em primeira pessoa
Criar nove imagens ORIGINAIS, coerentes entre si e com o design original Nilo, uma por cena. Mostrar texto em primeira pessoa, navegação e transição. Sequência recomendada:
1. Acampamento ao entardecer — "Era para ser só mais um fim de semana acampando com a minha família."
2. Pai/irmão mais novo brincando; mãe/irmã mais velha conversando — "Todo mundo parecia estar se divertindo... menos eu."
3. Nilo sozinho na borda do acampamento — "Eu só queria que alguém percebesse que eu estava ali."
4. Noite chegando; Nilo se afasta — "Resolvi dar uma volta. Achei que conseguiria voltar antes de escurecer."
5. Floresta escura, perdido — "Mas, quando olhei para trás, já não sabia por onde tinha vindo."
6. Corre e cai em desnível no rio — "Tentei encontrar o caminho de volta... até que o chão sumiu debaixo dos meus pés!"
7. Correnteza, sem violência gráfica — "A água estava gelada. A correnteza era forte demais. Eu só consegui me segurar e esperar."
8. Amanhecer na margem — "Quando acordei, o sol já estava nascendo. Eu não fazia ideia de onde estava."
9. Pega mochila e bastão, entra na floresta — "Mas eu sabia de uma coisa: precisava encontrar minha família. E não ia desistir."
- Textos são editáveis em dados JSON/TS, com duração adequada e opção de avançar. Não montar vídeo caro nem bloquear por duração arbitrária. Som ambiente suave e transições leves. **PULAR** sempre visível e funcional em mouse, teclado e touch, cancelando timers/transições/áudio com segurança.

## 3. Fluxos de navegação e salvamento
- `MENU -> JOGAR -> CUTSCENE -> LOADING -> START_CLEARING` (cena inicial limpa do Bloco 2). **JOGAR SEMPRE apresenta a cutscene**, a menos que o jogador pressione PULAR.
- `MENU -> CONTINUAR -> SALVAMENTO -> GAMEPLAY`, **sem cutscene**. Sem save válido, desabilitar CONTINUAR com feedback, não jogar em estado inválido.
- Nenhum login, API ou backend nesta versão. Persistir progresso em armazenamento local já utilizado, com versão/schema, IDs de Marcadores coletados, vidas, fôlego, pontuação, checkpoint e marcos de +1 vida já concedidos. Save deve ser atômico conforme plataforma e não permitir farm de recompensa ao reiniciar.
- `LOADING` visual breve (~3 s de apresentação), respeitando carregamento real de assets; não criar tela travada se falhar.

## 4. Menu inicial aprovado — NÃO REFAZER
O screenshot **01_menu_original_aprovado.png** é fonte de verdade para o menu inicial: logo NILO em laranja, floresta exuberante, opções JOGAR/CONTINUAR/ÁUDIO/CONTROLES, linha "FLORESTA — LABORATÓRIO" apenas se ainda fizer sentido (revisar e substituir por rótulo apropriado ao modo de produção quando o laboratório virar dev-only). **Preservar** a identidade, composição e logo. Corrigir SOMENTE a sombra/camada translúcida indesejada abaixo das opções e pequenas falhas reais. **Não trocar o logo nem refazer o background aprovado** por mockup gerado.
- Referências geradas de menu são inspirações de alinhamento; a captura original é a especificação visual superior.

## 5. Áudio, controles e pausa — padrão comum
- ÁUDIO: painel verde escuro, bordas douradas/verdes discretas, título, alinhamento de volumes GERAL/MÚSICA/EFEITOS e MUDO, sliders reais com 0–100%, controle via teclado/mouse/toque/controle se suportado, persistência, visual atual rejeitado; seguir referência de layout 02.
- CONTROLES: tabela clara ação→tecla, incluindo mover A/D, W para cima/lançar acima quando suportado, S para agachar/descer, Space pular, J bater, K lançar/recuperar. Remapeamento editável apenas se realmente implementado; conflitos validados, restaurar padrões, key hints para gamepad e layout touch. Painel padronizado com áudio e pause. Referência 03.
- PAUSA: mesmo painel, opções CONTINUAR/AJUSTES DE ÁUDIO/CONTROLES/REINICIAR FASE/VOLTAR AO MENU. Física, inimigos, plataformas e timer param; menu permanece navegável; retornar restaura sem duplicar updates, reiniciar faz reset coerente (sem farm), sair salva segundo regras. Referência 04.
- UI geral: componentes reutilizáveis (painel/título/botão/slider/item/overlay/foco/rodapé), sem aparência de formulário corporativo; fontes e botões legíveis no Galaxy S20 landscape, contraste, áreas de toque e safe area. Menu inicial original pode ser mais artístico que menus secundários, mas todos pertencem ao mesmo jogo.

## 6. Pixel art moderada e telas modernas
- Manter filtro 2D **leve** definido no Bloco 2; preservar riqueza do menu e fundo, evitar blur e pixel gigantes. Priorizar aspecto 16:9 lógico com tratamento de telas Android largas sem stretching, cropping de controles ou distorção da física. Respeitar dispositivo landscape, barra de navegação e tela cheia. Não reaplicar filtro mais forte em telas de menu.

## 7. QA final e entrega
- Testar cenas 1..9, PULAR em qualquer uma, pular no último frame, voltar/reiniciar intro, JOGAR sempre mostra intro, CONTINUAR nunca mostra intro, save ausente/íntegro/corrompido, timer pausa, áudio modifica volume, controles funcionam, touch acessível, fonte no PC/Android, nenhum duplo evento ou memory leak.
- Regressão dos Blocos 1/2: sprites originais, oito frames anatômicos, bastão com tamanho constante, HUD sem relógio, folhas de Fôlego e fruta, contador de bússola sem `/10`, vidas extras a 100/200, cena inicial sem troncos/caixas/inimigos, LAB isolado, plataforma lenta, inimigos/efeitos, filtro moderado.
- Gerar comparativos visuais reais menu/áudio/controles/pause/intro/gameplay, registrar FPS medido e limitações (emulador ≠ Galaxy S20 físico). Build, testes e commit Conventional Commits **em espanhol**. Nunca afirmar que um teste foi realizado sem prova.
- Não expandir mapa, não criar login, não alterar arte aprovada, não substituir personagem. Registrar todos os arquivos e pendências para aprovação do Diretor.

**DEFINIÇÃO DE PRONTO:** Nilo original, intro de 9 cenas completa, JOGAR/CONTINUAR corretos, PULAR funcional, menus consistentes, save sem duplicação de recompensa e QA multiplataforma real/limitações descritas.
