import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { Player } from '../entities/Player';
import { addPixelText } from '../ui/PixelText';

export class GameScene extends Phaser.Scene {
  private player?: Player;

  constructor() { super(SCENE_KEYS.game); }

  create(): void {
    this.physics.world.setBounds(0, 0, 960, 180);
    this.cameras.main.setBounds(0, 0, 960, 180);
    this.cameras.main.setBackgroundColor('#49a9d5');

    this.drawBackdrop();
    this.drawWorldDecor();

    const ground = this.add.rectangle(480, 168, 960, 24, 0x6f4932)
      .setDepth(2);
    this.physics.add.existing(ground, true);

    // Faixa de grama no topo do terreno, separada da colisão para manter leitura visual.
    this.add.rectangle(480, 157, 960, 5, 0x68c95a).setDepth(3);
    this.add.rectangle(480, 160, 960, 2, 0x3f9147).setDepth(3);

    this.player = new Player(this, 38, 132);
    this.player.setDepth(10);
    this.physics.add.collider(this.player, ground);

    this.addGrassPlatform(142, 124, 52, 8);
    this.addGrassPlatform(238, 105, 46, 8);
    this.addGrassPlatform(346, 132, 62, 8);
    this.addGrassPlatform(470, 112, 54, 8);
    this.addGrassPlatform(610, 126, 68, 8);
    this.addGrassPlatform(746, 102, 50, 8);
    this.addGrassPlatform(850, 128, 58, 8);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    const stageLabel = addPixelText(this, 8, 20, '1-1  VALE DA BRISA', {
      scale: 1,
      color: 0xffffff,
      paddingX: 4,
      paddingY: 3,
      backgroundColor: 0x17324a,
      backgroundAlpha: 0.9,
      scrollFactor: 0,
      depth: 900,
    });

    const controlsHint = addPixelText(
      this,
      8,
      36,
      'A D / SETAS  MOVER\nW / CIMA / SPACE  PULAR\nJ / X  ESTILINGUE  SEGURE CARREGAR',
      {
        scale: 1,
        color: 0xffe082,
        paddingX: 4,
        paddingY: 2,
        lineSpacing: 2,
        backgroundColor: 0x17324a,
        backgroundAlpha: 0.9,
        scrollFactor: 0,
        depth: 900,
      },
    );

    this.tweens.add({
      targets: stageLabel,
      alpha: 0,
      delay: 1800,
      duration: 250,
      onComplete: () => stageLabel.destroy(),
    });

    this.tweens.add({
      targets: controlsHint,
      alpha: 0,
      delay: 5200,
      duration: 300,
      onComplete: () => controlsHint.destroy(),
    });

    this.scene.launch(SCENE_KEYS.ui);
  }

  update(time: number): void {
    this.player?.update(time);
  }

  private addGrassPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.add.rectangle(x, y, width, height, 0x7a5136)
      .setDepth(4)
      .setStrokeStyle(1, 0x4f3328, 1);

    this.physics.add.existing(platform, true);
    if (this.player) {
      this.physics.add.collider(this.player, platform);
    }

    // Grama e sombra deixam a plataforma natural e não flutuante visualmente.
    this.add.rectangle(x, y - height / 2, width, 3, 0x72cf5b, 1).setDepth(5);
    this.add.rectangle(x, y + height / 2 + 3, Math.max(12, width - 10), 5, 0x5a3b2d, 1).setDepth(2);

