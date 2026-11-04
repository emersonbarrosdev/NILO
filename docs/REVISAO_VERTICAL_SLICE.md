# Revisão da vertical slice — 3 de novembro de 2026

## Auditoria antes das alterações

Base: Phaser 4.2.1, TypeScript, Vite, Electron e Capacitor. O repositório estava em `master`, HEAD `3457e47`, com alterações locais extensas da continuação anterior; nenhuma foi descartada. Remoto configurado: `emersonbarrosdev/NILO`.

DEV_GAME identificou animações sem FSM, caminhada de 8 poses e corrida de 12 poses incompatíveis, taco incorporado ao personagem e outro projétil separado, soltura instantânea e caixas sem verificação lateral ao empurrar.

ART_DIRECTOR inspecionou capturas reais e fontes: fundo atual HD dominante e escuro; corrida sem alternância anatômica convincente; caixas quase idênticas. Chão, conceito dos troncos e cobra são preservados. O fundo histórico em HEAD usa montanhas/pinheiros: tinha leitura mais simples, mas não serve como floresta. A arte HD entrou no histórico em `a69a946`. As referências de gameplay estão documentadas em [REFERENCIAS_GAMEPLAY.md](REFERENCIAS_GAMEPLAY.md); nenhuma arte comercial será integrada.

QA_DATA reprovou o estado atual para o novo contrato: testes de quantidade de frames não provam anatomia; faltam testes de defasagem, apoio, travamento lógico, soltura e comprimento canônico.

## Direção adotada

Uma única tela, câmera e mundo 320×180, render interno 320×180, apresentação proporcional. NILO mantém célula32 e física existente: a leitura cresce25% em relação à câmera anterior400×225, sem aumentar hitbox. Fundo original de floresta com planos separados e contraste menor que jogáveis; chão e cobra preservados, registrando sua origem de maior resolução. Oito fases novas e reais de caminhada. Taco separado único de aproximadamente18×4 unidades; nunca arma desenhada dentro do herói.

Etapas realizadas e evidências serão registradas abaixo à medida que forem verificadas. Aprovação artística final pertence ao Diretor do Jogo.

### Correção de direção durante a execução

O Diretor rejeitou a apresentação de320×180 internos por reduzir demais letras/detalhes e pediu o mesmo fundo da tela inicial. Essa instrução posterior prevalece sobre a preferência inicial por um raster320×180. O mundo/câmera continuam320×180, mas o render passa a1280×720, sem blur, com aumento proporcional em monitores maiores. O fundo ativo passa a ser `forest-backdrop`, compartilhado com a tela inicial. A proposta de fundo pixelado fica apenas como estudo, fora do carregamento do jogo. Não se declara essa alternativa aprovada pelo Diretor.

Etapas3–4: capturas reais `artifacts/revisao-cenario.png` e `artifacts/revisao-cenario-hd.png` mostram as duas apresentações. Chão e cobra preservados. Plataformas com diferenças de altura40 e33 unidades, inferiores ao ápice de salto~46. Primeiro salto validado usando somente teclado: spawn32 atéx110,83, pés emy116, contato no tronco confirmado. Troncos preservam textura e ganham sombra inferior de1 unidade.
