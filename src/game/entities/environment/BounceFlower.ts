import Phaser from 'phaser';
import { AudioSystem } from '../../systems/AudioSystem';
import { Player } from '../Player';

export class BounceFlower extends Phaser.Physics.Arcade.Sprite {
  private isBouncing = false;
  private bounceForce: number;

  constructor(scene: Phaser.Scene, x: number, y: number, bounceForce = -360) {
    super(scene, x, y, 'bounce-flower-sheet');
    this.bounceForce = bounceForce;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(3);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(18, 12);
    body.setOffset(3, 4);

    this.play('flower-idle');
  }

  public onPlayerBounce(player: Player): void {
    if (this.isBouncing) return;
    this.isBouncing = true;

    AudioSystem.get().playBounce();
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    playerBody.setVelocityY(this.bounceForce);

    this.play('flower-bounce');
    this.scene.time.delayedCall(300, () => {
      if (this.active) {
        this.play('flower-idle');
        this.isBouncing = false;
      }
    });
  }
}

