import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Image {
  readonly charged: boolean;
  readonly damage: number;

  constructor(scene: Phaser.Scene, x: number, y: number, charged = false) {
    super(scene, x, y, charged ? 'stone-charged' : 'stone-normal');

    this.charged = charged;
    this.damage = charged ? 2 : 1;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(charged ? 3 : 2);

    this.setDepth(12);
  }

  fire(directionX: number, directionY: number): void {
    const speed = this.charged ? 340 : 270;
    const vector = new Phaser.Math.Vector2(directionX, directionY);

    if (vector.lengthSq() === 0) {
      vector.set(1, 0);
    }

    vector.normalize().scale(speed);
    this.setVelocity(vector.x, vector.y);
    this.setRotation(Math.atan2(vector.y, vector.x));

    if (this.charged) {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 70,
        yoyo: true,
        repeat: -1,
      });
    }

    this.scene.time.delayedCall(1400, () => {
      if (this.active) this.destroy();
    });
  }
}
