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

    const ground = this.add.rectangle(480, 168, 960, 24, 0x914c3d)
      .setDepth(2);
    ground.setStrokeStyle(2, 0x5c2e31, 1);
    this.physics.add.existing(ground, true);

    this.player = new Player(this, 38, 132);
    this.player.setDepth(10);
    this.physics.add.collider(this.player, ground);

    this.addRoofPlatform(142, 124, 52, 8, 0xd97545);
    this.addRoofPlatform(238, 105, 46, 8, 0x397594);
    this.addRoofPlatform(346, 132, 62, 8, 0xd9a13f);
    this.addRoofPlatform(470, 112, 54, 8, 0xb95448);
    this.addRoofPlatform(610, 126, 68, 8, 0x397594);
    this.addRoofPlatform(746, 102, 50, 8, 0xd97545);
    this.addRoofPlatform(850, 128, 58, 8, 0xd9a13f);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    const stageLabel = addPixelText(this, 8, 20, '1-1  TELHADOS DO MERCADO', {
      scale: 1,
      color: 0xffffff,
      paddingX: 4,
      paddingY: 3,
      backgroundColor: 0x17324a,
      backgroundAlpha: 0.94,
      scrollFactor: 0,
      depth: 900,
    });

    const controlsHint = addPixelText(this, 8, 36, 'A D / SETAS  MOVER\nW / CIMA / SPACE  PULAR', {
      scale: 1,
      color: 0xffe082,
      paddingX: 4,
      paddingY: 2,
      lineSpacing: 2,
      backgroundColor: 0x17324a,
      backgroundAlpha: 0.94,
      scrollFactor: 0,
      depth: 900,
    });

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
      delay: 4200,
      duration: 300,
      onComplete: () => controlsHint.destroy(),
    });

    this.scene.launch(SCENE_KEYS.ui);
  }

  update(): void {
    this.player?.update();
  }

  private addRoofPlatform(x: number, y: number, width: number, height: number, color: number): void {
    const platform = this.add.rectangle(x, y, width, height, color)
      .setDepth(3)
      .setStrokeStyle(2, 0x4a3040, 1);

    this.physics.add.existing(platform, true);
    if (this.player) {
      this.physics.add.collider(this.player, platform);
    }

    // Pequena base visual para a plataforma não parecer flutuando sem explicação.
    this.add.rectangle(x, y + height / 2 + 4, Math.max(12, width - 12), 6, 0x29445d, 1)
      .setDepth(1);
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics().setScrollFactor(0).setDepth(-20);

    graphics.fillStyle(0x2f86bd, 1).fillRect(0, 0, 320, 58);
    graphics.fillStyle(0x48acd3, 1).fillRect(0, 58, 320, 88);

    // Nuvens.
    graphics.fillStyle(0xd9f4fb, 1);
    graphics.fillRect(18, 48, 34, 5);
    graphics.fillRect(25, 42, 19, 6);
    graphics.fillRect(226, 38, 42, 5);
    graphics.fillRect(235, 32, 22, 6);

    // Skyline distante fixo para manter profundidade enquanto a câmera acompanha o jogador.
    const skyline = [
      { x: 0, y: 82, w: 35, h: 64, c: 0x315f7f },
      { x: 30, y: 92, w: 28, h: 54, c: 0x294d6b },
      { x: 55, y: 72, w: 46, h: 74, c: 0x356987 },
      { x: 96, y: 98, w: 32, h: 48, c: 0x24445f },
      { x: 124, y: 79, w: 45, h: 67, c: 0x315f7f },
      { x: 165, y: 88, w: 31, h: 58, c: 0x294d6b },
      { x: 192, y: 70, w: 50, h: 76, c: 0x356987 },
      { x: 237, y: 94, w: 35, h: 52, c: 0x24445f },
      { x: 268, y: 78, w: 52, h: 68, c: 0x315f7f },
    ];

    skyline.forEach((building, index) => {
      graphics.fillStyle(building.c, 1).fillRect(building.x, building.y, building.w, building.h);
      graphics.fillStyle(index % 2 === 0 ? 0xffdf68 : 0x83e3ff, 1);
      for (let wy = building.y + 8; wy < building.y + building.h - 5; wy += 11) {
        for (let wx = building.x + 6; wx < building.x + building.w - 4; wx += 12) {
          graphics.fillRect(wx, wy, 3, 4);
        }
      }
    });
  }

  private drawWorldDecor(): void {
    const graphics = this.add.graphics().setDepth(1);

    // Parapeito contínuo dos telhados.
    graphics.fillStyle(0x663746, 1).fillRect(0, 151, 960, 7);
    graphics.fillStyle(0xe0814d, 1).fillRect(0, 151, 960, 3);

    // Toldos de mercado e placas espalhados ao longo do percurso.
    for (let x = 76; x < 940; x += 172) {
      graphics.fillStyle(0xf6c453, 1).fillRect(x, 143, 34, 4);
      graphics.fillStyle(0xe25d4d, 1);
      for (let stripe = 0; stripe < 4; stripe += 1) {
        graphics.fillRect(x + stripe * 9, 147, 5, 4);
      }
      graphics.fillStyle(0x31556f, 1).fillRect(x + 3, 151, 2, 5);
      graphics.fillRect(x + 29, 151, 2, 5);
    }

    // Chaminés, caixas d'água e antenas.
    const vents = [118, 296, 430, 566, 708, 902];
    vents.forEach((x, index) => {
      graphics.fillStyle(index % 2 === 0 ? 0x31556f : 0x4a6f84, 1);
      graphics.fillRect(x, 139, 9, 12);
      graphics.fillStyle(0x6f94a6, 1).fillRect(x - 2, 137, 13, 3);
    });

    graphics.fillStyle(0x29445d, 1).fillRect(515, 129, 18, 22);
    graphics.fillStyle(0x547a91, 1).fillRect(512, 126, 24, 5);
    graphics.fillStyle(0x9ee8ff, 1).fillRect(522, 114, 2, 12);
    graphics.fillRect(524, 114, 12, 2);

    // Caixas e mercadorias como obstáculos puramente visuais nesta etapa.
    [190, 404, 666, 812].forEach((x, index) => {
      graphics.fillStyle(index % 2 === 0 ? 0xbf6d3d : 0x9b5a36, 1).fillRect(x, 143, 12, 8);
      graphics.lineStyle(1, 0x663b2c, 1).strokeRect(x, 143, 12, 8);
      graphics.lineBetween(x, 143, x + 12, 151);
    });
  }
}
