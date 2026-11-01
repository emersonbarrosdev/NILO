import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { validatePlayerAnimationModel } from '../entities/playerAnimationModel';
import {
  createNiloSpriteSheetSvg,
  NILO_SPRITE_FRAME_HEIGHT,
  NILO_SPRITE_FRAME_WIDTH,
} from '../assets/niloSpriteSheet';

const PLAYER_SHEET_COLUMNS = 8;
const PLAYER_SHEET_ROWS = 6;
const PLAYER_SHEET_RENDER_SCALE = 0.75;
const PLAYER_SHEET_FRAME_WIDTH = Math.round(NILO_SPRITE_FRAME_WIDTH * PLAYER_SHEET_RENDER_SCALE);
const PLAYER_SHEET_FRAME_HEIGHT = Math.round(NILO_SPRITE_FRAME_HEIGHT * PLAYER_SHEET_RENDER_SCALE);

export class PreloadScene extends Phaser.Scene {
  private playerSheetObjectUrl?: string;

  constructor() { super(SCENE_KEYS.preload); }

  preload(): void {
    const sourceWidth = NILO_SPRITE_FRAME_WIDTH * PLAYER_SHEET_COLUMNS;
    const sourceHeight = NILO_SPRITE_FRAME_HEIGHT * PLAYER_SHEET_ROWS;
    const renderWidth = PLAYER_SHEET_FRAME_WIDTH * PLAYER_SHEET_COLUMNS;
    const renderHeight = PLAYER_SHEET_FRAME_HEIGHT * PLAYER_SHEET_ROWS;

    const svg = createNiloSpriteSheetSvg().replace(
      `width="${sourceWidth}" height="${sourceHeight}"`,
      `width="${renderWidth}" height="${renderHeight}"`,
    );

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    this.playerSheetObjectUrl = URL.createObjectURL(blob);

    this.load.spritesheet('player-sheet', this.playerSheetObjectUrl, {
      frameWidth: PLAYER_SHEET_FRAME_WIDTH,
      frameHeight: PLAYER_SHEET_FRAME_HEIGHT,
    });
  }

  create(): void {
    if (this.playerSheetObjectUrl) {
      URL.revokeObjectURL(this.playerSheetObjectUrl);
      this.playerSheetObjectUrl = undefined;
    }

    validatePlayerAnimationModel();

    if (!this.textures.exists('player-sheet')) {
      throw new Error('Falha ao carregar a spritesheet V2 do Nilo.');
    }

    const playerTexture = this.textures.get('player-sheet');
    if (playerTexture.frameTotal < 48) {
      throw new Error(`Spritesheet V2 do Nilo incompleta: ${playerTexture.frameTotal}/48 frames.`);
    }

    this.createProjectileTextures();
    this.createEnemyPlaceholder();
    this.createPlayerAnimations();
    this.scene.start(SCENE_KEYS.title);
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
      frames: [0, 1, 2, 3].map((frame) => ({ key: 'player-sheet', frame })),
      frameRate: 4,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-jump',
      frames: [24, 25, 26].map((frame) => ({ key: 'player-sheet', frame })),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: 'player-fall',
      frames: [{ key: 'player-sheet', frame: 28 }],
      frameRate: 1,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-land',
      frames: [29, 30].map((frame) => ({ key: 'player-sheet', frame })),
      frameRate: 12,
      repeat: 0,
    });
  }
}
