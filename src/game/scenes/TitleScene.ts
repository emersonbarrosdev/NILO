import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { GameState } from '../systems/GameState';
import { GamepadSystem } from '../systems/GamepadSystem';
import { AudioSettingsModal } from '../ui/AudioSettingsModal';

interface MenuItem {
  text: string;
  action: () => void;
  enabled: boolean;
}

export class TitleScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: MenuItem[] = [];
  private menuTexts: Phaser.GameObjects.GameObject[] = [];
  private menuHitZones: Phaser.GameObjects.Rectangle[] = [];
  private menuFrame?: Phaser.GameObjects.Rectangle;
  private cursor?: Phaser.GameObjects.Graphics;
  private controlsModal?: Phaser.GameObjects.Container;
  private audioModal?: AudioSettingsModal;
  private windLeaves: { g: Phaser.GameObjects.Graphics; x: number; y: number; speedX: number; speedY: number; rotSpeed: number }[] = [];

  constructor() { super(SCENE_KEYS.title); }

  create(): void {
    const saveSystem = SaveSystem.get();
    const hasSave = saveSystem.hasSave();

    // Cenário atmosférico do Mirante do Vale
    this.drawAtmosphericValley();
    this.createWindLeaves();
    this.drawHeroOnCliff();
    this.drawOriginalLogo();
    this.setupMenu(hasSave);

    // Controles de navegação por teclado
    const onUp = () => this.navigateMenu(-1);
    const onDown = () => this.navigateMenu(1);
    const onConfirm = () => this.selectMenuItem();
    const onEsc = () => this.closeControlsModal();

    this.input.keyboard?.on('keydown-UP', onUp);
    this.input.keyboard?.on('keydown-W', onUp);
    this.input.keyboard?.on('keydown-DOWN', onDown);
    this.input.keyboard?.on('keydown-S', onDown);
    this.input.keyboard?.on('keydown-ENTER', onConfirm);
    this.input.keyboard?.on('keydown-SPACE', onConfirm);
    this.input.keyboard?.on('keydown-ESC', onEsc);

    const cleanup = () => {
      this.input.keyboard?.off('keydown-UP', onUp);
      this.input.keyboard?.off('keydown-W', onUp);
      this.input.keyboard?.off('keydown-DOWN', onDown);
      this.input.keyboard?.off('keydown-S', onDown);
      this.input.keyboard?.off('keydown-ENTER', onConfirm);
      this.input.keyboard?.off('keydown-SPACE', onConfirm);
      this.input.keyboard?.off('keydown-ESC', onEsc);
    };

    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);

    // Rodapé de compatibilidade de periféricos
    addPixelText(this, GAME_WIDTH / 2, 172, 'SUPORTA: TECLADO  •  MOUSE  •  CONTROLE PS5', {
      scale: 1,
      color: 0x5a7a9c,
      originX: 0.5,
      originY: 0.5,
      depth: 25,
    });

    AudioSystem.get().startBgm('title');
  }

  update(time: number): void {
    // Efeito suave de folhas e brisa cruzando a tela
    for (const leaf of this.windLeaves) {
      leaf.x += leaf.speedX;
      leaf.y += leaf.speedY;
      leaf.g.rotation += leaf.rotSpeed;

      if (leaf.x > GAME_WIDTH + 10 || leaf.y > GAME_HEIGHT) {
        leaf.x = -15;
        leaf.y = Phaser.Math.Between(20, 140);
      }
      leaf.g.setPosition(leaf.x, leaf.y);
    }

    // Suporte a controle de PS5 / Gamepad Universal
    if (this.audioModal?.isOpen) {
      this.audioModal.updateGamepad(time);
      return;
    }

    const pad = GamepadSystem.get().updateMenuNavigation(time);
    if (this.controlsModal) {
      if (pad.confirmJustPressed || pad.cancelJustPressed) {
        this.closeControlsModal();
      }
      return;
    }

    if (pad.upJustPressed) this.navigateMenu(-1);
    if (pad.downJustPressed) this.navigateMenu(1);
    if (pad.confirmJustPressed) this.selectMenuItem();
  }

  // --- CENÁRIO ATMOSFÉRICO ORIGINAL DO VALE (Mirante ao entardecer) ---
  private drawAtmosphericValley(): void {
    const g = this.add.graphics().setDepth(-20);

    // 1. Céu crepuscular elegante em 5 faixas (do azul meia-noite ao dourado do horizonte)
    g.fillStyle(0x131a38, 1).fillRect(0, 0, GAME_WIDTH, 38);
    g.fillStyle(0x1f2e5a, 1).fillRect(0, 38, GAME_WIDTH, 34);
    g.fillStyle(0x324f78, 1).fillRect(0, 72, GAME_WIDTH, 32);
    g.fillStyle(0x56758f, 1).fillRect(0, 104, GAME_WIDTH, 26);
    g.fillStyle(0x8faab8, 1).fillRect(0, 130, GAME_WIDTH, 50);

    // Estrelas cintilantes discretas no céu alto
    g.fillStyle(0xffffff, 0.85);
    const starCoords = [[24, 12], [85, 20], [140, 8], [210, 16], [290, 10], [180, 24]];
    starCoords.forEach(([sx, sy]) => {
      g.fillRect(sx, sy, 1, 1);
      g.fillRect(sx - 1, sy, 3, 1);
      g.fillRect(sx, sy - 1, 1, 3);
    });

    // Lua suave ou sol crepuscular distante
    g.fillStyle(0xfde047, 0.4).fillCircle(250, 48, 18);
    g.fillStyle(0xfef08a, 0.8).fillCircle(250, 48, 12);
    g.fillStyle(0xffffff, 1).fillCircle(250, 48, 8);

    // Nuvens estilizadas em faixas horizontais elegantes
    g.fillStyle(0xdbeafe, 0.5);
    g.fillRect(15, 42, 60, 4);
    g.fillRect(25, 38, 40, 4);
    g.fillRect(170, 56, 75, 4);
    g.fillRect(190, 52, 45, 4);

    // 2. Silhueta de montanhas distantes com gradiente atmosférico
    g.fillStyle(0x2d3a54, 1);
    this.drawMountainPeak(g, 100, 140, 180, 58);
    this.drawMountainPeak(g, 180, 140, 160, 68);
    this.drawMountainPeak(g, 250, 140, 140, 50);

    // 3. Colinas verdes médias e vale ao fundo
    g.fillStyle(0x1b4332, 1);
    this.drawRoundedHill(g, 90, 145, 110, 42);
    this.drawRoundedHill(g, 180, 145, 120, 48);
    this.drawRoundedHill(g, 260, 145, 90, 38);

    // 4. Falésia / Colina proeminente em primeiro plano à esquerda (onde Nilo observa)
    g.fillStyle(0x1c2b22, 1);
    g.fillRect(0, 118, 92, 62);
    g.fillCircle(46, 122, 46);
    // Borda superior de grama escura
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(0, 114, 90, 6);
    g.fillRect(0, 112, 78, 4);

    // Árvore solitária na falésia balançando com o vento
    this.drawCliffPineTree(g, 22, 114);

    // Chão inferior conectando o rodapé
    g.fillStyle(0x17231c, 1).fillRect(0, 162, GAME_WIDTH, 18);
    g.fillStyle(0x2d6a4f, 1).fillRect(0, 160, GAME_WIDTH, 3);
  }

  private drawMountainPeak(g: Phaser.GameObjects.Graphics, x: number, base: number, width: number, height: number): void {
    g.beginPath();
    g.moveTo(x - width / 2, base);
    g.lineTo(x, base - height);
    g.lineTo(x + width / 2, base);
    g.closePath();
    g.fillPath();

    // Cume nevado sutil
    g.fillStyle(0xcfdbe6, 0.7);
    g.beginPath();
    g.moveTo(x - width * 0.14, base - height * 0.72);
    g.lineTo(x, base - height);
    g.lineTo(x + width * 0.14, base - height * 0.72);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x2d3a54, 1);
  }

  private drawRoundedHill(g: Phaser.GameObjects.Graphics, x: number, base: number, width: number, height: number): void {
    g.beginPath();
    g.moveTo(x - width / 2, base);
    g.lineTo(x - width * 0.35, base - height * 0.75);
    g.lineTo(x, base - height);
    g.lineTo(x + width * 0.35, base - height * 0.75);
    g.lineTo(x + width / 2, base);
    g.closePath();
    g.fillPath();
  }

  private drawCliffPineTree(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    // Tronco
    g.fillStyle(0x402513, 1).fillRect(x, y - 42, 5, 42);
    // Galhos e copa em camadas orgânicas
    const layers = [
      { yOff: 24, w: 26, h: 10 },
      { yOff: 34, w: 22, h: 9 },
      { yOff: 44, w: 16, h: 8 },
      { yOff: 52, w: 10, h: 7 },
    ];
    layers.forEach((l, idx) => {
      g.fillStyle(idx % 2 === 0 ? 0x1b4332 : 0x2d6a4f, 1);
      g.fillRect(x + 2 - l.w / 2, y - l.yOff, l.w, l.h);
    });
  }

  // --- NILO OBSERVANDO O HORIZONTE NA FALÉSIA ---
  private drawHeroOnCliff(): void {
    // Usa o sprite autêntico do Nilo da spritesheet oficial
    const hero = this.add.sprite(58, 102, 'player-sheet', 0).setDepth(15);
    hero.setScale(1);
    hero.setFlipX(false); // Olhando para a direita em direção ao vale

    // Sutil animação de respiração
    this.tweens.add({
      targets: hero,
      y: 101,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // --- BRISA COM FOLHAS CINTILANTES ---
  private createWindLeaves(): void {
    this.windLeaves = [];
    const colors = [0x52b788, 0x74c69d, 0xfde047, 0xfbbf24];

    for (let i = 0; i < 8; i++) {
      const g = this.add.graphics().setDepth(12);
      g.fillStyle(Phaser.Utils.Array.GetRandom(colors), 0.85);
      g.fillRect(-2, -1, 4, 2);

      const leaf = {
        g,
        x: Phaser.Math.Between(0, GAME_WIDTH),
        y: Phaser.Math.Between(30, 140),
        speedX: Phaser.Math.FloatBetween(0.8, 1.6),
        speedY: Phaser.Math.FloatBetween(0.1, 0.4),
        rotSpeed: Phaser.Math.FloatBetween(0.02, 0.06),
      };
      g.setPosition(leaf.x, leaf.y);
      this.windLeaves.push(leaf);
    }
  }

  // --- LOGO ORIGINAL, LIMPO E IMPACTANTE "NILO" ---
  private drawOriginalLogo(): void {
    const logoContainer = this.add.container(192, 40).setDepth(20);

    const shadow = this.add.graphics();
    const fill = this.add.graphics();

    // Fonte estilizada original 7x9 em pixel art puro
    const LOGO_LETTERS: Record<string, string[]> = {
      N: [
        '1100011',
        '1110011',
        '1111011',
        '1101111',
        '1100111',
        '1100011',
        '1100011',
        '1100011',
      ],
      I: [
        '1111111',
        '0011100',
        '0011100',
        '0011100',
        '0011100',
        '0011100',
        '0011100',
        '1111111',
      ],
      L: [
        '1100000',
        '1100000',
        '1100000',
        '1100000',
        '1100000',
        '1100000',
        '1111111',
        '1111111',
      ],
      O: [
        '0111110',
        '1100011',
        '1100011',
        '1100011',
        '1100011',
        '1100011',
        '1100011',
        '0111110',
      ],
    };

    const pixel = 3;
    const startX = -54;
    const startY = -14;
    const chars = ['N', 'I', 'L', 'O'];

    chars.forEach((char, idx) => {
      const glyph = LOGO_LETTERS[char];
      const cx = startX + idx * 28;

      // Sombra 3D suave azul marinho profundo
      shadow.fillStyle(0x0c1324, 1);
      glyph.forEach((row, r) => {
        [...row].forEach((c, col) => {
          if (c === '1') {
            shadow.fillRect(cx + col * pixel + 2, startY + r * pixel + 2, pixel, pixel);
          }
        });
      });

      // Preenchimento gradiente quente e elegante (amarelo limão -> âmbar -> vermelho coral)
      glyph.forEach((row, r) => {
        const colColor = r < 2 ? 0xfef08a : r < 5 ? 0xf59e0b : 0xe11d48;
        fill.fillStyle(colColor, 1);
        [...row].forEach((c, col) => {
          if (c === '1') {
            fill.fillRect(cx + col * pixel, startY + r * pixel, pixel, pixel);
          }
        });
      });

      // Destaque de luz branca
      fill.fillStyle(0xffffff, 0.9);
      if (char === 'N' || char === 'L' || char === 'I') {
        fill.fillRect(cx + pixel, startY + pixel, pixel, pixel);
      }
      if (char === 'O') {
        fill.fillRect(cx + 2 * pixel, startY + pixel, 2 * pixel, pixel);
      }
    });

    logoContainer.add([shadow, fill]);

    // Subtítulo elegante com linha decorativa
    const subBadge = this.add.rectangle(192, 58, 150, 14, 0x0c1a2e, 0.9)
      .setStrokeStyle(1, 0xf59e0b, 0.8)
      .setDepth(21);
    this.add.existing(subBadge);

    addPixelText(this, 192, 58, 'DE VOLTA PRA CASA', {
      scale: 1,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
      depth: 22,
    });
  }

  // --- MENU ELEGANTE DE OPÇÕES ---
  private setupMenu(hasSave: boolean): void {
    this.menuItems = [
      {
        text: 'NOVO JOGO',
        enabled: true,
        action: () => {
          GameState.get().initNewGame();
          AudioSystem.get().playMenuSelect();
          this.scene.start(SCENE_KEYS.game, { stageId: '1-1' });
        },
      },
      {
        text: hasSave ? 'CONTINUAR' : 'CONTINUAR (-)',
        enabled: hasSave,
        action: () => {
          if (!hasSave) return;
          GameState.get().continueGame();
          AudioSystem.get().playMenuSelect();
          this.scene.start(SCENE_KEYS.game, { stageId: GameState.get().currentStage });
        },
      },
      {
        text: 'AJUSTES DE AUDIO',
        enabled: true,
        action: () => {
          AudioSystem.get().playMenuSelect();
          this.showAudioModal();
        },
      },
      {
        text: 'CONTROLES',
        enabled: true,
        action: () => {
          AudioSystem.get().playMenuSelect();
          this.showControlsModal();
        },
      },
    ];

    this.renderMenu();
  }

  private renderMenu(): void {
    this.menuTexts.forEach((t) => t.destroy());
    this.menuTexts = [];
    this.menuHitZones.forEach((h) => h.destroy());
    this.menuHitZones = [];
    this.cursor?.destroy();
    this.menuFrame?.destroy();

    const menuX = 192;
    const startY = 90;
    const itemHeight = 15;

    // Fundo semitransparente escuro discreto dimensionado para 4 opções
    this.menuFrame = this.add.rectangle(menuX, 112, 150, 64, 0x0a1424, 0.88)
      .setStrokeStyle(1, 0x38bdf8, 0.9)
      .setDepth(30);

    this.menuItems.forEach((item, index) => {
      const y = startY + index * itemHeight;
      const isSelected = index === this.selectedIndex;
      const color = !item.enabled
        ? 0x526b82
        : isSelected
        ? 0xfef08a
        : 0xcfe6f7;

      const text = addPixelText(this, menuX, y, item.text, {
        scale: 1,
        color,
        originX: 0.5,
        originY: 0.5,
        depth: 32,
      });
      this.menuTexts.push(text);

      // Suporte direto a Mouse no PC (hover e clique)
      if (item.enabled) {
        const hit = this.add.rectangle(menuX, y, 140, itemHeight, 0x000000, 0.001)
          .setInteractive({ useHandCursor: true })
          .setDepth(36);

        hit.on('pointerover', () => {
          if (this.selectedIndex !== index) {
            this.selectedIndex = index;
            AudioSystem.get().playMenuNavigate();
            this.renderMenu();
          }
        });

        hit.on('pointerdown', () => {
          this.selectedIndex = index;
          this.selectMenuItem();
        });

        this.menuHitZones.push(hit);
      }
    });

    this.cursor = this.add.graphics().setDepth(35);
    this.updateCursor();
  }

  private updateCursor(): void {
    if (!this.cursor) return;
    this.cursor.clear();

    const menuX = 192;
    const startY = 90;
    const itemHeight = 15;
    const y = startY + this.selectedIndex * itemHeight;
    const x = menuX - 58;

    // Marcador seta dourada elegante
    this.cursor.fillStyle(0xf59e0b, 1);
    this.cursor.fillRect(x, y - 3, 2, 6);
    this.cursor.fillRect(x + 2, y - 2, 2, 4);
    this.cursor.fillRect(x + 4, y - 1, 2, 2);
    this.cursor.fillStyle(0xffffff, 1).fillRect(x + 1, y - 1, 2, 2);
  }

  private navigateMenu(direction: number): void {
    if (this.controlsModal || this.audioModal?.isOpen) return;

    let next = this.selectedIndex + direction;
    if (next < 0) next = this.menuItems.length - 1;
    if (next >= this.menuItems.length) next = 0;

    this.selectedIndex = next;
    AudioSystem.get().playMenuNavigate();
    this.renderMenu();
  }

  private selectMenuItem(): void {
    if (this.audioModal?.isOpen) return;
    if (this.controlsModal) {
      this.closeControlsModal();
      return;
    }
    const current = this.menuItems[this.selectedIndex];
    if (current && current.enabled) {
      current.action();
    }
  }

  private showAudioModal(): void {
    if (this.audioModal?.isOpen) return;
    this.audioModal = new AudioSettingsModal(this, () => {
      this.audioModal = undefined;
    });
    this.audioModal.open();
  }

  private showControlsModal(): void {
    if (this.controlsModal) return;

    this.controlsModal = this.add.container(0, 0).setDepth(2000);

    const backdrop = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050b14, 0.92);
    const box = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 260, 150, 0x0c1c2e, 1)
      .setStrokeStyle(1, 0x38bdf8, 1);

    const inner = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 254, 144, 0x000000, 0)
      .setStrokeStyle(1, 0xf59e0b, 0.35);

    this.controlsModal.add([backdrop, box, inner]);

    const title = addPixelText(this, GAME_WIDTH / 2, 27, 'GUIA DE CONTROLES', {
      scale: 1,
      color: 0xfde047,
      originX: 0.5,
      originY: 0.5,
    });
    this.controlsModal.add(title);

    // Linhas diretas, limpas e perfeitamente enquadradas dentro da moldura
    const controls = [
      { action: 'MOVER', keys: 'A, D / SETAS / D-PAD' },
      { action: 'PULO', keys: 'ESPACO / W / [X] PS5' },
      { action: 'ESTILINGUE', keys: 'J / X / [QUADRADO]' },
      { action: 'PAUSA', keys: 'ESC / P / OPTIONS' },
      { action: 'MENUS', keys: 'MOUSE / ENTER / [X]' },
    ];

    controls.forEach((ctrl, i) => {
      const y = 46 + i * 15;
      const actText = addPixelText(this, 40, y, ctrl.action, {
        scale: 1,
        color: 0x93c5fd,
        originX: 0,
        originY: 0.5,
      });

      const keyText = addPixelText(this, 280, y, ctrl.keys, {
        scale: 1,
        color: 0xfffbeb,
        originX: 1,
        originY: 0.5,
      });

      this.controlsModal?.add([actText, keyText]);
    });

    const closeBtnBg = this.add.rectangle(GAME_WIDTH / 2, 134, 140, 16, 0x1d4ed8, 0.85)
      .setStrokeStyle(1, 0xfde047, 1)
      .setInteractive({ useHandCursor: true });
    closeBtnBg.on('pointerdown', () => this.closeControlsModal());

    const closePrompt = addPixelText(this, GAME_WIDTH / 2, 134, 'ENTER / ESC - FECHAR', {
      scale: 1,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });

    this.controlsModal.add([closeBtnBg, closePrompt]);
  }

  private closeControlsModal(): void {
    if (!this.controlsModal) return;
    this.controlsModal.destroy();
    this.controlsModal = undefined;
    AudioSystem.get().playMenuNavigate();
  }
}
