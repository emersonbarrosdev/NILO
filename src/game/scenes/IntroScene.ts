import { bindCamera } from '../systems/PresentationSystem';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class IntroScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.intro); }

  create(): void {
    bindCamera(this);
    this.cameras.main.setBackgroundColor('#111827');

    addPixelText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 14, 'INTRO STORYBOARD\nAPOS VALIDAR A FASE 1-1', {
      scale: 1,
      color: 0xffffff,
      align: 'center',
      originX: 0.5,
      originY: 0.5,
      lineSpacing: 3,
    });

    addPixelText(this, GAME_WIDTH / 2, 132, 'ENTER', {
      scale: 1,
      color: 0xffe082,
      originX: 0.5,
      originY: 0.5,
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SCENE_KEYS.map));
  }
}
