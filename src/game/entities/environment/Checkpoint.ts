import Phaser from 'phaser';
import { GameState } from '../../systems/GameState';
import { AudioSystem } from '../../systems/AudioSystem';


export class Checkpoint extends Phaser.Physics.Arcade.Sprite {
  public id: string;
  public isActivated = false;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
    super(scene, x, y, 'checkpoint-pole-inactive');
    this.id = id;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body
    this.setDepth(3);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(16, 28);

  }

  public activate(): void {
    if (this.isActivated) return;
    this.isActivated = true;

    this.setTexture('checkpoint-pole-active');
    AudioSystem.get().playCheckpoint();
    GameState.get().setCheckpoint(this.id, this.x, this.y);

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

