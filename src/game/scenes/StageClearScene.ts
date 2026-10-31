import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';

export class StageClearScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.stageClear); }
  create(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'FASE CONCLUÍDA', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
  }
}
