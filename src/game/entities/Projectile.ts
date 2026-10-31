import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy-placeholder');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(4, 4);
  }

  fire(directionX: number, directionY: number, speed = 260): void {
    const vector = new Phaser.Math.Vector2(directionX, directionY).normalize().scale(speed);
    this.setVelocity(vector.x, vector.y);
    this.setActive(true).setVisible(true);
  }
}
