export const TAU = Math.PI * 2;
export const WALK_PHASE_COUNT = 8;
/** Ground reference removes passive carrier motion, including a reversing platform. */
export function groundRelativeDisplacement(worldDelta: number, carrierDelta = 0): number {
  if (!Number.isFinite(worldDelta) || !Number.isFinite(carrierDelta)) throw new Error('Invalid ground displacement');
  return worldDelta - carrierDelta;
}
export interface LocomotionSample {
  distance: number;
  phase: number;
  rightLegPhase: number;
  leftLegPhase: number;
  rightFootSupporting: boolean;
  leftFootSupporting: boolean;
  frameIndex: number;
}

/** Engine-independent gait. A whole stride contains both anatomical support halves. */
export class LocomotionCycle {
  private travelled = 0;
  constructor(public readonly strideLength: number) {
    if (!Number.isFinite(strideLength) || strideLength <= 0) throw new Error('Invalid stride length');
  }
  get sample(): LocomotionSample {
    const phase = ((this.travelled / this.strideLength) % 1) * TAU;
    return {
      distance: this.travelled, phase, rightLegPhase: phase,
      leftLegPhase: (phase + Math.PI) % TAU,
      rightFootSupporting: phase < Math.PI,
      leftFootSupporting: phase >= Math.PI,
      frameIndex: Math.min(7, Math.floor(phase / (TAU / WALK_PHASE_COUNT))),
    };
  }
  advance(deltaX: number): LocomotionSample {
    if (!Number.isFinite(deltaX)) throw new Error('Invalid gait displacement');
    this.travelled += Math.abs(deltaX);
    return this.sample;
  }
  reset(distance = 0): void { this.travelled = Math.max(0, distance); }
}

/** Detects a failed logical update, never a repeated visual frame. */
export class LocomotionGuard {
  public groundMovementAllowed = true;
  constructor(public readonly cycle: LocomotionCycle) {}
  step(deltaX: number, grounded: boolean, carrierDelta = 0): boolean {
    if (!grounded) return true;
    const before = this.cycle.sample.distance;
    const probe = !this.groundMovementAllowed;
    const distance = probe ? 0.001 : Math.abs(groundRelativeDisplacement(deltaX, carrierDelta));
    if (distance < 1e-7) return this.groundMovementAllowed;
    let valid = false;
    try {
      const next = this.cycle.advance(distance);
      const expectedPhase = (((before + distance) / this.cycle.strideLength) % 1) * TAU;
      const error = Math.abs(next.phase - expectedPhase);
      valid = Number.isFinite(next.distance) && Math.abs(next.distance - before - distance) < 1e-6
        && Math.min(error, Math.abs(TAU - error)) < 1e-6;
    } catch { valid = false; }
    // A health probe must not invent locomotion, even when it succeeds.
    if (probe || !valid) this.cycle.reset(before);
    this.groundMovementAllowed = valid;
    return valid;
  }
  reset(): void { this.cycle.reset(); this.groundMovementAllowed = true; }
}

export type PlayerMotionState = 'IDLE' | 'WALK' | 'RUN' | 'JUMP' | 'FALL' | 'LAND'
  | 'THROW' | 'ATTACK' | 'RETRIEVE' | 'CROUCH' | 'PUSH' | 'HURT' | 'DEAD';
