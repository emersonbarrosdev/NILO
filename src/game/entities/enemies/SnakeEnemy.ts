import Phaser from 'phaser';
import { EnemyBase } from './EnemyBase';
export class SnakeEnemy extends EnemyBase {
  private direction=-1;
  constructor(scene:Phaser.Scene,x:number,y:number,private minX:number,private maxX:number){
    super(scene,x,y,'snake-sheet');
    (this.body as Phaser.Physics.Arcade.Body).setSize(26,8).setOffset(3,6);
    this.play('snake-slither');
  }
  update(_time:number,_delta:number):void{
    if(this.isDefeated)return;
    if(this.isStunned){this.setVelocityX(0);this.updateStunVisuals();return;}
    const body=this.body as Phaser.Physics.Arcade.Body;
    if(this.x<=this.minX||body.blocked.left)this.direction=1;
    if(this.x>=this.maxX||body.blocked.right)this.direction=-1;
    this.setVelocityX(this.direction*28).setFlipX(this.direction<0);
  }
  protected override onStunEnter():void{this.anims.pause();}
  protected override onStunExit():void{this.anims.resume();}
}
