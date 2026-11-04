import Phaser from 'phaser';
import { calculatePresentation, UI_CAMERA, type Insets } from '../config/presentation';

/** Bind a logical camera to the backing canvas, without changing the world. */
export function bindCamera(scene: Phaser.Scene, size: {width:number;height:number}=UI_CAMERA, fixed=true): void {
  const resize=()=>{
    const camera=scene.cameras.main;
    camera.setSize(scene.scale.width,scene.scale.height).setZoom(scene.scale.width/size.width);
    if(fixed) camera.centerOn(size.width/2,size.height/2);
  };
  resize(); scene.scale.on('resize',resize);
  scene.events.once('shutdown',()=>scene.scale.off('resize',resize));
}

/** Screen UI in logical 320x180 coordinates, including on a scrolling world camera. */
export function pinOverlay(scene:Phaser.Scene, container:Phaser.GameObjects.Container):void {
  const place=()=>{
    const c=scene.cameras.main, scale=c.width/c.zoom/UI_CAMERA.width;
    container.setScrollFactor(0,0,true).setScale(scale)
      .setPosition((c.width-UI_CAMERA.width*scale)/2,(c.height-UI_CAMERA.height*scale)/2);
  };
  place(); scene.events.on('prerender',place);
  const cleanup=()=>scene.events.off('prerender',place);
  container.once('destroy',cleanup);scene.events.once('shutdown',cleanup);
}

export function installPresentation(game:Phaser.Game):void {
  const probe=document.createElement('div');
  probe.className='safe-area-probe';document.body.append(probe);
  let lastRails="";
  const apply=()=>{
    if(!game.canvas)return;
    const style=getComputedStyle(probe);
    const insets:Insets={left:parseFloat(style.paddingLeft)||0,right:parseFloat(style.paddingRight)||0,
      top:parseFloat(style.paddingTop)||0,bottom:parseFloat(style.paddingBottom)||0};
    const layout=calculatePresentation(window.visualViewport?.width ?? document.documentElement.clientWidth,window.visualViewport?.height ?? document.documentElement.clientHeight,window.devicePixelRatio,insets,matchMedia('(pointer: coarse)').matches);
    game.registry.set('presentation',layout);
    if(game.scale.width!==layout.render.width||game.scale.height!==layout.render.height) game.scale.resize(layout.render.width,layout.render.height);
    const v=layout.viewport;
    Object.assign(game.canvas.style,{position:'absolute',left:`${v.x}px`,top:`${v.y}px`,width:`${v.width}px`,height:`${v.height}px`});
    game.scale.refresh();
    const rails=JSON.stringify(layout.controls);
    if(rails===lastRails)return;lastRails=rails;
    for(const side of ['left','right'] as const){
      const rail=layout.controls?.[side];if(!rail)continue;
      for(const [key,value] of Object.entries(rail))document.documentElement.style.setProperty(`--rail-${side}-${key}`,`${value}px`);
    }
  };
  let frame=0;
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(apply);};
  if(game.isBooted)apply();else game.events.once(Phaser.Core.Events.READY,apply);
  window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
  document.addEventListener('fullscreenchange',schedule);
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['style']});
  const media=matchMedia('(pointer: coarse)');media.addEventListener('change',schedule);
  const fullscreen=(event:KeyboardEvent)=>{
    if(event.code!=='F11'||navigator.userAgent.includes('Electron'))return;
    event.preventDefault();
    if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen();
  };
  window.addEventListener('keydown',fullscreen);
  game.events.once('destroy',()=>{
    observer.disconnect();cancelAnimationFrame(frame);probe.remove();window.removeEventListener('resize',schedule);
    window.visualViewport?.removeEventListener('resize',schedule);document.removeEventListener('fullscreenchange',schedule);
    media.removeEventListener('change',schedule);window.removeEventListener('keydown',fullscreen);
  });
}
