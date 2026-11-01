import Phaser from 'phaser';
import { RENDER_HEIGHT, RENDER_WIDTH } from './constants';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { TitleScene } from '../scenes/TitleScene';
import { MapScene } from '../scenes/MapScene';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';
import { StageClearScene } from '../scenes/StageClearScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { EndingScene } from '../scenes/EndingScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: RENDER_WIDTH,
  height: RENDER_HEIGHT,
  backgroundColor: '#1b2452',
  smoothPixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.NONE,
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    MapScene,
    GameScene,
    UIScene,
    StageClearScene,
    GameOverScene,
    EndingScene,
  ],
};
