// Every command the page sends carries an id the server uses to drop a repeated click (server/app.mjs, POST
// /api/command). The server refuses any id outside its pattern with "Command ID required", and the page shows that as the
// whole answer: nothing happens. On 2026-09-23 a student's "Build here" on the house placement sent
// `house-${Date.now()}-${Math.random()}` - Math.random() prints "0.123...", the "." is outside the pattern, and no house
// could ever be placed. The same line spread the draft command *after* the id, so a draft carrying an `id` of its own
// would have replaced it. This holds every id the page makes against the server's own pattern, read from the server so
// the two cannot drift, on a LAN page too (plain http is not a secure context, so crypto.randomUUID is missing there and
// every fallback is what actually runs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const server = readFileSync(new URL('../server/app.mjs', import.meta.url), 'utf8');

function serverPattern() {
  const line = server.split(/\r?\n/).find(text => text.includes("'Command ID required'"));
  assert.ok(line, 'the server line that refuses a command id was not found, so this test checks nothing');
  const literal = line.match(/!\/(\^[^/]+\$)\/\.test\(input\.id\)/);
  assert.ok(literal, 'the server command-id pattern was not found on its line');
  return new RegExp(literal[1]);
}

// An id the page makes: an optional crypto.randomUUID?.() || before a template literal.
const ID_EXPRESSION = /\bid:\s*((?:crypto\.randomUUID\?\.\(\)\s*\|\|\s*)?`[^`]*`)/g;
const MADE_ID_LINE = /\bid:[^,]*(?:Date\.now|Math\.random|randomUUID)/;

test('every command id the page makes matches the server pattern, with or without crypto.randomUUID', () => {
  const pattern = serverPattern();
  // Sprite and animal ids are template literals too; a made id is one that reaches for the clock or chance.
  const expressions = [...page.matchAll(ID_EXPRESSION)].map(match => match[1]).filter(text => /Date\.now|Math\.random|randomUUID/.test(text));
  const madeLines = page.split(/\r?\n/).filter(line => MADE_ID_LINE.test(line)).length;
  assert.ok(expressions.length > 10, 'too few command ids were found, so the extractor is broken');
  assert.equal(expressions.length, madeLines, 'an id is made in a form this test cannot read; extend ID_EXPRESSION');
  const bad = [];
  for (const expression of new Set(expressions)) {
    const make = new Function('crypto', `return ${expression};`);
    for (const crypto of [{}, globalThis.crypto]) {
      for (let i = 0; i < 200; i += 1) {
        const id = make(crypto);
        if (typeof id !== 'string' || !pattern.test(id)) { bad.push(`${expression} -> ${JSON.stringify(id)}`); break; }
      }
    }
  }
  assert.deepEqual(bad, [], `these ids would be refused with "Command ID required" (server pattern ${pattern})`);
});

test('no command spreads anything after its id, so nothing it carries can replace the id', () => {
  const clobbering = page.split(/\r?\n/).map((line, i) => [i + 1, line])
    .filter(([, line]) => /\bid:\s*(?:crypto\.randomUUID\?\.\(\)\s*\|\|\s*)?`[^`]*`\s*,\s*\.\.\./.test(line));
  assert.deepEqual(clobbering.map(([at, line]) => `${at}: ${line.trim()}`), [], 'the id must come after the spread');
});
