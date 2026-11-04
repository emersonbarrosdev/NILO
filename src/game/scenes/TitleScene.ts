import { bindCamera } from '../systems/PresentationSystem';
import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { AudioSystem } from '../systems/AudioSystem';
import { GameState } from '../systems/GameState';
import { GamepadSystem } from '../systems/GamepadSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioSettingsModal } from '../ui/AudioSettingsModal';
import { ControlsModal } from '../ui/ControlsModal';

interface TitleButton {
  row: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  hit: Phaser.GameObjects.Rectangle;
  enabled: boolean;
}

export class TitleScene extends Phaser.Scene {
  private selected = 0;
  private buttons: TitleButton[] = [];
  private cursor!: Phaser.GameObjects.Container;
  private audio?: AudioSettingsModal;
  private controls?: ControlsModal;
  private ready = false;

  constructor() { super(SCENE_KEYS.title); }

  create(): void {
    this.ready = true;
    this.selected = 0;
    this.buttons = [];
    bindCamera(this);
    this.createForest();
    this.createMenu();

    const up = () => this.move(-1);
    const down = () => this.move(1);
    const confirm = () => this.confirm();
    const esc = () => {
      this.controls?.close();
      if (this.audio?.isOpen) this.audio.close();
    };
    this.input.keyboard?.on('keydown-UP', up).on('keydown-DOWN', down)
      .on('keydown-ENTER', confirm).on('keydown-SPACE', confirm).on('keydown-ESC', esc);
    this.events.once('shutdown', () => {
      this.ready = false;
      this.input.keyboard?.off('keydown-UP', up).off('keydown-DOWN', down)
        .off('keydown-ENTER', confirm).off('keydown-SPACE', confirm).off('keydown-ESC', esc);
      this.audio?.close();
      this.controls?.close();
    });
    AudioSystem.get().startBgm('title');
  }

  private createForest(): void {
    const backdrop = this.add.image(160, 90, 'forest-backdrop').setDisplaySize(340, 192);
    this.tweens.add({ targets: backdrop, x: 154, duration: 12000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.rectangle(160, 90, 320, 180, 0x031b15, .28);
    this.add.image(307, 187, 'forest-atlas', 'fern').setOrigin(.5, 1).setDisplaySize(100, 78);
    const logo = this.add.image(160, 40, 'nilo-logo').setDisplaySize(139, 64).setDepth(5);
    this.tweens.add({ targets: logo, y: 39, duration: 2800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    for (let i = 0; i < 9; i++) {
      const leaf = this.add.sprite(i * 43, 12 + i * 17, 'leaves-sheet')
        .setDisplaySize(4, 4).setAlpha(.8).play('leaf-turn');
      this.tweens.add({ targets: leaf, x: leaf.x - 95, y: 210, angle: 120, duration: 9000 + i * 480, repeat: -1, delay: i * 240 });
    }
  }

  private createMenu(): void {
    // Classic title composition: open scenery, logo, text and a single cursor.
    // No menu cards, enlarged gameplay sprites or button-scale animation.
    const shade=this.add.graphics().setDepth(8);
    for(let i=0;i<24;i++){
      const a=Math.sin((i+.5)/24*Math.PI)*.34;
      shade.fillStyle(0x03180f,a).fillRect(109.6+i*4.2,79,4.3,76);
    }
    const options=['JOGAR','CONTINUAR','ÁUDIO','CONTROLES'];
    const positions=[89,107,125,143];
    options.forEach((label,i)=>{
      const row=this.add.container(160,positions[i]!).setDepth(10);
      const text=this.add.text(0,0,label,{
        fontFamily:'"Press Start 2P", monospace',fontSize:'7px',resolution:4,
        color:'#fff5d5',stroke:'#061b12',strokeThickness:1.5,
        shadow:{offsetX:.6,offsetY:1,color:'#06150c',blur:0,fill:true},
      }).setOrigin(.5);
      const enabled=i!==1||SaveSystem.get().hasSave();
      const hit=this.add.rectangle(0,0,114,16,0,0.001);
      if(enabled){
        hit.setInteractive({useHandCursor:true});
        hit.on('pointerover',()=>{
          if(!this.modalOpen()&&this.ready&&this.selected!==i){
            this.selected=i;this.highlight();AudioSystem.get().playMenuNavigate();
          }
        });
        hit.on('pointerdown',()=>{if(!this.modalOpen()){this.selected=i;this.confirm();}});
      }else{text.setColor('#829584').setAlpha(.55);}
      row.add([text,hit]);this.buttons.push({row,label:text,hit,enabled});
    });
    const arrow=this.add.graphics();
    arrow.fillStyle(0x05190f).fillTriangle(-2,-4,5,0,-2,4);
    arrow.fillStyle(0xffd35b).fillTriangle(-2.5,-3,3,0,-2.5,3);
    this.cursor=this.add.container(117,positions[0]!,[arrow]).setDepth(12);
    this.highlight(true);
    this.add.text(160,169,'FLORESTA  -  LABORATORIO',{
      fontFamily:'"Press Start 2P", monospace',fontSize:'3.5px',resolution:4,
      color:'#e0dcaa',stroke:'#0a2517',strokeThickness:1,
    }).setOrigin(.5).setDepth(10);
  }

  private modalOpen(): boolean { return Boolean(this.controls || this.audio?.isOpen); }

  private move(direction: number): void {
    if (!this.ready || this.modalOpen()) return;
    do { this.selected = (this.selected + direction + this.buttons.length) % this.buttons.length; }
    while (!this.buttons[this.selected]!.enabled);
    this.highlight();
    AudioSystem.get().playMenuNavigate();
  }

  private highlight(immediate=false):void {
    this.buttons.forEach((button,i)=>{
      if(button.enabled)button.label.setColor(i===this.selected?'#ffd35b':'#fff5d5');
    });
    this.tweens.killTweensOf(this.cursor);
    const selected=this.buttons[this.selected]!;
    const x=selected.row.x-selected.label.width/2-9,y=selected.row.y;
    if(immediate)this.cursor.setPosition(x,y);
    else this.tweens.add({targets:this.cursor,x,y,duration:100,ease:'Cubic.easeOut'});
  }

  private confirm(): void {
    if (!this.ready || this.modalOpen() || !this.buttons[this.selected]!.enabled) return;
    AudioSystem.get().unlock();
    AudioSystem.get().playMenuSelect();
    if (this.selected === 2) {
      this.audio = new AudioSettingsModal(this, () => { this.audio = undefined; });
      this.audio.open();
      return;
    }
    if (this.selected === 3) {
      this.controls = new ControlsModal(this, () => { this.controls = undefined; });
      return;
    }
    this.ready = false;
    if (this.selected === 0) GameState.get().initNewGame();
    else GameState.get().continueGame();
    this.cameras.main.fadeOut(280, 5, 24, 13);
    this.time.delayedCall(280, () => this.scene.start(SCENE_KEYS.game, { stageId: '1-1', resumeSave: this.selected === 1 }));
  }

  update(time: number): void {
    if (this.audio?.isOpen) { this.audio.updateGamepad(time); return; }
    const pad = GamepadSystem.get().updateMenuNavigation(time);
    if (this.controls) { if (pad.cancelJustPressed) this.controls.close(); return; }
    if (pad.upJustPressed) this.move(-1);
    if (pad.downJustPressed) this.move(1);
    if (pad.confirmJustPressed) this.confirm();
  }
}
