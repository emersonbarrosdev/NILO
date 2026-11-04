export const touchInput = { left: false, right: false, up: false, down: false, jump: false, attack: false, throw: false };
export type InputAction = keyof typeof touchInput;
const defaults: Record<InputAction, string> = { left: 'A', right: 'D', up: 'W', down: 'S', jump: 'SPACE', attack: 'J', throw: 'K' };
export class InputSettings {
  static bindings(): Record<InputAction, string> {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem('nilo.controls.v1') || '{}') }; }
    catch { return { ...defaults }; }
  }
  static bind(action: InputAction, code: string): boolean {
    const bindings = this.bindings();
    if (Object.entries(bindings).some(([key, val]) => key !== action && val === code)) return false;
    bindings[action] = code;
    localStorage.setItem('nilo.controls.v1', JSON.stringify(bindings));
    return true;
  }
  static resetTouch(): void { for (const key of Object.keys(touchInput) as InputAction[]) touchInput[key] = false; }
}
