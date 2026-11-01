type Rect = readonly [x: number, y: number, width: number, height: number, color: string];

type Pose = {
  bodyY?: number;
  lean?: number;
  leftFootX?: number;
  leftFootY?: number;
  rightFootX?: number;
  rightFootY?: number;
  leftKneeX?: number;
  rightKneeX?: number;
  arm?: 'idle' | 'forward' | 'up' | 'pull-forward' | 'pull-up' | 'back';
  crouch?: boolean;
  skid?: boolean;
  airborne?: boolean;
};

const FRAME_WIDTH = 48;
const FRAME_HEIGHT = 64;
const COLS = 8;
const ROWS = 6;

const C = {
  outline: '#2a1718',
  hair: '#4a281f',
  hairLight: '#6a3a26',
  skin: '#efb07a',
  skinShadow: '#cf875f',
  shirt: '#f4e0bd',
  shirtShadow: '#d5bd98',
  jacket: '#bd4938',
  jacketDark: '#7d322d',
  shorts: '#365b8c',
  shortsDark: '#263f67',
  shoe: '#3a2b32',
  sole: '#d5cab7',
  bag: '#71442f',
  bagDark: '#4e3027',
  sling: '#5b3826',
  rubber: '#312027',
  eye: '#18202d',
};

function rect([x, y, w, h, color]: Rect): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
}

function add(list: Rect[], x: number, y: number, w: number, h: number, color: string): void {
  list.push([Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)), color]);
}

function drawLeg(
  list: Rect[],
  hipX: number,
  kneeX: number,
  footX: number,
  footY: number,
  near: boolean,
  bodyY: number,
): void {
  const shorts = near ? C.shorts : C.shortsDark;
  const skin = near ? C.skin : C.skinShadow;
  const shoe = C.shoe;
  const hipY = 42 + bodyY;
  const kneeY = Math.min(50 + bodyY, footY - 5);

  add(list, hipX - 2, hipY, 5, 6, shorts);
  add(list, Math.min(hipX, kneeX) - 1, hipY + 5, Math.abs(kneeX - hipX) + 3, 4, skin);
  add(list, Math.min(kneeX, footX) - 1, kneeY - 1, Math.abs(footX - kneeX) + 3, Math.max(3, footY - kneeY - 2), skin);
  add(list, footX - 3, footY - 3, 8, 4, shoe);
  add(list, footX - 2, footY, 8, 2, C.sole);
}

function drawSlingshot(list: Rect[], x: number, y: number, mode: 'forward' | 'up'): void {
  if (mode === 'forward') {
    add(list, x, y - 5, 2, 9, C.sling);
    add(list, x + 5, y - 7, 2, 11, C.sling);
    add(list, x + 1, y - 5, 5, 2, C.rubber);
    add(list, x + 1, y + 2, 5, 2, C.rubber);
  } else {
    add(list, x - 4, y, 9, 2, C.sling);
    add(list, x - 6, y - 5, 11, 2, C.sling);
    add(list, x - 4, y - 4, 2, 5, C.rubber);
    add(list, x + 3, y - 4, 2, 5, C.rubber);
  }
}

