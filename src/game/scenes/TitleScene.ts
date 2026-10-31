import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class TitleScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.title); }

  create(): void {
    this.drawPixelCity();
    this.drawLogo();

    this.add.rectangle(GAME_WIDTH / 2, 112, 154, 42, 0x0b1730, 0.94);

    addPixelText(this, GAME_WIDTH / 2, 104, 'NOVO JOGO', {
      scale: 2,
      color: 0xffdf68,
      originX: 0.5,
      originY: 0.5,
    });

    const prompt = addPixelText(this, GAME_WIDTH / 2, 126, 'ENTER / SPACE', {
      scale: 1,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });

    this.tweens.add({
      targets: prompt,
      alpha: 0.35,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    addPixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 8, 'ESTALO 88', {
      scale: 1,
      color: 0x9fd8f4,
      originX: 0.5,
      originY: 0.5,
    });

    const startGame = () => this.scene.start(SCENE_KEYS.map);
    this.input.keyboard?.once('keydown-ENTER', startGame);
    this.input.keyboard?.once('keydown-SPACE', startGame);
  }

  private drawLogo(): void {
    const graphics = this.add.graphics();

    // Ícone de estilingue em pixel art.
    graphics.fillStyle(0x35174f, 1);
    graphics.fillRect(45, 31, 5, 29);
    graphics.fillRect(38, 27, 5, 13);
    graphics.fillRect(52, 27, 5, 13);
    graphics.fillRect(41, 25, 13, 3);
    graphics.fillRect(60, 23, 6, 6);

    graphics.fillStyle(0xffd85c, 1);
    graphics.fillRect(43, 29, 5, 29);
    graphics.fillRect(36, 25, 5, 13);
    graphics.fillRect(50, 25, 5, 13);
    graphics.fillRect(39, 23, 13, 3);
    graphics.fillStyle(0xff8a3d, 1);
    graphics.fillRect(58, 21, 6, 6);

    addPixelText(this, 147, 43, 'ESTALO', {
      scale: 3,
      color: 0x35174f,
      originX: 0.5,
      originY: 0.5,
    }).setPosition(149, 45);

    addPixelText(this, 147, 43, 'ESTALO', {
      scale: 3,
      color: 0xfff0a6,
      originX: 0.5,
      originY: 0.5,
    });

    addPixelText(this, 246, 43, '88', {
      scale: 3,
      color: 0x35174f,
      originX: 0.5,
      originY: 0.5,
    }).setPosition(248, 45);

    addPixelText(this, 246, 43, '88', {
      scale: 3,
      color: 0xff9f43,
      originX: 0.5,
      originY: 0.5,
    });
  }

  private drawPixelCity(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x226aa6, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.fillStyle(0x3294c9, 1).fillRect(0, 58, GAME_WIDTH, 88);

    // Sol pixelado.
    graphics.fillStyle(0xffc94d, 1);
    graphics.fillRect(274, 18, 14, 22);
    graphics.fillRect(270, 22, 22, 14);

    // Nuvens em blocos.
    graphics.fillStyle(0xc8ecf7, 1);
    graphics.fillRect(18, 72, 30, 5);
    graphics.fillRect(24, 67, 18, 5);
    graphics.fillRect(217, 63, 34, 5);
    graphics.fillRect(225, 58, 18, 5);

    const buildings = [
      { x: 0, y: 103, w: 32, h: 43, color: 0x24415f },
      { x: 29, y: 94, w: 39, h: 52, color: 0x2c5270 },
      { x: 65, y: 108, w: 27, h: 38, color: 0x1e3a57 },
      { x: 88, y: 89, w: 45, h: 57, color: 0x315d7b },
      { x: 129, y: 101, w: 35, h: 45, color: 0x24415f },
      { x: 160, y: 85, w: 48, h: 61, color: 0x2c5270 },
      { x: 205, y: 100, w: 31, h: 46, color: 0x1e3a57 },
      { x: 233, y: 91, w: 42, h: 55, color: 0x315d7b },
      { x: 271, y: 106, w: 49, h: 40, color: 0x24415f },
    ];

    buildings.forEach((building, buildingIndex) => {
      graphics.fillStyle(building.color, 1).fillRect(building.x, building.y, building.w, building.h);
      graphics.fillStyle(buildingIndex % 2 === 0 ? 0xffdf68 : 0x86e4ff, 1);
      for (let y = building.y + 8; y < building.y + building.h - 4; y += 10) {
        for (let x = building.x + 6; x < building.x + building.w - 4; x += 11) {
          graphics.fillRect(x, y, 3, 4);
        }
      }
    });

    // Telhado em primeiro plano.
    graphics.fillStyle(0x111b31, 1).fillRect(0, 146, GAME_WIDTH, 34);
    graphics.fillStyle(0x1c2e49, 1).fillRect(0, 146, GAME_WIDTH, 5);
    graphics.fillStyle(0x17243b, 1).fillRect(20, 137, 42, 9);
    graphics.fillRect(263, 133, 28, 13);
    graphics.fillStyle(0x243a56, 1).fillRect(278, 119, 3, 14);
    graphics.fillRect(275, 117, 9, 3);
  }
}
