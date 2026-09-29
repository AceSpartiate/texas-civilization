// A contact print of built Claude sheets on the map's grass, for looking at while drawing (not evidence):
// node scripts/claude-art/battle-kit/contact.mjs <out.png> <sheet> [sheet ...]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { withBrowser, shoot } from '../kit/browser.mjs';

const ROOT = fileURLToPath(new URL('../../../public/assets/claude-standins/', import.meta.url));
const atlas = JSON.parse(readFileSync(ROOT + 'atlas.json', 'utf8'));
const [out, ...names] = process.argv.slice(2);
const width = 1900;
let y = 8, html = '';
for (const name of names) {
  const s = atlas.sheets[name];
  if (!s) { console.error(`no sheet ${name}`); continue; }
  const k = Math.min(1, (width - 16) / s.width, 700 / s.height);
  html += `<img src="data:image/png;base64,${readFileSync(ROOT + name + '.png').toString('base64')}" style="position:absolute;left:8px;top:${y}px;width:${s.width * k}px;outline:1px solid rgba(0,0,0,.3)">`;
  y += s.height * k + 10;
}
await withBrowser(async page => { await shoot(page, `<body style="margin:0;background:#7f9f58">${html}</body>`, width, Math.ceil(y), out, { transparent: false }); });
console.log(out);
