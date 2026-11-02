import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { validatePlayerAnimationModel } from '../entities/playerAnimationModel';

const PLAYER_SHEET_FRAME_SIZE = 32;
const asset = (relPath: string) => new URL(relPath, import.meta.url).href;

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.preload); }

  preload(): void {
    // 1. Spritesheet Oficial do Protagonista Nilo
    this.load.spritesheet('player-sheet', asset('../../assets/sprites/boy_sling_sheet.png'), {
      frameWidth: PLAYER_SHEET_FRAME_SIZE,
      frameHeight: PLAYER_SHEET_FRAME_SIZE,
    });

    // 2. Tilesets Reais em Pixel Art PNG
    this.load.image('tile-ground', asset('../../assets/tilesets/tile-ground.png'));
    this.load.image('tile-ground-left', asset('../../assets/tilesets/tile-ground-left.png'));
    this.load.image('tile-ground-right', asset('../../assets/tilesets/tile-ground-right.png'));
    this.load.image('tile-earth', asset('../../assets/tilesets/tile-earth.png'));
    this.load.image('tile-wood-plank', asset('../../assets/tilesets/tile-wood-plank.png'));
    this.load.image('platform-stilt', asset('../../assets/tilesets/platform-stilt.png'));
    this.load.image('platform-stone', asset('../../assets/tilesets/platform-stone.png'));
    this.load.image('platform-bracket', asset('../../assets/tilesets/platform-bracket.png'));
    this.load.image('hazard-spikes', asset('../../assets/tilesets/hazard-spikes.png'));
    this.load.image('moving-platform', asset('../../assets/tilesets/moving-platform.png'));
    this.load.image('cloud-large', asset('../../assets/backgrounds/cloud-large.png'));
    this.load.image('cloud-small', asset('../../assets/backgrounds/cloud-small.png'));
    this.load.image('bg-mountain-far', asset('../../assets/backgrounds/bg-mountain-far.png'));
    this.load.image('bg-hills-mid', asset('../../assets/backgrounds/bg-hills-mid.png'));

    // 3. Spritesheets Oficiais de Inimigos Reais em Pixel Art PNG
    this.load.spritesheet('enemy-beetle-sheet', asset('../../assets/sprites/enemy-beetle-sheet.png'), {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('enemy-flyer-sheet', asset('../../assets/sprites/enemy-flyer-sheet.png'), {
      frameWidth: 18,
      frameHeight: 16,
    });
    this.load.spritesheet('enemy-hopper-sheet', asset('../../assets/sprites/enemy-hopper-sheet.png'), {
      frameWidth: 18,
      frameHeight: 18,
    });

    // 4. Spritesheets de Itens & Coletáveis Reais em Pixel Art PNG
    this.load.spritesheet('item-stamp-sheet', asset('../../assets/sprites/item-stamp-sheet.png'), {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('item-heart-sheet', asset('../../assets/sprites/item-heart-sheet.png'), {
      frameWidth: 14,
      frameHeight: 14,
    });
    this.load.image('item-stamp', asset('../../assets/sprites/item-stamp.png'));
    this.load.image('item-postcard', asset('../../assets/sprites/item-postcard.png'));
    this.load.image('item-heart', asset('../../assets/sprites/item-heart.png'));
    this.load.image('item-life', asset('../../assets/sprites/item-life.png'));

    // 5. Spritesheets de Elementos Interativos Reais em Pixel Art PNG
    this.load.spritesheet('bounce-flower-sheet', asset('../../assets/sprites/bounce-flower-sheet.png'), {
      frameWidth: 24,
      frameHeight: 20,
    });
    this.load.spritesheet('checkpoint-totem-sheet', asset('../../assets/sprites/checkpoint-totem-sheet.png'), {
      frameWidth: 16,
      frameHeight: 28,
    });
    this.load.spritesheet('decor-campfire', asset('../../assets/sprites/decor-campfire.png'), {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.image('bounce-flower', asset('../../assets/sprites/bounce-flower.png'));
    this.load.image('bounce-flower-down', asset('../../assets/sprites/bounce-flower-down.png'));
    this.load.image('checkpoint-pole-inactive', asset('../../assets/sprites/checkpoint-pole-inactive.png'));
    this.load.image('checkpoint-pole-active', asset('../../assets/sprites/checkpoint-pole-active.png'));
    this.load.image('puzzle-target-idle', asset('../../assets/sprites/puzzle-target-idle.png'));
    this.load.image('puzzle-target-hit', asset('../../assets/sprites/puzzle-target-hit.png'));
    this.load.image('goal-gate', asset('../../assets/sprites/goal-gate.png'));

    // 6. Decorações de Cenário Reais em Pixel Art PNG
    this.load.image('decor-tree-large', asset('../../assets/sprites/decor-tree-large.png'));
    this.load.image('decor-bush', asset('../../assets/sprites/decor-bush.png'));
    this.load.image('decor-flowers', asset('../../assets/sprites/decor-flowers.png'));
    this.load.image('decor-rock', asset('../../assets/sprites/decor-rock.png'));
    this.load.image('decor-signpost', asset('../../assets/sprites/decor-signpost.png'));
    this.load.image('decor-fence', asset('../../assets/sprites/decor-fence.png'));
    this.load.image('decor-bunting', asset('../../assets/sprites/decor-bunting.png'));
    this.load.image('decor-vines', asset('../../assets/sprites/decor-vines.png'));
    this.load.image('decor-mist', asset('../../assets/sprites/decor-mist.png'));
    this.load.image('map-fortress', asset('../../assets/sprites/map-fortress.png'));
    this.load.image('decor-waterfall', asset('../../assets/backgrounds/decor-waterfall.png'));

    // 7. HUD & UI Reais em Pixel Art PNG
    this.load.image('ui-heart-full', asset('../../assets/ui/ui-heart-full.png'));
    this.load.image('ui-heart-empty', asset('../../assets/ui/ui-heart-empty.png'));
    this.load.image('ui-nilo-mini', asset('../../assets/ui/ui-nilo-mini.png'));
    this.load.image('ui-stamp-mini', asset('../../assets/ui/ui-stamp-mini.png'));
    this.load.image('ui-postcard-lit', asset('../../assets/ui/ui-postcard-lit.png'));
    this.load.image('ui-postcard-empty', asset('../../assets/ui/ui-postcard-empty.png'));
    this.load.image('ui-continue-plaque', asset('../../assets/ui/ui-continue-plaque.png'));
  }

  create(): void {
    validatePlayerAnimationModel();
    if (!this.textures.exists('player-sheet')) throw new Error('Falha ao carregar a spritesheet do player.');
    const playerTexture = this.textures.get('player-sheet');
    if (playerTexture.frameTotal < 48) throw new Error(`Spritesheet do player incompleta: ${playerTexture.frameTotal}/48 frames.`);

    this.createProjectileTextures();
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

  private createPlayerAnimations(): void {
    this.anims.create({
      key: 'player-idle',
      frames: [0, 1, 2, 3].map((frame) => ({ key: 'player-sheet', frame })),
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-walk',
      frames: [8, 9, 10, 11, 12, 13, 14, 15].map((frame) => ({ key: 'player-sheet', frame })),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-run',
      frames: [16, 17, 18, 19, 20, 21, 22, 23].map((frame) => ({ key: 'player-sheet', frame })),
      frameRate: 13,
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
    this.anims.create({
      key: 'player-skid',
      frames: [{ key: 'player-sheet', frame: 6 }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-crouch',
      frames: [{ key: 'player-sheet', frame: 5 }],
      frameRate: 1,
      repeat: -1,
    });

    // Animações dos Inimigos (Spritesheet multi-frame)
    this.anims.create({
      key: 'beetle-walk',
      frames: [0, 1, 2, 3].map((frame) => ({ key: 'enemy-beetle-sheet', frame })),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'beetle-hit',
      frames: [{ key: 'enemy-beetle-sheet', frame: 4 }],
      frameRate: 1,
      repeat: 0,
    });

    this.anims.create({
      key: 'flyer-fly',
      frames: [0, 1, 2, 3].map((frame) => ({ key: 'enemy-flyer-sheet', frame })),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: 'hopper-idle',
      frames: [0, 1].map((frame) => ({ key: 'enemy-hopper-sheet', frame })),
      frameRate: 3,
      repeat: -1,
    });
    this.anims.create({
      key: 'hopper-prep',
      frames: [{ key: 'enemy-hopper-sheet', frame: 2 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: 'hopper-jump',
      frames: [3, 4].map((frame) => ({ key: 'enemy-hopper-sheet', frame })),
      frameRate: 6,
      repeat: 0,
    });

    // Animações de Coletáveis e Elementos Interativos
    this.anims.create({
      key: 'stamp-spin',
      frames: [0, 1, 2, 3, 4, 5].map((frame) => ({ key: 'item-stamp-sheet', frame })),
      frameRate: 9,
      repeat: -1,
    });

    this.anims.create({
      key: 'heart-pulse',
      frames: [0, 1, 2, 3].map((frame) => ({ key: 'item-heart-sheet', frame })),
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: 'flower-idle',
      frames: [{ key: 'bounce-flower-sheet', frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: 'flower-bounce',
      frames: [1, 2, 3, 0].map((frame) => ({ key: 'bounce-flower-sheet', frame })),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: 'checkpoint-idle',
      frames: [{ key: 'checkpoint-totem-sheet', frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: 'checkpoint-activate',
      frames: [1, 2, 3].map((frame) => ({ key: 'checkpoint-totem-sheet', frame })),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'campfire-burn',
      frames: [0, 1, 2, 3].map((frame) => ({ key: 'decor-campfire', frame })),
      frameRate: 6,
      repeat: -1,
    });
  }
}
