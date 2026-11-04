import Phaser from 'phaser';
import { Player } from '../Player';

/** A grounded stone that can be pushed from either side; always recoverable. */
export class PushStone extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, private minX: number, private maxX: number) {
    super(scene, x, y, 'decor-rock');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(28, 24).setDepth(5);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.width, this.height).setImmovable(true).setAllowGravity(false);
  }

  push(player: Player): void {
    const body = player.body as Phaser.Physics.Arcade.Body;
    if (body.bottom <= this.y - 8 || player.isDead) return;
    const direction = Math.sign(body.acceleration.x);
    if (direction !== Math.sign(this.x - player.x)) return;
    const target = Phaser.Math.Clamp(this.x + direction * 42 * Math.min(32, this.scene.game.loop.delta) / 1000, this.minX, this.maxX);
    player.markPushing(Math.abs(target-this.x)<.01);
    this.x = target;
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
  }
}
