import { bindCamera, pinOverlay } from '../systems/PresentationSystem';
import { DEFAULT_LEVEL, LEVELS, type LevelId } from '../levels/levelConfig';
import { buildLab } from '../levels/buildLab';
import { SaveSystem } from '../systems/SaveSystem';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { ForestBoss } from '../entities/enemies/ForestBoss';
import { buildForest } from '../levels/world-1/buildForest';
import { ControlsModal } from '../ui/ControlsModal';
import { InputSettings } from '../systems/InputSettings';
import { Player } from '../entities/Player';
import { BatonSystem } from '../systems/BatonSystem';
import { EnemyBase } from '../entities/enemies/EnemyBase';
import { Checkpoint } from '../entities/environment/Checkpoint';
import { PuzzleTarget } from '../entities/environment/PuzzleTarget';
import { MovingPlatform } from '../entities/environment/MovingPlatform';
import { BounceFlower } from '../entities/environment/BounceFlower';
import { FallingPlatform } from '../entities/environment/FallingPlatform';
import { GoalGate } from '../entities/environment/GoalGate';
import { Stamp } from '../entities/items/Stamp';
import { Postcard } from '../entities/items/Postcard';

import { LifeItem } from '../entities/items/LifeItem';
import { GameState } from '../systems/GameState';
import { AudioSystem } from '../systems/AudioSystem';
import { GamepadSystem } from '../systems/GamepadSystem';
import { addPixelText } from '../ui/PixelText';
import { AudioSettingsModal } from '../ui/AudioSettingsModal';

export class GameScene extends Phaser.Scene {
  public level = LEVELS[DEFAULT_LEVEL];
  private player?: Player;
  private baton?: BatonSystem;
  private roofs: Phaser.GameObjects.Rectangle[] = [];
  private readonly solidSurfaces: Phaser.GameObjects.GameObject[] = [];
  private readonly groundSegments: { startX: number; endX: number; surfaceY: number }[] = [];
  private readonly enemies: EnemyBase[] = [];
  private readonly movingPlatforms: MovingPlatform[] = [];
  private readonly fallingPlatforms: FallingPlatform[] = [];
  private puzzleTarget?: PuzzleTarget;
  private boss?: ForestBoss;
  private bossDefeated = false;
  private controlsModal?: ControlsModal;
  private breakables: Phaser.Physics.Arcade.Sprite[] = [];
  private onBlur = () => { if (!this.isPaused && this.scene.isActive()) this.togglePause(); };
  private parallax: { image: Phaser.GameObjects.Image; x: number; y: number; fx: number; fy: number }[] = [];
  private readonly windLeaves: { g: Phaser.GameObjects.Sprite; x: number; y: number; speedX: number; speedY: number; wobble: number }[] = [];
  public playTime = 0;
  private isPaused = false;
  private pauseMenuContainer?: Phaser.GameObjects.Container;
  private pauseSelectedIndex = 0;
  private pauseMenuItems: Phaser.GameObjects.GameObject[] = [];
  private pauseHitZones: Phaser.GameObjects.Rectangle[] = [];
  private audioModal?: AudioSettingsModal;
  private onPauseKey = () => this.togglePause();
  private onPauseUp = () => { if (this.isPaused && !this.audioModal?.isOpen && !this.controlsModal) this.navigatePauseMenu(-1); };
  private onPauseDown = () => { if (this.isPaused && !this.audioModal?.isOpen && !this.controlsModal) this.navigatePauseMenu(1); };
  private onPauseConfirm = () => { if (this.isPaused && !this.audioModal?.isOpen && !this.controlsModal) this.selectPauseMenuItem(); };

  constructor() { super(SCENE_KEYS.game); }

