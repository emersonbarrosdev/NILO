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
    player.play('player-jump', true);

    // Squash & stretch elástico da flor
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.35,
      scaleY: 0.65,
      duration: 70,
      yoyo: true,
      repeat: 1,
    });

    // Centelhas de pólen dourado subindo
    const pollen = this.scene.add.graphics().setDepth(15);
    pollen.fillStyle(0xfef08a, 1);
    for (let i = 0; i < 6; i++) {
      pollen.fillRect(this.x - 8 + i * 3, this.y - 6 - (i % 2) * 4, 2, 2);
    }
    this.scene.tweens.add({
      targets: pollen,
      y: pollen.y - 18,
      alpha: 0,
      duration: 350,
      onComplete: () => pollen.destroy(),
    });

    this.play('flower-bounce');
    this.scene.time.delayedCall(300, () => {
      if (this.active) {
        this.play('flower-idle');
        this.isBouncing = false;
      }
    });
  }
}

