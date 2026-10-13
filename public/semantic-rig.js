import {SKIN_COLOURS,HAIR_COLOURS,CLOTHING_COLOURS} from './looks-art.js';
/** Authored material IDs, not anatomy or pixel-position guesses. */
export function semanticMaterial(r,g,b){
 const hi=Math.max(r,g,b),lo=Math.min(r,g,b);
 if(hi<25||hi-lo<hi*.55)return 'ink';
 if(r<hi*.25&&g>hi*.82&&b>hi*.82)return 'socket';
 if(r>hi*.78&&g>hi*.78&&b<hi*.35)return 'fixed';
 if(r===hi)return 'skin';
 return g>=b?'clothing':'hair';
}
const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
export function semanticDefaults(identity='rust'){
 const defaults={elder:{skin:'brown',hair:'grey',clothing:'forest'},teal:{skin:'copper',hair:'brown',clothing:'teal'},indigo:{skin:'tan',hair:'brown',clothing:'indigo'},ochre:{skin:'warm light',hair:'brown',clothing:'ochre'},blue:{skin:'warm light',hair:'brown',clothing:'indigo'},'blue-girl':{skin:'warm light',hair:'brown',clothing:'indigo'},boy:{skin:'warm light',hair:'fair',clothing:'cream'},girl:{skin:'warm light',hair:'brown',clothing:'clay'}};
 return defaults[identity]||{skin:'tan',hair:'brown',clothing:'rust'};
}
export function removeSocketPixels(imageData){
 const d=imageData.data;for(let i=0;i<d.length;i+=4)if(semanticMaterial(d[i],d[i+1],d[i+2])==='socket')d[i+3]=0;return imageData;
}
export function tintSemanticFrame(imageData,appearance={}, {neutralClothing=false,fixedTint=[151,116,71]}={}){
 const targets={skin:rgb(SKIN_COLOURS[appearance.skin]||SKIN_COLOURS.tan),hair:rgb(HAIR_COLOURS[appearance.hair]||HAIR_COLOURS.brown),clothing:rgb(CLOTHING_COLOURS[appearance.clothing]||CLOTHING_COLOURS.rust),fixed:fixedTint};
 const d=imageData.data;
 for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const r=d[i],g=d[i+1],b=d[i+2],part=semanticMaterial(r,g,b);
  if(part==='socket'){d[i+3]=0;continue;}
  if(part==='ink'){
    const v=(r+g+b)/3;
    if(neutralClothing&&v>70){for(let c=0;c<3;c++)d[i+c]=Math.round(targets.clothing[c]*v/255);}
    else{d[i]=Math.min(255,v*1.05);d[i+1]=Math.min(255,v);d[i+2]=Math.min(255,v*.91);}continue;
  }
  const shade=Math.max(r,g,b)/255;for(let c=0;c<3;c++)d[i+c]=Math.round(targets[part][c]*shade);
 }
 return imageData;
}
