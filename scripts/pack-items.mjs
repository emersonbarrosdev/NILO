import sharp from 'sharp';
import fs from 'node:fs/promises';
const root='src/assets/hd/';
const {width,height}=await sharp(root+'items-source.png').metadata();
const names=['item-life','item-stamp','item-postcard','ui-postcard-empty','checkpoint-pole-inactive','checkpoint-pole-active','puzzle-target-idle','puzzle-target-hit'];
for(let i=0;i<8;i++){
 const left=Math.round(i%4*width/4),top=Math.round(Math.floor(i/4)*height/2);
 const {data,info}=await sharp(root+'items-source.png').extract({left,top,width:Math.round((i%4+1)*width/4)-left,height:Math.round((Math.floor(i/4)+1)*height/2)-top}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let p=0;p<data.length;p+=4)if(data[p+3]<185)data.fill(0,p,p+4);
 const input=await sharp(data,{raw:info}).trim({threshold:40}).png().toBuffer();
 const w=i===1?40:i<4?56:80,h=i<4?48:112;
 await sharp(input).resize(w,h,{fit:'contain',background:'#00000000'}).png().toFile(root+names[i]+'.png');
}
await fs.copyFile(root+'item-postcard.png',root+'ui-postcard-lit.png');
console.log('Eight cartoon props packed.');
