import Phaser from 'phaser';
import { AudioSystem } from '../../systems/AudioSystem';
import { SCENE_KEYS } from '../../config/constants';

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

    // Fogos de artifício comemorativos em pixel art
    const colors = [0xff5252, 0xffd740, 0x40c4ff, 0x69f0ae, 0xff4081];
    for (let i = 0; i < 18; i++) {
      const p = this.scene.add.rectangle(
        this.x + Phaser.Math.Between(-16, 16),
        this.y + Phaser.Math.Between(-25, 5),
        2,
        2,
        Phaser.Utils.Array.GetRandom(colors),
      ).setDepth(20);

      this.scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-30, 30),
        y: p.y - Phaser.Math.Between(15, 45),
        alpha: 0,
        duration: Phaser.Math.Between(400, 700),
        onComplete: () => p.destroy(),
      });
    }

    this.scene.time.delayedCall(800, () => {
      this.scene.scene.stop(SCENE_KEYS.ui);
      this.scene.scene.start(SCENE_KEYS.stageClear, { stageId: '1-1' });
    });
  }
}

