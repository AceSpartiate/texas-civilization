// The regressions the tests of Astra's four last deliveries of 2026-09-21 guard, injected one at a time (CLAUDE.md: "A new
// test is not evidence until it has failed"). Each injection replaces one exact piece of one file with the mistake a test
// is written against, runs that test's own file, records which tests failed, and puts the file back byte for byte. It
// stops if a replacement does not match exactly once, so a stale injection is never passed off as a proof.
//
// The nine batches wired earlier the same day have their own script beside this one, scripts/art-wiring-injections.mjs.
// The four here are the mounted family, the seated wagon drivers, the mustang and the Yellow Stone under way, and the
// Alamo's south-facing elevation strips.
//
// This working copy is checked out CRLF (`core.autocrlf=true`). Every replacement is put into the file's own line ending
// before it is matched: three harnesses in this repository have been found silently matching nothing for exactly that.
//
// Run: node scripts/mounted-wiring-injections.mjs  → writes docs/evidence/mounted-wiring-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const LIBRARY = ['tests/art-library.test.mjs'];
const RIDE = ['tests/riding.test.mjs', 'tests/art-library.test.mjs'];
const HUNT = ['tests/biome-game.test.mjs', 'tests/art-library.test.mjs'];
const ALAMO = ['tests/alamo-faces.test.mjs', 'tests/art-library.test.mjs'];

