import handAnchors from '../../assets/hd/player-hand-anchors.json' with { type: 'json' };
/** Original detailed Nilo: 128 px cells at 4× texture resolution. */
export const PLAYER_ART = {
  cellSize: 32, textureCellSize: 128, textureResolution: 4,
  // One full right + left stride; 48 world units gives ~17 pose changes/s at 103 units/s.
  footBaseline: 29, strideLength: 48, walkStart: 64, walkCount: 8, runStart: 72,
  runSpeed: 103, crouchSpeed: 46,
} as const;

export type PlayerPoseState = 'idle' | 'blink' | 'walk' | 'run' | 'start_run' | 'brake' | 'turn'
  | 'jump_start' | 'jump_up' | 'fall' | 'land' | 'crouch' | 'crouch_move'
  | 'push_standing' | 'push_crouched' | 'push_blocked' | 'melee'
  | 'throw_prepare' | 'throw_release' | 'throw_recover' | 'retrieve_bat'
  | 'hurt' | 'knockback' | 'stunned' | 'defeat' | 'respawn';
export type PlayerEquipment = 'WITH_BAT' | 'WITHOUT_BAT';
export interface PlayerPoseClip {
  readonly frames: readonly number[];
  readonly loop: boolean;
  readonly equipment: readonly PlayerEquipment[];
  readonly source: 'original' | 'corrected';
  readonly note?: string;
}
const BOTH = ['WITH_BAT', 'WITHOUT_BAT'] as const;
const clip = (frames: readonly number[], loop = false, source: PlayerPoseClip['source'] = 'original', note?: string): PlayerPoseClip => ({ frames, loop, equipment: BOTH, source, note });
const range = (first: number) => Array.from({ length: 8 }, (_, i) => first + i);
/** Shared body poses + one persistent weapon layer avoid duplicate equipment sheets. */
export const PLAYER_POSES: Readonly<Record<PlayerPoseState, PlayerPoseClip>> = {
  idle: clip([0, 1], true), blink: clip([2, 3]),
  walk: clip(range(64), true, 'corrected'), run: clip(range(72), true, 'corrected'),
  start_run: clip([8, 9]), brake: clip([15, 0]), turn: clip([0], false, 'original', 'Facing is mirrored; no invented turn animation.'),
  jump_start: clip([24]), jump_up: clip([25, 26]), fall: clip([28, 29]), land: clip([30, 31]),
  crouch: clip([32]), crouch_move: clip(range(32), true),
  push_standing: clip(range(56), true), push_crouched: clip(range(80), true, 'corrected'),
  push_blocked: clip([60, 61], true),
  melee: clip([40, 41, 43, 44, 45, 47]),
  throw_prepare: clip([40, 41, 42]), throw_release: clip([43]),
  throw_recover: clip([44, 45, 46, 47]), retrieve_bat: clip([0, 32, 33, 32, 0]),
  hurt: clip([49], false, 'original', 'Existing recoil pose; no new damage rule.'),
  knockback: clip([27]), stunned: clip([49, 50], true),
  defeat: clip([25], false, 'original', 'Existing defeat arc, no new death mechanic.'), respawn: clip([0]),
};
export interface PlayerHandAnchor { readonly x: number; readonly y: number; readonly angle: number; }
/** Audited on the packed original body; x and shaft direction mirror with facing. */
export const PLAYER_HAND_ANCHORS: Readonly<Record<number, PlayerHandAnchor>> = handAnchors;
export function playerHandAnchor(frame: number): PlayerHandAnchor { return PLAYER_HAND_ANCHORS[frame] ?? PLAYER_HAND_ANCHORS[0]!; }


