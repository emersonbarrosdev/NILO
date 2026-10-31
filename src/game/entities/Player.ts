import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-placeholder');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setMaxVelocity(150, 500);
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.jumpKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const direction = Number(this.cursors.right.isDown) - Number(this.cursors.left.isDown);
    this.setVelocityX(direction * 110);

    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && body.blocked.down) {
      this.setVelocityY(-300);
    }
  }
}
