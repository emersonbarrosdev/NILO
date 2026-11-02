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
import { FallingPlatform } from '../entities/environment/FallingPlatform';
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
  private readonly fallingPlatforms: FallingPlatform[] = [];
  private readonly windLeaves: { g: Phaser.GameObjects.Graphics; x: number; y: number; speedX: number; speedY: number; wobble: number }[] = [];
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
    const worldWidth = 6000;
    const worldHeight = 200;

    this.solidSurfaces.length = 0;
    this.groundSegments.length = 0;
    this.enemies.length = 0;
    this.movingPlatforms.length = 0;
    this.fallingPlatforms.length = 0;
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
    this.createWindBreeze();

    // Colisões do Player com superfícies sólidas
    for (const surface of this.solidSurfaces) {
      this.physics.add.collider(this.player, surface);
    }

    // Colisões com plataformas móveis
    for (const mp of this.movingPlatforms) {
      this.physics.add.collider(this.player, mp);
    }

    // Colisões com plataformas que despencam ao pisar
    for (const fp of this.fallingPlatforms) {
      this.physics.add.collider(this.player, fp);
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
      this.windLeaves.forEach((l) => l.g.destroy());
      this.windLeaves.length = 0;
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
  private buildLevelTerrain(worldWidth: number): void {
    const GROUND_Y = 154;

    // === ATO 1: ABERTURA SEGURA, TUTORIAL DE PULO E PRIMEIRO VÃO LIVRE (X: 0 -> 920) ===
    // Segmento 1 de solo plano: 0 a 520 (Área segura para treinar corrida e estilingue)
    this.addGroundSegment(0, 520, GROUND_Y);

    // Selos em arco suave ensinando a cadência do pulo único
    [120, 140, 160].forEach((x, i) => {
      this.spawnStamp(x, 134 - (i === 1 ? 14 : 7));
    });

    // Primeira plataforma de madeira rústica com estacas
    this.addWoodPlatform(240, 124, 48, true, GROUND_Y);
    this.spawnStamp(240, 108);

    [340, 380, 420, 460].forEach((x) => this.spawnStamp(x, 136));

    // VÃO LIVRE #1 (X: 520 -> 566, vão de 46px - SEM NENHUMA PLATAFORMA! Pulo puro e justo com alcance de 75px)
    // 3 Moedas de Ouro em parábola perfeita mostrando a trajetória do salto seguro
    this.spawnStamp(530, 136);
    this.spawnStamp(543, 122);
    this.spawnStamp(556, 136);

    // Segmento 2 de solo: 566 a 920 com colina suave
    this.addGroundSegment(566, 920, GROUND_Y);
    this.addGroundSegment(660, 820, 142); // Elevação sutil do morro
    this.spawnStamp(700, 124);
    this.spawnStamp(740, 124);
    this.spawnStamp(780, 124);

    // === ATO 2: PRIMEIRO INIMIGO, ROTAS ALTERNATIVAS, VÃO LIVRE #2 E QUEDA DE PLATAFORMA (X: 920 -> 2040) ===
    // VÃO LIVRE #2 (X: 920 -> 968, vão de 48px - SEM PLATAFORMA! Salto direto no pé)
    this.spawnStamp(932, 136);
    this.spawnStamp(944, 122);
    this.spawnStamp(956, 136);

    // Segmento 3 de solo: 968 a 1500
    this.addGroundSegment(968, 1500, GROUND_Y);

    // Cascuva 1 patrulha no solo seguro sem jamais cair em buracos
    const beetle1 = new BeetleEnemy(this, 1140, GROUND_Y - 8, 1020, 1460);
    this.enemies.push(beetle1);
    this.setupEnemyCollisions(beetle1);

    // ROTA ALTA: Passarelas de madeira nas copas das árvores
    this.addWoodPlatform(1180, 124, 48, true, GROUND_Y);
    this.spawnStamp(1180, 108);

    this.addWoodPlatform(1260, 98, 48, true, GROUND_Y);
    this.spawnStamp(1260, 82);

    // Recompensa da copa alta: Coração Lapidado (+1 Vida Cumulativa!)
    this.addWoodPlatform(1350, 74, 56, false);
    this.spawnHeart(1350, 58);

    this.addWoodPlatform(1450, 74, 56, false);
    this.spawnStamp(1450, 58);

    // FOSSO DE ESPINHOS COM PLATAFORMA QUE DESPENCA (X: 1500 -> 1600, vão de 100px)
    this.spawnSpike(1530, 172);
    this.spawnSpike(1550, 172);
    this.spawnSpike(1570, 172);

    // PLATAFORMA QUE DESPENCA #1: Ao saltar nela, treme com serragem por 320ms e despenca!
    this.addFallingPlatform(1550, 100);
    this.spawnStamp(1550, 84);

    this.addWoodPlatform(1640, 124, 48, true, GROUND_Y);
    this.spawnStamp(1640, 108);

    // Segmento 4 de solo após os espinhos: 1600 a 2040
    this.addGroundSegment(1600, 2040, GROUND_Y);

    const beetle2 = new BeetleEnemy(this, 1720, GROUND_Y - 8, 1630, 1960);
    this.enemies.push(beetle2);
    this.setupEnemyCollisions(beetle2);

    this.spawnStamp(1750, 136);
    this.spawnStamp(1780, 136);
    this.spawnStamp(1810, 136);

    // CHECKPOINT 1 (Totem do Vale 1)
    this.spawnCheckpoint(1940, GROUND_Y - 14, 'cp-1');

    // === ATO 3: VERTICALIDADE, O GRANDE DESFILADEIRO E JANGADA MÓVEL (X: 2040 -> 3080) ===
    // Segmento 5 de solo: 2040 a 2420
    this.addGroundSegment(2040, 2420, GROUND_Y);

    const beetle3 = new BeetleEnemy(this, 2100, GROUND_Y - 8, 2050, 2380);
    this.enemies.push(beetle3);
    this.setupEnemyCollisions(beetle3);

    this.addWoodPlatform(2120, 124, 48, true, GROUND_Y);
    this.spawnStamp(2120, 108);

    this.addWoodPlatform(2200, 96, 48, false);
    this.spawnStamp(2200, 80);

    // Inimigo Aéreo 1: Zumbão patrulhando a rota alta
    const flyer1 = new DragonflyEnemy(this, 2260, 68, 55);
    this.enemies.push(flyer1);
    this.setupEnemyCollisions(flyer1);

    // Mirante da copa: Cartão-Postal #1
    this.addWoodPlatform(2290, 72, 56, false);
    this.spawnPostcard(2290, 56, '1-1-1');

    // PLATAFORMA QUE DESPENCA #2: Atalho aéreo emocionante
    this.addFallingPlatform(2360, 88);
    this.spawnStamp(2360, 72);

    // O GRANDE FOSSO DO RIACHO (X: 2420 a 2620, vão imenso de 200px - SÓ PASSA COM A PLATAFORMA MÓVEL!)
    // Jangada de pedra que navega horizontalmente entre X: 2470 e 2570
    this.addMovingPlatform(2470, 132, 100, 0, 34);
    this.spawnStamp(2520, 116);

    // Segmento 6 de solo: 2620 a 3080
    this.addGroundSegment(2620, 3080, GROUND_Y);

    const flyer2 = new DragonflyEnemy(this, 2760, 92, 60);
    this.enemies.push(flyer2);
    this.setupEnemyCollisions(flyer2);

    this.addGroundSegment(2820, 2980, 142);
    const beetle4 = new BeetleEnemy(this, 2890, 134, 2830, 2970);
    this.enemies.push(beetle4);
    this.setupEnemyCollisions(beetle4);

    this.spawnStamp(2860, 126);
    this.spawnStamp(2890, 126);
    this.spawnStamp(2920, 126);

    // === ATO 4: SINO DE OURO BÔNUS, TRAVESSIA CONTÍNUA E CHECKPOINT 2 (X: 3080 -> 4050) ===
    // Segmento 7 de solo: 3080 a 3400
    this.addGroundSegment(3080, 3400, GROUND_Y);

    this.addWoodPlatform(3140, 126, 40, true, GROUND_Y);
    this.spawnStamp(3140, 110);

    // SINO DE OURO (ALVO DE BÔNUS E SEGREDO 100% OPCIONAL EM X: 3260, Y: 94):
    // Nunca bloqueia a passagem! Disparar nele toca o sino, libera chuva de moedas e 1-UP!
    const secretHighPlatform = this.addWoodPlatform(3510, 56, 48, false, GROUND_Y, true);

    // Armação rústica do Campanário do Sino com degraus acessíveis
    for (let py = GROUND_Y - 16; py >= 78; py -= 32) {
      this.add.image(3248, py, 'platform-stilt').setDepth(2);
    }
    this.add.image(3256, 76, 'tile-wood-plank').setDepth(3);
    this.add.image(3248, 82, 'platform-bracket').setDepth(2);
    const chainGfx = this.add.graphics().setDepth(3);
    chainGfx.fillStyle(0x475569, 1).fillRect(3260 - 1, 78, 2, 8);

    // Degraus rústicos de madeira para subir no campanário (fácil alcance a pé)
    this.addWoodPlatform(3215, 122, 34, true, GROUND_Y);
    this.addWoodPlatform(3280, 96, 34, false);

    // Plaquinha informativa na base do campanário
    this.add.image(3260, 138, 'decor-signpost').setDepth(2);
    const signText = addPixelText(this, 3260, 120, 'ATIRE AQUI!', {
      scale: 1,
      color: 0xfef08a,
      originX: 0.5,
      originY: 0.5,
      depth: 4,
    });
    this.tweens.add({
      targets: signText,
      y: 118,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const puzzleTarget = new PuzzleTarget(this, 3260, 94, () => {
      GameState.get().recordDefeatEnemy(200);
      secretHighPlatform.reveal();

      // CHUVA DE MOEDAS: Moedas jorram do sino e caem com salto elástico no chão para Nilo pegar facilmente!
      const coinPositions = [3205, 3230, 3260, 3290, 3315];
      coinPositions.forEach((cx, i) => {
        const stamp = this.spawnStamp(3260, 90);
        this.tweens.add({
          targets: stamp,
          x: cx,
          y: 60 - (i % 2 === 0 ? 8 : 0),
          duration: 180 + i * 40,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            if (!stamp.active) return;
            this.tweens.add({
              targets: stamp,
              y: GROUND_Y - 14,
              duration: 380,
              ease: 'Bounce.easeOut',
            });
          },
        });
      });

      // O Boné 1-UP surge flutuando direto do sino para a altura acessível do Nilo!
      const lifeItem = this.spawnLife(3260, 86);
      this.tweens.add({
        targets: lifeItem,
        y: 114,
        duration: 500,
        ease: 'Cubic.easeOut',
      });
      this.tweens.add({
        targets: lifeItem,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 250,
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

    // ROTA PRINCIPAL DO DESFILADEIRO (X: 3400 a 3600): Fluida e 100% contínua!
    // 1. Cais de madeira
    this.addWoodPlatform(3430, 126, 44, true, GROUND_Y);
    this.spawnStamp(3430, 110);

    // 2. PLATAFORMA QUE DESPENCA #3: Ponte instável no meio do desfiladeiro
    this.addFallingPlatform(3500, 120);
    this.spawnStamp(3500, 104);

    // 3. Posto de desembarque firme
    this.addWoodPlatform(3570, 126, 44, true, GROUND_Y);
    this.spawnStamp(3570, 110);

    // Degrau de subida para o Mirante do Cartão-Postal #2 (alcance perfeito a pé!)
    this.addWoodPlatform(3580, 116, 38, true, GROUND_Y);

    // Mirante com Cartão-Postal #2
    this.addWoodPlatform(3620, 78, 48, false);
    this.spawnPostcard(3620, 62, '1-1-2');

    // Segmento 8 de solo: 3600 a 4050
    this.addGroundSegment(3600, 4050, GROUND_Y);

    const hopper1 = new HopperEnemy(this, 3750, GROUND_Y - 8, this.player, 3630, 3950);
    this.enemies.push(hopper1);
    this.setupEnemyCollisions(hopper1);

    this.spawnStamp(3820, 136);
    this.spawnStamp(3850, 136);
    this.spawnStamp(3880, 136);

    // CHECKPOINT 2 (Totem do Vale 2)
    this.spawnCheckpoint(3980, GROUND_Y - 14, 'cp-2');

    // === ATO 5: FLOR TRAMPOLIM, PLATAFORMAS MÓVEIS TANDEM E VÃO LIVRE #3 (X: 4050 -> 5050) ===
    // Segmento 9 de solo: 4050 a 4300
    this.addGroundSegment(4050, 4300, GROUND_Y);

    // Flor Trampolim que impulsiona para a copa
    this.spawnBounceFlower(4210, GROUND_Y - 6, -400);

    // ROTA ALTA DA COPA
    this.addWoodPlatform(4265, 82, 48, false);
    this.spawnStamp(4265, 66);
    this.addWoodPlatform(4360, 68, 48, false);
    this.spawnStamp(4360, 52);
    this.addWoodPlatform(4460, 68, 48, false);
    this.spawnLife(4460, 52); // Boné 1-UP secreto no alto

    // DESFILADEIRO DAS BRUMAS (X: 4300 a 4540, vão de 240px com plataformas móveis combinadas!)
    // 1. Cais inicial
    this.addWoodPlatform(4310, 130, 36, true, GROUND_Y);

    // 2. Jangada Móvel Horizontal (oscila suavemente entre 4350 e 4410, Y: 122)
    this.addMovingPlatform(4350, 122, 60, 0, 32);

    // 3. Ilhota de pedra sólida no centro
    this.addStonePlatform(4435, 122, 38);
    this.spawnStamp(4435, 104);

    // 4. Elevador Móvel Vertical (oscila entre Y: 85 e Y: 125 em X: 4495)
    this.addMovingPlatform(4495, 85, 0, 40, 30);

    // Segmento 10 de solo: 4540 a 5050
    this.addGroundSegment(4540, 5050, GROUND_Y);

    // VÃO LIVRE #3 (X: 4720 -> 4766, vão de 46px - SEM PLATAFORMA! Salto direto no pé)
    this.spawnStamp(4732, 136);
    this.spawnStamp(4743, 122);
    this.spawnStamp(4754, 136);

    const hopper2 = new HopperEnemy(this, 4820, GROUND_Y - 8, this.player, 4770, 4950);
    this.enemies.push(hopper2);
    this.setupEnemyCollisions(hopper2);

    // CHECKPOINT 3 (Totem do Vale 3 - Entrada do Cume)
    this.spawnCheckpoint(4980, GROUND_Y - 14, 'cp-3');

    // === ATO 6: O DESFILADEIRO DO VENTO E PLATÔ DO CUME (X: 5050 -> 6000) ===
    // Segmento 11 de solo: 5050 a 5260
    this.addGroundSegment(5050, 5260, GROUND_Y);

    const beetle5 = new BeetleEnemy(this, 5140, GROUND_Y - 8, 5060, 5240);
    this.enemies.push(beetle5);
    this.setupEnemyCollisions(beetle5);

    this.spawnStamp(5100, 136);
    this.spawnStamp(5140, 136);
    this.spawnStamp(5180, 136);

    // A ESCADARIA DE PLATAFORMAS QUE DESPENCAM (X: 5260 a 5520, vão de 260px com 3 degraus sucessivos!)
    // O jogador precisa dar saltos rápidos e confiantes, pois cada degrau treme e cai 320ms após ser pisado!
    this.addFallingPlatform(5310, 130);
    this.spawnStamp(5310, 114);

    this.addFallingPlatform(5380, 112);
    this.spawnStamp(5380, 96);

    this.addFallingPlatform(5450, 94);
    this.spawnStamp(5450, 78);

    // Segmento 12: Cume da Montanha (5520 a 5740, Y: 142)
    this.addGroundSegment(5520, 5740, 142);

    const flyer3 = new DragonflyEnemy(this, 5600, 80, 55);
    this.enemies.push(flyer3);
    this.setupEnemyCollisions(flyer3);

    // Degrau de subida para o Mirante do Cume (alcance perfeito a pé!)
    this.addWoodPlatform(5615, 106, 38, true, 142);

    // Mirante mais alto da cordilheira com o Cartão-Postal #3
    this.addWoodPlatform(5660, 70, 48, false);
    this.spawnPostcard(5660, 54, '1-1-3');

    this.addWoodPlatform(5710, 114, 44, true, 142);
    this.spawnStamp(5710, 98);

    // DESFILADEIRO FINAL DO CUME (X: 5740 a 5880, vão de 140px - Jangada do Cume)
    this.addMovingPlatform(5770, 118, 70, 0, 32);
    this.spawnStamp(5805, 102);

    // PLATÔ FINAL DA VITÓRIA (5880 a 6000, Y: 154): Chegada épica e festiva
    this.addGroundSegment(5880, worldWidth, GROUND_Y);

    // Arco de 5 Moedas Douradas festivas
    this.spawnStamp(5900, 134);
    this.spawnStamp(5920, 120);
    this.spawnStamp(5940, 110);
    this.spawnStamp(5960, 120);
    this.spawnStamp(5980, 134);

    // PORTAL DE VITÓRIA (Goal Gate) no cume da montanha!
    this.spawnGoalGate(5950, GROUND_Y - 18);

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

  private addFallingPlatform(x: number, y: number): FallingPlatform {
    const fp = new FallingPlatform(this, x, y);
    this.fallingPlatforms.push(fp);
    if (this.player) {
      this.physics.add.collider(this.player, fp);
    }
    return fp;
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
      { x: 543, y: 168 },
      { x: 944, y: 168 },
      { x: 1550, y: 172 },
      { x: 2520, y: 166 },
      { x: 3500, y: 168 },
      { x: 4350, y: 170 }, { x: 4440, y: 166 }, { x: 4500, y: 172 },
      { x: 4743, y: 168 },
      { x: 5380, y: 168 },
      { x: 5810, y: 168 },
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

  private createWindBreeze(): void {
    const colors = [0x74c69d, 0x52b788, 0xfde047, 0xfbbf24];
    for (let i = 0; i < 14; i++) {
      const g = this.add.graphics().setDepth(14);
      g.fillStyle(Phaser.Utils.Array.GetRandom(colors), 0.85);
      g.fillRect(-2, -1, 4, 2);

      const leaf = {
        g,
        x: Phaser.Math.Between(0, 6000),
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
