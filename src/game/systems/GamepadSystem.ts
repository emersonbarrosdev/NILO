export interface GamepadSnapshot {
  connected: boolean;
  padName: string;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  axisX: number;
  axisY: number;
  confirm: boolean;
  cancel: boolean;
  jump: boolean;
  attack: boolean;
  pause: boolean;
}

export class GamepadSystem {
  private static instance: GamepadSystem;

  private prevUp = false;
  private prevDown = false;
  private prevLeft = false;
  private prevRight = false;
  private prevConfirm = false;
  private prevCancel = false;
  private prevPause = false;

  private repeatTimer = 0;
  private lastDir: 'up' | 'down' | 'left' | 'right' | null = null;

  public static get(): GamepadSystem {
    if (!GamepadSystem.instance) {
      GamepadSystem.instance = new GamepadSystem();
    }
    return GamepadSystem.instance;
  }

  /**
   * Obtém o primeiro controle conectado (PS5, PS4, Xbox ou genérico)
   */
  private getActivePad(): Gamepad | null {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return null;
    }
    const pads = navigator.getGamepads();
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (p && p.connected) {
        return p;
      }
    }
    return null;
  }

  /**
   * Captura o estado atual completo do controle
   */
  public poll(): GamepadSnapshot {
    const pad = this.getActivePad();
    if (!pad) {
      return {
        connected: false,
        padName: '',
        left: false,
        right: false,
        up: false,
        down: false,
        axisX: 0,
        axisY: 0,
        confirm: false,
        cancel: false,
        jump: false,
        attack: false,
        pause: false,
      };
    }

    const btn = (idx: number) => {
      const b = pad.buttons[idx];
      return Boolean(b && (b.pressed || b.value > 0.5));
    };

    const axisX = pad.axes[0] ?? 0;
    const axisY = pad.axes[1] ?? 0;
    const deadzone = 0.35;

    const stickLeft = axisX < -deadzone;
    const stickRight = axisX > deadzone;
    const stickUp = axisY < -deadzone;
    const stickDown = axisY > deadzone;

    // D-Pad standard (12=up, 13=down, 14=left, 15=right)
    const dpadUp = btn(12);
    const dpadDown = btn(13);
    const dpadLeft = btn(14);
    const dpadRight = btn(15);

    const left = stickLeft || dpadLeft;
    const right = stickRight || dpadRight;
    const up = stickUp || dpadUp;
    const down = stickDown || dpadDown;

    // Mapeamento padrão PS5 / Universal:
    // 0 = Cruz (X) -> Confirmar / Pulo
    // 1 = Círculo (O) -> Cancelar / Estilingue
    // 2 = Quadrado ([]) -> Estilingue / Ataque
    // 3 = Triângulo (/\) -> Pulo secundário
    // 9 = Options / Start -> Pausa
    const confirm = btn(0);
    const cancel = btn(1);
    const jump = btn(0) || btn(3) || btn(4) || btn(5); // X, Triângulo, L1, R1
    const attack = btn(2) || btn(1) || btn(7) || btn(6); // Quadrado, Círculo, R2, L2
    const pause = btn(9); // Options / Start

    return {
      connected: true,
      padName: pad.id || 'PS5 DualSense / Gamepad',
      left,
      right,
      up,
      down,
      axisX,
      axisY,
      confirm,
      cancel,
      jump,
      attack,
      pause,
    };
  }

  /**
   * Navegação em menus com debounce de toque e repetição suave (Auto-Repeat)
   */
  public updateMenuNavigation(time: number): {
    upJustPressed: boolean;
    downJustPressed: boolean;
    leftJustPressed: boolean;
    rightJustPressed: boolean;
    confirmJustPressed: boolean;
    cancelJustPressed: boolean;
    pauseJustPressed: boolean;
  } {
    const s = this.poll();
    if (!s.connected) {
      this.prevUp = false;
      this.prevDown = false;
      this.prevLeft = false;
      this.prevRight = false;
      this.prevConfirm = false;
      this.prevCancel = false;
      this.prevPause = false;
      this.lastDir = null;
      return {
        upJustPressed: false,
        downJustPressed: false,
        leftJustPressed: false,
        rightJustPressed: false,
        confirmJustPressed: false,
        cancelJustPressed: false,
        pauseJustPressed: false,
      };
    }

    let upJustPressed = s.up && !this.prevUp;
    let downJustPressed = s.down && !this.prevDown;
    let leftJustPressed = s.left && !this.prevLeft;
    let rightJustPressed = s.right && !this.prevRight;

    // Lógica de repetição ao segurar direcional no menu
    const currentDir: 'up' | 'down' | 'left' | 'right' | null =
      s.up ? 'up' : s.down ? 'down' : s.left ? 'left' : s.right ? 'right' : null;

    if (currentDir && currentDir === this.lastDir) {
      if (time > this.repeatTimer) {
        if (currentDir === 'up') upJustPressed = true;
        if (currentDir === 'down') downJustPressed = true;
        if (currentDir === 'left') leftJustPressed = true;
        if (currentDir === 'right') rightJustPressed = true;
        this.repeatTimer = time + 180;
      }
    } else if (currentDir) {
      this.lastDir = currentDir;
      this.repeatTimer = time + 360; // Delay inicial antes da repetição
    } else {
      this.lastDir = null;
    }

    const confirmJustPressed = s.confirm && !this.prevConfirm;
    const cancelJustPressed = s.cancel && !this.prevCancel;
    const pauseJustPressed = s.pause && !this.prevPause;

    this.prevUp = s.up;
    this.prevDown = s.down;
    this.prevLeft = s.left;
    this.prevRight = s.right;
    this.prevConfirm = s.confirm;
    this.prevCancel = s.cancel;
    this.prevPause = s.pause;

    return {
      upJustPressed,
      downJustPressed,
      leftJustPressed,
      rightJustPressed,
      confirmJustPressed,
      cancelJustPressed,
      pauseJustPressed,
    };
  }
}

