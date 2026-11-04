import Phaser from 'phaser';
import { BeetleEnemy } from '../../entities/enemies/BeetleEnemy';
import { HopperEnemy } from '../../entities/enemies/HopperEnemy';
import { DragonflyEnemy } from '../../entities/enemies/DragonflyEnemy';
import { ForestBoss } from '../../entities/enemies/ForestBoss';
import { Player } from '../../entities/Player';
import { PushCrate } from '../../entities/environment/PushCrate';
import { SnakeEnemy } from '../../entities/enemies/SnakeEnemy';
import { EnemyBase } from '../../entities/enemies/EnemyBase';
import { PuzzleTarget } from '../../entities/environment/PuzzleTarget';
import { AudioSystem } from '../../systems/AudioSystem';
import { GameState } from '../../systems/GameState';


type Platform = { collider: Phaser.GameObjects.Rectangle; reveal: () => void };
export interface ForestBuilder {
  scene: Phaser.Scene; player: Player;
  ground(a: number, b: number, y?: number): void;
  plank(x: number, y: number, width?: number, hidden?: boolean): Platform;
  stamp(x: number, y: number): void;
  solid(surface:Phaser.GameObjects.GameObject):void;
  tunnel(a:number,b:number,floorY:number):void;
  life(x: number, y: number): void;
  postcard(x: number, y: number, id: string): void;
  checkpoint(x: number, y: number, id: string): void;
  moving(x: number, y: number, dx: number, dy: number, speed: number): void;
  falling(x: number, y: number): void;
  flower(x: number, y: number, velocity: number): void;
  breakable(x: number, y: number): void;
  enemy(enemy: EnemyBase): void;
  bossDefeated(): void;
  goal(x: number, y: number): void;
}

