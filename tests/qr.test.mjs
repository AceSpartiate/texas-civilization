// The join address's QR code (triage 1.8, 2026-09-29; public/qr.js), made on this computer with no library and no network.
//
// A QR code that is wrong in one module may still look like a QR code, so this holds the encoder bit for bit to codes made by an
// independent one (tests/fixtures/qr-reference.json: qrcode-generator 2.0.4 by Kazuhiko Arase, MIT, level M, byte mode - its
// output only, with the mask it chose), across versions 1 to 13 and a UTF-8 text. When it was written every code this encoder
// makes for those texts was also read back by an independent decoder (jsQR 1.4.0, Apache-2.0, run once outside this repository;
// docs/REFERENCE_ARCHITECTURES.md §9). The mask this encoder chooses by itself may differ from that encoder's - any of the eight
// makes a code that reads - so the fixtures force the same one, and the choice is checked for what the standard asks of it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { qrMatrix, qrSvg } from '../public/qr.js';

const reference = JSON.parse(readFileSync(new URL('./fixtures/qr-reference.json', import.meta.url), 'utf8'));
const rows = matrix => matrix.map(row => row.map(dark => (dark ? '1' : '0')).join(''));
/** The level and mask a code says it has, read from its first copy of the format bits. */
function formatOf(matrix) {
  const bits = [];
  const at = (x, y) => (matrix[y][x] ? 1 : 0);
  for (let i = 0; i <= 5; i++) bits[i] = at(8, i);
  bits[6] = at(8, 7); bits[7] = at(8, 8); bits[8] = at(7, 8);
  for (let i = 9; i < 15; i++) bits[i] = at(14 - i, 8);
  const value = bits.reduce((sum, bit, i) => sum | (bit << i), 0) ^ 0x5412;
  return { level: ['M', 'L', 'H', 'Q'][(value >> 13) & 3], mask: (value >> 10) & 7 };
}

test('every reference code is made bit for bit: the data, the error correction, the blocks, the patterns and the version', () => {
  assert.ok(reference.codes.length >= 8, 'the fixtures are there');
  for (const code of reference.codes) {
    const made = rows(qrMatrix(code.text, { mask: code.mask }));
    assert.equal(made.length, code.rows.length, `${code.text.slice(0, 30)}: the version (${(code.rows.length - 17) / 4})`);
    assert.deepEqual(made, code.rows, `${code.text.slice(0, 30)}: version ${(code.rows.length - 17) / 4}, mask ${code.mask}`);
  }
});

test('the mask chosen by itself is one of the eight, written in the format bits, at level M, and the rest of the code agrees with it', () => {
  for (const code of reference.codes) {
    const matrix = qrMatrix(code.text);
    const { level, mask } = formatOf(matrix);
    assert.equal(level, 'M');
    assert.ok(mask >= 0 && mask <= 7);
    assert.deepEqual(rows(matrix), rows(qrMatrix(code.text, { mask })), `${code.text.slice(0, 30)}: the code is the one its format says`);
  }
});

test('an address as the Host shows it is a small code, and the SVG is the matrix with its quiet zone and nothing from outside as markup', () => {
  const address = 'http://192.168.4.38:3000/?code=6744EF';
  const matrix = qrMatrix(address);
  assert.equal(matrix.length, 29, 'version 3: 29 modules a side, which a Chromebook camera reads from across a desk');
  const svg = qrSvg(address, { label: 'Join <here> & "now"' });
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 37 37" role="img" aria-label="Join &lt;here&gt; &amp; &quot;now&quot;"/);
  const squares = svg.match(/M\d+ \d+h1v1h-1z/g);
  assert.equal(squares.length, matrix.flat().filter(Boolean).length, 'one square a dark module');
  assert.ok(squares.every(square => { const [, x, y] = square.match(/M(\d+) (\d+)/).map(Number); return matrix[y - 4][x - 4]; }), 'each where its module is, four modules in');
  assert.throws(() => qrMatrix('x'.repeat(3000)), /Too long/);
});
