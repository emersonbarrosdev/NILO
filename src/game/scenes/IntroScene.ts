import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';

export class IntroScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.intro); }

  create(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'INTRO STORYBOARD\n(será produzida após validar 1-1)', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 130, 'ENTER', { fontFamily: 'monospace', fontSize: '8px', color: '#fde68a' }).setOrigin(0.5);
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SCENE_KEYS.map));
  }
}
