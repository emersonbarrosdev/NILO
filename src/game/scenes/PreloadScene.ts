import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { validatePlayerAnimationModel } from '../entities/playerAnimationModel';

const PLAYER_SHEET_FRAME_SIZE = 32;
const PLAYER_SHEET_URL = new URL('../../assets/sprites/boy_sling_sheet.png', import.meta.url).href;

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.preload); }

  preload(): void {
    this.load.spritesheet('player-sheet', PLAYER_SHEET_URL, {
      frameWidth: PLAYER_SHEET_FRAME_SIZE,
      frameHeight: PLAYER_SHEET_FRAME_SIZE,
    });
  }

  create(): void {
    validatePlayerAnimationModel();
    if (!this.textures.exists('player-sheet')) throw new Error('Falha ao carregar a spritesheet do player.');
    const playerTexture = this.textures.get('player-sheet');
    if (playerTexture.frameTotal < 48) throw new Error(`Spritesheet do player incompleta: ${playerTexture.frameTotal}/48 frames.`);

    this.createIdleSpecialFrames();
    this.createProjectileTextures();
    this.createEnemyPlaceholder();
    this.createPlayerAnimations();
    this.scene.start(SCENE_KEYS.title);
  }

  private createIdleSpecialFrames(): void {
    for (let frame = 0; frame < 8; frame += 1) {
      const g = this.add.graphics();
      const seated = frame >= 2;
      const throwing = frame >= 4;
      const crouch = frame === 1;
      const baseY = seated ? 7 : crouch ? 4 : 0;

      g.fillStyle(0x3b211d, 1).fillRect(10, 4 + baseY, 12, 4);
      g.fillRect(8, 7 + baseY, 15, 5);
      g.fillStyle(0xf0b27a, 1).fillRect(11, 9 + baseY, 10, 7);
      g.fillStyle(0x1d2538, 1).fillRect(18, 11 + baseY, 2, 2);

      g.fillStyle(0xf2e4c8, 1).fillRect(11, 16 + baseY, 9, seated ? 5 : 7);
      g.fillStyle(0xc84c35, 1).fillRect(9, 16 + baseY, 3, seated ? 5 : 8);
      g.fillStyle(0x6d4331, 1).fillRect(7, 18 + baseY, 4, 5);

      if (seated) {
        g.fillStyle(0x294978, 1).fillRect(11, 22 + baseY, 9, 4);
        g.fillRect(17, 25 + baseY, 7, 3);
        g.fillStyle(0xf4e1c7, 1).fillRect(22, 27 + baseY, 5, 2);
      } else {
        g.fillStyle(0x294978, 1).fillRect(11, 23 + baseY, 4, 5);
        g.fillRect(17, 23 + baseY, 4, 5);
        g.fillStyle(0xf4e1c7, 1).fillRect(9, 28 + baseY, 6, 2);
        g.fillRect(18, 28 + baseY, 6, 2);
      }

      if (throwing) {
        const reach = frame - 4;
        g.fillStyle(0xf0b27a, 1).fillRect(20, 18 + baseY - Math.min(2, reach), 5 + reach, 2);
        if (frame >= 6) g.fillStyle(0x84756f, 1).fillRect(27, 16 + baseY - reach, 3, 3);
      } else {
        g.fillStyle(0xf0b27a, 1).fillRect(20, 18 + baseY, 3, 5);
      }

      g.generateTexture(`player-idle-special-${frame}`, 32, 32);
      g.destroy();
    }
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
    this.anims.create({ key: 'player-idle', frames: [0, 1, 2, 3].map((frame) => ({ key: 'player-sheet', frame })), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'player-jump', frames: [24, 25, 26].map((frame) => ({ key: 'player-sheet', frame })), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'player-fall', frames: [{ key: 'player-sheet', frame: 28 }], frameRate: 1, repeat: -1 });
    this.anims.create({ key: 'player-land', frames: [29, 30].map((frame) => ({ key: 'player-sheet', frame })), frameRate: 12, repeat: 0 });
  }
}
