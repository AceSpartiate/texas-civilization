// Second-cast atlas delivery; imported by the central registry after art review.
// PNG originals are copied unchanged; measurement never rewrites pixels.
export const VARIANTS = ['rust-woman', 'indigo', 'ochre', 'blue-girl'];
const row = actions => VARIANTS.flatMap(p => actions.map(a => `${p}-${a}`));
export const SHEETS = {
  'people-cast2-idle': row(['idle-s', 'idle-e', 'idle-w', 'idle-n']),
  'people-cast2-walk': row([1,2,3,4].map(n => `walk-${n}`)),
  'people-cast2-vertical': row(['walk-s-1','walk-s-2','walk-n-1','walk-n-2']),
  'people-cast2-work': row([1,2,3,4].map(n => `work-${n}`)),
  'people-cast2-carry': row([1,2,3,4].map(n => `carry-${n}`)),
  'people-cast2-tasks': row(['sow-1','sow-2','repair-1','repair-2']),
  'people-cast2-care': row(['rest-pose','injured-pose','care-1','care-2']),
  'people-cast2-search-trade': row(['search-1','search-2','trade-1','trade-2']),
  'people-cast2-dialogue': row(['speak-1','speak-2','listen-s','listen-n']),
};
export const ANIMATION_CLIPS = {};
const clip = (name, sprites, durations = 180, motion = 'none', direction = 'east; west by mirroring') => {
  ANIMATION_CLIPS[name] = { frames: sprites.map((sprite,i) => ({sprite, duration:Array.isArray(durations) ? durations[i] : durations})), loop:true, authored:sprites.length > 1, motion, direction };
};
for (const p of VARIANTS) {
  for (const action of ['walk','work','carry']) clip(`${p}-${action}`, [1,2,3,4].map(n => `${p}-${action}-${n}`), action === 'work' ? [240,120,220,220] : 180);
  for (const d of ['s','n']) clip(`${p}-walk-${d}`, [1,2].map(n => `${p}-walk-${d}-${n}`),220,'none',d === 's' ? 'south' : 'north');
  for (const action of ['sow','repair']) clip(`${p}-${action}`, [1,2].map(n => `${p}-${action}-${n}`),360);
  clip(`${p}-search`,[`${p}-search-1`,`${p}-search-2`],[900,900]);
  clip(`${p}-trade`,[`${p}-trade-1`,`${p}-trade-2`],[500,700]);
  clip(`${p}-care`,[`${p}-care-1`,`${p}-care-2`],420);
  clip(`${p}-rest`,[`${p}-rest-pose`],2500,'breathe');
  clip(`${p}-injured-rest`,[`${p}-injured-pose`],3000,'breathe');
  for (const d of ['s','w','e','n']) clip(`${p}-idle-${d}`,[`${p}-idle-${d}`],2200,'breathe',({s:'south',w:'west',e:'east',n:'north'})[d]);
  clip(`${p}-speak`,[`${p}-speak-1`,`${p}-speak-2`],[750,900]);
  for (const d of ['s','n']) clip(`${p}-listen-${d}`,[`${p}-listen-${d}`],2200,'breathe',d === 's' ? 'south' : 'north');
}
