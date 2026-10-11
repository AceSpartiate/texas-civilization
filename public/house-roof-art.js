// Artist-reviewed ridge axes, in pixels relative to each atlas frame's padded crop.
// Keep these with the artwork; a roof is rigid and never follows an animation clock.
export const ROOF_RIDGES = Object.freeze({
  'house-hewn-roof-finished': [[105,102],[208,11]],
  'house-round-roof-partial': [[107,98],[207,12]],
  'house-roof-join': [[230,204],[403,14]],
  'house-roof-join-partial': [[230,204],[403,14]],
  'house-roof-join-chimney': [[230,204],[403,14]],
});

// Fit the middle roof's ridge to the existing pen-roof ridge at a virtual pen seat.
// Only axis scale changes: no rotation/shear, so quarter-turn houses stay upright.
export function fitRoofJoin(reference, join, referenceSeat, flip=false) {
  if (!reference?.ridge || !join?.ridge || !referenceSeat) return null;
  const [a,b]=reference.ridge,[c,d]=join.ridge;
  const scale=referenceSeat.height/(reference.logicalHeight||reference.h);
  const sy=(b[1]-a[1])/(d[1]-c[1])*scale;
  const sx=(b[0]-a[0])/(d[0]-c[0])*scale;
  if (!(sx>0&&sy>0)) return null;
  const middle=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  return {
    x:referenceSeat.x+(flip?-1:1)*(middle[0]-referenceSeat.anchor[0]*reference.w)*scale,
    y:referenceSeat.y+(middle[1]-referenceSeat.anchor[1]*reference.h)*scale,
    height:(join.logicalHeight||join.h)*sy,widthScale:sx/sy,
    anchor:[(c[0]+d[0])/2/join.w,(c[1]+d[1])/2/join.h],
  };
}

// Trim join-end framing inside the overlap, retaining full eaves across the ridge.
// Passage/chimney widths differ; neither should expose a middle roof's cut log ends.
export function roofJoinClip(frame, seat, flip, fraction) {
  const [a,b]=frame.ridge,scale=seat.height/(frame.logicalHeight||frame.h);
  const dx=(b[0]-a[0])*scale*seat.widthScale*(flip?-1:1),dy=(b[1]-a[1])*scale;
  const length=Math.hypot(dx,dy),reach=Math.max(frame.w*scale*seat.widthScale,frame.h*scale)*2;
  const nx=-dy/length*reach,ny=dx/length*reach;
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([end,side])=>[seat.x+end*dx*fraction/2+side*nx,seat.y+end*dy*fraction/2+side*ny]);
}
