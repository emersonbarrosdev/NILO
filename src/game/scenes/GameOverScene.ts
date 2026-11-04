import { bindCamera } from '../systems/PresentationSystem';
import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { addPixelText } from '../ui/PixelText';
import { GameState } from '../systems/GameState';
import { AudioSystem } from '../systems/AudioSystem';
import { GamepadSystem } from '../systems/GamepadSystem';

export class GameOverScene extends Phaser.Scene {
  private timerSeconds = 9;
  private timerText?: Phaser.GameObjects.GameObject;
  private timerRing?: Phaser.GameObjects.Arc;
  private countdownEvent?: Phaser.Time.TimerEvent;
  private selectedIndex = 0; // 0 = Continuar, 1 = Desistir
  private menuItems: Phaser.GameObjects.GameObject[] = [];
  private menuHitZones: Phaser.GameObjects.Rectangle[] = [];
  private menuPills: Phaser.GameObjects.Rectangle[] = [];
  private hasChosen = false;
  private niloSprite?: Phaser.GameObjects.Sprite;
  private campfireSprite?: Phaser.GameObjects.Sprite;

  constructor() {
    super(SCENE_KEYS.gameOver);
  }

  create(): void {
    bindCamera(this);
    this.add.image(160,90,'forest-backdrop').setDisplaySize(320,180).setDepth(-100);
    this.add.rectangle(160,90,320,180,0x061e12,.75).setDepth(-99);
    this.hasChosen = false;
    this.selectedIndex = 0;
    this.menuItems = [];
    this.menuHitZones = [];
    this.menuPills = [];

    // Inicia a comovente e acolhedora trilha sonora de Continue (estilo DKC / Mario / Sonic)
    AudioSystem.get().startBgm('continue');

    // 2. VIGNETTE VIVA: NILO DESCANSANDO NA FOGUEIRA
    // Fogueira de acampamento animada
    this.campfireSprite = this.add.sprite(52, 160, 'decor-campfire').setDepth(3);
    this.campfireSprite.play('campfire-burn');

    // Iluminação âmbar da fogueira projetada no chão
    const fireGlow = this.add.circle(52, 162, 22, 0xf59e0b, 0.18).setDepth(2);
    this.tweens.add({
      targets: fireGlow,
      alpha: { from: 0.12, to: 0.25 },
      scale: { from: 0.9, to: 1.15 },
      duration: 350,
      yoyo: true,
      repeat: -1,
    });

    // Nilo descansando sentado ao lado do fogo (pose pensativa e determinada)
    this.niloSprite = this.add.sprite(26, 154, 'player-sheet', 0).setDepth(4);
    this.niloSprite.setFlipX(false);
    // Respiração suave
    this.tweens.add({
      targets: this.niloSprite,
      scaleY: 0.95,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Balão de pensamento com mini ícone de determinação
    const thoughtBubble = this.add.circle(38, 140, 2, 0xffffff, 0.75).setDepth(5);
    const thoughtGlow = this.add.image(44, 134, 'ui-stamp-mini').setDepth(5).setScale(0.85);
    this.tweens.add({
      targets: [thoughtBubble, thoughtGlow],
      y: '-=3',
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. PLACA DE MADEIRA ENTALHADA (ESTILO DONKEY KONG COUNTRY & MARIO WORLD)
    const plaqueCenterX = 196;
    const plaqueCenterY = 82;
    this.add.image(plaqueCenterX, plaqueCenterY, 'ui-continue-plaque').setDepth(5);

    // Título "GAME OVER" entalhado em relevo
    addPixelText(this, plaqueCenterX + 1, 32 + 1, 'GAME OVER', {
      scale: 2,
      color: 0x1f140d,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(6);
    addPixelText(this, plaqueCenterX, 32, 'GAME OVER', {
      scale: 2,
      color: 0xef4444,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(6);

    // Subtítulo "CONTINUAR?" com pulsação acolhedora
    const continueTitle = addPixelText(this, plaqueCenterX, 49, 'CONTINUAR?', {
      scale: 1,
      color: 0xfde047,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(6);

    this.tweens.add({
      targets: continueTitle,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Medalhão de pedra e latão para o contador regressivo
    this.add.circle(plaqueCenterX, 78, 17, 0x1f140d).setDepth(6);
    this.timerRing = this.add.circle(plaqueCenterX, 78, 16, 0x271408)
      .setStrokeStyle(2, 0xd97706, 0.95)
      .setDepth(6);

    this.timerSeconds = 9;
    this.renderTimer(plaqueCenterX, 78);

    // Contador regressivo de 9 segundos
    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      repeat: 8,
      callback: () => {
        if (this.hasChosen) return;
        this.timerSeconds--;
        this.renderTimer(plaqueCenterX, 78);
        AudioSystem.get().playMenuNavigate();

        if (this.timerRing) {
          this.tweens.add({
            targets: this.timerRing,
            scaleX: 1.25,
            scaleY: 1.25,
            duration: 80,
            yoyo: true,
          });
        }

        if (this.timerSeconds <= 0) {
          this.doQuit();
        }
      },
    });

    // Menu Interativo: CONTINUAR / DESISTIR
    this.renderMenu(plaqueCenterX);

    // Controles por teclado com limpeza garantida no shutdown
    const onUp = () => this.changeSelection(-1, plaqueCenterX);
    const onDown = () => this.changeSelection(1, plaqueCenterX);
    const onConfirm = () => this.confirmSelection();
    const onQuit = () => this.doQuit();

    this.input.keyboard?.on('keydown-UP', onUp);
    this.input.keyboard?.on('keydown-W', onUp);
    this.input.keyboard?.on('keydown-DOWN', onDown);
    this.input.keyboard?.on('keydown-S', onDown);
    this.input.keyboard?.on('keydown-ENTER', onConfirm);
    this.input.keyboard?.on('keydown-SPACE', onConfirm);
    this.input.keyboard?.on('keydown-ESC', onQuit);

    const cleanup = () => {
      this.input.keyboard?.off('keydown-UP', onUp);
      this.input.keyboard?.off('keydown-W', onUp);
      this.input.keyboard?.off('keydown-DOWN', onDown);
      this.input.keyboard?.off('keydown-S', onDown);
      this.input.keyboard?.off('keydown-ENTER', onConfirm);
      this.input.keyboard?.off('keydown-SPACE', onConfirm);
      this.input.keyboard?.off('keydown-ESC', onQuit);
    };

    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  update(time: number): void {
    if (this.hasChosen) return;
    const pad = GamepadSystem.get().updateMenuNavigation(time);

    if (pad.upJustPressed) this.changeSelection(-1, 196);
    if (pad.downJustPressed) this.changeSelection(1, 196);
    if (pad.confirmJustPressed) this.confirmSelection();
    if (pad.cancelJustPressed) this.doQuit();
  }

  private renderTimer(centerX: number, centerY: number): void {
    this.timerText?.destroy();
    const isEmergency = this.timerSeconds <= 3;
    const color = isEmergency ? 0xef4444 : 0xfffbeb;

    this.timerText = addPixelText(this, centerX, centerY, String(this.timerSeconds), {
      scale: 3,
      color,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(7);

    if (this.timerRing && isEmergency) {
      this.timerRing.setStrokeStyle(2, 0xef4444, 1);
    }
  }

  private renderMenu(centerX: number): void {
    this.menuItems.forEach((item) => item.destroy());
    this.menuItems = [];
    this.menuHitZones.forEach((h) => h.destroy());
    this.menuHitZones = [];
    this.menuPills.forEach((p) => p.destroy());
    this.menuPills = [];

    const options = [
      { label: 'SIM, CONTINUAR!', action: () => this.doContinue() },
      { label: 'DESISTIR (MENU)', action: () => this.doQuit() },
    ];

    options.forEach((opt, idx) => {
      const isSelected = idx === this.selectedIndex;
      const y = 108 + idx * 16;

      // Pílula de destaque entalhada na madeira
      if (isSelected) {
        const pill = this.add.rectangle(centerX, y, 146, 13, 0x78350f, 0.95)
          .setStrokeStyle(1, 0xfde047, 0.9)
          .setDepth(6);
        this.menuPills.push(pill);
      }

      const prefix = isSelected ? '> ' : '  ';
      const color = isSelected ? 0xfffbeb : 0xd6d3d1;

      const item = addPixelText(this, centerX, y, `${prefix}${opt.label}`, {
        scale: 1,
        color,
        originX: 0.5,
        originY: 0.5,
      }).setDepth(7);

      this.menuItems.push(item);

      // Suporte a Mouse no PC (hover e clique com cursor)
      const hitZone = this.add.rectangle(centerX, y, 150, 14, 0x000000, 0.001)
        .setDepth(8)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerover', () => {
        if (this.selectedIndex !== idx) {
          this.selectedIndex = idx;
          AudioSystem.get().playMenuNavigate();
          this.renderMenu(centerX);
        }
      });

      hitZone.on('pointerdown', () => {
        this.selectedIndex = idx;
        this.confirmSelection();
      });

      this.menuHitZones.push(hitZone);
    });

    const bottomHelp = addPixelText(this, centerX, 138, 'MOUSE / ENTER / [X] PS5', {
      scale: 1,
      color: 0x94a3b8,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(7);
    this.menuItems.push(bottomHelp);
  }

  private changeSelection(dir: number, centerX: number): void {
    if (this.hasChosen) return;
    this.selectedIndex = (this.selectedIndex + dir + 2) % 2;
    AudioSystem.get().playMenuNavigate();
    this.renderMenu(centerX);
  }

  private confirmSelection(): void {
    if (this.hasChosen) return;
    if (this.selectedIndex === 0) {
      this.doContinue();
    } else {
      this.doQuit();
    }
  }

  private doContinue(): void {
    if (this.hasChosen) return;
    this.hasChosen = true;
    this.countdownEvent?.remove();
    AudioSystem.get().stopBgm();

    // Fanfarra triunfante de renascimento
    AudioSystem.get().playContinueFanfare();

    // Nilo salta de volta para a ação com energia!
    if (this.niloSprite) {
      this.niloSprite.setFrame(24); // Salto
      this.tweens.add({
        targets: this.niloSprite,
        y: '-=18',
        duration: 250,
        yoyo: true,
      });
    }

    GameState.get().continueGame();

    // Transição suave com flash solar
    this.cameras.main.fade(350, 255, 255, 255, false, (_cam: unknown, progress: number) => {
      if (progress === 1) {
        this.scene.start(SCENE_KEYS.game, { stageId: GameState.get().currentStage, isContinue: true });
      }
    });
  }

  private doQuit(): void {
    if (this.hasChosen) return;
    this.hasChosen = true;
    this.countdownEvent?.remove();
    AudioSystem.get().stopBgm();
    AudioSystem.get().playMenuSelect();

    this.cameras.main.fade(300, 0, 0, 0, false, (_cam: unknown, progress: number) => {
      if (progress === 1) {
        this.scene.start(SCENE_KEYS.title);
      }
    });
  }
}
