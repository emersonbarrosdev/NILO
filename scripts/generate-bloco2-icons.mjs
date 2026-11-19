import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

// Original code-authored artwork. No concept screenshot or mockup is sampled.
// Native 64px artwork remains detailed at small gameplay sizes; do not blur it.
const out = 'src/assets/hd';
const svg = body => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">${body}</svg>`);
async function save(name, body) {
  await sharp(svg(body)).png().toFile(path.join(out, `bloco2-${name}.png`));
}

await save('trail-marker', `
 <path d="M28 8V4h8v4l3 3-2 5H27l-2-5z" fill="#53321d"/>
 <path d="M30 6h4v4h-4z" fill="#f8db81"/>
 <path d="m17 12 15-4 16 5 10 15-2 16-13 13-16 3-16-9-6-15 3-15z" fill="#3c3524"/>
 <path d="m17 13 15-4 16 5 9 14-2 16-13 12-15 3-15-9-6-14 3-14z" fill="#bd752b"/>
 <path d="m18 13 14-3 15 5 8 13-2 14-12 12-14 3-13-8-6-13 3-13z" fill="#f6c552"/>
 <path d="m8 35 4 13 15 9 14-3 12-12 2-14-4 13-12 10-12 3-13-9z" fill="#965a28"/>
 <path d="m18 15 14-3 14 4 5 8-11-6-13-1-12 6-5 13 1-12z" fill="#ffe5a0"/>
 <circle cx="31.5" cy="33" r="19.5" fill="#754c28"/>
 <circle cx="31.5" cy="32" r="17.5" fill="#ecda92"/>
 <circle cx="31.5" cy="32" r="15.5" fill="#244c48"/>
 <path d="M20 24a14 14 0 0 1 23 1l-4-2-8-2-7 2-5 6z" fill="#3f7161"/>
 <path d="m32 17 2 5h-4zm0 30 2-5h-4zM17 32l5-2v4zm30 0-5-2v4z" fill="#f6d279"/>
 <path d="m21 21 3 1-2 2zm22 0-1 3-2-2zM21 43l1-3 2 2zm22 0-3-1 2-2z" fill="#a99b68"/>
 <path d="m39 21-4 15-12 9 5-15z" fill="#142f31"/>
 <path d="m39 20-7 13-6-3z" fill="#fff1bb"/>
 <path d="m39 20-7 13 4 3z" fill="#dfb56a"/>
 <path d="m25 45 7-12 4 3z" fill="#ba572c"/>
 <path d="m25 45 7-12-6-3z" fill="#e99543"/>
 <circle cx="32" cy="33" r="3" fill="#7f512b"/><circle cx="31.5" cy="32" r="2" fill="#fce0a1"/>
 <path d="M15 17h3v2h-3zm31 1h2v3h-2zm-33 26h2v3h-2zm32 3h3v2h-3z" fill="#fff0b5"/>
`);

await save('breath-fruit', `
 <path d="M31 21c-3-8 0-14 4-17l4 3c-5 3-6 7-5 13z" fill="#573b24"/>
 <path d="M34 14C36 5 46 4 53 7c-1 9-10 15-19 11z" fill="#1c5230"/>
 <path d="M35 14c4-6 10-8 15-6-3 5-8 8-15 8z" fill="#6eaa43"/>
 <path d="m35 16 12-6" stroke="#b3ce64" stroke-width="1.5"/>
 <path d="M31 18c-11-8-25 1-25 16 0 13 12 25 25 26 13-1 26-13 26-26 0-15-14-24-26-16z" fill="#593022"/>
 <path d="M31 20C20 12 8 21 8 34c0 12 11 23 23 24 12-1 24-12 24-24 0-13-12-21-24-14z" fill="#b63f29"/>
 <path d="M30 21c-9-7-20 1-20 13 0 9 8 19 18 21-5-5-7-10-7-17 0-9 4-14 9-17z" fill="#ec6c31"/>
 <path d="M31 22c7-6 17-3 20 6 3 10-3 18-10 24 3-7 5-14 3-21-2-5-6-7-13-9z" fill="#d54b2c"/>
 <path d="M31 23c-4-1-8-2-12 1-4 2-6 6-6 11l4-1c1-5 3-8 7-9z" fill="#ffb954"/>
 <path d="M17 29h3v3h-3zm-4 8h2v3h-2zm10-15h4v2h-4z" fill="#ffdd8b"/>
 <path d="M11 42c3 9 11 14 20 14 9-1 18-8 21-17-5 9-12 12-19 13-8 1-15-3-22-10z" fill="#a83228"/>
 <path d="m29 55 3-2 3 2-3 2z" fill="#6d3324"/>
 <path d="M29 20c1 2 4 3 7 1" fill="none" stroke="#7e4428" stroke-width="2"/>
`);

