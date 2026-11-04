import Phaser from 'phaser';
import { EnemyBase } from './EnemyBase';
import { Player } from '../Player';
import { AudioSystem } from '../../systems/AudioSystem';

type Phase='waiting'|'throw-warn'|'throw'|'rest'|'rage'|'charge-warn'|'charge'|'stunned';
/** Telegraph, attack, recovery: the recovery window accepts exactly one hit. */
export class ForestBoss extends EnemyBase {
  public phase:Phase='waiting';
  public engaged=false;
  public enraged=false;
  private nextAction=0;
  private windowHit=false;
  private clock=0;
  private chargeDirection=-1;
  private rounds=0;
  private entrance:Phaser.GameObjects.Rectangle;
  private exit:Phaser.GameObjects.Rectangle;
  private vines:Phaser.GameObjects.Image[];
  private bananas:{sprite:Phaser.Physics.Arcade.Sprite,born:number,overlap:Phaser.Physics.Arcade.Collider}[]=[];
  constructor(scene:Phaser.Scene,x:number,y:number,private player:Player,private onDefeat:()=>void,register:(surface:Phaser.GameObjects.GameObject)=>void){
    super(scene,x,y,'monkey-sheet');
    this.hp=8;this.points=1500;this.setFlipX(true);
    (this.body as Phaser.Physics.Arcade.Body).setSize(28,31).setOffset(10,15);
    this.entrance=scene.add.rectangle(7730,50,14,260,0x000000,0);
    this.exit=scene.add.rectangle(8106,50,14,260,0x000000,0);
    for(const wall of [this.entrance,this.exit]){scene.physics.add.existing(wall,true);register(wall);}
    (this.entrance.body as Phaser.Physics.Arcade.StaticBody).enable=false;
    this.vines=[7730,8106].map((wallX)=>scene.add.image(wallX,60,'forest-atlas','vine').setDisplaySize(22,192).setDepth(14));
    this.vines[0]!.setVisible(false);
    scene.events.once('shutdown',()=>this.clearBananas());
  }
  private setPhase(phase:Phase,duration:number,frame:number):void{
    this.phase=phase;this.nextAction=this.clock+duration;this.setFrame(frame);this.windowHit=false;
  }
  update(time:number):void{
    this.clock=time;
    if(this.isDefeated||this.player.isDead)return;
    if(!this.engaged){
      if(this.player.x<7750)return;
      this.engaged=true;(this.entrance.body as Phaser.Physics.Arcade.StaticBody).enable=true;this.vines[0]!.setVisible(true);
      this.scene.cameras.main.stopFollow().centerOn(7920,112.5);
      AudioSystem.get().startBgm('boss');this.setPhase('throw-warn',850,1);
    }
    if(this.hp<=4&&!this.enraged){
      this.enraged=true;this.setVelocityX(0);this.setTint(0xffb475);this.setPhase('rage',1000,4);
      this.scene.cameras.main.shake(220,.003);
    }
    if(this.phase==='charge'){
      const body=this.body as Phaser.Physics.Arcade.Body;
      if(body.blocked.left||body.blocked.right||this.x<7756||this.x>8080||time>=this.nextAction){
        this.setX(Phaser.Math.Clamp(this.x,7757,8079)).setVelocityX(0);
        this.setPhase('stunned',1900,7);AudioSystem.get().playStun();this.scene.cameras.main.shake(140,.003);
      }
      return;
    }
    if(time<this.nextAction)return;
    if(this.phase==='throw-warn'){
      this.setPhase('throw',250,2);this.throwPeel();
    }else if(this.phase==='throw'){
      this.setPhase('rest',1800,3);
    }else if(this.phase==='rest'||this.phase==='stunned'||this.phase==='rage'){
      this.rounds++;
      if(this.enraged&&this.rounds%3!==0){
        this.chargeDirection=this.player.x<this.x?-1:1;
        this.setFlipX(this.chargeDirection<0);this.setPhase('charge-warn',850,5);
      }else{this.setFlipX(this.player.x<this.x);this.setPhase('throw-warn',850,1);}
    }else if(this.phase==='charge-warn'){
      this.setPhase('charge',2500,6);this.setVelocityX(this.chargeDirection*170);
    }
  }
  public updateHazards(time:number):void{
    for(let i=this.bananas.length-1;i>=0;i--){
      const item=this.bananas[i]!,s=item.sprite;
      if(s.y>149){s.setY(149).setVelocity(0,0).setAngularVelocity(0).setAngle(0);(s.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);}
      if(time-item.born>4700){item.overlap.destroy();s.destroy();this.bananas.splice(i,1);}
    }
  }
  private throwPeel():void{
    const sprite=this.scene.physics.add.sprite(this.x,this.y-15,'banana').setDepth(11);
    const body=sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(8,5).setOffset(2,2);
    // Aim at the player's current position; camping on a platform is not safe.
    const flight=.65,target=Phaser.Math.Clamp(this.player.x,7750,8090);
    sprite.setVelocity((target-this.x)/flight,(this.player.y-sprite.y-450*flight*flight)/flight).setAngularVelocity(360);
    const overlap=this.scene.physics.add.overlap(sprite,this.player,()=>this.player.receiveDamage(1,sprite.x));
    this.bananas.push({sprite,born:this.clock,overlap});
    AudioSystem.get().playShoot(false);
  }
  override takeDamage(_damage:number,impactX?:number):void{
    if(this.isDefeated||!this.engaged||this.windowHit||!['rest','stunned'].includes(this.phase))return;
    this.windowHit=true;this.hp--;AudioSystem.get().playHit();
    this.setAlpha(.4);this.scene.tweens.add({targets:this,alpha:1,duration:150});
    if(this.hp<=0)this.die(impactX);
  }
  override onPlayerOverlap(player:Player):void{if(!this.isDefeated)player.receiveDamage(1,this.x);}
  override die(impactX?:number):void{
    if(this.isDefeated)return;
    this.clearBananas();this.vines.forEach(v=>v.setVisible(false));
    (this.entrance.body as Phaser.Physics.Arcade.StaticBody).enable=false;
    (this.exit.body as Phaser.Physics.Arcade.StaticBody).enable=false;
    this.scene.cameras.main.startFollow(this.player,false,.1,.1,-38,16);
    this.onDefeat();super.die(impactX);
  }
  private clearBananas():void{for(const b of this.bananas){b.overlap.destroy();b.sprite.destroy();}this.bananas=[];}
  resetFight():void{
    if(this.isDefeated)return;
    this.scene.cameras.main.startFollow(this.player,false,.1,.1,-38,16);
    this.clearBananas();this.hp=8;this.enraged=false;this.engaged=false;this.phase='waiting';this.rounds=0;
    this.setPosition(7940,132).setVelocity(0,0).clearTint().setFrame(0);
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    (this.entrance.body as Phaser.Physics.Arcade.StaticBody).enable=false;this.vines[0]!.setVisible(false);
  }
}
