import Phaser from 'phaser';
import { INTERNAL_RENDER } from './presentation';
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
  width: INTERNAL_RENDER.width,
  height: INTERNAL_RENDER.height,
  backgroundColor: '#1b2452',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false,
    },
  },
  input: {
    gamepad: true,
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