function drawCharacter(pose: Pose): string {
  const list: Rect[] = [];
  const bodyY = pose.bodyY ?? 0;
  const lean = pose.lean ?? 0;
  const crouch = pose.crouch ?? false;
  const arm = pose.arm ?? 'idle';

  const headY = 8 + bodyY + (crouch ? 5 : 0);
  const torsoY = 28 + bodyY + (crouch ? 5 : 0);
  const hipY = torsoY + 14;

  // Mochila/bolsa atrás do corpo.
  add(list, 8 + lean, torsoY + 1, 8, 15, C.bagDark);
  add(list, 10 + lean, torsoY + 2, 7, 12, C.bag);
  add(list, 13 + lean, torsoY - 2, 2, 9, C.bagDark);

  // Perna do fundo primeiro para a alternância ficar legível.
  if (crouch) {
    add(list, 17 + lean, hipY, 14, 5, C.shorts);
    add(list, 15 + lean, hipY + 4, 10, 5, C.skinShadow);
    add(list, 25 + lean, hipY + 5, 9, 4, C.skin);
    add(list, 12 + lean, hipY + 8, 12, 4, C.shoe);
    add(list, 27 + lean, hipY + 8, 10, 4, C.shoe);
    add(list, 12 + lean, hipY + 11, 12, 2, C.sole);
    add(list, 27 + lean, hipY + 11, 10, 2, C.sole);
  } else {
    const leftFootX = pose.leftFootX ?? 17;
    const leftFootY = pose.leftFootY ?? 56;
    const rightFootX = pose.rightFootX ?? 29;
    const rightFootY = pose.rightFootY ?? 56;
    drawLeg(list, 20 + lean, pose.leftKneeX ?? 19, leftFootX, leftFootY, false, bodyY);
    drawLeg(list, 28 + lean, pose.rightKneeX ?? 29, rightFootX, rightFootY, true, bodyY);
  }

  // Tronco e roupa. Grandes massas de cor para leitura em tamanho real.
  add(list, 16 + lean, torsoY, 16, 16, C.outline);
  add(list, 18 + lean, torsoY + 1, 12, 14, C.shirt);
  add(list, 18 + lean, torsoY + 11, 12, 3, C.shirtShadow);
  add(list, 14 + lean, torsoY + 1, 5, 15, C.jacketDark);
  add(list, 15 + lean, torsoY + 2, 4, 13, C.jacket);
  add(list, 30 + lean, torsoY + 1, 5, 15, C.jacketDark);
  add(list, 30 + lean, torsoY + 2, 4, 13, C.jacket);
  add(list, 18 + lean, torsoY + 14, 13, 5, C.shortsDark);
  add(list, 20 + lean, torsoY + 14, 10, 4, C.shorts);

  // Pescoço, cabeça e cabelo infantil com silhueta mais arredondada.
  add(list, 21 + lean, headY + 16, 7, 5, C.skinShadow);
  add(list, 15 + lean, headY + 4, 19, 15, C.outline);
  add(list, 17 + lean, headY + 5, 16, 14, C.skin);
  add(list, 13 + lean, headY, 20, 7, C.hair);
  add(list, 10 + lean, headY + 4, 8, 7, C.hair);
  add(list, 17 + lean, headY - 2, 6, 5, C.hairLight);
  add(list, 24 + lean, headY - 1, 5, 4, C.hair);
  add(list, 30 + lean, headY + 2, 6, 5, C.hair);
  add(list, 32 + lean, headY + 10, 3, 4, C.skinShadow);
  add(list, 29 + lean, headY + 9, 2, 2, C.eye);
  add(list, 31 + lean, headY + 15, 3, 2, C.outline);

  // Braço do fundo.
  if (arm === 'back') {
    add(list, 14 + lean, torsoY + 4, 4, 8, C.skinShadow);
    add(list, 10 + lean, torsoY + 10, 7, 4, C.skinShadow);
  } else {
    add(list, 13 + lean, torsoY + 4, 4, 10, C.skinShadow);
  }

  // Braço da frente + estilingue. Cada direção possui silhueta própria.
  if (arm === 'forward' || arm === 'pull-forward') {
    add(list, 31 + lean, torsoY + 4, 8, 4, C.skin);
    add(list, 37 + lean, torsoY + 3, 5, 4, C.skin);
    drawSlingshot(list, 41 + lean, torsoY + 5, 'forward');
    if (arm === 'pull-forward') {
      add(list, 24 + lean, torsoY + 8, 11, 3, C.skinShadow);
      add(list, 29 + lean, torsoY + 7, 12, 1, C.rubber);
    }
  } else if (arm === 'up' || arm === 'pull-up') {
    add(list, 29 + lean, torsoY - 5, 4, 12, C.skin);
    add(list, 27 + lean, torsoY - 10, 5, 7, C.skin);
    drawSlingshot(list, 29 + lean, torsoY - 14, 'up');
    if (arm === 'pull-up') {
      add(list, 22 + lean, torsoY + 2, 4, 9, C.skinShadow);
      add(list, 24 + lean, torsoY - 8, 1, 11, C.rubber);
    }
  } else {
    add(list, 31 + lean, torsoY + 4, 4, 10, C.skin);
    add(list, 33 + lean, torsoY + 11, 5, 4, C.skin);
    drawSlingshot(list, 37 + lean, torsoY + 12, 'forward');
  }

  if (pose.skid) {
    add(list, 8 + lean, 57, 28, 2, '#b98b62');
    add(list, 4 + lean, 59, 13, 2, '#d7b18a');
  }

  return list.map(rect).join('');
}

const WALK: Pose[] = [
  { leftFootX: 13, rightFootX: 34, leftKneeX: 16, rightKneeX: 31 },
  { leftFootX: 15, rightFootX: 32, leftKneeX: 17, rightKneeX: 30, bodyY: 1 },
  { leftFootX: 19, rightFootX: 29, leftKneeX: 20, rightKneeX: 28 },
  { leftFootX: 24, rightFootX: 25, leftKneeX: 22, rightKneeX: 26, bodyY: -1 },
  { leftFootX: 34, rightFootX: 13, leftKneeX: 31, rightKneeX: 16 },
  { leftFootX: 32, rightFootX: 15, leftKneeX: 30, rightKneeX: 17, bodyY: 1 },
  { leftFootX: 29, rightFootX: 19, leftKneeX: 28, rightKneeX: 20 },
  { leftFootX: 25, rightFootX: 24, leftKneeX: 26, rightKneeX: 22, bodyY: -1 },
];

