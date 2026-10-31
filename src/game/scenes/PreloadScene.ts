import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import {
  RUN_GAIT,
  WALK_GAIT,
  validatePlayerAnimationModel,
  type AimPose,
  type GaitFrame,
  type GaitMode,
  type LegPose,
} from '../entities/playerAnimationModel';

type PlayerPose =
  | 'idle'
  | 'walk'
  | 'run'
  | 'walk-shoot'
  | 'run-shoot'
  | 'walk-charge'
  | 'run-charge'
  | 'jump'
  | 'apex'
  | 'fall'
  | 'land'
  | 'crouch'
  | 'skid'
  | 'shoot-ground'
  | 'shoot-air'
  | 'charge-ground'
  | 'charge-air';

const AIM_POSES: AimPose[] = [
  'horizontal',
  'up-diagonal',
  'up',
  'down-diagonal',
  'down',
];

const WALK_BODY_BOB = [0, 1, 1, 0, 0, 1, 1, 0];
const RUN_BODY_BOB = [0, 2, 0, -1, 0, 2, 0, -1];
const ARM_SWING = [-3, -2, 0, 2, 3, 2, 0, -2];

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.preload); }

  create(): void {
    validatePlayerAnimationModel();
    this.createPlayerPrototypeFrames();
    this.createProjectileTextures();
    this.createEnemyPlaceholder();
    this.createPlayerAnimations();

    this.scene.start(SCENE_KEYS.title);
  }

  private createPlayerPrototypeFrames(): void {
    for (let frame = 0; frame < 4; frame += 1) {
      this.createPlayerFrame(`player-idle-${frame}`, 'idle', frame);
    }

    for (const mode of ['walk', 'run'] as GaitMode[]) {
      for (let gaitFrame = 0; gaitFrame < 8; gaitFrame += 1) {
        this.createPlayerFrame(`player-${mode}-${gaitFrame}`, mode, gaitFrame, gaitFrame);

        for (const aimPose of AIM_POSES) {
          for (let actionFrame = 0; actionFrame < 3; actionFrame += 1) {
            this.createPlayerFrame(
              `player-${mode}-shoot-${gaitFrame}-${aimPose}-${actionFrame}`,
              mode === 'walk' ? 'walk-shoot' : 'run-shoot',
              actionFrame,
              gaitFrame,
              aimPose,
            );
          }

          for (let chargeFrame = 0; chargeFrame < 4; chargeFrame += 1) {
            this.createPlayerFrame(
              `player-${mode}-charge-${gaitFrame}-${aimPose}-${chargeFrame}`,
              mode === 'walk' ? 'walk-charge' : 'run-charge',
              chargeFrame,
              gaitFrame,
              aimPose,
            );
          }
        }
      }
    }

    for (let frame = 0; frame < 2; frame += 1) {
      this.createPlayerFrame(`player-jump-${frame}`, 'jump', frame);
      this.createPlayerFrame(`player-fall-${frame}`, 'fall', frame);
      this.createPlayerFrame(`player-land-${frame}`, 'land', frame);
    }

    this.createPlayerFrame('player-apex', 'apex', 0);
    this.createPlayerFrame('player-crouch', 'crouch', 0);
    this.createPlayerFrame('player-skid', 'skid', 0);

    for (const aimPose of AIM_POSES) {
      for (let frame = 0; frame < 3; frame += 1) {
        this.createPlayerFrame(
          `player-shoot-ground-${aimPose}-${frame}`,
          'shoot-ground',
          frame,
          frame,
          aimPose,
        );
        this.createPlayerFrame(
          `player-shoot-air-${aimPose}-${frame}`,
          'shoot-air',
          frame,
          frame,
          aimPose,
        );
      }

      for (let frame = 0; frame < 4; frame += 1) {
        this.createPlayerFrame(
          `player-charge-ground-${aimPose}-${frame}`,
          'charge-ground',
          frame,
          frame,
          aimPose,
        );
        this.createPlayerFrame(
          `player-charge-air-${aimPose}-${frame}`,
          'charge-air',
          frame,
          frame,
          aimPose,
        );
      }
    }
  }

  private createPlayerFrame(
    key: string,
    pose: PlayerPose,
    actionFrame: number,
    gaitFrame = actionFrame,
    aimPose: AimPose = 'horizontal',
  ): void {
    const g = this.add.graphics();
    const movementMode = this.getMovementMode(pose);
    const isCrouching = pose === 'crouch' || pose === 'land';
    const isAirPose =
      pose === 'jump' || pose === 'apex' || pose === 'fall' || pose === 'shoot-air' || pose === 'charge-air';

    const bodyShiftY = isCrouching
      ? 4
      : movementMode === 'walk'
        ? WALK_BODY_BOB[gaitFrame % 8]
        : movementMode === 'run'
          ? RUN_BODY_BOB[gaitFrame % 8]
          : isAirPose
            ? -1
            : 0;
    const bodyShiftX = movementMode === 'run' ? 1 : 0;
    const headY = 3 + bodyShiftY;
    const torsoY = 12 + bodyShiftY;

    this.drawHeadAndTorso(g, headY, torsoY, bodyShiftX);
    this.drawArms(g, pose, actionFrame, gaitFrame, torsoY, bodyShiftX, aimPose);
    this.drawLegs(g, pose, gaitFrame, torsoY, movementMode);

    g.generateTexture(key, 24, 32);
    g.destroy();
  }

  private getMovementMode(pose: PlayerPose): GaitMode | null {
    if (pose === 'walk' || pose === 'walk-shoot' || pose === 'walk-charge') return 'walk';
    if (pose === 'run' || pose === 'run-shoot' || pose === 'run-charge') return 'run';
    return null;
  }

  private drawHeadAndTorso(
    g: Phaser.GameObjects.Graphics,
    headY: number,
    torsoY: number,
    shiftX: number,
  ): void {
    g.fillStyle(0x18223a, 1);
    g.fillRect(7 + shiftX, headY, 10, 3);
    g.fillRect(5 + shiftX, headY + 2, 13, 4);
    g.fillRect(4 + shiftX, headY + 4, 4, 3);
    g.fillRect(16 + shiftX, headY - 1, 3, 4);
    g.fillRect(18 + shiftX, headY, 2, 2);

    g.fillStyle(0xf2b879, 1);
    g.fillRect(7 + shiftX, headY + 5, 10, 7);
    g.fillRect(6 + shiftX, headY + 7, 2, 4);
    g.fillStyle(0x1d2c42, 1).fillRect(15 + shiftX, headY + 7, 2, 2);
    g.fillStyle(0xe58e58, 1).fillRect(16 + shiftX, headY + 10, 2, 1);

    g.fillStyle(0x1f8fa8, 1).fillRect(7 + shiftX, torsoY, 10, 8);
    g.fillStyle(0xffd45a, 1).fillRect(8 + shiftX, torsoY + 1, 8, 2);
    g.fillStyle(0xe65f42, 1).fillRect(6 + shiftX, torsoY + 3, 2, 5);

    g.fillStyle(0x6d4331, 1).fillRect(15 + shiftX, torsoY + 5, 5, 5);
    g.fillStyle(0xa7683f, 1).fillRect(16 + shiftX, torsoY + 5, 3, 1);
    g.fillStyle(0xf4d07b, 1).fillRect(10 + shiftX, torsoY, 1, 9);
  }

  private drawArms(
    g: Phaser.GameObjects.Graphics,
    pose: PlayerPose,
    actionFrame: number,
    gaitFrame: number,
    torsoY: number,
    shiftX: number,
    aimPose: AimPose,
  ): void {
    const shootingPose =
      pose === 'shoot-ground' ||
      pose === 'shoot-air' ||
      pose === 'charge-ground' ||
      pose === 'charge-air' ||
      pose === 'walk-shoot' ||
      pose === 'run-shoot' ||
      pose === 'walk-charge' ||
      pose === 'run-charge';

    if (shootingPose) {
      const charging =
        pose === 'charge-ground' ||
        pose === 'charge-air' ||
        pose === 'walk-charge' ||
        pose === 'run-charge';
      this.drawSlingshotArms(g, aimPose, actionFrame, torsoY, shiftX, charging);
      return;
    }

    if (pose === 'walk' || pose === 'run') {
      const swing = ARM_SWING[gaitFrame % 8];
      const nearDirection = Math.sign(swing);
      const farDirection = -nearDirection;
      this.drawRunningArm(g, 17 + shiftX + swing, torsoY + 2, true, nearDirection);
      this.drawRunningArm(g, 5 + shiftX - swing, torsoY + 2, false, farDirection);
      return;
    }

    if (pose === 'jump' || pose === 'apex' || pose === 'fall') {
      g.fillStyle(0xc98b61, 1).fillRect(4 + shiftX, torsoY + 1, 3, 5);
      g.fillStyle(0xf2b879, 1).fillRect(17 + shiftX, torsoY + 1, 3, 5);
      return;
    }

    g.fillStyle(0xc98b61, 1).fillRect(5 + shiftX, torsoY + 2, 2, 6);
    g.fillStyle(0xf2b879, 1).fillRect(17 + shiftX, torsoY + 2, 2, 6);
  }

  private drawRunningArm(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    near: boolean,
    forearmDirection: number,
  ): void {
    const color = near ? 0xf2b879 : 0xc98b61;
    g.fillStyle(color, 1).fillRect(x, y, 2, 4);
    g.fillRect(x + forearmDirection, y + 3, 2, 4);
  }

  private drawSlingshotArms(
    g: Phaser.GameObjects.Graphics,
    aimPose: AimPose,
    actionFrame: number,
    torsoY: number,
    shiftX: number,
    charging: boolean,
  ): void {
    const skin = 0xf2b879;
    const backSkin = 0xc98b61;
    const sling = 0x6a3c27;
    const band = 0x2b2a38;
    const pull = charging
      ? Math.min(4, 1 + actionFrame)
      : actionFrame === 0
        ? 2
        : actionFrame === 1
          ? 4
          : 1;

    if (aimPose === 'up') {
      g.fillStyle(skin, 1).fillRect(15 + shiftX, torsoY - 5, 2, 8);
      g.fillRect(14 + shiftX, torsoY - 7, 3, 3);
      g.fillStyle(backSkin, 1).fillRect(8 + shiftX, torsoY, 5, 2);
      g.fillRect(7 + shiftX, torsoY + 1, 2, 3);

      g.fillStyle(sling, 1).fillRect(15 + shiftX, torsoY - 10, 1, 5);
      g.fillRect(13 + shiftX, torsoY - 11, 2, 4);
      g.fillRect(16 + shiftX, torsoY - 11, 2, 4);

      g.fillStyle(band, 1).fillRect(10 + shiftX, torsoY - 7 + pull, 6, 1);
      g.fillRect(10 + shiftX, torsoY - 9 + pull, 6, 1);
      return;
    }

    if (aimPose === 'up-diagonal') {
      g.fillStyle(skin, 1).fillRect(16 + shiftX, torsoY - 2, 3, 2);
      g.fillRect(18 + shiftX, torsoY - 5, 3, 3);
      g.fillStyle(backSkin, 1).fillRect(8 + shiftX, torsoY + 1, 5, 2);
      g.fillRect(7 + shiftX, torsoY + 2, 2, 3);

      g.fillStyle(sling, 1).fillRect(20 + shiftX, torsoY - 8, 1, 6);
      g.fillRect(19 + shiftX, torsoY - 9, 1, 3);
      g.fillRect(21 + shiftX, torsoY - 9, 1, 3);

      g.fillStyle(band, 1).fillRect(14 - pull + shiftX, torsoY - 3, 6 + pull, 1);
      g.fillRect(14 - pull + shiftX, torsoY, 6 + pull, 1);
      return;
    }

    if (aimPose === 'down') {
      g.fillStyle(skin, 1).fillRect(16 + shiftX, torsoY + 3, 2, 7);
      g.fillRect(15 + shiftX, torsoY + 8, 3, 3);
      g.fillStyle(backSkin, 1).fillRect(8 + shiftX, torsoY + 2, 5, 2);
      g.fillRect(7 + shiftX, torsoY + 1, 2, 3);

      g.fillStyle(sling, 1).fillRect(16 + shiftX, torsoY + 9, 1, 6);
      g.fillRect(14 + shiftX, torsoY + 13, 2, 3);
      g.fillRect(17 + shiftX, torsoY + 13, 2, 3);

      g.fillStyle(band, 1).fillRect(10 + shiftX, torsoY + 7 - pull, 6, 1);
      g.fillRect(10 + shiftX, torsoY + 9 - pull, 6, 1);
      return;
    }

    if (aimPose === 'down-diagonal') {
      g.fillStyle(skin, 1).fillRect(16 + shiftX, torsoY + 4, 3, 2);
      g.fillRect(18 + shiftX, torsoY + 6, 3, 3);
      g.fillStyle(backSkin, 1).fillRect(8 + shiftX, torsoY + 2, 5, 2);
      g.fillRect(7 + shiftX, torsoY + 1, 2, 3);

      g.fillStyle(sling, 1).fillRect(20 + shiftX, torsoY + 7, 1, 6);
      g.fillRect(19 + shiftX, torsoY + 11, 1, 3);
      g.fillRect(21 + shiftX, torsoY + 11, 1, 3);

      g.fillStyle(band, 1).fillRect(14 - pull + shiftX, torsoY + 5, 6 + pull, 1);
      g.fillRect(14 - pull + shiftX, torsoY + 8, 6 + pull, 1);
      return;
    }

    g.fillStyle(skin, 1).fillRect(16 + shiftX, torsoY + 2, 5, 2);
    g.fillRect(20 + shiftX, torsoY + 1, 2, 3);
    g.fillStyle(backSkin, 1).fillRect(5 + shiftX, torsoY + 3, 5, 2);
    g.fillRect(4 + shiftX, torsoY + 1, 2, 3);

    g.fillStyle(sling, 1).fillRect(21 + shiftX, torsoY - 1, 1, 6);
    g.fillRect(20 + shiftX, torsoY - 2, 1, 3);
    g.fillRect(22 + shiftX, torsoY - 2, 1, 3);

    g.fillStyle(band, 1).fillRect(17 - pull + shiftX, torsoY, 4 + pull, 1);
    g.fillRect(17 - pull + shiftX, torsoY + 3, 4 + pull, 1);
  }

  private drawLegs(
    g: Phaser.GameObjects.Graphics,
    pose: PlayerPose,
    gaitFrame: number,
    torsoY: number,
    movementMode: GaitMode | null,
  ): void {
    const shorts = 0x243653;
    const rightLeg = 0xf0ad72;
    const leftLeg = 0xc9895d;
    const rightShoe = 0xfff0c4;
    const leftShoe = 0xc9b88f;

    const hipY = torsoY + 8;
    g.fillStyle(shorts, 1).fillRect(8, hipY, 8, 4);

    if (movementMode) {
      const gait = this.getGait(movementMode, gaitFrame);
      this.drawLeg(g, gait.left, leftLeg, leftShoe);
      this.drawLeg(g, gait.right, rightLeg, rightShoe);
      return;
    }

    if (pose === 'jump') {
      g.fillStyle(rightLeg, 1).fillRect(8, 23, 3, 5);
      g.fillStyle(leftLeg, 1).fillRect(14, 21, 3, 5);
      g.fillStyle(rightShoe, 1).fillRect(7, 27, 5, 2);
      g.fillStyle(leftShoe, 1).fillRect(13, 25, 5, 2);
      return;
    }

    if (pose === 'apex' || pose === 'shoot-air' || pose === 'charge-air') {
      g.fillStyle(rightLeg, 1).fillRect(7, 22, 3, 5);
      g.fillStyle(leftLeg, 1).fillRect(15, 22, 3, 5);
      g.fillStyle(rightShoe, 1).fillRect(6, 26, 5, 2);
      g.fillStyle(leftShoe, 1).fillRect(14, 26, 5, 2);
      return;
    }

    if (pose === 'fall') {
      g.fillStyle(rightLeg, 1).fillRect(7, 23, 3, 6);
      g.fillStyle(leftLeg, 1).fillRect(15, 23, 3, 6);
      g.fillStyle(rightShoe, 1).fillRect(6, 28, 5, 2);
      g.fillStyle(leftShoe, 1).fillRect(14, 28, 5, 2);
      return;
    }

    if (pose === 'crouch' || pose === 'land') {
      g.fillStyle(rightLeg, 1).fillRect(7, 27, 4, 2);
      g.fillStyle(leftLeg, 1).fillRect(14, 27, 4, 2);
      g.fillStyle(rightShoe, 1).fillRect(5, 29, 6, 2);
      g.fillStyle(leftShoe, 1).fillRect(14, 29, 6, 2);
      return;
    }

    if (pose === 'skid') {
      g.fillStyle(rightLeg, 1).fillRect(6, 24, 3, 5);
      g.fillStyle(leftLeg, 1).fillRect(15, 23, 3, 5);
      g.fillStyle(rightShoe, 1).fillRect(4, 28, 6, 2);
      g.fillStyle(leftShoe, 1).fillRect(14, 27, 6, 2);
      return;
    }

    g.fillStyle(rightLeg, 1).fillRect(8, 24, 3, 5);
    g.fillStyle(leftLeg, 1).fillRect(14, 24, 3, 5);
    g.fillStyle(rightShoe, 1).fillRect(7, 28, 5, 2);
    g.fillStyle(leftShoe, 1).fillRect(13, 28, 5, 2);
  }

  private getGait(mode: GaitMode, frame: number): GaitFrame {
    const gait = mode === 'run' ? RUN_GAIT : WALK_GAIT;
    return gait[frame % gait.length];
  }

  private drawLeg(
    g: Phaser.GameObjects.Graphics,
    leg: LegPose,
    skinColor: number,
    shoeColor: number,
  ): void {
    g.fillStyle(skinColor, 1).fillRect(leg.thighX, leg.thighY, 3, 4);
    g.fillRect(leg.shinX, leg.shinY, 3, 4);
    g.fillStyle(shoeColor, 1).fillRect(leg.footX, leg.footY, 5, 2);
  }

  private createProjectileTextures(): void {
    const g = this.add.graphics();

    g.fillStyle(0x3c3440, 1).fillRect(0, 1, 4, 3);
    g.fillStyle(0x8e817e, 1).fillRect(1, 0, 2, 1);
    g.fillStyle(0xd9c9a7, 1).fillRect(1, 1, 1, 1);
    g.generateTexture('stone-normal', 4, 4);

    g.clear();
    g.fillStyle(0x342c39, 1).fillRect(0, 1, 6, 4);
    g.fillRect(1, 0, 4, 6);
    g.fillStyle(0xd98749, 1).fillRect(1, 1, 4, 4);
    g.fillStyle(0xffe49b, 1).fillRect(2, 1, 2, 2);
    g.generateTexture('stone-charged', 6, 6);

    g.destroy();
  }

  private createEnemyPlaceholder(): void {
    const g = this.add.graphics();
    g.fillStyle(0x8e2948).fillRect(3, 5, 10, 8);
    g.fillStyle(0xef5b5b).fillRect(2, 6, 12, 5);
    g.fillStyle(0xffd05a).fillRect(5, 7, 2, 2);
    g.fillRect(9, 7, 2, 2);
    g.fillStyle(0x25324b).fillRect(4, 13, 3, 2);
    g.fillRect(9, 13, 3, 2);
    g.fillStyle(0x7bdff2).fillRect(0, 8, 2, 2);
    g.fillRect(14, 8, 2, 2);
    g.generateTexture('enemy-placeholder', 16, 16);
    g.destroy();
  }

  private createPlayerAnimations(): void {
    this.anims.create({
      key: 'player-idle',
      frames: [0, 1, 2, 3].map((frame) => ({ key: `player-idle-${frame}` })),
      frameRate: 4,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-jump',
      frames: [0, 1].map((frame) => ({ key: `player-jump-${frame}` })),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-fall',
      frames: [0, 1].map((frame) => ({ key: `player-fall-${frame}` })),
      frameRate: 7,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-land',
      frames: [0, 1].map((frame) => ({ key: `player-land-${frame}` })),
      frameRate: 12,
      repeat: 0,
    });
  }
}
