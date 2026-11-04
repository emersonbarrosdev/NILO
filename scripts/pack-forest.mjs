import sharp from 'sharp';
import fs from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
const root = 'src/assets/hd/';
async function cell(file, index, columns = 4, rows = 3) {
  const { width, height } = await sharp(root + file).metadata();
  const col = index % columns, row = Math.floor(index / columns);
  const left = Math.round(col * width / columns), top = Math.round(row * height / rows);
  return sharp(root + file).extract({ left, top, width: Math.round((col + 1) * width / columns) - left, height: Math.round((row + 1) * height / rows) - top }).png().toBuffer();
}
const names = ['trunk', 'tree', 'canopy', 'vine', 'grass-block', 'earth-block', 'log', 'boulder', 'fern', 'shrub', 'bromeliad', 'grass-edge'];
const frames = {}, parts = [];
for (let i = 0; i < 12; i++) {
  const crop = await cell('forest-source.png', i);
  // Terrain is cropped inside the opaque painted edge so adjacent tiles have no gutters.
  const meta = await sharp(crop).metadata();
  const input = i === 4 || i === 5
    ? await sharp(crop).extract({ left: Math.round(meta.width * .14), top: Math.round(meta.height * (i === 4 ? .16 : .24)), width: Math.round(meta.width * .70), height: Math.round(meta.height * (i === 4 ? .70 : .62)) }).resize(256,256).png().toBuffer()
    : await sharp(crop).trim({ threshold: 30 }).resize(256, 256, { fit: 'contain', background: '#00000000' }).png().toBuffer();
  const x = i % 4 * 256, y = Math.floor(i / 4) * 256;
  parts.push({ input, left: x, top: y });
  frames[names[i]] = { frame: { x, y, w: 256, h: 256 }, sourceSize: { w: 256, h: 256 }, spriteSourceSize: { x: 0, y: 0, w: 256, h: 256 } };
}
await sharp({ create: { width: 1024, height: 768, channels: 4, background: '#00000000' } }).composite(parts).png().toFile(root + 'forest-atlas.png');
await fs.writeFile(root + 'forest-atlas.json', JSON.stringify({ frames, meta: { image: 'forest-atlas.png', size: { w: 1024, h: 768 }, scale: '1' } }));
for (const [name, row, w, h, count] of [['enemy-beetle-sheet',0,64,64,5],['enemy-flyer-sheet',1,72,64,4],['enemy-hopper-sheet',2,72,72,5]]) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const source = await cell('enemies-source.png',row*4 + Math.min(i,3));
    const input = await sharp(source).trim({ threshold: 30 }).resize(w-4,h-8,{fit:'inside'}).png().toBuffer();
    const meta = await sharp(input).metadata();
    parts.push({input,left:i*w+Math.floor((w-meta.width)/2),top:h-4-meta.height});
  }
  await sharp({create:{width:w*count,height:h,channels:4,background:'#00000000'}}).composite(parts).png().toFile(root+name+'.png');
}
// The source-based leaf animation follows the existing editable raster-art pipeline.
let leaves = '';
for (let i=0;i<8;i++) {
  const sx=Math.max(.18,Math.abs(Math.cos(i*Math.PI/4)));
  leaves+=`<g transform="translate(${i*32+16} 16) rotate(${i*45}) scale(${sx} 1)"><path d="M-10 7Q-14 -12 9 -10Q14 9 -10 7Z" fill="${i%2?'#fbb91b':'#83ce14'}" stroke="#285420" stroke-width="1.4"/><path d="M-9 7L9 -10" stroke="#eaff91" stroke-width="1.2"/></g>`;
}
await fs.writeFile(root+'leaves-sheet.png',new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="32">${leaves}</svg>`).render().asPng());
console.log('Forest atlas, three enemy sheets and eight leaf frames packed.');
