import {createMoonlightGrade} from './bexar-battle-art.js';
export const createAlamoGrade=createMoonlightGrade;
export function alamoGunName(id,right=true){
 const role=id==='north-gun'?'north':id==='church-guns'?'church':null;
 return role?`cannon-alamo-${role}-${right?'e':'w'}`:null;
}
export function alamoLancerClip(battle,side,moving){
 if(battle.id!=='alamo'||side.side!=='mexican'||!/^g:lancers-(east|south)$/.test(side.key||''))return null;
 const f=side.facing||{},d=Math.abs(f.y||0)>Math.abs(f.x||0)?(f.y>0?'s':'n'):'e';
 return `lancer-upright-${moving?'march':'idle'}-${d}`;
}
export function travisFireClip(heading,right=true){
 const d={east:'e',west:'w',north:'n',south:'s'}[heading]||(right?'e':'w');
 return `travis-battery-fire-${d}`;
}
/** Continuous projected darkness; dawn warmth is tonal, not an invented sun or moon. */
export function drawAlamoGrade(ctx,darkness,bounds){
 const d=Math.max(0,Math.min(1,darkness));if(d<=0)return;
 const width=bounds?.width??ctx.canvas?.width??0,height=bounds?.height??ctx.canvas?.height??0;
 ctx.save();ctx.fillStyle=`rgba(14,20,44,${(.62*d).toFixed(4)})`;ctx.fillRect(0,0,width,height);
 const warm=.045*4*d*(1-d);if(warm>0){ctx.fillStyle=`rgba(214,155,94,${warm.toFixed(4)})`;ctx.fillRect(0,0,width,height);}ctx.restore();
}
