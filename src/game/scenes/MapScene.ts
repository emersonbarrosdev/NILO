import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';

export class MapScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.map); }

  create(): void {
    this.add.text(GAME_WIDTH / 2, 34, 'MAPA DE TRANSPORTE', { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' }).setOrigin(0.5);
    this.add.line(0, 0, 70, 95, 250, 95, 0x67e8f9, 1).setOrigin(0);
    this.add.circle(92, 95, 7, 0xfacc15);
    this.add.circle(148, 95, 6, 0x64748b);
    this.add.circle(204, 95, 6, 0x64748b);
    this.add.text(92, 116, '1-1', { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 24, 'ENTER: TELHADOS DO MERCADO', { fontFamily: 'monospace', fontSize: '8px', color: '#fde68a' }).setOrigin(0.5);
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SCENE_KEYS.game, { stageId: '1-1' }));
  }
}
