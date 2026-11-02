import Phaser from 'phaser';
import { GameState } from '../../systems/GameState';
import { AudioSystem } from '../../systems/AudioSystem';

export class HeartItem extends Phaser.Physics.Arcade.Sprite {
  private isCollected = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'item-heart-sheet');

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(5);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(10, 10);
    this.play('heart-pulse');
  }

  public collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;

    AudioSystem.get().playHeart();
    GameState.get().addHp(1);

    this.scene.tweens.add({
      targets: this,
      y: this.y - 12,
      alpha: 0,
      duration: 180,
      onComplete: () => this.destroy(),
    });
  }
}

