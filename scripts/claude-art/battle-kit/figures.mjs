// The battle kit's figures: rig specs (scripts/claude-art/kit/rig.mjs) for the armies of 1835-36, the famous people the
// roster still draws from the library's generic figures, the Esparza family, the Gonzales gun's settlers, a padre and the
// townsmen of Béxar. Area C of docs/CLAUDE_ART_PLAN.md. Claude's temporary art: every face is an original interpretation,
// never a likeness (docs/BATTLES.md §2c; Astra's brief, docs/ART_STYLE.md) - nobody's portrait survives but Enrique Esparza's as
// an old man, and none is claimed.
//
// Sources for the dress (read 2026-09-28 by a research pass, each detail labelled as sure as it is):
//   - Mexican infantry: Reuben Potter's eyewitness "white cotton round jacket & trowsers" and a black shako with a pompom
//     (DOCUMENTED, https://www.tsl.texas.gov/mcardle/sanjac/sanjac106-02.html); the 1821 regulation blue coatee with red collar,
//     cuffs and piping (STRONGLY SUPPORTED as the regulation, https://texianilliad.wordpress.com/2013/06/06/mexican-infantry-uniforms-1836/);
//     crossbelts white by the regulation and black by Potter - DISPUTED: drawn white, as Astra's `regular-*` are; the India Pattern
//     musket with a socket bayonet (STRONGLY SUPPORTED); cazadores with green pompoms (STRONGLY SUPPORTED, secondary); the knapsack
//     and blanket roll an INTERPRETATION. A surviving 1830s shako (https://www.thestoryoftexas.com/discover/artifacts/mexican-army-shako).
//   - Mexican officers: a blue tailcoat with red collar and cuffs, epaulettes, a sash and a bicorne with the tricolour cockade
//     for senior ranks (STRONGLY SUPPORTED, the regulations as Osprey's "Santa Anna's Mexican Army" gives them); a captain's
//     forage cap and sabre an INTERPRETATION.
//   - Texian volunteers: their own clothes - a frock coat or hunting shirt, a broad felt hat, a shot pouch and powder horn, a
//     long rifle or a musket (INTERPRETATION typical of the period, the Alamo's educator packet,
//     https://www.thealamo.org/fileadmin/assets/educator/educators_pdfs/alamo-7th-grade-lesson-plan.pdf).
//   - The named people: the Handbook of Texas records no appearance for any of them (Kimbell, Martin, J. W. Smith, Horton,
//     W. P. Smith, Smither, Condelle, Sánchez Navarro, Barragán, Francisco and Ana Esparza). What is drawn from the record: Kimbell
//     ran a hat factory (so a good hat); Martin kept a store; J. W. Smith was called "El Colorado" (DOCUMENTED; that it meant red
//     hair and not a ruddy face is INTERPRETATION, so he is drawn ruddy with red-brown hair and the prompt says so); Horton raised
//     a mounted company; W. P. Smith was a Methodist preacher and a surgeon; Smither traded horses at Béxar; Condelle was a
//     colonel, Sánchez Navarro a lieutenant colonel on Cos's staff, Barragán a captain (whether of cavalry is UNKNOWN).
//     https://www.tshaonline.org/handbook/entries/martin-albert, .../smith-john-william, .../horton-albert-clinton,
//     .../smither-launcelot, .../salazar-de-esparza-ana; https://www.sonsofdewittcolony.org/drsmith.htm.
//   - Tejano Béxar: a rebozo over a camisa and skirt for women; a short jacket, sash, calzoneras and a wide sombrero for men
//     (INTERPRETATION typical of the period; Sánchez y Tapia's watercolours after Berlandier are the pictures to check,
//     https://www.tshaonline.org/handbook/entries/sanchez-y-tapia-lino).
import { CAST, BUILD } from '../kit/style.mjs';
import * as G from './gear.mjs';

