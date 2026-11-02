import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';
import { GameState } from '../systems/GameState';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { GamepadSystem } from '../systems/GamepadSystem';

export class StageClearScene extends Phaser.Scene {
  private hasTransitioned = false;

  constructor() { super(SCENE_KEYS.stageClear); }

  create(): void {
    AudioSystem.get().stopBgm();
    this.hasTransitioned = false;

    const gameState = GameState.get();
    const elapsedSeconds = Math.max(1, Math.floor(gameState.stageElapsedSeconds));
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Registra no save
    SaveSystem.get().recordStageClear(
      gameState.currentStage,
      elapsedSeconds,
      gameState.score,
      Array.from(gameState.postcards),
    );

    // Fundo elegante de vitória
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x112338, 0.95);
    this.add.rectangle(GAME_WIDTH / 2, 28, 220, 24, 0x1b4b6b, 1)
      .setStrokeStyle(1, 0xffd740, 1);

    addPixelText(this, GAME_WIDTH / 2, 28, 'FASE 1-1 CONCLUIDA!', {
      scale: 1,
      color: 0xffef9b,
      originX: 0.5,
      originY: 0.5,
    });

    addPixelText(this, GAME_WIDTH / 2, 50, 'VALE DA BRISA', {
      scale: 1,
      color: 0x9be8ff,
      originX: 0.5,
      originY: 0.5,
    });

    // Quadro de resultados
    const panel = this.add.rectangle(GAME_WIDTH / 2, 102, 240, 70, 0x162f4a, 0.9)
      .setStrokeStyle(1, 0x4aa6c4, 1);
    this.add.existing(panel);

    const stats = [
      `TEMPO:            ${timeFormatted}`,
      `SELOS COLETADOS:  ${gameState.stamps}`,
      `POSTAIS SECRETOS: ${gameState.postcards.size} / 3`,
      `INIMIGOS:         ${gameState.enemiesDefeated}`,
      `SCORE FINAL:      ${String(gameState.score).padStart(6, '0')}`,
    ];

    stats.forEach((line, idx) => {
      addPixelText(this, GAME_WIDTH / 2 - 95, 75 + idx * 12, line, {
        scale: 1,
        color: idx === 4 ? 0xffdf68 : 0xecf8ff,
        originX: 0,
        originY: 0,
      });
    });

    const prompt = addPixelText(this, GAME_WIDTH / 2, 154, 'MOUSE / ENTER / [X] CONTINUAR', {
      scale: 1,
      color: 0xffe680,
      originX: 0.5,
      originY: 0.5,
    });

    this.tweens.add({
      targets: prompt,
      alpha: 0.4,
      duration: 550,
      yoyo: true,
      repeat: -1,
    });

    const promptHit = this.add.rectangle(GAME_WIDTH / 2, 154, 250, 20, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });
    promptHit.on('pointerdown', () => this.next());

    this.input.keyboard?.once('keydown-ENTER', () => this.next());
    this.input.keyboard?.once('keydown-SPACE', () => this.next());

    const cleanup = () => {
      this.input.keyboard?.removeAllListeners();
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  update(time: number): void {
    if (this.hasTransitioned) return;
    const pad = GamepadSystem.get().updateMenuNavigation(time);
    if (pad.confirmJustPressed || pad.cancelJustPressed) {
      this.next();
    }
  }

  private next(): void {
    if (this.hasTransitioned) return;
    this.hasTransitioned = true;
    AudioSystem.get().playMenuSelect();
    this.scene.start(SCENE_KEYS.map);
  }
}