const RUN: Pose[] = [
  { leftFootX: 10, rightFootX: 37, leftKneeX: 15, rightKneeX: 32, lean: 2, arm: 'back' },
  { leftFootX: 13, rightFootX: 35, leftKneeX: 17, rightKneeX: 31, bodyY: 1, lean: 2, arm: 'back' },
  { leftFootX: 19, rightFootX: 31, leftKneeX: 20, rightKneeX: 29, lean: 2 },
  { leftFootX: 23, rightFootX: 28, leftFootY: 53, rightFootY: 52, leftKneeX: 21, rightKneeX: 30, bodyY: -2, lean: 3, airborne: true },
  { leftFootX: 37, rightFootX: 10, leftKneeX: 32, rightKneeX: 15, lean: 2, arm: 'back' },
  { leftFootX: 35, rightFootX: 13, leftKneeX: 31, rightKneeX: 17, bodyY: 1, lean: 2, arm: 'back' },
  { leftFootX: 31, rightFootX: 19, leftKneeX: 29, rightKneeX: 20, lean: 2 },
  { leftFootX: 28, rightFootX: 23, leftFootY: 52, rightFootY: 53, leftKneeX: 30, rightKneeX: 21, bodyY: -2, lean: 3, airborne: true },
];

const frames: Pose[] = Array.from({ length: COLS * ROWS }, () => ({}));
frames[0] = {};
frames[1] = { bodyY: 1 };
frames[2] = {};
frames[3] = { bodyY: -1 };
frames[4] = {};
frames[5] = { crouch: true, bodyY: 2 };
frames[6] = { skid: true, lean: -3, leftFootX: 13, rightFootX: 35, leftKneeX: 17, rightKneeX: 31 };
frames[7] = {};
WALK.forEach((pose, i) => { frames[8 + i] = pose; });
RUN.forEach((pose, i) => { frames[16 + i] = pose; });
frames[24] = { bodyY: -3, leftFootX: 20, rightFootX: 30, leftFootY: 52, rightFootY: 51, leftKneeX: 22, rightKneeX: 29, airborne: true };
frames[25] = { bodyY: -5, leftFootX: 22, rightFootX: 29, leftFootY: 50, rightFootY: 49, leftKneeX: 21, rightKneeX: 31, airborne: true };
frames[26] = { bodyY: -6, leftFootX: 21, rightFootX: 30, leftFootY: 49, rightFootY: 49, leftKneeX: 20, rightKneeX: 31, airborne: true };
frames[27] = { bodyY: -7, leftFootX: 19, rightFootX: 31, leftFootY: 50, rightFootY: 50, leftKneeX: 21, rightKneeX: 30, airborne: true };
frames[28] = { bodyY: -4, leftFootX: 17, rightFootX: 33, leftFootY: 55, rightFootY: 54, leftKneeX: 20, rightKneeX: 30, airborne: true };
frames[29] = { crouch: true, bodyY: 1 };
frames[30] = { crouch: true, bodyY: -1 };
frames[31] = {};
frames[32] = { arm: 'forward' };
frames[33] = { arm: 'pull-forward' };
frames[34] = { arm: 'up' };
frames[35] = { arm: 'pull-up' };
frames[36] = { arm: 'pull-forward' };
frames[37] = { arm: 'forward', lean: 1 };
frames[38] = { arm: 'forward', lean: 2 };
frames[39] = { arm: 'pull-up' };
frames[40] = { arm: 'up', lean: 1 };
frames[41] = { arm: 'up', lean: 2 };
frames[42] = { arm: 'pull-forward' };
frames[43] = { arm: 'pull-forward', bodyY: -1 };
frames[44] = { arm: 'pull-forward', lean: 1 };
frames[45] = {};
frames[46] = { bodyY: 1 };
frames[47] = {};

export const NILO_SPRITE_FRAME_WIDTH = FRAME_WIDTH;
export const NILO_SPRITE_FRAME_HEIGHT = FRAME_HEIGHT;

export function createNiloSpriteSheetSvg(): string {
  const content = frames.map((pose, index) => {
    const x = (index % COLS) * FRAME_WIDTH;
    const y = Math.floor(index / COLS) * FRAME_HEIGHT;
    return `<g transform="translate(${x} ${y})">${drawCharacter(pose)}</g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_WIDTH * COLS}" height="${FRAME_HEIGHT * ROWS}" viewBox="0 0 ${FRAME_WIDTH * COLS} ${FRAME_HEIGHT * ROWS}" shape-rendering="crispEdges">${content}</svg>`;
}
