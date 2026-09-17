// Write the twelve Claude-drawn portrait SVGs (docs/ART_REQUESTS.md, request 2026-09-15 - face portraits for the family panel).
//
// One drawing, parameterised: the same head, shoulders and face for everybody, dressed and coloured after the figure Astra
// drew for the cast (`rust`, `teal`, ... `infant`), so a portrait is recognisably the map figure's person at 44 and 56 CSS
// pixels. They are stand-ins: Astra's `portrait-<figure>` frames replace them when registered, and these sources go.
//
// Run: node scripts/draw-claude-portraits.mjs   (then npm run build:standins)
import { writeFileSync } from 'node:fs';
import { root, sourceOf } from './build-claude-standins.mjs';

const OUT = '#1a0e08';

/**
 * The cast, as Astra drew them (public/assets/frontier-v1, `*-idle-s`). skin/hair are the figure's; `wear` is the
 * clothes at the shoulders; `hair` the style; `head` a hat or bonnet; `age` sets the proportions.
 */
const CAST = {
  rust: { age: 'adult', skin: '#d9a879', hair: '#2a1a10', hairStyle: 'short', beard: '#2a1a10', head: 'hat', wear: { kind: 'shirt', colour: '#a9512d', kerchief: '#2f3a3a', straps: '#c9a46a' } },
  teal: { age: 'adult', skin: '#b07a4e', hair: '#2a1a10', hairStyle: 'loose', wear: { kind: 'blouse', colour: '#4f7f78' } },
  elder: { age: 'adult', skin: '#7a4a2a', hair: '#c9c2b4', hairStyle: 'short', beard: '#c9c2b4', head: 'hat', wear: { kind: 'waistcoat', colour: '#ecdfc4', vest: '#6a5a3a' } },
  blue: { age: 'youth', skin: '#e2b48a', hair: '#2a1a10', hairStyle: 'short', wear: { kind: 'shirt', colour: '#5a78a0', straps: '#8a6a44' } },
  'rust-woman': { age: 'adult', skin: '#d9a879', hair: '#2a1a10', hairStyle: 'loose', head: 'bonnet', wear: { kind: 'blouse', colour: '#a9512d', ribbon: '#f3e6c6' } },
  indigo: { age: 'adult', skin: '#c8946a', hair: '#2a1a10', hairStyle: 'pinned', wear: { kind: 'dress', colour: '#3f4f7a', kerchief: '#f3e6c6' } },
  ochre: { age: 'adult', skin: '#e0b088', hair: '#2a1a10', hairStyle: 'short', wear: { kind: 'waistcoat', colour: '#d4a040', vest: '#5a3a24' } },
  'blue-girl': { age: 'youth', skin: '#d4a070', hair: '#2a1a10', hairStyle: 'braid', wear: { kind: 'dress', colour: '#5a78a0', collar: '#f3e6c6' } },
  girl: { age: 'child', skin: '#c8946a', hair: '#2a1a10', hairStyle: 'braids', wear: { kind: 'dress', colour: '#b05a4a', pinafore: '#f3e6c6' } },
  boy: { age: 'child', skin: '#f0c8a0', hair: '#d8b878', hairStyle: 'tousled', wear: { kind: 'shirt', colour: '#e8dcc0', straps: '#6a4a2a', one: true } },
  smallchild: { age: 'small', skin: '#d9a879', hair: '#3a2416', hairStyle: 'tousled', wear: { kind: 'gown', colour: '#efe4cc' } },
  infant: { age: 'infant', skin: '#e8c0a0', hair: '#3a2416' },
};

const shade = (hex, amount) => {
  const n = parseInt(hex.slice(1), 16);
  const channel = shift => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * (1 + amount))));
  return `#${[16, 8, 0].map(channel).map(v => v.toString(16).padStart(2, '0')).join('')}`;
};
const grad = (id, colour, dir = '1 1') => `<linearGradient id="${id}" x1="0" y1="0" x2="${dir.split(' ')[0]}" y2="${dir.split(' ')[1]}"><stop offset="0" stop-color="${shade(colour, 0.18)}"/><stop offset="0.55" stop-color="${colour}"/><stop offset="1" stop-color="${shade(colour, -0.32)}"/></linearGradient>`;

