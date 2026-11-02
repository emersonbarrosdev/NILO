import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { BeetleEnemy } from '../entities/enemies/BeetleEnemy';
import { HopperEnemy } from '../entities/enemies/HopperEnemy';
import { DragonflyEnemy } from '../entities/enemies/DragonflyEnemy';
import { Checkpoint } from '../entities/environment/Checkpoint';
import { PuzzleTarget } from '../entities/environment/PuzzleTarget';
import { MovingPlatform } from '../entities/environment/MovingPlatform';
import { BounceFlower } from '../entities/environment/BounceFlower';
import { SpikeHazard } from '../entities/environment/SpikeHazard';
import { GoalGate } from '../entities/environment/GoalGate';
import { Stamp } from '../entities/items/Stamp';
import { Postcard } from '../entities/items/Postcard';
import { HeartItem } from '../entities/items/HeartItem';
import { LifeItem } from '../entities/items/LifeItem';
import { GameState } from '../systems/GameState';
import { AudioSystem } from '../systems/AudioSystem';
import { GamepadSystem } from '../systems/GamepadSystem';
import { addPixelText } from '../ui/PixelText';
import { AudioSettingsModal } from '../ui/AudioSettingsModal';

export class GameScene extends Phaser.Scene {
  private player?: Player;
  private readonly solidSurfaces: Phaser.GameObjects.GameObject[] = [];
  private readonly groundSegments: { startX: number; endX: number; surfaceY: number }[] = [];
  private readonly enemies: (BeetleEnemy | HopperEnemy | DragonflyEnemy)[] = [];
  private readonly movingPlatforms: MovingPlatform[] = [];
  private isPaused = false;
  private pauseMenuContainer?: Phaser.GameObjects.Container;
  private pauseSelectedIndex = 0;
  private pauseMenuItems: Phaser.GameObjects.GameObject[] = [];
  private pauseHitZones: Phaser.GameObjects.Rectangle[] = [];
  private audioModal?: AudioSettingsModal;
  private onPauseKey = () => this.togglePause();
  private onPauseUp = () => { if (this.isPaused && !this.audioModal?.isOpen) this.navigatePauseMenu(-1); };
  private onPauseDown = () => { if (this.isPaused && !this.audioModal?.isOpen) this.navigatePauseMenu(1); };
  private onPauseConfirm = () => { if (this.isPaused && !this.audioModal?.isOpen) this.selectPauseMenuItem(); };

  constructor() { super(SCENE_KEYS.game); }

  init(data?: { stageId?: string; isContinue?: boolean }): void {
    const gameState = GameState.get();
    if (!data?.isContinue) {
      gameState.startStage(data?.stageId || '1-1', 40, 134);
    } else {
      gameState.lives = 3;
      gameState.hp = gameState.maxHp;
      gameState.emitChange();
    }
  }

