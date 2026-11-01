import Phaser from 'phaser';
import { GAME_WIDTH, RENDER_SCALE, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class UIScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.ui); }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE);
    this.cameras.main.setScroll(0, 0);

    this.add.rectangle(GAME_WIDTH / 2, 7, GAME_WIDTH, 14, 0x152238, 0.92)
      .setScrollFactor(0)
      .setDepth(1000);

    addPixelText(this, 6, 3, 'HP 3  VIDAS 3  SELOS 00  POSTAIS 0/3', {
      scale: 1,
      color: 0xffffff,
      scrollFactor: 0,
      depth: 1001,
    });
  }
}
