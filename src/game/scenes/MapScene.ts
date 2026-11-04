import { bindCamera } from '../systems/PresentationSystem';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { GamepadSystem } from '../systems/GamepadSystem';

export class MapScene extends Phaser.Scene {
  private miniNilo?: Phaser.GameObjects.Container;
  private hasTransitioned = false;

  constructor() { super(SCENE_KEYS.map); }

  create(): void {
    bindCamera(this);
    AudioSystem.get().startBgm('title');
    this.hasTransitioned = false;
    const save = SaveSystem.get().load();

    this.drawCleanRetroMap();
    this.drawTrailNodes(save.unlockedStages);
    this.createMiniNilo(60, 72);
    this.drawCompactInfoCard(save);

    // Prompt na base com suporte a Mouse e Gamepad
    const prompt = addPixelText(this, GAME_WIDTH / 2, 168, 'MOUSE / ENTER / [X]: ENTRAR   ESC / [O]: MENU', {
      scale: 1,
      color: 0xfde047,
      originX: 0.5,
      originY: 0.5,
      depth: 100,
    });

    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 550, yoyo: true, repeat: -1 });

    const promptHit = this.add.rectangle(GAME_WIDTH / 2, 168, 280, 16, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
      .setDepth(101);
    promptHit.on('pointerdown', () => this.startStage());

    this.input.keyboard?.once('keydown-ENTER', () => this.startStage());
    this.input.keyboard?.once('keydown-SPACE', () => this.startStage());
    this.input.keyboard?.once('keydown-ESC', () => this.backToMenu());

    const cleanup = () => {
      this.input.keyboard?.removeAllListeners();
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  update(time: number): void {
    if (this.hasTransitioned) return;
    const pad = GamepadSystem.get().updateMenuNavigation(time);

    if (pad.confirmJustPressed) {
      this.startStage();
    } else if (pad.cancelJustPressed) {
      this.backToMenu();
    }
  }

  private startStage(): void {
    if (this.hasTransitioned) return;
    this.hasTransitioned = true;
    AudioSystem.get().playMenuSelect();
    this.scene.start(SCENE_KEYS.game, { stageId: '1-1' });
  }

  private backToMenu(): void {
    if (this.hasTransitioned) return;
    this.hasTransitioned = true;
    AudioSystem.get().playMenuNavigate();
    this.scene.start(SCENE_KEYS.title);
  }

  private drawCleanRetroMap(): void {
    const g = this.add.graphics().setDepth(-20);

    // Fundo oceano suave
    g.fillStyle(0x163456, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ondas suaves no oceano
    g.fillStyle(0x1d4470, 0.6);
    for (let y = 14; y < GAME_HEIGHT; y += 18) {
      for (let x = 6; x < GAME_WIDTH; x += 36) {
        g.fillRect(x + ((y * 3) % 20), y, 14, 2);
      }
    }

    // Margens de areia do arquipélago
    g.fillStyle(0xd4a359, 1).fillRect(18, 22, 284, 88);
    // Interior de vegetação viçosa
    g.fillStyle(0x2d7a46, 1).fillRect(22, 26, 276, 80);
    g.fillStyle(0x389154, 1).fillRect(24, 28, 272, 76);

    // Pequenas árvores decorativas no mapa
    const trees = [
      { x: 38, y: 44 }, { x: 88, y: 40 }, { x: 135, y: 46 },
      { x: 175, y: 38 }, { x: 225, y: 44 }, { x: 278, y: 40 },
    ];
    trees.forEach(t => {
      g.fillStyle(0x45230e, 1).fillRect(t.x, t.y, 2, 4);
      g.fillStyle(0x1e6628, 1).fillCircle(t.x + 1, t.y - 3, 5);
      g.fillStyle(0x56d669, 1).fillCircle(t.x, t.y - 4, 3);
    });

    // Rio suave cortando a ilha
    g.fillStyle(0x276a9c, 1).fillRect(145, 26, 18, 80);
    g.fillStyle(0x38bdf8, 0.4).fillRect(149, 26, 4, 80);

    // Ponte de madeira sobre o rio
    g.fillStyle(0x45230e, 1).fillRect(141, 67, 26, 10);
    g.fillStyle(0x783d19, 1).fillRect(142, 68, 24, 8);
    g.fillStyle(0xa15322, 1).fillRect(143, 69, 22, 2);

    // Fortaleza do Guardião (sprite pixel art real)
    this.add.image(260, 52, 'map-fortress').setDepth(3);

    // Faixa de cabeçalho estilizada
    this.add.rectangle(GAME_WIDTH / 2, 13, 264, 16, 0x091424, 0.95)
      .setStrokeStyle(1, 0x38bdf8, 1)
      .setDepth(5);

    addPixelText(this, GAME_WIDTH / 2, 13, 'ROTA DA AVENTURA - MUNDO 1', {
      scale: 1,
      color: 0xfde047,
      originX: 0.5,
      originY: 0.5,
      depth: 6,
    });
  }

  private drawTrailNodes(unlockedStages: string[]): void {
    const g = this.add.graphics().setDepth(-5);
    const nodes = [
      { x: 60, y: 72, name: '1-1', label: '1-1 VALE' },
      { x: 120, y: 72, name: '1-2', label: '1-2 BOSQUE' },
      { x: 190, y: 72, name: '1-3', label: '1-3 CASCATA' },
      { x: 260, y: 72, name: '1-4', label: '1-4 FORTE' },
    ];

    // Trilha de pedras / passarela
    g.lineStyle(3, 0x783d19, 1);
    g.lineBetween(nodes[0].x, nodes[0].y, nodes[3].x, nodes[3].y);
    g.lineStyle(1, 0xfde047, 0.8);
    g.lineBetween(nodes[0].x, nodes[0].y, nodes[3].x, nodes[3].y);

    nodes.forEach((node, idx) => {
      const isUnlocked = unlockedStages.includes(node.name);
      const isCurrent = idx === 0;

      // Aura pulsante no nó selecionado
      if (isCurrent) {
        const aura = this.add.circle(node.x, node.y, 11, 0xf59e0b, 0.4).setDepth(-6);
        this.tweens.add({
          targets: aura,
          scaleX: 1.35,
          scaleY: 1.35,
          alpha: 0.1,
          duration: 650,
          yoyo: true,
          repeat: -1,
        });
      }

      g.fillStyle(0x0f172a, 1).fillCircle(node.x, node.y, 8);
      g.fillStyle(isCurrent ? 0xf59e0b : isUnlocked ? 0x22c55e : 0x475569, 1).fillCircle(node.x, node.y, 6);
      g.fillStyle(isCurrent ? 0xfef08a : isUnlocked ? 0x86efac : 0x94a3b8, 1).fillCircle(node.x, node.y, 3);

      addPixelText(this, node.x, node.y + 14, node.label, {
        scale: 1,
        color: isCurrent ? 0xfef08a : isUnlocked ? 0xe2e8f0 : 0x64748b,
        originX: 0.5,
        originY: 0.5,
        depth: 2,
      });

      // Suporte a clique direto com o mouse no nó da fase
      if (isUnlocked) {
        const hit = this.add.circle(node.x, node.y, 12, 0x000000, 0.001)
          .setInteractive({ useHandCursor: true })
          .setDepth(15);
        hit.on('pointerdown', () => this.startStage());
      }
    });
  }

  private createMiniNilo(x: number, y: number): void {
    this.miniNilo = this.add.container(x, y - 18).setDepth(20);

    const sprite = this.add.sprite(0, 0, 'player-sheet', 0).setScale(0.85);
    this.miniNilo.add(sprite);

    this.tweens.add({
      targets: this.miniNilo,
      y: y - 22,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawCompactInfoCard(save: ReturnType<SaveSystem['load']>): void {
    // Card compacto com margens 100% seguras (264px em tela de 320px)
    const card = this.add.container(GAME_WIDTH / 2, 134).setDepth(10);

    const bg = this.add.rectangle(0, 0, 264, 40, 0x091424, 0.95)
      .setStrokeStyle(1, 0x38bdf8, 1)
      .setInteractive({ useHandCursor: true });
    
    bg.on('pointerdown', () => this.startStage());
    card.add(bg);

    const badge = this.add.rectangle(-106, 0, 28, 26, 0x1d4ed8, 1)
      .setStrokeStyle(1, 0xfde047, 1);
    card.add(badge);

    const badgeText = addPixelText(this, GAME_WIDTH / 2 - 106, 134, '1-1', {
      scale: 1,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
      depth: 12,
    });
    this.add.existing(badgeText);

    // Linha 1: Nome da fase e status
    const title = addPixelText(this, GAME_WIDTH / 2 - 82, 124, 'VALE DA BRISA  [ABERTA]', {
      scale: 1,
      color: 0x67e8f9,
      originX: 0,
      originY: 0.5,
      depth: 12,
    });
    this.add.existing(title);

    // Linha 2: Informações sem overflow
    const postcardsFound = save.postcards.filter((p) => p.startsWith('1-1')).length;
    const info = addPixelText(
      this,
      GAME_WIDTH / 2 - 82,
      138,
      `POSTAIS: ${postcardsFound}/3    VIDAS: ${save.lives}`,
      {
        scale: 1,
        color: 0xfef08a,
        originX: 0,
        originY: 0.5,
        depth: 12,
      },
    );
    this.add.existing(info);
  }
}
