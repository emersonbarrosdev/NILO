import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './game/config/gameConfig';
import { RENDER_HEIGHT, RENDER_WIDTH } from './game/config/constants';

const game = new Phaser.Game(gameConfig);

function applyIntegerScale(): void {
  const canvas = game.canvas;
  if (!canvas) return;

  const availableWidth = Math.max(RENDER_WIDTH, window.innerWidth);
  const availableHeight = Math.max(RENDER_HEIGHT, window.innerHeight);
  const integerScale = Math.max(
    1,
    Math.floor(Math.min(availableWidth / RENDER_WIDTH, availableHeight / RENDER_HEIGHT)),
  );

  canvas.style.width = `${RENDER_WIDTH * integerScale}px`;
  canvas.style.height = `${RENDER_HEIGHT * integerScale}px`;
}

requestAnimationFrame(applyIntegerScale);
window.addEventListener('resize', applyIntegerScale);
