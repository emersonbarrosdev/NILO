import Phaser from 'phaser';
import { GameState } from '../../systems/GameState';
import { AudioSystem } from '../../systems/AudioSystem';

export class Postcard extends Phaser.Physics.Arcade.Sprite {
  public id: string;
  private isCollected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
    super(scene, x, y, 'item-postcard');
    this.id = id;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(5);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(14, 12);

    scene.tweens.add({
      targets: this,
      y: y - 4,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public collect(): void {
    if (this.isCollected) return;
    this.isCollected = true;

    AudioSystem.get().playPostcard();
    GameState.get().collectPostcard(this.id);

    // Efeito de brilho de segredo descoberto
    const shine = this.scene.add.graphics().setDepth(15);
    shine.fillStyle(0xfff7a8, 1);
    for (let i = 0; i < 6; i++) {
      shine.fillRect(this.x - 8 + i * 3, this.y - 8 + ((i % 3) * 4), 3, 3);
    }
    this.scene.tweens.add({
      targets: shine,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => shine.destroy(),
    });

    this.scene.tweens.add({
      targets: this,
      y: this.y - 20,
      alpha: 0,
      duration: 250,
      onComplete: () => this.destroy(),
    });
  }
}

