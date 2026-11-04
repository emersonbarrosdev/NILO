import { bindCamera } from '../systems/PresentationSystem';
import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';

export class BootScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.boot); }

  preload(): void {
    this.load.image('forest-backdrop',new URL('../../assets/hd/forest-backdrop.png',import.meta.url).href);
    this.load.image('nilo-logo',new URL('../../assets/hd/nilo-logo.png',import.meta.url).href);
  }
  create(): void {
    bindCamera(this);
    this.scene.start(SCENE_KEYS.preload);
  }
}
