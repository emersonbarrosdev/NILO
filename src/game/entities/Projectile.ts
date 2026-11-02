import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Image {
  readonly charged: boolean;
  readonly damage: number;
  private trailTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, charged = false) {
    super(scene, x, y, charged ? 'stone-charged' : 'stone-normal');

    this.charged = charged;
    this.damage = charged ? 2 : 1;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(charged ? 4 : 3);
    body.setOffset(charged ? 1 : 1, charged ? 1 : 1);

    this.setDepth(12);
  }

  fire(directionX: number, directionY: number): void {
    const speed = this.charged ? 360 : 290;
    const vector = new Phaser.Math.Vector2(directionX, directionY);

    if (vector.lengthSq() === 0) {
      vector.set(1, 0);
    }

    vector.normalize().scale(speed);
    this.setVelocity(vector.x, vector.y);

    // Rotação rápida da pedra voando pelo ar
    this.scene.tweens.add({
      targets: this,
      angle: vector.x >= 0 ? 360 : -360,
      duration: this.charged ? 180 : 250,
      repeat: -1,
      ease: 'Linear',
    });

    if (this.charged) {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 80,
        yoyo: true,
        repeat: -1,
      });
    }

    // Rastro dinâmico de vento/centelhas (Wind/Spark Trail)
    this.trailTimer = this.scene.time.addEvent({
      delay: 35,
      loop: true,
      callback: () => {
        if (!this.active || !this.scene) return;
        this.spawnTrailParticle();
      },
    });

    this.scene.time.delayedCall(1500, () => {
      if (this.active) this.destroy();
    });
  }

  private spawnTrailParticle(): void {
    const trail = this.scene.add.graphics().setDepth(11);
    const color = this.charged ? 0xfbbf24 : 0xe2e8f0;
    const size = this.charged ? 3 : 2;

    trail.fillStyle(color, this.charged ? 0.9 : 0.65);
    trail.fillRect(this.x - size / 2, this.y - size / 2, size, size);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: this.charged ? 140 : 100,
      onComplete: () => trail.destroy(),
    });
  }

  public override destroy(fromScene?: boolean): void {
    this.trailTimer?.remove();
    super.destroy(fromScene);
  }
}