  init(data?: { stageId?: string; isContinue?: boolean; resumeSave?: boolean; levelId?: LevelId }): void {
    this.level = LEVELS[data?.levelId ?? DEFAULT_LEVEL];
    const gameState = GameState.get();
    const savedCheckpoint = data?.resumeSave && this.level.id === 'forest' ? SaveSystem.get().load().checkpoint : null;
    if (!data?.isContinue) {
      gameState.startStage(data?.stageId || '1-1', savedCheckpoint?.x ?? this.level.spawn.x, savedCheckpoint?.y ?? this.level.spawn.y);
    } else {
      gameState.lives = 3;
      gameState.emitChange();
    }
  }

  create(): void {
    bindCamera(this, this.level.camera, this.level.camera.mode === 'fixed');
    const worldWidth = this.level.world.width;
    const worldHeight = this.level.world.height;

    this.solidSurfaces.length = 0;
    this.groundSegments.length = 0;
    this.enemies.length = 0;
    this.movingPlatforms.length = 0;
    this.fallingPlatforms.length = 0;
    this.playTime = 0;
    this.parallax = [];
    this.isPaused = false;
    this.bossDefeated = false; this.breakables = []; this.roofs=[]; this.boss = undefined;
    this.puzzleTarget = undefined; this.time.paused = false; this.tweens.resumeAll();

    // Configuração de Mundo e Câmera
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBackgroundColor('#2c7fa8');

    // Spawna o protagonista Nilo no Checkpoint ativo (ou no início da fase)
    const gameState = GameState.get();
    const spawnX = gameState.checkpointX ?? 40;
    const spawnY = gameState.checkpointY ?? 134;
    this.player = new Player(this, spawnX, spawnY);
    this.player.setDepth(10);

    // Câmera segue Nilo suavemente
    if (this.level.camera.mode === 'follow') this.cameras.main.startFollow(this.player, false, 0.1, 0.1, -38, 16);

    // Constrói o Level Design completo dos 5 Atos PRIMEIRO (registra os segmentos de solo)
    this.buildLevelTerrain(worldWidth);
    for (const enemy of this.enemies) this.setupEnemyCollisions(enemy);

    // Cenários de Fundo com Parallax e Decorações Firmadas no Solo
    this.drawParallaxBackdrop(worldWidth);
    this.drawWorldDecor();
    this.createWindBreeze();

    // Colisões do Player com superfícies sólidas
    this.physics.add.collider(this.player, this.solidSurfaces);

    // Colisões com plataformas móveis
    for (const mp of this.movingPlatforms) {
      this.physics.add.collider(this.player, mp, () => this.player?.noteGroundSupport(mp.body as Phaser.Physics.Arcade.Body));
    }

    // Colisões com plataformas que despencam ao pisar
    for (const fp of this.fallingPlatforms) {
      this.physics.add.collider(this.player, fp);
    }

    this.baton = new BatonSystem(this,this.player,this.solidSurfaces,this.enemies,area=>this.strikeObjects(area));
    this.player.canStand=()=>!this.roofs.some(roof=>{
      const body=roof.body as Phaser.Physics.Arcade.StaticBody;
      const p=this.player!,feet=(p.body as Phaser.Physics.Arcade.Body).bottom;
      return p.x+7>body.left&&p.x-7<body.right&&feet-25<body.bottom&&feet>body.top;
    });

    // Escuta morte do player (dano ou queda)
    this.events.off('player-died', this.handlePlayerDied, this);
    this.events.on('player-died', this.handlePlayerDied, this);

    // Sistema de Pausa via Tecla ESC ou P (com limpeza de listeners anteriores)
    this.input.keyboard?.off('keydown-ESC', this.onPauseKey);
    this.input.keyboard?.off('keydown-P', this.onPauseKey);
    this.input.keyboard?.on('keydown-ESC', this.onPauseKey);
    this.input.keyboard?.on('keydown-P', this.onPauseKey);

    // Banner Inicial da Fase


    // Inicia Trilha Sonora 8-bit do Estágio
    AudioSystem.get().startBgm('stage');

    this.events.off('touch-pause', this.onPauseKey);
    this.events.on('touch-pause', this.onPauseKey);
    window.addEventListener('blur', this.onBlur);
    this.events.once('shutdown', () => {
      window.removeEventListener('blur', this.onBlur); this.hidePauseMenu();
      InputSettings.resetTouch(); this.time.paused = false; this.tweens.resumeAll(); AudioSystem.get().setGameplayPaused(false);
      this.input.keyboard?.off('keydown-ESC', this.onPauseKey);
      this.input.keyboard?.off('keydown-P', this.onPauseKey);
      this.windLeaves.forEach((l) => l.g.destroy());
      this.windLeaves.length = 0;
      this.scene.stop(SCENE_KEYS.ui);
      AudioSystem.get().stopBgm();
    });

    // Inicia HUD Overlay
    this.scene.launch(SCENE_KEYS.ui);
  }

