import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class GameOverScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.gameOver); }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE);
    this.cameras.main.setScroll(0, 0);

    addPixelText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'CONTINUE?', {
      scale: 2,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });
  }
}
