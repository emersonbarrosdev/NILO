import Phaser from 'phaser';
import { Player } from '../Player';
import { AudioSystem } from '../../systems/AudioSystem';

export class FallingPlatform extends Phaser.Physics.Arcade.Sprite {
  private initialX: number;
  private initialY: number;
  private isTriggered = false;
  private isFalling = false;
  private respawnTime = 3200;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'platform-log');
    this.initialX = x;
    this.initialY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(.5,0).setDisplaySize(44,10);
    this.setDepth(3);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setFriction(1, 0);

    // Semissólida one-way: pouso seguro por cima
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    body.checkCollision.up = true;
    body.setSize(this.width,12);
    body.setOffset(0,0);
  }

  public checkPlayerStep(player: Player): void {
    if (this.isTriggered || this.isFalling || !this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const playerBody = player.body as Phaser.Physics.Arcade.Body;

    // Se o player estiver pisando em cima
    const isStandingOn = body.touching.up && playerBody.touching.down && player.y <= this.y;

    if (isStandingOn) {
      this.triggerFall();
    }
  }

  private triggerFall(): void {
    this.isTriggered = true;

    AudioSystem.get().playHit();

    // Partículas de serragem / lascas de madeira caindo
    const emitter = this.scene.add.graphics().setDepth(2);
    emitter.fillStyle(0x8b5a2b, 1);
    for (let i = 0; i < 5; i++) {
      emitter.fillRect(this.x - 16 + i * 8, this.y + 4, 2, 2);
    }
    this.scene.tweens.add({
      targets: emitter,
      y: emitter.y + 16,
      alpha: 0,
      duration: 280,
      onComplete: () => emitter.destroy(),
    });

    // Tremor de aviso pré-queda (320ms)
    this.scene.tweens.add({
      targets: this,
      x: this.x + 2,
      duration: 40,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        if (!this.active) return;
        this.drop();
      },
    });
  }

  private drop(): void {
    this.isFalling = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.checkCollision.up = false;
      body.setAllowGravity(true);
      body.setVelocityY(220);
    }

    // Leve inclinação ao cair
    this.scene.tweens.add({
      targets: this,
      angle: 14,
      duration: 400,
    });

    // Desaparece e reaparece após alguns segundos
    this.scene.time.delayedCall(this.respawnTime, () => {
      if (!this.scene) return;
      this.respawn();
    });
  }

  private respawn(): void {
    this.isTriggered = false;
    this.isFalling = false;
    this.setAngle(0);
    (this.body as Phaser.Physics.Arcade.Body).reset(this.initialX,this.initialY);
    this.setAlpha(0);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.setAllowGravity(false);
      body.checkCollision.up = true;
    }

    // Fade-in suave de retorno
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 300,
    });
  }
}

