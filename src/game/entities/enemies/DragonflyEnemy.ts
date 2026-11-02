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

    this.setFlipX(this.direction < 0);
    this.play('flyer-fly');
  }

  protected override onStunEnter(): void {
    this.setVelocity(0, 0);
  }

  protected override onStunExit(): void {
    this.setVelocityX(this.direction * this.speed);
  }

  update(time: number, _delta: number): void {
    if (this.isDefeated) return;

    if (this.isStunned) {
      this.updateStunVisuals();
      return;
    }

    // Movimento horizontal de patrulha
    if (this.x > this.startX + this.patrolSpan) {
      this.direction = -1;
      this.setFlipX(true); // Olhando para a ESQUERDA
    } else if (this.x < this.startX - this.patrolSpan) {
      this.direction = 1;
      this.setFlipX(false); // Olhando para a DIREITA
    }

    this.setVelocityX(this.direction * this.speed);

    // Ondulação suave em seno no eixo Y (movimento aéreo natural)
    const waveY = this.startY + Math.sin(time * 0.004) * 10;
    this.setY(waveY);
  }
}
