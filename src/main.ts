import { installTouchControls } from './game/ui/TouchControls';
import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './game/config/gameConfig';
import { installPresentation } from './game/systems/PresentationSystem';

await Promise.all([document.fonts.load('16px "Fredoka"'),document.fonts.load('16px "Press Start 2P"')]);
await document.fonts.ready;
const game = new Phaser.Game(gameConfig);
installPresentation(game);
installTouchControls(game);
if (import.meta.env.DEV) (window as unknown as { __NILO__: Phaser.Game }).__NILO__ = game;
