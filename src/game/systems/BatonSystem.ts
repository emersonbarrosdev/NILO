import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnemyBase } from '../entities/enemies/EnemyBase';
import { AudioSystem } from './AudioSystem';
import { BATON, batonCentreFromGrip, batonBoundsAtAngle, type BatonState } from '../config/batonConfig';

/** One object and one canonical scale from hand to flight, ground and hand again. */
export class BatonSystem {
  public readonly weapon: Phaser.Physics.Arcade.Sprite;
  public state: BatonState = 'HELD';
  public get dropped(): Phaser.Physics.Arcade.Sprite | undefined { return this.player.hasBaton ? undefined : this.weapon; }
  public get inFlight(): boolean { return this.state === 'RELEASE' || this.state === 'FLYING' || this.state === 'BOUNCING'; }
  public get canonicalLength(): number { return BATON.length * BATON.scale; }
  private thrownAt = 0;
  private clock = 0;
  private swingUntil = 0;
  private swingStarts = 0;
  private hit = new Set<object>();
  private collider: Phaser.Physics.Arcade.Collider;
  private recovering = false;
  private disposed = false;

  constructor(private scene: Phaser.Scene, private player: Player, surfaces: Phaser.GameObjects.GameObject[], private enemies: EnemyBase[], private strikeObjects: (area: Phaser.Geom.Rectangle) => boolean) {
    this.weapon = scene.physics.add.sprite(player.x, player.y, 'baton').setDepth(player.depth + .1);
    this.weapon.setDisplaySize(BATON.length * BATON.scale, BATON.thickness * BATON.scale);
    const body = this.weapon.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setBounce(.25, .25); body.enable = false;
    this.collider = scene.physics.add.collider(this.weapon, surfaces, this.collideSurface, undefined, this);
    scene.events.on('baton-swing', this.swing, this);
    scene.events.on('baton-prepare', this.prepare, this);
    scene.events.on('baton-throw', this.throw, this);
    scene.events.on('baton-retrieve-request', this.requestRetrieve, this);
    scene.events.on('baton-recover', this.recover, this);
    scene.events.on('baton-action-cancel', this.cancelAction, this);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncHeld, this);
    scene.events.once('shutdown', this.destroy, this);
    this.syncHeld();
  }

  private prepare(): void { this.state = 'PREPARE'; }
  private swing(_direction: number, time = this.clock): void {
    this.state = 'MELEE'; this.swingStarts = time + BATON.melee.activeStartMs;
    this.swingUntil = time + BATON.melee.activeEndMs; this.hit.clear();
  }

  private syncHeld(): void {
    if (this.disposed || !this.weapon.active || !this.player.active) return;
    if (!this.player.hasBaton) return;
    const hand = this.player.getHandPose(), centre = batonCentreFromGrip(hand);
    this.weapon.setPosition(centre.x, centre.y).setAngle(hand.angle).setAlpha(this.player.alpha).setVisible(this.player.visible && !this.player.isDead);
    this.weapon.setDepth(this.player.depth + .1);
  }

  private throw(direction: number, up: boolean, time = this.clock): void {
    // Player has selected the exact release pose already. Reuse this same sprite.
    const hand = this.player.getHandPose(), centre = batonCentreFromGrip(hand);
    const body = this.weapon.body as Phaser.Physics.Arcade.Body;
    this.weapon.setPosition(centre.x, centre.y).setAngle(hand.angle).setAlpha(1).setVisible(true);
    body.enable = true; body.setAllowGravity(true); body.reset(centre.x, centre.y);
    this.updateBodyBounds();
    this.weapon.setVelocity(direction * (up ? BATON.throw.lobSpeed : BATON.throw.forwardSpeed), up ? BATON.throw.lobUpwardSpeed : BATON.throw.upwardSpeed).setAngularVelocity(direction * 720);
    this.state = 'RELEASE'; this.thrownAt = time; this.hit.clear();
  }

  private updateBodyBounds(): void {
    const body = this.weapon.body as Phaser.Physics.Arcade.Body;
    const bounds = batonBoundsAtAngle(this.weapon.angle);
    body.setSize(bounds.width / this.weapon.scaleX, bounds.height / this.weapon.scaleY, true);
  }

  private collideSurface(): void {
    if (!this.inFlight) return;
    this.strikeObjects(this.weapon.getBounds());
    const body = this.weapon.body as Phaser.Physics.Arcade.Body;
    if ((body.blocked.down || body.touching.down) && Math.abs(body.velocity.y) < 32) this.land();
    else {
      this.state = 'BOUNCING';
      this.weapon.setAngularVelocity(this.weapon.body!.velocity.x < 0 ? -250 : 250);
    }
  }

  private land(): void {
    this.state = 'GROUND';
    this.weapon.setVelocity(0, 0).setAngularVelocity(0).setAngle(0);
    this.updateBodyBounds();
    // Arcade keeps gravity enabled so the baton also rests on lower surfaces after a ledge bounce.
  }

  private requestRetrieve(): void {
    if (this.state !== 'GROUND' || this.recovering || this.player.isDead) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y + 10, this.weapon.x, this.weapon.y) > BATON.retrieve.radius) return;
    this.recovering = this.player.beginRetrieve();
  }

  private recover(): void {
    if (!this.recovering || this.player.isDead) return;
    const body = this.weapon.body as Phaser.Physics.Arcade.Body;
    body.enable = false; body.setAllowGravity(false); this.weapon.setVelocity(0, 0).setAngularVelocity(0);
    this.player.hasBaton = true; this.recovering = false; this.state = 'RECOVERED';
    this.syncHeld(); AudioSystem.get().playHit();
  }

  private cancelAction(): void {
    this.swingUntil = 0; this.recovering = false;
    if (this.player.hasBaton) this.state = 'HELD';
  }

  update(time: number): void {
    this.clock = time;
    if (this.player.isDead) { if (this.player.hasBaton) this.weapon.setVisible(false); return; }
    if (this.player.hasBaton) {
      this.syncHeld();
      if (!this.player.isActing) this.state = 'HELD';
      if (this.state === 'MELEE' && time >= this.swingStarts && time < this.swingUntil) {
        const area = this.weapon.getBounds(); Phaser.Geom.Rectangle.Inflate(area, 3, 4);
        for (const enemy of this.enemies) {
          if (!enemy.active || enemy.isDefeated || this.hit.has(enemy)) continue;
          if (Phaser.Geom.Intersects.RectangleToRectangle(area, enemy.getBounds())) {
            this.hit.add(enemy); enemy.takeDamage(1, this.player.x);
          }
        }
        this.strikeObjects(area);
      }
      return;
    }
    if (this.state === 'RELEASE' && time > this.thrownAt) this.state = 'FLYING';
    this.updateBodyBounds();
    const body = this.weapon.body as Phaser.Physics.Arcade.Body;
    if (this.inFlight) {
      for (const enemy of this.enemies) {
        if (!enemy.active || enemy.isDefeated || this.hit.has(enemy)) continue;
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.weapon.getBounds(), enemy.getBounds())) {
          this.hit.add(enemy); enemy.takeDamage(1, this.weapon.x);
          this.state = 'BOUNCING'; this.weapon.setVelocity(-body.velocity.x * .25, -75).setAngularVelocity(250); break;
        }
      }
      if (this.strikeObjects(this.weapon.getBounds())) { this.state = 'BOUNCING'; this.weapon.setVelocityX(-body.velocity.x * .25); }
      if ((body.blocked.down || body.touching.down) && Math.abs(body.velocity.y) < 8 && time - this.thrownAt > 110) this.land();
    }
    if (this.weapon.y > this.scene.physics.world.bounds.height + 16 || this.weapon.x < -24 || this.weapon.x > this.scene.physics.world.bounds.right + 24 || time - this.thrownAt > 12000) {
      // Preserve the existing lost-weapon safety; the recovered world item still requires K.
      body.reset(this.player.x - this.player.facingDirection * 16, this.player.y - 12);
      this.weapon.setVelocity(0, 0); this.land(); this.thrownAt = time - 500;
      this.scene.tweens.add({ targets: this.weapon, alpha: .25, duration: 100, yoyo: true, repeat: 3 });
    }
  }

  reset(): void {
    if (this.disposed) return;
    this.scene.tweens.killTweensOf(this.weapon);
    const body = this.weapon.body as Phaser.Physics.Arcade.Body;
    body.enable = false; body.setAllowGravity(false); this.weapon.setVelocity(0, 0).setAngularVelocity(0).setAlpha(1);
    this.player.hasBaton = true; this.state = 'HELD'; this.swingUntil = 0; this.hit.clear(); this.recovering = false;
    this.syncHeld();
  }

  private destroy(): void {
    this.disposed = true;
    this.scene.events.off('baton-swing', this.swing, this);
    this.scene.events.off('baton-prepare', this.prepare, this);
    this.scene.events.off('baton-throw', this.throw, this);
    this.scene.events.off('baton-retrieve-request', this.requestRetrieve, this);
    this.scene.events.off('baton-recover', this.recover, this);
    this.scene.events.off('baton-action-cancel', this.cancelAction, this);
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncHeld, this);
    this.collider.destroy(); this.weapon.destroy();
  }
}
