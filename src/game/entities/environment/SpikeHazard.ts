import Phaser from 'phaser';
import { Player } from '../Player';

export class SpikeHazard extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hazard-spikes');

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(3);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(16, 12);
    body.setOffset(0, 4);
  }

  public onPlayerOverlap(player: Player): void {
    player.receiveDamage(1, this.x);
  }
}

