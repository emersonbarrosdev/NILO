import Phaser from 'phaser';
import { GAME_WIDTH, RENDER_SCALE, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

const LOGO_GLYPHS: Record<string, string[]> = {
  N: ['110011','111011','111111','110111','110011','110011','110011'],
  I: ['111111','001100','001100','001100','001100','001100','111111'],
  L: ['110000','110000','110000','110000','110000','110000','111111'],
  O: ['011110','110011','110011','110011','110011','110011','011110'],
};

export class TitleScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.title); }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE);
    this.cameras.main.setScroll(0, 0);

    this.drawNatureBackdrop();
    this.drawLogo();
    this.drawMenuPanel();

    const startGame = () => this.scene.start(SCENE_KEYS.map);
    this.input.keyboard?.once('keydown-ENTER', startGame);
    this.input.keyboard?.once('keydown-SPACE', startGame);
  }

  private drawLogo(): void {
    const shadow = this.add.graphics();
    const logo = this.add.graphics();

    this.drawLogoWord(shadow, 118, 23, 3, 0x301447, 2, 2);
    this.drawLogoWord(logo, 118, 23, 3, 0xffef9b, 0, 0);

    logo.fillStyle(0xff8a3d, 1).fillRect(185, 16, 4, 5);
    logo.fillRect(191, 16, 4, 5);
    logo.fillRect(188, 20, 4, 6);
    logo.fillStyle(0x9ee8ff, 1).fillRect(193, 18, 12, 1);

    addPixelText(this, GAME_WIDTH / 2, 55, 'DE VOLTA PRA CASA', {
      scale: 1,
      color: 0xe5fbff,
      originX: 0.5,
      originY: 0.5,
    });
  }

  private drawLogoWord(
    graphics: Phaser.GameObjects.Graphics,
    startX: number,
    startY: number,
    pixel: number,
    color: number,
    offsetX: number,
    offsetY: number,
  ): void {
    let x = startX + offsetX;
    for (const char of 'NILO') {
      this.drawGlyph(graphics, LOGO_GLYPHS[char], x, startY + offsetY, pixel, color);
      x += 7 * pixel;
    }
  }

  private drawGlyph(
    graphics: Phaser.GameObjects.Graphics,
    glyph: string[],
    x: number,
    y: number,
    pixel: number,
    color: number,
  ): void {
    graphics.fillStyle(color, 1);
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((cell, columnIndex) => {
        if (cell === '1') {
          graphics.fillRect(x + columnIndex * pixel, y + rowIndex * pixel, pixel, pixel);
        }
      });
    });
  }

  private drawMenuPanel(): void {
    this.add.rectangle(GAME_WIDTH / 2, 112, 148, 42, 0x13314a, 0.9)
      .setStrokeStyle(1, 0xf6c453, 1);
    this.add.rectangle(GAME_WIDTH / 2, 105, 118, 18, 0x286b67, 1)
      .setStrokeStyle(1, 0xffe06b, 1);

    addPixelText(this, GAME_WIDTH / 2, 105, 'NOVO JOGO', {
      scale: 2,
      color: 0xffef9b,
      originX: 0.5,
      originY: 0.5,
    });

    const prompt = addPixelText(this, GAME_WIDTH / 2, 127, 'ENTER / ESPAÇO', {
      scale: 1,
      color: 0xe8fbff,
      originX: 0.5,
      originY: 0.5,
    });

    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });
  }

  private drawNatureBackdrop(): void {
    const g = this.add.graphics();

    g.fillStyle(0x247ac0, 1).fillRect(0, 0, GAME_WIDTH, 52);
    g.fillStyle(0x39a7d8, 1).fillRect(0, 52, GAME_WIDTH, 56);
    g.fillStyle(0x72cfe5, 1).fillRect(0, 108, GAME_WIDTH, 40);

    g.fillStyle(0xffd45a, 1).fillRect(278, 17, 14, 24);
    g.fillRect(273, 22, 24, 14);

    g.fillStyle(0xe8fbff, 1).fillRect(18, 74, 38, 5);
    g.fillRect(26, 68, 21, 6);
    g.fillRect(218, 63, 42, 5);
    g.fillRect(228, 57, 22, 6);

    g.fillStyle(0x3d8b72, 1);
    const hills = [
      [0, 116, 52, 32], [14, 108, 26, 8], [46, 121, 65, 27], [63, 111, 31, 10],
      [105, 113, 69, 35], [123, 103, 34, 10], [168, 120, 58, 28], [181, 110, 34, 10],
      [220, 112, 62, 36], [239, 101, 28, 11], [276, 118, 44, 30],
    ];
    hills.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));

    g.fillStyle(0x2f6f55, 1);
    for (let x = 0; x < GAME_WIDTH; x += 28) {
      const height = 8 + ((x / 28) % 3) * 4;
      g.fillRect(x, 140 - height, 32, height + 8);
    }

    g.fillStyle(0x64bd55, 1).fillRect(0, 148, GAME_WIDTH, 7);
    g.fillStyle(0x6f4932, 1).fillRect(0, 155, GAME_WIDTH, 25);
    g.fillStyle(0x8e5a38, 1);
    for (let x = 4; x < GAME_WIDTH; x += 16) {
      g.fillRect(x, 160 + ((x / 16) % 2) * 5, 6, 3);
    }

    [16, 38, 269, 298].forEach((x, index) => {
      g.fillStyle(0x2f6f55, 1).fillRect(x, 142, 2, 6);
      g.fillStyle(index % 2 === 0 ? 0xff8a5b : 0xffdf68, 1).fillRect(x - 2, 140, 6, 3);
    });
  }
}
