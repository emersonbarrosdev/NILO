import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_TITLE, GAME_WIDTH, SCENE_KEYS } from '../config/constants';

export class TitleScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.title); }

  create(): void {
    this.cameras.main.setBackgroundColor('#2878c7');
    this.add.rectangle(GAME_WIDTH / 2, 142, GAME_WIDTH, 76, 0x42b65c);
    this.add.text(GAME_WIDTH / 2, 52, GAME_TITLE, {
      fontFamily: 'monospace',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#fff3b0',
      stroke: '#3b1d58',
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 112, 'PRESS ENTER / SPACE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 164, 'PRE-ALPHA FOUNDATION', {
      fontFamily: 'monospace', fontSize: '7px', color: '#dbeafe',
    }).setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SCENE_KEYS.menu));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start(SCENE_KEYS.menu));
  }
}
