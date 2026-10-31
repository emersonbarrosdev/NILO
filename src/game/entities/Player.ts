import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private jumpKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-placeholder');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setMaxVelocity(150, 500);

    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const movingLeft = this.cursors.left.isDown || this.keyA.isDown;
    const movingRight = this.cursors.right.isDown || this.keyD.isDown;
    const pressingDown = this.cursors.down.isDown || this.keyS.isDown;

    let direction = Number(movingRight) - Number(movingLeft);
    if (pressingDown && body.blocked.down) {
      direction = 0;
    }

    this.setVelocityX(direction * 110);

    const wantsToJump =
      Phaser.Input.Keyboard.JustDown(this.jumpKey) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up);

    if (wantsToJump && body.blocked.down) {
      this.setVelocityY(-300);
    }
  }
}
