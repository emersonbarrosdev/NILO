import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_TITLE, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class TitleScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.title); }

  create(): void {
    this.cameras.main.setBackgroundColor('#2878c7');
    this.add.rectangle(GAME_WIDTH / 2, 142, GAME_WIDTH, 76, 0x42b65c);

    addPixelText(this, GAME_WIDTH / 2 + 2, 50 + 2, GAME_TITLE, {
      scale: 3,
      color: 0x3b1d58,
      originX: 0.5,
      originY: 0.5,
    });
    addPixelText(this, GAME_WIDTH / 2, 50, GAME_TITLE, {
      scale: 3,
      color: 0xfff3b0,
      originX: 0.5,
      originY: 0.5,
    });

    const prompt = addPixelText(this, GAME_WIDTH / 2, 110, 'ENTER / ESPACO', {
      scale: 1,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });

    this.tweens.add({
      targets: prompt,
      alpha: 0.35,
      duration: 550,
      yoyo: true,
      repeat: -1,
    });

    addPixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 12, 'PRE-ALPHA', {
      scale: 1,
      color: 0xdbeafe,
      originX: 0.5,
      originY: 0.5,
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SCENE_KEYS.menu));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start(SCENE_KEYS.menu));
  }
}
