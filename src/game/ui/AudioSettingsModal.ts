import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { AudioSystem } from '../systems/AudioSystem';
import { GamepadSystem } from '../systems/GamepadSystem';
import { addPixelText } from './PixelText';

export class AudioSettingsModal {
  private scene: Phaser.Scene;
  private container?: Phaser.GameObjects.Container;
  private selectedIndex = 0;
  private rowTexts: Phaser.GameObjects.GameObject[] = [];
  private interactiveHitZones: Phaser.GameObjects.Rectangle[] = [];
  private cursor?: Phaser.GameObjects.Graphics;
  private onClose: () => void;
  public isOpen = false;

  private keyUpListener?: () => void;
  private keyDownListener?: () => void;
  private keyLeftListener?: () => void;
  private keyRightListener?: () => void;
  private keyConfirmListener?: () => void;
  private keyEscListener?: () => void;

  constructor(scene: Phaser.Scene, onClose: () => void) {
    this.scene = scene;
    this.onClose = onClose;
  }

  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.selectedIndex = 0;
    this.interactiveHitZones = [];

    this.container = this.scene.add.container(0, 0).setDepth(8000).setScrollFactor(0);

    // Fundo semitransparente escuro
    const backdrop = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x050b14,
      0.92,
    );

    // Caixa de diálogo com moldura 16-bit
    const box = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      258,
      148,
      0x0c1c2e,
      1,
    ).setStrokeStyle(1, 0x38bdf8, 1);

    const inner = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      252,
      142,
      0x000000,
      0,
    ).setStrokeStyle(1, 0xf59e0b, 0.4);

    this.container.add([backdrop, box, inner]);

    // Título estilizado
    const title = addPixelText(this.scene, GAME_WIDTH / 2, 28, 'AJUSTES DE AUDIO', {
      scale: 1,
      color: 0xfde047,
      originX: 0.5,
      originY: 0.5,
      depth: 8001,
    });
    this.container.add(title);

    // Cursor seletor
    this.cursor = this.scene.add.graphics().setDepth(8005);
    this.container.add(this.cursor);

    this.renderRows();

    // Botão interativo de Fechar e Salvar (Mouse / Teclado / Controle)
    const closeBtnBg = this.scene.add.rectangle(GAME_WIDTH / 2, 136, 170, 18, 0x1d4ed8, 0.8)
      .setStrokeStyle(1, 0xfde047, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(8004);

    closeBtnBg.on('pointerdown', () => this.close());

    const footer = addPixelText(
      this.scene,
      GAME_WIDTH / 2,
      136,
      'CLIQUE OU [O]/ESC : FECHAR E SALVAR',
      {
        scale: 1,
        color: 0xffffff,
        originX: 0.5,
        originY: 0.5,
        depth: 8005,
      },
    );
    this.container.add([closeBtnBg, footer]);

    this.setupInputs();
  }

  public updateGamepad(time: number): void {
    if (!this.isOpen) return;
    const pad = GamepadSystem.get().updateMenuNavigation(time);

    if (pad.upJustPressed) {
      this.selectedIndex = (this.selectedIndex - 1 + 4) % 4;
      AudioSystem.get().playMenuNavigate();
      this.renderRows();
    } else if (pad.downJustPressed) {
      this.selectedIndex = (this.selectedIndex + 1) % 4;
      AudioSystem.get().playMenuNavigate();
      this.renderRows();
    } else if (pad.leftJustPressed) {
      this.adjustValue(-0.1);
    } else if (pad.rightJustPressed) {
      this.adjustValue(0.1);
    } else if (pad.confirmJustPressed) {
      if (this.selectedIndex === 3) {
        this.adjustValue(0);
      } else {
        AudioSystem.get().playMenuSelect();
      }
    } else if (pad.cancelJustPressed) {
      this.close();
    }
  }

  private renderRows(): void {
    const audio = AudioSystem.get();
    this.rowTexts.forEach((t) => t.destroy());
    this.rowTexts = [];
    this.interactiveHitZones.forEach((h) => h.destroy());
    this.interactiveHitZones = [];

    const items = [
      {
        label: 'VOLUME GERAL',
        value: Math.round(audio.getMasterVolume() * 100),
        isBar: true,
      },
      {
        label: 'MUSICA (BGM)',
        value: Math.round(audio.getBgmVolume() * 100),
        isBar: true,
      },
      {
        label: 'EFEITOS (SFX)',
        value: Math.round(audio.getSfxVolume() * 100),
        isBar: true,
      },
      {
        label: 'SILENCIAR',
        valueText: audio.getMuted() ? '[ SIM - MUDO ]' : '[ NAO ]',
        isBar: false,
      },
    ];

    const startY = 52;
    const rowHeight = 19;

    items.forEach((item, idx) => {
      const y = startY + idx * rowHeight;
      const isSelected = idx === this.selectedIndex;
      const labelColor = isSelected ? 0xfef08a : 0xcfe6f7;
      const valColor = isSelected ? 0x38bdf8 : 0x94a3b8;

      // Nome do ajuste
      const labelText = addPixelText(this.scene, 42, y, item.label, {
        scale: 1,
        color: labelColor,
        originX: 0,
        originY: 0.5,
        depth: 8002,
      });

      let displayValue = '';
      if (item.isBar && item.value !== undefined) {
        const barsFilled = Math.round(item.value / 10);
        const barStr = '|'.repeat(barsFilled) + '.'.repeat(10 - barsFilled);
        displayValue = `< [${barStr}] > ${String(item.value).padStart(3, ' ')}%`;
      } else {
        displayValue = item.valueText ?? '';
      }

      const valText = addPixelText(this.scene, 278, y, displayValue, {
        scale: 1,
        color: item.isBar && (item.value ?? 0) === 0 ? 0xef4444 : valColor,
        originX: 1,
        originY: 0.5,
        depth: 8002,
      });

      this.rowTexts.push(labelText, valText);
      if (this.container) {
        this.container.add([labelText, valText]);
      }

      // Suporte a Mouse no PC para cada linha
      const rowHit = this.scene.add.rectangle(GAME_WIDTH / 2, y, 246, 17, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true })
        .setDepth(8003);

      rowHit.on('pointerover', () => {
        if (this.selectedIndex !== idx) {
          this.selectedIndex = idx;
          AudioSystem.get().playMenuNavigate();
          this.renderRows();
        }
      });

      if (item.isBar) {
        // Clicar no lado esquerdo da linha diminui o volume, lado direito aumenta
        rowHit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          this.selectedIndex = idx;
          if (pointer.x < GAME_WIDTH / 2 + 20) {
            this.adjustValue(-0.1);
          } else {
            this.adjustValue(0.1);
          }
        });
      } else {
        // Clicar em silenciar altera estado
        rowHit.on('pointerdown', () => {
          this.selectedIndex = idx;
          this.adjustValue(0);
        });
      }

      this.interactiveHitZones.push(rowHit);
    });

    this.updateCursor();
  }

  private updateCursor(): void {
    if (!this.cursor) return;
    this.cursor.clear();

    const startY = 52;
    const rowHeight = 19;
    const y = startY + this.selectedIndex * rowHeight;
    const x = 32;

    this.cursor.fillStyle(0xf59e0b, 1);
    this.cursor.fillRect(x, y - 3, 2, 6);
    this.cursor.fillRect(x + 2, y - 2, 2, 4);
    this.cursor.fillRect(x + 4, y - 1, 2, 2);
    this.cursor.fillStyle(0xffffff, 1).fillRect(x + 1, y - 1, 2, 2);
  }

  private setupInputs(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.keyUpListener = () => {
      this.selectedIndex = (this.selectedIndex - 1 + 4) % 4;
      AudioSystem.get().playMenuNavigate();
      this.renderRows();
    };

    this.keyDownListener = () => {
      this.selectedIndex = (this.selectedIndex + 1) % 4;
      AudioSystem.get().playMenuNavigate();
      this.renderRows();
    };

    this.keyLeftListener = () => this.adjustValue(-0.1);
    this.keyRightListener = () => this.adjustValue(0.1);

    this.keyConfirmListener = () => {
      if (this.selectedIndex === 3) {
        this.adjustValue(0);
      } else {
        AudioSystem.get().playMenuSelect();
      }
    };

    this.keyEscListener = () => this.close();

    keyboard.on('keydown-UP', this.keyUpListener);
    keyboard.on('keydown-W', this.keyUpListener);
    keyboard.on('keydown-DOWN', this.keyDownListener);
    keyboard.on('keydown-S', this.keyDownListener);
    keyboard.on('keydown-LEFT', this.keyLeftListener);
    keyboard.on('keydown-A', this.keyLeftListener);
    keyboard.on('keydown-RIGHT', this.keyRightListener);
    keyboard.on('keydown-D', this.keyRightListener);
    keyboard.on('keydown-ENTER', this.keyConfirmListener);
    keyboard.on('keydown-SPACE', this.keyConfirmListener);
    keyboard.on('keydown-ESC', this.keyEscListener);
  }

  private adjustValue(delta: number): void {
    const audio = AudioSystem.get();

    if (this.selectedIndex === 0) {
      const next = Math.round((audio.getMasterVolume() + delta) * 10) / 10;
      audio.setMasterVolume(Math.max(0, Math.min(1, next)));
      audio.playMenuNavigate();
    } else if (this.selectedIndex === 1) {
      const next = Math.round((audio.getBgmVolume() + delta) * 10) / 10;
      audio.setBgmVolume(Math.max(0, Math.min(1, next)));
    } else if (this.selectedIndex === 2) {
      const next = Math.round((audio.getSfxVolume() + delta) * 10) / 10;
      audio.setSfxVolume(Math.max(0, Math.min(1, next)));
      audio.playStamp();
    } else if (this.selectedIndex === 3) {
      audio.toggleMute();
      audio.playMenuSelect();
    }

    this.renderRows();
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      if (this.keyUpListener) {
        keyboard.off('keydown-UP', this.keyUpListener);
        keyboard.off('keydown-W', this.keyUpListener);
      }
      if (this.keyDownListener) {
        keyboard.off('keydown-DOWN', this.keyDownListener);
        keyboard.off('keydown-S', this.keyDownListener);
      }
      if (this.keyLeftListener) {
        keyboard.off('keydown-LEFT', this.keyLeftListener);
        keyboard.off('keydown-A', this.keyLeftListener);
      }
      if (this.keyRightListener) {
        keyboard.off('keydown-RIGHT', this.keyRightListener);
        keyboard.off('keydown-D', this.keyRightListener);
      }
      if (this.keyConfirmListener) {
        keyboard.off('keydown-ENTER', this.keyConfirmListener);
        keyboard.off('keydown-SPACE', this.keyConfirmListener);
      }
      if (this.keyEscListener) {
        keyboard.off('keydown-ESC', this.keyEscListener);
      }
    }

    this.interactiveHitZones.forEach((h) => h.destroy());
    this.interactiveHitZones = [];
    this.container?.destroy();
    this.container = undefined;
    this.cursor?.destroy();
    this.cursor = undefined;

    AudioSystem.get().playMenuNavigate();
    this.onClose();
  }
}
