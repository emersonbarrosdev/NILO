import Phaser from 'phaser';
import { Player } from '../Player';
/** A marked crate follows a constrained track and cannot get stranded in a pit. */
export class PushCrate extends Phaser.Physics.Arcade.Sprite {
  public docked=false;
  constructor(scene:Phaser.Scene,x:number,y:number,private minX:number,private maxX:number,private onDock?:()=>void){
    super(scene,x,y,'push-crate');scene.add.existing(this);scene.physics.add.existing(this);
    this.setDepth(5);
    (this.body as Phaser.Physics.Arcade.Body).setSize(28,28).setImmovable(true).setAllowGravity(false);
  }
  push(player:Player):void{
    if(player.isDead)return;
    const body=player.body as Phaser.Physics.Arcade.Body;
    if(body.bottom<=this.y-9)return;
    const direction=Math.sign(body.acceleration.x);
    if(direction!==Math.sign(this.x-player.x))return;
    const target=this.docked?this.x:Phaser.Math.Clamp(this.x+direction*42*Math.min(32,this.scene.game.loop.delta)/1000,this.minX,this.maxX);
    player.markPushing(Math.abs(target-this.x)<.01);
    if(this.docked)return;
    this.x=target;
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    if(this.onDock&&this.x>=this.maxX-.5){this.docked=true;this.setTint(0xd9ffa8);this.onDock();}
  }
}