  create(): void {
    const worldWidth = 4800;
    const worldHeight = 200;

    this.solidSurfaces.length = 0;
    this.groundSegments.length = 0;
    this.enemies.length = 0;
    this.movingPlatforms.length = 0;
    this.isPaused = false;

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
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Constrói o Level Design completo dos 5 Atos PRIMEIRO (registra os segmentos de solo)
    this.buildLevelTerrain(worldWidth);

    // Cenários de Fundo com Parallax e Decorações Firmadas no Solo
    this.drawParallaxBackdrop(worldWidth);
    this.drawWorldDecor();

    // Colisões do Player com superfícies sólidas
    for (const surface of this.solidSurfaces) {
      this.physics.add.collider(this.player, surface);
    }

    // Colisões com plataformas móveis
    for (const mp of this.movingPlatforms) {
      this.physics.add.collider(this.player, mp);
    }

    // Escuta disparos de estilingue
    this.events.off('player-shot', this.handlePlayerShot, this);
    this.events.on('player-shot', this.handlePlayerShot, this);

    // Escuta morte do player (dano ou queda)
    this.events.off('player-died', this.handlePlayerDied, this);
    this.events.on('player-died', this.handlePlayerDied, this);

    // Sistema de Pausa via Tecla ESC ou P (com limpeza de listeners anteriores)
    this.input.keyboard?.off('keydown-ESC', this.onPauseKey);
    this.input.keyboard?.off('keydown-P', this.onPauseKey);
    this.input.keyboard?.on('keydown-ESC', this.onPauseKey);
    this.input.keyboard?.on('keydown-P', this.onPauseKey);

    // Banner Inicial da Fase
    this.showStageIntroBanner();

    // Inicia Trilha Sonora 8-bit do Estágio
    AudioSystem.get().startBgm('stage');

    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown-ESC', this.onPauseKey);
      this.input.keyboard?.off('keydown-P', this.onPauseKey);
      this.scene.stop(SCENE_KEYS.ui);
      AudioSystem.get().stopBgm();
    });

    // Inicia HUD Overlay
    this.scene.launch(SCENE_KEYS.ui);
  }

  update(time: number, delta: number): void {
    const pad = GamepadSystem.get().updateMenuNavigation(time);
    if (pad.pauseJustPressed) {
      this.togglePause();
      return;
    }

    if (this.isPaused) {
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
    GameState.get().addStageTime(delta / 1000);

    this.player?.update(time);

    // Atualiza lógica dos inimigos
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.active) {
        enemy.update(time, delta);
      } else {
        this.enemies.splice(i, 1);
      }
    }

    // Atualiza plataformas móveis
    for (const mp of this.movingPlatforms) {
      if (mp.active) mp.update();
    }
  }

  // --- CONSTRUÇÃO DO LEVEL DESIGN (5 ATOS DO VALE DA BRISA - MUNDO EXTENSO 4800PX) ---
  private buildLevelTerrain(worldWidth: number): void {
    const GROUND_Y = 154;

    // === ATO 1: ABERTURA SEGURA E PRIMEIRO SALTO (X: 0 -> 900) ===
    // Segmento 1 de solo plano: 0 a 480 (Área segura para acostumar com a física, velocidade e pulo)
    this.addGroundSegment(0, 480, GROUND_Y);

    // Selos em arco suave ensinando a cadência do pulo único
    [120, 140, 160].forEach((x, i) => {
      this.spawnStamp(x, 134 - (i === 1 ? 14 : 7));
    });

    // Primeira plataforma de madeira rústica com estacas
    this.addWoodPlatform(240, 124, 48, true, GROUND_Y);
    this.spawnStamp(240, 108);

    // Colina suave de terra (480 a 680, Y: 142) - conectado perfeitamente ao segmento 1 sem degraus invisíveis
    this.addGroundSegment(480, 680, 142);
    this.spawnStamp(520, 126);
    this.spawnStamp(560, 126);
    this.spawnStamp(600, 126);

    // Primeiro fosso curto (680 -> 760, vão de 80px) com degrau de pedra firme no centro
    this.addStonePlatform(720, 142, 28);
    this.spawnStamp(720, 124);

    // Segmento 3 de solo seguro: 760 a 1060
    this.addGroundSegment(760, 1060, GROUND_Y);
    [840, 860, 880].forEach((x, i) => {
      this.spawnStamp(x, 136 - (i === 1 ? 12 : 6));
    });

    // === ATO 2: PRIMEIRO INIMIGO, ROTAS ALTERNATIVAS E FOSSO DE ESPINHOS (X: 900 -> 2000) ===
    // Segmento 4 de solo: 1060 a 1520
    this.addGroundSegment(1060, 1520, GROUND_Y);

    // Cascuva 1 patrulha de forma segura no solo (1080 a 1480) sem jamais cair no fosso de espinhos
    const beetle1 = new BeetleEnemy(this, 1140, GROUND_Y - 8, 1080, 1480);
    this.enemies.push(beetle1);
    this.setupEnemyCollisions(beetle1);

    // ROTA ALTA: Passarelas de madeira nas copas das árvores (semissólidas)
    this.addWoodPlatform(1180, 124, 48, true, GROUND_Y);
    this.spawnStamp(1180, 108);

    this.addWoodPlatform(1260, 98, 48, true, GROUND_Y);
    this.spawnStamp(1260, 82);

    // Plataforma alta da copa (hasStilts: false) com Coração de Recompensa
    this.addWoodPlatform(1350, 74, 56, false);
    this.spawnHeart(1350, 58); // Recompensa por dominar a rota alta

    // Plataforma alta que cruza com segurança por cima do fosso de espinhos
    this.addWoodPlatform(1450, 74, 56, false);
    this.spawnStamp(1450, 58);

    this.addWoodPlatform(1550, 98, 48, false);
    this.spawnStamp(1550, 82);

    this.addWoodPlatform(1630, 124, 48, true, GROUND_Y);
    this.spawnStamp(1630, 108);

    // ROTA BAIXA: Fosso de espinhos aberto e limpo (X: 1520 -> 1600, vão de 80px)
    // Os espinhos estão NO FUNDO do fosso (Y: 172), sem nenhuma plataforma sobreposta!
    this.spawnSpike(1545, 172);
    this.spawnSpike(1560, 172);
    this.spawnSpike(1575, 172);

    // Segmento 5 de solo após os espinhos: 1600 a 2020
    this.addGroundSegment(1600, 2020, GROUND_Y);

    // Segundo Cascuva patrulhando após os espinhos com limites seguros
    const beetle2 = new BeetleEnemy(this, 1720, GROUND_Y - 8, 1630, 1960);
    this.enemies.push(beetle2);
    this.setupEnemyCollisions(beetle2);

    this.spawnStamp(1750, 136);
    this.spawnStamp(1770, 136);
    this.spawnStamp(1790, 136);

    // CHECKPOINT 1 (Totem do Vale 1)
    this.spawnCheckpoint(1880, GROUND_Y - 14, 'cp-1');

    // === ATO 3: VERTICALIDADE, COPAS DAS ÁRVORES E INIMIGO AÉREO (X: 2000 -> 3050) ===
    // Segmento 6 de solo: 2020 a 2460
    this.addGroundSegment(2020, 2460, GROUND_Y);

    const beetle3 = new BeetleEnemy(this, 2100, GROUND_Y - 8, 2040, 2420);
    this.enemies.push(beetle3);
    this.setupEnemyCollisions(beetle3);

    // Escalada vertical nas árvores antigas
    this.addWoodPlatform(2120, 124, 48, true, GROUND_Y);
    this.spawnStamp(2120, 108);

    this.addWoodPlatform(2200, 96, 48, false);
    this.spawnStamp(2200, 80);

    // Inimigo Aéreo 1: Zumbão patrulhando a rota alta
    const flyer1 = new DragonflyEnemy(this, 2260, 68, 55);
    this.enemies.push(flyer1);
    this.setupEnemyCollisions(flyer1);

    // Mirante da copa alta
    this.addWoodPlatform(2290, 72, 56, false);
    // SEGREDO 1 (Tarefa 30 - Fácil/Visível): Cartão-Postal #1 na copa alta
    this.spawnPostcard(2290, 56, '1-1-1');

    this.addWoodPlatform(2380, 96, 48, false);
    this.addWoodPlatform(2440, 124, 48, true, GROUND_Y);

    // Fosso do riacho: 2460 -> 2590 (vão de 130px com lajes de pedra)
    this.addStonePlatform(2500, 142, 28);
    this.spawnStamp(2500, 124);

    this.addStonePlatform(2550, 142, 28);
    this.spawnStamp(2550, 124);

    // Segmento 7 de solo: 2590 a 3080
    this.addGroundSegment(2590, 3080, GROUND_Y);

    // Inimigo Aéreo 2 sobrevoando a clareira aberta
    const flyer2 = new DragonflyEnemy(this, 2750, 92, 60);
    this.enemies.push(flyer2);
    this.setupEnemyCollisions(flyer2);

    // Colina intermediária elevada (2800 a 2980, Y: 142)
    this.addGroundSegment(2800, 2980, 142);
    const beetle4 = new BeetleEnemy(this, 2880, 134, 2820, 2960);
    this.enemies.push(beetle4);
    this.setupEnemyCollisions(beetle4);

    this.spawnStamp(2860, 126);
    this.spawnStamp(2880, 126);
    this.spawnStamp(2900, 126);

    // === ATO 4: PUZZLES DO ESTILINGUE, TIRO CARREGADO E 1-UP OCULTO (X: 3050 -> 4050) ===
    // Segmento 9 de solo: 3080 a 3420
    this.addGroundSegment(3080, 3420, GROUND_Y);

    // Degrau de apoio para disparar nos alvos confortavelmente
    this.addWoodPlatform(3140, 126, 40, true, GROUND_Y);
    this.spawnStamp(3140, 110);

    // ROTA PRINCIPAL DO DESFILADEIRO (X: 3420 a 3600):
    // Sempre acessível e fluida com plataformas rústicas e jangada móvel (sem bloqueios invisíveis)
    // 1. Cais de madeira inicial
    this.addWoodPlatform(3450, 126, 44, true, GROUND_Y);
    this.spawnStamp(3450, 110);

    // 2. Jangada móvel de madeira (oscila suavemente entre X: 3495 e 3535, Y: 114)
    this.addMovingPlatform(3495, 114, 40, 0, 34);

    // 3. Posto de desembarque com estacas firmes
    this.addWoodPlatform(3575, 126, 44, true, GROUND_Y);
    this.spawnStamp(3575, 110);

    // SINO DE OURO (ALVO DE BÔNUS & SEGREDO EM X: 3260, Y: 94):
    // Ao disparar o estilingue no sino, ele badala, solta uma chuva de moedas e revela rota secreta!
    const secretHighPlatform = this.addWoodPlatform(3510, 56, 48, false, GROUND_Y, true);

    const puzzleTarget = new PuzzleTarget(this, 3260, 94, () => {
      GameState.get().recordDefeatEnemy(200); // Bônus de pontuação
      secretHighPlatform.reveal();

      // Chuva festiva de Selos de Ouro liberada pelo sino
      [3230, 3250, 3270, 3290].forEach((sx, i) => {
        this.spawnStamp(sx, 76 - (i % 2 === 0 ? 6 : 0));
      });

      const lifeItem = this.spawnLife(3510, 40);
      this.tweens.add({
        targets: lifeItem,
        y: 36,
        duration: 350,
        yoyo: true,
        repeat: 2,
      });

      const alert = addPixelText(this, 3260, 68, 'SINO DE OURO! +200 PTS & 1-UP!', {
        scale: 1,
        color: 0xfef08a,
        originX: 0.5,
        originY: 0.5,
      });
      this.tweens.add({ targets: alert, alpha: 0, delay: 1600, duration: 400, onComplete: () => alert.destroy() });
    });

    // SEGREDO 2 (Tarefa 30 - Exploração): Cartão-Postal #2 no alto
    this.addWoodPlatform(3620, 78, 48, false);
    this.spawnPostcard(3620, 62, '1-1-2');

    // Segmento 10 de solo: 3600 a 4050
    this.addGroundSegment(3600, 4050, GROUND_Y);

    // No chão: Saltador (HopperEnemy) com limites de patrulha seguros
    const hopper1 = new HopperEnemy(this, 3750, GROUND_Y - 8, this.player, 3630, 3950);
    this.enemies.push(hopper1);
    this.setupEnemyCollisions(hopper1);

    this.spawnStamp(3820, 136);
    this.spawnStamp(3840, 136);
    this.spawnStamp(3860, 136);

    // CHECKPOINT 2 (Totem do Vale 2)
    this.spawnCheckpoint(3980, GROUND_Y - 14, 'cp-2');

    // === ATO 5: TRAMPOLIM FLORAL, PLATAFORMAS MÓVEIS (H+V) E CHEGADA (X: 4050 -> 4800) ===
    // Segmento 11 de solo: 4050 a 4260
    this.addGroundSegment(4050, 4260, GROUND_Y);

    // Flor Trampolim (estilo Mario Note-block / DKC bouncy mushroom) plantada firmemente no solo
    this.spawnBounceFlower(4210, GROUND_Y - 6, -400);

    // ROTA ALTA (SECRETA NAS COPAS): Acessada pelo super salto da flor
    this.addWoodPlatform(4265, 82, 48, false);
    this.spawnStamp(4265, 66);

    this.addWoodPlatform(4360, 68, 48, false);
    this.spawnStamp(4360, 52);

    // Mirante Alto do Desfiladeiro: Cartão-Postal #3 nas copas seguras
    this.addWoodPlatform(4460, 68, 48, false);
    this.spawnPostcard(4460, 52, '1-1-3');
    this.spawnStamp(4480, 52);

    // ROTA PRINCIPAL DO DESFILADEIRO (Ritmo calibrado estilo Donkey Kong Country / Mario World):
    // Todos os vãos calibrados entre 30px e 45px (100% transponíveis pelo pulo único de 75px de alcance)
    // 1. Cais de estacas de madeira inicial
    this.addWoodPlatform(4295, 130, 44, true, GROUND_Y);
    this.spawnStamp(4295, 114);

    // 2. Plataforma Móvel Horizontal (oscila suavemente entre X: 4345 e 4395, Y: 116)
    this.addMovingPlatform(4345, 116, 50, 0, 32);

    // 3. Ilhota de pedra sólida no meio do desfiladeiro (pouso seguro e firme)
    this.addStonePlatform(4435, 122, 38);
    this.spawnStamp(4435, 104);

    // 4. Plataforma Móvel Vertical (elevador oscila entre Y: 80 e Y: 125 em X: 4495)
    this.addMovingPlatform(4495, 80, 0, 45, 30);

    // 5. Posto avançado de madeira firme antes do platô final
    this.addWoodPlatform(4555, 126, 42, true, GROUND_Y);
    this.spawnStamp(4555, 110);

    // Platô final da montanha: 4595 a 4800 (sem abismos invisíveis)
    this.addGroundSegment(4595, worldWidth, GROUND_Y);

    // Guardião final: Saltador
    const hopper2 = new HopperEnemy(this, 4670, GROUND_Y - 8, this.player, 4620, 4730);
    this.enemies.push(hopper2);
    this.setupEnemyCollisions(hopper2);

    // PORTAL DE VITÓRIA (Goal Gate / Chegada Festiva da Fase)
    this.spawnGoalGate(4750, GROUND_Y - 18);

    // Escuta impacto de tiro no Sino de Ouro
    this.events.on('check-target-hit', (projectile: Projectile) => {
      if (puzzleTarget.active && !puzzleTarget.isHit && Phaser.Geom.Intersects.RectangleToRectangle(projectile.getBounds(), puzzleTarget.getBounds())) {
        const wasTriggered = puzzleTarget.hit(projectile.charged);
        if (wasTriggered) projectile.destroy();
      }
    });
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

  private spawnHeart(x: number, y: number): HeartItem {
    const heart = new HeartItem(this, x, y);
    if (this.player) {
      this.physics.add.overlap(this.player, heart, () => heart.collect());
    }
    return heart;
  }

  private spawnLife(x: number, y: number): LifeItem {
    const life = new LifeItem(this, x, y);
    if (this.player) {
      this.physics.add.overlap(this.player, life, () => life.collect());
    }
    return life;
  }

  private spawnSpike(x: number, y: number): SpikeHazard {
    const spike = new SpikeHazard(this, x, y);
    if (this.player) {
      this.physics.add.overlap(this.player, spike, () => spike.onPlayerOverlap(this.player!));
    }
    return spike;
  }

  private spawnCheckpoint(x: number, y: number, id: string): Checkpoint {
    const cp = new Checkpoint(this, x, y, id);
    if (this.player) {
      this.physics.add.overlap(this.player, cp, () => cp.activate());
    }
    return cp;
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
      this.physics.add.overlap(this.player, gate, () => gate.onPlayerReach());
    }
    return gate;
  }

  // --- CRIAÇÃO DE TERRENO MODULAR E PLATAFORMAS ---
  private addGroundSegment(startX: number, endX: number, surfaceY: number): void {
    this.groundSegments.push({ startX, endX, surfaceY });

    const width = endX - startX;
    const centerX = startX + width / 2;
    const height = 40;
    const centerY = surfaceY + height / 2;

    const collider = this.add.rectangle(centerX, centerY, width, height, 0x6f4932, 0).setDepth(2);
    this.physics.add.existing(collider, true);
    this.solidSurfaces.push(collider);

    for (let x = startX; x < endX; x += 16) {
      const tileWidth = Math.min(16, endX - x);
      let topKey = 'tile-ground';
      if (x === startX) topKey = 'tile-ground-left';
      else if (x + 16 >= endX) topKey = 'tile-ground-right';

      this.add.image(x + tileWidth / 2, surfaceY + 8, topKey).setDepth(3);
      this.add.image(x + tileWidth / 2, surfaceY + 24, 'tile-earth').setDepth(2);
      this.add.image(x + tileWidth / 2, surfaceY + 40, 'tile-earth').setDepth(2);
    }
  }

  private addWoodPlatform(
    x: number,
    y: number,
    width: number,
    hasStilts = true,
    groundSurfaceY = 154,
    initiallyHidden = false,
  ): { collider: Phaser.GameObjects.Rectangle; reveal: () => void } {
    const collider = this.add.rectangle(x, y + 2, width, 6, 0x8d5c38, 0).setDepth(4);
    this.physics.add.existing(collider, true);
    const body = collider.body as Phaser.Physics.Arcade.StaticBody;
    // Semissólida (one-way): permite saltar através por baixo e pousar no topo
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    body.checkCollision.up = true;
    this.solidSurfaces.push(collider);

    const images: Phaser.GameObjects.Image[] = [];
    const startX = x - width / 2;
    for (let currentX = startX; currentX < startX + width; currentX += 16) {
      const img = this.add.image(currentX + 8, y, 'tile-wood-plank').setDepth(4);
      images.push(img);
    }

    if (hasStilts) {
      const stiltHeight = groundSurfaceY - (y + 5);
      if (stiltHeight > 10) {
        const stilt1X = startX + 5;
        const stilt2X = startX + width - 5;
        for (let sy = y + 6; sy < groundSurfaceY; sy += 32) {
          images.push(this.add.image(stilt1X, sy + 16, 'platform-stilt').setDepth(1));
          images.push(this.add.image(stilt2X, sy + 16, 'platform-stilt').setDepth(1));
        }
      }
    } else {
      // Suporte de mão-francesa rústico em pixel art
      images.push(this.add.image(startX + 3, y + 4, 'platform-bracket').setDepth(2));
      images.push(this.add.image(startX + width - 3, y + 4, 'platform-bracket').setFlipX(true).setDepth(2));
    }

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

  private addStonePlatform(x: number, y: number, width: number): void {
    const collider = this.add.rectangle(x, y + 2, width, 6, 0x5a6370, 0).setDepth(4);
    this.physics.add.existing(collider, true);
    const body = collider.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    body.checkCollision.up = true;
    this.solidSurfaces.push(collider);

    // Laje de pedra entalhada em pixel art real
    this.add.image(x, y + 1, 'platform-stone').setDepth(3);
  }

  private addMovingPlatform(x: number, y: number, distX: number, distY: number, speed: number): MovingPlatform {
    const mp = new MovingPlatform(this, x, y, distX, distY, speed);
    this.movingPlatforms.push(mp);
    return mp;
  }

  // --- TRATAMENTO DE DISPAROS DO ESTILINGUE ---
  private handlePlayerShot(projectile: Projectile): void {
    this.alignProjectileWithSlingshot(projectile);

    for (const surface of this.solidSurfaces) {
      this.physics.add.collider(projectile, surface, () => {
        if (!projectile.active) return;
        this.spawnStoneImpact(projectile.x, projectile.y, projectile.charged);
        projectile.destroy();
      });
    }

    for (const enemy of this.enemies) {
      this.physics.add.overlap(projectile, enemy, () => {
        if (!projectile.active || enemy.isDefeated) return;
        this.spawnStoneImpact(projectile.x, projectile.y, projectile.charged);
        enemy.takeDamage(projectile.damage, projectile.x);
        projectile.destroy();
      });
    }

    this.events.emit('check-target-hit', projectile);
  }

  private setupEnemyCollisions(enemy: BeetleEnemy | HopperEnemy | DragonflyEnemy): void {
    for (const surface of this.solidSurfaces) {
      this.physics.add.collider(enemy, surface);
    }

    if (this.player) {
      this.physics.add.overlap(this.player, enemy, () => {
        enemy.onPlayerOverlap(this.player!);
      });
    }

    // Se um inimigo atordoado for chutado (isSliding), ele atropela outros inimigos no caminho
    for (const other of this.enemies) {
      if (other !== enemy) {
        this.physics.add.overlap(enemy, other, () => {
          if (enemy.isSliding && !other.isDefeated) {
            other.die(enemy.x);
          } else if (other.isSliding && !enemy.isDefeated) {
            enemy.die(other.x);
          }
        });
      }
    }
  }

  private alignProjectileWithSlingshot(projectile: Projectile): void {
    if (!this.player) return;

    const body = projectile.body as Phaser.Physics.Arcade.Body;
    const direction = new Phaser.Math.Vector2(body.velocity.x, body.velocity.y);
    if (direction.lengthSq() === 0) direction.set(this.player.flipX ? -1 : 1, 0);
    direction.normalize();

    const facing = Math.abs(direction.x) > 0.05 ? Math.sign(direction.x) : (this.player.flipX ? -1 : 1);
    const absX = Math.abs(direction.x);
    const absY = Math.abs(direction.y);
    let offsetX = 9 * facing;
    let offsetY = 0;

    if (absY > absX * 1.5) {
      offsetX = 5 * facing;
      offsetY = direction.y < 0 ? -9 : 9;
    } else if (absY > 0.35) {
      offsetX = 7 * facing;
      offsetY = direction.y < 0 ? -7 : 7;
    }

    projectile.setPosition(this.player.x + offsetX, this.player.y + offsetY);
  }

  private spawnStoneImpact(x: number, y: number, charged: boolean): void {
    const impact = this.add.graphics().setDepth(14);
    const size = charged ? 4 : 2;
    const spread = charged ? 6 : 3;

    impact.fillStyle(charged ? 0xffdf68 : 0xdfd4bc, 1);
    impact.fillRect(x - size / 2, y - size / 2, size, size);
    impact.fillRect(x - spread, y, size, 1);
    impact.fillRect(x + spread - size, y - 1, size, 1);
    impact.fillRect(x, y - spread, 1, size);
    impact.fillRect(x - 1, y + spread - size, 1, size);

    this.tweens.add({
      targets: impact,
      alpha: 0,
      duration: charged ? 150 : 100,
      onComplete: () => impact.destroy(),
    });
  }

  // --- TRATAMENTO DE MORTE / RESPAWN ---
  private handlePlayerDied(): void {
    const isGameOver = GameState.get().loseLife();

    this.time.delayedCall(1000, () => {
      if (isGameOver) {
        this.scene.stop(SCENE_KEYS.ui);
        this.scene.start(SCENE_KEYS.gameOver);
      } else {
        const respawnX = GameState.get().checkpointX ?? 40;
        const respawnY = GameState.get().checkpointY ?? 132;
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

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      this.showPauseMenu();
    } else {
      this.physics.resume();
      this.hidePauseMenu();
    }
  }

  private showPauseMenu(): void {
    this.pauseSelectedIndex = 0;
    this.pauseMenuContainer = this.add.container(0, 0).setDepth(5000).setScrollFactor(0);

    const backdrop = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x091424, 0.85);
    const box = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 214, 126, 0x162c45, 1)
      .setStrokeStyle(1, 0x56a4cc, 1);

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
      color: 0x93c5fd,
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
      {
        label: 'REINICIAR FASE',
        action: () => {
          this.togglePause();
          this.scene.restart();
        },
      },
      {
        label: 'SAIR PRO MAPA',
        action: () => {
          this.togglePause();
          this.scene.stop(SCENE_KEYS.ui);
          this.scene.start(SCENE_KEYS.map);
        },
      },
    ];

    const startY = 64;
    const rowHeight = 18;

    options.forEach((opt, idx) => {
      const y = startY + idx * rowHeight;
      const isSelected = idx === this.pauseSelectedIndex;
      const prefix = isSelected ? '> ' : '  ';
      const color = isSelected ? 0xfef08a : 0xbae6fd;

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
          this.renderPauseMenuItems();
        }
      });

      hit.on('pointerdown', () => {
        this.pauseSelectedIndex = idx;
        opt.action();
      });

      this.pauseHitZones.push(hit);
    });
  }

  private navigatePauseMenu(dir: number): void {
    this.pauseSelectedIndex = (this.pauseSelectedIndex + dir + 4) % 4;
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
      () => {
        this.togglePause();
        this.scene.restart();
      },
      () => {
        this.togglePause();
        this.scene.stop(SCENE_KEYS.ui);
        this.scene.start(SCENE_KEYS.map);
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
  private showStageIntroBanner(): void {
    const bannerContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(2000).setScrollFactor(0);

    const bg = this.add.rectangle(0, 0, 220, 72, 0x091428, 0.95)
      .setStrokeStyle(1, 0xf59e0b, 1);
    const inner = this.add.rectangle(0, 0, 214, 66, 0x000000, 0)
      .setStrokeStyle(1, 0x38bdf8, 0.6);
    bannerContainer.add([bg, inner]);

    const title = addPixelText(this, 0, -20, '* FASE 1-1 *', {
      scale: 1,
      color: 0xfde047,
      originX: 0.5,
      originY: 0.5,
      depth: 2001,
    });

    const stageName = addPixelText(this, 0, -2, 'VALE DA BRISA', {
      scale: 2,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
      depth: 2001,
    });

    const readyText = addPixelText(this, 0, 20, 'READY!', {
      scale: 1,
      color: 0x38bdf8,
      originX: 0.5,
      originY: 0.5,
      depth: 2001,
    });

    bannerContainer.add([title, stageName, readyText]);

    // Animação de entrada rápida e saída triunfante estilo 16-bit
    this.tweens.add({
      targets: bannerContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 200,
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: bannerContainer,
            y: -100,
            alpha: 0,
            duration: 350,
            ease: 'Back.easeIn',
            onComplete: () => bannerContainer.destroy(),
          });
        });
      },
    });
  }

  // --- PARALLAX E CENÁRIO VISUAL RETRÔ DE ALTA QUALIDADE ---
  private drawParallaxBackdrop(worldWidth: number): void {
    const sky = this.add.graphics().setDepth(-30).setScrollFactor(0);

    // Gradiente suave de céu em 4 faixas
    sky.fillStyle(0x194569, 1).fillRect(0, 0, GAME_WIDTH, 42);
    sky.fillStyle(0x276685, 1).fillRect(0, 42, GAME_WIDTH, 42);
    sky.fillStyle(0x3e8fa8, 1).fillRect(0, 84, GAME_WIDTH, 36);
    sky.fillStyle(0x6eb7cd, 1).fillRect(0, 120, GAME_WIDTH, 60);

    // Sol dourado suave com halo
    sky.fillStyle(0xfde047, 0.35).fillCircle(276, 28, 20);
    sky.fillStyle(0xfef08a, 0.75).fillCircle(276, 28, 14);
    sky.fillStyle(0xffffff, 1).fillCircle(276, 28, 9);

    // Camada 1: Nuvens flutuantes em pixel art (cloud-large e cloud-small)
    for (let x = 30; x < worldWidth + 300; x += 135) {
      const isBig = (Math.floor(x / 135) % 2 === 0);
      const key = isBig ? 'cloud-large' : 'cloud-small';
      const cloudY = isBig ? 24 : 36;
      this.add.image(x, cloudY, key).setDepth(-26).setScrollFactor(0.06);
    }

    // Camada 2: Cordilheira distante em bruma azulada (bg-mountain-far, scrollFactor: 0.12)
    for (let x = 0; x < worldWidth + 300; x += 96) {
      this.add.image(x + 48, 106, 'bg-mountain-far').setDepth(-24).setScrollFactor(0.12);
    }

    // Cascatas alpinas nos desfiladeiros distantes
    for (let x = 120; x < worldWidth + 300; x += 280) {
      this.add.image(x, 108, 'decor-waterfall').setDepth(-23).setScrollFactor(0.12);
    }

    // Camada 3: Colinas florestais com pinheiros (bg-hills-mid, scrollFactor: 0.28)
    for (let x = 0; x < worldWidth + 200; x += 64) {
      this.add.image(x + 32, 134, 'bg-hills-mid').setDepth(-18).setScrollFactor(0.28);
    }
  }

  private drawWorldDecor(): void {
    // 1. Placa inicial de trilha na primeira área segura
    this.add.image(32, 154 - 9, 'decor-signpost').setDepth(2);

    // 2. Névoa atmosférica nos grandes abismos e fossos para preencher os vazios
    const chasmMists = [
      { x: 720, y: 168 },
      { x: 1560, y: 172 },
      { x: 2500, y: 166 }, { x: 2550, y: 166 },
      { x: 3480, y: 168 }, { x: 3540, y: 168 },
      { x: 4320, y: 170 }, { x: 4400, y: 166 }, { x: 4480, y: 172 }, { x: 4560, y: 168 },
    ];
    chasmMists.forEach((m, idx) => {
      const mist = this.add.image(m.x, m.y, 'decor-mist').setDepth(1).setAlpha(0.65);
      this.tweens.add({
        targets: mist,
        x: m.x + (idx % 2 === 0 ? 12 : -12),
        y: m.y - 3,
        alpha: 0.35,
        duration: 2200 + idx * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // 3. Itera estritamente sobre os segmentos de solo existentes
    for (const seg of this.groundSegments) {
      const segWidth = seg.endX - seg.startX;
      if (segWidth < 32) continue;

      // Cipós / Heras penduradas nas bordas de penhascos (preenchendo vazios sob penhascos)
      if (seg.startX > 0) {
        this.add.image(seg.startX + 6, seg.surfaceY + 16, 'decor-vines').setDepth(1);
      }
      this.add.image(seg.endX - 6, seg.surfaceY + 16, 'decor-vines').setDepth(1);

      // Pedras arredondadas de entrada e saída do platô
      this.add.image(seg.startX + 12, seg.surfaceY - 5, 'decor-rock').setDepth(3);
      if (segWidth > 64) {
        this.add.image(seg.endX - 12, seg.surfaceY - 5, 'decor-rock').setDepth(3);
      }

      // Canteiros de flores silvestres embutidos na relva
      for (let fx = seg.startX + 28; fx < seg.endX - 24; fx += 44) {
        this.add.image(fx, seg.surfaceY - 5, 'decor-flowers').setDepth(2);
      }

      // Arbustos de frutas
      for (let bx = seg.startX + 48; bx < seg.endX - 40; bx += 88) {
        this.add.image(bx, seg.surfaceY - 6, 'decor-bush').setDepth(2);
      }

      // Cercas de madeira rústica em trechos mais largos
      for (let fcx = seg.startX + 72; fcx < seg.endX - 60; fcx += 160) {
        this.add.image(fcx, seg.surfaceY - 7, 'decor-fence').setDepth(2);
      }

      // Árvores frondosas exuberantes enraizadas com perfeição no solo
      for (let tx = seg.startX + 95; tx < seg.endX - 50; tx += 180) {
        this.add.image(tx, seg.surfaceY - 24, 'decor-tree-large').setDepth(1);
      }

      // Bandeirolas festivas em pixel art real
      if (segWidth >= 140) {
        const postX = seg.startX + 120;
        if (postX + 36 < seg.endX) {
          this.add.image(postX + 16, seg.surfaceY - 14, 'decor-bunting').setDepth(2);
        }
      }
    }
  }
}
