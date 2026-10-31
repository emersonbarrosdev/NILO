import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { Player } from '../entities/Player';

export class GameScene extends Phaser.Scene {
  private player?: Player;

  constructor() { super(SCENE_KEYS.game); }

  create(): void {
    this.physics.world.setBounds(0, 0, 960, 180);
    this.cameras.main.setBounds(0, 0, 960, 180);
    this.cameras.main.setBackgroundColor('#4aa8db');

    const ground = this.add.rectangle(480, 168, 960, 24, 0x50b45a);
    this.physics.add.existing(ground, true);

    this.player = new Player(this, 38, 130);
    this.physics.add.collider(this.player, ground);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.add.text(20, 20, '1-1 TELHADOS DO MERCADO', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 4, y: 3 },
    }).setScrollFactor(0);
    this.add.text(20, 34, 'SETAS: mover | Z: pular', {
      fontFamily: 'monospace', fontSize: '7px', color: '#fde68a', backgroundColor: '#00000088', padding: { x: 4, y: 2 },
    }).setScrollFactor(0);

    this.scene.launch(SCENE_KEYS.ui);
  }

  update(): void {
    this.player?.update();
  }
}
