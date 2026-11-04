import {test,expect,type Page} from '@playwright/test';
import {calculatePresentation, GAMEPLAY_CAMERA, INTERNAL_RENDER} from '../src/game/config/presentation';
import {LEVELS} from '../src/game/levels/levelConfig';
import {PLAYER_ART} from '../src/game/config/playerArt';
import {BATON} from '../src/game/config/batonConfig';

test('three-second splash uses real time even when the scene clock is slow',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>(window as any).__NILO__?.scene.isActive('preload'));
  const started=await page.evaluate(()=>{
    const s=(window as any).__NILO__.scene.getScene('preload');s.time.timeScale=.01;return s.startedAt;
  });
  await page.waitForFunction(()=>(window as any).__NILO__?.scene.isActive('title'),{},{timeout:6000});
  const elapsed=await page.evaluate(started=>performance.now()-started,started);
  expect(elapsed).toBeGreaterThanOrEqual(3000);expect(elapsed).toBeLessThan(6000);
});

async function start(page:Page){
  await page.goto('/');await page.waitForFunction(()=>(window as any).__NILO__?.scene.isActive('title'));
  await page.keyboard.press('Enter');await page.waitForFunction(()=>(window as any).__NILO__?.scene.isActive('game'));
  await page.waitForTimeout(400);
}
async function metrics(page:Page){return page.evaluate(()=>{
  const g=(window as any).__NILO__,s=g.scene.getScene('game'),p=s.player,c=s.cameras.main;
  const rect=g.canvas.getBoundingClientRect();
  return {layout:g.registry.get('presentation'),canvas:{width:g.canvas.width,height:g.canvas.height,x:rect.x,y:rect.y,w:rect.width,h:rect.height},
    world:{w:s.physics.world.bounds.width,h:s.physics.world.bounds.height},camera:{w:c.worldView.width,h:c.worldView.height,x:c.worldView.x,y:c.worldView.y},
    player:{w:p.displayWidth,h:p.displayHeight,bodyH:p.body.height,speed:p.body.maxVelocity.x},
    baton:g.textures.getFrame('baton').realWidth,gravity:s.physics.world.gravity.y};
});}
for(const [width,height] of [[1280,720],[1920,1080],[2560,1440],[3840,2160]]){
  test(`PC ${width}x${height}: fixed internal render, fixed logical scale, resize preserves simulation`,async({page})=>{
    await page.setViewportSize({width:width!,height:height!});await start(page);
    const m=await metrics(page);
    expect(m.world).toEqual({w:320,h:180});expect(m.camera).toEqual({w:320,h:180,x:0,y:0});
    expect(m.player).toEqual({w:32,h:32,bodyH:25,speed:PLAYER_ART.runSpeed});expect(m.baton).toBe(BATON.length);expect(m.gravity).toBe(900);
    expect(m.canvas.width).toBe(INTERNAL_RENDER.width);expect(m.canvas.height).toBe(INTERNAL_RENDER.height);
    expect(m.canvas.w).toBe(width);expect(m.canvas.h).toBe(height);
    expect(m.canvas.w/m.canvas.h).toBeCloseTo(16/9,4);
    await page.screenshot({path:`artifacts/lab-${width}.png`});
    await page.setViewportSize({width:1100,height:800});await page.waitForTimeout(150);
    const after=await metrics(page);expect(after.world).toEqual(m.world);expect(after.player).toEqual(m.player);
    expect(after.camera.w).toBeCloseTo(320);expect(after.canvas.w/after.canvas.h).toBeCloseTo(16/9,4);
  });
}
for(const viewport of [{width:960,height:432},{width:800,height:450},{width:932,height:430}]){
  test(`Android ${viewport.width}x${viewport.height}: safe rails and PC-equivalent proportions`,async({browser})=>{
    const context=await browser.newContext({viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true});
    const page=await context.newPage();await start(page);
    await page.evaluate(()=>{
      for(const [side,value] of Object.entries({left:28,right:16,top:8,bottom:12})) document.documentElement.style.setProperty('--safe-area-inset-'+side,value+'px');
    });await page.waitForTimeout(200);
    const m=await metrics(page);
    expect(m.world).toEqual({w:320,h:180});expect(m.camera.w).toBeCloseTo(320);expect(m.camera.h).toBeCloseTo(180);
    expect(m.player).toEqual({w:32,h:32,bodyH:25,speed:PLAYER_ART.runSpeed});expect(m.baton).toBe(BATON.length);expect(m.gravity).toBe(900);
    expect(m.canvas.w/m.canvas.h).toBeCloseTo(16/9,4);
    expect(m.canvas.width).toBe(INTERNAL_RENDER.width);expect(m.canvas.height).toBe(INTERNAL_RENDER.height);
    expect(m.canvas.x).toBeGreaterThanOrEqual(28);expect(m.canvas.y).toBeGreaterThanOrEqual(8);
    const buttons=await page.locator('.touch-controls button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
    for(const r of buttons){
      expect(r.x).toBeGreaterThanOrEqual(28);expect(r.y).toBeGreaterThanOrEqual(8);
      expect(r.right).toBeLessThanOrEqual(viewport.width-16);expect(r.bottom).toBeLessThanOrEqual(viewport.height-12);
      expect(r.right<=m.canvas.x+.01||r.x>=m.canvas.x+m.canvas.w-.01).toBe(true);
    }
    await page.screenshot({path:`artifacts/mobile-${viewport.width}.png`});
    await context.close();
  });
}
test('fullscreen and returning to window keep world and camera independent',async({page})=>{
  await start(page);const before=await metrics(page);
  await page.keyboard.press('F11');await page.waitForFunction(()=>!!document.fullscreenElement);
  await page.waitForTimeout(200);const full=await metrics(page);
  expect(full.world).toEqual(before.world);expect(full.player).toEqual(before.player);expect(full.camera.w).toBeCloseTo(320);
  await page.keyboard.press('F11');await page.waitForFunction(()=>!document.fullscreenElement);
});
test('safe area calculation does not depend on world size',()=>{
  for(const touch of [true,false])for(const [width,height] of [[3200,1440],[2400,1080],[1280,720],[3840,2160]]){
    const p=calculatePresentation(width!,height!,1,{left:48,right:24,top:16,bottom:32},touch);
    expect(p.viewport.width/p.viewport.height).toBeCloseTo(16/9,8);
    expect(p.viewport.x).toBeGreaterThanOrEqual(48);expect(p.viewport.y).toBeGreaterThanOrEqual(16);
    expect(p.viewport.x+p.viewport.width).toBeLessThanOrEqual(width!-24+.001);
    expect(p.viewport.y+p.viewport.height).toBeLessThanOrEqual(height!-32+.001);
  }
});
test('log contact and eight-phase locomotion use the fixed laboratory',async({page})=>{
  await start(page);
  await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');s.player.body.reset(92,88);s.player.setVelocity(0,0);});
  await page.waitForTimeout(400);
  const feet=await page.evaluate(()=>{const p=(window as any).__NILO__.scene.getScene('game').player;return {bottom:p.body.bottom,y:p.y,frame:p.frame.name};});
  expect(feet.bottom).toBeCloseTo(116,1);expect(feet.y+13).toBeCloseTo(116,1);
  await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');s.player.body.reset(30,143);s.player.setVelocity(0,0);});
  await page.keyboard.down('d');await page.waitForTimeout(220);
  const frames:number[]=[];
  for(let i=0;i<8;i++){frames.push(await page.evaluate(()=>Number((window as any).__NILO__.scene.getScene('game').player.frame.name)));await page.waitForTimeout(20);}
  await page.keyboard.up('d');expect(new Set(frames).size).toBeGreaterThanOrEqual(3);expect(frames.every(f=>f>=PLAYER_ART.walkStart&&f<PLAYER_ART.runStart+8)).toBe(true);
  await page.keyboard.press('k');await page.waitForTimeout(80);
  expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').baton.weapon.displayWidth)).toBe(BATON.length);
  const fixed=await metrics(page);expect(fixed.world).toEqual({w:320,h:180});expect(fixed.camera.w).toBeCloseTo(320);expect(fixed.player.h).toBe(32);
  expect(LEVELS.lab.world).not.toBe(GAMEPLAY_CAMERA);expect(LEVELS.lab.camera).not.toBe(LEVELS.lab.world);
  expect(LEVELS.lab.world).toEqual(GAMEPLAY_CAMERA);expect(LEVELS.lab.camera.mode).toBe('fixed');
});
test('title and pause mouse hit areas follow the viewport after resize',async({page})=>{
  await page.goto('/');await page.waitForFunction(()=>(window as any).__NILO__?.scene.isActive('title'));
  await page.setViewportSize({width:1920,height:1080});await page.waitForTimeout(100);
  const click=async(x:number,y:number)=>{const r=await page.locator('canvas').boundingBox();await page.mouse.click(r!.x+x/320*r!.width,r!.y+y/180*r!.height);};
  await click(160,125);
  expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('title').audio.isOpen)).toBe(true);
  await click(160,134);await click(160,143);
  expect(await page.evaluate(()=>!!(window as any).__NILO__.scene.getScene('title').controls)).toBe(true);
  await click(160,158);await click(160,89);
  await page.waitForFunction(()=>(window as any).__NILO__?.scene.isActive('game'));
  await page.keyboard.press('Escape');await page.setViewportSize({width:1100,height:800});await page.waitForTimeout(100);
  await click(160,79);
  expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').audioModal.isOpen)).toBe(true);
  await click(160,134);await click(160,64);
  expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').isPaused)).toBe(false);
});
