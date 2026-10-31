export const GAIT_FRAME_COUNT = 8;
export const WALK_DISTANCE_PER_CYCLE = 36;
export const RUN_DISTANCE_PER_CYCLE = 52;
export const RUN_ENTER_SPEED = 62;
export const RUN_EXIT_SPEED = 50;
export const GAIT_MIN_SPEED = 6;

export type GaitMode = 'walk' | 'run';
export type AimPose = 'horizontal' | 'up-diagonal' | 'up' | 'down-diagonal' | 'down';
export type LegSupport = 'right' | 'left' | 'flight';

export type LegPose = {
  thighX: number;
  thighY: number;
  shinX: number;
  shinY: number;
  footX: number;
  footY: number;
};

export type GaitFrame = {
  support: LegSupport;
  right: LegPose;
  left: LegPose;
};

function oppositeSupport(support: LegSupport): LegSupport {
  if (support === 'right') return 'left';
  if (support === 'left') return 'right';
  return 'flight';
}

function buildOpposedCycle(firstHalf: GaitFrame[]): GaitFrame[] {
  const secondHalf = firstHalf.map((frame) => ({
    support: oppositeSupport(frame.support),
    right: { ...frame.left },
    left: { ...frame.right },
  }));

  return [...firstHalf, ...secondHalf];
}

function mirrorLegPoseHorizontally(leg: LegPose): LegPose {
  return {
    ...leg,
    thighX: 21 - leg.thighX,
    shinX: 21 - leg.shinX,
    footX: 19 - leg.footX,
  };
}

function mirrorCycleLegs(cycle: GaitFrame[]): GaitFrame[] {
  return cycle.map((frame) => ({
    ...frame,
    right: mirrorLegPoseHorizontally(frame.right),
    left: mirrorLegPoseHorizontally(frame.left),
  }));
}

const WALK_FIRST_HALF: GaitFrame[] = [
  {
    support: 'right',
    right: { thighX: 12, thighY: 21, shinX: 14, shinY: 24, footX: 15, footY: 28 },
    left: { thighX: 8, thighY: 21, shinX: 6, shinY: 24, footX: 4, footY: 28 },
  },
  {
    support: 'right',
    right: { thighX: 12, thighY: 22, shinX: 13, shinY: 25, footX: 13, footY: 28 },
    left: { thighX: 9, thighY: 21, shinX: 9, shinY: 24, footX: 8, footY: 27 },
  },
  {
    support: 'right',
    right: { thighX: 10, thighY: 22, shinX: 9, shinY: 25, footX: 8, footY: 28 },
    left: { thighX: 11, thighY: 21, shinX: 13, shinY: 23, footX: 14, footY: 25 },
  },
  {
    support: 'right',
    right: { thighX: 9, thighY: 21, shinX: 7, shinY: 24, footX: 5, footY: 28 },
    left: { thighX: 12, thighY: 21, shinX: 15, shinY: 24, footX: 16, footY: 27 },
  },
];

const RUN_FIRST_HALF: GaitFrame[] = [
  {
    support: 'right',
    right: { thighX: 12, thighY: 21, shinX: 15, shinY: 24, footX: 16, footY: 28 },
    left: { thighX: 8, thighY: 21, shinX: 6, shinY: 23, footX: 4, footY: 25 },
  },
  {
    support: 'right',
    right: { thighX: 12, thighY: 22, shinX: 13, shinY: 25, footX: 13, footY: 28 },
    left: { thighX: 9, thighY: 21, shinX: 10, shinY: 23, footX: 11, footY: 25 },
  },
  {
    support: 'right',
    right: { thighX: 9, thighY: 21, shinX: 7, shinY: 24, footX: 5, footY: 28 },
    left: { thighX: 12, thighY: 20, shinX: 15, shinY: 22, footX: 17, footY: 24 },
  },
  {
    support: 'flight',
    right: { thighX: 9, thighY: 20, shinX: 6, shinY: 22, footX: 4, footY: 25 },
    left: { thighX: 13, thighY: 20, shinX: 16, shinY: 22, footX: 17, footY: 25 },
  },
];

export const WALK_GAIT = mirrorCycleLegs(buildOpposedCycle(WALK_FIRST_HALF));
export const RUN_GAIT = mirrorCycleLegs(buildOpposedCycle(RUN_FIRST_HALF));

export function resolveGaitMode(current: GaitMode, speed: number): GaitMode {
  if (current === 'walk' && speed >= RUN_ENTER_SPEED) return 'run';
  if (current === 'run' && speed <= RUN_EXIT_SPEED) return 'walk';
  return current;
}

export function advanceGaitPhase(
  phase: number,
  deltaX: number,
  mode: GaitMode,
): number {
  if (deltaX <= 0) return phase;
  const distancePerCycle = mode === 'run' ? RUN_DISTANCE_PER_CYCLE : WALK_DISTANCE_PER_CYCLE;
  return (phase + deltaX / distancePerCycle) % 1;
}

export function gaitFrameFromPhase(phase: number): number {
  const normalized = ((phase % 1) + 1) % 1;
  return Math.floor(normalized * GAIT_FRAME_COUNT) % GAIT_FRAME_COUNT;
}

export function resolveAimPose(x: number, y: number): AimPose {
  const absX = Math.abs(x);
  const absY = Math.abs(y);

  if (absY < 0.35 || absX > absY * 1.7) return 'horizontal';
  if (y < 0 && absX < 0.35) return 'up';
  if (y > 0 && absX < 0.35) return 'down';
  return y < 0 ? 'up-diagonal' : 'down-diagonal';
}

function sameLegPose(a: LegPose, b: LegPose): boolean {
  return (
    a.thighX === b.thighX &&
    a.thighY === b.thighY &&
    a.shinX === b.shinX &&
    a.shinY === b.shinY &&
    a.footX === b.footX &&
    a.footY === b.footY
  );
}

export function validateGaitCycle(name: string, cycle: GaitFrame[], allowFlight: boolean): void {
  if (cycle.length !== GAIT_FRAME_COUNT) {
    throw new Error(`${name} precisa ter exatamente ${GAIT_FRAME_COUNT} frames.`);
  }

  for (let frame = 0; frame < GAIT_FRAME_COUNT / 2; frame += 1) {
    const current = cycle[frame];
    const opposite = cycle[frame + GAIT_FRAME_COUNT / 2];

    if (opposite.support !== oppositeSupport(current.support)) {
      throw new Error(`${name}: frame ${frame} não possui apoio oposto a 180 graus.`);
    }

    if (!sameLegPose(current.right, opposite.left) || !sameLegPose(current.left, opposite.right)) {
      throw new Error(`${name}: frame ${frame} não troca as pernas exatamente a 180 graus.`);
    }
  }

  if (!allowFlight && cycle.some((frame) => frame.support === 'flight')) {
    throw new Error(`${name}: caminhada não pode conter fase de voo.`);
  }

  if (allowFlight) {
    const flightFrames = cycle
      .map((frame, index) => (frame.support === 'flight' ? index : -1))
      .filter((index) => index >= 0);

    if (flightFrames.length !== 2 || flightFrames[1] - flightFrames[0] !== GAIT_FRAME_COUNT / 2) {
      throw new Error(`${name}: corrida deve ter duas fases de voo separadas por 180 graus.`);
    }
  }
}

export function validatePlayerAnimationModel(): void {
  validateGaitCycle('WALK_GAIT', WALK_GAIT, false);
  validateGaitCycle('RUN_GAIT', RUN_GAIT, true);
}