const INJECTIONS = [
  // ---- the mounted family (people-mounted-cast1/2-e/s/n) -----------------------------------------------------------
  {
    name: 'the mounted family is delivered and still not drawn, as it was the day the six sheets landed',
    file: 'public/motion.js', tests: RIDE,
    from: "export const RIDING_FIGURES = Object.freeze(['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl']);",
    to: 'export const RIDING_FIGURES = Object.freeze([]);',
  },
  {
    name: 'only the first cast rides its own horse, so half of a rolled family is a cropped figure over a horse again',
    file: 'public/motion.js', tests: RIDE,
    from: "export const RIDING_FIGURES = Object.freeze(['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl']);",
    to: "export const RIDING_FIGURES = Object.freeze(['rust', 'teal', 'elder', 'blue']);",
  },
  {
    name: 'a child is given a mounted sheet nobody painted, so a girl of twelve on the horse draws nothing at all',
    file: 'public/motion.js', tests: RIDE,
    from: "export const RIDING_FIGURES = Object.freeze(['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl']);",
    to: "export const RIDING_FIGURES = Object.freeze(['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl', 'girl', 'boy']);",
  },
  {
    name: 'a rider going north is mirrored like an east-facing one, so they ride away backwards',
    file: 'public/motion.js', tests: RIDE,
    from: "    return { id: `${figure}-ride-${facing === 'w' ? 'e' : facing}`, whole: true, ...(facing === 'n' || facing === 's' ? { upright: true } : {}) };",
    to: '    return { id: `${figure}-ride-${facing === \'w\' ? \'e\' : facing}`, whole: true };',
  },
  {
    name: 'west asks for a west sheet, which was never painted: east is the one that is mirrored',
    file: 'public/motion.js', tests: RIDE,
    from: "    return { id: `${figure}-ride-${facing === 'w' ? 'e' : facing}`, whole: true, ...(facing === 'n' || facing === 's' ? { upright: true } : {}) };",
    to: '    return { id: `${figure}-ride-${facing}`, whole: true, ...(facing === \'n\' || facing === \'s\' ? { upright: true } : {}) };',
  },
  {
    name: 'the old horse is left under the painted one, so a rider rides two horses',
    file: 'public/motion.js', tests: RIDE,
    from: "    if (delivered > 0) return [{ part: 'rider', dx: 0, dy: 0, height: delivered, whole: true }];",
    to: "    if (delivered > 0) return [{ part: 'horse', dx: 0, dy: 0, height: horse }, { part: 'rider', dx: 0, dy: 0, height: delivered, whole: true }];",
  },
  {
    name: 'the page asks for the person alone and puts them on the horse, so the delivered rig is drawn by nothing',
    file: 'public/app.js', tests: RIDE,
    from: '  const delivered = seatedClip(entity, direction, seat);',
    to: '  const delivered = seatedClip(entity, direction, null);',
  },
  {
    name: 'the painted rig is drawn at a person\'s height, so the horse under the rider is a toy again',
    file: 'public/app.js', tests: RIDE,
    from: "  for (const part of seatLayout(seat, direction, SIZE, figureScale(entity), ready ? (seat === 'horse' ? MOUNTED_HEIGHT : 1) : 0)) {",
    to: '  for (const part of seatLayout(seat, direction, SIZE, figureScale(entity), ready ? 1 : 0)) {',
  },

  // ---- the seated wagon drivers (people-wagon-drivers) --------------------------------------------------------------
  {
    name: 'the drivers are delivered and still not drawn: a driver is a standing figure cut off at the hip again',
    file: 'public/motion.js', tests: RIDE,
    from: "export const DRIVING_FIGURES = Object.freeze(['rust', 'teal', 'elder', 'blue']);",
    to: 'export const DRIVING_FIGURES = Object.freeze([]);',
  },
  {
    name: 'second-cast driver layers are inferred, and a woman in indigo driving draws nothing',
    file: 'public/motion.js', tests: RIDE,
    from: "export const DRIVING_FIGURES = Object.freeze(['rust', 'teal', 'elder', 'blue']);",
    to: "export const DRIVING_FIGURES = Object.freeze(['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl']);",
  },
  {
    name: 'the whole seated driver is cut at the hip like the stand-in, so his boots and the goad are clipped away',
    file: 'public/motion.js', tests: RIDE,
    from: '    const driver = delivered > 0 ? seated : sitting(wagon * SEAT.wagonSeat, dx);',
    to: '    const driver = sitting(wagon * SEAT.wagonSeat, dx);',
  },
  {
    name: 'a driver is mirrored for west, though every heading of him is painted',
    file: 'public/motion.js', tests: RIDE,
    from: "  if (seat === 'wagon' && DRIVING_FIGURES.includes(figure)) return { id: `${figure}-wagon-driver-${facing}`, upright: true, seated: true };",
    to: "  if (seat === 'wagon' && DRIVING_FIGURES.includes(figure)) return { id: `${figure}-wagon-driver-${facing === 'w' ? 'e' : facing}`, seated: true };",
  },

  // ---- the mustang (wildlife-mustang) --------------------------------------------------------------------------------
  {
    name: 'the mustang is delivered and still not drawn, as it was the day the sheet landed',
    file: 'sim/hunting.mjs', tests: HUNT,
    from: "export const DRAWN_GAME = Object.freeze(['deer', 'turkey', 'mustang']);",
    to: "export const DRAWN_GAME = Object.freeze(['deer', 'turkey']);",
  },
  {
    name: 'the page has no mustang of its own, so a mustang hunt draws a deer where the words say a mustang',
    file: 'public/app.js', tests: LIBRARY,
    from: "    if (animated(ctx, alert ? 'mustang-alert' : 'mustang-graze', x, y, size, seed, { flip })) return;",
    to: "    if (animated(ctx, alert ? 'deer-alert' : 'deer-idle', x, y, size, seed, { flip })) return;",
  },

  // ---- the Yellow Stone under way (steamboat-steam, steamboat-laden) --------------------------------------------------
  {
    name: 'she goes back to the plank out at a bank, in the middle of the water, and the army-laden loop is drawn by nothing',
    file: 'public/app.js', tests: LIBRARY,
    from: "      boat = army.boat.state === 'crossing' ? 'steamboat-laden' : 'steamboat-cotton-moored';",
    to: "      boat = army.boat.state === 'crossing' ? 'steamboat-gangplank' : 'steamboat-cotton-moored';",
  },
  {
    name: 'the empty-deck loop is inferred for the cotton days, when she is lying at Groce\'s landing and not under way',
    file: 'public/app.js', tests: LIBRARY,
    from: "      boat = army.boat.state === 'crossing' ? 'steamboat-laden' : 'steamboat-cotton-moored';",
    to: "      boat = army.boat.state === 'crossing' ? 'steamboat-laden' : 'steamboat-steam';",
  },

  // ---- the Alamo's south faces (alamo-face-strips) --------------------------------------------------------------------
  {
    name: 'every stone face goes back to the wall module cut and repeated, and the painted limestone is drawn by nothing',
    file: 'public/alamo-faces.js', tests: ALAMO,
    from: "  limestone: 'alamo-face-limestone',",
    to: "  limestone: 'alamo-wall-intact',",
  },
  {
    name: 'a face is bound to a strip the library does not have',
    file: 'public/alamo-faces.js', tests: ALAMO,
    from: "  rooms: 'alamo-face-rooms',",
    to: "  rooms: 'alamo-face-room-range',",
  },
  {
    name: 'every range is drawn one storey, so the two-storey convento end is drawn by nothing',
    file: 'public/alamo-faces.js', tests: ALAMO,
    from: 'export const blockFace = block => (block.height >= STOREYS ? ALAMO_FACES.convento : ALAMO_FACES.rooms);',
    to: 'export const blockFace = block => (block.height >= 0 ? ALAMO_FACES.rooms : ALAMO_FACES.convento);',
  },
  {
    name: 'the roofless church wears the plain limestone, and its own unfinished wall is drawn by nothing',
    file: 'public/alamo-faces.js', tests: ALAMO,
    from: "export const wallFace = wall => (wall.material === 'timber' ? ALAMO_FACES.palisade : wall.kind === 'church' ? ALAMO_FACES.church : ALAMO_FACES.limestone);",
    to: "export const wallFace = wall => (wall.material === 'timber' ? ALAMO_FACES.palisade : ALAMO_FACES.limestone);",
  },
  {
    name: 'the massing stops saying which runs are the church\'s shell, so nothing can wear the church wall',
    file: 'public/alamo-layout.js', tests: ALAMO,
    from: "thickness:w.thickness,height:w.heightFeet,material:w.material,kind:'church'});run=null;};",
    to: 'thickness:w.thickness,height:w.heightFeet,material:w.material});run=null;};',
  },
  {
    name: 'the gate is a dark opening again, and the painted passage is drawn by nothing',
    file: 'public/bexar-art.js', tests: ALAMO,
    from: '    if(close)gateArt(ctx,a,b,sw,se,r);}',
    to: '    }',
  },
  {
    name: 'a roofed range is no longer asked which front it wears, so every one of them is a room range',
    file: 'public/bexar-art.js', tests: ALAMO,
    from: '  if(close)faceArt(ctx,face(blockFace(block)),sw,se,r);',
    to: '  if(close)faceArt(ctx,face(ALAMO_FACES.rooms),sw,se,r);',
  },
  {
    name: 'the new module the page imports is not served, so every page in the class is a blank join form',
    file: 'server/app.mjs', tests: ['tests/asset-http.test.mjs'],
    from: "  ['/alamo-faces.js', ['../public/alamo-faces.js', 'text/javascript']],\n",
    to: '',
  },
  {
    name: 'what the compound actually laid stops being recorded, so the browser proof reads an empty list and passes',
    file: 'public/bexar-art.js', tests: ALAMO,
    from: "    if(drawSprite(ctx,art.sprite,0,0,frame.logicalHeight||frame.h,{anchor:[0,0]}))facesDrawn.add(art.sprite);ctx.restore();",
    to: '    drawSprite(ctx,art.sprite,0,0,frame.logicalHeight||frame.h,{anchor:[0,0]});ctx.restore();',
  },
];

const asFileEndings = (text, eol) => (eol === '\r\n' ? text.replace(/\r?\n/g, '\r\n') : text.replace(/\r\n/g, '\n'));
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = files => { const result = spawnSync(process.execPath, ['--test', ...files], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const everyFile = [...new Set(INJECTIONS.flatMap(injection => injection.tests))];
const clean = run(everyFile);
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const from = asFileEndings(injection.from, eol), to = asFileEndings(injection.to, eol);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(from, to));
  let failed;
  try { failed = run(injection.tests); } finally { writeFileSync(injection.file, original); }
  record.push({ name: injection.name, file: injection.file, tests: injection.tests, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run(everyFile).length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/mounted-wiring-injections.json', `${JSON.stringify({ record: 'mounted-wiring-injections', date: new Date().toISOString().slice(0, 10), delivery: '2026-09-21 (mounted family, wagon drivers, mustang and Yellow Stone under way, Alamo face strips)', injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(entry => entry.failed.length).length} of ${record.length} caught; wrote docs/evidence/mounted-wiring-injections.json`);
