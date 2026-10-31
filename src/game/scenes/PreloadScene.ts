import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.preload); }

  create(): void {
    this.createPlayerPlaceholder();
    this.createEnemyPlaceholder();

    // O preload técnico fica invisível enquanto os assets ainda são instantâneos.
    this.scene.start(SCENE_KEYS.title);
  }

  private createPlayerPlaceholder(): void {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Cabelo / cabeça.
    g.fillStyle(0x17243b).fillRect(4, 1, 8, 3);
    g.fillRect(3, 3, 10, 2);
    g.fillStyle(0xf2b36f).fillRect(5, 5, 6, 4);
    g.fillStyle(0x17243b).fillRect(10, 6, 1, 1);

    // Jaqueta de mensageiro e bolsa transversal.
    g.fillStyle(0x1f88a8).fillRect(4, 9, 8, 7);
    g.fillStyle(0xffd05a).fillRect(5, 10, 6, 2);
    g.fillStyle(0xe56b32).fillRect(11, 11, 3, 5);
    g.fillRect(9, 9, 2, 2);

    // Braços.
    g.fillStyle(0xf2b36f).fillRect(2, 10, 2, 5);
    g.fillRect(12, 10, 2, 4);

    // Calça e tênis.
    g.fillStyle(0x243653).fillRect(5, 16, 3, 6);
    g.fillRect(9, 16, 3, 6);
    g.fillStyle(0xf7e7b2).fillRect(3, 21, 5, 2);
    g.fillRect(9, 21, 5, 2);

    // Estilingue visível na lateral como detalhe temporário.
    g.fillStyle(0x6b3b24).fillRect(1, 13, 1, 5);
    g.fillRect(0, 12, 1, 2);
    g.fillRect(2, 12, 1, 2);

    g.generateTexture('player-placeholder', 16, 24);
    g.destroy();
  }

  private createEnemyPlaceholder(): void {
    const g = this.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0x8e2948).fillRect(3, 5, 10, 8);
    g.fillStyle(0xef5b5b).fillRect(2, 6, 12, 5);
    g.fillStyle(0xffd05a).fillRect(5, 7, 2, 2);
    g.fillRect(9, 7, 2, 2);
    g.fillStyle(0x25324b).fillRect(4, 13, 3, 2);
    g.fillRect(9, 13, 3, 2);
    g.fillStyle(0x7bdff2).fillRect(0, 8, 2, 2);
    g.fillRect(14, 8, 2, 2);

    g.generateTexture('enemy-placeholder', 16, 16);
    g.destroy();
  }
}
