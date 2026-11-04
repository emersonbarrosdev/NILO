import {test, expect, type Page} from '@playwright/test';
import {BATON, batonBoundsAtAngle, batonCentreFromGrip} from '../src/game/config/batonConfig';
import {PLAYER_ART, PLAYER_POSES} from '../src/game/config/playerArt';
import {groundRelativeDisplacement, LocomotionCycle, LocomotionGuard} from '../src/game/systems/LocomotionCycle';

async function startLab(page: Page): Promise<string[]> {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__NILO__?.scene.isActive('title'));
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => (window as any).__NILO__?.scene.isActive('game'));
  await page.evaluate(() => (window as any).__NILO__.scene.getScene('game').scene.restart({levelId:'lab'}));
  await page.waitForTimeout(350);
  return errors;
}

// These checks prove phase mechanics and configuration, not depicted leg anatomy.
test('ground-relative distance excludes carrier motion in either direction', () => {
  const cycle = new LocomotionCycle(24), guard = new LocomotionGuard(cycle);
  for (const carry of [1, 2, -3, -.7, .25]) {
    expect(groundRelativeDisplacement(carry, carry)).toBe(0);
    expect(guard.step(carry, true, carry)).toBe(true);
    expect(cycle.sample.distance).toBe(0);
  }
  guard.step(4, true, 1); expect(cycle.sample.distance).toBe(3);
  guard.step(-4, true, -1); expect(cycle.sample.distance).toBe(6);
  guard.step(6, false); expect(cycle.sample.distance).toBe(6);
});

test('one canonical shaft has invariant length while its rotated AABB changes', () => {
  for (let angle = -180; angle <= 180; angle += 15) {
    const hand = {x:25,y:18,angle}, c = batonCentreFromGrip(hand);
    expect(Math.hypot(c.x-hand.x,c.y-hand.y)).toBeCloseTo(BATON.length*(.5-BATON.gripAnchor.x),10);
    const bounds=batonBoundsAtAngle(angle);
    expect(bounds.width).toBeGreaterThanOrEqual(BATON.thickness-1e-8);
    expect(bounds.height).toBeGreaterThanOrEqual(BATON.thickness-1e-8);
  }
  expect(batonBoundsAtAngle(0)).toEqual({width:18,height:4});
  expect(PLAYER_ART.runSpeed/118).toBeGreaterThanOrEqual(.85);
  expect(PLAYER_ART.runSpeed/118).toBeLessThanOrEqual(.9);
  for (const clip of Object.values(PLAYER_POSES)) expect(clip.equipment).toEqual(['WITH_BAT','WITHOUT_BAT']);
});

test('real runtime restores detailed bodies, walks by distance and excludes the airborne gait', async ({page}) => {
  const errors=await startLab(page);
  await page.evaluate(() => {
    const s=(window as any).__NILO__.scene.getScene('game'); (window as any).__gait=[];
    s.events.on('postupdate',()=>{const p=s.player;(window as any).__gait.push({frame:Number(p.frame.name),state:p.motionState,distance:p.locomotion.sample.distance});});
  });
  expect(await page.evaluate(()=>{const p=(window as any).__NILO__.scene.getScene('game').player;return {texture:p.texture.key,width:p.displayWidth,height:p.displayHeight,maxSpeed:p.body.maxVelocity.x};})).toEqual({texture:'player-unarmed-sheet',width:32,height:32,maxSpeed:103});
  await page.keyboard.down('d'); await page.waitForTimeout(650); await page.keyboard.up('d');
  const samples=await page.evaluate(()=>(window as any).__gait);
  const phases=new Set(samples.filter((s:any)=>['WALK','RUN'].includes(s.state)).map((s:any)=>s.frame%8));
  expect(phases.size).toBe(8);
  // Jump from clear ground after measuring one full 48-unit stride.
  await page.evaluate(()=>{const p=(window as any).__NILO__.scene.getScene('game').player;p.body.reset(32,143);p.setVelocity(0,0);});
  await page.waitForTimeout(80);
  await page.keyboard.down('Space'); await page.waitForTimeout(80);
  const takeoff=await page.evaluate(()=>{const p=(window as any).__NILO__.scene.getScene('game').player;return {distance:p.locomotion.sample.distance,vy:p.body.velocity.y,state:p.motionState};});
  expect(takeoff.vy).toBeLessThan(-150); expect(takeoff.state).toBe('JUMP');
  await page.waitForTimeout(100);
  expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.locomotion.sample.distance)).toBe(takeoff.distance);
  await page.keyboard.up('Space'); await page.waitForTimeout(500);
  await page.screenshot({path:'artifacts/block1-original-runtime.png'});
  expect(errors).toEqual([]);
});

