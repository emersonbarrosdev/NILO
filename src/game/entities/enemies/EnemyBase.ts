import Phaser from 'phaser';
import { GameState } from '../../systems/GameState';
import { AudioSystem } from '../../systems/AudioSystem';
import { Player } from '../Player';

export abstract class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  public hp = 1;
  public isDefeated = false;
  protected points = 100;
  protected touchDamage = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(6);
  }

  public takeDamage(damage: number, impactX?: number): void {
    if (this.isDefeated) return;
    this.hp -= damage;

    AudioSystem.get().playHit();
    this.setTint(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (this.active) this.clearTint();
    });

    if (this.hp <= 0) {
      this.die(impactX);
    }
  }

  public die(impactX?: number): void {
    if (this.isDefeated) return;
    this.isDefeated = true;

    AudioSystem.get().playEnemyDefeat();
    GameState.get().recordDefeatEnemy(this.points);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.checkCollision.none = true;
      body.setVelocity(impactX && impactX < this.x ? 60 : -60, -120);
    }

    // Efeito de estrelas / poeira de derrota
    const emitter = this.scene.add.graphics().setDepth(15);
    emitter.fillStyle(0xffdf68, 1);
    for (let i = 0; i < 4; i++) {
      emitter.fillRect(this.x + (i % 2 === 0 ? -6 : 6), this.y + (i > 1 ? -6 : 6), 3, 3);
    }
    this.scene.tweens.add({
      targets: emitter,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 180,
      onComplete: () => emitter.destroy(),
    });

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      angle: 180,
      duration: 250,
      onComplete: () => this.destroy(),
    });
  }

  public onPlayerOverlap(player: Player): void {
    if (this.isDefeated) return;

    // Se o player estiver caindo em cima do inimigo (pulo clássico na cabeça)
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    const isStomp = playerBody.velocity.y > 20 && player.y < this.y - 4;

    if (isStomp) {
      playerBody.setVelocityY(-220); // Impulso do salto
      this.takeDamage(1, player.x);
    } else {
      player.receiveDamage(this.touchDamage, this.x);
    }
  }
}

