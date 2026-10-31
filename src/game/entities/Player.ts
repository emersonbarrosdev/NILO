import Phaser from 'phaser';
import { Projectile } from './Projectile';
import {
  GAIT_MIN_SPEED,
  advanceGaitPhase,
  gaitFrameFromPhase,
  resolveAimPose,
  resolveGaitMode,
  type AimPose,
  type GaitMode,
} from './playerAnimationModel';

const RUN_SPEED = 145;
const GROUND_ACCELERATION = 260;
const BRAKE_ACCELERATION = 900;
const AIR_ACCELERATION = 420;
const GROUND_DRAG = 700;
const AIR_DRAG = 70;
const JUMP_SPEED = 305;
const COYOTE_TIME_MS = 90;
const JUMP_BUFFER_MS = 110;
const QUICK_SHOT_COOLDOWN_MS = 150;
const CHARGED_SHOT_THRESHOLD_MS = 450;
const MAX_CHARGE_MS = 1100;
const LAND_POSE_MS = 90;
const SHOOT_POSE_MS = 150;
const SHOOT_FRAME_COUNT = 3;

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
  private shotGrounded = true;
  private shotAimPose: AimPose = 'horizontal';
  private lastShotAt = Number.NEGATIVE_INFINITY;

  private charging = false;
  private chargeStartedAt = 0;
  private attackWasDown = false;
  private aimX = 1;
  private aimY = 0;

  private gaitPhase = 0;
  private gaitFrame = 0;
  private gaitMode: GaitMode = 'walk';
  private previousX: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-idle-0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.previousX = x;

    this.setCollideWorldBounds(true);
    this.setMaxVelocity(RUN_SPEED, 520);
    this.setDragX(GROUND_DRAG);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 27);
    body.setOffset(5, 4);

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
    const body = this.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;

    if (grounded) this.lastGroundedAt = time;

    if (grounded && !this.wasGrounded && body.velocity.y >= 0) {
      this.landPoseUntil = time + LAND_POSE_MS;
      this.play('player-land', true);
    }

    this.wasGrounded = grounded;

    const input = this.readDirectionalInput();
    this.updateFacing(input.horizontal);
    this.updateMovement(input.horizontal, grounded);
    this.updateAttack(time, grounded, input.horizontal, input.vertical);
    this.updateJump(time, grounded);
    this.updateGait(grounded);
    this.updateVisualState(time, grounded, input.horizontal, input.vertical);
  }

  private readDirectionalInput(): { horizontal: number; vertical: number } {
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const up = this.cursors.up.isDown || this.keyW.isDown;
    const down = this.cursors.down.isDown || this.keyS.isDown;

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

  private updateMovement(horizontal: number, grounded: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const movementScale = this.charging ? 0.78 : 1;

    if (horizontal !== 0) {
      const velocityDirection = Math.sign(body.velocity.x);
      const reversing = grounded && Math.abs(body.velocity.x) > 28 && velocityDirection !== horizontal;
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

  private updateJump(time: number, grounded: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const aimingWithSlingshot = this.charging || this.shootKeyJ.isDown || this.shootKeyX.isDown;

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.jumpKey) ||
      (!aimingWithSlingshot && (
        Phaser.Input.Keyboard.JustDown(this.keyW) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.up)
      ));

    if (jumpPressed) this.jumpBufferedAt = time;

    const canUseCoyoteTime = grounded || time - this.lastGroundedAt <= COYOTE_TIME_MS;
    const jumpBuffered = time - this.jumpBufferedAt <= JUMP_BUFFER_MS;

    if (canUseCoyoteTime && jumpBuffered) {
      this.setVelocityY(-JUMP_SPEED);
      this.jumpBufferedAt = Number.NEGATIVE_INFINITY;
      this.lastGroundedAt = Number.NEGATIVE_INFINITY;
      this.play('player-jump', true);
    }

    const jumpHeld =
      this.jumpKey.isDown ||
      (!aimingWithSlingshot && (this.keyW.isDown || this.cursors.up.isDown));

    if (!jumpHeld && body.velocity.y < -135) this.setVelocityY(-135);
  }

  private updateAttack(
    time: number,
    grounded: boolean,
    horizontal: number,
    vertical: number,
  ): void {
    const attackDown = this.shootKeyJ.isDown || this.shootKeyX.isDown;

    if (attackDown && !this.attackWasDown && time - this.lastShotAt >= QUICK_SHOT_COOLDOWN_MS) {
      this.charging = true;
      this.chargeStartedAt = time;
      this.updateAim(horizontal, vertical);
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

  private updateGait(grounded: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const deltaX = Math.abs(this.x - this.previousX);
    this.previousX = this.x;

    const speed = Math.abs(body.velocity.x);
    this.gaitMode = resolveGaitMode(this.gaitMode, speed);

    if (!grounded || speed <= GAIT_MIN_SPEED || deltaX <= 0.001) return;

    this.gaitPhase = advanceGaitPhase(this.gaitPhase, deltaX, this.gaitMode);
    this.gaitFrame = gaitFrameFromPhase(this.gaitPhase);
  }

  private fireProjectile(time: number, charged: boolean, grounded: boolean): void {
    if (time - this.lastShotAt < QUICK_SHOT_COOLDOWN_MS) return;

    const verticalAim = Math.abs(this.aimX) < 0.2;
    const projectileX = this.x + this.aimX * 13 + (verticalAim ? this.facing * 3 : 0);
    const projectileY = this.y - 6 + this.aimY * 13;
    const projectile = new Projectile(this.scene, projectileX, projectileY, charged);
    projectile.fire(this.aimX, this.aimY);

    this.lastShotAt = time;
    this.shotStartedAt = time;
    this.shootPoseUntil = time + SHOOT_POSE_MS;
    this.shotGrounded = grounded;
    this.shotAimPose = resolveAimPose(this.aimX, this.aimY);

    this.scene.events.emit('player-shot', projectile);
    this.scene.cameras.main.shake(charged ? 45 : 22, charged ? 0.0015 : 0.0007);
  }

  private updateVisualState(
    time: number,
    grounded: boolean,
    horizontal: number,
    vertical: number,
  ): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = Math.abs(body.velocity.x);
    const movingOnGround = grounded && speed > GAIT_MIN_SPEED;

    if (this.charging) {
      const chargeTime = Phaser.Math.Clamp(time - this.chargeStartedAt, 0, MAX_CHARGE_MS);
      const chargeFrame = Math.min(3, Math.floor(chargeTime / 260));
      const aimPose = resolveAimPose(this.aimX, this.aimY);
      this.anims.stop();

      if (movingOnGround) {
        this.setTexture(`player-${this.gaitMode}-charge-${this.gaitFrame}-${aimPose}-${chargeFrame}`);
      } else if (grounded) {
        this.setTexture(`player-charge-ground-${aimPose}-${chargeFrame}`);
      } else {
        this.setTexture(`player-charge-air-${aimPose}-${chargeFrame}`);
      }
      return;
    }

    if (time < this.shootPoseUntil) {
      const elapsed = Math.max(0, time - this.shotStartedAt);
      const shootFrame = Math.min(
        SHOOT_FRAME_COUNT - 1,
        Math.floor(elapsed / (SHOOT_POSE_MS / SHOOT_FRAME_COUNT)),
      );
      this.anims.stop();

      if (this.shotGrounded && movingOnGround) {
        this.setTexture(
          `player-${this.gaitMode}-shoot-${this.gaitFrame}-${this.shotAimPose}-${shootFrame}`,
        );
      } else if (this.shotGrounded) {
        this.setTexture(`player-shoot-ground-${this.shotAimPose}-${shootFrame}`);
      } else {
        this.setTexture(`player-shoot-air-${this.shotAimPose}-${shootFrame}`);
      }
      return;
    }

    if (!grounded) {
      if (body.velocity.y < -35) {
        this.play('player-jump', true);
        return;
      }

      if (Math.abs(body.velocity.y) <= 35) {
        this.anims.stop();
        this.setTexture('player-apex');
        return;
      }

      this.play('player-fall', true);
      return;
    }

    if (time < this.landPoseUntil) return;

    if (vertical > 0) {
      this.anims.stop();
      this.setTexture('player-crouch');
      return;
    }

    const movingAgainstVelocity =
      horizontal !== 0 && speed > 45 && Math.sign(body.velocity.x) !== horizontal;

    if (movingAgainstVelocity) {
      this.anims.stop();
      this.setTexture('player-skid');
      return;
    }

    if (movingOnGround) {
      this.anims.stop();
      this.setTexture(`player-${this.gaitMode}-${this.gaitFrame}`);
      return;
    }

    this.play('player-idle', true);
  }
}
