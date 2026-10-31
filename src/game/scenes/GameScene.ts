import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { Player } from '../entities/Player';
import { addPixelText } from '../ui/PixelText';

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

    addPixelText(this, 8, 20, '1-1 TELHADOS DO MERCADO', {
      scale: 1,
      color: 0xffffff,
      paddingX: 4,
      paddingY: 3,
      backgroundColor: 0x17324a,
      backgroundAlpha: 0.92,
      scrollFactor: 0,
      depth: 900,
    });

    addPixelText(this, 8, 36, 'SETAS MOVER  Z PULAR', {
      scale: 1,
      color: 0xffe082,
      paddingX: 4,
      paddingY: 2,
      backgroundColor: 0x17324a,
      backgroundAlpha: 0.92,
      scrollFactor: 0,
      depth: 900,
    });

    this.scene.launch(SCENE_KEYS.ui);
  }

  update(): void {
    this.player?.update();
  }
}
