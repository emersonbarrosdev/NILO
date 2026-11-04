import { bindCamera } from '../systems/PresentationSystem';
import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { PLAYER_ART, PLAYER_POSES } from '../config/playerArt';


const assets = import.meta.glob(['../../assets/hd/*', '!../../assets/hd/*-source.png', '!../../assets/hd/title-valley.png'], { eager: true, query: '?url', import: 'default' }) as Record<string,string>;
const asset = (relPath: string): string => { if (!assets[relPath]) throw new Error('Asset ausente: ' + relPath); return assets[relPath]; };

export class PreloadScene extends Phaser.Scene {
  private startedAt = 0;
  private assetsReady = false;

  constructor() { super(SCENE_KEYS.preload); }

  preload(): void {
    bindCamera(this);
    this.startedAt = performance.now();
    this.assetsReady = false;
    this.add.image(160,90,'forest-backdrop').setDisplaySize(320,180);
    this.add.rectangle(160,90,320,180,0x041d12,.66);
    const logo = this.add.image(160,70,'nilo-logo').setDisplaySize(140,65);
    this.tweens.add({targets:logo,y:67,duration:1300,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    this.add.text(160,119,'ENTRANDO NA FLORESTA',{fontFamily:'"Press Start 2P", monospace',fontSize:'5px',color:'#ffedb0',resolution:4}).setOrigin(.5);
    this.add.rectangle(160,139,116,5,0x071c12).setStrokeStyle(.7,0x6a9c32);
    const bar=this.add.rectangle(104,139,0,2.5,0xbbe92d).setOrigin(0,.5);
    this.load.on('progress',(value:number)=>bar.width=112*value);
    this.load.atlas('forest-atlas',asset('../../assets/hd/forest-atlas.png'),asset('../../assets/hd/forest-atlas.json'));
    this.load.spritesheet('leaves-sheet',asset('../../assets/hd/leaves-sheet.png'),{frameWidth:32,frameHeight:32});
    this.load.spritesheet('player-unarmed-sheet',asset('../../assets/hd/player-unarmed-sheet.png'),{frameWidth:PLAYER_ART.textureCellSize,frameHeight:PLAYER_ART.textureCellSize});
    // Existing HUD still references this original portrait sheet until its own revision.
    this.load.spritesheet('player-sheet',asset('../../assets/hd/player-sheet.png'),{frameWidth:128,frameHeight:128});
    this.load.image('baton-icon',asset('../../assets/hd/baton.png'));
    this.load.spritesheet('monkey-sheet',asset('../../assets/hd/monkey-sheet.png'),{frameWidth:192,frameHeight:192});
    this.load.spritesheet('snake-sheet',asset('../../assets/hd/snake-sheet.png'),{frameWidth:128,frameHeight:64});
    for(const name of ['push-crate','break-crate','baton','banana','earth-seamless','grass-seamless','grove-backdrop','platform-log']) this.load.image(name,asset('../../assets/hd/'+(name==='baton'?'baton-horizontal':name)+'.png'));


    // Nilo's original detailed body is shared by both equipment states; BatonSystem adds the weapon.

    // 2. Tilesets Reais em Pixel Art PNG
    this.load.image('tile-ground', asset('../../assets/hd/tile-ground.png'));
    this.load.image('tile-ground-left', asset('../../assets/hd/tile-ground-left.png'));
    this.load.image('tile-ground-right', asset('../../assets/hd/tile-ground-right.png'));
    this.load.image('tile-earth', asset('../../assets/hd/tile-earth.png'));
    this.load.image('tile-wood-plank', asset('../../assets/hd/tile-wood-plank.png'));
    this.load.image('platform-stilt', asset('../../assets/hd/platform-stilt.png'));
    this.load.image('platform-stone', asset('../../assets/hd/platform-stone.png'));
    this.load.image('platform-bracket', asset('../../assets/hd/platform-bracket.png'));
    this.load.image('hazard-spikes', asset('../../assets/hd/hazard-spikes.png'));
    this.load.image('moving-platform', asset('../../assets/hd/moving-platform.png'));
    this.load.image('cloud-large', asset('../../assets/hd/cloud-large.png'));
    this.load.image('cloud-small', asset('../../assets/hd/cloud-small.png'));
    this.load.image('bg-mountain-far', asset('../../assets/hd/bg-mountain-far.png'));
    this.load.image('bg-hills-mid', asset('../../assets/hd/bg-hills-mid.png'));

    // 3. Spritesheets Oficiais de Inimigos Reais em Pixel Art PNG
    this.load.spritesheet('enemy-beetle-sheet', asset('../../assets/hd/enemy-beetle-sheet.png'), {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('enemy-flyer-sheet', asset('../../assets/hd/enemy-flyer-sheet.png'), {
      frameWidth: 72,
      frameHeight: 64,
    });
    this.load.spritesheet('enemy-hopper-sheet', asset('../../assets/hd/enemy-hopper-sheet.png'), {
      frameWidth: 72,
      frameHeight: 72,
    });

    // 4. Spritesheets de Itens & ColetÃ¡veis Reais em Pixel Art PNG
    this.load.spritesheet('item-stamp-sheet', asset('../../assets/hd/item-stamp-sheet.png'), {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('item-heart-sheet', asset('../../assets/hd/item-heart-sheet.png'), {
      frameWidth: 56,
      frameHeight: 56,
    });
    this.load.image('item-stamp', asset('../../assets/hd/item-stamp.png'));
    this.load.image('item-postcard', asset('../../assets/hd/item-postcard.png'));
    this.load.image('item-heart', asset('../../assets/hd/item-heart.png'));
    this.load.image('item-life', asset('../../assets/hd/item-life.png'));

    // 5. Spritesheets de Elementos Interativos Reais em Pixel Art PNG
    this.load.spritesheet('bounce-flower-sheet', asset('../../assets/hd/bounce-flower-sheet.png'), {
      frameWidth: 96,
      frameHeight: 80,
    });
    this.load.spritesheet('checkpoint-totem-sheet', asset('../../assets/hd/checkpoint-totem-sheet.png'), {
      frameWidth: 64,
      frameHeight: 112,
    });
    this.load.spritesheet('decor-campfire', asset('../../assets/hd/decor-campfire.png'), {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.image('bounce-flower', asset('../../assets/hd/bounce-flower.png'));
    this.load.image('bounce-flower-down', asset('../../assets/hd/bounce-flower-down.png'));
    this.load.image('checkpoint-pole-inactive', asset('../../assets/hd/checkpoint-pole-inactive.png'));
    this.load.image('checkpoint-pole-active', asset('../../assets/hd/checkpoint-pole-active.png'));
    this.load.image('puzzle-target-idle', asset('../../assets/hd/puzzle-target-idle.png'));
    this.load.image('puzzle-target-hit', asset('../../assets/hd/puzzle-target-hit.png'));
    this.load.image('goal-gate', asset('../../assets/hd/goal-gate.png'));

    // 6. DecoraÃ§Ãµes de CenÃ¡rio Reais em Pixel Art PNG
    this.load.image('decor-tree-large', asset('../../assets/hd/decor-tree-large.png'));
    this.load.image('decor-bush', asset('../../assets/hd/decor-bush.png'));
    this.load.image('decor-flowers', asset('../../assets/hd/decor-flowers.png'));
    this.load.image('decor-rock', asset('../../assets/hd/decor-rock.png'));
    this.load.image('decor-signpost', asset('../../assets/hd/decor-signpost.png'));
    this.load.image('decor-fence', asset('../../assets/hd/decor-fence.png'));
    this.load.image('decor-bunting', asset('../../assets/hd/decor-bunting.png'));
    this.load.image('decor-vines', asset('../../assets/hd/decor-vines.png'));
    this.load.image('decor-mist', asset('../../assets/hd/decor-mist.png'));
    this.load.image('map-fortress', asset('../../assets/hd/map-fortress.png'));
    this.load.image('decor-waterfall', asset('../../assets/hd/decor-waterfall.png'));

    // 7. HUD & UI Reais em Pixel Art PNG
    this.load.image('ui-heart-full', asset('../../assets/hd/ui-heart-full.png'));
    this.load.image('ui-heart-empty', asset('../../assets/hd/ui-heart-empty.png'));
    this.load.image('ui-nilo-mini', asset('../../assets/hd/ui-nilo-mini.png'));
    this.load.image('ui-stamp-mini', asset('../../assets/hd/ui-stamp-mini.png'));
    this.load.image('ui-postcard-lit', asset('../../assets/hd/ui-postcard-lit.png'));
    this.load.image('ui-postcard-empty', asset('../../assets/hd/ui-postcard-empty.png'));
    this.load.image('ui-continue-plaque', asset('../../assets/hd/ui-continue-plaque.png'));
  }

  create(): void {
    for (const key of this.textures.getTextureKeys()) {
      if (['nilo-logo','title-valley','forest-backdrop','forest-atlas','leaves-sheet','earth-seamless','grass-seamless','grove-backdrop','lab-forest'].includes(key)) continue;
      const texture=this.textures.get(key);
      const resolution=4;
      texture.source.forEach(source=>source.resolution=resolution);
      for(const frame of Object.values(texture.frames)) {
        frame.setTrim(frame.cutWidth/resolution,frame.cutHeight/resolution,0,0,frame.cutWidth/resolution,frame.cutHeight/resolution);
      }
    }

    if (!this.textures.exists('player-unarmed-sheet')) throw new Error('Falha ao carregar a spritesheet original do Nilo.');
    const playerTexture = this.textures.get('player-unarmed-sheet');
    if (playerTexture.frameTotal < 89) throw new Error(`Spritesheet do Nilo incompleta: ${playerTexture.frameTotal-1}/88 frames.`);

    this.createProjectileTextures();
    this.createPlayerAnimations();
    this.anims.create({key:'leaf-turn',frames:this.anims.generateFrameNumbers('leaves-sheet',{start:0,end:7}),frameRate:8,repeat:-1});
    this.assetsReady = true;
  }

  update(): void {
    // Splash duration is wall time, not simulation time/FPS. Wait for assets too.
    if (this.assetsReady && performance.now()-this.startedAt>=3000) {
      this.assetsReady=false;
      this.scene.start(SCENE_KEYS.title);
    }
  }

  private createProjectileTextures(): void {
    const g = this.add.graphics();

    // 1. PEDRA NORMAL DO ESTILINGUE: Seixo de Rio 16-bit Polido (8x8)
    // Contorno cinza ardÃ³sia suave
    g.fillStyle(0x292524, 1);
    g.fillRoundedRect(0, 0, 8, 8, 3);
    // Base sombreada
    g.fillStyle(0x57534e, 1);
    g.fillRoundedRect(1, 1, 6, 6, 2);
    // Corpo de pedra natural
    g.fillStyle(0x78716c, 1);
    g.fillRect(2, 2, 4, 3);
    // Luz superior facetada
    g.fillStyle(0xa8a29e, 1);
    g.fillRect(2, 1, 3, 2);
    // Brilho especular de quartzo/Ã¡gua
    g.fillStyle(0xffffff, 0.95);
    g.fillRect(2, 2, 2, 1);
    g.fillRect(3, 3, 1, 1);
    g.generateTexture('stone-normal', 8, 8);

    g.clear();

    // 2. PEDRA CARREGADA DO ESTILINGUE: Cristal Solar Incandescente (10x10)
    g.fillStyle(0x78350f, 1);
    g.fillRoundedRect(0, 0, 10, 10, 4);
    // Halo de fogo
    g.fillStyle(0xd97706, 1);
    g.fillRoundedRect(1, 1, 8, 8, 3);
    // Plasma dourado
    g.fillStyle(0xf59e0b, 1);
    g.fillRoundedRect(2, 2, 6, 6, 2);
    // Coroa solar
    g.fillStyle(0xfde047, 1);
    g.fillRect(3, 2, 4, 3);
    // NÃºcleo branco brillante
    g.fillStyle(0xffffff, 1);
    g.fillRect(3, 3, 3, 2);
    g.fillRect(4, 2, 1, 1);
    g.generateTexture('stone-charged', 10, 10);

    g.clear();

    // 3. PLATAFORMA QUE DESPENCA (44x10): TÃ¡bua rÃºstica rachada e instÃ¡vel
    g.fillStyle(0x241408, 1);
    g.fillRoundedRect(0, 0, 44, 10, 2);
    g.fillStyle(0x4a2a12, 1);
    g.fillRect(1, 1, 42, 7);
    g.fillStyle(0x73431d, 1);
    g.fillRect(1, 1, 42, 4);
    g.fillStyle(0x945727, 1);
    g.fillRect(2, 1, 40, 2);
    // Fendas profundas de madeira rachada (aviso claro ao jogador)
    g.fillStyle(0x1a0d05, 1);
    g.fillRect(14, 0, 2, 8);
    g.fillRect(15, 3, 3, 2);
    g.fillRect(29, 2, 2, 7);
    g.fillRect(28, 4, 2, 3);
    // Pregos frouxos
    g.fillStyle(0xa1a1aa, 1);
    g.fillRect(4, 3, 2, 2);
    g.fillRect(38, 3, 2, 2);
    g.generateTexture('platform-crumble', 44, 10);

    g.destroy();
  }

  private createPlayerAnimations(): void {
    for(const [state,clip] of Object.entries(PLAYER_POSES)) {
      this.anims.create({key:'player-'+state,frames:clip.frames.map(frame=>({key:'player-unarmed-sheet',frame})),frameRate:state==='run'?24:12,repeat:clip.loop?-1:0});
    }
    this.anims.create({key:'snake-slither',frames:this.anims.generateFrameNumbers('snake-sheet',{start:0,end:3}),frameRate:9,repeat:-1});

    // AnimaÃ§Ãµes dos Inimigos (Spritesheet multi-frame)
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

    // AnimaÃ§Ãµes de ColetÃ¡veis e Elementos Interativos
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

