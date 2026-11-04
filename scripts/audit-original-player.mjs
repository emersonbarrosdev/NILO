import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const atlas='src/assets/hd/player-unarmed-sheet.png', out='artifacts/bloco1';
const near=[
[[121,170],[147,196],[168,216]],[[120,171],[143,191],[141,223]],[[120,169],[124,195],[132,222]],[[120,171],[100,194],[83,218]],
[[120,169],[88,194],[70,219]],[[120,170],[100,191],[91,198]],[[125,171],[150,182],[122,200]],[[129,172],[153,188],[158,207]]
];
const far=[
[[110,176],[86,199],[72,217]],[[111,174],[90,196],[91,205]],[[129,170],[141,183],[109,197]],[[132,169],[149,184],[158,204]],
[[130,173],[145,194],[169,218]],[[130,170],[140,191],[139,223]],[[117,175],[125,196],[136,223]],[[117,176],[100,199],[89,222]]
];
const phases=['D contato / E atrás','D amortece / E recupera','D apoio / E passa atrás','D propulsão / E à frente','E contato / D atrás','E amortece / D recupera','E apoio / D passa à frente','E propulsão / D à frente'];
const comps=[];
for(let i=0;i<8;i++){
 const frame=64+i,cell=await sharp(atlas).extract({left:frame%8*128,top:Math.floor(frame/8)*128,width:128,height:128}).resize(256,256,{kernel:'nearest'}).toBuffer();
 let svg='<svg width="256" height="332"><rect width="256" height="332" fill="#e7efec"/><line x1="0" y1="232" x2="256" y2="232" stroke="#588976"/>';
 for(const [pts,c,dash,label] of [[far[i],'#bd5a00','5 4','E'],[near[i],'#086baa','','D']]){
  svg+='<polyline points="'+pts.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="'+c+'" stroke-width="2.5" stroke-dasharray="'+dash+'"/>';
  for(const [x,y] of pts)svg+='<circle cx="'+x+'" cy="'+y+'" r="3.5" fill="'+c+'"/>';
  svg+='<text x="'+(pts[2][0]-5)+'" y="'+(pts[2][1]+18)+'" fill="'+c+'" font-family="Arial" font-size="15" font-weight="bold">'+label+'</text>';
 }
 svg+='<text x="10" y="266" font-family="Arial" font-size="16" fill="#153c32">F'+frame+' / fase '+i+'</text><text x="10" y="291" font-family="Arial" font-size="14" fill="#153c32">'+phases[i]+'</text><text x="10" y="315" font-family="Arial" font-size="12" fill="#526960">D próxima; E distante / leitura manual</text></svg>';
 const under=await sharp({create:{width:256,height:332,channels:4,background:'#e7efec'}}).composite([{input:cell,left:0,top:0}]).png().toBuffer();
 // Annotations use transparent overlays; background is supplied by the underlay.
 svg=svg.replace('<rect width="256" height="332" fill="#e7efec"/>','');
 comps.push({input:await sharp(under).composite([{input:Buffer.from(svg),left:0,top:0}]).png().toBuffer(),left:i%4*256,top:Math.floor(i/4)*332});
}
await sharp({create:{width:1024,height:664,channels:4,background:'#e7efec'}}).composite(comps).png().toFile(out+'/walk-anatomy-audit.png');
const anchors=JSON.parse(await fs.readFile('src/assets/hd/player-hand-anchors.json','utf8'));
const contacts=[];
for(let i=0;i<88;i++){
 const cell=await sharp(atlas).extract({left:i%8*128,top:Math.floor(i/8)*128,width:128,height:128}).toBuffer();
 const a=anchors[i],x=64+a.x*4,y=64+a.y*4;
 const overlay=Buffer.from('<svg width="128" height="148"><circle cx="'+x+'" cy="'+y+'" r="3" fill="none" stroke="#00faff" stroke-width="1.5"/><line x1="'+x+'" y1="'+y+'" x2="'+(x+12*Math.cos(a.angle*Math.PI/180))+'" y2="'+(y+12*Math.sin(a.angle*Math.PI/180))+'" stroke="#00faff"/><text x="5" y="142" font-family="Arial" font-size="11" fill="#173b34">'+i+'</text></svg>');
 contacts.push({input:await sharp({create:{width:128,height:148,channels:4,background:'#dce9e5'}}).composite([{input:cell,left:0,top:0},{input:overlay,left:0,top:0}]).png().toBuffer(),left:i%8*128,top:Math.floor(i/8)*148});
}
await sharp({create:{width:1024,height:11*148,channels:4,background:'#dce9e5'}}).composite(contacts).png().toFile(out+'/hand-anchors-contact.png');
const manifest={description:'Raster metrics; anatomy labels are manual visual interpretation, never inferred from frame numbers alone.',frames:[]};
for(let i=0;i<88;i++){
 const {data,info}=await sharp(atlas).extract({left:i%8*128,top:Math.floor(i/8)*128,width:128,height:128}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let bottom=-1,top=128,left=128,right=-1,red=0,redEdge=0,count=0;
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const p=(y*128+x)*4;if(data[p+3]<128)continue;
  bottom=Math.max(bottom,y);top=Math.min(top,y);left=Math.min(left,x);right=Math.max(right,x);count++;
  if(data[p]>150&&data[p+1]<70&&data[p+2]<70){red++;if([[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>x+dx<0||y+dy<0||x+dx>127||y+dy>127||data[((y+dy)*128+x+dx)*4+3]<128))redEdge++;}
 }
 manifest.frames.push({index:i,sha256:createHash('sha256').update(data).digest('hex'),bounds:{left,top,right,bottom},opaquePixels:count,redColorPixels:red,redColorEdgePixels:redEdge,support:i>=64&&i<80?(i%8===3||i%8===7)&&i>=72?'flight':i%8<4?'right':'left':undefined,handAnchor:anchors[i]});
}
await fs.writeFile(out+'/raster-audit.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Audit totals',manifest.frames.reduce((a,f)=>({red:a.red+f.redColorPixels,redEdge:a.redEdge+f.redColorEdgePixels}),{red:0,redEdge:0}));
