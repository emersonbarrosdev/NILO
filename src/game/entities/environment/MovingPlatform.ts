import Phaser from 'phaser';

export class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
  private distanceX: number;
  private distanceY: number;
  private minX: number;
  private maxX: number;
  private minY: number;
  private maxY: number;
  private speed: number;
  private dirX = 1;
  private dirY = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    distanceX = 0,
    distanceY = 0,
    speed = 35,
  ) {
    super(scene, x, y, 'moving-platform');
    this.distanceX = distanceX;
    this.distanceY = distanceY;
    this.speed = speed;

    this.minX = Math.min(x, x + distanceX);
    this.maxX = Math.max(x, x + distanceX);
    this.minY = Math.min(y, y + distanceY);
    this.maxY = Math.max(y, y + distanceY);

    this.dirX = distanceX >= 0 ? 1 : -1;
    this.dirY = distanceY >= 0 ? 1 : -1;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(4);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setFriction(1, 0);

    // Semissólida (one-way): permite saltar através por baixo e pousar firmemente em cima
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    body.checkCollision.up = true;
    body.setSize(48, 8);
    body.setOffset(0, 2);

    if (Math.abs(distanceX) > 0) {
      body.setVelocityX(this.dirX * this.speed);
    }
    if (Math.abs(distanceY) > 0) {
      body.setVelocityY(this.dirY * this.speed);
    }
  }

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (Math.abs(this.distanceX) > 0) {
      if (this.x >= this.maxX) {
        this.dirX = -1;
      } else if (this.x <= this.minX) {
        this.dirX = 1;
      }
      body.setVelocityX(this.dirX * this.speed);
    }

    if (Math.abs(this.distanceY) > 0) {
      if (this.y >= this.maxY) {
        this.dirY = -1;
      } else if (this.y <= this.minY) {
        this.dirY = 1;
      }
      body.setVelocityY(this.dirY * this.speed);
    }
  }
}


