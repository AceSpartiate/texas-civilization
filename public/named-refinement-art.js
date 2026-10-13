export const REFINED_RIDERS=Object.freeze(['jw-smith','horton','kimbell','martin']);
const direction=heading=>({east:'e',west:'e',south:'s',north:'n',e:'e',w:'e',s:'s',n:'n'}[heading] || 'e');
export function milamFireClip(heading,right=true){
 const d={east:'e',west:'w',south:'s',north:'n',e:'e',w:'w',s:'s',n:'n'}[heading] || (right?'e':'w');
 return `milam-fire-service-${d}`;
}
/** Explicit scene flags only. Artwork does not promote ordinary walking to urgent travel. */
export function namedMountedRefinement(person){
 if(!REFINED_RIDERS.includes(person?.art))return null;
 const d=direction(person.heading),flip=d==='e'&&(person.heading==='west'||person.heading==='w'||!person.heading&&person.right===false);
 if(!person.moving&&person.mountedAction==='dispatch')return {clip:`${person.art}-mounted-dispatch-${d}`,flip};
 if(person.moving&&(person.gait==='trot'||person.trot===true))return {clip:`${person.art}-mounted-trot-${d}`,flip};
 if(!person.moving&&d==='e')return {clip:`${person.art}-mounted-rest-e`,flip};
 return null;
}