/** Proportions by age: the head's half-width and half-height, and where the shoulders begin. */
const SIZE = { adult: { rx: 40, ry: 48, cy: 84, neck: 22, shoulder: 148 }, youth: { rx: 41, ry: 47, cy: 86, neck: 20, shoulder: 150 },
  child: { rx: 44, ry: 45, cy: 90, neck: 18, shoulder: 154 }, small: { rx: 46, ry: 45, cy: 92, neck: 17, shoulder: 158 } };

function portrait(name, spec) {
  const p = `p-${name}`;
  if (spec.age === 'infant') return infant(name, spec);
  const S = SIZE[spec.age], cx = 96, cy = S.cy, top = cy - S.ry, chin = cy + S.ry;
  const skin = spec.skin, w = spec.wear;
  const defs = [grad(`${p}-skin`, skin, '0.3 1'), grad(`${p}-hair`, spec.hair), grad(`${p}-cloth`, w.colour)];
  if (w.vest) defs.push(grad(`${p}-vest`, w.vest));
  if (spec.head) defs.push(grad(`${p}-hat`, spec.head === 'hat' ? '#c8a36c' : '#e6d6b4'));
  const parts = [];
  // hair behind the head: loose hair and braids fall over the shoulders
  if (spec.hairStyle === 'loose') parts.push(`<path d="M ${cx - S.rx - 6} ${cy - 10} Q ${cx - S.rx - 22} ${chin + 30} ${cx - S.rx + 4} ${chin + 44} L ${cx + S.rx - 4} ${chin + 44} Q ${cx + S.rx + 22} ${chin + 30} ${cx + S.rx + 6} ${cy - 10} Q ${cx} ${top - 26} ${cx - S.rx - 6} ${cy - 10} Z" fill="url(#${p}-hair)" stroke="${OUT}" stroke-width="4"/>`);
  // shoulders and clothes
  const sh = S.shoulder;
  parts.push(`<path d="M 6 192 L 6 ${sh + 22} Q 14 ${sh - 2} 52 ${sh - 12} L ${cx - S.neck} ${sh - 22} L ${cx + S.neck} ${sh - 22} L 140 ${sh - 12} Q 178 ${sh - 2} 186 ${sh + 22} L 186 192 Z" fill="url(#${p}-cloth)" stroke="${OUT}" stroke-width="4"/>`);
  parts.push(`<path d="M 12 ${sh + 18} Q 20 ${sh + 2} 50 ${sh - 6}" fill="none" stroke="${shade(w.colour, 0.45)}" stroke-width="3" opacity="0.8"/>`);
  if (w.kind === 'waistcoat') {
    parts.push(`<path d="M 6 192 L 6 ${sh + 22} Q 14 ${sh - 2} 52 ${sh - 12} L 72 ${sh - 4} L 78 192 Z M 186 192 L 186 ${sh + 22} Q 178 ${sh - 2} 140 ${sh - 12} L 120 ${sh - 4} L 114 192 Z" fill="url(#${p}-vest)" stroke="${OUT}" stroke-width="4"/>`);
    parts.push(`<circle cx="76" cy="${sh + 30}" r="3" fill="${OUT}"/><circle cx="116" cy="${sh + 30}" r="3" fill="${OUT}"/>`);
  }
  if (w.straps) parts.push(`<path d="M ${w.one ? 66 : 62} ${sh - 10} L ${w.one ? 70 : 60} 192 ${w.one ? '' : `M 130 ${sh - 10} L 132 192`}" fill="none" stroke="${OUT}" stroke-width="14"/><path d="M ${w.one ? 66 : 62} ${sh - 10} L ${w.one ? 70 : 60} 192 ${w.one ? '' : `M 130 ${sh - 10} L 132 192`}" fill="none" stroke="${w.straps}" stroke-width="9"/>`);
  if (w.pinafore) parts.push(`<path d="M 56 192 L 56 ${sh - 8} L 66 ${sh - 12} L 66 192 Z M 136 192 L 136 ${sh - 8} L 126 ${sh - 12} L 126 192 Z M 60 ${sh + 24} L 132 ${sh + 24} L 132 192 L 60 192 Z" fill="${w.pinafore}" stroke="${OUT}" stroke-width="3.5"/>`);
  if (w.kerchief) parts.push(`<path d="M ${cx - S.neck - 12} ${sh - 14} L ${cx} ${sh + 40} L ${cx + S.neck + 12} ${sh - 14} Q ${cx} ${sh + 4} ${cx - S.neck - 12} ${sh - 14} Z" fill="${w.kerchief}" stroke="${OUT}" stroke-width="3.5"/><path d="M ${cx - 10} ${sh + 4} L ${cx + 10} ${sh + 4}" fill="none" stroke="${shade(w.kerchief, -0.35)}" stroke-width="3"/>`);
  if (w.collar) parts.push(`<path d="M ${cx - S.neck - 8} ${sh - 12} L ${cx - 6} ${sh + 16} L ${cx} ${sh + 4} L ${cx + 6} ${sh + 16} L ${cx + S.neck + 8} ${sh - 12} Q ${cx} ${sh + 2} ${cx - S.neck - 8} ${sh - 12} Z" fill="${w.collar}" stroke="${OUT}" stroke-width="3.5"/>`);
  if (w.ribbon) parts.push(`<path d="M ${cx - 16} ${sh + 2} Q ${cx - 30} ${sh - 8} ${cx - 26} ${sh + 16} Q ${cx - 12} ${sh + 12} ${cx} ${sh + 4} Q ${cx + 12} ${sh + 12} ${cx + 26} ${sh + 16} Q ${cx + 30} ${sh - 8} ${cx + 16} ${sh + 2} Z" fill="${w.ribbon}" stroke="${OUT}" stroke-width="3.5"/>`);
  // neck
  parts.push(`<path d="M ${cx - S.neck} ${chin - 14} L ${cx - S.neck} ${sh - 18} Q ${cx} ${sh - 4} ${cx + S.neck} ${sh - 18} L ${cx + S.neck} ${chin - 14} Z" fill="${shade(skin, -0.22)}" stroke="${OUT}" stroke-width="4"/>`);
  // ears, then the head
  parts.push(`<ellipse cx="${cx - S.rx + 2}" cy="${cy + 6}" rx="9" ry="12" fill="url(#${p}-skin)" stroke="${OUT}" stroke-width="3.5"/><ellipse cx="${cx + S.rx - 2}" cy="${cy + 6}" rx="9" ry="12" fill="url(#${p}-skin)" stroke="${OUT}" stroke-width="3.5"/>`);
  parts.push(`<path d="M ${cx - S.rx} ${cy - 6} Q ${cx - S.rx} ${top} ${cx} ${top} Q ${cx + S.rx} ${top} ${cx + S.rx} ${cy - 6} Q ${cx + S.rx - 2} ${chin - 8} ${cx} ${chin} Q ${cx - S.rx + 2} ${chin - 8} ${cx - S.rx} ${cy - 6} Z" fill="url(#${p}-skin)" stroke="${OUT}" stroke-width="4"/>`);
  parts.push(`<path d="M ${cx - S.rx + 8} ${cy - 4} Q ${cx - S.rx + 12} ${top + 14} ${cx - 12} ${top + 6}" fill="none" stroke="${shade(skin, 0.3)}" stroke-width="3" opacity="0.8"/>`);
  // the face: brows, eyes, nose, mouth
  const ey = cy + 4, ex = 17, er = spec.age === 'adult' ? 6.5 : 8;
  parts.push(`<path d="M ${cx - ex - 9} ${ey - 15} Q ${cx - ex} ${ey - 21} ${cx - ex + 9} ${ey - 16} M ${cx + ex - 9} ${ey - 16} Q ${cx + ex} ${ey - 21} ${cx + ex + 9} ${ey - 15}" fill="none" stroke="${spec.hair}" stroke-width="3.5"/>`);
  parts.push(`<ellipse cx="${cx - ex}" cy="${ey}" rx="${er}" ry="${er + 1.5}" fill="${OUT}"/><ellipse cx="${cx + ex}" cy="${ey}" rx="${er}" ry="${er + 1.5}" fill="${OUT}"/>`);
  parts.push(`<circle cx="${cx - ex - 2.5}" cy="${ey - 3}" r="2.4" fill="#fff"/><circle cx="${cx + ex - 2.5}" cy="${ey - 3}" r="2.4" fill="#fff"/>`);
  parts.push(`<path d="M ${cx - 3} ${ey + 10} Q ${cx + 1} ${ey + 16} ${cx + 5} ${ey + 12}" fill="none" stroke="${shade(skin, -0.45)}" stroke-width="3"/>`);
  parts.push(`<path d="M ${cx - 10} ${ey + 24} Q ${cx} ${ey + 31} ${cx + 10} ${ey + 24}" fill="none" stroke="${shade(skin, -0.5)}" stroke-width="3.2"/>`);
  if (spec.age !== 'adult') parts.push(`<ellipse cx="${cx - ex - 8}" cy="${ey + 14}" rx="7" ry="4" fill="#d98070" opacity="0.35"/><ellipse cx="${cx + ex + 8}" cy="${ey + 14}" rx="7" ry="4" fill="#d98070" opacity="0.35"/>`);
  // beard
  // a short beard along the jaw, the mouth left clear
  if (spec.beard) parts.push(`<path d="M ${cx - S.rx + 6} ${cy + 20} Q ${cx - S.rx + 6} ${chin + 8} ${cx} ${chin + 10} Q ${cx + S.rx - 6} ${chin + 8} ${cx + S.rx - 6} ${cy + 20} Q ${cx + S.rx - 14} ${chin - 4} ${cx + 14} ${ey + 34} Q ${cx} ${ey + 38} ${cx - 14} ${ey + 34} Q ${cx - S.rx + 14} ${chin - 4} ${cx - S.rx + 6} ${cy + 20} Z" fill="${spec.beard}" stroke="${OUT}" stroke-width="3.5"/>`);
  // hair on top
  const H = `url(#${p}-hair)`;
  if (spec.hairStyle === 'short') parts.push(`<path d="M ${cx - S.rx - 2} ${cy - 8} Q ${cx - S.rx - 4} ${top - 10} ${cx} ${top - 12} Q ${cx + S.rx + 4} ${top - 10} ${cx + S.rx + 2} ${cy - 8} Q ${cx + S.rx - 6} ${cy - 14} ${cx + 20} ${top + 10} Q ${cx} ${top + 4} ${cx - 24} ${top + 12} Q ${cx - S.rx + 4} ${cy - 12} ${cx - S.rx - 2} ${cy - 8} Z" fill="${H}" stroke="${OUT}" stroke-width="4"/>`);
  if (spec.hairStyle === 'tousled') parts.push(`<path d="M ${cx - S.rx - 3} ${cy - 4} Q ${cx - S.rx - 8} ${top - 6} ${cx - 20} ${top - 12} Q ${cx} ${top - 18} ${cx + 22} ${top - 10} Q ${cx + S.rx + 8} ${top - 4} ${cx + S.rx + 3} ${cy - 4} Q ${cx + S.rx - 4} ${cy - 16} ${cx + 24} ${top + 8} L ${cx + 8} ${top + 14} L ${cx - 6} ${top + 6} L ${cx - 22} ${top + 14} Q ${cx - S.rx + 4} ${cy - 14} ${cx - S.rx - 3} ${cy - 4} Z" fill="${H}" stroke="${OUT}" stroke-width="4"/>`);
  if (spec.hairStyle === 'loose' || spec.hairStyle === 'braid' || spec.hairStyle === 'braids' || spec.hairStyle === 'pinned') {
    parts.push(`<path d="M ${cx - S.rx - 2} ${cy - 2} Q ${cx - S.rx - 4} ${top - 8} ${cx} ${top - 10} Q ${cx + S.rx + 4} ${top - 8} ${cx + S.rx + 2} ${cy - 2} Q ${cx + S.rx - 4} ${cy - 20} ${cx + 4} ${top + 10} Q ${cx - 20} ${top + 2} ${cx - S.rx + 4} ${cy - 8} Q ${cx - S.rx - 2} ${cy - 6} ${cx - S.rx - 2} ${cy - 2} Z" fill="${H}" stroke="${OUT}" stroke-width="4"/>`);
    parts.push(`<path d="M ${cx - 30} ${top + 2} Q ${cx - 6} ${top - 4} ${cx + 16} ${top + 4}" fill="none" stroke="${shade(spec.hair, 1.6)}" stroke-width="2.4" opacity="0.5"/>`);
  }
  if (spec.hairStyle === 'pinned') parts.push(`<ellipse cx="${cx + S.rx - 6}" cy="${top + 8}" rx="16" ry="13" fill="${H}" stroke="${OUT}" stroke-width="4"/>`);
  if (spec.hairStyle === 'braid') parts.push(`<path d="M ${cx + S.rx - 8} ${cy + 20} Q ${cx + S.rx + 12} ${chin + 20} ${cx + S.rx + 4} 192" fill="none" stroke="${OUT}" stroke-width="22"/><path d="M ${cx + S.rx - 8} ${cy + 20} Q ${cx + S.rx + 12} ${chin + 20} ${cx + S.rx + 4} 192" fill="none" stroke="${spec.hair}" stroke-width="16"/><path d="M ${cx + S.rx - 2} ${cy + 34} l 8 6 m -6 12 l 8 6 m -6 12 l 8 6 m -6 12 l 8 6" fill="none" stroke="${shade(spec.hair, 1.8)}" stroke-width="2.4" opacity="0.6"/>`);
  if (spec.hairStyle === 'braids') parts.push(`<path d="M ${cx - S.rx + 6} ${cy + 18} Q ${cx - S.rx - 12} ${chin + 20} ${cx - S.rx - 6} 192 M ${cx + S.rx - 6} ${cy + 18} Q ${cx + S.rx + 12} ${chin + 20} ${cx + S.rx + 6} 192" fill="none" stroke="${OUT}" stroke-width="20"/><path d="M ${cx - S.rx + 6} ${cy + 18} Q ${cx - S.rx - 12} ${chin + 20} ${cx - S.rx - 6} 192 M ${cx + S.rx - 6} ${cy + 18} Q ${cx + S.rx + 12} ${chin + 20} ${cx + S.rx + 6} 192" fill="none" stroke="${spec.hair}" stroke-width="14"/>`);
  // hat or bonnet
  if (spec.head === 'hat') {
    parts.push(`<path d="M ${cx - S.rx - 30} ${top + 14} Q ${cx} ${top - 4} ${cx + S.rx + 30} ${top + 14} Q ${cx + S.rx + 34} ${top + 24} ${cx + S.rx + 22} ${top + 26} Q ${cx} ${top + 12} ${cx - S.rx - 22} ${top + 26} Q ${cx - S.rx - 34} ${top + 24} ${cx - S.rx - 30} ${top + 14} Z" fill="url(#${p}-hat)" stroke="${OUT}" stroke-width="4"/>`);
    parts.push(`<path d="M ${cx - S.rx + 6} ${top + 12} Q ${cx - S.rx + 8} ${top - 38} ${cx} ${top - 40} Q ${cx + S.rx - 8} ${top - 38} ${cx + S.rx - 6} ${top + 12} Q ${cx} ${top + 4} ${cx - S.rx + 6} ${top + 12} Z" fill="url(#${p}-hat)" stroke="${OUT}" stroke-width="4"/>`);
    parts.push(`<path d="M ${cx - S.rx + 6} ${top + 2} Q ${cx} ${top + 12} ${cx + S.rx - 6} ${top + 2} L ${cx + S.rx - 6} ${top + 10} Q ${cx} ${top + 20} ${cx - S.rx + 6} ${top + 10} Z" fill="#8c683d" stroke="${OUT}" stroke-width="2.6"/>`);
    parts.push(`<path d="M ${cx - S.rx + 12} ${top - 6} Q ${cx - S.rx + 16} ${top - 30} ${cx - 8} ${top - 34}" fill="none" stroke="#efd9a8" stroke-width="3" opacity="0.8"/>`);
  }
  if (spec.head === 'bonnet') {
    parts.push(`<path d="M ${cx - S.rx - 16} ${cy + 12} Q ${cx - S.rx - 24} ${top - 20} ${cx} ${top - 26} Q ${cx + S.rx + 24} ${top - 20} ${cx + S.rx + 16} ${cy + 12} Q ${cx + S.rx + 4} ${cy + 16} ${cx + S.rx - 2} ${cy + 2} Q ${cx + S.rx - 6} ${top - 2} ${cx} ${top - 4} Q ${cx - S.rx + 6} ${top - 2} ${cx - S.rx + 2} ${cy + 2} Q ${cx - S.rx - 4} ${cy + 16} ${cx - S.rx - 16} ${cy + 12} Z" fill="url(#${p}-hat)" stroke="${OUT}" stroke-width="4"/>`);
    parts.push(`<path d="M ${cx - S.rx - 12} ${cy - 6} Q ${cx - S.rx - 8} ${top - 10} ${cx - 10} ${top - 18}" fill="none" stroke="#fbf1d8" stroke-width="3" opacity="0.8"/>`);
  }
  return wrap(name, defs, parts, 'head and shoulders');
}

