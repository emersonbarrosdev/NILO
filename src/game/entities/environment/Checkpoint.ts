import Phaser from 'phaser';
import { GameState } from '../../systems/GameState';
import { AudioSystem } from '../../systems/AudioSystem';
import { addPixelText } from '../../ui/PixelText';

export class Checkpoint extends Phaser.Physics.Arcade.Sprite {
  public id: string;
  public isActivated = false;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
    super(scene, x, y, 'checkpoint-totem-sheet');
    this.id = id;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body
    this.setDepth(3);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(16, 28);
    this.play('checkpoint-idle');
  }

  public activate(): void {
    if (this.isActivated) return;
    this.isActivated = true;

    this.play('checkpoint-activate');
    AudioSystem.get().playCheckpoint();
    GameState.get().setCheckpoint(this.id, this.x, this.y);

    // Feedback flutuante em pixel art
    const notice = addPixelText(this.scene, Math.round(this.x), Math.round(this.y - 20), 'CHECKPOINT ATIVADO!', {
      scale: 1,
      color: 0x4ade80,
      originX: 0.5,
      originY: 0.5,
      depth: 25,
    });
    this.scene.tweens.add({
      targets: notice,
      y: notice.y - 18,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => notice.destroy(),
    });

    // Efeito de brilho ascendente com anel de centelhas
    const spark = this.scene.add.graphics().setDepth(15);
    spark.fillStyle(0xfff066, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      spark.fillRect(this.x + Math.cos(angle) * 8 - 1, this.y - 8 + Math.sin(angle) * 8 - 1, 2, 2);
    }
    this.scene.tweens.add({
      targets: spark,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 400,
      onComplete: () => spark.destroy(),
    });
  }
}

