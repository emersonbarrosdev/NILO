import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';

export class GameOverScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.gameOver); }
  create(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'CONTINUE?', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
  }
}
