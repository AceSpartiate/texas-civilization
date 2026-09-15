// Pure presentation from one already-permitted plot. Never infers burning.
export function plotArt(plot){
  const timber=plot.state==='cleared'&&plot.ground==='timber';
  const clearing=plot.state==='staked'&&plot.work>0&&plot.spells>0&&['timber','brush'].includes(plot.ground);
  if(!timber&&!clearing)return [];
  let seed=0;for(const c of String(plot.id))seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
  const span=timber?1:Math.sqrt(Math.min(1,plot.work/plot.spells));
  return Array.from({length:timber?7:3},(_,i)=>{
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=.18+(seed/4294967296)*.64;
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=.18+(seed/4294967296)*.64;
    return {sprite:timber?['stump-post-oak','stump-hollow-oak','stump-cottonwood'][i%3]:'clearing-brush-dry',x:.5+(x-.5)*span,y:.5+(y-.5)*span};
  }).sort((a,b)=>a.y-b.y);
}
