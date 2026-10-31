import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';

export class UIScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.ui); }

  create(): void {
    this.add.text(8, 8, '♥♥♥   ×3   SELOS 00   ▣□□', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ffffff',
    });
  }
}
