import type { ForestBuilder } from './world-1/buildForest';
import { PushCrate } from '../entities/environment/PushCrate';
import { SnakeEnemy } from '../entities/enemies/SnakeEnemy';

/** One-screen vertical slice. World coordinates only. Larger maps use another builder/config. */
export function buildLab(b:ForestBuilder,world:{width:number;height:number}):void {
  // Rise 40, then33: both below the unchanged ~46-unit jump apex.
  // The crate offers a second approach; the low log explicitly tests crouching.
  b.ground(0,world.width,156);
  b.plank(92,116,56);
  b.plank(151,83,48);
  b.moving(213,104,18,0,18);
  b.falling(282,80);
  const crate=new PushCrate(b.scene,114,142,100,151);
  b.scene.physics.add.collider(b.player,crate,()=>crate.push(b.player));b.solid(crate);
  b.tunnel(187,226,156);
  b.enemy(new SnakeEnemy(b.scene,265,148,243,294));
  b.breakable(301,144);
}
