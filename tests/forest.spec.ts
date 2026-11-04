import { test, expect, type Page } from '@playwright/test';
async function start(page:Page){
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.waitForFunction(()=>(window as any).__NILO__?.scene.isActive('title'));
 await page.keyboard.press('Enter');await page.waitForFunction(()=>(window as any).__NILO__?.scene.isActive('game'));
 await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').scene.restart({levelId:'forest'}));
 await page.waitForTimeout(300);return errors;
}
async function at(page:Page,x:number,y=141){await page.evaluate(([x,y])=>{const s=(window as any).__NILO__.scene.getScene('game');s.player.body.reset(x,y);s.player.setVelocity(0,0);s.cameras.main.centerOn(x+38,112.5);},[x,y]);}
async function tap(page:Page,key:string){await page.keyboard.down(key);await page.waitForTimeout(80);await page.keyboard.up(key);await page.waitForTimeout(280);}

test('movement, variable jump, pause freezes simulation, audio, restart',async({page})=>{
 const errors=await start(page);
 await page.keyboard.down('d');await page.waitForTimeout(700);await page.keyboard.up('d');
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.x)).toBeGreaterThan(80);
 await page.keyboard.down('Space');await page.waitForTimeout(180);
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.y)).toBeLessThan(115);
 await page.keyboard.up('Space');await page.waitForTimeout(750);
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.body.blocked.down)).toBe(true);
 await page.keyboard.press('Escape');
 const before=await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').playTime);
 await page.waitForTimeout(400);expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').playTime)).toBe(before);
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').audioModal.isOpen)).toBe(true);
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').isPaused)).toBe(false);
 await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').scene.restart());await page.waitForTimeout(400);
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').physics.world.colliders.getActive().length)).toBeLessThan(130);
 expect(errors).toEqual([]);
});

test('pushable step, crate socket opens return route, low tunnel keeps crouch',async({page})=>{
 const errors=await start(page);await at(page,1305);
 await page.keyboard.down('d');await page.waitForTimeout(1100);await page.keyboard.up('d');
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').children.list.find((o:any)=>o.constructor.name==='PushCrate').x)).toBeGreaterThan(1345);
 await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');const c=s.children.list.filter((o:any)=>o.constructor.name==='PushCrate')[1];c.setX(2060);c.body.updateFromGameObject();});
 await at(page,2036,207);await page.keyboard.down('d');await page.waitForTimeout(1000);await page.keyboard.up('d');
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').children.list.filter((o:any)=>o.constructor.name==='PushCrate')[1].docked)).toBe(true);
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').solidSurfaces.filter((o:any)=>o.body&&!o.body.enable).length)).toBe(2);
 await at(page,2660,129);await page.keyboard.down('s');await page.keyboard.down('d');await page.waitForTimeout(1200);await page.keyboard.up('s');await page.waitForTimeout(200);
 expect(await page.evaluate(()=>{const p=(window as any).__NILO__.scene.getScene('game').player;return p.isCrouching&&p.body.height===17&&p.x>2690&&p.x<2775;})).toBe(true);
 await page.waitForTimeout(2000);await page.keyboard.up('d');
 expect(await page.evaluate(()=>{const p=(window as any).__NILO__.scene.getScene('game').player;return p.x>2780&&!p.isCrouching;})).toBe(true);
 expect(errors).toEqual([]);
});

test('baton melee stuns then defeats, no stomp, direct lives and invulnerability',async({page})=>{
 const errors=await start(page);await at(page,1100);
 await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game'),e=s.enemies[0];s.player.body.reset(1120,141);s.player.setVelocity(0,0);e.body.reset(1140,147);e.patrolMinX=1140;e.patrolMaxX=1141;});
 await tap(page,'j');
 expect(await page.evaluate(()=>{const e=(window as any).__NILO__.scene.getScene('game').enemies[0];return e.hp===1&&e.isStunned;})).toBe(true);
 await tap(page,'j');await page.waitForTimeout(100);
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').enemies.every((e:any)=>e.x>1200||e.isDefeated))).toBe(true);
 await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');s.player.isInvulnerable=false;s.player.receiveDamage(1,1200);s.player.receiveDamage(1,1200);});
 await page.waitForTimeout(60);
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('ui').lives.text)).toBe('× 2');
 await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game'),e=s.enemies.find((e:any)=>e.constructor.name==='HopperEnemy');s.player.isInvulnerable=true;s.player.body.setVelocityY(100);s.player.setY(e.y-8);e.onPlayerOverlap(s.player);});
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').enemies.find((e:any)=>e.constructor.name==='HopperEnemy').isStunned)).toBe(false);
 expect(errors).toEqual([]);
});

