import Phaser from 'phaser';
import { GameState } from '../../systems/GameState';
import { AudioSystem } from '../../systems/AudioSystem';
import { addPixelText } from '../../ui/PixelText';

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

    const notice = addPixelText(this.scene, Math.round(this.x), Math.round(this.y - 10), '+1 VIDA!', {
      scale: 1,
      color: 0xff4d4d,
      originX: 0.5,
      originY: 0.5,
      depth: 25,
    });
    this.scene.tweens.add({
      targets: notice,
      y: notice.y - 14,
      alpha: 0,
      duration: 550,
      ease: 'Cubic.easeOut',
      onComplete: () => notice.destroy(),
    });

    this.scene.tweens.add({
      targets: this,
      y: this.y - 12,
      alpha: 0,
      duration: 180,
      onComplete: () => this.destroy(),
    });
  }
}

