import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './game/config/gameConfig';
import { RENDER_HEIGHT, RENDER_WIDTH } from './game/config/constants';

const game = new Phaser.Game(gameConfig);

function fitCanvasToViewport(): void {
  const canvas = game.canvas;
  if (!canvas) return;

  const scale = Math.min(
    window.innerWidth / RENDER_WIDTH,
    window.innerHeight / RENDER_HEIGHT,
  );

  canvas.style.width = `${Math.floor(RENDER_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(RENDER_HEIGHT * scale)}px`;
}

requestAnimationFrame(fitCanvasToViewport);
window.addEventListener('resize', fitCanvasToViewport);
