import Phaser from 'phaser';
import { GAME_WIDTH, RENDER_SCALE, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class MapScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.map); }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE);
    this.cameras.main.setScroll(0, 0);

    this.drawBackground();
    this.drawRoute();

    addPixelText(this, GAME_WIDTH / 2, 20, 'ROTA DA AVENTURA', {
      scale: 2,
      color: 0xfff1a8,
      originX: 0.5,
      originY: 0.5,
    });

    addPixelText(this, GAME_WIDTH / 2, 43, 'MUNDO 1', {
      scale: 1,
      color: 0xd9fbff,
      originX: 0.5,
      originY: 0.5,
    });

    this.add.rectangle(GAME_WIDTH / 2, 144, 246, 43, 0x17314a, 0.95)
      .setStrokeStyle(1, 0x6dc66a, 1);

    addPixelText(this, GAME_WIDTH / 2, 136, '1-1  VALE DA BRISA', {
      scale: 1,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });

    const prompt = addPixelText(this, GAME_WIDTH / 2, 154, 'ENTER / ESPAÇO  INICIAR', {
      scale: 1,
      color: 0xffdf68,
      originX: 0.5,
      originY: 0.5,
    });

    this.tweens.add({ targets: prompt, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });

    const startStage = () => this.scene.start(SCENE_KEYS.game, { stageId: '1-1' });
    this.input.keyboard?.once('keydown-ENTER', startStage);
    this.input.keyboard?.once('keydown-SPACE', startStage);
  }

  private drawBackground(): void {
    const g = this.add.graphics();

    g.fillStyle(0x246aa7, 1).fillRect(0, 0, 320, 180);
    g.fillStyle(0x49afd0, 1).fillRect(0, 45, 320, 80);

    g.fillStyle(0x3a8a6b, 1);
    const hills = [
      [0, 103, 58, 22], [12, 94, 34, 9], [47, 108, 73, 17], [67, 98, 32, 10],
      [112, 100, 75, 25], [136, 89, 31, 11], [180, 108, 58, 17], [194, 97, 32, 11],
      [232, 99, 88, 26], [258, 88, 36, 11],
    ];
    hills.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));

    g.fillStyle(0x65bd55, 1).fillRect(0, 124, 320, 8);
    g.fillStyle(0x6d4933, 1).fillRect(0, 132, 320, 48);

    g.fillStyle(0xe5faff, 1).fillRect(18, 62, 34, 5);
    g.fillRect(25, 56, 18, 6);
    g.fillRect(240, 54, 38, 5);
    g.fillRect(249, 48, 20, 6);

    g.fillStyle(0xffd45a, 1).fillRect(288, 23, 12, 20);
    g.fillRect(284, 27, 20, 12);
  }

  private drawRoute(): void {
    const g = this.add.graphics();
    const stations = [54, 126, 198, 270];
    const y = 79;

    g.fillStyle(0xffef9b, 1).fillRect(stations[0], y, stations[3] - stations[0], 2);
    for (let x = stations[0] + 12; x < stations[3]; x += 18) {
      g.fillStyle(0xffffff, 0.7).fillRect(x, y - 1, 4, 4);
    }

    g.fillStyle(0x38502d, 1).fillRect(stations[0] - 8, y - 9, 16, 18);
    g.fillStyle(0x77d95d, 1).fillRect(stations[0] - 5, y - 6, 10, 12);
    g.fillStyle(0xffdf68, 1).fillRect(stations[0] - 2, y - 3, 4, 6);

    for (let index = 1; index < stations.length; index += 1) {
      const x = stations[index];
      g.fillStyle(0x435d66, 1).fillRect(x - 6, y - 7, 12, 14);
      g.fillStyle(0x8197a1, 1).fillRect(x - 3, y - 4, 6, 8);
    }

    const labels = ['VALE', 'BOSQUE', 'CASCATA', 'ALTURAS'];
    labels.forEach((label, index) => {
      addPixelText(this, stations[index], 98, label, {
        scale: 1,
        color: index === 0 ? 0xffdf68 : 0xc7d6d9,
        originX: 0.5,
        originY: 0.5,
      });
    });

    addPixelText(this, GAME_WIDTH / 2, 115, 'NOVAS ROTAS ABREM DEPOIS', {
      scale: 1,
      color: 0xd7e8ea,
      originX: 0.5,
      originY: 0.5,
    });
  }
}