test('throw keeps the same object and size, releases from its hand, requires K to retrieve',async({page})=>{
  const errors=await startLab(page);
  await page.evaluate(()=>{
    const s=(window as any).__NILO__.scene.getScene('game');
    (window as any).__weapon=s.baton.weapon;(window as any).__weaponSamples=[];(window as any).__release=null;(window as any).__prepare=false;(window as any).__flight=false;
    s.events.on('baton-throw',()=>{const p=s.player,w=s.baton.weapon,h=p.getHandPose();(window as any).__release={frame:Number(p.frame.name),pose:p.poseState,hand:h,x:w.x,y:w.y,angle:w.angle,hasBaton:p.hasBaton};});
    s.events.on('postupdate',()=>{const p=s.player,w=s.baton.weapon;(window as any).__weaponSamples.push({same:w===(window as any).__weapon,state:s.baton.state,width:w.displayWidth,height:w.displayHeight,has:p.hasBaton,pose:p.poseState,count:s.children.list.filter((o:any)=>o.texture?.key==='baton').length});if(p.poseState==='throw_prepare'&&!(window as any).__prepare){(window as any).__prepare=true;s.scene.pause();}else if(s.baton.state==='FLYING'&&s.playTime-s.baton.thrownAt>90&&!(window as any).__flight){(window as any).__flight=true;s.scene.pause();}});
  });
  await page.keyboard.press('k');
  await page.waitForFunction(()=>(window as any).__prepare);
  expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.hasBaton)).toBe(true);
  await page.screenshot({path:'artifacts/block1-throw-prepare.png'});
  await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').scene.resume());
  await page.waitForFunction(()=>!!(window as any).__release);
  const release=await page.evaluate(()=>(window as any).__release);
  expect(release.pose).toBe('throw_release'); expect(release.hasBaton).toBe(false);
  const centre=batonCentreFromGrip(release.hand);
  expect(release.x).toBeCloseTo(centre.x,8);expect(release.y).toBeCloseTo(centre.y,8);
  await page.waitForFunction(()=>(window as any).__flight);
  await page.screenshot({path:'artifacts/block1-throw-flight.png'});
  await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').scene.resume());
  await page.waitForFunction(()=>(window as any).__NILO__.scene.getScene('game').baton.state==='GROUND');
  await page.screenshot({path:'artifacts/block1-baton-ground.png'});
  const samples=await page.evaluate(()=>(window as any).__weaponSamples);
  expect(samples.some((s:any)=>s.state==='PREPARE'&&s.has)).toBe(true);
  expect(samples.some((s:any)=>['RELEASE','FLYING'].includes(s.state)&&!s.has)).toBe(true);
  for(const s of samples){expect(s.same).toBe(true);expect(s.count).toBe(1);expect(s.width).toBe(18);expect(s.height).toBe(4);}
  await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game'),w=s.baton.weapon;s.player.body.reset(w.x,w.y-12);s.player.setVelocity(0,0);});
  await page.waitForTimeout(300);
  expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.hasBaton)).toBe(false);
  await page.keyboard.press('k');await page.waitForTimeout(350);
  expect(await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');return s.player.hasBaton&&s.baton.weapon===(window as any).__weapon&&s.baton.weapon.displayWidth===18;})).toBe(true);
  expect(errors).toEqual([]);
});

test('idle on an actual moving platform is neutral and a gait stall cannot freeze knockback',async({page})=>{
  const errors=await startLab(page);
  await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game'),mp=s.movingPlatforms[0];s.player.body.reset(mp.x,mp.body.top-15);s.player.setVelocity(0,0);});
  await page.waitForTimeout(450);
  const before=await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');return {x:s.player.x,platformX:s.movingPlatforms[0].x,phase:s.player.locomotion.sample.distance};});
  await page.waitForTimeout(450);
  const after=await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');return {x:s.player.x,platformX:s.movingPlatforms[0].x,phase:s.player.locomotion.sample.distance,state:s.player.motionState};});
  expect(Math.abs(after.x-before.x)).toBeGreaterThan(1);
  expect(after.x-before.x).toBeCloseTo(after.platformX-before.platformX,1);
  expect(after.phase).toBeCloseTo(before.phase,5);expect(after.state).toBe('IDLE');
  await page.evaluate(()=>{const p=(window as any).__NILO__.scene.getScene('game').player;p.body.reset(60,143);p.setVelocity(0,0);p.locomotion.advance=()=>p.locomotion.sample;});
  await page.keyboard.down('d');await page.waitForTimeout(150);await page.keyboard.up('d');
  expect(await page.evaluate(()=>(window as any).__NILO__.scene.getScene('game').player.locomotionGuard.groundMovementAllowed)).toBe(false);
  const x=await page.evaluate(()=>{const p=(window as any).__NILO__.scene.getScene('game').player;p.isInvulnerable=false;p.receiveDamage(1,p.x+20);return p.x;});
  await page.waitForTimeout(110);
  const hurt=await page.evaluate(()=>{const p=(window as any).__NILO__.scene.getScene('game').player;return {x:p.x,vx:p.body.velocity.x,state:p.motionState};});
  expect(hurt.x).toBeLessThan(x-4);expect(hurt.vx).toBeLessThan(-60);expect(hurt.state).toBe('HURT');
  expect(errors).toEqual([]);
});


