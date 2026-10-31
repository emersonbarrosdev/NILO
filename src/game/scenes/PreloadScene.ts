import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';

type PlayerPose =
  | 'idle'
  | 'run'
  | 'run-shoot'
  | 'run-charge'
  | 'jump'
  | 'apex'
  | 'fall'
  | 'land'
  | 'crouch'
  | 'skid'
  | 'shoot-ground'
  | 'shoot-air'
  | 'charge';

type LegSupport = 'right' | 'left' | 'flight';

type LegPose = {
  thighX: number;
  thighY: number;
  shinX: number;
  shinY: number;
  footX: number;
  footY: number;
};

type RunGaitFrame = {
  support: LegSupport;
  right: LegPose;
  left: LegPose;
};

// Ciclo mestre de 8 frames. A segunda metade e a primeira metade estão
// rigidamente separadas por 180 graus (4 frames): direita -> esquerda.
const RUN_GAIT: RunGaitFrame[] = [
  {
    support: 'right',
    right: { thighX: 12, thighY: 21, shinX: 14, shinY: 24, footX: 14, footY: 28 },
    left: { thighX: 8, thighY: 21, shinX: 6, shinY: 23, footX: 5, footY: 25 },
  },
  {
    support: 'right',
    right: { thighX: 12, thighY: 22, shinX: 13, shinY: 25, footX: 13, footY: 28 },
    left: { thighX: 8, thighY: 21, shinX: 7, shinY: 23, footX: 6, footY: 25 },
  },
  {
    support: 'right',
    right: { thighX: 11, thighY: 22, shinX: 10, shinY: 25, footX: 9, footY: 28 },
    left: { thighX: 10, thighY: 21, shinX: 12, shinY: 23, footX: 13, footY: 25 },
  },
  {
    support: 'flight',
    right: { thighX: 10, thighY: 21, shinX: 7, shinY: 24, footX: 5, footY: 27 },
    left: { thighX: 12, thighY: 21, shinX: 15, shinY: 23, footX: 16, footY: 25 },
  },
  {
    support: 'left',
    right: { thighX: 8, thighY: 21, shinX: 6, shinY: 23, footX: 5, footY: 25 },
    left: { thighX: 12, thighY: 21, shinX: 14, shinY: 24, footX: 14, footY: 28 },
  },
  {
    support: 'left',
    right: { thighX: 8, thighY: 21, shinX: 7, shinY: 23, footX: 6, footY: 25 },
    left: { thighX: 12, thighY: 22, shinX: 13, shinY: 25, footX: 13, footY: 28 },
  },
  {
    support: 'left',
    right: { thighX: 10, thighY: 21, shinX: 12, shinY: 23, footX: 13, footY: 25 },
    left: { thighX: 11, thighY: 22, shinX: 10, shinY: 25, footX: 9, footY: 28 },
  },
  {
    support: 'flight',
    right: { thighX: 12, thighY: 21, shinX: 15, shinY: 23, footX: 16, footY: 25 },
    left: { thighX: 10, thighY: 21, shinX: 7, shinY: 24, footX: 5, footY: 27 },
  },
];

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.preload); }

  create(): void {
    this.validateRunCycleDefinition();
    this.createPlayerPrototypeFrames();
    this.createProjectileTextures();
    this.createEnemyPlaceholder();
    this.createPlayerAnimations();

    // O preload técnico fica invisível enquanto os assets ainda são instantâneos.
    this.scene.start(SCENE_KEYS.title);
  }

  private validateRunCycleDefinition(): void {
    if (RUN_GAIT.length !== 8) {
      throw new Error('RUN_GAIT precisa ter exatamente 8 frames.');
    }

    for (let frame = 0; frame < 4; frame += 1) {
      const firstHalf = RUN_GAIT[frame];
      const oppositeHalf = RUN_GAIT[frame + 4];

      if (firstHalf.support === 'right' && oppositeHalf.support !== 'left') {
        throw new Error(`RUN_GAIT inválido: frame ${frame} não alterna apoio 180 graus depois.`);
      }

      if (firstHalf.support === 'flight' && oppositeHalf.support !== 'flight') {
        throw new Error(`RUN_GAIT inválido: frame de voo ${frame} não possui par a 180 graus.`);
      }
    }
  }

  private createPlayerPrototypeFrames(): void {
    for (let frame = 0; frame < 4; frame += 1) {
      this.createPlayerFrame(`player-idle-${frame}`, 'idle', frame);
    }

    for (let runFrame = 0; runFrame < 8; runFrame += 1) {
      this.createPlayerFrame(`player-run-${runFrame}`, 'run', runFrame, runFrame);
      this.createPlayerFrame(`player-run-shoot-${runFrame}`, 'run-shoot', 1, runFrame);

      for (let chargeFrame = 0; chargeFrame < 4; chargeFrame += 1) {
        this.createPlayerFrame(
          `player-run-charge-${runFrame}-${chargeFrame}`,
          'run-charge',
          chargeFrame,
          runFrame,
        );
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

    for (let frame = 0; frame < 3; frame += 1) {
      this.createPlayerFrame(`player-shoot-ground-${frame}`, 'shoot-ground', frame);
      this.createPlayerFrame(`player-shoot-air-${frame}`, 'shoot-air', frame);
    }

    for (let frame = 0; frame < 4; frame += 1) {
      this.createPlayerFrame(`player-charge-${frame}`, 'charge', frame);
    }
  }

  private createPlayerFrame(
    key: string,
    pose: PlayerPose,
    actionFrame: number,
    gaitFrame = actionFrame,
  ): void {
    const g = this.add.graphics();
    const runningPose = pose === 'run' || pose === 'run-shoot' || pose === 'run-charge';
    const isCrouching = pose === 'crouch' || pose === 'land';
    const bodyShiftY = isCrouching ? 4 : runningPose && gaitFrame % 2 === 1 ? 1 : 0;
    const headY = 3 + bodyShiftY;
    const torsoY = 12 + bodyShiftY;

    // Cabelo grande e irregular para deixar a silhueta infantil reconhecível.
    g.fillStyle(0x18223a, 1);
    g.fillRect(7, headY, 10, 3);
    g.fillRect(5, headY + 2, 13, 4);
    g.fillRect(4, headY + 4, 4, 3);
    g.fillRect(16, headY - 1, 3, 4);
    g.fillRect(18, headY, 2, 2);

    // Cabeça proporcionalmente maior que o corpo.
    g.fillStyle(0xf2b879, 1);
    g.fillRect(7, headY + 5, 10, 7);
    g.fillRect(6, headY + 7, 2, 4);
    g.fillStyle(0x1d2c42, 1).fillRect(15, headY + 7, 2, 2);
    g.fillStyle(0xe58e58, 1).fillRect(16, headY + 10, 2, 1);

    // Camiseta/colete curto e colorido.
    g.fillStyle(0x1f8fa8, 1).fillRect(7, torsoY, 10, 8);
    g.fillStyle(0xffd45a, 1).fillRect(8, torsoY + 1, 8, 2);
    g.fillStyle(0xe65f42, 1).fillRect(6, torsoY + 3, 2, 5);

    // Bolsa pequena de pedras, sem aparência de equipamento adulto.
    g.fillStyle(0x6d4331, 1).fillRect(15, torsoY + 5, 5, 5);
    g.fillStyle(0xa7683f, 1).fillRect(16, torsoY + 5, 3, 1);
    g.fillStyle(0xf4d07b, 1).fillRect(10, torsoY, 1, 9);

    this.drawArms(g, pose, actionFrame, gaitFrame, torsoY);
    this.drawLegs(g, pose, gaitFrame, torsoY);

    g.generateTexture(key, 24, 32);
    g.destroy();
  }

  private drawArms(
    g: Phaser.GameObjects.Graphics,
    pose: PlayerPose,
    actionFrame: number,
    gaitFrame: number,
    torsoY: number,
  ): void {
    const skin = 0xf2b879;
    const sling = 0x6a3c27;
    const shootingPose =
      pose === 'shoot-ground' ||
      pose === 'shoot-air' ||
      pose === 'charge' ||
      pose === 'run-shoot' ||
      pose === 'run-charge';

    if (shootingPose) {
      const charging = pose === 'charge' || pose === 'run-charge';
      const pull = charging
        ? Math.min(4, 1 + actionFrame)
        : actionFrame === 0
          ? 2
          : actionFrame === 1
            ? 4
            : 1;

      g.fillStyle(skin, 1).fillRect(16, torsoY + 2, 5, 2);
      g.fillRect(20, torsoY + 1, 2, 3);
      g.fillRect(5, torsoY + 3, 5, 2);
      g.fillRect(4, torsoY + 1, 2, 3);

      // Estilingue em Y, sempre visível durante o ataque.
      g.fillStyle(sling, 1).fillRect(21, torsoY - 1, 1, 6);
      g.fillRect(20, torsoY - 2, 1, 3);
      g.fillRect(22, torsoY - 2, 1, 3);

      // Elástico tensionado; quanto maior a carga, mais ele recua.
      g.fillStyle(0x2b2a38, 1).fillRect(17 - pull, torsoY, 4 + pull, 1);
      g.fillStyle(0x55505f, 1).fillRect(17 - pull, torsoY + 3, 4 + pull, 1);
      return;
    }

    if (pose === 'run') {
      // Braços também usam o mesmo indexador mestre; não existe animação independente.
      const swing = [0, 1, 2, 1, 0, -1, -2, -1][gaitFrame % 8];
      g.fillStyle(skin, 1).fillRect(5, torsoY + 2 + Math.max(0, swing), 2, 6);
      g.fillRect(17, torsoY + 2 + Math.max(0, -swing), 2, 6);
      return;
    }

    if (pose === 'jump' || pose === 'apex' || pose === 'fall') {
      g.fillStyle(skin, 1).fillRect(4, torsoY + 1, 3, 5);
      g.fillRect(17, torsoY + 1, 3, 5);
      return;
    }

    g.fillStyle(skin, 1).fillRect(5, torsoY + 2, 2, 6);
    g.fillRect(17, torsoY + 2, 2, 6);
  }

  private drawLegs(
    g: Phaser.GameObjects.Graphics,
    pose: PlayerPose,
    gaitFrame: number,
    torsoY: number,
  ): void {
    const shorts = 0x243653;
    const rightLeg = 0xf0ad72;
    const leftLeg = 0xc9895d;
    const rightShoe = 0xfff0c4;
    const leftShoe = 0xc9b88f;

    const hipY = torsoY + 8;
    g.fillStyle(shorts, 1).fillRect(8, hipY, 8, 4);

    const runningPose = pose === 'run' || pose === 'run-shoot' || pose === 'run-charge';
    if (runningPose) {
      const gait = RUN_GAIT[gaitFrame % RUN_GAIT.length];

      // Perna esquerda fica um tom atrás para distinguir fisicamente os membros.
      this.drawLeg(g, gait.left, leftLeg, leftShoe);
      this.drawLeg(g, gait.right, rightLeg, rightShoe);
      return;
    }

    if (pose === 'jump') {
      g.fillStyle(rightLeg, 1).fillRect(8, 24, 3, 4);
      g.fillStyle(leftLeg, 1).fillRect(14, 22, 3, 4);
      g.fillStyle(rightShoe, 1).fillRect(7, 27, 5, 2);
      g.fillStyle(leftShoe, 1).fillRect(13, 25, 5, 2);
      return;
    }

    if (pose === 'apex') {
      g.fillStyle(rightLeg, 1).fillRect(7, 23, 3, 4);
      g.fillStyle(leftLeg, 1).fillRect(15, 23, 3, 4);
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

    this.anims.create({
      key: 'player-shoot-ground',
      frames: [0, 1, 2].map((frame) => ({ key: `player-shoot-ground-${frame}` })),
      frameRate: 18,
      repeat: 0,
    });

    this.anims.create({
      key: 'player-shoot-air',
      frames: [0, 1, 2].map((frame) => ({ key: `player-shoot-air-${frame}` })),
      frameRate: 18,
      repeat: 0,
    });
  }
}
