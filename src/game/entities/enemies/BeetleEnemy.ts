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
    // Sprite original olha para a DIREITA (x=12 head).
    // Para andar para a ESQUERDA (moveDirection < 0), setFlipX(true) é obrigatório!
    this.setFlipX(this.moveDirection < 0);

    this.play('beetle-walk');
  }

  protected override onStunEnter(): void {
    this.play('beetle-hit'); // Encolhe no casco vermelho
  }

  protected override onStunExit(): void {
    this.play('beetle-walk'); // Volta a caminhar normalmente
    this.setVelocityX(this.moveDirection * this.patrolSpeed);
    this.setFlipX(this.moveDirection < 0);
  }

  update(_time: number, _delta: number): void {
    if (this.isDefeated) return;

    if (this.isStunned) {
      this.updateStunVisuals();
      if (!this.isSliding) {
        this.setVelocityX(0);
      }
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Detecção inteligente de limites e paredes (nunca cai em buraco)
    const reachedLeftLimit = (this.patrolMinX !== undefined && this.x <= this.patrolMinX);
    const reachedRightLimit = (this.patrolMaxX !== undefined && this.x >= this.patrolMaxX);

    if (body.blocked.left || (reachedLeftLimit && this.moveDirection < 0)) {
      this.moveDirection = 1;
      this.setVelocityX(this.patrolSpeed);
      this.setFlipX(false); // Olhando para a DIREITA
    } else if (body.blocked.right || (reachedRightLimit && this.moveDirection > 0)) {
      this.moveDirection = -1;
      this.setVelocityX(-this.patrolSpeed);
      this.setFlipX(true); // Olhando para a ESQUERDA
    } else {
      this.setVelocityX(this.moveDirection * this.patrolSpeed);
      this.setFlipX(this.moveDirection < 0);
    }
  }

  public override die(impactX?: number): void {
    this.play('beetle-hit');
    super.die(impactX);
  }
}
