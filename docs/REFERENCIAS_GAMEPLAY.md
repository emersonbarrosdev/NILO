# Referências de gameplay — NILO

Pesquisa visual em 3/11/2026. Screenshots de jogos comerciais foram consultadas apenas como referência. Não entraram em assets, instaladores, APK ou build. As observações abaixo são análise de composição, não cópia de mapas/personagens e não medição da física desses jogos.

| Jogo / versão verificada | Screenshot e origem | Leitura aplicada ao laboratório |
|---|---|---|
| Super Mario World — SNES | [Gameplay oficial Nintendo, painel de ação à direita](https://www.nintendo.co.jp/wii/vc/vc_smw/img/page_03/03_ph_c.gif), [contexto](https://www.nintendo.co.jp/wii/vc/vc_smw/vc_smw_03.html) | Piso com borda inequívoca, HUD separado e espaço livre ao redor do personagem. A captura oficial é pequena; outra imagem ampliada com filtro foi descartada como referência de nitidez. |
| Super Mario Bros. 3 — NES | [Gameplay World 1](https://bitjumpgames.com/cdn/shop/files/10144510-super-mario-bros-3-nes-starting-the-game.jpg?v=1772490117&width=1500), [origem](https://bitjumpgames.com/products/super-mario-bros-3-nes) | Faixa superior contínua do chão e módulos reconhecíveis. Retângulos de colisão devem coincidir com o apoio visível. |
| Sonic the Hedgehog — Master System | [Jungle Zone](https://www.bojoga.com.br/files/2010/03/Sonic-the-Hedgehog005.jpg), [acervo Bojogá](https://bojoga.com.br/artigos/retroplay/master-system/sonic-the-hedgehog-master-system-1991-sega/) | Verde escuro de fundo e madeira dourada jogável; grandes massas florestais, poucos planos e silhuetas claras. Conferido Master System, não Mega Drive nem Game Gear. |
| Chip 'n Dale Rescue Rangers — NES | [Caixas e personagem carregando objeto](https://retrorules.weebly.com/uploads/2/3/8/4/23842228/1918668_orig.jpeg), [origem](https://retrorules.weebly.com/chip-n-dale-rescue-rangers.html) | Objeto destacado acima das mãos e forma consistente entre cenário e objeto utilizável. Em NILO, estado com/sem taco e recuperação são legíveis; caixas servem de apoio. |
| Castlevania — NES | [Gameplay Stage 05](https://www.bojoga.com.br/files/2010/03/Castlevania-Akumajou-Dracula-04.png), [acervo](https://bojoga.com.br/artigos/retroplay/nes/castlevania-konami-1986/) | Personagem quente contra fundo escuro e patamares horizontais fortes, apesar do cenário denso. |
| Batman — NES / Sunsoft | [Gameplay](https://i0.wp.com/twentiethcenturygamer.wordpress.com/wp-content/uploads/2020/06/dsc_372801.png?ssl=1), [origem](https://twentiethcenturygamer.wordpress.com/2017/06/07/batman-the-video-game-nes/) | Silhueta luminosa e áreas de fundo quase pretas preservam leitura. A imagem é fotografada; não foi usada como amostra exata de pixel. |
| Mighty Morphin Power Rangers — SNES, 1994 | [Combate em forma civil](https://miro.medium.com/v2/resize:fit:1400/1*q2fcZrfZFPNGB63vHxjeCw.jpeg), [captura do autor](https://xander51.medium.com/that-one-time-i-finished-a-power-rangers-game-in-45-minutes-d497603d1ba7) | Postura e alcance do ataque reconhecíveis, chão de combate livre. Não adotamos a escala grande de beat 'em up: NILO mantém espaço para salto e floresta maior que o menino. |

## Decisões próprias

- Manter o personagem cartoon aprovado, com 12 poses novas de corrida e cabeça registrada para reduzir saltos entre quadros.
- Passada avança pela distância percorrida; no repouso, somente duas poses com permanência longa. O menu não usa sprite de gameplay ampliada.
- Fundo do laboratório usa árvores do atlas em planos de contraste menor; chão, troncos, caixas, cobra e personagem conservam destaque.
- Um único plano de apoio para arte e colisão dos três tipos de tronco.
- Menu com logo NILO, texto de arcade e seta; sem cartões empilhados ou subtítulo antigo.
- HUD do laboratório limitado a vidas e disponibilidade do taco. Informação de colecionáveis do percurso completo só aparece no preset correspondente.
- Layout PC/Android mantém o mesmo recorte lógico da gameplay. Margens de touch não são parte do mundo.
