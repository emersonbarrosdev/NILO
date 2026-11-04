import sharp from 'sharp';
const root='src/assets/hd/';
const source=root+'monkey-source.png';
const {width,height}=await sharp(source).metadata();
async function cell(i){
  const left=Math.round(i%4*width/4),top=Math.round(Math.floor(i/4)*height/4);
  const {data,info}=await sharp(source).extract({left,top,width:Math.round((i%4+1)*width/4)-left,height:Math.round((Math.floor(i/4)+1)*height/4)-top}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let p=0;p<data.length;p+=4)if(data[p+3]<64)data.fill(0,p,p+4);
  return sharp(data,{raw:info}).trim({threshold:40}).png().toBuffer();
}
for(const [name,start,count,w,h,scale] of [['monkey-sheet',0,8,192,192,.52],['snake-sheet',8,4,128,64,.38]]){
  const parts=[];
  for(let i=0;i<count;i++){
    const crop=await cell(start+i),m=await sharp(crop).metadata();
    const input=await sharp(crop).resize(Math.round(m.width*scale),Math.round(m.height*scale)).png().toBuffer(),n=await sharp(input).metadata();
    parts.push({input,left:i*w+Math.floor((w-n.width)/2),top:h-8-n.height});
  }
  await sharp({create:{width:w*count,height:h,channels:4,background:'#00000000'}}).composite(parts).png().toFile(root+name+'.png');
}
for(const [i,name,w,h] of [[12,'push-crate',112,112],[13,'break-crate',112,112],[14,'baton',64,64],[15,'banana',48,32]]){
  const crop=await cell(i);
  await sharp(crop).resize(w,h,{fit:'contain',background:'#00000000'}).png().toFile(root+name+'.png');
}
console.log('Monkey, snake, crates, baton and banana packed.');
