import Phaser from 'phaser';
export interface PixelTextOptions {
 scale?: number; color?: number; align?: 'left' | 'center' | 'right'; originX?: number; originY?: number; letterSpacing?: number; lineSpacing?: number; paddingX?: number; paddingY?: number; backgroundColor?: number; backgroundAlpha?: number; scrollFactor?: number; depth?: number;
}
/** Classic menu type, rendered above logical resolution for crisp contours. */
export function addPixelText(scene: Phaser.Scene, x: number, y: number, value: string, options: PixelTextOptions = {}): Phaser.GameObjects.Container {
 const container = scene.add.container(x,y);
 const text = scene.add.text(0,0,value,{ fontFamily:'"Press Start 2P", monospace', fontSize:String(5*(options.scale??1))+'px', fontStyle:'', color:'#'+(options.color??0xffffff).toString(16).padStart(6,'0'), align:options.align??'left', resolution:4, padding:{x:options.paddingX??0,y:options.paddingY??0}, backgroundColor:options.backgroundColor===undefined?undefined:'#'+options.backgroundColor.toString(16).padStart(6,'0') }).setOrigin(options.originX??0,options.originY??0);
 container.add(text);
 if(options.scrollFactor!==undefined)container.setScrollFactor(options.scrollFactor);
 if(options.depth!==undefined)container.setDepth(options.depth);
 return container;
}
