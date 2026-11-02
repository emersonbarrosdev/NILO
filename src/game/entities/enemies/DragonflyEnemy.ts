import Phaser from 'phaser';
import { EnemyBase } from './EnemyBase';

export class DragonflyEnemy extends EnemyBase {
  private startY: number;
  private patrolSpan: number;
  private startX: number;
  private direction = 1;
  private speed = 40;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolSpan = 80) {
    super(scene, x, y, 'enemy-flyer-sheet');
    this.startX = x;
    this.startY = y;
    this.patrolSpan = patrolSpan;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(16, 12);
    body.setOffset(1, 2);

    this.play('flyer-fly');
  }

  update(time: number, _delta: number): void {
    if (this.isDefeated) return;

    // Movimento horizontal de patrulha
    if (this.x > this.startX + this.patrolSpan) {
      this.direction = -1;
      this.setFlipX(false);
    } else if (this.x < this.startX - this.patrolSpan) {
      this.direction = 1;
      this.setFlipX(true);
    }

    this.setVelocityX(this.direction * this.speed);

    // Ondulação suave em seno no eixo Y (movimento aéreo natural)
    const waveY = this.startY + Math.sin(time * 0.004) * 10;
    this.setY(waveY);
  }
}

