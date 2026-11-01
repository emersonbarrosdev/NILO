export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;
export const RENDER_SCALE = 1;
export const RENDER_WIDTH = GAME_WIDTH * RENDER_SCALE;
export const RENDER_HEIGHT = GAME_HEIGHT * RENDER_SCALE;
export const GAME_TITLE = 'NILO';

export const SCENE_KEYS = {
  boot: 'boot',
  preload: 'preload',
  title: 'title',
  menu: 'menu',
  intro: 'intro',
  map: 'map',
  game: 'game',
  ui: 'ui',
  stageClear: 'stage-clear',
  gameOver: 'game-over',
  ending: 'ending',
} as const;
