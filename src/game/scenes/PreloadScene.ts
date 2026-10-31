import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';

type PlayerPose =
  | 'idle'
  | 'run'
  | 'jump'
  | 'apex'
  | 'fall'
  | 'land'
  | 'crouch'
  | 'skid'
  | 'shoot-ground'
  | 'shoot-air'
  | 'charge';

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.preload); }

  create(): void {
    this.createPlayerPrototypeFrames();
    this.createProjectileTextures();
    this.createEnemyPlaceholder();
    this.createPlayerAnimations();

    // O preload técnico fica invisível enquanto os assets ainda são instantâneos.
    this.scene.start(SCENE_KEYS.title);
  }

  private createPlayerPrototypeFrames(): void {
    for (let frame = 0; frame < 4; frame += 1) {
      this.createPlayerFrame(`player-idle-${frame}`, 'idle', frame);
    }

    for (let frame = 0; frame < 8; frame += 1) {
      this.createPlayerFrame(`player-run-${frame}`, 'run', frame);
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

  private createPlayerFrame(key: string, pose: PlayerPose, frame: number): void {
    const g = this.add.graphics();

    const isCrouching = pose === 'crouch' || pose === 'land';
    const bodyShiftY = isCrouching ? 4 : pose === 'run' && frame % 2 === 1 ? 1 : 0;
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

    this.drawArms(g, pose, frame, torsoY);
    this.drawLegs(g, pose, frame, torsoY);

    g.generateTexture(key, 24, 32);
    g.destroy();
  }

  private drawArms(
    g: Phaser.GameObjects.Graphics,
    pose: PlayerPose,
    frame: number,
    torsoY: number,
  ): void {
    const skin = 0xf2b879;
    const sling = 0x6a3c27;

    if (pose === 'shoot-ground' || pose === 'shoot-air' || pose === 'charge') {
      const pull = pose === 'charge' ? Math.min(4, 1 + frame) : frame === 0 ? 2 : frame === 1 ? 4 : 1;

      // Braço da frente sustenta o estilingue.
      g.fillStyle(skin, 1).fillRect(16, torsoY + 2, 5, 2);
      g.fillRect(20, torsoY + 1, 2, 3);

      // Braço de trás puxa o elástico para perto do rosto.
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
      const swing = [0, 1, 2, 1, 0, -1, -2, -1][frame % 8];
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
    frame: number,
    torsoY: number,
  ): void {
    const shorts = 0x243653;
    const shoes = 0xf8ecbd;
    const skin = 0xe9a66c;

    const hipY = torsoY + 8;
    g.fillStyle(shorts, 1).fillRect(8, hipY, 8, 4);

    if (pose === 'run') {
      const run = [
        { frontX: 15, frontY: 23, backX: 6, backY: 22 },
        { frontX: 16, frontY: 23, backX: 7, backY: 21 },
        { frontX: 14, frontY: 24, backX: 8, backY: 20 },
        { frontX: 12, frontY: 25, backX: 9, backY: 20 },
        { frontX: 8, frontY: 22, backX: 15, backY: 23 },
        { frontX: 7, frontY: 21, backX: 16, backY: 23 },
        { frontX: 8, frontY: 20, backX: 14, backY: 24 },
        { frontX: 9, frontY: 20, backX: 12, backY: 25 },
      ][frame % 8];

      g.fillStyle(skin, 1).fillRect(run.frontX, run.frontY, 3, 5);
      g.fillRect(run.backX, run.backY, 3, 5);
      g.fillStyle(shoes, 1).fillRect(run.frontX - 1, run.frontY + 5, 5, 2);
      g.fillRect(run.backX - 1, run.backY + 5, 5, 2);
      return;
    }

    if (pose === 'jump') {
      g.fillStyle(skin, 1).fillRect(8, 24, 3, 4);
      g.fillRect(14, 22, 3, 4);
      g.fillStyle(shoes, 1).fillRect(7, 27, 5, 2);
      g.fillRect(13, 25, 5, 2);
      return;
    }

    if (pose === 'apex') {
      g.fillStyle(skin, 1).fillRect(7, 23, 3, 4);
      g.fillRect(15, 23, 3, 4);
      g.fillStyle(shoes, 1).fillRect(6, 26, 5, 2);
      g.fillRect(14, 26, 5, 2);
      return;
    }

    if (pose === 'fall') {
      g.fillStyle(skin, 1).fillRect(7, 23, 3, 6);
      g.fillRect(15, 23, 3, 6);
      g.fillStyle(shoes, 1).fillRect(6, 28, 5, 2);
      g.fillRect(14, 28, 5, 2);
      return;
    }

    if (pose === 'crouch' || pose === 'land') {
      g.fillStyle(skin, 1).fillRect(7, 27, 4, 2);
      g.fillRect(14, 27, 4, 2);
      g.fillStyle(shoes, 1).fillRect(5, 29, 6, 2);
      g.fillRect(14, 29, 6, 2);
      return;
    }

    if (pose === 'skid') {
      g.fillStyle(skin, 1).fillRect(6, 24, 3, 5);
      g.fillRect(15, 23, 3, 5);
      g.fillStyle(shoes, 1).fillRect(4, 28, 6, 2);
      g.fillRect(14, 27, 6, 2);
      return;
    }

    g.fillStyle(skin, 1).fillRect(8, 24, 3, 5);
    g.fillRect(14, 24, 3, 5);
    g.fillStyle(shoes, 1).fillRect(7, 28, 5, 2);
    g.fillRect(13, 28, 5, 2);
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
      key: 'player-run',
      frames: Array.from({ length: 8 }, (_, frame) => ({ key: `player-run-${frame}` })),
      frameRate: 12,
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
