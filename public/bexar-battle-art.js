// Shared presentation contracts for the remaining Béxar art group.
export const BEXAR_TOWNSFOLK=Object.freeze(['bexar-woman','bexar-elder','bexar-child','bexar-older-woman']);
export const bexarCivilianHeight=name=>name==='bexar-child'?.62:.95;
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
// The darkness by the hour is the server's (sim/bexar-light.mjs `bexarDarknessAtHour`), sent as `bexarDarkness`.
export function createMoonlightGrade(){
 let from=0,target=0,at=null;
 const sample=now=>at===null?target:from+(target-from)*smooth((now-at)/1800);
 return {sample,update(value,now){const next=clamp(value);if(at===null){from=target=next;at=now;return next;}const current=sample(now);if(next!==target){from=current;target=next;at=now;}return current;}};
}
export function drawBexarMoonlight(ctx,darkness,bounds){
 if(darkness<=0)return;
 const w=bounds?.width??ctx.canvas?.width??0,h=bounds?.height??ctx.canvas?.height??0;
 ctx.save();ctx.fillStyle=`rgba(15,24,48,${(.64*darkness).toFixed(4)})`;ctx.fillRect(0,0,w,h);
 // A broad cool tonal wash; no invented visible moon or localized spotlight.
 ctx.fillStyle=`rgba(108,137,160,${(.045*darkness).toFixed(4)})`;ctx.fillRect(0,0,w,h);ctx.restore();
}
