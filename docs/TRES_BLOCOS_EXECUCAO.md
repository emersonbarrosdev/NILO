# NILO — execução dos três blocos corrigidos

Direção recebida em4/11/2026. Fonte de verdade: pacote `NILO_TRES_BLOCOS_REFERENCIAS_CORRIGIDAS` do Diretor. Os textos do pacote prevalecem sobre HUDs antigos nos mockups. Mockups não serão recortados como assets.

## Correção do trabalho anterior

O personagem simplificado `player-pixel` foi explicitamente reprovado. Sua aprovação técnica anterior de alternância não representa aprovação de identidade visual. Será desativado; as fontes detalhadas originais são preservadas e recuperadas. Menu, logo e floresta aprovados permanecem. Render e mundo têm configurações distintas para manter detalhes em telas atuais.

## Execução e modelos

1. Bloco1: sessão delegada `bloco1_astra`, modelo solicitado `gpt-6-astra`, esforço `xhigh` (Extra High), iniciada pela ferramenta de colaboração. Personagem, ciclo e bastão antes dos outros blocos.
2. Bloco2: Sol6.1 High, após validação e commit do primeiro bloco.
3. Bloco3: Astra High, após validação e commit do segundo bloco.

Não será afirmada troca de modelo sem chamada real correspondente. Auditorias, testes e limitações serão registrados neste documento. Aprovação artística final pertence ao Diretor.

## Contrato final

- NILO original detalhado, oito poses anatômicas reais e bastão físico único.
- Clareira inicial fixa e calma; laboratório separado acessível apenas em desenvolvimento.
- HUD: rosto×vidas, duas folhas, SCORE, TIME sem relógio, bússola com contador acumulativo sem denominador. Sem ícone permanente do bastão.
- Dois danos por vida; fruta recupera uma folha; marcador persistente e idempotente, vida extra em100/200/300 sem zerar contador.
- JOGAR apresenta nove cenas, depois loading e clareira. CONTINUAR restaura o save sem intro.
- PC/Android compartilham física e escala lógica; apresentação16:9 segura e touch adaptado em landscape.
- Sem expansão de fases nesta entrega.

## Evidências e resultados

### Bloco 1 — validação técnica concluída

- Astra Extra High executou a restauração; houve interrupção por limite de uso, retomada após o pedido do Diretor. Não houve troca fictícia de modelo.
- Atlas original detalhado: 88 células, resolução de textura 4, corpo lógico 32×32. Oito poses novas de caminhada, oito de corrida e oito de empurrar agachado; demais poses originais reutilizadas por catálogo, sem duplicatas de equipamento.
- Corrida: 118 → 103 unidades/s (−12,7%); passada de 48 unidades, cerca de 17 quadros/s na velocidade máxima. Pulo preservado. Transporte passivo por plataforma não avança o ciclo.
- Bastão: um objeto físico, 18×4 unidades em todos os estados; preparação de 180 ms, soltura na mão, recuperação por K, sem duplicação.
- Sessão Astra: build aprovado; 15 testes de locomotion/player-art/block1 aprovados, mais 1 teste dirigido de melee aprovado. Aviso de bundle JavaScript grande permanece.
- Revisão independente: `npx playwright test tests/presentation.spec.ts --reporter=line`: **12/12 aprovados**, 1,1 minuto. PC 1280×720, 1920×1080, 2560×1440 e 3840×2160; fullscreen/janela e resize; Android emulado 960×432, 800×450 e 932×430, insets e controles fora da gameplay. Escala lógica do personagem/bastão e gravidade iguais.
- Contact sheets anotadas, GIFs e capturas reais em `artifacts/bloco1/` e `artifacts/block1-*.png`; revisão visual confirmou recuperação da identidade e apoio. A anatomia é uma revisão visual manual, não uma conclusão baseada apenas em hashes ou nomes dos frames. Aprovação artística final pertence ao Diretor.
- Limitações: emulação de viewport Android não testa GPU/desempenho de um Galaxy S20 físico. Não houve essa medição nem alegação de aprovação em aparelho.

### Próximos blocos

Blocos 2 e 3 ainda não concluídos. O HUD legado e os objetos na tela de laboratório nas capturas do Bloco 1 serão substituídos/isolados pelo Bloco 2 conforme o contrato; não representam o começo final da aventura.
