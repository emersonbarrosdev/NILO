export const STAGE_1_1 = {
  id: '1-1', name: 'Vale da Brisa', worldWidth: 8200, worldHeight: 360,
  targetDurationMinutes: 7, collectibles: { postcards: 3, hiddenLives: 1 },
  enemies: ['aranha', 'abelha', 'sapo', 'sapo-guardiao'],
  mechanics: ['run','jump','charged-shot','push-stone','return-route','break-log','bridge','checkpoint','boss'],
} as const;
