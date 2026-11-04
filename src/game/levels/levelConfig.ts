import { GAMEPLAY_CAMERA } from '../config/presentation';
import { STAGE_1_1 } from './world-1/stage-1-1';
export type LevelId = 'lab' | 'forest';
export interface LevelConfig {
  id: LevelId;
  world: { width:number; height:number };
  camera: { mode:'fixed'|'follow'; width:number; height:number };
  spawn: {x:number;y:number};
}
export const LEVELS:Record<LevelId,LevelConfig>={
  lab:{id:'lab',world:{...GAMEPLAY_CAMERA},camera:{mode:'fixed',...GAMEPLAY_CAMERA},spawn:{x:32,y:143}},
  forest:{id:'forest',world:{width:STAGE_1_1.worldWidth,height:STAGE_1_1.worldHeight},camera:{mode:'follow',...GAMEPLAY_CAMERA},spawn:{x:40,y:134}},
};
export const DEFAULT_LEVEL:LevelId='lab';
