import Phaser from 'phaser';
import { GameState } from '../../systems/GameState';
import { AudioSystem } from '../../systems/AudioSystem';
import { Player } from '../Player';
import { addPixelText } from '../../ui/PixelText';

export abstract class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  abstract update(time:number,delta:number):void;
  public hp = 2;
  public isDefeated = false;
  public isStunned = false;
  public isSliding = false;
  protected points = 100;
  protected touchDamage = 1;
  private stunTimer?: Phaser.Time.TimerEvent;
  private starsGfx?: Phaser.GameObjects.Graphics;
  private starsAngle = 0;
  private lastDamageAt = -1000;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(6);
  }

  public takeDamage(damage: number, impactX?: number): void {
    if (this.isDefeated || this.scene.time.now-this.lastDamageAt<250) return;
    this.lastDamageAt=this.scene.time.now;
    this.hp -= Math.min(1,damage);

    AudioSystem.get().playHit();
    this.setTint(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (this.active) this.clearTint();
    });

    if (this.hp <= 0) {
      this.die(impactX);
    } else { this.stun(); }
  }

  public stun(): void {
    if (this.isDefeated || this.isStunned) return;
    this.isStunned = true;
    this.isSliding = false;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
    }

    AudioSystem.get().playStun();
    this.onStunEnter();

    // Feedback visual "ZONZO!"


    // Cria estrelinhas orbitando sobre a cabeça
    this.createStunStars();

    // Timer de recuperação: 3.8s (o bicho acorda se não for derrotado ou chutado)
    this.stunTimer?.remove();
    this.stunTimer = this.scene.time.delayedCall(3800, () => {
      if (!this.active || this.isDefeated) return;
      this.recoverFromStun();
    });
  }

  protected onStunEnter(): void {
    // Override pelas subclasses (ex: frame de casco encolhido)
  }

  protected onStunExit(): void {
    // Override pelas subclasses (ex: voltar a andar)
  }

  private recoverFromStun(): void {
    if (this.isDefeated || !this.isStunned || this.isSliding) return;

    // Chacoalha antes de despertar
    this.scene.tweens.add({
      targets: this,
      x: this.x + 2,
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        if (!this.active || this.isDefeated || this.isSliding) return;
        this.isStunned = false;
        this.clearStunVisuals();
        this.onStunExit();
      },
    });
  }

  private createStunStars(): void {
    this.clearStunVisuals();
    this.starsGfx = this.scene.add.graphics().setDepth(15);
  }

  private clearStunVisuals(): void {
    if (this.starsGfx) {
      this.starsGfx.destroy();
      this.starsGfx = undefined;
    }
  }

  public updateStunVisuals(): void {
    if (!this.isStunned || !this.starsGfx || this.isDefeated) return;
    this.starsGfx.clear();
    this.starsAngle += 0.08;

    const centerX = this.x;
    const centerY = this.y - 12;
    const radiusX = 8;
    const radiusY = 3.5;

    // 3 estrelinhas amarelas orbitando
    for (let i = 0; i < 3; i++) {
      const a = this.starsAngle + (i * Math.PI * 2) / 3;
      const sx = centerX + Math.cos(a) * radiusX;
      const sy = centerY + Math.sin(a) * radiusY;

      this.starsGfx.fillStyle(0xfde047, 1);
      this.starsGfx.fillRect(sx - 1, sy - 1, 3, 3);
      this.starsGfx.fillStyle(0xffffff, 0.9);
      this.starsGfx.fillRect(sx, sy, 1, 1);
    }
  }

  public showFloatingNotice(text: string, color: number): void {
    const notice = addPixelText(this.scene, Math.round(this.x), Math.round(this.y - 14), text, {
      scale: 1,
      color,
      originX: 0.5,
      originY: 0.5,
      depth: 25,
    });

    this.scene.tweens.add({
      targets: notice,
      y: notice.y - 16,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => notice.destroy(),
    });
  }

  public die(impactX?: number): void {
    if (this.isDefeated) return;
    this.isDefeated = true;
    this.clearStunVisuals();
    this.stunTimer?.remove();

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
    if (!this.isDefeated && !this.isStunned) player.receiveDamage(this.touchDamage, this.x);
  }

  public override destroy(fromScene?: boolean): void {
    this.clearStunVisuals();
    this.stunTimer?.remove();
    super.destroy(fromScene);
  }
}