test('permitted throws preserve hand origin on both sides, moving and airborne',async({page})=>{
  const errors=await startLab(page);
  for(const mode of ['standing','moving','air'] as const)for(const direction of [1,-1]){
    await page.evaluate(()=>{
      const s=(window as any).__NILO__.scene.getScene('game');s.baton.reset();s.player.body.reset(45,143);s.player.setVelocity(0,0);s.player.isInvulnerable=true;(window as any).__caseRelease=null;
      s.events.once('baton-throw',()=>{const p=s.player,w=s.baton.weapon;(window as any).__caseRelease={hand:p.getHandPose(),x:w.x,y:w.y,width:w.displayWidth,height:w.displayHeight,facing:p.facingDirection,vy:p.body.velocity.y,grounded:p.body.blocked.down||p.body.touching.down,vx:p.body.velocity.x};});
    });
    const key=direction>0?'d':'a';
    await page.keyboard.down(key);await page.waitForTimeout(mode==='moving'?100:35);
    if(mode!=='moving')await page.keyboard.up(key);
    if(mode==='air'){await page.keyboard.down('Space');await page.waitForTimeout(55);}
    await page.keyboard.press('k');await page.waitForFunction(()=>!!(window as any).__caseRelease);
    const release=await page.evaluate(()=>(window as any).__caseRelease);
    expect(release.facing).toBe(direction);expect(release.width).toBe(18);expect(release.height).toBe(4);
    const centre=batonCentreFromGrip(release.hand);expect(release.x).toBeCloseTo(centre.x,7);expect(release.y).toBeCloseTo(centre.y,7);
    if(mode==='moving')expect(Math.abs(release.vx)).toBeGreaterThan(50);
    if(mode==='air')expect(release.grounded).toBe(false);
    await page.keyboard.up(key);await page.keyboard.up('Space');await page.waitForTimeout(550);
  }
  expect(errors).toEqual([]);
});

test('push gestures have actual standing, crouched and blocked gameplay states',async({page})=>{
  const errors=await startLab(page);
  await page.evaluate(()=>{const s=(window as any).__NILO__.scene.getScene('game');s.player.body.reset(91,143);s.player.setVelocity(0,0);});
  await page.keyboard.down('d');await page.waitForFunction(()=>(window as any).__NILO__.scene.getScene('game').player.poseState==='push_standing');
  await page.screenshot({path:'artifacts/block1-push-standing.png'});
  await page.keyboard.down('s');await page.waitForFunction(()=>(window as any).__NILO__.scene.getScene('game').player.poseState==='push_crouched');
  await page.screenshot({path:'artifacts/block1-push-crouched.png'});
  await page.keyboard.up('s');
  await page.waitForFunction(()=>(window as any).__NILO__.scene.getScene('game').player.poseState==='push_blocked');
  await page.screenshot({path:'artifacts/block1-push-blocked.png'});
  await page.keyboard.up('d');
  expect(errors).toEqual([]);
});

test('melee damages an actual enemy while keeping the canonical baton equipped',async({page})=>{
  const errors=await startLab(page);
  const initial=await page.evaluate(()=>{
    const s=(window as any).__NILO__.scene.getScene('game'),p=s.player,e=s.enemies[0];
    p.body.reset(240,143);p.setVelocity(0,0);p.isInvulnerable=true;
    e.body.reset(262,148);e.patrolMinX=262;e.patrolMaxX=262;e.setVelocity(0,0);
    (window as any).__meleeWeapon=s.baton.weapon;(window as any).__meleeThrows=0;
    s.events.on('baton-throw',()=>{(window as any).__meleeThrows++;});return e.hp;
  });
  await page.keyboard.press('j');await page.waitForTimeout(300);
  const result=await page.evaluate(()=>{
    const s=(window as any).__NILO__.scene.getScene('game'),e=s.enemies[0];return {has:s.player.hasBaton,same:s.baton.weapon===(window as any).__meleeWeapon,throws:(window as any).__meleeThrows,hp:e?.hp??0,defeated:e?.isDefeated??true};
  });
  expect(result.has).toBe(true);expect(result.same).toBe(true);expect(result.throws).toBe(0);
  expect(result.defeated||result.hp<initial).toBe(true);expect(errors).toEqual([]);
});
