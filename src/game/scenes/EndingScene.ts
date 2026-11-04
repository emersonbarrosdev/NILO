import { bindCamera } from '../systems/PresentationSystem';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class EndingScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.ending); }

  create(): void {
    bindCamera(this);
    addPixelText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'ENDING - FUTURA PRODUCAO', {
      scale: 1,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });
  }
}
