export const STAGE_1_1 = {
  id: '1-1',
  name: 'Vale da Brisa',
  worldWidth: 2400,
  worldHeight: 360,
  targetDurationMinutes: 7,
  collectibles: {
    postcards: 3,
    hiddenLives: 1,
  },
  enemies: ['lata', 'saltador', 'pipa-drone'],
  mechanics: ['run', 'jump', 'quick-shot', 'charged-shot', 'aim', 'checkpoint'],
} as const;
