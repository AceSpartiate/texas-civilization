// The regressions `npm run test:overlap` guards, put back one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed").
//
// Owner, 2026-09-28: "Check for UI elements that block others. Move them somewhere else." Each injection undoes one of the
// moves in the file it lives in - puts a piece back where it stood on something else - runs the proof, records what failed
// and whether it was the check written for that fault, and puts the file back byte for byte. The first is the plainest
// overlap there is: "How it ended" dropped back onto the map's buttons.
//
// Run: node scripts/overlap-injections.mjs  -> docs/evidence/overlap-injections.json
// Wants PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE, as the proof does. A clean run, one run for each injection, and a clean run
// after: about seven minutes each on this computer.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PROOF = 'scripts/overlap-browser-proof.mjs';
const OUT = 'test-results/overlap-injection.json';
const INJECTIONS = [
  {
    name: '"How it ended" dropped back onto the map\'s buttons',
    file: 'public/style.css',
    from: '#ending-open{position:absolute;right:0;bottom:calc(100% + 8px);z-index:1;white-space:nowrap}',
    to: '#ending-open{position:absolute;right:0;bottom:0;z-index:1;white-space:nowrap}',
    expect: /map buttons and ending button share/,
  },
  {
    name: 'the meeting back in the bottom middle, over the person the rider is talking to',
    file: 'public/style.css',
    from: '  #encounter{left:auto;right:12px;transform:none;width:min(520px,calc(50% - 48px))}\n',
    to: '',
    expect: /the person being spoken to is \d+% under meeting|meeting and site chooser share/,
  },
  {
    name: 'the card no longer stands aside while the meeting or the call\'s menu is open',
    file: 'public/style.css',
    from: 'body:has(#encounter:not([hidden])) #selection,body:has(#call-menu:not([hidden])) #selection{display:none}\n',
    to: '',
    expect: /person card and (meeting|call menu) share|in person card is under (meeting|call menu)/,
  },
  {
    name: 'the card is not held to the room between the strip and the map\'s buttons (no height cap)',
    file: 'public/app.js',
    from: "  if (cap !== placement.cap) { panel.style.maxHeight = cap; placement.cap = cap; }\n",
    to: '',
    // Uncapped, the card runs off a short window's foot, or down over whatever stands below it: the map's buttons or the bar.
    expect: /off the screen: person card|(journal button|map buttons|ability bar) and person card share/,
  },
  {
    name: 'the lines the page says back in the middle of the top, under the guided start\'s strip',
    file: 'public/style.css',
    from: '#hud-left #error,#hud-left #save-fault,#hud-left #lifecycle,#hud-left #host-notice{position:static;',
    to: '#hud-left #error,#hud-left #save-fault,#hud-left #lifecycle,#hud-left #host-notice{position:absolute;',
    expect: /error line/,
  },
  {
    name: 'the teacher\'s column unbounded again, running off the foot of the screen with Classes open',
    file: 'public/style.css',
    from: '  #hud-right:has(#host-controls:not([hidden])){max-height:calc(100% - 212px);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain}\n',
    to: '',
    expect: /off the screen: classes|classes and (map buttons|spotlight) share/,
  },
  {
    name: 'packing the wagon back over the family and the status lines',
    file: 'public/style.css',
    from: '  #wagon-load{left:auto;right:12px;top:64px;',
    to: '  #wagon-load{left:12px;right:auto;top:64px;',
    expect: /and wagon load share/,
  },
  {
    name: 'a speech bubble no longer slides out from under a panel',
    file: 'public/speech.js',
    from: '    const room = bounds.room?.(top, top + h);\n',
    to: '    const room = null;\n',
    expect: /bubble .* under/,
  },
];

const faultsOf = output => [...output.matchAll(/^FAULT (.+)$/gm)].map(match => match[1]);
const died = output => {
  const assertion = output.match(/AssertionError \[ERR_ASSERTION\]: ([^\n\r]+)/);
  const error = output.match(/^(?:Error|TypeError|TimeoutError|ReferenceError): ([^\n\r]+)/m);
  return assertion ? assertion[1].trim() : error ? `${error[1].trim()} (the proof died rather than caught it)` : null;
};
const run = () => {
  const result = spawnSync(process.execPath, [PROOF], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, OVERLAP_OUT: OUT, OVERLAP_SHOTS: 'test-results/overlap-injection' } });
  const output = `${result.stdout}${result.stderr}`;
  return { status: result.status, failed: died(output), faults: faultsOf(output), passed: /^PASS nothing on the screen/m.test(output) };
};

const clean = run();
if (!clean.passed) throw new Error(`The proof fails before any injection: ${clean.failed}\n${clean.faults.join('\n')}`);
console.log('clean: the proof passes');
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times, not once`);
  writeFileSync(injection.file, original.replace(from, to));
  let result;
  try { result = run(); } finally { writeFileSync(injection.file, original); }
  const own = result.faults.filter(fault => injection.expect.test(fault));
  record.push({ name: injection.name, file: injection.file, caught: !result.passed, byItsOwnCheck: own.length > 0, ownFaults: own, otherFaults: result.faults.filter(fault => !injection.expect.test(fault)), failed: result.failed });
  console.log(`${!result.passed ? (own.length ? 'caught' : 'caught, but not by its own check') : 'MISSED'}: ${injection.name}\n   -> ${own.join(' | ') || result.failed || 'nothing failed'}`);
}
const after = run();
if (!after.passed) throw new Error(`The proof fails after every file was put back: ${after.failed}`);
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/overlap-injections.json', `${JSON.stringify({
  record: 'overlap-injections',
  date: new Date().toISOString().slice(0, 10),
  proof: PROOF,
  note: 'Owner, 2026-09-28: "Check for UI elements that block others. Move them somewhere else." Each injection puts one moved piece back where it stood on something else; `byItsOwnCheck` is whether the fault the proof printed is the one written for it. Same computer, headless Chrome.',
  clean: 'passes',
  injections: record,
  after: 'passes',
}, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught && one.byItsOwnCheck).length} of ${record.length} caught by their own check; wrote docs/evidence/overlap-injections.json`);
