import { bindCamera } from '../systems/PresentationSystem';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class MenuScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.menu); }

  create(): void {
    bindCamera(this);
    this.cameras.main.setBackgroundColor('#1b2452');

    addPixelText(this, GAME_WIDTH / 2, 52, 'NOVO JOGO', {
      scale: 2,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });

    const startPrompt = addPixelText(this, GAME_WIDTH / 2, 88, 'ENTER PARA INICIAR', {
      scale: 1,
      color: 0xffe082,
      originX: 0.5,
      originY: 0.5,
      paddingX: 5,
      paddingY: 4,
      backgroundColor: 0x111827,
      backgroundAlpha: 0.8,
    });

    this.tweens.add({ targets: startPrompt, alpha: 0.4, duration: 550, yoyo: true, repeat: -1 });

    addPixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 14, 'VERTICAL SLICE 1-1 EM CONSTRUCAO', {
      scale: 1,
      color: 0x94a3b8,
      originX: 0.5,
      originY: 0.5,
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SCENE_KEYS.intro));
  }
}