const leaf = empty => `
 <path d="M10 52C8 29 24 9 55 8c2 29-17 47-39 46l-6 5-4-4z" fill="${empty?'#364b3c':'#203f29'}"/>
 <path d="M12 49C11 29 27 13 52 11c0 24-15 41-35 40z" fill="${empty?'#64705b':'#3e833c'}"/>
 <path d="M13 44c4-16 16-27 35-30-13 8-21 19-28 32z" fill="${empty?'#7e866a':'#87b94b'}"/>
 <path d="M19 49c18-1 28-14 31-31-1 19-13 33-31 33z" fill="${empty?'#495b47':'#2b6436'}"/>
 <path d="m10 55 32-32 7-8-9 12-27 31z" fill="${empty?'#a5a584':'#d4d87a'}"/>
 <path d="m25 41-1-14m10 5 1-12m-10 21 15-1m-6-8 12-3" fill="none" stroke="${empty?'#949779':'#a2c75d'}" stroke-width="1.6"/>
 <path d="m17 29 2-3 2 1-2 3zm8-9 2-2 2 1-2 2z" fill="${empty?'#8a9177':'#b9d776'}"/>
`;
await save('breath-leaf-full', leaf(false));
await save('breath-leaf-empty', leaf(true));

// Canonical portrait is a direct crop, never an AI interpretation or redraw.
const sourceName = 'player-unarmed-source.png';
const sourceBuffer = await fs.readFile(path.join(out,sourceName));
const crop = {left:24,top:0,width:119,height:88};
const {data,info} = await sharp(sourceBuffer).ensureAlpha().extract(crop).raw().toBuffer({resolveWithObject:true});
for(let p=0;p<data.length;p+=4) { if(data[p+3]<220)data.fill(0,p,p+4);else data[p+3]=255; }
// Retain only the head's connected silhouette, discarding low-alpha matte debris.
const seen = new Uint8Array(info.width*info.height), components=[];
for(let p=0;p<seen.length;p++)if(!seen[p]&&data[p*4+3]) {
  const component=[p];seen[p]=1;
  for(let q=0;q<component.length;q++){
    const v=component[q],x=v%info.width,y=Math.floor(v/info.width);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const nx=x+dx,ny=y+dy,n=ny*info.width+nx;
      if(nx<0||ny<0||nx>=info.width||ny>=info.height||seen[n]||!data[n*4+3])continue;
      seen[n]=1;component.push(n);
    }
  }
  components.push(component);
}
components.sort((a,b)=>b.length-a.length);
for(const c of components.slice(1))for(const p of c)data.fill(0,p*4,p*4+4);
const face = await sharp(data,{raw:info}).png().toBuffer();
await sharp({create:{width:128,height:128,channels:4,background:'#00000000'}})
  .composite([{input:face,left:4,top:19}]).png().toFile(path.join(out,'bloco2-nilo-face.png'));

const files=['trail-marker','breath-fruit','breath-leaf-full','breath-leaf-empty','nilo-face'];
const report={generator:'scripts/generate-bloco2-icons.mjs',originalArt:files.slice(0,4),portrait:{source:sourceName,sha256:createHash('sha256').update(sourceBuffer).digest('hex'),crop,alphaThreshold:220,transform:'Direct crop, original RGB, no redraw. Only largest connected silhouette retained.'},assets:[]};
for(const name of files){
  const file=path.join(out,`bloco2-${name}.png`),m=await sharp(file).metadata();
  const {data}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let transparent=0,opaque=0;
  for(let p=3;p<data.length;p+=4){if(data[p]===0)transparent++;if(data[p]===255)opaque++;}
  report.assets.push({file,width:m.width,height:m.height,transparentPixels:transparent,opaquePixels:opaque});
}
await fs.writeFile(path.join(out,'bloco2-assets-provenance.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
