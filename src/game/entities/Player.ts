import Phaser from 'phaser';
import { InputSettings, touchInput, type InputAction } from '../systems/InputSettings';
import { AudioSystem } from '../systems/AudioSystem';
import { GameState } from '../systems/GameState';
import { GamepadSystem } from '../systems/GamepadSystem';
import { PLAYER_ART, PLAYER_POSES, playerHandAnchor, type PlayerPoseState } from '../config/playerArt';
import { BATON, type HandPose } from '../config/batonConfig';
import { LocomotionCycle, LocomotionGuard, type PlayerMotionState } from '../systems/LocomotionCycle';

type PlayerAction = { kind: 'throw' | 'melee' | 'retrieve'; startedAt: number; direction: number; up: boolean; released: boolean };

export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys: Record<InputAction, Phaser.Input.Keyboard.Key>;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private facing = 1;
  private groundedAt = -1000;
  private jumpAt = -1000;
  private jumped = false;
  private previousJump = false;
  private previousAttack = false;
  private previousThrow = false;
  private attackAt = -1000;
  private action?: PlayerAction;
  private crouching = false;
  private pushingUntil = 0;
  private pushBlocked = false;
  private clock = 0;
  private horizontalIntent = 0;
  public readonly locomotion = new LocomotionCycle(PLAYER_ART.strideLength);
  public readonly locomotionGuard = new LocomotionGuard(this.locomotion);
  public motionState: PlayerMotionState = 'IDLE';
  public poseState: PlayerPoseState = 'idle';
  private wasGrounded = false;
  private gaitWasGrounded = false;
  private landedUntil = 0;
  private hurtUntil = 0;
  private animationX = 0;
  private support?: Phaser.Physics.Arcade.Body;
  private previousSupport?: Phaser.Physics.Arcade.Body;
  private previousSupportX = 0;
  public lastGroundRelativeDelta = 0;
  private readonly contactShadow: Phaser.GameObjects.Ellipse;
  public hasBaton = true;
  public isInvulnerable = false;
  public isDead = false;
  public canStand: () => boolean = () => true;
  public get isCrouching(): boolean { return this.crouching; }
  public get facingDirection(): number { return this.facing; }
  public get isActing(): boolean { return !!this.action; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // All equipment variants share the canonical detailed body. BatonSystem owns the weapon layer.
    super(scene, x, y, 'player-unarmed-sheet', 0);
    scene.add.existing(this); scene.physics.add.existing(this);
    this.animationX = x;
    this.setMaxVelocity(PLAYER_ART.runSpeed, 520).setDragX(920);
    (this.body as Phaser.Physics.Arcade.Body).setSize(14, 25).setOffset(9, 4);
    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.keys = Object.fromEntries(Object.entries(InputSettings.bindings()).map(([action, key]) => [action, keyboard.addKey(key)])) as Record<InputAction, Phaser.Input.Keyboard.Key>;
    this.contactShadow = scene.add.ellipse(x, y + 13, 11, 1.8, 0x10230d, .33).setDepth(9).setVisible(false);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.afterPhysics, this);
    this.once('destroy', () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.afterPhysics, this);
      this.contactShadow.destroy();
    });
  }

  /** Called by the moving-platform collider after Arcade has resolved contact. */
  public noteGroundSupport(body: Phaser.Physics.Arcade.Body): void {
    const own = this.body as Phaser.Physics.Arcade.Body;
    if (own.velocity.y >= 0 && own.bottom <= body.top + 3 && own.right > body.left && own.left < body.right) this.support = body;
  }

  private afterPhysics(): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    const grounded = (body.blocked.down || body.touching.down) && body.velocity.y >= 0;
    const support = grounded && this.support?.enable && body.bottom <= this.support.top + 3
      && body.right > this.support.left && body.left < this.support.right ? this.support : undefined;
    const carried = support && support === this.previousSupport ? support.position.x - this.previousSupportX : 0;
    const worldDelta = this.x - this.animationX;
    const eligible = grounded && this.gaitWasGrounded && this.clock >= this.hurtUntil && !this.isDead;
    // Teleports, first landing and involuntary displacement are not locomotion.
    this.lastGroundRelativeDelta = eligible && Math.abs(worldDelta) < 32 ? worldDelta - carried : 0;
    const movingVoluntarily = eligible && (this.horizontalIntent !== 0 || Math.abs(body.velocity.x) > 1);
    const movementAllowed = this.locomotionGuard.step(this.lastGroundRelativeDelta, movingVoluntarily);
    if (!movementAllowed && movingVoluntarily) {
      // Preserve passive platform carry. Only a verified logical gait failure stops voluntary ground motion.
      this.setX(this.animationX + carried); body.updateFromGameObject(); this.setVelocityX(0);
    }
    this.animationX = this.x;
    this.gaitWasGrounded = grounded;
    this.previousSupport = support;
    this.previousSupportX = support?.position.x ?? 0;
    this.support = undefined;
    this.contactShadow.setVisible(grounded && !this.isDead && this.visible).setPosition(body.center.x, body.bottom + .35);
  }

  public markPushing(blocked = false): void { this.pushingUntil = this.clock + 100; this.pushBlocked = blocked; }

  public getHandPose(): HandPose {
    const hand = playerHandAnchor(Number(this.frame.name));
    return { x: this.x + hand.x * this.facing, y: this.y + hand.y, angle: this.facing > 0 ? hand.angle : 180 - hand.angle };
  }

  public beginRetrieve(): boolean {
    if (this.isDead || this.hasBaton || this.action) return false;
    this.action = { kind: 'retrieve', startedAt: this.clock, direction: this.facing, up: false, released: false };
    return true;
  }

  private pose(state: PlayerPoseState, index = 0): void {
    this.poseState = state;
    const frames = PLAYER_POSES[state].frames;
    this.anims.stop();
    this.setFrame(frames[Math.min(index, frames.length - 1)]!);
  }

  update(time = this.scene.time.now): void {
    this.clock = time;
    if (this.isDead) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    const pad = GamepadSystem.get().poll();
    const held = (action: InputAction) => this.keys[action].isDown || touchInput[action];
    const horizontal = Number(held('right') || this.cursors.right.isDown || pad.right) - Number(held('left') || this.cursors.left.isDown || pad.left);
    this.horizontalIntent = horizontal;
    const down = held('down') || this.cursors.down.isDown || pad.down;
    const up = held('up') || this.cursors.up.isDown || pad.up;
    if (grounded) {
      this.groundedAt = time; this.jumped = false;
      if (!this.wasGrounded) this.landedUntil = time + 65;
    }
    this.wasGrounded = grounded;
    this.crouching = (grounded && down) || (this.crouching && !this.canStand());
    body.setSize(14, this.crouching ? 17 : 25, false).setOffset(9, this.crouching ? 12 : 4);
    if (horizontal && !this.action) { this.facing = horizontal; this.setFlipX(horizontal < 0); }
    body.setMaxVelocity(this.crouching ? PLAYER_ART.crouchSpeed : PLAYER_ART.runSpeed, 520);
    const hurt = time < this.hurtUntil;
    const movementAllowed = !grounded || this.locomotionGuard.groundMovementAllowed;
    if (hurt) {
      // Knockback retains its impulse; gait safety does not pin it or apply idle drag.
      this.setAccelerationX(0).setDragX(0);
    } else {
      const retrieving = this.action?.kind === 'retrieve';
      this.setAccelerationX(movementAllowed && !retrieving ? horizontal * (grounded ? 900 : 600) : 0);
      this.setDragX(horizontal && !retrieving ? 0 : grounded ? 1050 : 55);
      if (movementAllowed && grounded && horizontal && !retrieving && Math.abs(body.velocity.x) < 8) this.setVelocityX(horizontal * 28);
    }

    const jump = held('jump') || pad.jump;
    if (jump && !this.previousJump && !this.crouching && !hurt) this.jumpAt = time;
    this.previousJump = jump;
    if (!this.jumped && !this.crouching && !hurt && time - this.groundedAt < 130 && time - this.jumpAt < 150) {
      this.jumped = true; this.groundedAt = -1000; this.jumpAt = -1000;
      this.setVelocityY(-288); AudioSystem.get().playJump();
    }
    if (!jump && body.velocity.y < -110 && !hurt) this.setVelocityY(-110);

    const attack = held('attack') || pad.attack, throwDown = held('throw') || pad.throw;
    if (throwDown && !this.previousThrow && !this.hasBaton && !this.action && !hurt) this.scene.events.emit('baton-retrieve-request');
    if (this.hasBaton && !this.action && !hurt && time - this.attackAt > BATON.melee.durationMs) {
      if (throwDown && !this.previousThrow) {
        this.attackAt = time;
        this.action = { kind: 'throw', startedAt: time, direction: this.facing, up, released: false };
        this.scene.events.emit('baton-prepare', time);
      } else if (attack && !this.previousAttack) {
        this.attackAt = time;
        this.action = { kind: 'melee', startedAt: time, direction: this.facing, up: false, released: false };
        this.scene.events.emit('baton-swing', this.facing, time);
        AudioSystem.get().playShoot(false);
      }
    }
    this.previousAttack = attack; this.previousThrow = throwDown;

    if (hurt) {
      this.motionState = 'HURT'; this.pose(body.velocity.y < 0 ? 'knockback' : 'hurt');
    } else if (this.animateAction(time)) {
      // Action pose and exact release are evaluated together before the weapon is updated.
    } else if (!grounded || body.velocity.y < -1) {
      this.motionState = body.velocity.y < 0 ? 'JUMP' : 'FALL';
      this.pose(body.velocity.y < -35 ? 'jump_up' : 'fall', body.velocity.y < -150 ? 0 : 1);
    } else if (time < this.pushingUntil && horizontal) {
      this.motionState = 'PUSH';
      this.pose(this.crouching ? 'push_crouched' : this.pushBlocked ? 'push_blocked' : 'push_standing', this.pushBlocked ? Math.floor(time / 110) % 2 : this.locomotion.sample.frameIndex);
    } else if (this.crouching) {
      this.motionState = 'CROUCH'; this.pose(horizontal ? 'crouch_move' : 'crouch', this.locomotion.sample.frameIndex);
    } else if (Math.abs(body.velocity.x) > 8) {
      this.motionState = Math.abs(body.velocity.x) > 65 ? 'RUN' : 'WALK';
      this.pose(this.motionState === 'RUN' ? 'run' : 'walk', this.locomotion.sample.frameIndex);
    } else if (time < this.landedUntil) {
      this.motionState = 'LAND'; this.pose('land', time < this.landedUntil - 32 ? 0 : 1);
    } else {
      this.motionState = 'IDLE';
      const idleTime = time % 3600;
      this.pose(idleTime > 3430 ? 'blink' : 'idle', idleTime > 3515 ? 1 : 0);
    }
    if (this.x < 8) this.setX(8);
    const right = this.scene.physics.world.bounds.right - 8;
    if (this.x > right) { this.setX(right); this.setVelocityX(0); }
    if (this.y > this.scene.physics.world.bounds.height + 32) this.handleDeath(true);
  }

  private animateAction(time: number): boolean {
    const action = this.action;
    if (!action) return false;
    const elapsed = time - action.startedAt;
    if (action.kind === 'throw') {
      if (elapsed >= BATON.throw.durationMs) { this.action = undefined; return false; }
      this.motionState = 'THROW';
      const throwPose = (state: 'throw_prepare' | 'throw_release' | 'throw_recover', index: number, crouchIndex: number): void => {
        if (this.crouching) { this.poseState = state; this.anims.stop(); this.setFrame(48 + crouchIndex); }
        else this.pose(state, index);
      };
      if (elapsed < BATON.throw.releaseMs) throwPose('throw_prepare', Math.floor(elapsed / 60), Math.floor(elapsed / 60));
      else if (!action.released) {
        throwPose('throw_release', 0, 3);
        action.released = true; this.hasBaton = false;
        this.scene.events.emit('baton-throw', action.direction, action.up, time);
        AudioSystem.get().playShoot(true);
      } else {
        const index = Math.max(0, Math.min(3, Math.floor((elapsed - BATON.throw.releaseMs - 55) / 55)));
        throwPose('throw_recover', index, 4 + index);
      }
    } else if (action.kind === 'melee') {
      if (elapsed >= BATON.melee.durationMs) { this.action = undefined; return false; }
      this.motionState = 'ATTACK';
      if (this.crouching) { this.poseState = 'melee'; this.setFrame(48 + Math.min(7, Math.floor(elapsed / 45))); }
      else this.pose('melee', Math.floor(elapsed / 60));
    } else {
      if (elapsed >= BATON.retrieve.durationMs) { this.action = undefined; return false; }
      this.motionState = 'RETRIEVE'; this.pose('retrieve_bat', Math.floor(elapsed / 60));
      if (!action.released && elapsed >= BATON.retrieve.recoverMs) {
        action.released = true;
        this.scene.events.emit('baton-recover', time);
      }
    }
    return true;
  }

  receiveDamage(_amount: number, sourceX: number): void {
    if (this.isInvulnerable || this.isDead) return;
    AudioSystem.get().playPlayerHurt();
    if (GameState.get().takeDamage(1)) { this.handleDeath(false, true); return; }
    this.action = undefined; this.scene.events.emit('baton-action-cancel');
    this.hurtUntil = this.clock + 240;
    this.motionState = 'HURT';
    this.setAccelerationX(0).setDragX(0).setVelocity(this.x < sourceX ? -95 : 95, -155);
    this.grantInvulnerability();
  }

  handleDeath(_isFall: boolean, lifeAlreadyLost = false): void {
    if (this.isDead) return;
    this.isDead = true; this.motionState = 'DEAD'; this.action = undefined; this.setAccelerationX(0);
    this.scene.events.emit('baton-action-cancel');
    (this.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;
    AudioSystem.get().playPlayerDeath();
    this.pose('defeat'); this.setVelocity(0, -240);
    this.scene.cameras.main.shake(160, .004);
    this.scene.events.emit('player-died', lifeAlreadyLost);
  }

  respawn(x: number, y: number): void {
    this.locomotionGuard.reset(); this.animationX = x; this.motionState = 'IDLE';
    this.wasGrounded = false; this.gaitWasGrounded = false; this.hurtUntil = 0;
    this.support = undefined; this.previousSupport = undefined; this.lastGroundRelativeDelta = 0;
    this.action = undefined; this.attackAt = -1000; this.pushingUntil = 0;
    this.isDead = false; this.jumped = false; this.crouching = false; this.hasBaton = true;
    this.setPosition(x, y).setVelocity(0, 0).setAccelerationX(0).setAngle(0).setAlpha(1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = false; body.setSize(14, 25, false).setOffset(9, 4);
    body.updateFromGameObject(); this.pose('respawn');
    this.grantInvulnerability();
  }

  private grantInvulnerability(): void {
    this.isInvulnerable = true;
    this.scene.tweens.add({ targets: this, alpha: .3, duration: 90, yoyo: true, repeat: 8, onComplete: () => { this.setAlpha(1); this.isInvulnerable = false; } });
  }
}
