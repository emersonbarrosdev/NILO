import Phaser from 'phaser';
import { Projectile } from './Projectile';
import { resolveAimPose, type AimPose } from './playerAnimationModel';
import { AudioSystem } from '../systems/AudioSystem';
import { GameState } from '../systems/GameState';
import { GamepadSystem } from '../systems/GamepadSystem';

const RUN_SPEED = 118;
const GROUND_ACCELERATION = 840;
const BRAKE_ACCELERATION = 1300;
const AIR_ACCELERATION = 600;
const GROUND_DRAG = 920;
const AIR_DRAG = 50;
const JUMP_SPEED = 288;
const COYOTE_TIME_MS = 140;
const JUMP_BUFFER_MS = 160;
const QUICK_SHOT_COOLDOWN_MS = 140;
const CHARGED_SHOT_THRESHOLD_MS = 400;
const MAX_CHARGE_MS = 1000;
const LAND_POSE_MS = 60;
const SHOOT_POSE_MS = 130;
const SHOOT_FRAME_COUNT = 3;
const PLAYER_SCALE = 1;

const PLAYER_FRAMES = {
  crouch: 5,
  skid: 6,
  walkBase: 8,
  runBase: 16,
  apex: 27,
  fall: 28,
  aimForward: [32, 33],
  aimUpward: [34, 35],
  shootForward: [36, 37, 38],
  shootUpward: [39, 40, 41],
  charge: [42, 43, 44],
} as const;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keyW: Phaser.Input.Keyboard.Key;
  private readonly keyA: Phaser.Input.Keyboard.Key;
  private readonly keyS: Phaser.Input.Keyboard.Key;
  private readonly keyD: Phaser.Input.Keyboard.Key;
  private readonly jumpKey: Phaser.Input.Keyboard.Key;
  private readonly shootKeyJ: Phaser.Input.Keyboard.Key;
  private readonly shootKeyX: Phaser.Input.Keyboard.Key;

  private facing = 1;
  private lastGroundedAt = 0;
  private jumpBufferedAt = Number.NEGATIVE_INFINITY;
  private wasGrounded = false;
  private landPoseUntil = 0;
  private shootPoseUntil = 0;
  private shotStartedAt = Number.NEGATIVE_INFINITY;
  private shotAimPose: AimPose = 'horizontal';
  private lastShotAt = Number.NEGATIVE_INFINITY;
  private hasJumpedInAir = false;
  private padPrevJump = false;

  private charging = false;
  private chargeStartedAt = 0;
  private attackWasDown = false;
  private aimX = 1;
  private aimY = 0;

  public isInvulnerable = false;
  public isDead = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-sheet', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(PLAYER_SCALE);
    this.setCollideWorldBounds(false); // Permite quedas controladas em buracos
    this.setMaxVelocity(RUN_SPEED, 520);
    this.setDragX(GROUND_DRAG);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 26);
    body.setOffset(9, 3);

    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shootKeyJ = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.shootKeyX = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    this.play('player-idle');
  }

  update(time = this.scene.time.now): void {
    if (this.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;

    if (grounded) {
      this.lastGroundedAt = time;
      this.hasJumpedInAir = false;
    }

    if (grounded && !this.wasGrounded && body.velocity.y >= 0) {
      this.landPoseUntil = time + LAND_POSE_MS;
      this.play('player-land', true);
      this.spawnDustParticle(this.x - 5, this.y + 12, -1, -0.4);
      this.spawnDustParticle(this.x + 5, this.y + 12, 1, -0.4);
    }

    this.wasGrounded = grounded;

    const input = this.readDirectionalInput();
    const crouching = grounded && input.vertical > 0;

    this.updateFacing(input.horizontal);
    this.updateMovement(input.horizontal, grounded, crouching);
    this.updateAttack(time, grounded, input.horizontal, input.vertical);
    this.updateJump(time, grounded, crouching);
    this.updateVisualState(time, grounded, input.horizontal, input.vertical);

    // Queda fatal fora do mundo
    if (this.y > 220) {
      this.handleDeath(true);
    }
  }

  public receiveDamage(amount: number, sourceX: number): void {
    if (this.isInvulnerable || this.isDead) return;

    AudioSystem.get().playPlayerHurt();
    const isGameOverOrDead = GameState.get().takeDamage(amount);

    if (isGameOverOrDead) {
      this.handleDeath(false);
      return;
    }

    // Knockback
    const knockbackDir = sourceX < this.x ? 1 : -1;
    this.setVelocity(knockbackDir * 90, -160);

    // Invulnerabilidade temporária
    this.isInvulnerable = true;
    const blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        this.setAlpha(1);
        this.isInvulnerable = false;
      },
    });

    this.scene.events.once('shutdown', () => blinkTween.stop());
  }

  public handleDeath(_isFall: boolean): void {
    if (this.isDead) return;
    this.isDead = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.checkCollision.none = true;
    }

    AudioSystem.get().playPlayerDeath();
    this.anims.stop();
    this.setFrame(24); // Pose de choque / salto dramático
    this.setVelocity(0, 0);

    this.scene.cameras.main.shake(180, 0.004);

    // Salto dramático para o alto com rotação no ar (estilo clássico Mario / Mega Man / DKC)
    this.scene.time.delayedCall(80, () => {
      if (body) {
        body.setVelocityY(-260);
        body.setVelocityX(this.facing * -20);
      }
      this.scene.tweens.add({
        targets: this,
        angle: this.facing * 360,
        duration: 700,
        ease: 'Linear',
      });
    });

    this.scene.events.emit('player-died');
  }

  public respawn(x: number, y: number): void {
    this.isDead = false;
    this.hasJumpedInAir = false;
    this.setAngle(0);
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setAlpha(1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.checkCollision.none = false;
    }

    // Breve invulnerabilidade ao renascer
    this.isInvulnerable = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      duration: 100,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.setAlpha(1);
        this.isInvulnerable = false;
      },
    });
  }

  private readDirectionalInput(): { horizontal: number; vertical: number } {
    const pad = GamepadSystem.get().poll();
    const left = this.cursors.left.isDown || this.keyA.isDown || pad.left;
    const right = this.cursors.right.isDown || this.keyD.isDown || pad.right;
    const up = this.cursors.up.isDown || this.keyW.isDown || pad.up;
    const down = this.cursors.down.isDown || this.keyS.isDown || pad.down;

    return {
      horizontal: Number(right) - Number(left),
      vertical: Number(down) - Number(up),
    };
  }

  private updateFacing(horizontal: number): void {
    if (horizontal === 0) return;
    this.facing = horizontal > 0 ? 1 : -1;
    this.setFlipX(this.facing < 0);
  }

  private updateMovement(horizontal: number, grounded: boolean, crouching: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const movementScale = this.charging ? 0.78 : 1;

    if (crouching) {
      this.setAccelerationX(0);
      this.setDragX(0);
      this.setVelocityX(0);
      body.setMaxVelocity(RUN_SPEED * movementScale, 520);
      return;
    }

    if (horizontal !== 0) {
      // Impulso inicial imediato ao sair do repouso para eliminar qualquer sensação de arrasto ou deslize
      if (grounded && Math.abs(body.velocity.x) < 10) {
        body.setVelocityX(horizontal * 36);
      }
      const velocityDirection = Math.sign(body.velocity.x);
      const reversing = grounded && Math.abs(body.velocity.x) > 22 && velocityDirection !== horizontal;
      const acceleration = grounded
        ? reversing
          ? BRAKE_ACCELERATION
          : GROUND_ACCELERATION
        : AIR_ACCELERATION;

      this.setAccelerationX(horizontal * acceleration * movementScale);
      this.setDragX(0);
    } else {
      this.setAccelerationX(0);
      this.setDragX(grounded ? GROUND_DRAG : AIR_DRAG);
    }

    body.setMaxVelocity(RUN_SPEED * movementScale, 520);
  }

  private updateJump(time: number, grounded: boolean, crouching: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const pad = GamepadSystem.get().poll();
    const padJumpJustPressed = pad.jump && !this.padPrevJump;
    this.padPrevJump = pad.jump;

    const aimingWithSlingshot = this.charging || this.shootKeyJ.isDown || this.shootKeyX.isDown || pad.attack;

    const jumpPressed =
      !crouching && (
        padJumpJustPressed ||
        Phaser.Input.Keyboard.JustDown(this.jumpKey) ||
        (!aimingWithSlingshot && (
          Phaser.Input.Keyboard.JustDown(this.keyW) ||
          Phaser.Input.Keyboard.JustDown(this.cursors.up)
        ))
      );

    if (jumpPressed) this.jumpBufferedAt = time;

    const canUseCoyoteTime = (grounded || time - this.lastGroundedAt <= COYOTE_TIME_MS) && !this.hasJumpedInAir;
    const jumpBuffered = time - this.jumpBufferedAt <= JUMP_BUFFER_MS;

    if (canUseCoyoteTime && jumpBuffered) {
      this.hasJumpedInAir = true;
      this.setVelocityY(-JUMP_SPEED);
      this.jumpBufferedAt = Number.NEGATIVE_INFINITY;
      this.lastGroundedAt = Number.NEGATIVE_INFINITY;
      this.play('player-jump', true);
      AudioSystem.get().playJump();
      this.spawnDustParticle(this.x - 4, this.y + 12, -0.8, 0.2);
      this.spawnDustParticle(this.x + 4, this.y + 12, 0.8, 0.2);
    }

    const jumpHeld =
      pad.jump ||
      this.jumpKey.isDown ||
      (!aimingWithSlingshot && (this.keyW.isDown || this.cursors.up.isDown));

    if (!jumpHeld && body.velocity.y < -110) this.setVelocityY(-110);
  }

  private updateAttack(
    time: number,
    grounded: boolean,
    horizontal: number,
    vertical: number,
  ): void {
    const pad = GamepadSystem.get().poll();
    const attackDown = this.shootKeyJ.isDown || this.shootKeyX.isDown || pad.attack;

    if (attackDown && !this.attackWasDown && time - this.lastShotAt >= QUICK_SHOT_COOLDOWN_MS) {
      this.charging = true;
      this.chargeStartedAt = time;
      this.updateAim(horizontal, vertical);
      AudioSystem.get().playCharge();
    }

    if (attackDown && this.charging) this.updateAim(horizontal, vertical);

    if (!attackDown && this.attackWasDown && this.charging) {
      const chargeTime = Phaser.Math.Clamp(time - this.chargeStartedAt, 0, MAX_CHARGE_MS);
      const charged = chargeTime >= CHARGED_SHOT_THRESHOLD_MS;
      this.fireProjectile(time, charged, grounded);
      this.charging = false;
    }

    this.attackWasDown = attackDown;
  }

  private updateAim(horizontal: number, vertical: number): void {
    let x = horizontal;
    let y = vertical;

    if (x === 0 && y === 0) x = this.facing;

    if (x !== 0) {
      this.facing = x > 0 ? 1 : -1;
      this.setFlipX(this.facing < 0);
    }

    const vector = new Phaser.Math.Vector2(x, y);
    if (vector.lengthSq() === 0) vector.set(this.facing, 0);
    vector.normalize();

    this.aimX = vector.x;
    this.aimY = vector.y;
  }

  private fireProjectile(time: number, charged: boolean, _grounded: boolean): void {
    if (time - this.lastShotAt < QUICK_SHOT_COOLDOWN_MS) return;

    const verticalAim = Math.abs(this.aimX) < 0.2;
    const projectileX = this.x + this.aimX * 13 + (verticalAim ? this.facing * 3 : 0);
    const projectileY = this.y - 6 + this.aimY * 13;
    const projectile = new Projectile(this.scene, projectileX, projectileY, charged);
    projectile.fire(this.aimX, this.aimY);

    this.lastShotAt = time;
    this.shotStartedAt = time;
    this.shootPoseUntil = time + SHOOT_POSE_MS;
    this.shotAimPose = resolveAimPose(this.aimX, this.aimY);

    AudioSystem.get().playShoot(charged);

    this.scene.events.emit('player-shot', projectile);
    this.scene.cameras.main.shake(charged ? 45 : 22, charged ? 0.0015 : 0.0007);
  }

  private setPlayerFrame(frame: number): void {
    this.anims.stop();
    this.setFrame(frame);
  }

  private isUpwardPose(aimPose: AimPose): boolean {
    return aimPose === 'up' || aimPose === 'up-diagonal';
  }

  private updateVisualState(
    time: number,
    grounded: boolean,
    horizontal: number,
    vertical: number,
  ): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = Math.abs(body.velocity.x);
    const crouching = grounded && vertical > 0;
    const movingOnGround =
      grounded && !crouching && (speed > 8 || horizontal !== 0);

    if (this.charging) {
      const chargeTime = Phaser.Math.Clamp(time - this.chargeStartedAt, 0, MAX_CHARGE_MS);
      const chargeFrame = Math.min(2, Math.floor(chargeTime / 260));
      const aimPose = resolveAimPose(this.aimX, this.aimY);

      if (this.isUpwardPose(aimPose)) {
        this.setPlayerFrame(PLAYER_FRAMES.aimUpward[chargeFrame > 0 ? 1 : 0]);
      } else if (chargeFrame === 0) {
        this.setPlayerFrame(PLAYER_FRAMES.aimForward[0]);
      } else {
        this.setPlayerFrame(PLAYER_FRAMES.charge[chargeFrame]);
      }
      return;
    }

    if (time < this.shootPoseUntil) {
      const elapsed = Math.max(0, time - this.shotStartedAt);
      const shootFrame = Math.min(
        SHOOT_FRAME_COUNT - 1,
        Math.floor(elapsed / (SHOOT_POSE_MS / SHOOT_FRAME_COUNT)),
      );

      if (this.isUpwardPose(this.shotAimPose)) {
        this.setPlayerFrame(PLAYER_FRAMES.shootUpward[shootFrame]);
      } else {
        this.setPlayerFrame(PLAYER_FRAMES.shootForward[shootFrame]);
      }
      return;
    }

    if (!grounded) {
      if (body.velocity.y < -35) {
        this.play('player-jump', true);
        return;
      }

      if (Math.abs(body.velocity.y) <= 35) {
        this.setPlayerFrame(PLAYER_FRAMES.apex);
        return;
      }

      this.play('player-fall', true);
      return;
    }

    if (time < this.landPoseUntil && !movingOnGround) return;

    if (crouching) {
      this.play('player-crouch', true);
      return;
    }

    const movingAgainstVelocity =
      horizontal !== 0 && speed > 32 && Math.sign(body.velocity.x) !== horizontal;

    if (movingAgainstVelocity) {
      this.play('player-skid', true);
      if (Phaser.Math.Between(0, 10) > 6) {
        this.spawnDustParticle(this.x - this.facing * 7, this.y + 12, -this.facing * 1.2, -0.3);
      }
      return;
    }

    if (movingOnGround) {
      if (speed >= 65) {
        this.play('player-run', true);
        if (this.anims.currentAnim?.key === 'player-run') {
          this.anims.timeScale = Math.min(1.4, Math.max(0.85, speed / RUN_SPEED));
        }
      } else {
        this.play('player-walk', true);
        if (this.anims.currentAnim?.key === 'player-walk') {
          this.anims.timeScale = Math.min(1.3, Math.max(0.75, speed / 55));
        }
      }
      return;
    }

    this.play('player-idle', true);
  }

  private spawnDustParticle(x: number, y: number, velX: number, velY: number): void {
    if (!this.scene) return;
    const dust = this.scene.add.graphics().setDepth(8);
    dust.fillStyle(0xfef9c3, 0.85);
    dust.fillRect(-1, -1, 3, 3);
    dust.fillStyle(0xffffff, 0.95);
    dust.fillRect(0, 0, 1, 1);
    dust.setPosition(x, y);

    this.scene.tweens.add({
      targets: dust,
      x: x + velX * 10,
      y: y + velY * 5,
      scaleX: 0.3,
      scaleY: 0.3,
      alpha: 0,
      duration: 220,
      ease: 'Cubic.easeOut',
      onComplete: () => dust.destroy(),
    });
  }
}
