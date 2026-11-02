import Phaser from 'phaser';
import { GameState } from '../../systems/GameState';
import { AudioSystem } from '../../systems/AudioSystem';
import { addPixelText } from '../../ui/PixelText';

export class LifeItem extends Phaser.Physics.Arcade.Sprite {
  private isCollected = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'item-life');

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(5);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(12, 12);

    scene.tweens.add({
      targets: this,
      y: y - 5,
      rotation: 0.1,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
  }

  public collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;

    AudioSystem.get().playOneUp();
    GameState.get().addLife(1);

    const notice = addPixelText(this.scene, Math.round(this.x), Math.round(this.y - 12), '+1 VIDA!', {
      scale: 1,
      color: 0xfde047,
      originX: 0.5,
      originY: 0.5,
      depth: 25,
    });
    this.scene.tweens.add({
      targets: notice,
      y: notice.y - 16,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => notice.destroy(),
    });

    this.scene.tweens.add({
      targets: this,
      y: this.y - 18,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => this.destroy(),
    });
  }
}

