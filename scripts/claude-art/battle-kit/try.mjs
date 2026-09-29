// Scratch proof while drawing (not evidence): node scripts/claude-art/battle-kit/try.mjs <what> [out.png]
import { fileURLToPath } from 'node:url';
import { personFrame, drawPerson, frameOf } from '../kit/rig.mjs';
import { withBrowser } from '../kit/browser.mjs';
import { proofRows } from './proof.mjs';
import * as F from './figures.mjs';
import * as PO from './poses.mjs';

const what = process.argv[2] || 'soldiers';
const out = process.argv[3] || fileURLToPath(new URL(`../../../test-results/try-${what}.png`, import.meta.url));
const fr = (name, spec, pose) => personFrame(name, ink => drawPerson(ink, spec, pose), { note: name });

const rows = [];
if (what === 'soldiers') {
  for (const [label, spec, kind, refs] of [['volunteer', F.VOLUNTEER, 'rifle', 'volunteer'], ['regular', F.REGULAR, 'musket', 'regular']]) {
    const Fm = frameOf(spec);
    const c = PO.fireCycle(Fm, { kind });
    rows.push({ title: `${label}: fire cycle`, items: [{ astra: `${refs}-aim` }, { astra: `${refs}-fire` }, { astra: `${refs}-load` }, { astra: `${refs}-ramrod` },
      ...['aim', 'fire', 'load', 'ramrod'].map(k => ({ label: k, frame: fr(`${label}-${k}`, spec, c[k]) }))] });
    rows.push({ title: `${label}: march`, items: [{ astra: `${refs}-march-1` }, { astra: `${refs}-march-2` }, ...PO.march(Fm, { kind }).map((p, i) => ({ label: `march ${i + 1}`, frame: fr(`${label}-m${i}`, spec, p) })),
      { label: 'stand', frame: fr(`${label}-st`, spec, PO.standOrdered(Fm, { kind })) }, { label: 'fall', frame: fr(`${label}-fa`, spec, PO.fall(Fm)) }] });
    rows.push({ title: `${label}: run and kneel`, items: [...PO.run(Fm, { kind }).map((p, i) => ({ label: `run ${i + 1}`, frame: fr(`${label}-r${i}`, spec, p) })),
      ...Object.entries(PO.kneelFire(Fm, { kind })).map(([k, p]) => ({ label: `kneel ${k}`, frame: fr(`${label}-k${k}`, spec, p) }))] });
    rows.push({ title: `${label}: onion (march)`, onion: true, items: PO.march(Fm, { kind }).map((p, i) => ({ frame: fr(`${label}-om${i}`, spec, p) })) });
  }
}
if (what === 'officers') {
  for (const [id, one] of Object.entries(F.FAMOUS)) {
    const Fm = frameOf(one.spec), o = PO.officer(Fm);
    rows.push({ title: id, items: [...Object.entries(o).map(([k, p]) => ({ label: k, frame: fr(`${id}-${k}`, one.spec, p) })),
      ...PO.march(Fm, { kind: 'rifle' }).slice(0, 2).map((p, i) => ({ label: `walk ${i}`, frame: fr(`${id}-w${i}`, one.spec, { ...p, tool: null }) })),
      { label: 's', frame: fr(`${id}-s`, one.spec, { view: 's' }) }, { label: 'n', frame: fr(`${id}-n`, one.spec, { view: 'n' }) }] });
  }
}
await withBrowser(async page => { await proofRows(page, rows, out); });
console.log(out);
