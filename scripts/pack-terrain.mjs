import sharp from 'sharp';
import fs from 'node:fs/promises';
const root='src/assets/hd/';
// Blend opposing edge strips, keeping the authored interior free of mirror symmetry.
for(const [name,left,top,w,h,vertical] of [['earth-seamless',256,256,256,256,true],['grass-seamless',0,256,256,64,false]]){
 const {data,info}=await sharp(root+'forest-atlas.png').extract({left,top,width:w,height:h}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const src=Buffer.from(data),band=24;
 for(let y=0;y<h;y++)for(let x=0;x<band;x++)for(let c=0;c<4;c++){
   const a=(y*w+x)*4+c,b=(y*w+w-1-x)*4+c,mean=(src[a]+src[b])/2,t=x/band;
   data[a]=Math.round(mean*(1-t)+src[a]*t);data[b]=Math.round(mean*(1-t)+src[b]*t);
 }
 if(vertical){const rows=Buffer.from(data);for(let y=0;y<band;y++)for(let x=0;x<w;x++)for(let c=0;c<4;c++){
   const a=(y*w+x)*4+c,b=((h-1-y)*w+x)*4+c,mean=(rows[a]+rows[b])/2,t=y/band;
   data[a]=Math.round(mean*(1-t)+rows[a]*t);data[b]=Math.round(mean*(1-t)+rows[b]*t);
 }}
 await sharp(data,{raw:info}).png().toFile(root+name+'.png');
}
console.log('Continuous edge strips, no mirrored motifs.');

// One visible top plane for every fixed, moving and falling log.
// Keep the painted wood, remove its transparent padding, cap with real moss.
const wood=await sharp(root+'forest-atlas.png').extract({left:512,top:358,width:256,height:70}).resize(384,68).png().toBuffer();
const moss=await sharp(root+'grass-seamless.png').extract({left:0,top:3,width:256,height:10}).resize(384,12).png().toBuffer();
await sharp({create:{width:384,height:80,channels:4,background:'#00000000'}})
 .composite([{input:wood,left:0,top:10},{input:moss,left:0,top:0}]).png().toFile(root+'platform-log.png');