  update(time: number, delta: number): void {
    const view = this.cameras.main.worldView;
    for (const layer of this.parallax) layer.image.setPosition(layer.x + view.x*(1-layer.fx),layer.y + view.y*(1-layer.fy));
    const pad = GamepadSystem.get().updateMenuNavigation(time);
    if (pad.pauseJustPressed) {
      this.togglePause();
      return;
    }

    if (this.isPaused) {
      if (this.controlsModal) { if (pad.cancelJustPressed) this.controlsModal.close(); return; }
      if (this.audioModal?.isOpen) {
        this.audioModal.updateGamepad(time);
      } else {
        if (pad.upJustPressed) this.navigatePauseMenu(-1);
        if (pad.downJustPressed) this.navigatePauseMenu(1);
        if (pad.confirmJustPressed) this.selectPauseMenuItem();
        if (pad.cancelJustPressed) this.togglePause();
      }
      return;
    }

    // Cronômetro da Fase (Tarefa 52: pausa NÃO conta)
    this.playTime += delta;
    GameState.get().addStageTime(delta / 1000);

    this.player?.update(this.playTime);
    this.baton?.update(this.playTime);
    this.boss?.updateHazards(this.playTime);

    // Atualiza lógica dos inimigos
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.active) {
        enemy.update(this.playTime, delta);
      } else {
        this.enemies.splice(i, 1);
      }
    }

    // Atualiza plataformas móveis
    for (const mp of this.movingPlatforms) {
      if (mp.active) mp.update();
    }

    // Atualiza plataformas que despencam ao pisar
    for (const fp of this.fallingPlatforms) {
      if (fp.active && this.player) {
        fp.checkPlayerStep(this.player);
      }
    }

    // Atualiza folhas flutuando suavemente com a brisa alpina
    for (const leaf of this.windLeaves) {
      leaf.x -= leaf.speedX * (delta / 1000);
      leaf.y += Math.sin(leaf.wobble) * 0.4 + leaf.speedY * (delta / 1000);
      if (this.player && leaf.x < this.player.x - 200) {
        leaf.x = this.player.x + 220;
        leaf.y = Phaser.Math.Between(20, 140);
      }
      leaf.g.setPosition(leaf.x, leaf.y);
      leaf.g.setAngle(Math.sin(leaf.wobble) * 25);
    }
  }

  // --- CONSTRUÇÃO DO LEVEL DESIGN (5 ATOS DO VALE DA BRISA - MUNDO EXTENSO 4800PX) ---
  private buildLevelTerrain(_worldWidth: number): void {
    const builder = {
      scene: this, player: this.player!,
      ground: (a,b,y=154) => this.addGroundSegment(a,b,y),
      plank: (x,y,w=48,hidden=false) => this.addWoodPlatform(x,y,w,false,154,hidden),
      stamp: (x,y) => this.spawnStamp(x,y),
      life: (x,y) => this.addBreakable(x,y,true),
      solid: surface => this.solidSurfaces.push(surface),
      tunnel: (a,b,y) => this.addTunnel(a,b,y), postcard: (x,y,id) => this.spawnPostcard(x,y,id),
      checkpoint: (x,y,id) => this.spawnCheckpoint(x,y,id),
      moving: (x,y,dx,dy,speed) => this.addMovingPlatform(x,y,dx,dy,speed),
      falling: (x,y) => this.addFallingPlatform(x,y), flower: (x,y,v) => this.spawnBounceFlower(x,y,v),
      breakable: (x,y) => this.addBreakable(x,y), enemy: enemy => this.enemies.push(enemy),
      bossDefeated: () => { this.bossDefeated = true; }, goal: (x,y) => this.spawnGoalGate(x,y),
    } satisfies import('../levels/world-1/buildForest').ForestBuilder;
    if(this.level.id === 'lab') buildLab(builder,this.level.world);
    else { const result=buildForest(builder);this.boss=result.boss;this.puzzleTarget=result.target; }
  }

  private addBreakable(x:number,y:number,life=false):void {
    const crate=this.physics.add.staticSprite(x,y,'break-crate').setDepth(5).setData('life',life);
    (crate.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.solidSurfaces.push(crate);this.breakables.push(crate);
  }

  private strikeObjects(area:Phaser.Geom.Rectangle):boolean {
    let struck=false;
    for(const crate of this.breakables){
      if(!crate.active||!Phaser.Geom.Intersects.RectangleToRectangle(area,crate.getBounds()))continue;
      if(crate.getData('life'))this.spawnLife(crate.x,crate.y-12);
      crate.destroy();struck=true;AudioSystem.get().playHit();
    }
    if(this.puzzleTarget?.active&&!this.puzzleTarget.isHit&&Phaser.Geom.Intersects.RectangleToRectangle(area,this.puzzleTarget.getBounds())){
      this.puzzleTarget.hit();struck=true;
    }
    return struck;
  }

  private addTunnel(a:number,b:number,floorY:number):void {
    // 19 units clearance: 17-high crouch fits; 25-high standing body does not.
    const thickness=this.level.id==='lab'?12:44;
    const roofTop=floorY-19-thickness;
    const roof=this.add.rectangle((a+b)/2,roofTop+thickness/2,b-a,thickness,0,0).setDepth(4);
    this.physics.add.existing(roof,true);this.solidSurfaces.push(roof);this.roofs.push(roof);
    if(this.level.id==='lab') {
      this.add.image((a+b)/2,roofTop,'platform-log').setOrigin(.5,0).setDisplaySize(b-a,thickness).setDepth(4);
      return;
    }
    this.add.tileSprite((a+b)/2,floorY-41,b-a,44,'earth-seamless').setTileScale(.25).setDepth(4);
    this.add.tileSprite((a+b)/2,floorY-64,b-a,8,'grass-seamless').setTileScale(.25).setDepth(5);
    this.add.image(a+6,floorY-19,'forest-atlas','vine').setDisplaySize(10,20).setDepth(5);
  }

  // --- SPAWNERS COM OVERLAPS SEGUROS ---
  private spawnStamp(x: number, y: number): Stamp {
    const stamp = new Stamp(this, x, y);
    if (this.player) {
      this.physics.add.overlap(this.player, stamp, () => stamp.collect());
    }
    return stamp;
  }

  private spawnPostcard(x: number, y: number, id: string): Postcard {
    const pc = new Postcard(this, x, y, id);
    if (this.player) {
      this.physics.add.overlap(this.player, pc, () => pc.collect());
    }
    return pc;
  }

  private spawnLife(x: number, y: number): LifeItem {
    const life = new LifeItem(this, x, y);
    if (this.player) {
      this.physics.add.overlap(this.player, life, () => life.collect());
    }
    return life;
  }

  private spawnCheckpoint(x: number, y: number, id: string): void {
    const checkpoint = new Checkpoint(this,x,y,id);
    this.physics.add.overlap(this.player!,checkpoint,() => checkpoint.activate());
  }

  private spawnBounceFlower(x: number, y: number, force = -370): BounceFlower {
    const flower = new BounceFlower(this, x, y, force);
    if (this.player) {
      this.physics.add.overlap(this.player, flower, () => flower.onPlayerBounce(this.player!));
    }
    return flower;
  }

  private spawnGoalGate(x: number, y: number): GoalGate {
    const gate = new GoalGate(this, x, y);
    if (this.player) {
      this.physics.add.overlap(this.player, gate, () => { if (this.bossDefeated && !this.player?.isDead) { this.physics.pause(); gate.onPlayerReach(); } });
    }
    return gate;
  }

  // --- CRIAÇÃO DE TERRENO MODULAR E PLATAFORMAS ---
  private addGroundSegment(startX: number, endX: number, surfaceY: number): void {
    this.groundSegments.push({ startX, endX, surfaceY });

    const width = endX - startX;
    const centerX = startX + width / 2;
    const height = this.level.world.height - surfaceY;
    const centerY = surfaceY + height / 2;

    const collider = this.add.rectangle(centerX, centerY, width, height, 0x6f4932, 0).setDepth(2);
    this.physics.add.existing(collider, true);
    this.solidSurfaces.push(collider);

    this.add.tileSprite(centerX,surfaceY+height/2,width,height,'earth-seamless').setTileScale(.25).setTilePosition(startX*4,surfaceY*4).setDepth(2);
    this.add.tileSprite(centerX,surfaceY+2,width,10,'grass-seamless').setTileScale(.25).setTilePosition(startX*4,0).setDepth(3);
  }

  private addWoodPlatform(
    x: number,
    y: number,
    width: number,
    hasStilts = true,
    groundSurfaceY = 154,
    initiallyHidden = false,
  ): { collider: Phaser.GameObjects.Rectangle; reveal: () => void } {
    const collider = this.add.rectangle(x, y + 3, width, 6, 0x8d5c38, 0).setDepth(4);
    this.physics.add.existing(collider, true);
    const body = collider.body as Phaser.Physics.Arcade.StaticBody;
    // Semissólida (one-way): permite saltar através por baixo e pousar no topo
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    body.checkCollision.up = true;
    this.solidSurfaces.push(collider);

    const images: Phaser.GameObjects.Image[] = [];
    // A one-pixel underside separates the preserved wood texture from distant trunks.
    this.add.rectangle(x,y+10,width-2,1,0x392a17).setOrigin(.5,0).setDepth(3);
    images.push(this.add.image(x,y,'platform-log').setOrigin(.5,0).setDisplaySize(width,10).setDepth(4));
    void hasStilts; void groundSurfaceY;

    if (initiallyHidden) {
      body.enable = false;
      collider.setVisible(false);
      images.forEach((img) => img.setAlpha(0));
    }

    const reveal = () => {
      body.enable = true;
      collider.setVisible(true);
      images.forEach((img) => {
        this.tweens.add({
          targets: img,
          alpha: 1,
          duration: 300,
        });
      });
    };

    return { collider, reveal };
  }

  private addMovingPlatform(x: number, y: number, distX: number, distY: number, speed: number): MovingPlatform {
    const mp = new MovingPlatform(this, x, y, distX, distY, speed);
    this.movingPlatforms.push(mp);
    return mp;
  }

  private addFallingPlatform(x: number, y: number): FallingPlatform {
    const fp = new FallingPlatform(this, x, y);
    this.fallingPlatforms.push(fp);
    return fp;
  }

  private setupEnemyCollisions(enemy:EnemyBase):void {
    this.physics.add.collider(enemy,this.solidSurfaces);
    this.physics.add.overlap(this.player!,enemy,()=>enemy.onPlayerOverlap(this.player!));
  }

  // --- TRATAMENTO DE MORTE / RESPAWN ---
  private handlePlayerDied(lifeAlreadyLost=false): void {
    const isGameOver = lifeAlreadyLost ? GameState.get().lives<=0 : GameState.get().loseLife();
    this.baton?.reset();

    this.time.delayedCall(1000, () => {
      if (isGameOver) {
        this.scene.stop(SCENE_KEYS.ui);
        this.scene.start(SCENE_KEYS.gameOver);
      } else {
        const respawnX = GameState.get().checkpointX ?? 40;
        const respawnY = GameState.get().checkpointY ?? 132;
        this.boss?.resetFight(); AudioSystem.get().startBgm('stage');
        this.player?.respawn(respawnX, respawnY);
      }
    });
  }

  // --- MENU DE PAUSA ---
  private togglePause(): void {
    if (this.audioModal?.isOpen) {
      this.audioModal.close();
      return;
    }

    if (this.controlsModal) { this.controlsModal.close(); return; }
    InputSettings.resetTouch();
    this.isPaused = !this.isPaused;
    AudioSystem.get().setGameplayPaused(this.isPaused);

    if (this.isPaused) {
      this.physics.pause(); this.time.paused = true; this.tweens.pauseAll();

      this.showPauseMenu();
    } else {
      this.physics.resume(); this.time.paused = false; this.tweens.resumeAll();

      this.hidePauseMenu();
    }
  }

  private showPauseMenu(): void {
    this.pauseSelectedIndex = 0;
    this.pauseMenuContainer = this.add.container(0, 0).setDepth(5000);

    pinOverlay(this,this.pauseMenuContainer);
    const backdrop = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x071e15, 0.85);
    const box = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 214, 126, 0x123b25, 1)
      .setStrokeStyle(1, 0x83b23b, 1);

    this.pauseMenuContainer.add([backdrop, box]);

    const title = addPixelText(this, GAME_WIDTH / 2, 38, 'PAUSADO', {
      scale: 2,
      color: 0xffe680,
      originX: 0.5,
      originY: 0.5,
      scrollFactor: 0,
      depth: 5001,
    });
    this.pauseMenuContainer.add(title);

    this.renderPauseMenuItems();

    const footer = addPixelText(this, GAME_WIDTH / 2, 142, 'MOUSE / ENTER / [X] : CONFIRMAR', {
      scale: 1,
      color: 0xa5c16b,
      originX: 0.5,
      originY: 0.5,
      scrollFactor: 0,
      depth: 5001,
    });
    this.pauseMenuContainer.add(footer);

    // Atalhos de teclado no menu de pausa
    this.input.keyboard?.off('keydown-UP', this.onPauseUp);
    this.input.keyboard?.off('keydown-W', this.onPauseUp);
    this.input.keyboard?.off('keydown-DOWN', this.onPauseDown);
    this.input.keyboard?.off('keydown-S', this.onPauseDown);
    this.input.keyboard?.off('keydown-ENTER', this.onPauseConfirm);
    this.input.keyboard?.off('keydown-SPACE', this.onPauseConfirm);

    this.input.keyboard?.on('keydown-UP', this.onPauseUp);
    this.input.keyboard?.on('keydown-W', this.onPauseUp);
    this.input.keyboard?.on('keydown-DOWN', this.onPauseDown);
    this.input.keyboard?.on('keydown-S', this.onPauseDown);
    this.input.keyboard?.on('keydown-ENTER', this.onPauseConfirm);
    this.input.keyboard?.on('keydown-SPACE', this.onPauseConfirm);
  }

  private renderPauseMenuItems(): void {
    this.pauseMenuItems.forEach((t) => t.destroy());
    this.pauseMenuItems = [];
    this.pauseHitZones.forEach((h) => h.destroy());
    this.pauseHitZones = [];

    const options = [
      {
        label: 'CONTINUAR',
        action: () => this.togglePause(),
      },
      {
        label: 'AJUSTES DE AUDIO',
        action: () => {
          this.audioModal = new AudioSettingsModal(this, () => {
            this.audioModal = undefined;
          });
          this.audioModal.open();
        },
      },
      { label: 'CONTROLES', action: () => { this.controlsModal = new ControlsModal(this, () => { this.controlsModal = undefined; }); } },
      {
        label: 'REINICIAR FASE',
        action: () => {
          this.togglePause();
          this.scene.restart({levelId:this.level.id});
        },
      },
      {
        label: 'VOLTAR AO MENU',
        action: () => {
          this.togglePause();
          this.scene.stop(SCENE_KEYS.ui);
          this.scene.start(SCENE_KEYS.title);
        },
      },
    ];

    const startY = 64;
    const rowHeight = 15;

    options.forEach((opt, idx) => {
      const y = startY + idx * rowHeight;
      const isSelected = idx === this.pauseSelectedIndex;
      const prefix = isSelected ? '> ' : '  ';
      const color = isSelected ? 0xfef08a : 0xe5f0b8;

      const itemText = addPixelText(this, GAME_WIDTH / 2, y, `${prefix}${opt.label}`, {
        scale: 1,
        color,
        originX: 0.5,
        originY: 0.5,
        scrollFactor: 0,
        depth: 5002,
      });
      this.pauseMenuItems.push(itemText);
      this.pauseMenuContainer?.add(itemText);

      // Suporte a Mouse no menu de pausa
      const hit = this.add.rectangle(GAME_WIDTH / 2, y, 180, 16, 0x000000, 0.001)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .setDepth(5003);

      hit.on('pointerover', () => {
        if (this.pauseSelectedIndex !== idx) {
          this.pauseSelectedIndex = idx;
          AudioSystem.get().playMenuNavigate();
          this.pauseMenuItems.forEach((item,i)=>{
            const label=(item as Phaser.GameObjects.Container).getAt(0) as Phaser.GameObjects.Text;
            label.setText((i===idx?'> ':'  ')+options[i]!.label).setColor(i===idx?'#fef08a':'#e5f0b8');
          });
        }
      });

      hit.on('pointerdown', () => {
        this.pauseSelectedIndex = idx;
        opt.action();
      });

      this.pauseMenuContainer?.add(hit);
      this.pauseHitZones.push(hit);
    });
  }

  private navigatePauseMenu(dir: number): void {
    this.pauseSelectedIndex = (this.pauseSelectedIndex + dir + 5) % 5;
    AudioSystem.get().playMenuNavigate();
    this.renderPauseMenuItems();
  }

  private selectPauseMenuItem(): void {
    const actions = [
      () => this.togglePause(),
      () => {
        this.audioModal = new AudioSettingsModal(this, () => {
          this.audioModal = undefined;
        });
        this.audioModal.open();
      },
      () => { this.controlsModal = new ControlsModal(this, () => { this.controlsModal = undefined; }); },
      () => {
        this.togglePause();
        this.scene.restart();
      },
      () => {
        this.togglePause();
        this.scene.stop(SCENE_KEYS.ui);
        this.scene.start(SCENE_KEYS.title);
      },
    ];

    const act = actions[this.pauseSelectedIndex];
    if (act) {
      AudioSystem.get().playMenuSelect();
      act();
    }
  }

  private hidePauseMenu(): void {
    this.input.keyboard?.off('keydown-UP', this.onPauseUp);
    this.input.keyboard?.off('keydown-W', this.onPauseUp);
    this.input.keyboard?.off('keydown-DOWN', this.onPauseDown);
    this.input.keyboard?.off('keydown-S', this.onPauseDown);
    this.input.keyboard?.off('keydown-ENTER', this.onPauseConfirm);
    this.input.keyboard?.off('keydown-SPACE', this.onPauseConfirm);

    this.pauseMenuItems.forEach((t) => t.destroy());
    this.pauseMenuItems = [];
    this.pauseHitZones.forEach((h) => h.destroy());
    this.pauseHitZones = [];
    this.pauseMenuContainer?.destroy();
    this.pauseMenuContainer = undefined;
  }

  // --- BANNER DE APRESENTAÇÃO RETRÔ DA FASE (ESTILO SONIC / TMNT / POWER RANGERS) ---
  // --- PARALLAX E CENÁRIO VISUAL RETRÔ DE ALTA QUALIDADE ---
  private drawParallaxBackdrop(worldWidth: number): void {
    if(this.level.id==='lab') {
      // Director's latest choice: reuse the title forest, preserving its detail.
      // Background presentation has no effect on logical physics or collision.
      this.cameras.main.setBackgroundColor('#194f38');
      const backdrop=this.add.image(this.level.camera.width/2,this.level.camera.height/2,'forest-backdrop').setDepth(-30);
      const fit=Math.max(this.level.camera.width/backdrop.width,this.level.camera.height/backdrop.height);
      backdrop.setScale(fit);
      return;
    }
    const layer = (image: Phaser.GameObjects.Image, fx: number, fy: number) => {
      this.parallax.push({image,x:image.x,y:image.y,fx,fy}); return image;
    };
    for(let x=-500;x<worldWidth*.14+1000;x+=640) {
      layer(this.add.image(x,90,'grove-backdrop').setOrigin(0,.5).setDisplaySize(640,360).setFlipX(Math.round((x+500)/640)%2===1).setTint(0x91c6b5).setDepth(-30),.14,.15);
    }
    for(let x=0;x<worldWidth+600;x+=185) {
      if(Math.floor(x/700)%3===1)continue;
      layer(this.add.image(x,-3,'forest-atlas','canopy').setDisplaySize(205,105).setDepth(16),.88,.35);
      if(x%370===0)layer(this.add.image(x+63,30,'forest-atlas','vine').setDisplaySize(21,93).setDepth(-2),.88,.35);
    }
  }

  private drawWorldDecor(): void {
    if(this.level.id==='lab') return;
    for(const seg of this.groundSegments) {
      const width=seg.endX-seg.startX;
      if(width<45)continue;
      for(let x=seg.startX+55;x<seg.endX-30;x+=300) {
        if(Math.floor(x/700)%3===1)continue;
        this.add.image(x,seg.surfaceY+3,'forest-atlas','tree').setOrigin(.5,1).setDisplaySize(133,173).setDepth(-3);
      }
      for(let x=seg.startX+20;x<seg.endX-12;x+=100) {
        this.add.image(x,seg.surfaceY+7,'forest-atlas',Math.floor(x/70)%2?'fern':'shrub').setOrigin(.5,1).setDisplaySize(37,26).setDepth(1);
      }
      for(let x=seg.startX+12;x<seg.endX-8;x+=43) {
        this.add.image(x,seg.surfaceY+4,'forest-atlas','grass-edge').setOrigin(.5,1).setDisplaySize(43,12).setDepth(4);
      }
      if(width>130)this.add.image(seg.startX+80,seg.surfaceY+7,'forest-atlas','bromeliad').setOrigin(.5,1).setDisplaySize(32,29).setDepth(11);
    }
  }

  private createWindBreeze(): void {

    for (let i = 0; i < 14; i++) {
      const g = this.add.sprite(0,0,'leaves-sheet').setDisplaySize(4,4).setDepth(14).play('leaf-turn');

      const leaf = {
        g,
        x: Phaser.Math.Between(0, this.level.world.width),
        y: Phaser.Math.Between(20, 150),
        speedX: Phaser.Math.FloatBetween(22, 45),
        speedY: Phaser.Math.FloatBetween(8, 20),
        wobble: Phaser.Math.FloatBetween(0, Math.PI * 2),
      };

      g.setPosition(leaf.x, leaf.y);

      this.tweens.add({
        targets: leaf,
        wobble: leaf.wobble + Math.PI * 4,
        duration: Phaser.Math.Between(1800, 3200),
        repeat: -1,
        yoyo: true,
      });

      this.windLeaves.push(leaf);
    }
  }
}
