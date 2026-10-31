import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

const LOGO_GLYPHS: Record<string, string[]> = {
  E: ['111111','110000','110000','111110','110000','110000','111111'],
  S: ['011111','110000','110000','011110','000011','000011','111110'],
  T: ['111111','001100','001100','001100','001100','001100','001100'],
  A: ['011110','110011','110011','111111','110011','110011','110011'],
  L: ['110000','110000','110000','110000','110000','110000','111111'],
  O: ['011110','110011','110011','110011','110011','110011','011110'],
};

export class TitleScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.title); }

  create(): void {
    this.drawPixelCity();
    this.drawLogo();
    this.drawMenuPanel();

    const startGame = () => this.scene.start(SCENE_KEYS.map);
    this.input.keyboard?.once('keydown-ENTER', startGame);
    this.input.keyboard?.once('keydown-SPACE', startGame);
  }

  private drawLogo(): void {
    const shadow = this.add.graphics();
    const logo = this.add.graphics();

    this.drawLogoWord(shadow, 61, 23, 3, 0x301447, 2, 2);
    this.drawLogoWord(logo, 61, 23, 3, 0xffef9b, 0, 0);

    // O T recebe a cor de impacto e vira o detalhe visual do estilingue.
    this.drawGlyph(logo, LOGO_GLYPHS.T, 103, 23, 3, 0xff8a3d);
    this.drawGlyph(shadow, LOGO_GLYPHS.T, 105, 25, 3, 0x301447);

    // Pequeno projétil e rastro saindo do T, sem transformar o logo num desenho gigante.
    logo.fillStyle(0xffd05a, 1).fillRect(117, 17, 5, 5);
    logo.fillStyle(0xff8a3d, 1).fillRect(122, 18, 3, 3);
    logo.fillStyle(0x9ee8ff, 1).fillRect(126, 19, 14, 1);
    logo.fillRect(132, 17, 8, 1);

    // 88 vira um selo secundário; o nome principal continua legível mesmo se ele mudar depois.
    this.add.rectangle(237, 35, 38, 24, 0x16253e, 0.95)
      .setStrokeStyle(2, 0xff8a3d, 1);
    addPixelText(this, 237, 35, '88', {
      scale: 2,
      color: 0xff9f43,
      originX: 0.5,
      originY: 0.5,
    });

    addPixelText(this, GAME_WIDTH / 2, 55, 'AÇÃO 8-BIT NOS TELHADOS', {
      scale: 1,
      color: 0xc7efff,
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
    const word = 'ESTALO';

    for (const char of word) {
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
    this.add.rectangle(GAME_WIDTH / 2, 112, 148, 42, 0x0a1830, 0.94)
      .setStrokeStyle(1, 0x2f6d93, 1);

    this.add.rectangle(GAME_WIDTH / 2, 105, 118, 18, 0x1d4964, 1)
      .setStrokeStyle(1, 0xffd05a, 1);

    addPixelText(this, GAME_WIDTH / 2, 105, 'NOVO JOGO', {
      scale: 2,
      color: 0xffdf68,
      originX: 0.5,
      originY: 0.5,
    });

    const prompt = addPixelText(this, GAME_WIDTH / 2, 127, 'ENTER / ESPAÇO', {
      scale: 1,
      color: 0xd9f2ff,
      originX: 0.5,
      originY: 0.5,
    });

    this.tweens.add({
      targets: prompt,
      alpha: 0.35,
      duration: 650,
      yoyo: true,
      repeat: -1,
    });
  }

  private drawPixelCity(): void {
    const graphics = this.add.graphics();

    // Céu em faixas para dar profundidade sem perder o visual 8-bit.
    graphics.fillStyle(0x1d4f88, 1).fillRect(0, 0, GAME_WIDTH, 48);
    graphics.fillStyle(0x2779ae, 1).fillRect(0, 48, GAME_WIDTH, 42);
    graphics.fillStyle(0x49afd0, 1).fillRect(0, 90, GAME_WIDTH, 58);

    // Sol e nuvens.
    graphics.fillStyle(0xffc94d, 1);
    graphics.fillRect(278, 17, 14, 24);
    graphics.fillRect(273, 22, 24, 14);

    graphics.fillStyle(0xd8f4fb, 1);
    graphics.fillRect(18, 76, 34, 5);
    graphics.fillRect(25, 70, 20, 6);
    graphics.fillRect(218, 69, 38, 5);
    graphics.fillRect(226, 63, 20, 6);

    // Skyline distante.
    const farBuildings = [
      { x: 0, y: 104, w: 35, h: 44, c: 0x315f7f },
      { x: 30, y: 95, w: 42, h: 53, c: 0x2b5374 },
      { x: 68, y: 109, w: 30, h: 39, c: 0x24445f },
      { x: 94, y: 88, w: 48, h: 60, c: 0x356987 },
      { x: 138, y: 102, w: 36, h: 46, c: 0x294e6c },
      { x: 169, y: 84, w: 52, h: 64, c: 0x356987 },
      { x: 216, y: 99, w: 34, h: 49, c: 0x24445f },
      { x: 246, y: 92, w: 43, h: 56, c: 0x315f7f },
      { x: 285, y: 108, w: 35, h: 40, c: 0x294e6c },
    ];

    farBuildings.forEach((building, index) => {
      graphics.fillStyle(building.c, 1).fillRect(building.x, building.y, building.w, building.h);
      graphics.fillStyle(index % 2 === 0 ? 0xffdf68 : 0x8ee9ff, 1);
      for (let wy = building.y + 8; wy < building.y + building.h - 4; wy += 10) {
        for (let wx = building.x + 6; wx < building.x + building.w - 4; wx += 11) {
          graphics.fillRect(wx, wy, 3, 4);
        }
      }
    });

    // Telhado frontal com caixa d'água e antenas para reforçar a identidade urbana.
    graphics.fillStyle(0x101a2d, 1).fillRect(0, 148, GAME_WIDTH, 32);
    graphics.fillStyle(0x203c58, 1).fillRect(0, 148, GAME_WIDTH, 5);
    graphics.fillStyle(0x17263d, 1).fillRect(18, 138, 43, 10);
    graphics.fillRect(267, 136, 30, 12);

    graphics.fillStyle(0x273a50, 1).fillRect(279, 123, 8, 13);
    graphics.fillStyle(0x4e7895, 1).fillRect(277, 121, 12, 3);
    graphics.fillStyle(0x9ee8ff, 1).fillRect(31, 132, 2, 6);
    graphics.fillRect(33, 130, 8, 2);
  }
}
