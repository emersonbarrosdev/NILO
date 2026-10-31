import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/constants';

export class MenuScene extends Phaser.Scene {
  constructor() { super(SCENE_KEYS.menu); }

  create(): void {
    this.add.text(GAME_WIDTH / 2, 54, 'NOVO JOGO', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 84, 'ENTER PARA INICIAR', { fontFamily: 'monospace', fontSize: '9px', color: '#fde68a' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, 'Mais opções entram após o vertical slice 1-1.', { fontFamily: 'monospace', fontSize: '7px', color: '#94a3b8' }).setOrigin(0.5);
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SCENE_KEYS.intro));
  }
}
