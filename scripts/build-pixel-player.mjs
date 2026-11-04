/** Original editable pixel art. Every output pixel is authored on the 64px grid.
 * No SVG, vector renderer, resampling of existing artwork, AA, or blur is used.
 * Layer order preserves near/right and far/left anatomical identity.
 */
import fs from 'node:fs/promises';
import sharp from 'sharp';

const data=JSON.parse(await fs.readFile('src/assets/pixel/player-poses.json','utf8'));
const size=data.cellSize;
const resolution=data.textureResolution;
const colors=Object.fromEntries(Object.entries(data.palette).map(([key,hex])=>[key,[...hex.match(/../g).map(v=>parseInt(v,16)),...(hex.length===6?[255]:[])]]));
const frames=[],anchors=[];

function paint(frame) {
  const rgba=Buffer.alloc(size*size*4);
  const pixel=(x,y,c)=>{ x=Math.round(x);y=Math.round(y);if(x<0||x>=size||y<0||y>=size)return;rgba.set(colors[c],(y*size+x)*4); };
  const rawBox=(x,y,w,h,c)=>{for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)pixel(x+dx,y+dy,c);};
  const dot=(x,y,c)=>pixel(x*resolution,y*resolution,c);
  const box=(x,y,w,h,c)=>rawBox(x*resolution,y*resolution,w*resolution,h*resolution,c);
  // Integer Bresenham pixels, expanded with an authored square brush.
  const stroke=(a,b,c,width=1)=>{
    let [x,y]=a.map(v=>Math.round(v*resolution)); const [endX,endY]=b.map(v=>Math.round(v*resolution));
    width=Math.max(1,width*resolution-1);
    const dx=Math.abs(endX-x),sx=x<endX?1:-1,dy=-Math.abs(endY-y),sy=y<endY?1:-1;
    let error=dx+dy;
    while(true){rawBox(x-Math.floor(width/2),y-Math.floor(width/2),width,width,c);if(x===endX&&y===endY)break;const twice=2*error;if(twice>=dy){error+=dy;x+=sx;}if(twice<=dx){error+=dx;y+=sy;}}
  };
  const bob=frame.bob??0,crouch=frame.crouch??false;
  const shift=crouch?7:0;
  const shoulder=[18,15+bob+shift],farShoulder=[16,15+bob+shift];
  const hipRight=[18,21+bob+Math.floor(shift/3)],hipLeft=[15,21+bob+Math.floor(shift/3)];
  function shoe(foot,near) {
    const [x,y]=foot;
    box(x-2,y-1,4,3,'o');box(x-1,y-1,3,2,near?'m':'d');
    box(x-1,y,6,2,'o');box(x,y,4,1,near?'n':'t');
    box(x-1,y+1,6,1,near?'z':'j');box(x-1,y+2,6,1,'o');
    dot(x-1,y-1,near?'z':'t');
    // One-native-pixel leather seams and toe bevel, not a scaled low-res boot.
    pixel((x+4)*2+1,y*2,'o');pixel((x+4)*2+1,y*2+1,near?'m':'d');
    rawBox(x*2-1,y*2-1,4,1,near?'z':'m');rawBox(x*2,y*2+3,7,1,near?'m':'d');
  }
  function leg(hip,knee,foot,near) {
    stroke(hip,knee,'o',4);stroke(knee,[foot[0],foot[1]-1],'o',3);
    stroke(hip,knee,near?'s':'j',2);stroke(knee,[foot[0],foot[1]-1],near?'f':'m',2);
    box(foot[0]-1,foot[1]-2,3,2,near?'w':'n');shoe(foot,near);
    stroke([knee[0]-.5,knee[1]+.5],[foot[0]-.5,foot[1]-2],near?'s':'j',.5);
  }
  function arm(start,elbow,hand,near) {
    stroke(start,elbow,'o',4);stroke(elbow,hand,'o',3);
    stroke(start,elbow,near?'w':'n',2);stroke(elbow,hand,near?'s':'k',2);
    box(hand[0]-1,hand[1]-1,3,3,near?'f':'s');dot(hand[0]+1,hand[1]+1,near?'s':'k');
    dot(hand[0],hand[1]-1,near?'w':'f');
    rawBox(hand[0]*2-1,hand[1]*2+2,3,1,near?'s':'k');
    pixel(hand[0]*2+2,hand[1]*2-1,near?'w':'s');
  }
  // Far leg and arm are permanently behind torso and right limbs.
  leg(hipLeft,frame.leftKnee,frame.leftFoot,false);
  arm(farShoulder,frame.leftElbow,frame.leftHand,false);
  // Backpack: small warm canvas bag, not a second limb.
  box(9,14+bob+shift,5,8,'o');box(9,15+bob+shift,4,6,'d');box(10,15+bob+shift,3,4,'t');
  box(10,14+bob+shift,3,2,'m');dot(11,17+bob+shift,'a');box(9,19+bob+shift,2,2,'j');
  rawBox(19,(15+bob+shift)*2+1,1,10,'m');rawBox(20,(16+bob+shift)*2,5,1,'n');
  // Cream shirt, ochre vest, warm buttons, dark shorts.
  box(13,13+bob+shift,8,9,'o');box(14,14+bob+shift,6,7,'w');
  box(13,15+bob+shift,3,7,'v');box(14,14+bob+shift,2,6,'g');dot(15,15+bob+shift,'a');
  box(19,14+bob+shift,3,8,'v');box(19,15+bob+shift,2,6,'g');dot(20,17+bob+shift,'a');dot(20,20+bob+shift,'a');
  stroke([15.5,14+bob+shift],[15.5,20+bob+shift],'a',.5);
  stroke([19,14+bob+shift],[18,17+bob+shift],'v',.5);
  box(13,21+bob+Math.floor(shift/3),9,3,'o');box(14,21+bob+Math.floor(shift/3),7,2,'u');box(15,21+bob+Math.floor(shift/3),3,1,'q');
  leg(hipRight,frame.rightKnee,frame.rightFoot,true);
  // Shorts overlap the tops of both thighs.
  stroke(hipLeft,[hipLeft[0]+Math.sign(frame.leftKnee[0]-hipLeft[0]),hipLeft[1]+1],'d',3);
  stroke(hipRight,[hipRight[0]+Math.sign(frame.rightKnee[0]-hipRight[0]),hipRight[1]+1],'q',3);
  dot(hipRight[0],hipRight[1],'r');
  const [headX,headY]=data.headOrigin;
  for(let y=0;y<data.headPixels64.length;y++)for(let x=0;x<data.headPixels64[y].length;x++) {
    const c=data.headPixels64[y][x];if(c!=='.')pixel(headX*2+x,(headY+bob+shift)*2+y,c);
  }
  if(frame.blink){rawBox(39,(headY+bob+shift)*2+14,6,6,'f');stroke([20,10+bob+shift],[22,10+bob+shift],'h',.5);}
  // Near arm above head for the raised wind-up/impulse, physically attached.
  arm(shoulder,frame.rightElbow,frame.rightHand,true);
  anchors.push({x:frame.rightHand[0]-16,y:frame.rightHand[1]-16,angle:frame.batAngle??-40});
  frames.push(rgba);
}

