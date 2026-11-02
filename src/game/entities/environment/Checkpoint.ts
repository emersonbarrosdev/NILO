import Phaser from 'phaser';
import { GameState } from '../../systems/GameState';
import { AudioSystem } from '../../systems/AudioSystem';

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

    // Efeito de brilho ascendente
    const spark = this.scene.add.graphics().setDepth(15);
    spark.fillStyle(0xfff066, 1);
    for (let i = 0; i < 5; i++) {
      spark.fillRect(this.x - 6 + i * 3, this.y - 10 - i * 3, 2, 2);
    }
    this.scene.tweens.add({
      targets: spark,
      y: '-=16',
      alpha: 0,
      duration: 350,
      onComplete: () => spark.destroy(),
    });
  }
}

