import { pinOverlay } from '../systems/PresentationSystem';
import Phaser from 'phaser';
import { InputSettings, type InputAction } from '../systems/InputSettings';
import { addPixelText } from './PixelText';

export class ControlsModal {
  private container: Phaser.GameObjects.Container;
  private waiting?: InputAction;
  private status: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.GameObject[] = [];
  private listener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { this.close(); return; }
    if (!this.waiting) return;
    const code = event.code.replace('Key', '').replace('Arrow', '').toUpperCase();
    if (!['SPACE', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'UP', 'DOWN', 'LEFT', 'RIGHT'].includes(code)) return;
    if (InputSettings.bind(this.waiting, code)) { this.waiting = undefined; this.status.setText('Salvo. As teclas valem ao entrar na fase.'); this.render(); }
    else this.status.setText('Tecla em uso. Escolha outra.');
  };
  constructor(private scene: Phaser.Scene, private onClose: () => void) {
    this.container = scene.add.container(0, 0).setDepth(9000).setScrollFactor(0);
    pinOverlay(this.scene,this.container);
    this.container.add(scene.add.rectangle(160,90,320,180,0x092d1c,0.97).setInteractive());
    this.container.add(addPixelText(scene,160,17,'CONTROLES',{scale:2,originX:0.5,color:0xffd479}));
    this.status = scene.add.text(160,139,'Clique em uma tecla para alterar.',{fontSize:'6px',fontFamily:'Arial',resolution:4,color:'#b9e7d9'}).setOrigin(0.5);
    this.container.add(this.status);
    this.container.add(addPixelText(scene,160,123,'Controle: A / X pular · Quadrado bater · Círculo lançar · Start pausa',{originX:0.5,scale:0.8}));
    const close=scene.add.text(160,158,'VOLTAR  ·  ESC',{fontSize:'9px',fontFamily:'Arial',resolution:4,color:'#ffd479'}).setOrigin(0.5).setInteractive({useHandCursor:true});
    close.on('pointerdown',()=>this.close());this.container.add(close);
    scene.input.keyboard?.on('keydown',this.listener);
    scene.events.once('shutdown',()=>this.close());
    this.render();
  }
  private render(): void {
    this.rows.forEach(row=>row.destroy()); this.rows=[];
    const labels={left:'Esquerda',right:'Direita',up:'Lançar acima',down:'Agachar / descer',jump:'Pular',attack:'Bater com o bastão',throw:'Lançar / buscar bastão'};
    Object.entries(InputSettings.bindings()).forEach(([action,code],i)=>{
      const y=37+i*11;
      const row=addPixelText(this.scene,38,y,labels[action as InputAction],{scale:0.85});
      const key=this.scene.add.text(268,y,code,{fontSize:'8px',fontFamily:'Arial',resolution:4,color:'#ffd479'}).setOrigin(1,0).setInteractive({useHandCursor:true});
      key.on('pointerdown',()=>{this.waiting=action as InputAction;this.status.setText('Pressione a nova tecla…');});
      this.rows.push(row,key);this.container.add([row,key]);
    });
  }
  close(): void { if(!this.container.active)return; this.scene.input.keyboard?.off('keydown',this.listener);this.container.destroy();this.onClose(); }
}
