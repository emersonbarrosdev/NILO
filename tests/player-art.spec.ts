import {test, expect} from '@playwright/test';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {PLAYER_ART, PLAYER_POSES, playerHandAnchor} from '../src/game/config/playerArt';

// Raster integrity supplements the visual anatomy review. Distinct hashes alone are not anatomical proof.
test('canonical detailed atlas uses 128px cells, real alpha and eight distinct leg regions', async()=>{
  const {data,info}=await sharp('src/assets/hd/player-unarmed-sheet.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  expect(info.width).toBe(1024);expect(info.height).toBe(1408);expect(info.channels).toBe(4);
  expect(PLAYER_ART.textureCellSize/PLAYER_ART.textureResolution).toBe(32);
  const hashes=new Set<string>();
  for(let phase=0;phase<8;phase++){
    const cell=PLAYER_ART.walkStart+phase,ox=cell%8*128,oy=Math.floor(cell/8)*128;
    const legs:Buffer[]=[];let opaque=0,transparent=0,bottom=-1;
    for(let y=0;y<128;y++){
      if(y>=78)legs.push(data.subarray(((oy+y)*info.width+ox)*4,((oy+y)*info.width+ox+128)*4));
      for(let x=0;x<128;x++){
        const i=((oy+y)*info.width+ox+x)*4;
        if(data[i+3]>=220){opaque++;bottom=Math.max(bottom,y);}
        if(data[i+3]===0)transparent++;
      }
    }
    hashes.add(createHash('sha256').update(Buffer.concat(legs)).digest('hex'));
    expect(opaque).toBeGreaterThan(2500);expect(transparent).toBeGreaterThan(5000);
    expect(bottom,`walk phase ${phase} retains a grounded support foot`).toBeGreaterThanOrEqual(113);
    expect(bottom).toBeLessThanOrEqual(117);
  }
  expect(hashes.size).toBe(8);
});

test('all state clips reference the detailed atlas and share the two equipment variants',()=>{
  for(const [state,clip] of Object.entries(PLAYER_POSES)){
    expect(clip.frames.length,state).toBeGreaterThan(0);
    expect(clip.equipment).toEqual(['WITH_BAT','WITHOUT_BAT']);
    for(const frame of clip.frames){expect(frame).toBeGreaterThanOrEqual(0);expect(frame).toBeLessThan(88);}
  }
  expect(PLAYER_POSES.walk.frames).toHaveLength(8);expect(PLAYER_POSES.run.frames).toHaveLength(8);
  const prepare=playerHandAnchor(PLAYER_POSES.throw_prepare.frames[0]!);
  const release=playerHandAnchor(PLAYER_POSES.throw_release.frames[0]!);
  expect(prepare.x).toBeLessThan(0);expect(release.x).toBeGreaterThan(0);
  for(let frame=0;frame<88;frame++){
    const hand=playerHandAnchor(frame);expect(Math.abs(hand.x)).toBeLessThan(16);expect(Math.abs(hand.y)).toBeLessThan(16);
  }
});

test('canonical baton texture is an alpha cutout in the same four-times resolution',async()=>{
  const meta=await sharp('src/assets/hd/baton-horizontal.png').metadata();
  expect(meta.width).toBe(72);expect(meta.height).toBe(16);expect(meta.hasAlpha).toBe(true);
});