test('throw uses one baton, empty hands, pit recovery, pickup and breakable crate',async({page})=>{
 const errors=await start(page);await at(page,200);
 await tap(page,'k');
 expect(await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');return !s.player.hasBaton&&s.player.texture.key==='player-unarmed-sheet'&&!!s.baton.dropped;})).toBe(true);
 await tap(page,'k');expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').children.list.filter((o:any)=>o.texture?.key==='baton').length)).toBe(1);
 await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');s.baton.dropped.body.reset(300,450);});await page.waitForTimeout(150);
 expect(await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');return Math.abs(s.baton.dropped.x-s.player.x)<25&&s.baton.dropped.y<180;})).toBe(true);
 await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');s.player.body.reset(s.baton.dropped.x,141);});await page.waitForTimeout(500);
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.hasBaton)).toBe(true);
 await at(page,2614,129);await tap(page,'j');
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').breakables[0].active)).toBe(false);
 expect(errors).toEqual([]);
});

test('monkey arena: banana pattern, one hit/window, rage at half, charges, clear',async({page})=>{
 const errors=await start(page);await at(page,7780);
 await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.isInvulnerable=true);
 await page.waitForFunction(()=>(window as any).__NILO__.scene.getScene('game').boss.phase==='throw-warn');
 expect(await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');s.boss.takeDamage(1);return s.boss.hp===8&&s.boss.entrance.body.enable;})).toBe(true);
 await page.waitForFunction(()=>(window as any).__NILO__.scene.getScene('game').boss.phase==='rest');
 expect(await page.evaluate(()=>{const b=(window as any).__NILO__.scene.getScene('game').boss;b.takeDamage(1);b.takeDamage(1);return b.hp===7&&b.bananas.length===1;})).toBe(true);
 // Advance remaining first-phase recovery windows without waiting through identical cycles.
 await page.evaluate(()=>{const b=(window as any).__NILO__.scene.getScene('game').boss;for(let i=0;i<3;i++){b.windowHit=false;b.takeDamage(1);}});
 await page.waitForFunction(()=>(window as any).__NILO__.scene.getScene('game').boss.phase==='rage');
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').boss.hp)).toBe(4);
 await page.waitForFunction(()=>(window as any).__NILO__.scene.getScene('game').boss.phase==='charge');
 expect(await page.evaluate(()=>{const b=(window as any).__NILO__.scene.getScene('game').boss;b.takeDamage(1);return b.hp;})).toBe(4);
 await page.waitForFunction(()=>(window as any).__NILO__.scene.getScene('game').boss.phase==='stunned');
 await page.screenshot({path:'artifacts/monkey-arena.png'});
 await page.evaluate(()=>{const b=(window as any).__NILO__.scene.getScene('game').boss;for(let i=0;i<4;i++){b.windowHit=false;b.takeDamage(1);}});
 expect(await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');return s.bossDefeated&&!s.boss.exit.body.enable&&s.boss.bananas.length===0;})).toBe(true);
 await at(page,8130);await page.waitForFunction(()=>(window as any).__NILO__.scene.isActive('stage-clear'));
 expect(errors).toEqual([]);
});

test('fall consumes one life, resets weapon and reopens arena',async({page})=>{
 const errors=await start(page);await at(page,7780);await page.waitForTimeout(100);await tap(page,'k');await at(page,7780,450);await page.waitForTimeout(1300);
 expect(await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');return !s.player.isDead&&s.player.hasBaton&&!s.baton.dropped&&!s.boss.engaged&&!s.boss.entrance.body.enable;})).toBe(true);
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('ui').lives.text)).toBe('× 2');
 expect(errors).toEqual([]);
});

test('Android multi-touch controls have separate swing and throw buttons',async({browser})=>{
 const context=await browser.newContext({viewport:{width:900,height:450},hasTouch:true,isMobile:true});const page=await context.newPage();const errors=await start(page);
 await expect(page.locator('.touch-controls .throw')).toBeVisible();
 const cdp=await context.newCDPSession(page);
 const point=async(selector:string,id:number)=>{const b=await page.locator(selector).boundingBox();return {x:b!.x+b!.width/2,y:b!.y+b!.height/2,id};};
 const right=await point('.touch-controls .right',1),jump=await point('.touch-controls .jump',2);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,jump]});await page.waitForTimeout(400);
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.x)).toBeGreaterThan(60);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const thrown=await point('.touch-controls .throw',3);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[thrown]});await page.waitForTimeout(120);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.hasBaton)).toBe(false);
 expect(errors).toEqual([]);await context.close();
});
