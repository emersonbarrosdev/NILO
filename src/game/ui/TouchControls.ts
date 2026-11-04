import Phaser from 'phaser';
import { InputSettings, touchInput, type InputAction } from '../systems/InputSettings';

export function installTouchControls(game: Phaser.Game): void {
  if (!matchMedia('(pointer: coarse)').matches) return;
  const root = document.createElement('div');
  root.className = 'touch-controls'; root.setAttribute('aria-label', 'Controle do jogo');
  const buttons: [InputAction, string, string][] = [
    ['left','←','left'], ['right','→','right'], ['up','↑','up'], ['down','↓','down'],
    ['attack','BATER','attack'], ['throw','LANÇAR','throw'], ['jump','PULO','jump'],
  ];
  const left=document.createElement('div'),right=document.createElement('div');
  left.className='control-rail left-rail';right.className='control-rail right-rail';root.append(left,right);
  for (const [action,label,position] of buttons) {
    const button = document.createElement('button'); button.textContent = label;
    button.className = position; button.setAttribute('aria-label', action);
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); button.setPointerCapture(event.pointerId); touchInput[action] = true;
    });
    const release = () => { touchInput[action] = false; };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release); (['left','right','up','down'].includes(action)?left:right).append(button);
  }
  const pause = document.createElement('button'); pause.textContent = 'Ⅱ'; pause.className = 'pause';
  pause.setAttribute('aria-label','Pausar');
  pause.addEventListener('click',()=>game.scene.getScene('game').events.emit('touch-pause'));
  right.append(pause); document.body.append(root);
  let wasVisible = false;
  game.events.on('step',()=>{
    const visible = game.scene.isActive('game');
    if (visible === wasVisible) return;
    root.hidden = !visible; wasVisible = visible; InputSettings.resetTouch();
  });
  root.hidden = true;
  window.addEventListener('blur',()=>InputSettings.resetTouch());
  document.addEventListener('visibilitychange',()=>InputSettings.resetTouch());
}
