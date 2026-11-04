/** One physical weapon, expressed in the same 320 × 180 logical world as Nilo. */
export const BATON = {
  length: 18,
  thickness: 4,
  scale: 1,
  gripAnchor: { x: 0.12, y: 0.5 },
  releaseAnchor: { x: 0.12, y: 0.5 },
  throw: { releaseMs: 180, durationMs: 440, forwardSpeed: 215, upwardSpeed: -105, lobSpeed: 145, lobUpwardSpeed: -255 },
  melee: { activeStartMs: 120, activeEndMs: 255, durationMs: 360 },
  retrieve: { radius: 22, recoverMs: 150, durationMs: 300 },
} as const;

export type BatonState = 'HELD' | 'MELEE' | 'PREPARE' | 'RELEASE' | 'FLYING' | 'BOUNCING' | 'GROUND' | 'RECOVERED';
export interface HandPose { x: number; y: number; angle: number; }

/** Centre of the shaft from the actual hand grip; no scale change at release. */
export function batonCentreFromGrip(hand: HandPose): { x: number; y: number } {
  const radians = hand.angle * Math.PI / 180;
  const offset = BATON.length * BATON.scale * (0.5 - BATON.gripAnchor.x);
  return { x: hand.x + Math.cos(radians) * offset, y: hand.y + Math.sin(radians) * offset };
}

/** World-space AABB changes with rotation; shaft length itself never changes. */
export function batonBoundsAtAngle(angle: number): { width: number; height: number } {
  const radians = angle * Math.PI / 180;
  return {
    width: (Math.abs(Math.cos(radians)) * BATON.length + Math.abs(Math.sin(radians)) * BATON.thickness) * BATON.scale,
    height: (Math.abs(Math.sin(radians)) * BATON.length + Math.abs(Math.cos(radians)) * BATON.thickness) * BATON.scale,
  };
}