function infant(name, spec) {
  const p = `p-${name}`;
  const defs = [grad(`${p}-basket`, '#b8875a'), grad(`${p}-wrap`, '#f3e6c6', '0.3 1'), grad(`${p}-skin`, spec.skin, '0.3 1')];
  const parts = [];
  // the basket's back and sides, the swaddled baby lying in it head up, then the front of the basket over the wrap's foot
  parts.push(`<path d="M 10 70 Q 96 40 182 70 L 176 184 Q 96 196 16 184 Z" fill="url(#${p}-basket)" stroke="${OUT}" stroke-width="4"/>`);
  parts.push(`<path d="M 16 92 Q 96 66 176 92 M 16 116 Q 96 90 176 116" fill="none" stroke="#5e3d1e" stroke-width="3" opacity="0.6"/>`);
  parts.push(`<path d="M 22 76 Q 96 50 170 76" fill="none" stroke="#e8c898" stroke-width="3" opacity="0.7"/>`);
  parts.push(`<path d="M 34 110 Q 30 40 96 34 Q 162 40 158 110 Q 150 170 96 176 Q 42 170 34 110 Z" fill="url(#${p}-wrap)" stroke="${OUT}" stroke-width="4"/>`);
  parts.push(`<path d="M 50 122 Q 96 104 142 122 M 46 142 Q 96 126 146 142" fill="none" stroke="#c9b48a" stroke-width="3" opacity="0.7"/>`);
  parts.push(`<path d="M 60 80 Q 60 44 96 42 Q 132 44 132 80 Q 122 104 96 106 Q 70 104 60 80 Z" fill="url(#${p}-skin)" stroke="${OUT}" stroke-width="4"/>`);
  parts.push(`<path d="M 68 56 Q 96 36 124 56 Q 110 48 96 52 Q 82 48 68 56 Z" fill="${spec.hair}" stroke="${OUT}" stroke-width="3"/>`);
  parts.push(`<ellipse cx="82" cy="76" rx="7" ry="8" fill="${OUT}"/><ellipse cx="110" cy="76" rx="7" ry="8" fill="${OUT}"/><circle cx="80" cy="73" r="2.2" fill="#fff"/><circle cx="108" cy="73" r="2.2" fill="#fff"/>`);
  parts.push(`<path d="M 90 94 Q 96 98 102 94" fill="none" stroke="#a06a44" stroke-width="3"/><ellipse cx="70" cy="88" rx="6" ry="3.5" fill="#d98070" opacity="0.4"/><ellipse cx="122" cy="88" rx="6" ry="3.5" fill="#d98070" opacity="0.4"/>`);
  parts.push(`<path d="M 6 148 Q 96 122 186 148 L 180 186 Q 96 200 12 186 Z" fill="url(#${p}-basket)" stroke="${OUT}" stroke-width="4"/>`);
  parts.push(`<path d="M 18 156 Q 96 132 174 156 M 20 172 Q 96 150 172 172" fill="none" stroke="#5e3d1e" stroke-width="3" opacity="0.6"/>`);
  parts.push(`<path d="M 14 150 Q 96 126 178 150" fill="none" stroke="#e8c898" stroke-width="3" opacity="0.7"/>`);
  return wrap(name, defs, parts, 'the swaddled infant in the basket');
}

function wrap(name, defs, parts, what) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <!-- portrait-${name}: ${what}, facing the viewer, after Astra's ${name} figure. Claude-drawn stand-in, generated by
       scripts/draw-claude-portraits.mjs; replace with Astra's portrait-${name} (request 2026-09-15, face portraits). -->
  <defs>
    ${defs.join('\n    ')}
  </defs>
  <g filter="url(#grain)" stroke-linejoin="round" stroke-linecap="round">
    ${parts.join('\n    ')}
  </g>
</svg>
`;
}

for (const [name, spec] of Object.entries(CAST)) writeFileSync(root + sourceOf(`portrait-${name}`), portrait(name, spec));
console.log(`wrote ${Object.keys(CAST).length} portrait SVGs to ${root}svg/`);
