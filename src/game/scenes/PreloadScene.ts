import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.preload); }

  create(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xf4c542).fillRect(0, 0, 16, 24);
    graphics.generateTexture('player-placeholder', 16, 24);
    graphics.clear().fillStyle(0xef4444).fillRect(0, 0, 16, 16);
    graphics.generateTexture('enemy-placeholder', 16, 16);
    graphics.destroy();

    addPixelText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'CARREGANDO...', {
      scale: 1,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });

    this.time.delayedCall(120, () => this.scene.start(SCENE_KEYS.title));
  }
}
