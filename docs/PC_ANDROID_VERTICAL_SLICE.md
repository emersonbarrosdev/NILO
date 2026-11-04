# NILO — laboratório PC / Android

Estado: 0.3.1, 3 de novembro de 2026. A experiência pública é uma única tela jogável da floresta. O percurso antigo permanece como preset de regressão, sem aparecer no menu. Não há expansão de fase nesta entrega.

## Cinco espaços independentes

| Espaço | Responsabilidade | Configuração atual |
|---|---|---|
| World | Colisões, posições, limites, gravidade e entidades | Laboratório 400 × 225 unidades; preset floresta 8200 × 360 |
| Camera | Quantidade de mundo visível | 400 × 225, fixa no laboratório; seguimento configurável |
| Viewport | Retângulo CSS seguro dentro da janela | 16:9 centralizado, sem esticar nem cortar |
| Internal render | Canvas de desenho, em pixels de saída | Dimensão da viewport × densidade do aparelho, arredondada para cima em múltiplos 16 × 9 |
| Device screen | Janela/área visível e densidade reportadas pelo sistema | Entrada exclusiva da apresentação; nunca usada pela física |

Código: [configuração de apresentação](../src/game/config/presentation.ts), [sistema de apresentação](../src/game/systems/PresentationSystem.ts), [presets de mundo e câmera](../src/game/levels/levelConfig.ts), [montagem do laboratório](../src/game/levels/buildLab.ts).

O corpo do personagem mede 14 × 25 unidades, a célula visual 32 × 32; o taco lançado usa célula 16 × 16. Velocidade máxima 118 unidades/s, gravidade 900 unidades/s² e impulso do pulo -288 unidades/s, compartilhados por teclado, controle e touch. A câmera de 400 unidades mantém os objetos 20% menores na largura da tela do que a antiga câmera de 320. Isso NÃO é uma redução diferente no Android.

A quantidade física de pixels de saída naturalmente muda entre HD e 4K. A unidade lógica, o enquadramento, a proporção e a física permanecem iguais. Filtro de textura nearest, sem blur de pós-processamento; canvas na densidade da viewport evita ampliar uma imagem interna fixa de 720p. Arte raster continua limitada pelo detalhe da fonte original: renderizar em 4K não inventa detalhes novos.

## Área segura e controles

A área jogável 16:9 fica integralmente dentro dos recuos do sistema. No mobile, duas faixas laterais de até 100 pixels CSS são reservadas antes de calcular a viewport. Nenhum botão cobre o canvas. Em 16:9 mobile, isso também produz margens acima/abaixo; em 20:9, as faixas aproveitam a largura extra. O mundo não é recortado para acomodar controles.

A medição usa visualViewport, evitando que um canvas temporariamente maior contamine innerWidth no Android. Recalcula ao redimensionar, entrar/sair de fullscreen e mudar recuos nativos. O HTML declara viewport-fit=cover. Capacitor 8 SystemBars fornece --safe-area-inset-*; o fallback é env(safe-area-inset-*). WebViews antigos têm ajuste nativo do próprio Capacitor. As faixas respeitam notch, câmera, barras e navigation bar reportados pelo sistema. O HUD também fica dentro do canvas seguro.

F11 alterna fullscreen no Windows e na prévia. Android mantém sensorLandscape. Os controles touch existentes alimentam as mesmas ações do teclado/gamepad, incluindo combinações simultâneas.

## Crescimento por etapas

1. Agora: laboratório fixo com chão, troncos fixos/móvel/que cai, caixa empurrável, túnel, cobra, caixa quebrável e taco.
2. Próxima aprovação: mudar world.width para 512 e configurar câmera de seguimento. A largura do chão do laboratório acompanha o mundo; a câmera continua 400 × 225.
3. Montar um percurso completo com o builder de terreno, checkpoints e scrolling; nenhum componente de apresentação precisa mudar.
4. Adicionar novos presets/builders para áreas/fases. Não inferir limites de mundo da resolução ou do CSS.

O mapa antigo e o macaco continuam cobertos pelos testes de regressão através do preset forest. Não estão no laboratório público.

## Verificação

A suíte [presentation.spec.ts](../tests/presentation.spec.ts) verifica 1280×720, 1920×1080, 2560×1440, 3840×2160, redimensionamento, fullscreen, proporções, limites, menus, contato nos troncos e expansão independente do mundo.

Mobile: emulação Chromium com toque, landscape, densidade 3 e viewports 960×432 (20:9 equivalente ao S20), 932×430 e 800×450. Recuos assimétricos 28/16/8/12 são injetados para testar notch/barras. Os botões são verificados geometricamente fora da área jogável e dentro da área segura. A suíte da floresta verifica multitouch real via protocolo de entrada do navegador.

A Samsung informa 3200×1440 para o Galaxy S20: [especificação oficial](https://www.samsungmobilepress.com/media-assets/galaxy_s20?tab=specs). O perfil emulado representa sua proporção, não uma alegação de teste físico. Desempenho sustentado, aquecimento, driver GPU e toque em um S20 real ainda exigem teste no aparelho. O APK é de desenvolvimento, assinado para instalação de teste.
