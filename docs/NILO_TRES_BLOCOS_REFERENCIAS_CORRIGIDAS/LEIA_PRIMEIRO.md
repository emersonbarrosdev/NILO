# NILO — PACOTE DE REFERÊNCIAS E TAREFAS (REV. FINAL)

## Decisões do Diretor do Jogo
1. Personagem original (spritesheets fornecidas pelo diretor) é o único design canônico. Proibido substituí-lo por sprite chibi/simplificado.
2. Menu inicial atual, LOGO e cenário de floresta estão APROVADOS. Apenas remover sombra/retângulo translúcido indevido sob textos. Imagens geradas de menu são **referências secundárias**, nunca autorizações para refazer o design aprovado.
3. Pixel art MODERADA: sprites nítidos sem blur e sem pixels gigantes. Referência visual: qualidade do menu atual. Filtro retrô leve, opcional; não degradar o fundo ou a legibilidade.
4. HUD canônico: retrato NILO ×3 + **2 FOLHAS DE FÔLEGO**; SCORE 000000; TIME 00:00 **SEM relógio**; ÍCONE DE BÚSSOLA + **contador acumulativo 000 SEM /10**.
5. Marcadores de Trilha (ícone bússola) acumulam para sempre ao longo do save; em cada múltiplo de 100 (100, 200, 300...) +1 VIDA, sem zerar contador; impedir concessão duplicada ao reiniciar/recarregar.
6. Fruta do Fôlego (fruta original vermelha/alaranjada, bem distinta da bússola) restaura +1 FOLHA até o limite de 2. Nilo aguenta 2 danos por vida; se fôlego acabar, perde 1 vida e respawna com fôlego cheio. Invulnerabilidade após primeiro dano.
7. Começo da aventura: **uma tela FIXA E CALMA** com terreno, plantas, personagens, poucos marcadores; **SEM troncos flutuantes, caixas e inimigos**. Ações complexas em um LABORATÓRIO DE TESTES SEPARADO, também de uma tela fixa, acessível apenas em modo de desenvolvimento. Não expandir o jogo agora.
8. Nilo deve sempre estar com o bastão quando equipado; no arremesso o bastão sai da mão e depois é mostrado no chão quando cai; manter tamanho físico idêntico durante o voo; sem bastão na mão quando está no chão.
9. PC e Android (Samsung Galaxy S20 landscape), gameplay única, viewport e controles adaptativos, 60 fps como meta medida (não presumida).
10. Execução: BLOCO 1 Astra Extra High; BLOCO 2 Sol 6.1 High; BLOCO 3 Astra High. Se a sessão Codex não suporta troca automática de modelo, trocar manualmente entre sessões/blocos — não fingir troca. QA após cada bloco e commit convencional em espanhol. Não pedir confirmação entre subtarefas, mas registrar bloqueios e resultados reais.

## Arquivos e hierarquia visual
- `01_menu_original_aprovado.png`: fonte de verdade do menu (imagem do usuário).
- `02_audio_referencia.png`, `03_controles_referencia.png`, `04_pausa_referencia.png`: referências de layout/estilo, não fonte de verdade para textos ou configurações.
- `05_inicio_limpo_composicao.png`: composição do início sem obstáculos, porém **o HUD da imagem é antigo e não deve ser copiado**. Implementar o HUD canônico descrito acima e no guia atualizado.
- `06_combate_bastao_composicao.png`: referência para o personagem com bastão atingindo inimigo; HUD/imagens têm caráter conceitual.
- `07_plataformas_fixas.png`, `08_plataformas_moveis.png`, `09_plataformas_especiais.png`: demonstração de **fases futuras** ou laboratório, **não** do começo da aventura.
- `10_guia_hud_fruta_cutscene_blocos.png`: GUIA MAIS ATUALIZADO para o HUD sem relógio, contador acumulativo e fruta recuperadora. A arte é conceitual, não pronta para cortar como sprite.
- `11_guia_visual_multitela.png`: panorama visual geral atualizado.
- `12_gameplay_original_usuario.png`: screenshot da implementação que deve ser inspecionada; personagem simplificado está REPROVADO.

## ATENÇÃO
Não recortar imagens de mockup como assets de produção, não extrair ícones de screenshots, não assumir screenshots como testes. As spritesheets canônicas do personagem foram compartilhadas anteriormente na conversa; obter os arquivos originais do repositório/attachments e inspecionar cada frame.
