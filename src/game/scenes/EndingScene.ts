import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';

export class EndingScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.ending); }
  create(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'ENDING — FUTURA PRODUÇÃO', { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff' }).setOrigin(0.5);
  }
}
