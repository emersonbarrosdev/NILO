import Phaser from 'phaser';
import { AudioSystem } from '../../systems/AudioSystem';
import { SCENE_KEYS } from '../../config/constants';
import { addPixelText } from '../../ui/PixelText';

export class GoalGate extends Phaser.Physics.Arcade.Sprite {
  public isCompleted = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'goal-gate');

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(3);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(24, 36);
    body.setOffset(4, 4);
  }

  public onPlayerReach(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;

    AudioSystem.get().stopBgm();
    AudioSystem.get().playVictory();

    // Banner festivo de vitória em pixel art
    const banner = addPixelText(this.scene, Math.round(this.x), Math.round(this.y - 32), 'FASE CONCLUIDA!', {
      scale: 1,
      color: 0xfde047,
      originX: 0.5,
      originY: 0.5,
      depth: 30,
    });
    this.scene.tweens.add({
      targets: banner,
      y: banner.y - 12,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Fogos de artifício e confetes comemorativos em pixel art
    const colors = [0xff5252, 0xffd740, 0x40c4ff, 0x69f0ae, 0xff4081, 0xffffff];
    for (let i = 0; i < 32; i++) {
      const p = this.scene.add.rectangle(
        this.x + Phaser.Math.Between(-16, 16),
        this.y + Phaser.Math.Between(-25, 5),
        2,
        2,
        Phaser.Utils.Array.GetRandom(colors),
      ).setDepth(20);

      this.scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-45, 45),
        y: p.y - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: Phaser.Math.Between(600, 1100),
        onComplete: () => p.destroy(),
      });
    }

    this.scene.time.delayedCall(1100, () => {
      this.scene.scene.stop(SCENE_KEYS.ui);
      this.scene.scene.start(SCENE_KEYS.stageClear, { stageId: '1-1' });
    });
  }
}

