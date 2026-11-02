import Phaser from 'phaser';
import { EnemyBase } from './EnemyBase';

export class BeetleEnemy extends EnemyBase {
  private patrolSpeed = 34;
  private moveDirection = -1;
  private patrolMinX?: number;
  private patrolMaxX?: number;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolMinX?: number, patrolMaxX?: number) {
    super(scene, x, y, 'enemy-beetle-sheet');
    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 12);
    body.setOffset(1, 2);
    this.setVelocityX(this.moveDirection * this.patrolSpeed);
    this.setFlipX(this.moveDirection > 0);

    this.play('beetle-walk');
  }

  update(_time: number, _delta: number): void {
    if (this.isDefeated) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Detecção inteligente de parede e beirada de precipício (NUNCA cai no buraco!)
    const reachedLeftLimit = (this.patrolMinX !== undefined && this.x <= this.patrolMinX);
    const reachedRightLimit = (this.patrolMaxX !== undefined && this.x >= this.patrolMaxX);

    if (body.blocked.left || (reachedLeftLimit && this.moveDirection < 0)) {
      this.moveDirection = 1;
      this.setVelocityX(this.patrolSpeed);
      this.setFlipX(true);
    } else if (body.blocked.right || (reachedRightLimit && this.moveDirection > 0)) {
      this.moveDirection = -1;
      this.setVelocityX(-this.patrolSpeed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(this.moveDirection * this.patrolSpeed);
    }
  }

  public override die(impactX?: number): void {
    this.play('beetle-hit');
    super.die(impactX);
  }
}
