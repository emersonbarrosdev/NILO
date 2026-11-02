import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { GameState } from '../systems/GameState';
import { addPixelText } from '../ui/PixelText';

export class UIScene extends Phaser.Scene {
  private heartIcon?: Phaser.GameObjects.Image;
  private livesText?: Phaser.GameObjects.GameObject;
  private stampIcon?: Phaser.GameObjects.Image;
  private stampsText?: Phaser.GameObjects.GameObject;
  private timeText?: Phaser.GameObjects.GameObject;
  private scoreText?: Phaser.GameObjects.GameObject;
  private postcardSlots: Phaser.GameObjects.Image[] = [];

  constructor() { super(SCENE_KEYS.ui); }

  create(): void {
    const gameState = GameState.get();

    // =========================================================================
    // HUD FLUTUANTE EM CÁPSULAS RETRÔ RETANGULARES COM BORDAS ILUMINADAS
    // (Não cobre a tela inteira com barra escura; visual moderno de plataforma)
    // =========================================================================

    // 1. CÁPSULA ESQUERDA: Sistema Único de Corações (Vidas Diretas do Nilo) (X: 4 -> 56)
    this.add.rectangle(30, 11, 52, 17, 0x091424, 0.84)
      .setStrokeStyle(1, 0x38bdf8, 0.65)
      .setScrollFactor(0)
      .setDepth(1000);

    // Coração Único Lapidado (Sua Vida Direta)
    this.heartIcon = this.add.image(15, 11, 'item-heart')
      .setScrollFactor(0)
      .setDepth(1001);

    this.renderLives(gameState.lives);

    // 2. CÁPSULA DE SELOS: Selos da Aventura (00/50 -> +1 Vida) (X: 86 -> 142)
    this.add.rectangle(114, 11, 56, 17, 0x091424, 0.84)
      .setStrokeStyle(1, 0xf59e0b, 0.65)
      .setScrollFactor(0)
      .setDepth(1000);

    this.stampIcon = this.add.image(96, 11, 'item-stamp')
      .setScrollFactor(0)
      .setDepth(1001);

    this.renderStamps(gameState.stamps);

    // 3. CÁPSULA DE TEMPO: Cronômetro da Fase (Pausa não conta!) (X: 148 -> 200)
    this.add.rectangle(174, 11, 52, 17, 0x091424, 0.84)
      .setStrokeStyle(1, 0x34d399, 0.65)
      .setScrollFactor(0)
      .setDepth(1000);

    this.renderTime(gameState.stageElapsedSeconds);

    // 4. CÁPSULA DIREITA: Segredos Postais & Pontuação (X: 206 -> 315)
    this.add.rectangle(260, 11, 108, 17, 0x091424, 0.84)
      .setStrokeStyle(1, 0x38bdf8, 0.65)
      .setScrollFactor(0)
      .setDepth(1000);

    // Slots dos 3 cartões-postais secretos da fase
    this.postcardSlots = [];
    for (let i = 0; i < 3; i++) {
      const id = `1-1-${i + 1}`;
      const hasPostcard = gameState.postcards.has(id);
      const icon = this.add.image(216 + i * 11, 11, hasPostcard ? 'ui-postcard-lit' : 'ui-postcard-empty')
        .setScrollFactor(0)
        .setDepth(1001);
      this.postcardSlots.push(icon);
    }

    this.renderScore(gameState.score);

    // Limpa quaisquer listeners anteriores para evitar acúmulo no EventEmitter singleton
    gameState.removeAllListeners('hp-changed');
    gameState.removeAllListeners('lives-changed');
    gameState.removeAllListeners('stamps-changed');
    gameState.removeAllListeners('time-changed');
    gameState.removeAllListeners('score-changed');
    gameState.removeAllListeners('postcard-collected');
    gameState.removeAllListeners('score-changed');
    gameState.removeAllListeners('postcard-collected');

    // Verificação de segurança de cena ativa
    const isAlive = () => {
      try {
        return Boolean(this && this.scene && this.sys && typeof this.sys.isActive === 'function' && this.sys.isActive());
      } catch {
        return false;
      }
    };

    // Listeners com animações reativas de impacto e comemoração
    const onLivesChanged = (lives: number) => {
      if (!isAlive()) return;
      this.renderLives(lives);

      // Efeito de pulso no coração ao sofrer dano ou ganhar vidas
      if (this.heartIcon && this.heartIcon.active) {
        this.tweens.add({
          targets: this.heartIcon,
          scaleX: 1.45,
          scaleY: 1.45,
          duration: 90,
          yoyo: true,
        });
      }
    };

    const onHpChanged = (hp: number) => {
      onLivesChanged(hp);
    };

    const onStampsChanged = (stamps: number) => {
      if (!isAlive()) return;
      this.renderStamps(stamps);

      // Leve balanço do selo
      if (this.stampIcon && this.stampIcon.active) {
        this.tweens.add({
          targets: this.stampIcon,
          angle: 15,
          duration: 60,
          yoyo: true,
        });
      }
    };

    const onTimeChanged = (secondsTotal: number) => {
      if (!isAlive()) return;
      this.renderTime(secondsTotal);
    };

    const onScoreChanged = (score: number) => {
      if (!isAlive()) return;
      this.renderScore(score);
    };

    const onPostcardCollected = (_id: string, count: number) => {
      if (!isAlive()) return;
      this.postcardSlots.forEach((slot, idx) => {
        if (slot && slot.active) {
          const isLit = idx < count;
          slot.setTexture(isLit ? 'ui-postcard-lit' : 'ui-postcard-empty');
          if (isLit) {
            this.tweens.add({
              targets: slot,
              scaleX: 1.5,
              scaleY: 1.5,
              duration: 140,
              yoyo: true,
            });
          }
        }
      });
    };

    gameState.on('hp-changed', onHpChanged);
    gameState.on('lives-changed', onLivesChanged);
    gameState.on('stamps-changed', onStampsChanged);
    gameState.on('time-changed', onTimeChanged);
    gameState.on('score-changed', onScoreChanged);
    gameState.on('postcard-collected', onPostcardCollected);

    const cleanup = () => {
      gameState.off('hp-changed', onHpChanged);
      gameState.off('lives-changed', onLivesChanged);
      gameState.off('stamps-changed', onStampsChanged);
      gameState.off('time-changed', onTimeChanged);
      gameState.off('score-changed', onScoreChanged);
      gameState.off('postcard-collected', onPostcardCollected);
    };

    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  private renderLives(lives: number): void {
    this.livesText?.destroy();
    // Alerta em vermelho se estiver com 1 de vida
    const color = lives <= 1 ? 0xff4d4d : 0xffffff;
    this.livesText = addPixelText(this, 26, 8, `x${lives}`, {
      scale: 1,
      color,
      scrollFactor: 0,
      depth: 1001,
    });
  }

  private renderStamps(stamps: number): void {
    this.stampsText?.destroy();
    const pad = String(stamps).padStart(2, '0');
    this.stampsText = addPixelText(this, 107, 8, `${pad}/50`, {
      scale: 1,
      color: 0xfef08a,
      scrollFactor: 0,
      depth: 1001,
    });
  }

  private renderTime(totalSeconds: number): void {
    this.timeText?.destroy();
    const sec = Math.floor(totalSeconds);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    this.timeText = addPixelText(this, 159, 8, formatted, {
      scale: 1,
      color: 0x6ee7b7,
      scrollFactor: 0,
      depth: 1001,
    });
  }

  private renderScore(score: number): void {
    this.scoreText?.destroy();
    this.scoreText = addPixelText(this, 252, 8, `PTS ${String(score).padStart(6, '0')}`, {
      scale: 1,
      color: 0xffdf68,
      scrollFactor: 0,
      depth: 1001,
    });
  }
}