    // Pequenas raízes/pedras quebram a forma retangular sem alterar a colisão.
    this.add.rectangle(x - width / 4, y + 6, 4, 4, 0x8c6544, 1).setDepth(3);
    this.add.rectangle(x + width / 5, y + 5, 5, 3, 0x8c6544, 1).setDepth(3);
  }

  private drawBackdrop(): void {
    const g = this.add.graphics().setScrollFactor(0).setDepth(-20);

    g.fillStyle(0x2f86bd, 1).fillRect(0, 0, 320, 58);
    g.fillStyle(0x48acd3, 1).fillRect(0, 58, 320, 88);

    // Sol e nuvens.
    g.fillStyle(0xffd45a, 1);
    g.fillRect(278, 18, 14, 22);
    g.fillRect(274, 22, 22, 14);

    g.fillStyle(0xe7fbff, 1);
    g.fillRect(18, 48, 34, 5);
    g.fillRect(25, 42, 19, 6);
    g.fillRect(226, 38, 42, 5);
    g.fillRect(235, 32, 22, 6);

    // Colinas distantes em camadas; nenhuma silhueta urbana.
    g.fillStyle(0x4b9b77, 1);
    g.fillRect(0, 92, 58, 54);
    g.fillRect(14, 81, 30, 11);
    g.fillRect(50, 103, 68, 43);
    g.fillRect(68, 91, 34, 12);
    g.fillRect(110, 88, 72, 58);
    g.fillRect(130, 75, 36, 13);
    g.fillRect(176, 102, 62, 44);
    g.fillRect(191, 90, 34, 12);
    g.fillRect(230, 87, 70, 59);
    g.fillRect(249, 74, 34, 13);
    g.fillRect(294, 105, 26, 41);

    g.fillStyle(0x327158, 1);
    for (let x = 0; x < 320; x += 26) {
      const h = 8 + ((x / 26) % 3) * 4;
      g.fillRect(x, 146 - h, 30, h);
    }
  }

  private drawWorldDecor(): void {
    const g = this.add.graphics().setDepth(1);

    // Textura simples no solo.
    g.fillStyle(0x8d603e, 1);
    for (let x = 8; x < 952; x += 24) {
      g.fillRect(x, 166 + ((x / 24) % 2) * 5, 7, 3);
    }

    // Árvores pequenas e arbustos ao longo do percurso.
    const treeXs = [82, 286, 526, 704, 918];
    treeXs.forEach((x, index) => {
      g.fillStyle(0x69452f, 1).fillRect(x, 136, 4, 20);
      g.fillStyle(index % 2 === 0 ? 0x3c9452 : 0x2f7f49, 1);
      g.fillRect(x - 8, 128, 20, 8);
      g.fillRect(x - 5, 122, 14, 7);
      g.fillStyle(0x62ba55, 1).fillRect(x - 3, 125, 8, 4);
    });

    // Arbustos e flores dão cor e leitura de velocidade perto do chão.
    for (let x = 46; x < 940; x += 92) {
      g.fillStyle(0x3d954e, 1).fillRect(x, 149, 18, 7);
      g.fillStyle(0x67c45b, 1).fillRect(x + 4, 146, 10, 4);
      g.fillStyle((x / 92) % 2 === 0 ? 0xff8a5b : 0xffdf68, 1).fillRect(x + 8, 143, 4, 3);
    }

    // Pequenas bandeirolas de caminho, sem arquitetura urbana.
    const flagGroups = [190, 420, 658, 836];
    flagGroups.forEach((x) => {
      g.fillStyle(0x6b4930, 1).fillRect(x, 135, 2, 20);
      g.fillRect(x + 34, 135, 2, 20);
      g.fillStyle(0xffcf55, 1).fillRect(x + 2, 136, 8, 4);
      g.fillStyle(0xef6b57, 1).fillRect(x + 11, 136, 8, 4);
      g.fillStyle(0x6ecbe0, 1).fillRect(x + 20, 136, 8, 4);
      g.fillStyle(0xffcf55, 1).fillRect(x + 29, 136, 5, 4);
    });

    // Pedras e troncos decorativos.
    [118, 370, 574, 792].forEach((x, index) => {
      g.fillStyle(index % 2 === 0 ? 0x756b60 : 0x665d55, 1).fillRect(x, 149, 12, 7);
      g.fillStyle(0x9a8d80, 1).fillRect(x + 2, 147, 7, 2);
    });
  }
}
