import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';

// Editable art sources. Raster output is 4x the logical dimensions, never a pixel upscale.
const out = 'src/assets/hd';
await fs.mkdir(out, { recursive: true });
const ellipse=(x,y,rx,ry,c,stroke='none')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="${stroke}" stroke-width=".65"/>`;
const rect=(x,y,w,h,c,r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}"/>`;
const line=(x1,y1,x2,y2,c,w=1)=>`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const curve=(d,c,stroke='none',width=.6)=>`<path d="${d}" fill="${c}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
const leaf=(x,y,s=1,c='#64b953')=>`<g transform="translate(${x} ${y}) scale(${s})">${curve('M0 0Q-7 -9 2 -12Q8 -5 0 0',c)}${line(0,0,1,-9,'#c4e998',.5)}</g>`;
const heart=(x=0,y=0,c='#ef697a')=>`<g transform="translate(${x} ${y})">${curve('M7 12C-6 4 0 -3 7 2C14 -3 20 4 7 12Z',c,'#873b56',.8)}${curve('M3 3Q1 4 3 6','none','#ffd4d7',1.2)}</g>`;
const rock=(w,h)=>curve(`M1 ${h-2}L${w*.12} ${h*.4}Q${w*.25} -1 ${w*.6} 2L${w-2} ${h*.4}L${w} ${h-3}Q${w*.5} ${h+1} 1 ${h-2}`,'#809d98','#385a5b')+curve(`M${w*.12} ${h*.4}L${w*.4} 3L${w*.7} ${h*.3}L${w*.5} ${h*.5}Z`,'#b9cdc0')+line(w*.55,h*.45,w*.75,h*.72,'#5d7b79',.7);
function art(name,w,h,f=0){
 if(name.includes('tile-ground')||name==='tile-earth'){
  let s=rect(0,0,w,h,'url(#earth)');
  for(let i=0;i<6;i++){const x=(i*7.13+3)%w,y=6+(i*5.73)%(h-6);s+=ellipse(x,y,1.3,.65,'#b18961')+line(x-1,y+2,x+2,y+2.7,'#76583c',.4);}
  if(name!=='tile-earth')s+=curve(`M0 1Q4 -1 8 1T${w} 1V5Q${w-2} 8 ${w-4} 5Q8 9 5 5Q2 8 0 4Z`,'url(#grass)')+line(0,1,w,1,'#c3f090',.65);
  return s;
 }
 if(name.includes('plank')||name.includes('platform')||name==='moving-platform'){
  if(name.includes('stilt'))return rect(w*.3,0,w*.4,h,'url(#wood)',.5)+line(w*.42,1,w*.44,h,'#e2ba7c',.6);
  if(name.includes('bracket'))return curve(`M0 0H${w}L0 ${h}Z`,'#7e6148')+line(1,1,w-1,1,'#cbb186');
  let s=rect(0,1,w,h-2,name.includes('stone')?'#789e98':'url(#wood)',2)+rect(1,1,w-2,1,'#efd3a0');
  for(let i=3;i<w;i+=12)s+=ellipse(i,3,.65,.65,'#424f4d')+line(i+2,5,i+9,4,'#8b633c',.4);
  return s;
 }
 if(name.includes('cloud'))return ellipse(w*.5,h*.7,w*.48,h*.27,'#e1f4f0')+ellipse(w*.32,h*.5,w*.22,h*.38,'#fff9e9')+ellipse(w*.58,h*.35,w*.25,h*.35,'#fffdf1')+ellipse(w*.78,h*.6,w*.2,h*.28,'#fffdf1');
 if(name==='bg-mountain-far')return curve(`M0 ${h}V${h*.6}Q${w*.15} ${h*.45} ${w*.3} ${h*.25}Q${w*.46} ${h*.02} ${w*.6} ${h*.4}Q${w*.8} ${h*.5} ${w} ${h*.3}V${h}Z`,'#7cb9bc')+curve(`M${w*.22} ${h*.38}Q${w*.36} ${h*.13} ${w*.42} ${h*.22}L${w*.5} ${h*.43}L${w*.38} ${h*.36}Z`,'#c6e1cf');
 if(name==='bg-hills-mid')return curve(`M0 ${h}V${h*.6}Q${w*.4} ${-h*.3} ${w*.7} ${h*.5}Q${w*.88} ${h*.2} ${w} ${h*.6}V${h}Z`,'#5b9f83')+curve(`M0 ${h}Q${w*.4} ${h*.1} ${w} ${h*.8}V${h}Z`,'#82b878');
 if(name.includes('beetle')){const b=f%2*.6;return `<g transform="translate(0 ${b})">`+line(4,10,2+(f%2),14,'#344d4c',1.2)+line(8,10,8-(f%2),14,'#344d4c',1.2)+line(11,10,13-(f%2),14,'#344d4c',1.2)+ellipse(7.4,7,6,5,'url(#red)','#6a3944')+line(8,3,8,11,'#933b4e',.6)+ellipse(4.8,4.7,1.5,.8,'#ffc9b6')+ellipse(13,8,2.3,3,'#304d50')+ellipse(13.8,6.9,.9,1.3,'#fff7d9')+ellipse(14.1,7,.4,.7,'#172f36')+line(13,5,14,2,'#304d50',.7)+'</g>';}
 if(name.includes('hopper')){const b=f===2?2:0;return ellipse(8,16,6,1,'#274b4c33')+ellipse(8,10+b,6,5-b*.5,'url(#grass)','#305d50')+ellipse(12,8+b,4,4,'#b1d272','#305d50')+ellipse(13,6+b,1.4,1.6,'#fff7d9')+ellipse(13.6,6+b,.6,.9,'#203d42')+curve(`M3 ${11+b}Q-1 ${14+b} 4 15H7`,'none','#4e7b56',2)+line(12,12,15,16,'#4e7b56',1.4);}
 if(name.includes('flyer'))return ellipse(8,13,2,1,'#1e637333')+ellipse(6,5+f%2,5,2.5,'#def6eee0','#70babb')+ellipse(12,5-f%2,5,2.5,'#def6eee0','#70babb')+ellipse(9,9,6,2,'#e6ac58','#8c683c')+line(5,8,6,10,'#684c3c',1)+line(8,8,9,10,'#684c3c',1)+ellipse(14,8,2.6,3,'#53a5a3')+ellipse(15,7,.8,1,'#fff9de')+ellipse(15.2,7,.35,.6,'#294650');
 if(name.includes('heart'))return heart(Math.max(0,(w-14)/2),(h-13)/2);
 if(name.includes('stamp')){const sx=name.includes('sheet')?Math.max(.15,Math.abs(Math.cos(f*Math.PI/3))):1;return `<g transform="translate(${w/2} ${h/2}) scale(${sx} 1)">`+ellipse(0,0,w*.35,h*.42,'#e0a444','#96512e')+ellipse(0,-.3,w*.26,h*.34,'#ffdf79')+curve('M0 -4L1 -1L4 -1L2 1L3 4L0 2L-3 4L-2 1L-4 -1L-1 -1Z','#fff2be')+'</g>';}
 if(name.includes('postcard'))return rect(1,1,w-2,h-2,name.includes('empty')?'#45716c':'#fff4d4',1)+rect(3,3,w*.48,h-6,'#76c8c2',.5)+curve(`M3 ${h-3}L${w*.25} 4L${w*.5} ${h-3}Z`,'#70a56e')+rect(w-5,3,2,2,'#e7a953')+line(w*.65,h*.55,w-3,h*.55,'#bdad81',.4);
 if(name.includes('life')||name.includes('nilo-mini'))return ellipse(w*.5,h*.4,w*.35,h*.3,'#ffcb91','#78543e')+curve(`M${w*.12} ${h*.4}Q0 0 ${w*.5} 1Q${w} 0 ${w*.85} ${h*.45}L${w*.6} ${h*.18}Z`,'#74452e')+ellipse(w*.62,h*.4,.7,1,'#29423c')+rect(w*.25,h*.7,w*.5,h*.25,'#dc9953',1);
 if(name.includes('bounce')||name==='flower-bounce'){
  let s=line(w/2,h,w/2,h*.4,'#3a8959',2)+leaf(w/2,h-1,.65);
  for(let i=0;i<6;i++){let a=i*Math.PI/3;s+=ellipse(w/2+Math.cos(a)*6,h*.4+Math.sin(a)*(f===1?1:3),4,2.4,'#ef9b95','#b96372');}
  return s+ellipse(w/2,h*.4,4,2.6,'#ffe49b');
 }
 if(name.includes('checkpoint'))return rect(w*.45,2,2,h-2,'url(#wood)',.6)+curve(`M${w*.5+2} 3Q${w*.9} 0 ${w-1} 5L${w-2} 13Q${w*.8} 9 ${w*.5+2} 12Z`,f>0||name.includes('active')&&!name.includes('inactive')?'#f7c864':'#8aa895','#4d7974')+ellipse(w*.5+1,2,2,2,'#ffe5ae')+rect(2,h-3,w-4,3,'#819c84',1);
 if(name.includes('puzzle-target'))return ellipse(w/2,h/2,w*.4,h*.43,'#976039','#5a5346')+ellipse(w/2,h/2,w*.31,h*.34,name.includes('hit')?'#77cda1':'#f4cc72')+ellipse(w/2,h/2,w*.16,h*.18,'#fff2b4')+ellipse(w/2,h/2,1,1,'#e18f52');
 if(name.includes('spike')){let s='';for(let x=0;x<w;x+=8)s+=curve(`M${x} ${h}L${x+4} 1L${x+8} ${h}Z`,'#b3c6b3','#5a7470')+line(x+4,3,x+5,h-3,'#f5f2d2',.6);return s;}
 if(name==='decor-tree-large'){let s=curve(`M${w*.35} ${h}Q${w*.5} ${h*.65} ${w*.4} ${h*.2}L${w*.6} ${h*.2}Q${w*.55} ${h*.6} ${w*.7} ${h}Z`,'url(#wood)');for(let i=0;i<11;i++){const a=i*2.399,r=w*.27*Math.sqrt(i/11);s+=ellipse(w*.5+Math.cos(a)*r,h*.28+Math.sin(a)*r*.7,w*.24,h*.19,i%3===0?'#8abc59':i%3===1?'#509b59':'#317b58');}return s;}
 if(name.includes('bush'))return ellipse(w*.5,h*.85,w*.45,h*.15,'#355f5140')+ellipse(w*.25,h*.6,w*.24,h*.35,'#3c8c61')+ellipse(w*.5,h*.42,w*.28,h*.42,'#70af65')+ellipse(w*.78,h*.63,w*.22,h*.3,'#4b9c62')+ellipse(w*.5,h*.18,w*.12,h*.08,'#b4d485')+ellipse(w*.3,h*.5,1.2,1.2,'#eab18b');
 if(name.includes('rock'))return rock(w,h);
 if(name.includes('flowers')){let s='';for(let i=0;i<5;i++){let x=2+i*w/5,y=h*.5+(i%2)*2;s+=line(x,h,x,y,'#538f5b',.7)+ellipse(x,y,2,1.5,i%2?'#efbcae':'#ffe4a0')+ellipse(x,y,.6,.6,'#dc9561');}return s;}
 if(name.includes('signpost'))return rect(w*.45,2,2,h,'url(#wood)',.5)+curve(`M1 2H${w-4}L${w} 6L${w-4} 10H1Z`,'#dfb880','#8c6a4c')+line(4,6,w-5,6,'#805f4a',.7);
 if(name.includes('fence')){let s='';for(let x=1;x<w;x+=8)s+=rect(x,1,2,h,'url(#wood)',.7);return s+rect(0,h*.4,w,2,'#be9865')+rect(0,h*.75,w,1.5,'#aa8057');}
 if(name.includes('bunting')){let s=curve(`M0 2Q${w/2} 10 ${w} 2`,'none','#846549',.5);for(let x=3;x<w-4;x+=7)s+=curve(`M${x} 4L${x+6} 5L${x+2} 12Z`,x%3?'#e9b95f':'#6ec5b2');return s;}
 if(name.includes('vines')){let s=line(w/2,0,w*.4,h,'#56895f',.8);for(let y=3;y<h;y+=5)s+=leaf(w*.45,y,.35,y%2?'#679865':'#91b079');return s;}
 if(name.includes('waterfall'))return rect(w*.25,0,w*.5,h,'#a6e1d999')+curve(`M${w*.25} 0Q${w*.6} ${h*.5} ${w*.2} ${h}H${w*.75}Q${w*.5} ${h*.5} ${w*.7} 0Z`,'#d5f4e3b0')+ellipse(w*.5,h*.96,w*.45,h*.04,'#f0fae3');
 if(name.includes('mist'))return ellipse(w*.5,h*.5,w*.5,h*.4,'#e2f4df30');
 if(name==='goal-gate')return rect(2,3,4,h-3,'url(#wood)',1)+rect(w-6,3,4,h-3,'url(#wood)',1)+curve(`M1 7Q${w/2} -4 ${w-1} 7L${w-1} 12Q${w/2} 3 1 12Z`,'#f6d584','#9a7750')+leaf(w-2,5,.7)+leaf(3,6,.6);
 if(name.includes('campfire'))return line(3,h-2,w-3,h-4,'#ae8959',3)+curve(`M4 ${h-4}Q0 8 9 2Q6 7 12 9Q17 15 4 ${h-4}`,'#edac61')+ellipse(8,12,2,3,'#fff0a4');
 return rect(0,0,w,h,'#416d68',2)+rect(2,2,w-4,h-4,'#80b8a0',1);
}
const sheets={'enemy-beetle-sheet':[16,16,5],'enemy-flyer-sheet':[18,16,4],'enemy-hopper-sheet':[18,18,5],'item-stamp-sheet':[16,16,6],'item-heart-sheet':[14,14,4],'bounce-flower-sheet':[24,20,4],'checkpoint-totem-sheet':[16,28,4],'decor-campfire':[16,16,4]};
for(const dir of ['sprites','tilesets','backgrounds','ui'])for(const name of await fs.readdir('src/assets/'+dir)){
 if(!name.endsWith('.png')||name.includes('boy')||name.includes('Detailed'))continue;
 const key=name.slice(0,-4);const meta=await sharp('src/assets/'+dir+'/'+name).metadata();
 const [w,h,count]=sheets[key]??[meta.width,meta.height,1];
 let body='';for(let f=0;f<count;f++)body+=`<g transform="translate(${f*w} 0)">${art(key,w,h,f)}</g>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w*count*4}" height="${h*4}" viewBox="0 0 ${w*count} ${h}"><defs><linearGradient id="earth" x2="0" y2="1"><stop stop-color="#b68b58"/><stop offset="1" stop-color="#785a3f"/></linearGradient><linearGradient id="grass" x2="0" y2="1"><stop stop-color="#abd96b"/><stop offset="1" stop-color="#4c9856"/></linearGradient><linearGradient id="wood" x2="0" y2="1"><stop stop-color="#d2b17c"/><stop offset="1" stop-color="#8d6949"/></linearGradient><linearGradient id="red" x2="0" y2="1"><stop stop-color="#f19c83"/><stop offset=".5" stop-color="#d86463"/><stop offset="1" stop-color="#a74656"/></linearGradient></defs>${body}</svg>`;
 await fs.writeFile(path.join(out,name),new Resvg(svg).render().asPng());
}
console.log('HD raster art generated at 4x logical resolution.');
