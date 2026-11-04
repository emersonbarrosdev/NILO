# NILO

Plataforma 2D cartoon para Windows e Android. Produção restrita a **uma tela de laboratório da Fase 1 — Vale da Brisa**. Versão de desenvolvimento **0.3.1**.

A referência a Sonic 1 (Master System), Super Mario World e outros clássicos orienta a leitura do cenário, o ritmo e os padrões dos inimigos. Personagens, arte, música e percurso são próprios.

## Jogar

- Windows: `release/NILO-Setup-0.3.1.exe` instala o jogo; F11 alterna tela cheia.
- Android: `release/NILO-0.3.1-debug.apk`, pacote de teste instalável, em paisagem.
- Cloudflare: [prévia publicada](https://nilo-game.botanstudio.workers.dev). Os aplicativos instalados carregam os recursos locais e não dependem desse endereço.

## Controles

| Ação | Teclado padrão | Controle padrão | Android |
|---|---|---|---|
| Mover | A/D ou setas | Analógico / direcional | Direcionais |
| Abaixar / andar abaixado | S / ↓ + direção | ↓ + direção | ↓ + direção |
| Pular, altura variável | Espaço | A / Cruz | PULO |
| Golpear | J | X / Quadrado | BATER |
| Lançar bastão | K; W/↑ para lançar alto | B / Círculo; ↑ para alto | LANÇAR; ↑ para alto |
| Pausar | Esc / P | Start / Options | Pausa |

As teclas podem ser alteradas em Controles e passam a valer ao entrar novamente na fase. Após lançar, o bastão precisa ser recolhido. Se cair em um buraco ou ficar inacessível por 12 segundos, reaparece ao lado de Nilo.

## Laboratório atual

Uma tela fixa de 400 × 225 unidades para validar arte, escala, movimento, taco e cenário. Mundo, câmera e apresentação são independentes. PC e Android usam a mesma lógica, física e sprites. As faixas touch ficam fora da área jogável segura 16:9.

[Arquitetura PC/Android e validação](docs/PC_ANDROID_VERTICAL_SLICE.md) · [Pesquisa de gameplay clássico](docs/REFERENCIAS_GAMEPLAY.md)

## Regras compartilhadas e percurso preservado

O percurso completo anterior está preservado no preset interno forest para regressões; não é a versão pública de teste. Boss, postais e puzzles maiores pertencem a esse preset.

- Um golpe tira **uma vida diretamente**, com breve invulnerabilidade; não existem três corações intermediários. Queda custa uma vida e retorna ao checkpoint. Zero vidas abre Continue.
- Primeiro golpe nos inimigos comuns atordoa; segundo derrota. Pular sobre eles não atordoa nem elimina.
- Caixas marcadas podem ser empurradas e usadas como degrau. A caixa da passagem inferior deve alcançar o encaixe para abrir a rota superior de retorno.
- Túneis baixos exigem agachar e impedem levantar sob o teto.
- Aranhas, abelhas, sapos e cobras patrulham a floresta.
- Macaco no final: cascas de banana, pausa vulnerável; a 50% da vida, fúria e cabeçadas com aviso e recuperação. Um golpe por janela. A arena fecha durante a luta.
- Distintivos de exploração: 50 concedem uma vida. Três postais secretos. Uma lancheira extra fica dentro da caixa do segredo do sino.

## Desenvolvimento

Node >= 22.12. `npm ci` instala as versões travadas.

```sh
npm run dev
npm run typecheck
npm test
npm run build
npm run art:pack
npm run desktop:build
npm run android:build
npm run deploy
```

Android requer SDK 36 e JDK 21; o script detecta as instalações locais usuais. Windows usa Electron + NSIS. Android usa Capacitor. O motor compartilhado é Phaser 4 / TypeScript / Vite, com assets locais. O APK atual usa assinatura de desenvolvimento; publicação em loja exige chave de lançamento própria.

## Documentação

- [Estado atual e decisões da Fase 1](docs/FASE_1_ATUAL.md)
- [Origem e preparação da arte](docs/ART_PROVENANCE.md)
- [Premissa e campanha futura](docs/STORY_CAMPAIGN.md)
- [Bíblia original — contexto histórico](docs/GAME_BIBLE.md)
- [Checklist original — contexto histórico](docs/PHASE_1_1_TASK_BIBLE.md)
