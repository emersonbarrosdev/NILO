import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class MapScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.map); }

  create(): void {
    addPixelText(this, GAME_WIDTH / 2, 34, 'MAPA DE TRANSPORTE', {
      scale: 2,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });

    this.add.line(0, 0, 70, 95, 250, 95, 0x67e8f9, 1).setOrigin(0);
    this.add.circle(92, 95, 7, 0xfacc15);
    this.add.circle(148, 95, 6, 0x64748b);
    this.add.circle(204, 95, 6, 0x64748b);

    addPixelText(this, 92, 116, '1-1', {
      scale: 1,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });

    addPixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 18, 'ENTER: TELHADOS DO MERCADO', {
      scale: 1,
      color: 0xffe082,
      originX: 0.5,
      originY: 0.5,
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SCENE_KEYS.game, { stageId: '1-1' }));
  }
}
