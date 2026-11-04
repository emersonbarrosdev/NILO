import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

// Original source sheets are immutable. Only the unarmed runtime atlas is rebuilt;
// the same canonical baton is composed by gameplay in every equipment state.
const root='src/assets/hd',out='artifacts/bloco1';
await fs.mkdir(out,{recursive:true});
const CELL=128,BASELINE=116,RESOLUTION=4,COLUMNS=8;
const cuts=[0,178,348,510,685,818,978,1108,1247];
const frames=[],provenance={};
const handAnchors=JSON.parse(await fs.readFile(path.join(root,'player-hand-anchors.json'),'utf8'));
async function decode(name){
  const buffer=await fs.readFile(path.join(root,name));
  provenance[name]=createHash('sha256').update(buffer).digest('hex');
  const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Source matte has red/olive RGB at low alpha. The 220 cutoff was visually
  // checked on a light background. Original RGB inside the silhouette is retained.
  for(let p=0;p<data.length;p+=4){if(data[p+3]<220)data.fill(0,p,p+4);else data[p+3]=255;}
  return {name,data,info};
}
function bounds(data,width,height){
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<0)throw new Error('Empty authored frame');
  return {left,top,width:right-left+1,height:bottom-top+1};
}
async function region(source,rect){
  const {data,info}=await sharp(source.data,{raw:source.info}).extract(rect).raw().toBuffer({resolveWithObject:true});
  // Background-removal fragments must not move the registration point. Nilo's
  // anatomy is one connected silhouette; keep that component, remove loose matte.
  const visited=new Uint8Array(info.width*info.height),components=[];
  for(let p=0;p<visited.length;p++)if(!visited[p]&&data[p*4+3]){
    const component=[p];visited[p]=1;
    for(let q=0;q<component.length;q++){
      const v=component[q],x=v%info.width,y=Math.floor(v/info.width);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy,n=ny*info.width+nx;
        if(nx<0||ny<0||nx>=info.width||ny>=info.height||visited[n]||!data[n*4+3])continue;
        visited[n]=1;component.push(n);
      }
    }
    components.push(component);
  }
  components.sort((a,b)=>b.length-a.length);
  for(const component of components.slice(1))for(const p of component)data.fill(0,p*4,p*4+4);
  return {source:source.name,rect,data,info,bounds:bounds(data,info.width,info.height),removedMattePixels:components.slice(1).reduce((n,c)=>n+c.length,0)};
}
async function pack(cut,{scale,baseline=BASELINE,headTop,headX}={}){
  const b=cut.bounds,input=await sharp(cut.data,{raw:cut.info}).extract(b).resize(Math.round(b.width*scale),Math.round(b.height*scale)).png().toBuffer();
  const m=await sharp(input).metadata(),left=headX===undefined?Math.floor((CELL-m.width)/2):Math.round(64-(headX-b.left)*scale),top=headTop===undefined?baseline-m.height:headTop;
  if(left<0||top<0||left+m.width>CELL||top+m.height>CELL)throw new Error(`Frame ${frames.length} would clip`);
  const image=await sharp({create:{width:CELL,height:CELL,channels:4,background:'#00000000'}}).composite([{input,left,top}]).png().toBuffer();
  frames.push({image,index:frames.length,source:cut.source,sourceRect:cut.rect,sourceBounds:b,removedMattePixels:cut.removedMattePixels,scale,packed:{left,top,width:m.width,height:m.height}});
}
const base=await decode('player-unarmed-source.png');
for(let i=0;i<64;i++){
  const col=i%8,row=Math.floor(i/8),left=Math.round(col*base.info.width/8),right=Math.round((col+1)*base.info.width/8);
  await pack(await region(base,{left,top:cuts[row],width:right-left,height:cuts[row+1]-cuts[row]}),{scale:.63});
}
async function appendGrid(name,state){
  const source=await decode(name),parts=[];
  for(let i=0;i<8;i++){
    const col=i%4,row=Math.floor(i/4),left=Math.round(col*source.info.width/4),right=Math.round((col+1)*source.info.width/4),top=Math.round(row*source.info.height/2),bottom=Math.round((row+1)*source.info.height/2);
    parts.push(await region(source,{left,top,width:right-left,height:bottom-top}));
  }
  const scale=(state==='push_crouched'?78:102)/parts[0].bounds.height;
  for(let i=0;i<8;i++){
    const part=parts[i],headLimit=Math.floor(part.info.height*.30);let l=part.info.width,r=-1;
    for(let y=0;y<headLimit;y++)for(let x=0;x<part.info.width;x++)if(part.data[(y*part.info.width+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x);}
    // Run heads stay at one registration point, preserving flight in phases 3/7.
    // Grounded walking and crouching retain their physical supporting sole baseline.
    await pack(part,{scale,headX:(l+r)/2,headTop:state==='run'&&(i===3||i===7)?14:undefined});
    Object.assign(frames.at(-1),{state,phase:i});
  }
}
await appendGrid('player-walk8-source.png','walk');
await appendGrid('player-run8-source.png','run');
// Original throw40..47 and standing-push56..63 are reused by the animation
// catalogue directly; never duplicate those raster cells in the runtime atlas.
await appendGrid('player-push-crouched8-source.png','push_crouched');
await sharp({create:{width:CELL*COLUMNS,height:CELL*Math.ceil(frames.length/COLUMNS),channels:4,background:'#00000000'}}).composite(frames.map(f=>({input:f.image,left:f.index%COLUMNS*CELL,top:Math.floor(f.index/COLUMNS)*CELL}))).png().toFile(path.join(root,'player-unarmed-sheet.png'));
// Affine packing of the existing canonical baton, never a redraw.
await sharp(path.join(root,'baton.png')).rotate(45,{background:'#00000000'}).trim({threshold:16}).resize(72,16,{fit:'fill'}).png().toFile(path.join(root,'baton-horizontal.png'));
const metadata={cellSize:32,textureCellSize:CELL,textureResolution:RESOLUTION,footBaseline:BASELINE/RESOLUTION,columns:COLUMNS,count:frames.length,alphaThreshold:220,states:{original:[0,63],walk:[64,71],run:[72,79],throw:[40,47],push_standing:[56,63],push_crouched:[80,87]},baton:{source:'baton.png',texture:'baton-horizontal.png',logicalLength:18,logicalThickness:4,textureWidth:72,textureHeight:16,gripAnchor:{x:.12,y:.5}},handAnchorSource:'player-hand-anchors.json',handAnchorCoordinates:'Logical pixels relative to cell centre; manual visual calibration, angle in degrees.',sourceHashes:provenance,frames:frames.map(({image,...f})=>({...f,handAnchor:handAnchors[f.index]}))};
await fs.writeFile(path.join(root,'player-original-metadata.json'),JSON.stringify(metadata,null,2)+'\n');
console.log(`Packed ${frames.length} original/detailed poses. Runtime atlas 1024x1408, resolution4. Original source sheets and armed archive unchanged.`);
for(const [state,start] of [['walk',64],['run',72],['throw',40],['push-standing',56],['push-crouched',80]]){
  const sequence=frames.slice(start,start+8),comps=[];
  for(let i=0;i<8;i++){
    const svg=Buffer.from(`<svg width="256" height="288"><rect width="256" height="288" fill="#dce9e5"/><line x1="0" y1="232" x2="256" y2="232" stroke="#588976"/><text x="12" y="268" font-family="Arial" font-size="16" fill="#173b34">${start+i} / fase ${i}</text></svg>`);
    comps.push({input:await sharp(svg).composite([{input:await sharp(sequence[i].image).resize(256,256,{kernel:'nearest'}).toBuffer(),left:0,top:0}]).png().toBuffer(),left:i%4*256,top:Math.floor(i/4)*288});
  }
  await sharp({create:{width:1024,height:576,channels:4,background:'#dce9e5'}}).composite(comps).png().toFile(path.join(out,state+'-contact.png'));
  const pages=[];
  for(const f of sequence)pages.push(await sharp(f.image).resize(256,256,{kernel:'nearest'}).flatten({background:'#dce9e5'}).ensureAlpha().raw().toBuffer());
  // Walk preview corresponds to 46 units/s; run to 103 units/s at a 48-unit stride.
  await sharp(Buffer.concat(pages),{raw:{width:256,height:256*8,channels:4,pageHeight:256}}).gif({delay:Array(8).fill(state==='run'?58:130),loop:0}).toFile(path.join(out,state+'.gif'));
}
const comparison=[0,8,12,64,68,72,76,80];
await sharp({create:{width:comparison.length*256,height:256,channels:4,background:'#dce9e5'}}).composite(await Promise.all(comparison.map(async(index,i)=>({input:await sharp(frames[index].image).resize(256,256,{kernel:'nearest'}).toBuffer(),left:i*256,top:0})))).png().toFile(path.join(out,'original-and-new-comparison.png'));
