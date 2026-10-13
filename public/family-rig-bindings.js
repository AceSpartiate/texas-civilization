export const RIG_BODY_TYPES={rust:'adult-male',elder:'adult-male',ochre:'adult-male','father-hat':'adult-male','father-beard':'adult-male','father-moustache':'adult-male','father-straw':'adult-male',teal:'adult-female','rust-woman':'adult-female',indigo:'adult-female','mother-braid':'adult-female','mother-loose':'adult-female','mother-scarf':'adult-female','mother-straw':'adult-female',blue:'youth-male','youth-boy':'youth-male','blue-girl':'youth-female','youth-girl':'youth-female',boy:'child-male',girl:'child-female',smallchild:'smallchild',infant:'infant'};
/** Canonical painted rig pose; role restrictions stay in the server. */
export function familyRigClip(identity,pose='idle-s'){
 const body=RIG_BODY_TYPES[identity];if(!body)return null;
 if(body==='infant'){
  if(pose.includes('injured')||pose==='wounded')pose='wounded';
  else if(pose.includes('sleep'))pose='camp-sleep';
  else if(pose.includes('rest'))pose='camp-rest';
  else pose=['idle-e','idle-w','idle-n'].includes(pose)?pose:'idle-s';
 }else{
  const map={walk:'walk-e',work:'hoe',repair:'hammer',dig:'dig',chop:'chop',plant:'sow',water:'hoe',rest:'camp-rest','rest-pose':'camp-rest','injured-rest':'wounded','injured-pose':'wounded',injured:'wounded',speak:'care','listen-e':'idle-e','listen-w':'idle-w','listen-n':'idle-n','listen-s':'idle-s'};
  pose=map[pose]||pose;
 }
 if(!/^(idle-[eswn]|walk-[esn]|dig|hoe|chop|hammer|sow|harvest|carry|trade|care|search|camp-rest|camp-sleep|wounded|comfort|surrender|fire-reload|passenger-[esn]|saddle(?:-wounded)?-[esn])$/.test(pose))return null;
 return `${identity}-rig-${pose}`;
}
export function familyRigFate(identity,kind){
 if(!RIG_BODY_TYPES[identity])return null;
 if(kind==='killed')return RIG_BODY_TYPES[identity]==='infant'?`${identity}-rig-covered-1`:`${identity}-rig-still`;
 if(kind==='fall')return RIG_BODY_TYPES[identity]==='infant'?`${identity}-rig-covered-1`:`${identity}-rig-fall`;
 return `${identity}-rig-wounded`;
}
export function familyRigCanFire(identity){return ['adult-male','adult-female','youth-male','youth-female'].includes(RIG_BODY_TYPES[identity]);}
export function familyRigSeat(identity,direction='e',seat='passenger'){
 const body=RIG_BODY_TYPES[identity];if(!body||body==='infant'||body==='smallchild'&&seat!=='passenger')return null;
 const d=['s','n'].includes(direction)?direction:'e';
 return {id:`${identity}-rig-${seat==='passenger'?'passenger': 'saddle'}-${d}`,seated:true,rigLayer:true,upright:d!=='e'};
}
/** Map an already projected battle pose. Never decides a fate or its timing. */
export function familyRigBattlePose(identity,legacy,{moving=false,firing=false,heading='e',fireTime=0,fate=null,since=-1,grade=null,carried=false}={}){
 if(!RIG_BODY_TYPES[identity])return legacy;
 const out={...legacy,rig:true};
 if(legacy.camp)return out;
 if(legacy.sprite==='volunteer-reclining')return {...out,sprite:familyRigFate(identity,'killed'),clip:undefined};
 if(legacy.sprite==='volunteer-injured'){
  if(fate==='killed')return {...out,sprite:familyRigFate(identity,'fall'),clip:undefined};
  return {...out,sprite:undefined,clip:carried&&grade!=='slight'?`${identity}-rig-carry-living`:`${identity}-rig-wounded`,timeMs:Math.max(0,since),transport:carried&&grade!=='slight'};
 }
 if(legacy.sprite==='volunteer-load')return familyRigCanFire(identity)?{...out,sprite:`${identity}-rig-load`,clip:undefined}:{...out,sprite:undefined,clip:familyRigClip(identity,'comfort')};
 if(['volunteer-e','volunteer-w'].includes(legacy.sprite))return {...out,sprite:familyRigCanFire(identity)?`${identity}-rig-aim`:undefined,clip:familyRigCanFire(identity)?undefined:`${identity}-rig-idle-e`,flip:legacy.sprite==='volunteer-w'};
 const map={'volunteer-march':'walk-e','volunteer-idle-e':'idle-e','volunteer-idle-w':'idle-w','volunteer-surrender':'surrender','volunteer-fire-reload':'fire-reload'};
 if(legacy.clip==='volunteer-ride-e'){
  const d=['n','s'].includes(heading)?heading:'e',fire=firing&&!moving&&familyRigCanFire(identity);
  return {...out,clip:`${identity}-rig-${fire?'mounted-fire':'saddle'}-${d}`,timeMs:fire?fireTime:legacy.timeMs,rigMounted:true,moving,heading:d,flip:d==='e'?legacy.flip:false,scale:1};
 }
 const pose=map[legacy.clip];if(!pose)return legacy;
 return {...out,clip:pose==='fire-reload'&&!familyRigCanFire(identity)?`${identity}-rig-idle-e`:familyRigClip(identity,pose)};
}