const idle={bob:0,rightKnee:[19,24],rightFoot:[20,26],leftKnee:[14,24],leftFoot:[13,26],rightElbow:[21,17],rightHand:[23,19],leftElbow:[15,18],leftHand:[14,20]};
for(let index=0;index<64;index++) {
  let pose={...idle};
  if(index===1)pose.blink=true;
  if(index>=8&&index<=15)pose={...data.walk[index-8]};
  if(index>=16&&index<=23)pose={...data.walk[index-16]};
  if(index>=24&&index<=31) {
    const air=[
      {rightKnee:[22,23],rightFoot:[21,24],leftKnee:[13,22],leftFoot:[10,24]},
      {rightKnee:[22,21],rightFoot:[20,23],leftKnee:[13,23],leftFoot:[12,25]},
      {rightKnee:[23,22],rightFoot:[21,24],leftKnee:[12,23],leftFoot:[10,25]},
      {rightKnee:[22,23],rightFoot:[21,25],leftKnee:[13,24],leftFoot:[12,25]},
      {rightKnee:[21,23],rightFoot:[23,25],leftKnee:[14,24],leftFoot:[12,25]},
      {rightKnee:[20,24],rightFoot:[22,26],leftKnee:[13,24],leftFoot:[12,26]},
      {rightKnee:[21,24],rightFoot:[22,26],leftKnee:[13,24],leftFoot:[12,26]},
      {rightKnee:[20,24],rightFoot:[21,26],leftKnee:[14,24],leftFoot:[13,26]}
    ];
    pose={...pose,...air[index-24],rightElbow:[23,14],rightHand:[24,12],leftElbow:[12,15],leftHand:[10,13]};
  }
  if(index>=32&&index<=39) {
    const cycle=data.walk[index-32];
    pose={...cycle,bob:0,crouch:true,rightKnee:[cycle.rightKnee[0],25],leftKnee:[cycle.leftKnee[0],25],rightFoot:[cycle.rightFoot[0],26],leftFoot:[cycle.leftFoot[0],cycle.support==='left'?26:25],rightElbow:[22,23],rightHand:[24,24],leftElbow:[18,24],leftHand:[20,25]};
  }
  if(index>=40&&index<=47)pose={...pose,...data.throw[index-40]};
  if(index>=48&&index<=55) {
    const gesture=data.throw[index-48];
    pose={...pose,...gesture,crouch:true,rightKnee:[21,25],leftKnee:[14,25],rightElbow:[gesture.rightElbow[0],gesture.rightElbow[1]+7],rightHand:[gesture.rightHand[0],gesture.rightHand[1]+7],leftElbow:[gesture.leftElbow[0],gesture.leftElbow[1]+7],leftHand:[gesture.leftHand[0],gesture.leftHand[1]+7]};
  }
  if(index>=56)pose={...data.walk[index-56],rightElbow:[24,16],rightHand:[27,16],leftElbow:[23,18],leftHand:[26,19]};
  paint(pose);
}
const sheetWidth=size*8,sheet=Buffer.alloc(sheetWidth*sheetWidth*4);
for(let f=0;f<64;f++)for(let y=0;y<size;y++)frames[f].copy(sheet,(((f>>3)*size+y)*sheetWidth+(f%8)*size)*4,y*size*4,(y+1)*size*4);
await fs.mkdir('artifacts',{recursive:true});
await sharp(sheet,{raw:{width:sheetWidth,height:sheetWidth,channels:4}}).png().toFile('src/assets/hd/player-pixel.png');
const contact=Buffer.alloc(sheetWidth*size*4);
for(let f=0;f<8;f++)for(let y=0;y<size;y++)frames[f+8].copy(contact,(y*sheetWidth+f*size)*4,y*size*4,(y+1)*size*4);
await sharp(contact,{raw:{width:sheetWidth,height:size,channels:4}}).resize(1536,192,{kernel:'nearest'}).png().toFile('artifacts/walk-eight.png');
await sharp(sheet,{raw:{width:sheetWidth,height:sheetWidth,channels:4}}).resize(1024,1024,{kernel:'nearest'}).png().toFile('artifacts/player-pixel-sheet.png');
const throws=Buffer.alloc(sheetWidth*size*4);
for(let f=0;f<8;f++)for(let y=0;y<size;y++)frames[f+40].copy(throws,(y*sheetWidth+f*size)*4,y*size*4,(y+1)*size*4);
await sharp(throws,{raw:{width:sheetWidth,height:size,channels:4}}).resize(1536,192,{kernel:'nearest'}).png().toFile('artifacts/throw-poses.png');
const config=`/** Generated by scripts/build-pixel-player.mjs; edit the native pixel pose source. */\nexport const PLAYER_ART = { cellSize:32, textureCellSize:64, textureResolution:2, footBaseline:29, strideLength:24, walkStart:8, walkCount:8 } as const;\nexport interface PlayerHandAnchor { readonly x:number; readonly y:number; readonly angle:number; }\n/** Local coordinates relative to cell centre. Mirror x and angle with facing. */\nexport const PLAYER_HAND_ANCHORS:Readonly<Record<number,PlayerHandAnchor>> = ${JSON.stringify(Object.fromEntries(anchors.map((a,i)=>[i,a])),null,2)};\nexport function playerHandAnchor(frame:number):PlayerHandAnchor { return PLAYER_HAND_ANCHORS[frame] ?? PLAYER_HAND_ANCHORS[0]!; }\n`;
await fs.writeFile('src/game/config/playerArt.ts',config);
console.log('Original player pixel sheet: 64 cells, 8 distinct walking poses, native 64×64/logical32, 24-color palette.');
