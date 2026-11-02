import Phaser from 'phaser';
import { EnemyBase } from './EnemyBase';
import { Player } from '../Player';

export class HopperEnemy extends EnemyBase {
  private jumpCooldown = 1800;
  private lastJumpTime = 0;
  private isPreparingJump = false;
  private targetPlayer?: Player;
  private patrolMinX?: number;
  private patrolMaxX?: number;

  constructor(scene: Phaser.Scene, x: number, y: number, player?: Player, minX?: number, maxX?: number) {
    super(scene, x, y, 'enemy-hopper-sheet');
    this.targetPlayer = player;
    this.patrolMinX = minX;
    this.patrolMaxX = maxX;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 14);
    body.setOffset(2, 2);

    this.play('hopper-idle');
  }

  public setTarget(player: Player): void {
    this.targetPlayer = player;
  }

  protected override onStunEnter(): void {
    this.play('hopper-prep'); // Fica agachado zonzo
    this.setVelocity(0, 0);
  }

  protected override onStunExit(): void {
    this.play('hopper-idle');
  }

  update(time: number): void {
    if (this.isDefeated) return;

    if (this.isStunned) {
      this.updateStunVisuals();
      if (!this.isSliding) {
        this.setVelocityX(0);
      }
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;

    if (grounded) {
      this.setVelocityX(this.isPreparingJump ? 0 : body.velocity.x * 0.8);
      if (!this.isPreparingJump && this.anims.currentAnim?.key !== 'hopper-idle') {
        this.play('hopper-idle', true);
      }

      if (this.targetPlayer && !this.isPreparingJump) {
        // Vira de frente para o jogador enquanto espera
        this.setFlipX(this.targetPlayer.x < this.x);
      }

      if (!this.isPreparingJump && time - this.lastJumpTime >= this.jumpCooldown) {
        if (this.targetPlayer && Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y) < 140) {
          this.isPreparingJump = true;
          this.play('hopper-prep', true);
          this.scene.tweens.add({
            targets: this,
            scaleY: 0.8,
            duration: 200,
            yoyo: true,
            onComplete: () => {
              if (!this.active || this.isDefeated || this.isStunned) return;
              this.isPreparingJump = false;
              this.lastJumpTime = time;
              this.jumpTowardPlayer();
            },
          });
        }
      }
    } else {
      if (this.anims.currentAnim?.key !== 'hopper-jump') {
        this.play('hopper-jump', true);
      }
    }
  }

  private jumpTowardPlayer(): void {
    let dir = this.targetPlayer && this.targetPlayer.x > this.x ? 1 : -1;
    // Evita saltar em precipícios se estiver na beirada
    if (dir > 0 && this.patrolMaxX !== undefined && this.x + 35 > this.patrolMaxX) {
      dir = -1;
    } else if (dir < 0 && this.patrolMinX !== undefined && this.x - 35 < this.patrolMinX) {
      dir = 1;
    }

    // Sprite original olha para a DIREITA. Ao saltar para a esquerda (dir < 0), setFlipX(true)
    this.setFlipX(dir < 0);
    this.setVelocity(dir * 55, -210);
  }
}
