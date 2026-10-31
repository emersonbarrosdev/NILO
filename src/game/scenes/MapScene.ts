import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';

export class MapScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.map); }

  create(): void {
    this.drawBackground();
    this.drawRoute();

    addPixelText(this, GAME_WIDTH / 2, 20, 'ROTA DA CIDADE', {
      scale: 2,
      color: 0xfff1a8,
      originX: 0.5,
      originY: 0.5,
    });

    addPixelText(this, GAME_WIDTH / 2, 43, 'BAIRRO SOLAR', {
      scale: 1,
      color: 0x9ee8ff,
      originX: 0.5,
      originY: 0.5,
    });

    this.add.rectangle(GAME_WIDTH / 2, 144, 246, 43, 0x101b32, 0.96)
      .setStrokeStyle(1, 0x3c7295, 1);

    addPixelText(this, GAME_WIDTH / 2, 136, '1-1  TELHADOS DO MERCADO', {
      scale: 1,
      color: 0xffffff,
      originX: 0.5,
      originY: 0.5,
    });

    const prompt = addPixelText(this, GAME_WIDTH / 2, 154, 'ENTER / ESPAÇO  INICIAR', {
      scale: 1,
      color: 0xffdf68,
      originX: 0.5,
      originY: 0.5,
    });

    this.tweens.add({
      targets: prompt,
      alpha: 0.45,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const startStage = () => this.scene.start(SCENE_KEYS.game, { stageId: '1-1' });
    this.input.keyboard?.once('keydown-ENTER', startStage);
    this.input.keyboard?.once('keydown-SPACE', startStage);
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x17264a, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.fillStyle(0x1c3159, 1).fillRect(0, 38, GAME_WIDTH, 92);

    // Grade urbana discreta ao fundo, como um mapa de metrô impresso.
    graphics.lineStyle(1, 0x27456b, 0.55);
    for (let x = 12; x < GAME_WIDTH; x += 24) {
      graphics.lineBetween(x, 42, x, 126);
    }
    for (let y = 50; y < 128; y += 18) {
      graphics.lineBetween(8, y, GAME_WIDTH - 8, y);
    }

    // Silhuetas de prédios nas laterais.
    graphics.fillStyle(0x101b32, 1);
    graphics.fillRect(0, 96, 34, 34);
    graphics.fillRect(8, 84, 18, 12);
    graphics.fillRect(286, 91, 34, 39);
    graphics.fillRect(294, 78, 18, 13);
  }

  private drawRoute(): void {
    const graphics = this.add.graphics();
    const stations = [58, 126, 194, 262];

    // Linha principal.
    graphics.fillStyle(0x60dff4, 1).fillRect(stations[0], 78, stations[3] - stations[0], 2);

    // Estação ativa com halo.
    graphics.fillStyle(0x4b3b16, 1).fillRect(stations[0] - 8, 70, 16, 18);
    graphics.fillStyle(0xffcf33, 1).fillRect(stations[0] - 5, 73, 10, 12);
    graphics.fillStyle(0xffffff, 1).fillRect(stations[0] - 2, 76, 4, 6);

    // Próximos distritos ficam visíveis, mas bloqueados.
    for (let index = 1; index < stations.length; index += 1) {
      const x = stations[index];
      graphics.fillStyle(0x425675, 1).fillRect(x - 6, 72, 12, 14);
      graphics.fillStyle(0x71829a, 1).fillRect(x - 3, 75, 6, 8);
    }

    addPixelText(this, stations[0], 96, 'MERCADO', {
      scale: 1,
      color: 0xffdf68,
      originX: 0.5,
      originY: 0.5,
    });
    addPixelText(this, stations[1], 96, 'CANAIS', {
      scale: 1,
      color: 0x8192ab,
      originX: 0.5,
      originY: 0.5,
    });
    addPixelText(this, stations[2], 96, 'FERROVIA', {
      scale: 1,
      color: 0x8192ab,
      originX: 0.5,
      originY: 0.5,
    });
    addPixelText(this, stations[3], 96, 'ALTA', {
      scale: 1,
      color: 0x8192ab,
      originX: 0.5,
      originY: 0.5,
    });

    addPixelText(this, GAME_WIDTH / 2, 113, 'OS OUTROS DISTRITOS ABREM DEPOIS', {
      scale: 1,
      color: 0x8297b4,
      originX: 0.5,
      originY: 0.5,
    });
  }
}
