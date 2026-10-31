import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.preload); }

  create(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xf4c542).fillRect(0, 0, 16, 24);
    graphics.generateTexture('player-placeholder', 16, 24);
    graphics.clear().fillStyle(0xef4444).fillRect(0, 0, 16, 16);
    graphics.generateTexture('enemy-placeholder', 16, 16);
    graphics.destroy();

    // O preload técnico fica invisível enquanto os assets ainda são instantâneos.
    this.scene.start(SCENE_KEYS.title);
  }
}
