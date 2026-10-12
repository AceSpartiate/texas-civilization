import {createMoonlightGrade} from './bexar-battle-art.js';
export const createSouthernNightGrade=createMoonlightGrade;
export function mountedHeading(facing={x:1,y:0}){
 return Math.abs(facing.y||0)>Math.abs(facing.x||0)?(facing.y>0?'s':'n'):(facing.x<0?'w':'e');
}
export function mountedActionClip(kind,heading){
 return ['n','s'].includes(heading)?`${kind==='rider'?'volunteer':'dragoon'}-mounted-fire-${heading}`:kind==='dragoon'?'dragoon-fire':null;
}
export function lancerChargeClip(heading){return ['n','s'].includes(heading)?`lancer-charge-${heading}`:'lancer-charge';}
// Moonless tonal layer. Weather, firelight and shot effects are separate projected systems.
export function drawSouthernNight(ctx,darkness,bounds){
 if(darkness<=0)return;
 const w=bounds?.width??ctx.canvas?.width??0,h=bounds?.height??ctx.canvas?.height??0;
 ctx.save();ctx.fillStyle=`rgba(7,15,29,${(.76*darkness).toFixed(4)})`;ctx.fillRect(0,0,w,h);
 const mist=ctx.createLinearGradient?.(0,0,0,h);
 if(mist){mist.addColorStop(0,`rgba(100,116,127,${(.025*darkness).toFixed(4)})`);mist.addColorStop(1,`rgba(100,116,127,${(.09*darkness).toFixed(4)})`);ctx.fillStyle=mist;ctx.fillRect(0,0,w,h);}
 ctx.restore();
}