/** The entire first forest, in nine short lessons; no other stage is produced. */
export function buildForest(b: ForestBuilder): { boss: ForestBoss; target: PuzzleTarget } {
  const { scene, player } = b;
  const coins = (a: number, end: number, y: number) => { for (let x = a; x <= end; x += 28) b.stamp(x, y); };
  const spider = (x: number, y: number, a: number, end: number) => b.enemy(new BeetleEnemy(scene, x, y - 8, a, end));
  const frog = (x: number, y: number, a: number, end: number) => b.enemy(new HopperEnemy(scene, x, y - 8, player, a, end));
  const bee = (x: number, y: number) => b.enemy(new DragonflyEnemy(scene, x, y, 40));

  // Meadow: safe introduction, gentle rises and a bridge with a forgiving floor.
  b.ground(0, 340); b.ground(340, 440, 142); b.ground(440, 560, 130); b.ground(560, 680, 142); b.ground(680, 920);
  coins(180, 280, 134); coins(360, 550, 110);
  b.plank(760, 120, 64); 
  b.ground(920, 1100, 205); b.plank(980, 154, 120); b.plank(1070, 154, 60);
  b.ground(1100, 1600); spider(1160, 154, 1120, 1250);
  

  // Push a crate into a shallow stop, then use it to reach the high ledge.
  b.ground(1450, 1600, 94);
  const stepCrate = new PushCrate(scene, 1330, 140, 1290, 1435);
  scene.physics.add.collider(player, stepCrate, () => stepCrate.push(player));
  b.solid(stepCrate);
  coins(1470, 1560, 74);
  b.postcard(1550, 74, '1-1-1');

  // Lower fork ends at a cliff. Dock the crate, return left, take the canopy.
  b.ground(1600, 2140, 220); b.ground(2140, 2190, 72); b.ground(2190, 2470);
  b.plank(1650, 154, 70); b.plank(1730, 180); b.plank(1790, 150); b.plank(1850, 120);
  const canopy = [b.plank(1920, 102, 68, true), b.plank(2000, 82, 68, true), b.plank(2080, 62, 68, true)];
  const rope = scene.add.graphics().setDepth(2).lineStyle(1, 0xbcaa78, .7);
  rope.lineBetween(1886, 100, 2114, 60);
  const socket=scene.add.image(2080,215,'push-crate').setDisplaySize(30,10).setTint(0x486d3e).setAlpha(.6).setDepth(4);
  const socketCrate=new PushCrate(scene,1910,206,1880,2080,()=>{
    canopy.forEach(p=>p.reveal());socket.setTint(0xd4ff76).setAlpha(1);
    AudioSystem.get().playCheckpoint();GameState.get().addScore(150);
  });
  scene.physics.add.collider(player,socketCrate,()=>socketCrate.push(player));b.solid(socketCrate);
  coins(1750, 2010, 201);
  b.checkpoint(2350, 140, 'cp-1');

  // Baton breaks the crate; the high route offers the second postcard.
  b.ground(2470, 2780, 142); b.ground(2780, 3120);
  b.breakable(2640, 128); 
  frog(2870, 154, 2800, 3020); coins(2910, 3070, 134);
  b.plank(2930, 120); b.plank(3010, 92); b.plank(3090, 70); bee(3060, 50);
  b.postcard(3090, 52, '1-1-2');

  b.tunnel(2680,2770,142);

  // River: modest gaps, slow raft and clear banks.
  b.ground(3120, 3250); b.ground(3500, 3980);
  b.plank(3280, 150, 64); b.moving(3340, 142, 100, 0, 26); b.plank(3480, 150, 64);
  coins(3290, 3480, 122); 
  b.ground(3640, 3730, 142); b.ground(3730, 3820, 130); b.ground(3820, 3900, 142);
  spider(3780, 130, 3745, 3805); b.checkpoint(3950, 140, 'cp-2');

  // Optional bell puzzle and exactly one physical extra life.
  b.ground(3980, 4530); b.plank(4080, 124); b.plank(4160, 98);
  const secret = b.plank(4240, 72, 58, true);
  const target = new PuzzleTarget(scene, 4190, 78, () => {
    secret.reveal(); GameState.get().addScore(200); b.life(4240, 57);
    
  });
  frog(4410, 154, 4320, 4480); coins(4320, 4470, 133);

  // Canopy: falling bridge has a safe lower recovery path.
  b.ground(4530, 4720, 180); b.ground(4720, 4900, 200); b.ground(4900, 5200, 180);
  b.plank(4590, 146, 70); b.plank(4680, 120, 60); b.plank(4770, 94, 64);
  b.falling(4850, 96); b.plank(4930, 102, 68); b.plank(5020, 125, 72);
  bee(4810, 62); coins(4600, 5000, 73); b.postcard(4930, 81, '1-1-3'); 
  b.flower(5130, 174, -340);
  b.ground(5200, 5410); b.ground(5410, 5530, 142); b.ground(5530, 5680, 130);
  spider(5580, 130, 5545, 5640); b.checkpoint(5650, 116, 'cp-3');

  b.tunnel(5770,5860,154);
  b.enemy(new SnakeEnemy(scene,5350,148,5220,5370));
  b.enemy(new SnakeEnemy(scene,6915,148,6920,7040));

  // Longer trail repeats familiar lessons instead of adding first-stage complexity.
  b.ground(5680, 5900); b.ground(6000, 6390);
  b.plank(5920, 150, 56); b.plank(5980, 150, 56);
  b.breakable(6120, 140); coins(6170, 6340, 134); frog(6280, 154, 6200, 6350);
  b.ground(6390, 6540, 142); b.ground(6540, 6720, 118); b.ground(6720, 6910, 142); b.ground(6910, 7120);
  b.plank(6490, 112); bee(6640, 80); coins(6580, 6700, 97); spider(6990, 154, 6940, 7080);
  b.ground(7120, 7320, 200); b.plank(7150, 150, 64); b.moving(7220, 136, 0, 40, 22); b.plank(7300, 150, 60);
  b.ground(7320, 8200); b.checkpoint(7550, 140, 'cp-boss'); 
  

  const boss = new ForestBoss(scene, 7940, 132, player, () => {
    b.bossDefeated(); AudioSystem.get().startBgm('stage');
  }, surface=>b.solid(surface));
  b.plank(7810,112,58); b.plank(8020,112,58);
  b.enemy(boss); b.goal(8130, 136);
  return { boss, target };
}
