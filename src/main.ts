import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './game/config/gameConfig';
import { GAME_HEIGHT, GAME_WIDTH } from './game/config/constants';

const game = new Phaser.Game(gameConfig);

function applyIntegerScale(): void {
  const canvas = game.canvas;
  if (!canvas) return;

  const availableWidth = Math.max(GAME_WIDTH, window.innerWidth);
  const availableHeight = Math.max(GAME_HEIGHT, window.innerHeight);
  const integerScale = Math.max(
    1,
    Math.floor(Math.min(availableWidth / GAME_WIDTH, availableHeight / GAME_HEIGHT)),
  );

  canvas.style.width = `${GAME_WIDTH * integerScale}px`;
  canvas.style.height = `${GAME_HEIGHT * integerScale}px`;
}

requestAnimationFrame(applyIntegerScale);
window.addEventListener('resize', applyIntegerScale);
