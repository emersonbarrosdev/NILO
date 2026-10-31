import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class StageClearScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.stageClear); }

  create(): void {
    addPixelText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'FASE CONCLUIDA', {
      scale: 2,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });
  }
}