const C = G.COLOURS;
// A woman at the battle figures' height: the soldiers' longer build with a woman's shoulders and hips (the famous sheets draw
// grown women at the `volunteer-*` height, as Mrs. Dickinson and Emily West are).
// The soldiers' own build, fitted on the proof grid to Astra's `volunteer-*` and `regular-*` (2026-09-28): the kit's soldier
// build with a smaller head (her soldiers are nearer seven heads than five) and her broader shoulders and thicker limbs.
export const SOLDIER_BUILD = Object.freeze({ ...BUILD.soldier, head: 8.6, limb: 8.2, shoulderW: 26, hipW: 17, depth: 9.4 });
export const WOMAN_BUILD = Object.freeze({ ...SOLDIER_BUILD, head: 9.2, shoulderW: 21, hipW: 19, limb: 7.2, depth: 8.8, torso: 25 });

// ------------------------------------------------------------------------------------------------ dress
/** A Texian volunteer's frock coat, belt, shot pouch on its strap and powder horn. */
export function volunteerDress({ coat, length = 0.62, pouch = true, horn = true, belt = C.leather, strap = C.leather } = {}) {
  return {
    torso(ink, dc) {
      if (dc.view === 'e') {
        G.coatSkirt(ink, dc, { colour: coat || dc.spec.coat, length });
        if (belt) G.beltSide(ink, dc, { colour: belt });
        if (pouch) { G.strapSide(ink, dc, { colour: strap }); G.pouchAndHorn(ink, dc, { horn }); }
      } else {
        G.skirtFront(ink, dc, { colour: coat || dc.spec.coat, length });
        if (belt) G.beltFront(ink, dc, { colour: belt });
        if (pouch) G.strapFront(ink, dc, { colour: strap, left: dc.view === 's' });
      }
    },
  };
}
/** The Mexican line infantryman's: the coatee's short tails, red collar and cuffs, white crossbelts, a pack on the march. */
export function regularDress({ pack = false, facings = C.red } = {}) {
  return {
    behind(ink, dc) { if (pack && dc.view === 'e') G.knapsackSide(ink, dc); },
    farArm(ink, dc) { G.cuff(ink, dc.armFar, dc.far(facings), dc.B.limb * 0.44); },
    torso(ink, dc) {
      if (dc.view === 'e') {
        G.coatSkirt(ink, dc, { colour: dc.spec.coat, tails: true, length: 0.45, lining: facings });
        G.crossbeltsSide(ink, dc);
        G.collarSide(ink, dc, { colour: facings });
      } else {
        G.skirtFront(ink, dc, { colour: dc.spec.coat, tails: true, length: 0.45 });
        if (dc.back && pack) G.knapsackBack(ink, dc);
        else G.crossbeltsFront(ink, dc);
        if (!dc.back) { G.collarFront(ink, dc, { colour: facings }); }
      }
    },
    front(ink, dc) {
      if (dc.view === 'e') G.cuff(ink, dc.armNear, facings, dc.B.limb * 0.44);
      else for (const a of dc.arms) G.cuff(ink, a.chain, facings, dc.B.limb * 0.44);
    },
  };
}
/** A Mexican officer's: the tailcoat, collar and cuffs, epaulettes, a sash, a sword at the hip, tall boots, a trouser stripe. */
export function officerDress({ facings = C.red, epaulettes = 2, sash = C.red, boots = C.black, stripe = null, sword = true, lapels = true } = {}) {
  return {
    behind(ink, dc) { if (sword && dc.view === 'e') G.drawScabbard(ink, dc.at(-3, 1)); },
    farArm(ink, dc) { G.cuff(ink, dc.armFar, dc.far(facings), dc.B.limb * 0.44); },
    leg(ink, dc) {
      if (stripe && dc.view === 'e' && !dc.isFar) G.trouserStripe(ink, dc.leg, dc.hip, stripe);
      if (boots) G.tallBoot(ink, dc.leg, dc.shade(boots));
    },
    torso(ink, dc) {
      if (dc.view === 'e') {
        G.coatSkirt(ink, dc, { colour: dc.spec.coat, tails: true, length: 0.62, lining: facings });
        if (lapels) dc.spec && ink.shape(G.path([dc.at(3.6, dc.B.torso * 0.95), dc.at(6.8, dc.B.torso * 0.9), dc.at(6.9, dc.B.torso * 0.45), dc.at(4.6, dc.B.torso * 0.45)]) + ' Z', facings, { shade: false, outline: 1.6 });
        G.collarSide(ink, dc, { colour: facings });
        if (sash) G.sashSide(ink, dc, { colour: sash });
      } else {
        G.skirtFront(ink, dc, { colour: dc.spec.coat, tails: true, length: 0.62 });
        if (!dc.back) { G.collarFront(ink, dc, { colour: facings }); G.buttonsFront(ink, dc); }
        if (sash) G.sashFront(ink, dc, { colour: sash });
      }
    },
    front(ink, dc) {
      if (dc.view === 'e') {
        G.cuff(ink, dc.armNear, facings, dc.B.limb * 0.44);
        if (epaulettes) G.epauletteSide(ink, dc);
      } else {
        for (const a of dc.arms) G.cuff(ink, a.chain, facings, dc.B.limb * 0.44);
        if (epaulettes === 2) G.epaulettesFront(ink, dc);
      }
    },
  };
}
/** A Texian gentleman's or officer's frock coat worn open over a waistcoat and a white stock, with boots if he rides. */
export function frockDress({ length = 0.72, waistcoat = null, stock = '#f2ead8', boots = null, belt = null, sash = null } = {}) {
  return {
    leg(ink, dc) { if (boots) G.tallBoot(ink, dc.leg, dc.shade(boots)); },
    torso(ink, dc) {
      const T = dc.B.torso;
      if (dc.view === 'e') {
        G.coatSkirt(ink, dc, { colour: dc.spec.coat, length });
        if (waistcoat) ink.shape(G.path([dc.at(3.2, T * 0.96), dc.at(6.9, T * 0.9), dc.at(7.0, T * 0.2), dc.at(4.0, T * 0.12)]) + ' Z', waistcoat, { shade: false, outline: 1.6 });
        if (stock) ink.shape(G.path([dc.at(1, T * 1.07), dc.at(6.6, T * 1.02), dc.at(6.2, T * 0.84), dc.at(3, T * 0.9)]) + ' Z', stock, { shade: false, outline: 1.6 });
        if (belt) G.beltSide(ink, dc, { colour: belt });
        if (sash) G.sashSide(ink, dc, { colour: sash });
      } else {
        G.skirtFront(ink, dc, { colour: dc.spec.coat, length });
        if (!dc.back) {
          const { at } = dc;
          if (waistcoat) ink.shape(G.path([at(-3.2, T * 0.96), at(3.2, T * 0.96), at(3.6, T * 0.1), at(-3.6, T * 0.1)]) + ' Z', waistcoat, { shade: false, outline: 1.6 });
          if (stock) ink.shape(G.path([at(-2.4, T * 1.06), at(2.4, T * 1.06), at(0, T * 0.8)]) + ' Z', stock, { shade: false, outline: 1.6 });
        }
        if (belt) G.beltFront(ink, dc, { colour: belt });
        if (sash) G.sashFront(ink, dc, { colour: sash });
      }
    },
  };
}
/** A Béxar townsman's short jacket and sash (a Tejano's, or a horse trader's who lived among them). */
export function townDress({ sash = C.red, jacket = null, boots = null } = {}) {
  return {
    leg(ink, dc) { if (boots) G.tallBoot(ink, dc.leg, dc.shade(boots)); },
    torso(ink, dc) {
      const T = dc.B.torso;
      if (dc.view === 'e') {
        if (jacket) ink.shape(G.path([dc.at(-6.9, T * 1.0), dc.at(4.8, T * 1.02), dc.at(5.4, T * 0.35), dc.at(-7, T * 0.3)]) + ' Z', jacket, { off: 0.8 });
        if (sash) G.sashSide(ink, dc, { colour: sash, v: 2 });
      } else {
        if (jacket) for (const s of [-1, 1]) ink.shape(G.path([dc.at(s * 0.8, T * 1.02), dc.at(s * dc.sw, T * 0.98), dc.at(s * dc.hw * 1.2, T * 0.32), dc.at(s * 1.6, T * 0.32)]) + ' Z', jacket, { off: 0.6 });
        if (sash) G.sashFront(ink, dc, { colour: sash, v: 2 });
      }
    },
  };
}
/** A woman's rebozo round the shoulders (the hood over the head is her hat, `G.rebozoHood`). */
export function rebozoDress({ colour, stripe = '#e8dcc0' } = {}) {
  return {
    torso(ink, dc) {
      const T = dc.B.torso;
      if (dc.view === 'e') {
        ink.shape(G.path([dc.at(-7.4, T * 1.06), dc.at(4.6, T * 1.08), dc.at(6.8, T * 0.7), dc.at(-1, T * 0.55), dc.at(-8.4, T * 0.2)]) + ' Z', colour, { off: 0.8 });
        ink.line(G.path([dc.at(-8, T * 0.25), dc.at(-1.2, T * 0.58), dc.at(6.4, T * 0.72)]), { colour: stripe, width: 1.4, opacity: 0.8 });
      } else {
        const { at, sw } = dc;
        ink.shape(G.path([at(-sw * 1.08, T * 1.02), at(sw * 1.08, T * 1.02), at(sw * 1.12, T * 0.4), at(0, T * (dc.back ? 0.2 : 0.55)), at(-sw * 1.12, T * 0.4)]) + ' Z', colour, { off: 0.8 });
      }
    },
  };
}
/** A priest's cassock is his skirt; a short cape over the shoulders. */
export function cassockDress({ colour = '#1e1c1c' } = {}) {
  return {
    torso(ink, dc) {
      const T = dc.B.torso;
      if (dc.view === 'e') ink.shape(G.path([dc.at(-7.2, T * 1.06), dc.at(6.6, T * 1.06), dc.at(7.6, T * 0.62), dc.at(-8, T * 0.6)]) + ' Z', colour, { off: 0.8 });
      else ink.shape(G.path([dc.at(-dc.sw * 1.1, T * 1.04), dc.at(dc.sw * 1.1, T * 1.04), dc.at(dc.sw * 1.15, T * 0.6), dc.at(-dc.sw * 1.15, T * 0.6)]) + ' Z', colour, { off: 0.8 });
    },
  };
}
/** Several dress layers drawn one after another. */
export function layered(...dresses) {
  const out = {};
  for (const layer of ['behind', 'farArm', 'leg', 'torso', 'front']) {
    const fns = dresses.map(d => d[layer]).filter(Boolean);
    if (fns.length) out[layer] = (ink, dc) => fns.forEach(fn => fn(ink, dc));
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ the armies
const soldier = { sex: 'm', age: 'soldier', build: SOLDIER_BUILD };
/** The Texian volunteer, after Astra's `volunteer-*`: a brown frock coat, tan trousers, a broad brown felt hat, a short beard. */
export const VOLUNTEER = Object.freeze({ ...CAST.volunteer, build: SOLDIER_BUILD, hat: { kind: 'brim', colour: '#6a5236', band: '#3a2a1a' }, beardStyle: 'short', coat: '#6b4a2e', longSleeves: true, belt: null, dress: volunteerDress({ coat: '#6b4a2e' }) });
/** The Mexican line infantryman, after Astra's `regular-*`: a blue coatee faced red, white trousers, white crossbelts, the shako. */
export const REGULAR = Object.freeze({ ...CAST.regular, build: SOLDIER_BUILD, hat: G.shako(), facings: null, crossbelt: null, dress: regularDress() });
export const REGULAR_PACK = Object.freeze({ ...REGULAR, dress: regularDress({ pack: true }) });
/** A cazador of a light company (Coleto's marksmen in the grass): the line's uniform with the green pompom of the light companies. */
export const CAZADOR = Object.freeze({ ...REGULAR, hat: G.shako({ pompom: '#3f7a3a' }) });
/** A Mexican company officer on horseback at the head of a column (an interpretation: a shako officer with a sword and sash). */
export const MX_OFFICER = Object.freeze({ ...soldier, skin: '#c98a58', hair: '#2e2018', moustache: '#2e2018', hat: G.shako({ pompom: C.gold, band: C.gold }), coat: '#2f3f6a', shirt: '#2f3f6a',
  lower: { kind: 'trousers', colour: '#e6dcc4' }, feet: '#1e1814', dress: officerDress({ epaulettes: 1, sash: C.red }) });

// The Gonzales gun's crew (request 2026-09-25, battles, item 4): three settlers in their own clothes, the cast's colours.
export const SETTLERS = Object.freeze({
  'settler-a': { ...soldier, skin: '#dca070', hair: '#5a3a22', beard: '#5a3a22', beardStyle: 'short', hat: { kind: 'brim', colour: '#ae7e4b', band: '#5b321a' }, shirt: '#974c30', kerchief: '#2a2622', braces: '#bc8d50',
    lower: { kind: 'trousers', colour: '#a07a4c' }, feet: '#4b2e1a' },
  'settler-b': { ...soldier, skin: '#e09b62', hair: '#433020', hairStyle: 'tousled', hat: { kind: 'wide', colour: '#d8b870', band: '#6a4a2a' }, shirt: '#496a87', braces: '#a36b3d',
    lower: { kind: 'trousers', colour: '#8a6e48', rolled: true }, feet: '#573822' },
  'settler-c': { ...soldier, skin: '#c98e5c', hair: '#3a2a1c', hairStyle: 'swept', moustache: '#3a2a1c', shirt: '#d6852d', waistcoat: '#4c2e1a',
    lower: { kind: 'trousers', colour: '#755843' }, feet: '#57321b' },
});

// ------------------------------------------------------------------------------------------------ the famous people
/**
 * Each: the rig spec, and what the prompt says of them (who, when, what is known and what is interpretation). `mounted` if the
 * roster rides them (`pose: 'ride'` in sim/battles/*.mjs); `falls` if they are killed in the window (Kimbell and Martin at the
 * Alamo - Kimbell's death is told, not drawn, but a still pose keeps the sheet whole); `fires` if they fight with a gun.
 */
export const FAMOUS = Object.freeze({
  kimbell: {
    who: 'George C. Kimbell (born 1803, about 32), a New Yorker who ran a hat factory at Gonzales with Almeron Dickinson and was lieutenant commanding the Gonzales Ranging Company; he rode in with the relief on March 1, 1836 and died at the Alamo',
    look: 'a good grey beaver top hat (he was a hatter - an interpretation), a dark green frock coat open over a tan waistcoat, buff trousers, brown hair, clean-shaven, a long rifle',
    mounted: true, fires: 'rifle', falls: true,
    spec: { ...soldier, skin: '#dca476', hair: '#6a4a2e', hairStyle: 'short', hat: G.tophat({ colour: '#8a8276', band: '#3a342c' }), coat: '#3e4a3a', shirt: '#efe6d0', lower: { kind: 'trousers', colour: '#c2ad84' }, feet: '#3a2616',
      dress: frockDress({ waistcoat: '#c8a060', boots: null }) },
  },
  martin: {
    who: 'Albert Martin (born 1808, about 28), a Rhode Islander who kept a general store at Gonzales, whose wagon wheels carried the Gonzales cannon; he carried Travis\'s letter of February 24 out of the Alamo, came back with the relief on March 1 and died there',
    look: 'a black round hat, a brown frock coat with a red waistcoat, grey trousers, dark hair and side whiskers, riding boots, a long rifle',
    mounted: true, fires: 'rifle', falls: true,
    spec: { ...soldier, skin: '#d8986a', hair: '#3a2618', hairStyle: 'short', beard: '#3a2618', beardStyle: 'short', hat: G.roundhat({ colour: '#23201c', wide: 1.8, crown: 1.1 }), coat: '#5b3a2a', shirt: '#efe6d0',
      lower: { kind: 'trousers', colour: '#7a746a' }, feet: '#241a12', dress: frockDress({ waistcoat: '#8e3a2a', boots: '#2a1e16', length: 0.66 }) },
  },
  'jw-smith': {
    who: 'John W. Smith (born 1792, about 43), a Virginian storekeeper, surveyor and engineer at Béxar, called "El Colorado"; he guided the storming of Béxar, met the truce in December 1835 and carried Travis\'s last letters out on March 3, 1836',
    look: 'a ruddy face and red-brown hair and beard after his nickname "El Colorado" (the nickname is documented; that it meant red hair and not a ruddy face is an interpretation), a blue frock coat, buff trousers, a broad brown felt hat, a long rifle',
    mounted: true, fires: 'rifle',
    spec: { ...soldier, skin: '#e0906a', hair: '#9a4a28', hairStyle: 'short', beard: '#9a4a28', beardStyle: 'short', hat: { kind: 'brim', colour: '#7a5a38', band: '#3a2616' }, coat: '#3a4a6a', shirt: '#efe6d0',
      lower: { kind: 'trousers', colour: '#c2ad84' }, feet: '#3a2616', dress: frockDress({ waistcoat: '#b8a078', length: 0.66, belt: C.leather }) },
  },
  horton: {
    who: 'Albert Clinton Horton (born 1798, about 37), a Matagorda planter who raised a mounted company; at Coleto on March 19, 1836 his horsemen were scouting ahead and were cut off',
    look: 'a planter\'s black frock coat, a cream waistcoat, grey trousers in tall riding boots, a wide tan felt hat, dark hair and a short dark beard, a pistol belt',
    mounted: true, fires: 'rifle',
    spec: { ...soldier, skin: '#d49a6c', hair: '#2e2018', hairStyle: 'short', beard: '#2e2018', beardStyle: 'short', hat: { kind: 'wide', colour: '#b8925a', band: '#4a3420' }, coat: '#2a2826', shirt: '#efe6d0',
      lower: { kind: 'trousers', colour: '#6e6a62' }, feet: '#1e1612', dress: frockDress({ waistcoat: '#e2d4b4', boots: '#221a14', belt: C.leather, length: 0.64 }) },
  },
  'wp-smith': {
    who: 'the Reverend W. P. Smith (born 1795, about 40), a Methodist preacher and a practising surgeon, who addressed the Texians at Gonzales before they marched on October 1, 1835',
    look: 'a preacher\'s long black frock coat and black trousers, a white stock, a broad flat-crowned black hat, greying hair, clean-shaven; unarmed',
    mounted: false, fires: null,
    spec: { ...soldier, skin: '#dca074', hair: '#8a8478', hairStyle: 'short', hat: G.roundhat({ colour: '#1c1a18', wide: 2.1, crown: 0.9, flat: true }), coat: '#1e1c1c', shirt: '#f2ead8',
      lower: { kind: 'trousers', colour: '#26221e' }, feet: '#1a1410', dress: frockDress({ length: 0.9, waistcoat: '#2a2624' }) },
  },
  smither: {
    who: 'Launcelot Smither (born 1800, about 35), a horse trader at Béxar who doctored the garrison, and came to Gonzales with Castañeda as a go-between; he rode into the Texian lines on October 2, 1835 crying "Don\'t shoot"',
    look: 'the dress of a man who lived at Béxar - a short brown leather jacket, a red sash, dark trousers, a wide sombrero - dark hair and a moustache; unarmed',
    mounted: true, fires: null,
    spec: { ...soldier, skin: '#d09062', hair: '#3a2818', hairStyle: 'short', moustache: '#3a2818', hat: G.roundhat({ colour: '#9a7a4a', band: '#4a3420', wide: 2.6, crown: 1.1 }), coat: null, shirt: '#e8dcc0', longSleeves: true,
      lower: { kind: 'trousers', colour: '#3a3a44' }, feet: '#3a2616', dress: townDress({ jacket: '#7a5634', sash: C.red }) },
  },
  condelle: {
    who: 'Colonel Nicolás Condelle, who commanded the Morelos battalion (a permanent battalion) and held the plaza of Béxar in December 1835 ("El Batallón Morelos no se ha rendido nunca")',
    look: 'a Mexican colonel\'s blue tailcoat faced red with gold epaulettes, a red sash, white trousers, tall black boots, a black bicorne worn athwart with the tricolour cockade, greying hair and a moustache, a sword',
    mounted: false, fires: null,
    spec: { ...soldier, skin: '#c48656', hair: '#6e6660', hairStyle: 'short', moustache: '#4a4440', hat: G.bicorne({ cockade: '#2e7a3a' }), coat: '#2f3f6a', shirt: '#2f3f6a',
      lower: { kind: 'trousers', colour: '#e6dcc4' }, feet: '#1a1612', dress: officerDress({ stripe: C.gold }) },
  },
  'sanchez-navarro': {
    who: 'Lieutenant Colonel José Juan Sánchez Navarro of Saltillo, adjutant inspector on General Cos\'s staff, who treated for the capitulation of Béxar in December 1835 and kept a journal',
    look: 'a staff officer\'s blue tailcoat faced red with gold epaulettes and a blue-and-white sash, white trousers, tall boots, a black bicorne with a white plume and the tricolour cockade, dark hair and side whiskers, a sword; a folded paper in the hand for the talks',
    mounted: false, fires: null,
    spec: { ...soldier, skin: '#d09a68', hair: '#241a14', hairStyle: 'swept', beard: '#241a14', beardStyle: 'short', hat: G.bicorne({ plume: '#f2ead8' }), coat: '#2f3f6a', shirt: '#2f3f6a',
      lower: { kind: 'trousers', colour: '#e6dcc4' }, feet: '#1a1612', dress: officerDress({ sash: '#5a78a8', stripe: null }) },
  },
  barragan: {
    who: 'Captain Barragán of the Mexican army, who by Joe\'s account saved him when two soldiers turned on him after the fall of the Alamo, March 6, 1836 (his arm of service is not known)',
    look: 'a captain\'s blue coatee faced red with a single epaulette, a blue forage cap banded red, white trousers, tall black boots, a sabre, a black moustache',
    mounted: false, fires: null,
    spec: { ...soldier, skin: '#c07e50', hair: '#1e1612', hairStyle: 'short', moustache: '#1e1612', hat: G.foragecap(), coat: '#2f3f6a', shirt: '#2f3f6a',
      lower: { kind: 'trousers', colour: '#e6dcc4' }, feet: '#1a1612', dress: officerDress({ epaulettes: 1, sash: null, lapels: false }) },
  },
  castrillon: {
    who: 'General Manuel Fernández Castrillón (killed at San Jacinto, April 21, 1836), as Astra drew him in `famous-castrillon`',
    look: 'Astra\'s Castrillón: a blue coat faced red with gold epaulettes and brass buttons, a red sash, white trousers with a gold stripe, tall black boots, a blue forage cap banded red, grey hair and a grey moustache',
    mounted: false, fires: null,
    spec: { ...soldier, skin: '#c8885a', hair: '#7a7470', hairStyle: 'short', moustache: '#5a5652', hat: G.foragecap({ colour: '#27325a' }), coat: '#27325a', shirt: '#27325a',
      lower: { kind: 'trousers', colour: '#efe4cc' }, feet: '#1a1612', dress: officerDress({ stripe: C.gold, lapels: false }) },
  },
});

// ------------------------------------------------------------------------------------------------ the Esparza family
export const ESPARZA = Object.freeze({
  'ana-esparza': {
    who: 'Ana Salazar de Esparza (about thirty), Gregorio Esparza\'s wife, who went into the Alamo with her four children on February 23, 1836 and was spared',
    look: 'a Tejana woman of Béxar: a slate-blue rebozo over her head and shoulders, a white camisa with long sleeves, a dark red skirt to the ankle, dark hair',
    spec: { sex: 'f', age: 'soldier', build: WOMAN_BUILD, skin: '#c9895a', hair: '#231812', hairStyle: 'bun', hat: G.rebozoHood({ colour: '#56687c' }), shirt: '#efe6d0', longSleeves: true,
      lower: { kind: 'skirt', colour: '#8a3a2a' }, feet: '#3a2616', dress: rebozoDress({ colour: '#56687c' }) },
  },
  'maria-de-jesus': {
    who: 'María de Jesús Castro Esparza (about ten), Ana\'s daughter, in the Alamo with her mother',
    look: 'a Tejana girl: a small rust rebozo round her shoulders, a white camisa, an ochre skirt, two dark braids',
    spec: { sex: 'f', age: 'child', skin: '#c9895a', hair: '#231812', hairStyle: 'braids', shirt: '#efe6d0', longSleeves: true, dress: rebozoDress({ colour: '#a0503a' }),
      lower: { kind: 'skirt', colour: '#b8862e' }, feet: '#3a2616' },
  },
  'enrique-esparza': {
    who: 'Enrique Esparza (about eight), who remembered the siege and the fall in 1902 and 1907',
    look: 'a Tejano boy with dark hair: a white shirt, brown trousers, a red sash, bare-headed',
    spec: { sex: 'm', age: 'child', skin: '#c68656', hair: '#1e1410', hairStyle: 'tousled', shirt: '#efe6d0', longSleeves: true, sash: '#a8342a',
      lower: { kind: 'trousers', colour: '#5a4632' }, feet: '#3a2616' },
  },
  'francisco-esparza': {
    who: 'Francisco Esparza (about thirty), Gregorio\'s brother, who had served in the Béxar presidial company and on March 6, 1836 carried his brother\'s body to the Campo Santo',
    look: 'town clothes of Béxar: a short brown jacket, a white shirt, a red sash, dark blue calzoneras, a wide sombrero, a black moustache',
    spec: { sex: 'm', age: 'soldier', build: SOLDIER_BUILD, skin: '#c07e50', hair: '#1e1612', hairStyle: 'short', moustache: '#1e1612', hat: G.roundhat({ colour: '#8a6a3e', band: '#3a2616', wide: 2.5, crown: 1.1 }), shirt: '#efe6d0', longSleeves: true,
      lower: { kind: 'trousers', colour: '#34405a' }, feet: '#3a2616', dress: townDress({ jacket: '#6a4a30' }) },
  },
  // The second bearer: "one of their brothers" (the Handbook; Francisco's deposition) - a townsman of Béxar in the same dress.
  'esparza-brother': {
    who: 'one of Gregorio\'s brothers, who carried his body with Francisco (the Handbook; Francisco Esparza\'s deposition of 1859)',
    look: 'town clothes of Béxar: a short grey-green jacket, a white shirt, a blue sash, brown calzoneras, a wide straw sombrero',
    spec: { sex: 'm', age: 'soldier', build: SOLDIER_BUILD, skin: '#c48656', hair: '#2a1e16', hairStyle: 'short', moustache: '#2a1e16', hat: G.roundhat({ colour: '#c8a868', band: '#5a4020', wide: 2.5, crown: 1.1 }), shirt: '#efe6d0', longSleeves: true,
      lower: { kind: 'trousers', colour: '#6a4a2e' }, feet: '#3a2616', dress: townDress({ jacket: '#5a6048', sash: '#3a5a8a' }) },
  },
  // Gregorio, after Astra's `famous-esparza`: dark curly hair, a moustache, an olive-brown frock coat, a red kerchief, tan
  // trousers, brown boots. Only his seated pose is Claude's.
  esparza: {
    who: 'Gregorio Esparza (born 1802), who served a gun in the Alamo\'s church and was killed there on March 6, 1836; seated asleep beside his family on the night of March 5, as Astra drew him in `famous-esparza`',
    look: 'Astra\'s Gregorio: dark curly hair, a moustache, an olive-brown frock coat, a white shirt, a red kerchief, tan trousers, brown boots, his musket beside him',
    spec: { sex: 'm', age: 'soldier', build: SOLDIER_BUILD, skin: '#c68656', hair: '#1a1210', hairStyle: 'curly', moustache: '#1a1210', coat: '#554a36', shirt: '#efe6d0', kerchief: '#a8342a',
      lower: { kind: 'trousers', colour: '#a8977a' }, feet: '#4a3a2e', dress: layered(volunteerDress({ coat: '#554a36', pouch: false, belt: C.leather }), { leg: (ink, dc) => G.tallBoot(ink, dc.leg, dc.shade('#4a3a2e')) }) },
  },
});

/** A padre of Béxar (after Concepción the dead and wounded were carried in carts; kept general - Smithwick gives it in outline). */
export const PADRE = Object.freeze({ sex: 'm', age: 'soldier', build: SOLDIER_BUILD, build: SOLDIER_BUILD, skin: '#d0a078', hair: '#8a8478', hairStyle: 'short', hat: G.roundhat({ colour: '#1c1a18', wide: 2.3, crown: 0.8, flat: true }), shirt: '#1e1c1c', coat: '#1e1c1c',
  lower: { kind: 'gown', colour: '#1e1c1c' }, feet: '#1a1410', dress: cassockDress() });
