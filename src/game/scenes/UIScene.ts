import { bindCamera } from '../systems/PresentationSystem';
import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { GameState } from '../systems/GameState';
import { Player } from '../entities/Player';
import { ForestBoss } from '../entities/enemies/ForestBoss';

/** Quiet HUD: one life counter, keepsakes, weapon availability and arena health. */
export class UIScene extends Phaser.Scene {
  private lab = false;
  private lives!:Phaser.GameObjects.Text;
  private stamps!:Phaser.GameObjects.Text;
  private timeLabel!:Phaser.GameObjects.Text;
  private weapon!:Phaser.GameObjects.Image;
  private weaponMark!:Phaser.GameObjects.Text;
  private slots:Phaser.GameObjects.Image[]=[];
  private bossBar!:Phaser.GameObjects.Graphics;
  private bossLabel!:Phaser.GameObjects.Text;
  constructor(){super(SCENE_KEYS.ui);}
  create():void{
    bindCamera(this);
    this.lab=(this.scene.get(SCENE_KEYS.game) as Phaser.Scene & {level:{id:string}}).level.id==='lab';
    const style={fontFamily:'"Press Start 2P", monospace',fontSize:'6px',color:'#fff4c2',stroke:'#123021',strokeThickness:2,resolution:4};
    this.add.rectangle(this.lab?43:74,13,this.lab?74:136,18,0x08281b,.85).setStrokeStyle(.5,0x80a636);
    this.add.image(17,13,'player-sheet',0).setDisplaySize(21,21);
    this.lives=this.add.text(29,8,'',style);
    this.add.image(61,13,'item-stamp').setDisplaySize(10,10).setVisible(!this.lab);
    this.stamps=this.add.text(70,8,'',style).setVisible(!this.lab);
    this.weapon=this.add.image(this.lab?65:121,13,'baton-icon').setDisplaySize(12,12);
    this.weaponMark=this.add.text(this.lab?73:131,9,'', {...style,fontSize:'7px'});
    this.add.rectangle(274,13,80,18,0x08281b,.85).setStrokeStyle(.5,0x80a636).setVisible(!this.lab);
    this.slots=[0,1,2].map(i=>this.add.image(244+i*12,13,'ui-postcard-empty').setDisplaySize(9,10).setVisible(!this.lab));
    this.timeLabel=this.add.text(281,9,'', {...style,fontSize:'7px'}).setVisible(!this.lab);
    this.bossBar=this.add.graphics();
    this.bossLabel=this.add.text(160,156,'GUARDIÃO DO BOSQUE',{...style,fontSize:'7px'}).setOrigin(.5).setVisible(false);
  }
  update():void{
    const state=GameState.get();
    this.lives.setText('× '+state.lives).setColor(state.lives===1?'#ffad69':'#fff4c2');
    this.stamps.setText(String(state.stamps).padStart(2,'0')+'/50');
    const seconds=Math.floor(state.stageElapsedSeconds);
    this.timeLabel.setText(Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'));
    this.slots.forEach((slot,i)=>slot.setTexture(state.postcards.has('1-1-'+(i+1))?'ui-postcard-lit':'ui-postcard-empty'));
    const game=this.scene.get(SCENE_KEYS.game) as Phaser.Scene&{player?:Player,boss?:ForestBoss};
    const available=game.player?.hasBaton;
    this.weapon.setAlpha(available?1:.25);this.weaponMark.setText(available?'':'↙');
    const boss=game.boss;this.bossBar.clear();
    const show=Boolean(boss?.engaged&&!boss.isDefeated);
    this.bossLabel.setVisible(show);
    if(show&&boss){
      this.bossBar.fillStyle(0x09291b,.95).fillRoundedRect(105,162,110,6,3);
      this.bossBar.fillStyle(boss.enraged?0xf57937:0xf6cb46).fillRoundedRect(107,164,106*boss.hp/8,2,1);
    }
  }
}
