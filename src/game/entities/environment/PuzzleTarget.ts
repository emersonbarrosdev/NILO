import Phaser from 'phaser';
import { AudioSystem } from '../../systems/AudioSystem';

export class PuzzleTarget extends Phaser.Physics.Arcade.Sprite {
  public isHit = false;
  readonly requireCharged: boolean;
  private onTrigger?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    onTrigger?: () => void,
    requireCharged = false,
  ) {
    super(scene, x, y, requireCharged ? 'puzzle-target-idle' : 'puzzle-target-idle');
    this.onTrigger = onTrigger;
    this.requireCharged = requireCharged;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(4);

    if (requireCharged) {
      // Diferenciação visual para alvo reforçado/carregado (tom azulado e brilho sutil)
      this.setTint(0x7dd3fc);
    }

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(22, 22);
  }

  public hit(isCharged = false): boolean {
    if (this.isHit) return false;

    // Se o alvo exige tiro carregado e o projétil não estava carregado:
    if (this.requireCharged && !isCharged) {
      AudioSystem.get().playHit(); // Som de ricochete metálico
      this.scene.tweens.add({
        targets: this,
        x: this.x + 2,
        duration: 40,
        yoyo: true,
        repeat: 3,
      });
      return false;
    }

    this.isHit = true;
    this.clearTint();
    this.setTexture('puzzle-target-hit');
    AudioSystem.get().playPuzzleSwitch();

    // Vibração de impacto triunfante
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 90,
      yoyo: true,
      repeat: 2,
    });

    if (this.onTrigger) {
      this.onTrigger();
    }
    return true;
  }
}


