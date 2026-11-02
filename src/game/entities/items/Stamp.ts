import Phaser from 'phaser';
import { GameState } from '../../systems/GameState';
import { AudioSystem } from '../../systems/AudioSystem';

export class Stamp extends Phaser.Physics.Arcade.Sprite {
  private isCollected = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'item-stamp-sheet');

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(5);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(10, 10);
    this.play('stamp-spin');

    // Suave flutuação
    scene.tweens.add({
      targets: this,
      y: y - 3,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;

    const gotLife = GameState.get().addStamps(1);
    if (gotLife) {
      AudioSystem.get().playOneUp();
    } else {
      AudioSystem.get().playStamp();
    }

    this.scene.tweens.add({
      targets: this,
      y: this.y - 14,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 180,
      onComplete: () => this.destroy(),
    });
  }
}

