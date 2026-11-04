import {test,expect} from '@playwright/test';
import {LocomotionCycle,LocomotionGuard,TAU} from '../src/game/systems/LocomotionCycle';
import {PLAYER_ART} from '../src/game/config/playerArt';

test('A/B: opposite anatomical phases and continuous ground support across the whole cycle',()=>{
  const gait=new LocomotionCycle(PLAYER_ART.strideLength);
  for(let i=0;i<=1024;i++){
    gait.reset(PLAYER_ART.strideLength*i/1024);
    const s=gait.sample;
    const difference=((s.leftLegPhase-s.rightLegPhase)%TAU+TAU)%TAU;
    expect(difference).toBeCloseTo(Math.PI,12);
    expect(s.rightFootSupporting||s.leftFootSupporting).toBe(true);
    expect(s.rightFootSupporting&&s.leftFootSupporting).toBe(false);
    expect(s.frameIndex<4?s.rightFootSupporting:s.leftFootSupporting).toBe(true);
    expect(s.phase).toBeGreaterThanOrEqual(0);expect(s.phase).toBeLessThan(TAU);
  }
});

test('D: distance-driven playback visits exactly 0 to7 and wraps to0',()=>{
  const gait=new LocomotionCycle(PLAYER_ART.strideLength);
  const frames=[gait.sample.frameIndex];
  for(let i=0;i<8;i++)frames.push(gait.advance(PLAYER_ART.strideLength/8).frameIndex);
  expect(frames).toEqual([0,1,2,3,4,5,6,7,0]);
  for(const speed of [10,46,65,118]){
    gait.reset();const observed=[0];
    while(gait.sample.distance<PLAYER_ART.strideLength){
      const frame=gait.advance(speed/60).frameIndex;
      if(frame!==observed.at(-1))observed.push(frame);
    }
    expect(observed,`${speed} units/s at60Hz`).toEqual([0,1,2,3,4,5,6,7,0]);
  }
});

test('E: a logical stall blocks ground movement, repeated rendered frames do not',()=>{
  const gait=new LocomotionCycle(PLAYER_ART.strideLength),guard=new LocomotionGuard(gait);
  for(let i=0;i<20;i++)expect(guard.step(.01,true)).toBe(true);
  expect(gait.sample.frameIndex).toBe(0); // Normal many updates per visual frame.
  const advance=gait.advance.bind(gait),before=gait.sample.distance;
  gait.advance=()=>gait.sample;
  expect(guard.step(.5,true)).toBe(false);expect(guard.groundMovementAllowed).toBe(false);
  expect(guard.step(0,true)).toBe(false);expect(gait.sample.distance).toBe(before);
  expect(guard.step(2,false)).toBe(true); // No grounded guard during jump/fall.
  expect(gait.sample.distance).toBe(before);
  gait.advance=advance;
  expect(guard.step(0,true)).toBe(true);expect(gait.sample.distance).toBe(before);
  expect(guard.step(.5,true)).toBe(true);expect(gait.sample.distance).toBeCloseTo(before+.5,12);
});

test('E: incorrect phase output is rejected even if the distance counter advances',()=>{
  const gait=new LocomotionCycle(PLAYER_ART.strideLength),guard=new LocomotionGuard(gait);
  const advance=gait.advance.bind(gait);
  gait.advance=(dx)=>({...advance(dx),phase:0});
  expect(guard.step(1,true)).toBe(false);expect(gait.sample.distance).toBe(0);
  gait.advance=advance;expect(guard.step(0,true)).toBe(true);
});

test('F: slow, normal, run, stop, reverse, resume and airborne phases retain one distance scale',()=>{
  const gait=new LocomotionCycle(PLAYER_ART.strideLength),guard=new LocomotionGuard(gait);
  let expected=0;
  for(const speed of [10,46,65,118,0,-46,0,65]){
    for(let update=0;update<60;update++){
      const dx=speed/60;expected+=Math.abs(dx);
      expect(guard.step(dx,true)).toBe(true);
      expect(gait.sample.distance).toBeCloseTo(expected,9);
    }
  }
  const takeoff=gait.sample;
  for(let i=0;i<30;i++)expect(guard.step(118/60,false)).toBe(true);
  expect(gait.sample).toEqual(takeoff);
  expect(guard.step(1,true)).toBe(true);expect(gait.sample.distance).toBeCloseTo(expected+1,9);
});
